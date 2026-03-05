
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Save, Building2, Bell, Smartphone, Loader2, Clock, Tag, CalendarDays, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking } from "@/firebase";
import { doc, serverTimestamp } from "firebase/firestore";
import { cn } from "@/lib/utils";

const DAYS_OF_WEEK = [
  { id: "monday", label: "Segunda-feira" },
  { id: "tuesday", label: "Terça-feira" },
  { id: "wednesday", label: "Quarta-feira" },
  { id: "thursday", label: "Quinta-feira" },
  { id: "friday", label: "Sexta-feira" },
  { id: "saturday", label: "Sábado" },
  { id: "sunday", label: "Domingo" },
];

export default function AdminSettings() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // States para Perfil
  const [salonName, setSalonName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // States para Notificações
  const [notifyInstant, setNotifyInstant] = useState(true);
  const [notifyReminder24h, setNotifyReminder24h] = useState(true);

  // States para Regras de Negócio
  const [minLeadTimeHours, setMinLeadTimeHours] = useState("2");
  const [slotIntervalMinutes, setSlotIntervalMinutes] = useState("30");

  // State para Horário de Funcionamento
  const [workingHours, setWorkingHours] = useState<Record<string, { open: string, close: string, closed: boolean }>>({
    monday: { open: "08:00", close: "18:00", closed: false },
    tuesday: { open: "08:00", close: "18:00", closed: false },
    wednesday: { open: "08:00", close: "18:00", closed: false },
    thursday: { open: "08:00", close: "18:00", closed: false },
    friday: { open: "08:00", close: "18:00", closed: false },
    saturday: { open: "08:00", close: "12:00", closed: false },
    sunday: { open: "08:00", close: "12:00", closed: true },
  });

  // State para Promoções
  const [promotionsText, setPromotionsText] = useState("");

  const companyRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "empresas", user.uid);
  }, [db, user]);

  const { data: companyData, isLoading } = useDoc(companyRef);

  useEffect(() => {
    if (companyData) {
      setSalonName(companyData.name || "");
      setPhone(companyData.phoneNumber || "");
      setAddress(companyData.address || "");
      setNotifyInstant(companyData.notifyInstant ?? true);
      setNotifyReminder24h(companyData.notifyReminder24h ?? true);
      setMinLeadTimeHours(String(companyData.minLeadTimeHours ?? "2"));
      setSlotIntervalMinutes(String(companyData.slotIntervalMinutes ?? "30"));
      if (companyData.workingHours) {
        setWorkingHours(companyData.workingHours);
      }
      setPromotionsText(companyData.promotionsText || "");
    }
  }, [companyData]);

  const handleSaveAll = () => {
    if (!user || !companyRef) return;
    
    setLoading(true);
    const data = {
      id: user.uid,
      name: salonName,
      phoneNumber: phone,
      address: address,
      notifyInstant,
      notifyReminder24h,
      minLeadTimeHours: parseInt(minLeadTimeHours) || 0,
      slotIntervalMinutes: parseInt(slotIntervalMinutes) || 30,
      workingHours,
      promotionsText,
      ownerId: user.uid,
      updatedAt: serverTimestamp(),
    };

    setDocumentNonBlocking(companyRef, data, { merge: true });
    
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Configurações atualizadas!",
        description: "Suas preferências foram salvas e aplicadas em tempo real.",
      });
    }, 500);
  };

  const updateDay = (day: string, field: string, value: any) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-primary flex items-center gap-2">
            <Settings className="w-8 h-8" />
            Configurações
          </h1>
          <p className="text-muted-foreground font-medium">Personalize como seu salão funciona.</p>
        </div>
        <Button onClick={handleSaveAll} className="gap-2 shadow-lg h-12 px-8 font-black rounded-xl" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar Tudo
        </Button>
      </div>

      <Tabs defaultValue="perfil" className="space-y-6">
        <TabsList className="bg-white border-2 w-full justify-start h-auto p-1 flex-wrap rounded-2xl">
          <TabsTrigger value="perfil" className="gap-2 px-6 py-2.5 rounded-xl font-bold data-[state=active]:bg-primary data-[state=active]:text-white">
            <Building2 className="w-4 h-4" /> Perfil
          </TabsTrigger>
          <TabsTrigger value="horario" className="gap-2 px-6 py-2.5 rounded-xl font-bold data-[state=active]:bg-primary data-[state=active]:text-white">
            <Clock className="w-4 h-4" /> Horário
          </TabsTrigger>
          <TabsTrigger value="regras" className="gap-2 px-6 py-2.5 rounded-xl font-bold data-[state=active]:bg-primary data-[state=active]:text-white">
            <CalendarDays className="w-4 h-4" /> Regras
          </TabsTrigger>
          <TabsTrigger value="notificacoes" className="gap-2 px-6 py-2.5 rounded-xl font-bold data-[state=active]:bg-primary data-[state=active]:text-white">
            <Bell className="w-4 h-4" /> Notificações
          </TabsTrigger>
          <TabsTrigger value="promocoes" className="gap-2 px-6 py-2.5 rounded-xl font-bold data-[state=active]:bg-primary data-[state=active]:text-white">
            <Tag className="w-4 h-4" /> Promoções
          </TabsTrigger>
        </TabsList>

        <TabsContent value="perfil">
          <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-secondary/10">
              <CardTitle>Dados do Salão</CardTitle>
              <CardDescription>Essas informações aparecem para o cliente no agendamento.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Nome do Estabelecimento</Label>
                  <Input value={salonName} onChange={(e) => setSalonName(e.target.value)} placeholder="Ex: Studio VIP" className="h-14 border-2 rounded-2xl px-6 font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">WhatsApp para Contato</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" className="h-14 border-2 rounded-2xl px-6 font-bold" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Endereço Completo</Label>
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua, Número, Bairro - Cidade, UF" className="h-14 border-2 rounded-2xl px-6 font-bold" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="horario">
          <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-secondary/10">
              <CardTitle>Horário de Funcionamento</CardTitle>
              <CardDescription>Defina quando sua agenda está aberta para o público.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-8">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl border-2 border-dashed bg-secondary/5 transition-all hover:bg-white hover:border-primary/30">
                  <div className="flex items-center gap-4 min-w-[150px]">
                    <Switch 
                      checked={!workingHours[day.id]?.closed} 
                      onCheckedChange={(checked) => updateDay(day.id, "closed", !checked)} 
                    />
                    <Label className={cn("font-black uppercase text-xs tracking-widest", workingHours[day.id]?.closed ? "text-muted-foreground/50" : "text-foreground")}>
                      {day.label}
                    </Label>
                  </div>
                  
                  {!workingHours[day.id]?.closed ? (
                    <div className="flex items-center gap-3">
                      <Input type="time" value={workingHours[day.id]?.open} onChange={(e) => updateDay(day.id, "open", e.target.value)} className="w-[120px] h-12 border-2 rounded-xl font-black text-center" />
                      <span className="text-muted-foreground font-black text-[10px] uppercase">até</span>
                      <Input type="time" value={workingHours[day.id]?.close} onChange={(e) => updateDay(day.id, "close", e.target.value)} className="w-[120px] h-12 border-2 rounded-xl font-black text-center" />
                    </div>
                  ) : (
                    <div className="bg-destructive/10 text-destructive px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest">Fechado</div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regras">
          <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-secondary/10">
              <CardTitle>Regras de Agenda</CardTitle>
              <CardDescription>Controle como os clientes podem marcar horários.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    <Label className="font-bold">Antecedência Mínima (horas)</Label>
                  </div>
                  <Input type="number" value={minLeadTimeHours} onChange={(e) => setMinLeadTimeHours(e.target.value)} className="h-14 border-2 rounded-2xl px-6 font-black" />
                  <p className="text-[10px] text-muted-foreground font-medium leading-relaxed italic">
                    Ex: Se colocar 2h, o cliente não consegue marcar um horário para daqui a 1 hora.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-primary" />
                    <Label className="font-bold">Intervalo entre Vagas (minutos)</Label>
                  </div>
                  <Input type="number" value={slotIntervalMinutes} onChange={(e) => setSlotIntervalMinutes(e.target.value)} className="h-14 border-2 rounded-2xl px-6 font-black" />
                  <p className="text-[10px] text-muted-foreground font-medium leading-relaxed italic">
                    Define o tamanho dos "blocos" na agenda. Recomenda-se 15, 30 ou 60 minutos.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notificacoes">
          <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-secondary/10">
              <CardTitle>Notificações</CardTitle>
              <CardDescription>Configure como você e seus clientes são avisados.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-8">
              <div className="space-y-6">
                <div className="flex items-center justify-between p-6 rounded-3xl bg-secondary/10">
                  <div className="space-y-1">
                    <Label className="text-base font-black">Confirmação Instantânea</Label>
                    <p className="text-sm text-muted-foreground font-medium">Ativa o botão de WhatsApp direto para o cliente após agendar.</p>
                  </div>
                  <Switch checked={notifyInstant} onCheckedChange={setNotifyInstant} />
                </div>
                <Separator />
                <div className="flex items-center justify-between p-6 rounded-3xl bg-secondary/10">
                  <div className="space-y-1">
                    <Label className="text-base font-black">Lembrete 24h</Label>
                    <p className="text-sm text-muted-foreground font-medium">Prepara os dados para o assistente de IA enviar lembretes automáticos.</p>
                  </div>
                  <Switch checked={notifyReminder24h} onCheckedChange={setNotifyReminder24h} />
                </div>
              </div>
              <div className="p-4 bg-primary/5 border-2 border-primary/20 rounded-2xl flex gap-4 items-start">
                <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-xs font-medium text-primary leading-relaxed">
                  <strong>Atenção:</strong> Por segurança do WhatsApp, as mensagens automáticas devem ser confirmadas através do Assistente de Mensagens AI no menu lateral.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="promocoes">
          <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-secondary/10">
              <CardTitle>Promoções e Avisos</CardTitle>
              <CardDescription>Destaque mensagens importantes na sua página pública.</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-4">
                <Label className="font-bold">Texto de Promoção (Banner)</Label>
                <Textarea 
                  value={promotionsText} 
                  onChange={(e) => setPromotionsText(e.target.value)} 
                  placeholder="Ex: 20% de desconto em Corte Masculino às terças-feiras! ✂️"
                  className="min-h-[150px] text-lg font-bold p-8 border-2 rounded-3xl"
                />
                <p className="text-xs text-muted-foreground font-medium italic">
                  Este texto aparecerá em um banner colorido no topo da sua página de agendamento para os clientes.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
