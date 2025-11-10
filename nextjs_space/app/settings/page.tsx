"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AIConfig } from "@/components/settings/ai-config";
import { UserPreferences } from "@/components/settings/user-preferences";
import { Loader2 } from "lucide-react";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") fetchSettings();
  }, [status, router]);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setSettings({ ...settings, [field]: value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
    } catch (error) {
      console.error("Error saving settings:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 via-purple-950 to-slate-950"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-purple-950 to-slate-950 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <Button variant="ghost" onClick={() => router.push("/chat")} className="mb-6 text-slate-300">← Voltar</Button>
        <Card className="bg-slate-900/50 border-blue-500/20">
          <CardHeader><CardTitle className="text-white">Configurações</CardTitle></CardHeader>
          <CardContent>
            <Tabs defaultValue="ai" className="w-full">
              <TabsList className="bg-slate-800/50"><TabsTrigger value="ai">IA</TabsTrigger><TabsTrigger value="preferences">Preferências</TabsTrigger></TabsList>
              <TabsContent value="ai" className="mt-4"><AIConfig {...settings} onChange={handleChange} /></TabsContent>
              <TabsContent value="preferences" className="mt-4"><UserPreferences {...settings} onChange={handleChange} /></TabsContent>
            </Tabs>
            <Button onClick={handleSave} disabled={saving} className="mt-6 w-full bg-gradient-to-r from-blue-600 to-purple-600">{saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</> : "Salvar Configurações"}</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
