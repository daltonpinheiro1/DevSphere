import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface UserPreferencesProps {
  theme: string;
  language: string;
  notifications: boolean;
  chatbotName: string;
  welcomeMessage: string;
  onChange: (field: string, value: any) => void;
}

export function UserPreferences({ theme, language, notifications, chatbotName, welcomeMessage, onChange }: UserPreferencesProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-slate-200">Tema</Label>
        <Select value={theme} onValueChange={(v) => onChange("theme", v)}>
          <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="dark">Escuro</SelectItem>
            <SelectItem value="light">Claro</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-slate-200">Idioma</Label>
        <Select value={language} onValueChange={(v) => onChange("language", v)}>
          <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="pt-BR">Português (BR)</SelectItem>
            <SelectItem value="en">English</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-slate-200">Notificações</Label>
        <Switch checked={notifications} onCheckedChange={(v) => onChange("notifications", v)} />
      </div>
      <div className="space-y-2">
        <Label className="text-slate-200">Nome do Chatbot</Label>
        <Input value={chatbotName} onChange={(e) => onChange("chatbotName", e.target.value)} className="bg-slate-800/50 border-slate-700 text-white" />
      </div>
      <div className="space-y-2">
        <Label className="text-slate-200">Mensagem de Boas-vindas</Label>
        <Input value={welcomeMessage} onChange={(e) => onChange("welcomeMessage", e.target.value)} className="bg-slate-800/50 border-slate-700 text-white" />
      </div>
    </div>
  );
}
