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
import { Save, Building2, Bell, Smartphone, Loader2, Clock, Tag, CalendarDays } from "lucide-react";
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
        description: "Suas preferências foram salvas e aplicadas.",
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
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">Gerencie as preferências do seu estabelecimento.</p>
        </div>
        <Button onClick={handleSaveAll} className="gap-2 shadow-lg h-12 px-8" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar Tudo
        </Button>
      </div>

      <Tabs defaultValue="perfil" className="space-y-6">
        <TabsList className="bg-background border w-full sm:w-auto justify-start h-auto p-1 flex-wrap">
          <TabsTrigger value="perfil" className="gap-2 px-4 py-2">
            <Building2 className="w-4 h-4" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="horario" className="gap-2 px-4 py-2">
            <Clock className="w-4 h-4" />
            Horário
          </TabsTrigger>
          <TabsTrigger value="regras" className="gap-2 px-4 py-2">
            <CalendarDays className="w-4 h-4" />
            Regras
          </TabsTrigger>
          <TabsTrigger value="notificacoes" className="gap-2 px-4 py-2">
            <Bell className="w-4 h-4" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="promocoes" className="gap-2 px-4 py-2">
            <Tag className="w-4 h-4" />
            Promoções
          </TabsTrigger>
        </TabsList>

        <TabsContent value="perfil" className="space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Dados do Salão</CardTitle>
              <CardDescription>Informações visíveis para seus clientes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Nome do Estabelecimento</Label>
                  <Input 
                    value={salonName} 
                    onChange={(e) => setSalonName(e.target.value)} 
                    placeholder="Ex: Studio VIP" 
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp</Label>
                  <Input 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    placeholder="(11) 99999-9999" 
                    className="h-12"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Endereço</Label>
                  <Input 
                    value={address} 
                    onChange={(e) => setAddress(e.target.value)} 
                    placeholder="Rua, Número, Bairro - Cidade, UF" 
                    className="h-12"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="horario" className="space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Horário de Funcionamento</CardTitle>
              <CardDescription>Defina os períodos em que sua agenda estará aberta para clientes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border-2 border-dashed bg-secondary/5">
                  <div className="flex items-center gap-4 min-w-[150px]">
                    <Switch 
                      checked={!workingHours[day.id]?.closed} 
                      onCheckedChange={(checked) => updateDay(day.id, "closed", !checked)} 
                    />
                    <Label className={cn("font-bold", workingHours[day.id]?.closed && "text-muted-foreground line-through")}>
                      {day.label}
                    </Label>
                  </div>
                  
                  {!workingHours[day.id]?.closed && (
                    <div className="flex items-center gap-2">
                      <Input 
                        type="time" 
                        value={workingHours[day.id]?.open} 
                        onChange={(e) => updateDay(day.id, "open", e.target.value)}
                        className="w-[120px] h-10 font-bold"
                      />
                      <span className="text-muted-foreground font-bold">até</span>
                      <Input 
                        type="time" 
                        value={workingHours[day.id]?.close} 
                        onChange={(e) => updateDay(day.id, "close", e.target.value)}
                        className="w-[120px] h-10 font-bold"
                      />
                    </div>
                  )}
                  
                  {workingHours[day.id]?.closed && (
                    <span className="text-xs font-black uppercase text-destructive tracking-widest">Fechado</span>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regras">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Regras de Negócio</CardTitle>
              <CardDescription>Defina os limites de agendamento para evitar surpresas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Antecedência Mínima (horas)</Label>
                  <Input 
                    type="number" 
                    value={minLeadTimeHours} 
                    onChange={(e) => setMinLeadTimeHours(e.target.value)} 
                    className="h-12"
                  />
                  <p className="text-[10px] text-muted-foreground font-medium">Impede que clientes agendem com menos de {minLeadTimeHours}h de antecedência.</p>
                </div>
                <div className="space-y-2">
                  <Label>Intervalo entre Vagas (minutos)</Label>
                  <Input 
                    type="number" 
                    value={slotIntervalMinutes} 
                    onChange={(e) => setSlotIntervalMinutes(e.target.value)} 
                    className="h-12"
                  />
                  <p className="text-[10px] text-muted-foreground font-medium">Ex: 15, 30, 45 ou 60 minutos.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notificacoes">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Automações</CardTitle>
              <CardDescription>Configure os envios automáticos para reduzir faltas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label className="text-base">Confirmação Instantânea</Label>
                    <p className="text-sm text-muted-foreground">Envia mensagem assim que o cliente agenda.</p>
                  </div>
                  <Switch checked={notifyInstant} onCheckedChange={setNotifyInstant} />
                </div>
                <Separator />
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label className="text-base">Lembrete 24h</Label>
                    <p className="text-sm text-muted-foreground">Reduza faltas enviando um lembrete um dia antes.</p>
                  </div>
                  <Switch checked={notifyReminder24h} onCheckedChange={setNotifyReminder24h} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="promocoes">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Ofertas e Promoções</CardTitle>
              <CardDescription>Destaque serviços em promoção na sua página pública.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Texto de Promoção (Destaque)</Label>
                <Textarea 
                  value={promotionsText} 
                  onChange={(e) => setPromotionsText(e.target.value)} 
                  placeholder="Ex: 20% OFF em todos os serviços de barba às terças-feiras! ✂️"
                  className="min-h-[120px] text-lg font-medium p-6"
                />
                <p className="text-xs text-muted-foreground">Este texto aparecerá no topo da sua página de agendamento pública.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
