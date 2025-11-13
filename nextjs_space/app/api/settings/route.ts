import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const userId = (session.user as any)?.id;
    let settings = await prisma.settings.findUnique({ where: { user_id: userId } });

    if (!settings) {
      settings = await prisma.settings.create({ 
        data: { 
          id: uuidv4(),
          user_id: userId,
          updated_at: new Date()
        } 
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: "Erro ao buscar configurações" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const userId = (session.user as any)?.id;
    const body = await request.json();

    const settings = await prisma.settings.upsert({
      where: { user_id: userId },
      update: { ...body, updated_at: new Date() },
      create: { 
        id: uuidv4(),
        user_id: userId, 
        ...body,
        updated_at: new Date()
      },
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Error saving settings:", error);
    return NextResponse.json({ error: "Erro ao salvar configurações" }, { status: 500 });
  }
}
