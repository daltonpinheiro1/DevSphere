
import { getCache, setCache } from '../redis';

interface ViabilityResponse {
  viable: boolean;
  address?: {
    street: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  availablePlans?: Array<{
    type: 'INTERNET' | 'HEALTH_PLAN' | 'COMBO';
    name: string;
    price: number;
    description: string;
  }>;
  message?: string;
}

export class TIMApiService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    // Configurar credenciais da API TIM
    this.baseUrl = process.env.TIM_API_URL || 'https://api.tim.com.br/v1';
    this.apiKey = process.env.TIM_API_KEY || '';
  }

  async checkViability(
    cep: string,
    number: string
  ): Promise<ViabilityResponse> {
    const cacheKey = `viability:${cep}:${number}`;

    // Verifica cache primeiro (cache de 24 horas para viabilidade)
    const cached = await getCache<ViabilityResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // NOTA: Esta é uma implementação simulada
      // Em produção, você deve fazer a requisição real para a API da TIM
      
      // Exemplo de requisição:
      // const response = await fetch(`${this.baseUrl}/viability`, {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${this.apiKey}`,
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ cep, number }),
      // });
      //
      // const data = await response.json();

      // SIMULAÇÃO PARA DESENVOLVIMENTO
      const isViable = this.simulateViability(cep);

      const result: ViabilityResponse = isViable
        ? {
            viable: true,
            address: {
              street: 'Rua Exemplo',
              neighborhood: 'Centro',
              city: 'São Paulo',
              state: 'SP',
            },
            availablePlans: [
              {
                type: 'INTERNET',
                name: 'TIM Ultrafibra 500MB',
                price: 99.9,
                description: '500MB de velocidade + Wi-Fi grátis',
              },
              {
                type: 'INTERNET',
                name: 'TIM Ultrafibra 1GB',
                price: 149.9,
                description: '1GB de velocidade + Wi-Fi grátis',
              },
              {
                type: 'COMBO',
                name: 'TIM Ultrafibra 500MB + Saúde',
                price: 139.9,
                description: '500MB + Plano de Saúde Basic',
              },
              {
                type: 'COMBO',
                name: 'TIM Ultrafibra 1GB + Saúde Premium',
                price: 199.9,
                description: '1GB + Plano de Saúde Premium',
              },
            ],
            message: 'Ótima notícia! Temos cobertura na sua região! 🎉',
          }
        : {
            viable: false,
            message:
              'Infelizmente ainda não temos cobertura na sua região. Mas já estamos trabalhando para chegar até você! 🚧',
          };

      // Cacheia resultado por 24 horas
      await setCache(cacheKey, result, 86400);

      return result;
    } catch (error) {
      console.error('Erro ao verificar viabilidade TIM:', error);
      return {
        viable: false,
        message: 'Erro ao verificar viabilidade. Por favor, tente novamente.',
      };
    }
  }

  private simulateViability(cep: string): boolean {
    // Simulação: CEPs que começam com 0, 1, 2, 3 têm cobertura
    const firstDigit = parseInt(cep.charAt(0));
    return firstDigit >= 0 && firstDigit <= 6;
  }

  async searchAddressByCep(cep: string): Promise<any> {
    try {
      // Usa API pública ViaCEP como fallback
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();

      if (data.erro) {
        return null;
      }

      return {
        street: data.logradouro,
        neighborhood: data.bairro,
        city: data.localidade,
        state: data.uf,
      };
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      return null;
    }
  }
}

export const timApi = new TIMApiService();
