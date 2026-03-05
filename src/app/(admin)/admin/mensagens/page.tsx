"use client";

import { useState, useMemo } from "react";
import { generateWhatsappMessage, type GenerateWhatsappMessageInput } from "@/ai/flows/generate-whatsapp-message";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Sparkles, Copy, Send, Loader2, Settings, Calendar, User, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AdminMessages() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
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

  // Queries para buscar dados reais
  const appointmentsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return collection(db, "empresas", user.uid, "agendamentos");
  }, [db, user?.uid]);

  const servicesQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return collection(db, "empresas", user.uid, "servicos");
  }, [db, user?.uid]);

  const { data: appointments, isLoading: loadingApts } = useCollection(appointmentsQuery);
  const { data: services } = useCollection(servicesQuery);

  // Filtra agendamentos futuros ou recentes (ordenados por data)
  const sortedAppointments = useMemo(() => {
    if (!appointments) return [];
    return [...appointments].sort((a, b) => b.startTime.localeCompare(a.startTime)).slice(0, 20);
  }, [appointments]);

  const handleSelectAppointment = (appointmentId: string) => {
    const apt = appointments?.find(a => a.id === appointmentId);
    if (!apt) return;

    const aptServices = services?.filter(s => (apt.serviceIds || []).includes(s.id));
    const serviceNames = aptServices?.map(s => s.name).join(" + ") || "Serviço";
    const formattedDate = format(parseISO(apt.startTime), "dd/MM 'às' HH:mm", { locale: ptBR });

    setFormData({
      ...formData,
      clientName: apt.clientName,
      serviceDetails: serviceNames,
      appointmentDateTime: formattedDate,
    });

    toast({
      title: "Dados importados!",
      description: `Agendamento de ${apt.clientName} selecionado.`,
    });
  };

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

  const openWhatsapp = () => {
    const encodedMessage = encodeURIComponent(generatedMessage);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Assistente de Mensagens AI</h1>
          <p className="text-muted-foreground">Use IA para criar mensagens perfeitas para seus clientes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-primary/5">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <Search className="w-4 h-4" />
                Importar da Agenda
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Escolher Agendamento Recente</Label>
                <Select onValueChange={handleSelectAppointment}>
                  <SelectTrigger className="h-12 border-2 rounded-xl">
                    <SelectValue placeholder={loadingApts ? "Carregando agenda..." : "Selecione um cliente da lista"} />
                  </SelectTrigger>
                  <SelectContent>
                    {sortedAppointments.map((apt) => (
                      <SelectItem key={apt.id} value={apt.id}>
                        <div className="flex flex-col items-start">
                          <span className="font-bold">{apt.clientName}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {format(parseISO(apt.startTime), "dd/MM 'às' HH:mm")}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                    {sortedAppointments.length === 0 && !loadingApts && (
                      <SelectItem value="none" disabled>Nenhum agendamento encontrado</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground italic">Isso preencherá os campos abaixo automaticamente.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                Ajustar Detalhes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo de Mensagem</Label>
                <Select 
                  onValueChange={(v: any) => setFormData({...formData, messageType: v})}
                  value={formData.messageType}
                >
                  <SelectTrigger className="h-11">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome do Cliente</Label>
                  <Input 
                    placeholder="Ex: João Silva" 
                    value={formData.clientName}
                    onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tom de Voz</Label>
                  <Select 
                    onValueChange={(v: any) => setFormData({...formData, tone: v})}
                    value={formData.tone}
                  >
                    <SelectTrigger className="h-11">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Serviço(s)</Label>
                    <Input 
                      placeholder="Ex: Corte + Barba" 
                      value={formData.serviceDetails}
                      onChange={(e) => setFormData({...formData, serviceDetails: e.target.value})}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data/Hora</Label>
                    <Input 
                      placeholder="20/05 às 14:00" 
                      value={formData.appointmentDateTime}
                      onChange={(e) => setFormData({...formData, appointmentDateTime: e.target.value})}
                      className="h-11"
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

              <Button className="w-full gap-2 mt-4 h-12 font-bold" onClick={handleGenerate} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Gerar Mensagem com IA
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-sm flex flex-col min-h-[500px]">
          <CardHeader className="border-b bg-card/50">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Resultado da IA
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-4 p-6">
            <Textarea 
              className="flex-1 min-h-[300px] resize-none p-4 font-body leading-relaxed border-2"
              placeholder="A mensagem gerada aparecerá aqui..."
              value={generatedMessage}
              readOnly
            />
            <div className="grid grid-cols-2 gap-3 mt-auto">
              <Button variant="outline" className="gap-2 h-12" onClick={copyToClipboard} disabled={!generatedMessage}>
                <Copy className="w-4 h-4" />
                Copiar
              </Button>
              <Button 
                className="gap-2 bg-green-600 hover:bg-green-700 h-12 text-white" 
                disabled={!generatedMessage}
                onClick={openWhatsapp}
              >
                <Send className="w-4 h-4" />
                WhatsApp
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
