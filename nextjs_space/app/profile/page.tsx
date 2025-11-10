"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, User, Mail, Shield } from "lucide-react";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (session?.user?.name) {
      setName(session.user.name);
    }
  }, [status, session, router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`/api/users/${(session?.user as any)?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (response.ok) {
        setMessage("Perfil atualizado com sucesso!");
      } else {
        setMessage("Erro ao atualizar perfil");
      }
    } catch (err) {
      setMessage("Erro ao atualizar perfil");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 via-purple-950 to-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const userRole = (session?.user as any)?.role || "USER";
  const userAvatar = (session?.user as any)?.avatar;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-purple-950 to-slate-950 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push("/chat")}
            className="text-slate-300 hover:text-white"
          >
            ← Voltar ao Chat
          </Button>
        </div>

        <Card className="bg-slate-900/50 border-blue-500/20 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={userAvatar} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl">
                  {session?.user?.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl text-white">{session?.user?.name}</CardTitle>
                <CardDescription className="text-slate-400">{session?.user?.email}</CardDescription>
                <Badge className="mt-2 bg-blue-500/20 text-blue-300 border-blue-500/50">
                  {userRole}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {message && (
              <Alert className="bg-blue-500/10 border-blue-500/50">
                <AlertDescription className="text-blue-300">{message}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-200 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nome
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-slate-800/50 border-slate-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  type="email"
                  value={session?.user?.email || ""}
                  disabled
                  className="bg-slate-800/30 border-slate-700 text-slate-400"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Função
                </Label>
                <Input
                  type="text"
                  value={userRole}
                  disabled
                  className="bg-slate-800/30 border-slate-700 text-slate-400"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar alterações"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
