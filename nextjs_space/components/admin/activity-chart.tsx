"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface ActivityChartProps {
  data: Array<{
    date: string;
    conversations: number;
    messages: number;
  }>;
}

export function ActivityChart({ data }: ActivityChartProps) {
  return (
    <Card className="bg-slate-900/50 border-blue-500/20 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white">Atividade dos últimos 7 dias</CardTitle>
        <CardDescription className="text-slate-400">
          Conversas e mensagens por dia
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis 
              dataKey="date" 
              stroke="#94a3b8"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#94a3b8"
              style={{ fontSize: '12px' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: '1px solid #3b82f6',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="conversations" 
              stroke="#3b82f6" 
              strokeWidth={2}
              name="Conversas"
            />
            <Line 
              type="monotone" 
              dataKey="messages" 
              stroke="#8b5cf6" 
              strokeWidth={2}
              name="Mensagens"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
