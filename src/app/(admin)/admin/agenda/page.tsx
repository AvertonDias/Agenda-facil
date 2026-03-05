
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
  MoreVertical,
  Phone,
  Check,
  Info,
  Trash2,
  Edit2,
  Calendar as CalendarIcon
} from "lucide-react";
import { ptBR } from "date-fns/locale";
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { format, startOfDay, parseISO, addMinutes, isSameDay } from "date-fns";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";

export default function AdminAgenda() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  // Estados do Modal
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Queries simplificadas para evitar erros de permissão por falta de índice
  const servicesQuery = useMemoFirebase(() => {
    if (!db || !user?.uid || isUserLoading) return null;
    return collection(db, "empresas", user.uid, "servicos");
  }, [db, user?.uid, isUserLoading]);

  const collaboratorsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid || isUserLoading) return null;
    return collection(db, "empresas", user.uid, "colaboradores");
  }, [db, user?.uid, isUserLoading]);

  const appointmentsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid || isUserLoading) return null;
    return collection(db, "empresas", user.uid, "agendamentos");
  }, [db, user?.uid, isUserLoading]);

  const { data: services } = useCollection(servicesQuery);
  const { data: collaborators } = useCollection(collaboratorsQuery);
  const { data: allAppointments, isLoading: loadingApts } = useCollection(appointmentsQuery);

  // Filtragem manual na memória para evitar erros de permissão por falta de índices compostos
  const appointments = allAppointments?.filter(apt => {
    if (!apt.startTime || !date) return false;
    const aptDate = new Date(apt.startTime);
    return isSameDay(aptDate, date);
  });

  const isInitialLoading = isUserLoading || loadingApts;

  const handleOpenEditDialog = (apt: any) => {
    setEditingAppointmentId(apt.id);
    setClientName(apt.clientName);
    setClientPhone(apt.clientPhone || "");
    setSelectedService(apt.serviceId);
    setSelectedEmployee(apt.employeeId);
    
    if (apt.startTime) {
      const start = new Date(apt.startTime);
      setSelectedDate(start);
      setSelectedTime(format(start, "HH:mm"));
    }
    
    setTimeout(() => setIsDialogOpen(true), 200);
  };

  const handleSaveAppointment = () => {
    if (!user || !selectedDate || !clientName || !selectedService || !selectedEmployee || !selectedTime) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos do agendamento.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    // MODELO DE TEMPO ROBUSTO: Combinar data e hora para gerar timestamps UTC
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const startTime = new Date(selectedDate);
    startTime.setHours(hours, minutes, 0, 0);

    const serviceData = services?.find(s => s.id === selectedService);
    const duration = serviceData?.durationMinutes || 30;
    const endTime = addMinutes(startTime, duration);
    
    const appointmentData = {
      clientName,
      clientPhone,
      serviceId: selectedService,
      employeeId: selectedEmployee,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      timezone: "America/Sao_Paulo",
      status: 'confirmado',
      updatedAt: new Date().toISOString(),
    };

    if (editingAppointmentId) {
      const docRef = doc(db, "empresas", user.uid, "agendamentos", editingAppointmentId);
      updateDocumentNonBlocking(docRef, appointmentData);
      toast({ title: "Agendamento atualizado!" });
      setIsDialogOpen(false);
      resetForm();
      setIsSubmitting(false);
    } else {
      const appointmentsRef = collection(db, "empresas", user.uid, "agendamentos");
      addDocumentNonBlocking(appointmentsRef, { ...appointmentData, createdAt: new Date().toISOString() })
        .then(() => {
          toast({
            title: "Agendamento realizado!",
            description: `Cliente ${clientName} agendado com sucesso.`,
          });
          setIsDialogOpen(false);
          resetForm();
        })
        .finally(() => setIsSubmitting(false));
    }
  };

  const handleDeleteAppointment = (appointmentId: string) => {
    if (!user) return;
    const docRef = doc(db, "empresas", user.uid, "agendamentos", appointmentId);
    deleteDocumentNonBlocking(docRef);
    toast({
      title: "Agendamento removido",
      variant: "destructive",
    });
  };

  const resetForm = () => {
    setClientName("");
    setClientPhone("");
    setSelectedService("");
    setSelectedEmployee("");
    setSelectedTime("");
    setSelectedDate(date || new Date());
    setEditingAppointmentId(null);
  };

  const timeSlots = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
    "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00"
  ];

  const calculateEndTimeStr = (startTimeStr: string, duration: number) => {
    const [hours, minutes] = startTimeStr.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    const h = Math.floor(totalMinutes / 60) % 24;
    const m = totalMinutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const selectedServiceData = services?.find(s => s.id === selectedService);
  const serviceDuration = selectedServiceData?.durationMinutes || 30;

  const isSlotBusy = (time: string) => {
    if (!allAppointments || !selectedEmployee) return false;
    
    const [h, m] = time.split(':').map(Number);
    const slotStart = new Date(selectedDate);
    slotStart.setHours(h, m, 0, 0);

    return allAppointments.some(apt => {
      if (!apt.startTime || apt.id === editingAppointmentId || apt.employeeId !== selectedEmployee) return false;
      
      const aptStart = new Date(apt.startTime);
      const aptEnd = new Date(apt.endTime);
      
      return slotStart >= aptStart && slotStart < aptEnd;
    });
  };

  return (
    <div className="flex flex-col space-y-8 max-w-4xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-2 text-primary tracking-tight">
            <CalendarDays className="w-8 h-8" />
            Agenda
          </h1>
          <p className="text-muted-foreground font-medium">Gerencie seus horários e compromissos.</p>
        </div>
        <Button 
          className="gap-2 shadow-lg hover:shadow-xl transition-all font-bold px-6 h-12"
          onClick={() => { resetForm(); setIsDialogOpen(true); }}
        >
          <Plus className="w-4 h-4" />
          Agendar Cliente
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-black">
              {editingAppointmentId ? <Edit2 className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
              {editingAppointmentId ? "Editar Agendamento" : "Novo Agendamento"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Data do Agendamento</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-bold h-12 border-2",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarDays className="mr-2 h-4 w-4 text-primary" />
                    {selectedDate ? format(selectedDate, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(d) => d && setSelectedDate(d)}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientName" className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Nome do Cliente</Label>
                <Input 
                  id="clientName" 
                  value={clientName} 
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ex: João Silva" 
                  className="h-12 border-2 font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientPhone" className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Telefone</Label>
                <Input 
                  id="clientPhone" 
                  value={clientPhone} 
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="(11) 99999-9999" 
                  className="h-12 border-2 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Serviço</Label>
                <Select onValueChange={setSelectedService} value={selectedService}>
                  <SelectTrigger className="h-12 border-2 font-bold">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {services?.map(s => (
                      <SelectItem key={s.id} value={s.id} className="font-bold">{s.name} ({s.durationMinutes}min)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Profissional</Label>
                <Select onValueChange={setSelectedEmployee} value={selectedEmployee}>
                  <SelectTrigger className="h-12 border-2 font-bold">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {collaborators?.map(c => (
                      <SelectItem key={c.id} value={c.id} className="font-bold">{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-end mb-2">
                <Label className="flex items-center gap-1.5 text-xs font-black uppercase tracking-tight text-muted-foreground">
                  Horário Disponível 
                  {selectedServiceData && (
                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                      {serviceDuration}min
                    </span>
                  )}
                </Label>
              </div>
              
              {!selectedService || !selectedEmployee ? (
                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl bg-secondary/5 text-center">
                  <Info className="w-5 h-5 text-muted-foreground mb-2" />
                  <p className="text-xs text-muted-foreground font-bold">Selecione o serviço e o profissional para ver os horários.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 h-[180px] overflow-y-auto p-3 border-2 rounded-xl bg-background shadow-inner">
                  {timeSlots.map(time => {
                    const isBusy = isSlotBusy(time);
                    const endTimeStr = calculateEndTimeStr(time, serviceDuration);
                    
                    return (
                      <Button
                        key={time}
                        variant={selectedTime === time ? "default" : "outline"}
                        size="sm"
                        disabled={isBusy}
                        type="button"
                        className={cn(
                          "text-xs h-12 flex flex-col items-center justify-center gap-0.5 leading-none transition-all font-black border-2",
                          isBusy && "opacity-20 grayscale cursor-not-allowed bg-muted",
                          selectedTime === time && "ring-2 ring-primary ring-offset-2 scale-105"
                        )}
                        onClick={() => setSelectedTime(time)}
                      >
                        <span className="text-sm">{time}</span>
                        <span className="text-[9px] opacity-70 font-bold uppercase">até {endTimeStr}</span>
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="font-bold h-12">Cancelar</Button>
            <Button onClick={handleSaveAppointment} disabled={isSubmitting || !selectedTime} className="font-black h-12 px-8">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              {editingAppointmentId ? "Salvar Alterações" : "Confirmar Agendamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col gap-6">
        <Card className="border-none shadow-xl overflow-hidden bg-white rounded-2xl">
          <CardHeader className="pb-4 border-b bg-secondary/10 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              Calendário
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setDate(new Date())}
              className="h-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary"
            >
              Hoje
            </Button>
          </CardHeader>
          <CardContent className="p-0 flex justify-center bg-white">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              locale={ptBR}
              className="w-full rdp-root p-4"
            />
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-primary/5 rounded-2xl border-l-8 border-l-primary transition-all hover:bg-primary/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary/70">Resumo de Atendimentos</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">Agendamentos</span>
              <span className="text-4xl font-black tabular-nums">{appointments?.length || 0}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">Confirmados</span>
              <span className="text-4xl font-black text-green-600 tabular-nums">
                {appointments?.filter(a => a.status === 'confirmado').length || 0}
              </span>
            </div>
            <div className="col-span-2 pt-4 border-t-2 border-primary/20">
               <p className="text-sm font-black text-primary flex items-center gap-2 uppercase tracking-tight">
                 <Clock className="w-4 h-4" />
                 {date ? format(date, "EEEE, dd 'de' MMMM", { locale: ptBR }) : ''}
               </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl flex flex-col bg-white rounded-2xl overflow-hidden">
          <CardHeader className="border-b bg-card/50 p-6 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-black tracking-tight">
                Compromissos
              </CardTitle>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Cronograma do Dia</p>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 p-0 overflow-auto min-h-[500px]">
            {isInitialLoading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground animate-pulse font-black uppercase">Sincronizando...</p>
              </div>
            ) : (
              <div className="divide-y-2 divide-border/50">
                {appointments && appointments.length > 0 ? (
                  [...appointments]
                    .sort((a, b) => a.startTime.localeCompare(b.startTime))
                    .map((apt) => {
                      const service = services?.find(s => s.id === apt.serviceId);
                      const employee = collaborators?.find(e => e.id === apt.employeeId);
                      const isConfirmed = apt.status === 'confirmado';
                      const aptTime = format(new Date(apt.startTime), "HH:mm");

                      return (
                        <div 
                          key={apt.id} 
                          className="group flex gap-4 p-6 hover:bg-secondary/10 transition-all relative border-l-4 border-l-transparent hover:border-l-primary"
                        >
                          <div className="flex flex-col items-center justify-start pt-1 min-w-[75px]">
                            <span className="text-xl font-black text-foreground tabular-nums">{aptTime}</span>
                            <div className={cn(
                              "w-1.5 h-full mt-2 rounded-full",
                              isConfirmed ? "bg-green-500" : "bg-yellow-500"
                            )} />
                          </div>

                          <div className="flex-1 space-y-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-xl font-black leading-none tracking-tight text-foreground">{apt.clientName}</h4>
                                <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1.5 font-bold">
                                  <Phone className="w-3.5 h-3.5 text-primary" />
                                  {apt.clientPhone || "Sem telefone"}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-10 w-10 border-2 transition-all shadow-sm hover:bg-primary/5 hover:border-primary/50"
                                    >
                                      <MoreVertical className="w-5 h-5" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="font-bold min-w-[140px] p-2">
                                    <DropdownMenuItem 
                                      className="gap-3 py-2.5 cursor-pointer"
                                      onSelect={(e) => {
                                        e.preventDefault();
                                        handleOpenEditDialog(apt);
                                      }}
                                    >
                                      <Edit2 className="w-4 h-4 text-primary" /> Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      className="gap-3 py-2.5 text-destructive cursor-pointer"
                                      onSelect={() => handleDeleteAppointment(apt.id)}
                                    >
                                      <Trash2 className="w-4 h-4" /> Cancelar
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                              <div className="flex items-center gap-3 text-sm text-muted-foreground bg-white p-3 rounded-xl border-2 border-border/60 shadow-sm group-hover:border-primary/20 transition-colors">
                                <Scissors className="w-5 h-5 text-primary shrink-0" />
                                <div className="flex flex-col overflow-hidden">
                                  <span className="truncate font-black text-foreground leading-tight text-xs uppercase tracking-wider">{service?.name || 'Serviço'}</span>
                                  <span className="text-[10px] font-bold text-primary/80">R$ {service?.basePrice ? service.basePrice.toFixed(2) : '--'}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground bg-white p-3 rounded-xl border-2 border-border/60 shadow-sm group-hover:border-accent/20 transition-colors">
                                <User className="w-5 h-5 text-accent shrink-0" />
                                <div className="flex flex-col overflow-hidden">
                                  <span className="truncate font-black text-foreground leading-tight text-xs uppercase tracking-wider">{employee?.name || 'Profissional'}</span>
                                  <span className="text-[10px] font-bold text-accent/80">{employee?.role || 'Equipe'}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <div className="flex flex-col items-center justify-center py-40 text-center px-6">
                    <div className="bg-muted w-24 h-24 rounded-full flex items-center justify-center mb-8 shadow-inner border-4 border-white">
                      <Clock className="w-12 h-12 text-muted-foreground/30" />
                    </div>
                    <h3 className="text-2xl font-black tracking-tight">Agenda Livre</h3>
                    <p className="text-muted-foreground max-w-[320px] mt-2 text-sm font-bold uppercase tracking-widest">
                      Nenhum compromisso para este dia.
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-10 gap-3 border-2 font-black px-10 h-12 uppercase tracking-widest text-xs shadow-md hover:shadow-lg transition-all"
                      onClick={() => { resetForm(); setIsDialogOpen(true); }}
                    >
                      <Plus className="w-4 h-4" /> Primeiro Agendamento
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
