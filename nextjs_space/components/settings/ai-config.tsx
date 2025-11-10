import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AIConfigProps {
  aiModel: string;
  aiTemperature: number;
  maxTokens: number;
  systemPrompt: string;
  onChange: (field: string, value: any) => void;
}

export function AIConfig({ aiModel, aiTemperature, maxTokens, systemPrompt, onChange }: AIConfigProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-slate-200">Modelo de IA</Label>
        <Select value={aiModel} onValueChange={(v) => onChange("aiModel", v)}>
          <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="gpt-4">GPT-4</SelectItem>
            <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-slate-200">Temperatura ({aiTemperature})</Label>
        <Input type="number" step="0.1" min="0" max="2" value={aiTemperature} onChange={(e) => onChange("aiTemperature", parseFloat(e.target.value))} className="bg-slate-800/50 border-slate-700 text-white" />
      </div>
      <div className="space-y-2">
        <Label className="text-slate-200">Max Tokens</Label>
        <Input type="number" value={maxTokens} onChange={(e) => onChange("maxTokens", parseInt(e.target.value))} className="bg-slate-800/50 border-slate-700 text-white" />
      </div>
      <div className="space-y-2">
        <Label className="text-slate-200">System Prompt</Label>
        <Textarea value={systemPrompt || ""} onChange={(e) => onChange("systemPrompt", e.target.value)} className="bg-slate-800/50 border-slate-700 text-white min-h-[100px]" />
      </div>
    </div>
  );
}
