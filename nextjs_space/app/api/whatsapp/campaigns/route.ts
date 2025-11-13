
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

/**
 * GET /api/whatsapp/campaigns
 * Lista todas as campanhas
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const company_id = searchParams.get('company_id');
    const status = searchParams.get('status');

    const where: any = {};
    if (company_id) where.company_id = company_id;
    if (status) where.status = status;

    const campaigns = await prisma.campaigns.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        whatsapp_instances: {
          select: {
            id: true,
            name: true,
            phone_number: true,
            status: true,
          },
        },
        message_templates: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: { campaign_messages: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      campaigns,
    });
  } catch (error) {
    console.error('Erro ao listar campanhas:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao listar campanhas' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/whatsapp/campaigns
 * Cria uma nova campanha
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      instanceId,
      templateId,
      contacts,
      intervalMin,
      intervalMax,
      riskLevel,
      scheduledAt,
      company_id,
      created_by,
    } = body;

    if (!name || !instanceId || !contacts || contacts.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nome, instância e contatos são obrigatórios',
        },
        { status: 400 }
      );
    }

    // Buscar template se fornecido
    let template = null;
    if (templateId) {
      template = await prisma.message_templates.findUnique({
        where: { id: templateId },
      });
    }

    // Criar campanha
    const campaign = await prisma.campaigns.create({
      data: {
        id: uuidv4(),
        name,
        instanceId,
        templateId,
        status: scheduledAt ? 'scheduled' : 'draft',
        total_contacts: contacts.length,
        interval_min: intervalMin || 3,
        interval_max: intervalMax || 10,
        risk_level: riskLevel || 'medium',
        scheduled_at: scheduledAt ? new Date(scheduledAt) : null,
        company_id,
        created_by,
      },
    });

    // Criar mensagens da campanha
    const campaignMessages = [];

    for (const contactData of contacts) {
      // Buscar ou criar contato
      const cleanedNumber = contactData.phone_number.replace(/\D/g, '');
      const formattedNumber = cleanedNumber.startsWith('55')
        ? cleanedNumber
        : `55${cleanedNumber}`;

      const contact = await prisma.contacts.upsert({
        where: {
          phone_number_company_id: {
            phone_number: formattedNumber,
            company_id: company_id || null,
          },
        },
        update: {},
        create: {
          phone_number: formattedNumber,
          name: contactData.name,
          company_id,
        },
      });

      // Processar mensagem (aplicar variáveis do template)
      let messageContent = contactData.message;

      if (template && contactData.variables) {
        messageContent = template.content;
        for (const [key, value] of Object.entries(contactData.variables)) {
          messageContent = messageContent.replace(
            new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
            value as string
          );
        }
      }

      campaignMessages.push({
        campaign_id: campaign.id,
        contact_id: contact.id,
        messageContent,
        status: 'pending',
      });
    }

    // Criar todas as mensagens em lote
    await prisma.campaign_messages.createMany({
      data: campaignMessages,
    });

    return NextResponse.json({
      success: true,
      campaign,
      message: 'Campanha criada com sucesso',
    });
  } catch (error) {
    console.error('Erro ao criar campanha:', error);
    return NextResponse.json(
      { success: false, error: 'Erro ao criar campanha' },
      { status: 500 }
    );
  }
}
