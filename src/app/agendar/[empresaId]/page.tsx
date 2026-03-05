
"use client";

import * as React from "react";
import { useState, useMemo, useEffect } from "react";
import { useFirestore, useCollection, useDoc, useMemoFirebase, addDocumentNonBlocking } from "@/firebase";
import { collection, doc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  CalendarDays, 
  Scissors, 
  User, 
  ArrowRight, 
  ChevronLeft, 
  CheckCircle2, 
  Loader2,
  Calendar as CalendarIcon,
  Tag,
  AlertCircle,
  MessageSquare,
  Zap,
  Gift,
  Trophy
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { format, addMinutes, isBefore, addHours, parseISO, isSameDay, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn, maskPhone } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const DAY_MAP = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export default function PublicBookingPage(props: { params: Promise<{ empresaId: string }> }) {
  const { empresaId } = React.use(props.params);
  const db = useFirestore();
  const { toast } = useToast();
  
  const [step, setStep] = useState(1);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loyaltyPoints, setLoyaltyPoints] = useState<number | null>(null);

  // Safe initial hydration
  useEffect(() => {
    setSelectedDate(new Date());
  }, []);

  const empresaRef = useMemoFirebase(() => doc(db, "empresas", empresaId), [db, empresaId]);
  const servicesQuery = useMemoFirebase(() => collection(db, "empresas", empresaId, "servicos"), [db, empresaId]);
  const colabsQuery = useMemoFirebase(() => collection(db, "empresas", empresaId, "colaboradores"), [db, empresaId]);
  const appointmentsQuery = useMemoFirebase(() => collection(db, "empresas", empresaId, "agendamentos"), [db, empresaId]);

  const { data: companyData, isLoading: loadingCompany } = useDoc(empresaRef);
  const { data: services } = useCollection(servicesQuery);
  const { data: collaborators } = useCollection(colabsQuery);
  const { data: allAppointments } = useCollection(appointmentsQuery);

  const steps = ["Serviços", "Profissional", "Data e Hora", "Seus Dados"];
  const progress = (step / steps.length) * 100;

  const activeServices = services?.filter(s => s.isActive);
  const activeColabs = collaborators?.filter(c => c.isActive);

  const selectedServices = services?.filter(s => selectedServiceIds.includes(s.id)) || [];
  const currentEmployee = collaborators?.find(e => e.id === selectedEmployeeId);

  const rawTotalPrice = selectedServices.reduce((acc, s) => acc + (s.basePrice || 0), 0);
  const totalDuration = selectedServices.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);

  const appliedPromotion = useMemo(() => {
    if (!companyData?.automaticPromotions || !selectedDate || selectedServiceIds.length === 0) return null;
    const dayName = DAY_MAP[getDay(selectedDate)];
    for (const promo of companyData.automaticPromotions) {
      const dayMatches = promo.dayOfWeek === "any" || promo.dayOfWeek === dayName;
      if (!dayMatches) continue;
      const allServicesSelected = promo.serviceIds.every((sId: string) => selectedServiceIds.includes(sId));
      if (!allServicesSelected || promo.serviceIds.length === 0) continue;
      return promo;
    }
    return null;
  }, [companyData, selectedDate, selectedServiceIds]);

  const totalPrice = useMemo(() => {
    if (appliedPromotion) {
      const discount = rawTotalPrice * (appliedPromotion.discountPercentage / 100);
      return rawTotalPrice - discount;
    }
    return rawTotalPrice;
  }, [rawTotalPrice, appliedPromotion]);

  const slotInterval = companyData?.slotIntervalMinutes || 30;
  const minLeadTime = companyData?.minLeadTimeHours || 0;

  const timeSlots = useMemo(() => {
    if (!companyData || !selectedDate) return [];
    const dayName = DAY_MAP[getDay(selectedDate)];
    const config = companyData.workingHours?.[dayName];
    if (!config || config.closed) return [];
    const slots = [];
    const [startH, startM] = config.open.split(":").map(Number);
    const [endH, endM] = config.close.split(":").map(Number);
    let current = new Date(selectedDate);
    current.setHours(startH, startM, 0, 0);
    const end = new Date(selectedDate);
    end.setHours(endH, endM, 0, 0);
    while (current <= end) {
      slots.push(format(current, "HH:mm"));
      current = addMinutes(current, slotInterval);
    }
    return slots;
  }, [selectedDate, companyData, slotInterval]);

  const isSlotBusy = (time: string) => {
    if (!allAppointments || !selectedEmployeeId || !selectedDate) return false;
    const [h, m] = time.split(':').map(Number);
    const slotStart = new Date(selectedDate);
    slotStart.setHours(h, m, 0, 0);
    if (isSameDay(selectedDate, new Date()) && isBefore(slotStart, new Date())) return true;
    if (isBefore(slotStart, addHours(new Date(), minLeadTime))) return true;
    const slotEnd = addMinutes(slotStart, totalDuration || 30);
    return allAppointments.some(apt => {
      if (!apt.startTime || apt.employeeId !== selectedEmployeeId || apt.status === 'cancelado') return false;
      const aptStart = parseISO(apt.startTime);
      const aptEnd = parseISO(apt.endTime);
      return (slotStart < aptEnd && slotEnd > aptStart);
    });
  };

  const handleConfirm = async () => {
    if (!clientName || !clientPhone || !selectedTime || !selectedEmployeeId || !selectedDate) {
      toast({ title: "Erro", description: "Preencha todos os dados.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    const [h, m] = selectedTime.split(':').map(Number);
    const startTime = new Date(selectedDate);
    startTime.setHours(h, m, 0, 0);
    const endTime = addMinutes(startTime, totalDuration);

    const appointmentData = {
      clientName,
      clientPhone,
      serviceIds: selectedServiceIds,
      employeeId: selectedEmployeeId,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      status: "pendente",
      finalPrice: totalPrice,
      appliedPromotionId: appliedPromotion?.id || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const aptsRef = collection(db, "empresas", empresaId, "agendamentos");
    addDocumentNonBlocking(aptsRef, appointmentData)
      .then(async () => {
        if (companyData?.loyaltyEnabled) {
          const cleanPhone = clientPhone.replace(/\D/g, "");
          const loyaltyRef = doc(db, "empresas", empresaId, "fidelidade", cleanPhone);
          const snap = await getDoc(loyaltyRef);
          if (snap.exists()) {
            setLoyaltyPoints(snap.data().points || 0);
          } else {
            setLoyaltyPoints(0);
          }
        }
        setStep(5);
      })
      .catch(() => {
        toast({ title: "Erro", description: "Não foi possível realizar o agendamento.", variant: "destructive" });
      })
      .finally(() => setIsSubmitting(false));
  };

  const handleNotifyWhatsapp = () => {
    if (!companyData || !selectedTime || !selectedDate) return;
    const servicesText = selectedServices.map(s => s.name).join(" + ");
    const message = `Olá! Acabei de agendar pelo site:\n\n👤 *Cliente:* ${clientName}\n✂️ *Serviço:* ${servicesText}\n📅 *Data:* ${format(selectedDate, "dd/MM")}\n⏰ *Hora:* ${selectedTime}\n💰 *Valor:* R$ ${totalPrice.toFixed(2)}\n\nAté logo!`;
    const encoded = encodeURIComponent(message);
    const phone = companyData.phoneNumber.replace(/\D/g, "");
    window.open(`https://api.whatsapp.com/send?phone=55${phone}&text=${encoded}`, "_blank");
  };

  if (loadingCompany || !selectedDate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!companyData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6 text-center">
        <div className="space-y-4">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold">Salão não encontrado</h1>
          <p className="text-muted-foreground">Verifique o link e tente novamente.</p>
        </div>
      </div>
    );
  }

  const allPromotions = companyData.promotions || [];

  if (step === 5) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-none shadow-2xl text-center p-8 rounded-3xl">
          <CardContent className="space-y-6 pt-6">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600 shadow-inner">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-black text-primary">Agendado!</h1>
              <p className="text-muted-foreground font-medium">Seu horário foi reservado com sucesso no {companyData.name}.</p>
            </div>

            {companyData.loyaltyEnabled && loyaltyPoints !== null && (
              <div className="bg-primary/5 p-6 rounded-3xl border-2 border-primary/20 space-y-4">
                <div className="flex items-center justify-center gap-2 text-primary font-black uppercase text-xs tracking-widest">
                  <Gift className="w-4 h-4" /> Cartão Fidelidade
                </div>
                <div className="flex justify-center gap-1.5 flex-wrap">
                  {Array.from({ length: companyData.loyaltyGoal || 10 }).map((_, i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-700",
                        i < loyaltyPoints ? "bg-primary border-primary text-white shadow-md scale-110" : "bg-white border-border text-muted-foreground/30"
                      )}
                    >
                      {i < loyaltyPoints ? <CheckCircle2 className="w-5 h-5" /> : <span className="text-[10px] font-black">{i + 1}</span>}
                    </div>
                  ))}
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-muted-foreground">Você tem {loyaltyPoints} de {companyData.loyaltyGoal} pontos</p>
                  <p className="text-xs font-bold text-primary">Faltam {Math.max(0, (companyData.loyaltyGoal || 10) - loyaltyPoints)} visitas para ganhar: <span className="underline">{companyData.loyaltyReward}</span>!</p>
                </div>
              </div>
            )}

            <div className="bg-secondary/30 p-6 rounded-2xl text-left space-y-3 border-2 border-border/50">
              <p className="text-xs font-black uppercase text-muted-foreground tracking-widest">Resumo do Atendimento</p>
              <p className="font-bold flex items-center gap-2"><Scissors className="w-4 h-4 text-primary" /> {selectedServices.map(s => s.name).join(" + ")}</p>
              <p className="font-bold flex items-center gap-2"><User className="w-4 h-4 text-primary" /> {currentEmployee?.name}</p>
              <p className="font-black text-primary flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                {selectedDate && format(selectedDate, "PPP", { locale: ptBR })} às {selectedTime}
              </p>
              <div className="pt-2 border-t flex justify-between">
                <span className="text-xs font-bold uppercase text-muted-foreground">Total</span>
                <span className="font-black text-xl text-primary">R$ {totalPrice.toFixed(2)}</span>
              </div>
            </div>
            <div className="grid gap-3">
              <Button className="w-full h-14 rounded-2xl text-lg font-black bg-green-600 hover:bg-green-700 gap-2" onClick={handleNotifyWhatsapp}>
                <MessageSquare className="w-5 h-5" />
                Confirmar no WhatsApp
              </Button>
              <Button variant="ghost" className="w-full h-14 rounded-2xl text-lg font-black" onClick={() => window.location.reload()}>
                Fazer Novo Agendamento
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-body">
      <header className="bg-white/80 backdrop-blur-md p-6 border-b sticky top-0 z-50">
        <div className="max-w-xl mx-auto flex items-center gap-4">
          {step > 1 && (
            <Button variant="ghost" size="icon" onClick={() => setStep(step - 1)} className="rounded-full">
              <ChevronLeft className="w-6 h-6" />
            </Button>
          )}
          <div className="flex-1">
            <h1 className="font-black text-xl text-primary tracking-tight">{companyData.name}</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{steps[step - 1]}</p>
          </div>
          <div className="w-20">
            <Progress value={progress} className="h-1.5" />
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-xl mx-auto w-full pb-32">
        {allPromotions.length > 0 && (
          <div className="space-y-4 mb-4">
            {allPromotions.map((text, i) => (
              <div key={i} className="p-6 bg-accent/10 border-2 border-accent/20 rounded-3xl relative overflow-hidden group shadow-sm">
                <Tag className="absolute -right-4 -top-4 w-24 h-24 text-accent/10 rotate-12 group-hover:rotate-45 transition-transform" />
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-accent rounded-xl text-white shadow-md">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-black uppercase text-accent tracking-widest">Destaque do Salão</h3>
                    <p className="text-lg font-bold leading-tight">{text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {companyData.loyaltyEnabled && (
          <div className="mb-8 p-6 bg-primary/5 border-2 border-primary/20 rounded-3xl relative overflow-hidden group shadow-sm">
            <Trophy className="absolute -right-4 -top-4 w-24 h-24 text-primary/10 rotate-12 group-hover:rotate-45 transition-transform" />
            <div className="flex items-start gap-4">
              <div className="p-2 bg-primary rounded-xl text-white shadow-md">
                <Trophy className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black uppercase text-primary tracking-widest">Programa de Fidelidade</h3>
                <p className="text-lg font-bold leading-tight">
                  Acumule {companyData.loyaltyGoal} pontos e ganhe: <span className="text-primary underline">{companyData.loyaltyReward}</span>!
                </p>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">Ganhe pontos a cada visita concluída</p>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-black">O que vamos fazer?</h2>
              <p className="text-sm text-muted-foreground">Selecione um ou mais serviços abaixo.</p>
            </div>
            <div className="grid gap-3">
              {activeServices?.map((service) => (
                <Card 
                  key={service.id} 
                  className={cn(
                    "cursor-pointer transition-all border-2 rounded-2xl overflow-hidden",
                    selectedServiceIds.includes(service.id) 
                      ? "border-primary bg-primary/5 shadow-md scale-[1.02]" 
                      : "border-border hover:border-primary/30"
                  )}
                  onClick={() => {
                    setSelectedServiceIds(prev => 
                      prev.includes(service.id) 
                        ? prev.filter(id => id !== service.id) 
                        : [...prev, service.id]
                    );
                  }}
                >
                  <CardContent className="p-5 flex justify-between items-center">
                    <div className="flex gap-4 items-center">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                        selectedServiceIds.includes(service.id) ? "bg-primary text-white shadow-lg" : "bg-primary/10 text-primary"
                      )}>
                        <Scissors className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-lg">{service.name}</p>
                        <p className="text-xs font-medium text-muted-foreground">{service.durationMinutes} min • R$ {service.basePrice.toFixed(2)}</p>
                      </div>
                    </div>
                    {selectedServiceIds.includes(service.id) && <CheckCircle2 className="w-5 h-5 text-primary" />}
                  </CardContent>
                </Card>
              ))}
              {activeServices?.length === 0 && <p className="text-center py-10 text-muted-foreground font-bold">Nenhum serviço disponível no momento.</p>}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black">Com quem?</h2>
            <div className="grid gap-3">
              {activeColabs?.filter(c => 
                selectedServiceIds.every(sId => c.offeredServiceIds?.includes(sId))
              ).map((employee) => (
                <Card 
                  key={employee.id} 
                  className={cn(
                    "cursor-pointer transition-all border-2 rounded-2xl",
                    selectedEmployeeId === employee.id 
                      ? "border-primary bg-primary/5 shadow-md scale-[1.02]" 
                      : "border-border hover:border-primary/30"
                  )}
                  onClick={() => { setSelectedEmployeeId(employee.id); setStep(3); }}
                >
                  <CardContent className="p-5 flex justify-between items-center">
                    <div className="flex gap-4 items-center">
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                        selectedEmployeeId === employee.id ? "bg-accent text-white shadow-lg" : "bg-accent/10 text-accent"
                      )}>
                        <User className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-lg">{employee.name}</p>
                        <p className="text-xs font-medium text-muted-foreground">{employee.role}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black">Qual o melhor dia?</h2>
            <div className="space-y-4">
              <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground ml-2">Data do Atendimento</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full h-16 justify-start text-left font-bold border-2 rounded-2xl px-6 bg-white shadow-sm hover:border-primary">
                    <CalendarDays className="mr-3 h-5 w-5 text-primary" />
                    {selectedDate ? format(selectedDate, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-2xl overflow-hidden shadow-2xl" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(d) => d && setSelectedDate(d)}
                    initialFocus
                    locale={ptBR}
                    disabled={(date) => isBefore(date, new Date()) && !isSameDay(date, new Date())}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-4">
              <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground ml-2">Horários Disponíveis</Label>
              {timeSlots.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {timeSlots.map((time) => {
                    const isBusy = isSlotBusy(time);
                    return (
                      <Button 
                        key={time} 
                        variant={selectedTime === time ? "default" : "outline"}
                        disabled={isBusy}
                        className={cn(
                          "h-14 text-sm font-black rounded-2xl border-2 transition-all",
                          isBusy && "opacity-20 grayscale bg-muted cursor-not-allowed",
                          selectedTime === time && "ring-4 ring-primary ring-opacity-20 border-primary"
                        )}
                        onClick={() => { setSelectedTime(time); setStep(4); }}
                      >
                        {time}
                      </Button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-10 text-center bg-secondary/20 border-2 border-dashed rounded-3xl flex flex-col items-center gap-3">
                  <AlertCircle className="w-10 h-10 text-muted-foreground/40" />
                  <p className="text-sm font-black text-muted-foreground uppercase tracking-widest">Salão Fechado</p>
                  <p className="text-[10px] font-medium text-muted-foreground/60 leading-relaxed">Não funcionamos neste dia. Por favor, escolha outra data acima.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black">Finalizar Reserva</h2>
            <div className="space-y-6 bg-white p-8 rounded-3xl border-2 shadow-sm">
              <div className="space-y-2">
                <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground ml-2">Seu Nome Completo</Label>
                <Input placeholder="Ex: Maria Santos" value={clientName} onChange={(e) => setClientName(e.target.value)} className="h-16 border-2 rounded-2xl px-6 font-bold text-lg focus:ring-primary" />
              </div>
              <div className="space-y-2">
                <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground ml-2">Seu WhatsApp</Label>
                <Input placeholder="(00) 00000-0000" value={clientPhone} onChange={(e) => setClientPhone(maskPhone(e.target.value))} className="h-16 border-2 rounded-2xl px-6 font-bold text-lg focus:ring-primary" />
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t p-6 pb-8 z-50">
        <div className="max-w-xl mx-auto flex justify-between items-center">
          <div className="flex flex-col">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Investimento</p>
            <div className="flex items-center gap-2">
              <p className={cn("font-black text-2xl transition-all", appliedPromotion ? "text-primary scale-110" : "text-foreground")}>R$ {totalPrice.toFixed(2)}</p>
              {appliedPromotion && <span className="text-xs line-through text-muted-foreground decoration-destructive decoration-2">R$ {rawTotalPrice.toFixed(2)}</span>}
            </div>
            {appliedPromotion && <div className="flex items-center gap-1 text-[9px] font-black text-primary uppercase animate-pulse"><Zap className="w-3 h-3" /> {appliedPromotion.description} aplicada!</div>}
          </div>
          {step === 1 && <Button disabled={selectedServiceIds.length === 0} onClick={() => setStep(2)} className="h-14 px-8 rounded-2xl font-black gap-2 shadow-lg hover:scale-[1.05] transition-transform">Continuar <ArrowRight className="w-4 h-4" /></Button>}
          {step === 4 && <Button disabled={!clientName || !clientPhone || isSubmitting} onClick={handleConfirm} className="h-14 px-10 rounded-2xl font-black gap-2 shadow-lg hover:scale-[1.05] transition-transform bg-primary">{isSubmitting ? <Loader2 className="animate-spin w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}Finalizar Agendamento</Button>}
        </div>
      </footer>
    </div>
  );
}
