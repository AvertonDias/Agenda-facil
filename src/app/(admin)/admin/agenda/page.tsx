"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Clock, 
  User, 
  Scissors, 
  Loader2, 
  CalendarDays, 
  ChevronRight,
  MoreVertical,
  Phone,
  Check,
  Info
} from "lucide-react";
import { ptBR } from "date-fns/locale";
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function AdminAgenda() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  // Estados do Modal de Novo Agendamento
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Queries protegidas e memoizadas
  const servicesQuery = useMemoFirebase(() => {
    if (!db || !user?.uid || isUserLoading) return null;
    return collection(db, "empresas", user.uid, "servicos");
  }, [db, user?.uid, isUserLoading]);

  const collaboratorsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid || isUserLoading) return null;
    return collection(db, "empresas", user.uid, "colaboradores");
  }, [db, user?.uid, isUserLoading]);

  const appointmentsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid || !date || isUserLoading) return null;
    const dateStr = format(date, 'yyyy-MM-dd');
    return query(
      collection(db, "empresas", user.uid, "agendamentos"),
      where("date", "==", dateStr)
    );
  }, [db, user?.uid, date, isUserLoading]);

  const { data: services } = useCollection(servicesQuery);
  const { data: collaborators } = useCollection(collaboratorsQuery);
  const { data: appointments, isLoading: loadingApts } = useCollection(appointmentsQuery);

  const isInitialLoading = isUserLoading || loadingApts;

  const handleCreateAppointment = () => {
    if (!user || !date || !clientName || !selectedService || !selectedEmployee || !selectedTime) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos do agendamento.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const dateStr = format(date, 'yyyy-MM-dd');
    
    const appointmentData = {
      clientName,
      clientPhone,
      serviceId: selectedService,
      employeeId: selectedEmployee,
      date: dateStr,
      time: selectedTime,
      status: 'confirmado',
      createdAt: new Date().toISOString(),
    };

    const appointmentsRef = collection(db, "empresas", user.uid, "agendamentos");
    
    addDocumentNonBlocking(appointmentsRef, appointmentData)
      .then(() => {
        toast({
          title: "Agendamento realizado!",
          description: `Cliente ${clientName} agendado com sucesso.`,
        });
        setIsDialogOpen(false);
        resetForm();
      })
      .finally(() => setIsSubmitting(false));
  };

  const resetForm = () => {
    setClientName("");
    setClientPhone("");
    setSelectedService("");
    setSelectedEmployee("");
    setSelectedTime("");
  };

  const timeSlots = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
    "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00"
  ];

  const calculateEndTime = (startTime: string, duration: number) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    const h = Math.floor(totalMinutes / 60) % 24;
    const m = totalMinutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const selectedServiceData = services?.find(s => s.id === selectedService);
  const serviceDuration = selectedServiceData?.durationMinutes || 30;

  const isSlotBusy = (time: string) => {
    if (!appointments || !selectedEmployee) return false;
    // Verifica se o profissional já tem agendamento neste horário exato
    return appointments.some(apt => apt.time === time && apt.employeeId === selectedEmployee);
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CalendarDays className="w-8 h-8 text-primary" />
            Agenda
          </h1>
          <p className="text-muted-foreground">Gerencie seus horários e compromissos.</p>
        </div>
        <Button 
          className="gap-2 shadow-lg hover:shadow-xl transition-all"
          onClick={() => setIsDialogOpen(true)}
        >
          <Plus className="w-4 h-4" />
          Agendar Cliente
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              Novo Agendamento
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">Nome do Cliente</Label>
                <Input 
                  id="clientName" 
                  value={clientName} 
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ex: João Silva" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientPhone">Telefone</Label>
                <Input 
                  id="clientPhone" 
                  value={clientPhone} 
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="(11) 99999-9999" 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Serviço</Label>
                <Select onValueChange={setSelectedService} value={selectedService}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {services?.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name} ({s.durationMinutes}min)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Profissional</Label>
                <Select onValueChange={setSelectedEmployee} value={selectedEmployee}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {collaborators?.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-end mb-2">
                <Label className="flex items-center gap-1.5">
                  Horário Disponível 
                  {selectedServiceData && (
                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                      {selectedServiceData.name} - {serviceDuration}min
                    </span>
                  )}
                </Label>
                <span className="text-[10px] text-muted-foreground italic">
                  * {date ? format(date, "dd/MM") : ""}
                </span>
              </div>
              
              {!selectedService || !selectedEmployee ? (
                <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-md bg-secondary/5 text-center">
                  <Info className="w-5 h-5 text-muted-foreground mb-2" />
                  <p className="text-xs text-muted-foreground">Selecione o serviço e o profissional para ver os horários.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 h-[160px] overflow-y-auto p-3 border rounded-md bg-secondary/10">
                  {timeSlots.map(time => {
                    const isBusy = isSlotBusy(time);
                    const endTime = calculateEndTime(time, serviceDuration);
                    
                    return (
                      <Button
                        key={time}
                        variant={selectedTime === time ? "default" : "outline"}
                        size="sm"
                        disabled={isBusy}
                        className={cn(
                          "text-xs h-10 flex flex-col items-center justify-center gap-0.5 leading-none transition-all",
                          isBusy && "opacity-30 grayscale cursor-not-allowed",
                          selectedTime === time && "ring-2 ring-primary ring-offset-1"
                        )}
                        onClick={() => setSelectedTime(time)}
                      >
                        <span className="font-bold">{time}</span>
                        <span className="text-[9px] opacity-70">até {endTime}</span>
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateAppointment} disabled={isSubmitting || !selectedTime}>
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              Confirmar Agendamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col gap-8 flex-1">
        {/* Seção do Calendário e Resumo empilhados */}
        <div className="flex flex-col gap-6">
          <Card className="border-none shadow-sm overflow-hidden bg-white">
            <CardHeader className="pb-2 border-b bg-secondary/10">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary">Calendário de Atendimentos</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                locale={ptBR}
                className="w-full flex justify-center p-6"
              />
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary">Resumo do Dia</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground uppercase">Agendamentos</span>
                <span className="text-2xl font-black">{appointments?.length || 0}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground uppercase">Confirmados</span>
                <span className="text-2xl font-black text-green-600">
                  {appointments?.filter(a => a.status === 'confirmado').length || 0}
                </span>
              </div>
              <div className="col-span-2 pt-4 border-t border-primary/10">
                 <p className="text-sm font-medium text-primary flex items-center gap-2">
                   <CalendarDays className="w-4 h-4" />
                   {date ? format(date, "EEEE, dd 'de' MMMM", { locale: ptBR }) : ''}
                 </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Seção dos Agendamentos */}
        <div className="w-full">
          <Card className="border-none shadow-sm h-full flex flex-col bg-white">
            <CardHeader className="border-b bg-card/50 sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">
                    Próximos Horários
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">Clique para ver detalhes do agendamento</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setDate(new Date())} className="text-xs">Ir para Hoje</Button>
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 p-0 overflow-auto max-h-[800px]">
              {isInitialLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="w-10 h-10 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground animate-pulse font-medium">Buscando horários...</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {appointments && appointments.length > 0 ? (
                    appointments
                      .sort((a, b) => a.time.localeCompare(b.time))
                      .map((apt) => {
                        const service = services?.find(s => s.id === apt.serviceId);
                        const employee = collaborators?.find(e => e.id === apt.employeeId);
                        const isConfirmed = apt.status === 'confirmado';

                        return (
                          <div 
                            key={apt.id} 
                            className="group flex gap-4 p-5 hover:bg-secondary/20 transition-all cursor-pointer relative"
                          >
                            <div className="flex flex-col items-center justify-start pt-1 min-w-[65px]">
                              <span className="text-lg font-black text-foreground">{apt.time}</span>
                              <div className={cn(
                                "w-1 h-full mt-2 rounded-full",
                                isConfirmed ? "bg-green-500" : "bg-yellow-500"
                              )} />
                            </div>

                            <div className="flex-1 space-y-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="text-lg font-bold leading-none">{apt.clientName}</h4>
                                  <p className="text-sm text-muted-foreground mt-1.5 flex items-center gap-1.5 font-medium">
                                    <Phone className="w-3.5 h-3.5 text-primary" />
                                    {apt.clientPhone || "Sem telefone"}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={cn(
                                    "text-[10px] px-2.5 py-1 rounded-full uppercase font-black tracking-tighter",
                                    isConfirmed ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                                  )}>
                                    {apt.status || 'pendente'}
                                  </span>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background p-2 rounded-lg border border-border/40 shadow-sm">
                                  <Scissors className="w-4 h-4 text-primary" />
                                  <div className="flex flex-col">
                                    <span className="truncate font-semibold text-foreground leading-tight">{service?.name || 'Serviço'}</span>
                                    <span className="text-[10px] opacity-70">Preço: {service?.basePrice ? `R$ ${service.basePrice.toFixed(2)}` : '--'}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background p-2 rounded-lg border border-border/40 shadow-sm">
                                  <User className="w-4 h-4 text-accent" />
                                  <div className="flex flex-col">
                                    <span className="truncate font-semibold text-foreground leading-tight">{employee?.name || 'Profissional'}</span>
                                    <span className="text-[10px] opacity-70">Cargo: {employee?.role || '--'}</span>
                                  </div>
                                  <ChevronRight className="w-3 h-3 ml-auto opacity-20" />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                  ) : (
                    <div className="flex flex-col items-center justify-center py-32 text-center px-4">
                      <div className="bg-muted w-20 h-20 rounded-full flex items-center justify-center mb-6">
                        <Clock className="w-10 h-10 text-muted-foreground/40" />
                      </div>
                      <h3 className="text-xl font-bold">Nenhum agendamento para este dia</h3>
                      <p className="text-muted-foreground max-w-[280px] mt-2 text-sm">
                        Sua agenda está livre. Que tal abrir novos horários ou entrar em contato com seus clientes?
                      </p>
                      <Button 
                        variant="outline" 
                        className="mt-8 gap-2 border-dashed font-bold px-8"
                        onClick={() => setIsDialogOpen(true)}
                      >
                        <Plus className="w-4 h-4" /> Novo Agendamento
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
