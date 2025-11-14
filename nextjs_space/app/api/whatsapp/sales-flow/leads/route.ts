
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const instance_id = searchParams.get('instance_id');
    const stage = searchParams.get('stage');

    const where: any = {};

    if (instance_id) {
      where.instance_id = instance_id;
    }

    if (stage) {
      where.flow_stage = stage;
    }

    const leads = await prisma.tim_sales_leads.findMany({
      where,
      orderBy: {
        created_at: 'desc',
      },
      take: 100,
    });

    // Estatísticas
    const stats = {
      total: leads.length,
      active: leads.filter((l) => !['completed', 'cancelled'].includes(l.flow_stage))
        .length,
      completed: leads.filter((l) => l.flow_stage === 'completed').length,
      cancelled: leads.filter((l) => l.flow_stage === 'cancelled').length,
      authorized: leads.filter((l) => l.authorization_given).length,
    };

    return NextResponse.json({
      leads,
      stats,
    });
  } catch (error) {
    console.error('Erro ao buscar leads:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar leads' },
      { status: 500 }
    );
  }
}
