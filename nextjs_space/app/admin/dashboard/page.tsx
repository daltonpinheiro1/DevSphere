"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { StatsCard } from "@/components/admin/stats-card";
import { ActivityChart } from "@/components/admin/activity-chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, MessageSquare, Clock, TrendingUp, Loader2 } from "lucide-react";

interface Stats {
  totalUsers: number;
  conversationsToday: number;
  totalMessages: number;
  avgResponseTime: string;
}

interface ActivityData {
  date: string;
  conversations: number;
  messages: number;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && (session?.user as any)?.role !== "ADMIN") {
      router.push("/chat");
      return;
    }

    if (status === "authenticated") {
      fetchDashboardData();
    }
  }, [status, session, router]);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, activityRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/activity"),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (activityRes.ok) {
        const activityData = await activityRes.json();
        setActivityData(activityData.activity);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 via-purple-950 to-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-purple-950 to-slate-950 p-4">
      <div className="max-w-7xl mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Dashboard Administrativo</h1>
            <p className="text-slate-400">Visão geral do sistema CENTER AI</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push("/admin/users")}
              className="border-blue-500/50 text-blue-300 hover:bg-blue-500/10"
            >
              Gerenciar Usuários
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/chat")}
              className="border-blue-500/50 text-blue-300 hover:bg-blue-500/10"
            >
              Ir para Chat
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <StatsCard
            title="Total de Usuários"
            value={stats?.totalUsers || 0}
            icon={Users}
            description="Usuários cadastrados"
          />
          <StatsCard
            title="Conversas Hoje"
            value={stats?.conversationsToday || 0}
            icon={MessageSquare}
            description="Novas conversas iniciadas"
          />
          <StatsCard
            title="Total de Mensagens"
            value={stats?.totalMessages || 0}
            icon={TrendingUp}
            description="Mensagens processadas"
          />
          <StatsCard
            title="Tempo Médio"
            value={stats?.avgResponseTime || "0s"}
            icon={Clock}
            description="Tempo de resposta"
          />
        </div>

        {/* Activity Chart */}
        <div className="mb-8">
          <ActivityChart data={activityData} />
        </div>

        {/* Recent Conversations */}
        <Card className="bg-slate-900/50 border-blue-500/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Conversas Recentes</CardTitle>
            <CardDescription className="text-slate-400">
              Últimas conversas do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-slate-400 text-center py-8">
              Funcionalidade em desenvolvimento
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
