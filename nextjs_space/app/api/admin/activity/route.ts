import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 403 }
      );
    }

    // Get activity data for the last 7 days
    const activity = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const conversations = await prisma.conversations.count({
        where: {
          created_at: {
            gte: date,
            lt: nextDate,
          },
        },
      });

      const messages = await prisma.messages.count({
        where: {
          timestamp: {
            gte: date,
            lt: nextDate,
          },
        },
      });

      activity.push({
        date: date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        conversations,
        messages,
      });
    }

    return NextResponse.json({ activity });
  } catch (error) {
    console.error("Error fetching activity:", error);
    return NextResponse.json(
      { error: "Erro ao buscar atividade" },
      { status: 500 }
    );
  }
}
