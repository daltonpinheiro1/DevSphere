
import { prisma } from '../db';
import { baileysService } from './baileys-service';
import { downloadFile } from '../s3';

/**
 * Gerenciador de campanhas de envio em massa
 */
class CampaignManager {
  private runningCampaigns: Set<string> = new Set();

  /**
   * Inicia uma campanha
   */
  async startCampaign(campaignId: string): Promise<void> {
    try {
      // Verificar se campanha já está rodando
      if (this.runningCampaigns.has(campaignId)) {
        throw new Error('Campanha já está em execução');
      }

      // Buscar campanha
      const campaign = await prisma.campaigns.findUnique({
        where: { id: campaignId },
        include: {
          whatsapp_instances: true,
          message_templates: true,
          campaign_messages: {
            where: { status: 'pending' },
            include: { contacts: true },
          },
        },
      });

      if (!campaign) {
        throw new Error('Campanha não encontrada');
      }

      if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
        throw new Error('Campanha não pode ser iniciada');
      }

      // Verificar se instância está conectada
      if (!baileysService.isInstanceConnected(campaign.instance_id)) {
        throw new Error('Instância WhatsApp não está conectada');
      }

      // Marcar campanha como rodando
      this.runningCampaigns.add(campaignId);

      // Atualizar status
      await prisma.campaigns.update({
        where: { id: campaignId },
        data: {
          status: 'running',
          started_at: new Date(),
        },
      });

      // Executar envios em background
      this.executeCampaign(campaignId).catch((error) => {
        console.error(`Erro na execução da campanha ${campaignId}:`, error);
      });
    } catch (error) {
      console.error('Erro ao iniciar campanha:', error);
      throw error;
    }
  }

  /**
   * Executa a campanha (envio em massa)
   */
  private async executeCampaign(campaignId: string): Promise<void> {
    try {
      const campaign = await prisma.campaigns.findUnique({
        where: { id: campaignId },
        include: {
          whatsapp_instances: true,
          message_templates: true,
          campaign_messages: {
            where: { status: 'pending' },
            include: { contacts: true },
          },
        },
      });

      if (!campaign) {
        throw new Error('Campanha não encontrada');
      }

      const pendingMessages = campaign.campaign_messages;

      for (const campaignMessage of pendingMessages) {
        try {
          // Verificar se campanha foi pausada/cancelada
          const currentCampaign = await prisma.campaigns.findUnique({
            where: { id: campaignId },
            select: { status: true },
          });

          if (
            currentCampaign?.status === 'paused' ||
            currentCampaign?.status === 'cancelled'
          ) {
            console.log(`Campanha ${campaignId} foi pausada/cancelada`);
            break;
          }

          // Gerar URL assinada se houver mídia
          let mediaUrl = undefined;
          if ((campaign as any).message_templates?.media_url) {
            mediaUrl = await downloadFile((campaign as any).message_templates.media_url);
          }

          // Enviar mensagem (com mídia se disponível)
          const success = await baileysService.sendMessage({
            instance_id: campaign.instance_id,
            to: campaignMessage.contacts.phone_number,
            message: campaignMessage.message_content,
            mediaUrl: mediaUrl,
          });

          if (success) {
            // Atualizar status da mensagem
            await prisma.campaign_messages.update({
              where: { id: campaignMessage.id },
              data: {
                status: 'sent',
                sent_at: new Date(),
              },
            });

            // Atualizar contador da campanha
            await prisma.campaigns.update({
              where: { id: campaignId },
              data: {
                sent_count: { increment: 1 },
              },
            });
          } else {
            // Marcar como falha
            await prisma.campaign_messages.update({
              where: { id: campaignMessage.id },
              data: {
                status: 'failed',
                error_message: 'Erro ao enviar mensagem',
              },
            });

            await prisma.campaigns.update({
              where: { id: campaignId },
              data: {
                failed_count: { increment: 1 },
              },
            });
          }

          // Intervalo entre envios
          const delay = this.getRandomDelay(
            campaign.interval_min,
            campaign.interval_max,
            campaign.riskLevel
          );
          await this.sleep(delay * 1000);
        } catch (error) {
          console.error(
            `Erro ao enviar mensagem ${campaignMessage.id}:`,
            error
          );

          // Marcar como falha
          await prisma.campaign_messages.update({
            where: { id: campaignMessage.id },
            data: {
              status: 'failed',
              error_message: String(error),
            },
          });

          await prisma.campaigns.update({
            where: { id: campaignId },
            data: {
              failed_count: { increment: 1 },
            },
          });
        }
      }

      // Finalizar campanha
      await prisma.campaigns.update({
        where: { id: campaignId },
        data: {
          status: 'completed',
          completed_at: new Date(),
        },
      });

      this.runningCampaigns.delete(campaignId);
      console.log(`Campanha ${campaignId} finalizada com sucesso`);
    } catch (error) {
      console.error('Erro ao executar campanha:', error);

      // Marcar campanha com erro
      await prisma.campaigns.update({
        where: { id: campaignId },
        data: { status: 'cancelled' },
      });

      this.runningCampaigns.delete(campaignId);
      throw error;
    }
  }

  /**
   * Pausa uma campanha
   */
  async pauseCampaign(campaignId: string): Promise<void> {
    await prisma.campaigns.update({
      where: { id: campaignId },
      data: { status: 'paused' },
    });
  }

  /**
   * Cancela uma campanha
   */
  async cancelCampaign(campaignId: string): Promise<void> {
    await prisma.campaigns.update({
      where: { id: campaignId },
      data: { status: 'cancelled' },
    });

    this.runningCampaigns.delete(campaignId);
  }

  /**
   * Calcula delay aleatório baseado no nível de risco
   */
  private getRandomDelay(
    min: number,
    max: number,
    risk_level: string
  ): number {
    // Ajustar intervalos baseado no risco
    let adjustedMin = min;
    let adjustedMax = max;

    switch (risk_level) {
      case 'low':
        adjustedMin = Math.max(min, 10); // Mínimo 10s
        adjustedMax = Math.max(max, 30); // Mínimo 30s
        break;
      case 'medium':
        adjustedMin = Math.max(min, 5); // Mínimo 5s
        adjustedMax = Math.max(max, 15); // Mínimo 15s
        break;
      case 'high':
        adjustedMin = Math.max(min, 2); // Mínimo 2s
        adjustedMax = Math.max(max, 8); // Mínimo 8s
        break;
    }

    return (
      Math.floor(Math.random() * (adjustedMax - adjustedMin + 1)) + adjustedMin
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Verifica se campanha está rodando
   */
  isCampaignRunning(campaignId: string): boolean {
    return this.runningCampaigns.has(campaignId);
  }
}

export const campaignManager = new CampaignManager();
