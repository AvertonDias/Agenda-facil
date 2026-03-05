
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

  // Filtragem manual na memória para garantir funcionamento sem índices complexos
  const appointments = allAppointments?.filter(apt => {
    const targetDate = format(date || new Date(), 'yyyy-MM-dd');
    return apt.date === targetDate;
  });

  const isInitialLoading = isUserLoading || loadingApts;

  const handleOpenEditDialog = (apt: any) => {
    setEditingAppointmentId(apt.id);
    setClientName(apt.clientName);
    setClientPhone(apt.clientPhone || "");
    setSelectedService(apt.serviceId);
    setSelectedEmployee(apt.employeeId);
    setSelectedTime(apt.time);
    
    if (apt.date) {
      const [year, month, day] = apt.date.split('-').map(Number);
      setSelectedDate(new Date(year, month - 1, day));
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
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    
    const appointmentData = {
      clientName,
      clientPhone,
      serviceId: selectedService,
      employeeId: selectedEmployee,
      date: dateStr,
      time: selectedTime,
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
    if (!allAppointments || !selectedEmployee) return false;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return allAppointments.some(apt => 
      apt.date === dateStr && 
      apt.time === time && 
      apt.employeeId === selectedEmployee && 
      apt.id !== editingAppointmentId
    );
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
          onClick={() => { resetForm(); setIsDialogOpen(true); }}
        >
          <Plus className="w-4 h-4" />
          Agendar Cliente
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingAppointmentId ? <Edit2 className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
              {editingAppointmentId ? "Editar Agendamento" : "Novo Agendamento"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label>Data do Agendamento</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  * {selectedDate ? format(selectedDate, "dd/MM") : ""}
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
            <Button onClick={handleSaveAppointment} disabled={isSubmitting || !selectedTime}>
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              {editingAppointmentId ? "Salvar Alterações" : "Confirmar Agendamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col gap-6 flex-1">
        <Card className="border-none shadow-md overflow-hidden bg-white rounded-xl">
          <CardHeader className="pb-4 border-b bg-secondary/5 flex flex-row items-center justify-between">
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
          <CardContent className="p-0 flex justify-center bg-card">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              locale={ptBR}
              className="w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-full"
            />
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-primary/5 rounded-xl border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-primary/70">Resumo de Atendimentos</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Total do Dia</span>
              <span className="text-3xl font-black">{appointments?.length || 0}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Confirmados</span>
              <span className="text-3xl font-black text-green-600">
                {appointments?.filter(a => a.status === 'confirmado').length || 0}
              </span>
            </div>
            <div className="col-span-2 pt-4 border-t border-primary/10">
               <p className="text-sm font-black text-primary flex items-center gap-2 uppercase tracking-tight">
                 <Clock className="w-4 h-4" />
                 {date ? format(date, "EEEE, dd 'de' MMMM", { locale: ptBR }) : ''}
               </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm flex flex-col bg-white rounded-xl overflow-hidden">
          <CardHeader className="border-b bg-card/50 p-6">
            <div>
              <CardTitle className="text-xl font-black tracking-tight">
                Linha do Tempo
              </CardTitle>
              <p className="text-xs text-muted-foreground font-medium">Lista cronológica de compromissos</p>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 p-0 overflow-auto min-h-[400px]">
            {isInitialLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground animate-pulse font-medium">Buscando horários...</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {appointments && appointments.length > 0 ? (
                  [...appointments]
                    .sort((a, b) => a.time.localeCompare(b.time))
                    .map((apt) => {
                      const service = services?.find(s => s.id === apt.serviceId);
                      const employee = collaborators?.find(e => e.id === apt.employeeId);
                      const isConfirmed = apt.status === 'confirmado';

                      return (
                        <div 
                          key={apt.id} 
                          className="group flex gap-4 p-5 hover:bg-secondary/20 transition-all relative"
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
                                <h4 className="text-lg font-black leading-none tracking-tight">{apt.clientName}</h4>
                                <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1.5 font-bold">
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
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-secondary border transition-colors">
                                      <MoreVertical className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="font-bold">
                                    <DropdownMenuItem 
                                      className="gap-2"
                                      onSelect={(e) => {
                                        e.preventDefault();
                                        handleOpenEditDialog(apt);
                                      }}
                                    >
                                      <Edit2 className="w-4 h-4" /> Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      className="gap-2 text-destructive"
                                      onSelect={() => handleDeleteAppointment(apt.id)}
                                    >
                                      <Trash2 className="w-4 h-4" /> Excluir
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background p-2 rounded-lg border border-border/40 shadow-sm">
                                <Scissors className="w-4 h-4 text-primary" />
                                <div className="flex flex-col">
                                  <span className="truncate font-black text-foreground leading-tight text-xs uppercase tracking-tight">{service?.name || 'Serviço'}</span>
                                  <span className="text-[10px] font-bold opacity-70">R$ {service?.basePrice ? service.basePrice.toFixed(2) : '--'}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background p-2 rounded-lg border border-border/40 shadow-sm">
                                <User className="w-4 h-4 text-accent" />
                                <div className="flex flex-col">
                                  <span className="truncate font-black text-foreground leading-tight text-xs uppercase tracking-tight">{employee?.name || 'Profissional'}</span>
                                  <span className="text-[10px] font-bold opacity-70">{employee?.role || '--'}</span>
                                </div>
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
                    <h3 className="text-xl font-black tracking-tight">Agenda Livre</h3>
                    <p className="text-muted-foreground max-w-[280px] mt-2 text-sm font-medium">
                      Nenhum agendamento para este dia. Que tal abrir novos horários?
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-8 gap-2 border-dashed font-black px-8 uppercase tracking-widest text-xs"
                      onClick={() => { resetForm(); setIsDialogOpen(true); }}
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
  );
}
