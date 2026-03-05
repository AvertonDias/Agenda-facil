"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import { useFirestore, useCollection, useDoc, useMemoFirebase, addDocumentNonBlocking } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  CalendarDays, 
  Clock, 
  Scissors, 
  User, 
  ArrowRight, 
  ChevronLeft, 
  CheckCircle2, 
  Loader2,
  Phone,
  Calendar as CalendarIcon,
  Tag,
  AlertCircle
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { format, addMinutes, isBefore, addHours, parseISO, isSameDay, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const DAY_MAP = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export default function PublicBookingPage(props: { params: Promise<{ empresaId: string }> }) {
  const { empresaId } = React.use(props.params);
  const db = useFirestore();
  const { toast } = useToast();
  
  const [step, setStep] = useState(1);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Queries
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

  const totalDuration = selectedServices.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
  const totalPrice = selectedServices.reduce((acc, s) => acc + (s.basePrice || 0), 0);

  const slotInterval = companyData?.slotIntervalMinutes || 30;
  const minLeadTime = companyData?.minLeadTimeHours || 0;

  // Geração de horários respeitando horário de funcionamento
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
    if (!allAppointments || !selectedEmployeeId) return false;
    const [h, m] = time.split(':').map(Number);
    const slotStart = new Date(selectedDate);
    slotStart.setHours(h, m, 0, 0);
    
    // Bloqueia se já passou do horário atual (para hoje)
    if (isSameDay(selectedDate, new Date()) && isBefore(slotStart, new Date())) return true;
    
    // Bloqueia se não respeita a antecedência mínima
    if (isBefore(slotStart, addHours(new Date(), minLeadTime))) return true;

    const slotEnd = addMinutes(slotStart, totalDuration);

    return allAppointments.some(apt => {
      if (!apt.startTime || apt.employeeId !== selectedEmployeeId || apt.status === 'cancelado') return false;
      const aptStart = parseISO(apt.startTime);
      const aptEnd = parseISO(apt.endTime);
      return (slotStart < aptEnd && slotEnd > aptStart);
    });
  };

  const handleConfirm = async () => {
    if (!clientName || !clientPhone || !selectedTime || !selectedEmployeeId) {
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const aptsRef = collection(db, "empresas", empresaId, "agendamentos");
    addDocumentNonBlocking(aptsRef, appointmentData)
      .then(() => {
        setStep(5); // Sucesso
      })
      .catch(() => {
        toast({ title: "Erro", description: "Não foi possível realizar o agendamento.", variant: "destructive" });
      })
      .finally(() => setIsSubmitting(false));
  };

  if (loadingCompany) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!companyData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6 text-center">
        <div>
          <h1 className="text-2xl font-bold">Salão não encontrado</h1>
          <p className="text-muted-foreground mt-2">Verifique o link e tente novamente.</p>
        </div>
      </div>
    );
  }

  if (step === 5) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-none shadow-2xl text-center p-8 rounded-3xl">
          <CardContent className="space-y-6 pt-6">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-black text-primary">Agendado!</h1>
              <p className="text-muted-foreground font-medium">Seu horário foi reservado com sucesso no {companyData.name}.</p>
            </div>
            <div className="bg-secondary/30 p-6 rounded-2xl text-left space-y-3 border-2 border-border/50">
              <p className="text-xs font-black uppercase text-muted-foreground">Resumo do Atendimento</p>
              <p className="font-bold flex items-center gap-2"><Scissors className="w-4 h-4 text-primary" /> {selectedServices.map(s => s.name).join(" + ")}</p>
              <p className="font-bold flex items-center gap-2"><User className="w-4 h-4 text-primary" /> {currentEmployee?.name}</p>
              <p className="font-black text-primary flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                {format(selectedDate, "PPP", { locale: ptBR })} às {selectedTime}
              </p>
            </div>
            <Button className="w-full h-14 rounded-2xl text-lg font-black" onClick={() => window.location.reload()}>
              Agendar Novo
            </Button>
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
        {companyData.promotionsText && (
          <div className="mb-8 p-6 bg-accent/10 border-2 border-accent/20 rounded-3xl relative overflow-hidden group">
            <Tag className="absolute -right-4 -top-4 w-24 h-24 text-accent/10 rotate-12 group-hover:rotate-45 transition-transform" />
            <div className="flex items-start gap-4">
              <div className="p-2 bg-accent rounded-xl text-white">
                <Tag className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black uppercase text-accent tracking-widest">Destaque do Salão</h3>
                <p className="text-lg font-bold leading-tight">{companyData.promotionsText}</p>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-black">Quais serviços?</h2>
              <p className="text-sm text-muted-foreground">Você pode selecionar mais de um.</p>
            </div>
            <div className="grid gap-3">
              {activeServices?.map((service) => (
                <Card 
                  key={service.id} 
                  className={cn(
                    "cursor-pointer transition-all border-2 rounded-2xl overflow-hidden",
                    selectedServiceIds.includes(service.id) 
                      ? "border-primary bg-primary/5 shadow-md" 
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
                        "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                        selectedServiceIds.includes(service.id) ? "bg-primary text-white" : "bg-primary/10 text-primary"
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
              {activeServices?.length === 0 && <p className="text-center py-10 text-muted-foreground">Nenhum serviço disponível.</p>}
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
                      ? "border-primary bg-primary/5 shadow-md" 
                      : "border-border hover:border-primary/30"
                  )}
                  onClick={() => { setSelectedEmployeeId(employee.id); setStep(3); }}
                >
                  <CardContent className="p-5 flex justify-between items-center">
                    <div className="flex gap-4 items-center">
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                        selectedEmployeeId === employee.id ? "bg-accent text-white" : "bg-accent/10 text-accent"
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
              {activeColabs?.length === 0 && <p className="text-center py-10 text-muted-foreground">Nenhum profissional disponível para esses serviços.</p>}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black">Quando?</h2>
            <div className="space-y-4">
              <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Escolher Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full h-14 justify-start text-left font-bold border-2 rounded-2xl px-6">
                    <CalendarDays className="mr-3 h-5 w-5 text-primary" />
                    {selectedDate ? format(selectedDate, "PPP", { locale: ptBR }) : <span>Selecione</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
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
              <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Horários Livres</Label>
              {timeSlots.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map((time) => {
                    const isBusy = isSlotBusy(time);
                    return (
                      <Button 
                        key={time} 
                        variant={selectedTime === time ? "default" : "outline"}
                        disabled={isBusy}
                        className={cn(
                          "h-14 text-sm font-black rounded-2xl border-2 transition-all",
                          isBusy && "opacity-20 grayscale bg-muted",
                          selectedTime === time && "ring-2 ring-primary ring-offset-2"
                        )}
                        onClick={() => { setSelectedTime(time); setStep(4); }}
                      >
                        {time}
                      </Button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center bg-secondary/20 border-2 border-dashed rounded-3xl flex flex-col items-center gap-2">
                  <AlertCircle className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm font-bold text-muted-foreground">O salão não abre neste dia.</p>
                  <p className="text-[10px] uppercase font-black text-muted-foreground/60">Escolha outra data acima</p>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black">Quase lá!</h2>
            <div className="space-y-4 bg-white p-6 rounded-3xl border-2 shadow-sm">
              <div className="space-y-2">
                <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Seu Nome</Label>
                <Input 
                  placeholder="Ex: Maria Santos" 
                  value={clientName} 
                  onChange={(e) => setClientName(e.target.value)}
                  className="h-14 border-2 rounded-2xl px-6 font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-black text-[10px] uppercase tracking-widest text-muted-foreground">Seu WhatsApp</Label>
                <Input 
                  placeholder="(00) 00000-0000" 
                  value={clientPhone} 
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="h-14 border-2 rounded-2xl px-6 font-bold"
                />
              </div>
              <p className="text-[10px] text-muted-foreground italic text-center pt-2">
                Ao confirmar, seu horário será reservado e você poderá receber uma confirmação no WhatsApp.
              </p>
            </div>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t p-6 pb-8 z-50">
        <div className="max-w-xl mx-auto flex justify-between items-center">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Valor Estimado</p>
            <p className="font-black text-2xl text-primary">R$ {totalPrice.toFixed(2)}</p>
          </div>
          {step === 1 && (
            <Button 
              disabled={selectedServiceIds.length === 0} 
              onClick={() => setStep(2)}
              className="h-14 px-8 rounded-2xl font-black gap-2 shadow-lg"
            >
              Próximo <ArrowRight className="w-4 h-4" />
            </Button>
          )}
          {step === 4 && (
            <Button 
              disabled={!clientName || !clientPhone || isSubmitting} 
              onClick={handleConfirm}
              className="h-14 px-10 rounded-2xl font-black gap-2 shadow-lg"
            >
              {isSubmitting ? <Loader2 className="animate-spin w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              Confirmar Agendamento
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}
