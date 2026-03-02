"use client";

import { useState } from "react";
import { generateWhatsappMessage, type GenerateWhatsappMessageInput } from "@/ai/flows/generate-whatsapp-message";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Sparkles, Copy, Send, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminMessages() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState("");
  const [formData, setFormData] = useState<GenerateWhatsappMessageInput>({
    messageType: 'confirmation',
    salonName: 'AgendaFácil Pro Studio',
    clientName: '',
    serviceDetails: '',
    appointmentDateTime: '',
    offerDetails: '',
    tone: 'friendly'
  });

  const handleGenerate = async () => {
    if (!formData.clientName) {
      toast({ title: "Erro", description: "Nome do cliente é obrigatório.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const result = await generateWhatsappMessage(formData);
      setGeneratedMessage(result.message);
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao gerar mensagem.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedMessage);
    toast({ title: "Sucesso", description: "Mensagem copiada!" });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Assistente de Mensagens AI</h1>
        <p className="text-muted-foreground">Use IA para criar mensagens perfeitas para seus clientes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              Configurar Mensagem
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo de Mensagem</Label>
              <Select 
                onValueChange={(v: any) => setFormData({...formData, messageType: v})}
                defaultValue={formData.messageType}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmation">Confirmação de Agendamento</SelectItem>
                  <SelectItem value="reminder24h">Lembrete 24h</SelectItem>
                  <SelectItem value="reminder3h">Lembrete 3h</SelectItem>
                  <SelectItem value="post_service">Pós-Atendimento (Feedback)</SelectItem>
                  <SelectItem value="offer">Oferta Especial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome do Cliente</Label>
                <Input 
                  placeholder="Ex: João Silva" 
                  value={formData.clientName}
                  onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Tom de Voz</Label>
                <Select 
                  onValueChange={(v: any) => setFormData({...formData, tone: v})}
                  defaultValue={formData.tone}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="friendly">Amigável</SelectItem>
                    <SelectItem value="professional">Profissional</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="playful">Divertido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.messageType !== 'offer' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Serviço(s)</Label>
                  <Input 
                    placeholder="Ex: Corte + Barba" 
                    value={formData.serviceDetails}
                    onChange={(e) => setFormData({...formData, serviceDetails: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data/Hora</Label>
                  <Input 
                    placeholder="20/05 às 14:00" 
                    value={formData.appointmentDateTime}
                    onChange={(e) => setFormData({...formData, appointmentDateTime: e.target.value})}
                  />
                </div>
              </div>
            )}

            {formData.messageType === 'offer' && (
              <div className="space-y-2">
                <Label>Detalhes da Oferta</Label>
                <Textarea 
                  placeholder="Ex: 20% de desconto no combo corte e barba este mês!" 
                  value={formData.offerDetails}
                  onChange={(e) => setFormData({...formData, offerDetails: e.target.value})}
                />
              </div>
            )}

            <Button className="w-full gap-2 mt-4" onClick={handleGenerate} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Gerar Mensagem com IA
            </Button>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Resultado
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-4">
            <Textarea 
              className="flex-1 min-h-[300px] resize-none p-4 font-body leading-relaxed"
              placeholder="A mensagem gerada aparecerá aqui..."
              value={generatedMessage}
              readOnly
            />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 gap-2" onClick={copyToClipboard} disabled={!generatedMessage}>
                <Copy className="w-4 h-4" />
                Copiar
              </Button>
              <Button className="flex-1 gap-2 bg-green-600 hover:bg-green-700" disabled={!generatedMessage}>
                <Send className="w-4 h-4" />
                Enviar WhatsApp
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { Settings as SettingsIcon } from "lucide-react";
