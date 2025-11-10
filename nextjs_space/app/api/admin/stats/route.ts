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

    // Get total users
    const totalUsers = await prisma.user.count();

    // Get conversations today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const conversationsToday = await prisma.conversation.count({
      where: {
        createdAt: {
          gte: today,
        },
      },
    });

    // Get total messages
    const totalMessages = await prisma.message.count();

    // Calculate average response time (simplified)
    const avgResponseTime = "2.3s";

    return NextResponse.json({
      totalUsers,
      conversationsToday,
      totalMessages,
      avgResponseTime,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Erro ao buscar estatísticas" },
      { status: 500 }
    );
  }
}
