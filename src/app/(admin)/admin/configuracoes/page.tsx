
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
import { 
  Save, 
  Building2, 
  Bell, 
  Loader2, 
  Clock, 
  Tag, 
  CalendarDays, 
  Settings, 
  Plus, 
  Trash2, 
  Zap, 
  X,
  Gift,
  Trophy,
  Users
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, setDocumentNonBlocking } from "@/firebase";
import { doc, serverTimestamp, collection } from "firebase/firestore";
import { cn, maskPhone } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

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

  const [salonName, setSalonName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [notifyInstant, setNotifyInstant] = useState(true);
  const [notifyReminder24h, setNotifyReminder24h] = useState(true);

  const [minLeadTimeHours, setMinLeadTimeHours] = useState("2");
  const [slotIntervalMinutes, setSlotIntervalMinutes] = useState("30");

  const [workingHours, setWorkingHours] = useState<Record<string, { open: string, close: string, closed: boolean }>>({
    monday: { open: "08:00", close: "18:00", closed: false },
    tuesday: { open: "08:00", close: "18:00", closed: false },
    wednesday: { open: "08:00", close: "18:00", closed: false },
    thursday: { open: "08:00", close: "18:00", closed: false },
    friday: { open: "08:00", close: "18:00", closed: false },
    saturday: { open: "08:00", close: "12:00", closed: false },
    sunday: { open: "08:00", close: "12:00", closed: true },
  });

  const [promotions, setPromotions] = useState<string[]>([]);
  const [automaticPromotions, setAutomaticPromotions] = useState<any[]>([]);

  // Loyalty states
  const [loyaltyEnabled, setLoyaltyEnabled] = useState(false);
  const [loyaltyPointsPerVisit, setLoyaltyPointsPerVisit] = useState("1");
  const [loyaltyGoal, setLoyaltyGoal] = useState("10");
  const [loyaltyReward, setLoyaltyReward] = useState("Corte de Cabelo Grátis");

  const companyRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "empresas", user.uid);
  }, [db, user]);

  const servicesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "empresas", user.uid, "servicos");
  }, [db, user]);

  const loyaltyQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, "empresas", user.uid, "fidelidade");
  }, [db, user]);

  const { data: companyData, isLoading } = useDoc(companyRef);
  const { data: services } = useCollection(servicesQuery);
  const { data: loyaltyRecords, isLoading: loadingLoyalty } = useCollection(loyaltyQuery);

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
      
      setPromotions(Array.isArray(companyData.promotions) ? companyData.promotions : []);
      setAutomaticPromotions(companyData.automaticPromotions || []);

      // Loyalty data
      setLoyaltyEnabled(companyData.loyaltyEnabled ?? false);
      setLoyaltyPointsPerVisit(String(companyData.loyaltyPointsPerVisit ?? "1"));
      setLoyaltyGoal(String(companyData.loyaltyGoal ?? "10"));
      setLoyaltyReward(companyData.loyaltyReward || "Corte de Cabelo Grátis");
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
      promotions,
      automaticPromotions,
      loyaltyEnabled,
      loyaltyPointsPerVisit: parseInt(loyaltyPointsPerVisit) || 1,
      loyaltyGoal: parseInt(loyaltyGoal) || 10,
      loyaltyReward,
      ownerId: user.uid,
      updatedAt: serverTimestamp(),
    };

    setDocumentNonBlocking(companyRef, data, { merge: true });
    
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Configurações atualizadas!",
        description: "Suas preferências foram salvas com sucesso.",
      });
    }, 500);
  };

  const updateDay = (day: string, field: string, value: any) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
  };

  const addBanner = () => setPromotions(prev => [...prev, ""]);
  const updateBanner = (index: number, value: string) => {
    const newBanners = [...promotions];
    newBanners[index] = value;
    setPromotions(newBanners);
  };
  const removeBanner = (index: number) => setPromotions(prev => prev.filter((_, i) => i !== index));

  const addPromotion = () => {
    setAutomaticPromotions(prev => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        description: "Nova Promoção",
        dayOfWeek: "any",
        serviceIds: [],
        discountPercentage: 10
      }
    ]);
  };
  const removePromotion = (id: string) => setAutomaticPromotions(prev => prev.filter(p => p.id !== id));
  const updatePromotion = (id: string, field: string, value: any) => {
    setAutomaticPromotions(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const togglePromoService = (promoId: string, serviceId: string) => {
    const promo = automaticPromotions.find(p => p.id === promoId);
    if (!promo) return;
    const newServiceIds = promo.serviceIds.includes(serviceId)
      ? promo.serviceIds.filter((id: string) => id !== serviceId)
      : [...promo.serviceIds, serviceId];
    updatePromotion(promoId, "serviceIds", newServiceIds);
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
          <TabsTrigger value="fidelidade" className="gap-2 px-6 py-2.5 rounded-xl font-bold data-[state=active]:bg-primary data-[state=active]:text-white">
            <Gift className="w-4 h-4" /> Fidelidade
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
                  <Input 
                    value={phone} 
                    onChange={(e) => setPhone(maskPhone(e.target.value))} 
                    placeholder="(11) 99999-9999" 
                    className="h-14 border-2 rounded-2xl px-6 font-bold" 
                  />
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
              <CardTitle>Agenda Inteligente</CardTitle>
              <CardDescription>Configure as regras para o seu estabelecimento.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Antecedência Mínima (Horas)</Label>
                  <Input type="number" value={minLeadTimeHours} onChange={(e) => setMinLeadTimeHours(e.target.value)} className="h-14 border-2 rounded-2xl px-6 font-bold" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground">Intervalo entre Vagas (Minutos)</Label>
                  <Input type="number" value={slotIntervalMinutes} onChange={(e) => setSlotIntervalMinutes(e.target.value)} className="h-14 border-2 rounded-2xl px-6 font-bold" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notificacoes">
          <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-secondary/10">
              <CardTitle>Notificações</CardTitle>
              <CardDescription>Configure como as notificações são enviadas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-8">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-bold">Confirmação Instantânea</Label>
                  <p className="text-sm text-muted-foreground">Envia mensagem assim que o cliente agenda.</p>
                </div>
                <Switch checked={notifyInstant} onCheckedChange={setNotifyInstant} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-bold">Lembrete 24h</Label>
                  <p className="text-sm text-muted-foreground">Reduza faltas enviando um lembrete um dia antes.</p>
                </div>
                <Switch checked={notifyReminder24h} onCheckedChange={setNotifyReminder24h} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="promocoes">
          <div className="space-y-6">
            <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
              <CardHeader className="bg-secondary/10 border-b">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Promoções e Avisos (Banners)</CardTitle>
                    <CardDescription>Destaque mensagens importantes na sua página pública.</CardDescription>
                  </div>
                  <Button onClick={addBanner} variant="outline" className="border-2 rounded-xl font-bold gap-2">
                    <Plus className="w-4 h-4" /> Add Banner
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-4">
                {promotions.length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed rounded-3xl bg-secondary/5">
                    <p className="text-muted-foreground font-bold">Nenhum banner configurado.</p>
                  </div>
                )}
                {promotions.map((text, index) => (
                  <div key={index} className="flex gap-2 items-start group">
                    <Textarea 
                      value={text} 
                      onChange={(e) => updateBanner(index, e.target.value)} 
                      placeholder="Ex: 20% de desconto em Corte Masculino às terças-feiras! ✂️"
                      className="min-h-[100px] text-lg font-bold p-6 border-2 rounded-2xl flex-1"
                    />
                    <Button variant="ghost" size="icon" onClick={() => removeBanner(index)} className="text-destructive h-10 w-10 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
              <CardHeader className="bg-primary/5 border-b">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-primary flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      Promoções Automáticas
                    </CardTitle>
                    <CardDescription>Descontos aplicados automaticamente no carrinho do cliente.</CardDescription>
                  </div>
                  <Button onClick={addPromotion} variant="outline" className="border-2 rounded-xl font-bold gap-2">
                    <Plus className="w-4 h-4" /> Add Regra
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                {automaticPromotions.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed rounded-3xl bg-secondary/5">
                    <Tag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground font-bold">Nenhuma promoção automática configurada.</p>
                  </div>
                )}
                {automaticPromotions.map((promo) => (
                  <div key={promo.id} className="p-6 border-2 rounded-3xl bg-white space-y-4 relative group hover:border-primary/50 transition-all">
                    <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-destructive opacity-0 group-hover:opacity-100" onClick={() => removePromotion(promo.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Descrição da Promoção</Label>
                        <Input value={promo.description} onChange={(e) => updatePromotion(promo.id, "description", e.target.value)} placeholder="Ex: Combo Quarta Maluca" className="h-12 border-2 rounded-xl font-bold" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Dia da Semana</Label>
                        <Select value={promo.dayOfWeek} onValueChange={(v) => updatePromotion(promo.id, "dayOfWeek", v)}>
                          <SelectTrigger className="h-12 border-2 rounded-xl font-bold"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">Qualquer dia</SelectItem>
                            {DAYS_OF_WEEK.map(d => <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Serviços do Combo</Label>
                        <div className="flex flex-wrap gap-2 p-3 border-2 rounded-xl bg-secondary/5 max-h-[100px] overflow-y-auto">
                          {services?.map(s => (
                            <div key={s.id} className={cn("px-3 py-1 rounded-full border-2 text-[10px] font-bold cursor-pointer transition-all", promo.serviceIds.includes(s.id) ? "bg-primary border-primary text-white" : "bg-white border-border")} onClick={() => togglePromoService(promo.id, s.id)}>{s.name}</div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Desconto (%)</Label>
                        <div className="flex items-center gap-4">
                          <Input type="number" value={promo.discountPercentage} onChange={(e) => updatePromotion(promo.id, "discountPercentage", parseInt(e.target.value))} className="h-12 border-2 rounded-xl font-bold w-24" />
                          <span className="text-xl font-black text-primary">% OFF</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="fidelidade">
          <div className="space-y-8">
            <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
              <CardHeader className="bg-primary/5 border-b">
                <CardTitle className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-primary" />
                  Programa de Fidelidade
                </CardTitle>
                <CardDescription>Crie um cartão fidelidade digital para seus clientes recorrentes.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="flex items-center justify-between p-6 bg-secondary/5 rounded-3xl border-2 border-dashed">
                  <div className="space-y-0.5">
                    <Label className="text-lg font-black uppercase tracking-tight">Ativar Programa de Fidelidade</Label>
                    <p className="text-sm text-muted-foreground">Permite que clientes acumulem pontos a cada visita.</p>
                  </div>
                  <Switch checked={loyaltyEnabled} onCheckedChange={setLoyaltyEnabled} />
                </div>

                {loyaltyEnabled && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pontos por Visita</Label>
                      <Input 
                        type="number" 
                        value={loyaltyPointsPerVisit} 
                        onChange={(e) => setLoyaltyPointsPerVisit(e.target.value)}
                        className="h-14 border-2 rounded-2xl font-black text-xl text-center"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Objetivo (Pontos)</Label>
                      <Input 
                        type="number" 
                        value={loyaltyGoal} 
                        onChange={(e) => setLoyaltyGoal(e.target.value)}
                        className="h-14 border-2 rounded-2xl font-black text-xl text-center"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Recompensa</Label>
                      <Input 
                        value={loyaltyReward} 
                        onChange={(e) => setLoyaltyReward(e.target.value)}
                        placeholder="Ex: Corte Grátis"
                        className="h-14 border-2 rounded-2xl font-bold"
                      />
                    </div>
                    <div className="md:col-span-3 p-6 bg-primary/5 rounded-3xl border-2 border-primary/20 flex items-center gap-4">
                      <div className="p-3 bg-primary text-white rounded-2xl shadow-lg">
                        <Trophy className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-black uppercase text-primary tracking-widest">Exemplo de Regra</p>
                        <p className="text-lg font-bold leading-tight">
                          Ao completar <span className="text-primary font-black underline">{loyaltyGoal} pontos</span>, o cliente ganha: <span className="text-primary font-black">{loyaltyReward}</span>.
                        </p>
                        <p className="text-[10px] text-muted-foreground font-medium">Os pontos são creditados automaticamente quando você marcar o agendamento como "Concluído" na agenda.</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {loyaltyEnabled && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 px-2">
                  <Users className="w-5 h-5 text-primary" />
                  <h3 className="text-xl font-black uppercase tracking-tight">Clientes com Pontos</h3>
                </div>
                <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-secondary/10">
                        <TableRow className="border-none">
                          <TableHead className="font-black uppercase text-[10px] h-12">Telefone do Cliente</TableHead>
                          <TableHead className="font-black uppercase text-[10px] text-center h-12">Pontos</TableHead>
                          <TableHead className="font-black uppercase text-[10px] text-right h-12 pr-6">Progresso</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loadingLoyalty ? (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-10">
                              <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                            </TableCell>
                          </TableRow>
                        ) : loyaltyRecords?.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-16 text-muted-foreground font-bold">
                              Nenhum cliente com pontos acumulados ainda.
                            </TableCell>
                          </TableRow>
                        ) : (
                          loyaltyRecords?.map((record) => {
                            const goal = parseInt(loyaltyGoal) || 10;
                            const progress = Math.min(100, (record.points / goal) * 100);
                            return (
                              <TableRow key={record.id} className="border-b-2 border-secondary/20 hover:bg-secondary/5 transition-colors">
                                <TableCell className="font-bold py-4">{maskPhone(record.phone)}</TableCell>
                                <TableCell className="text-center font-black text-primary text-lg">{record.points}</TableCell>
                                <TableCell className="text-right pr-6">
                                  <div className="flex flex-col items-end gap-1.5">
                                    <div className="flex items-center gap-3">
                                      <Progress value={progress} className="w-32 h-2" />
                                      <span className="text-[10px] font-black w-8">{Math.round(progress)}%</span>
                                    </div>
                                    {record.points >= goal && (
                                      <span className="text-[9px] font-black text-accent uppercase animate-pulse">Prêmio Disponível! 🎁</span>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
