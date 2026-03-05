"use client";

import { useState, useMemo } from "react";
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
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { format, startOfDay, parseISO, addMinutes, isSameDay, isBefore, addHours } from "date-fns";
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

  // Queries e Dados
  const companyRef = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return doc(db, "empresas", user.uid);
  }, [db, user?.uid]);

  const servicesQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return collection(db, "empresas", user.uid, "servicos");
  }, [db, user?.uid]);

  const collaboratorsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return collection(db, "empresas", user.uid, "colaboradores");
  }, [db, user?.uid]);

  const appointmentsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return collection(db, "empresas", user.uid, "agendamentos");
  }, [db, user?.uid]);

  const { data: companyData } = useDoc(companyRef);
  const { data: services } = useCollection(servicesQuery);
  const { data: collaborators } = useCollection(collaboratorsQuery);
  const { data: allAppointments, isLoading: loadingApts } = useCollection(appointmentsQuery);

  // Configurações da Empresa
  const slotInterval = companyData?.slotIntervalMinutes || 30;
  const minLeadTime = companyData?.minLeadTimeHours || 0;

  // Geração dinâmica de horários baseado nas configurações
  const timeSlots = useMemo(() => {
    const slots = [];
    let current = new Date();
    current.setHours(8, 0, 0, 0);
    const end = new Date();
    end.setHours(21, 0, 0, 0);

    while (current <= end) {
      slots.push(format(current, "HH:mm"));
      current = addMinutes(current, slotInterval);
    }
    return slots;
  }, [slotInterval]);

  // Filtragem manual na memória
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

    // MODELO DE TEMPO ROBUSTO
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const startTime = new Date(selectedDate);
    startTime.setHours(hours, minutes, 0, 0);

    // Verificação de Antecedência Mínima
    if (minLeadTime > 0) {
      const minAllowed = addHours(new Date(), minLeadTime);
      if (isBefore(startTime, minAllowed)) {
        toast({
          title: "Antecedência mínima necessária",
          description: `Sua configuração exige pelo menos ${minLeadTime}h de antecedência.`,
          variant: "destructive",
        });
        return;
      }
    }

    setIsSubmitting(true);
    const serviceData = services?.find(s => s.id === selectedService);
    const duration = serviceData?.durationMinutes || slotInterval;
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

  const calculateEndTimeStr = (startTimeStr: string, duration: number) => {
    const [hours, minutes] = startTimeStr.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    const h = Math.floor(totalMinutes / 60) % 24;
    const m = totalMinutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const selectedServiceData = services?.find(s => s.id === selectedService);
  const serviceDuration = selectedServiceData?.durationMinutes || slotInterval;

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
          <p className="text-muted-foreground font-medium">Gestão inteligente de horários.</p>
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
              <Label className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Escolher Data</Label>
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
                <Label htmlFor="clientName" className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Cliente</Label>
                <Input 
                  id="clientName" 
                  value={clientName} 
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Nome" 
                  className="h-12 border-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientPhone" className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Telefone</Label>
                <Input 
                  id="clientPhone" 
                  value={clientPhone} 
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="(00) 00000-0000" 
                  className="h-12 border-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Serviço</Label>
                <Select onValueChange={setSelectedService} value={selectedService}>
                  <SelectTrigger className="h-12 border-2">
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
                <Label className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Profissional</Label>
                <Select onValueChange={setSelectedEmployee} value={selectedEmployee}>
                  <SelectTrigger className="h-12 border-2">
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
              <Label className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Horários (Intervalo: {slotInterval}min)</Label>
              {!selectedService || !selectedEmployee ? (
                <div className="p-4 border-2 border-dashed rounded-xl bg-secondary/5 text-center">
                  <p className="text-xs text-muted-foreground font-bold">Selecione serviço e profissional para ver as vagas.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 h-[150px] overflow-y-auto p-2 border-2 rounded-xl bg-background shadow-inner">
                  {timeSlots.map(time => {
                    const isBusy = isSlotBusy(time);
                    const endTimeStr = calculateEndTimeStr(time, serviceDuration);
                    
                    return (
                      <Button
                        key={time}
                        variant={selectedTime === time ? "default" : "outline"}
                        size="sm"
                        disabled={isBusy}
                        className={cn(
                          "text-xs h-10 flex flex-col items-center justify-center font-black border-2",
                          isBusy && "opacity-20 grayscale cursor-not-allowed bg-muted",
                          selectedTime === time && "ring-2 ring-primary ring-offset-1"
                        )}
                        onClick={() => setSelectedTime(time)}
                      >
                        <span className="text-xs">{time}</span>
                        <span className="text-[8px] opacity-70">até {endTimeStr}</span>
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="font-bold">Cancelar</Button>
            <Button onClick={handleSaveAppointment} disabled={isSubmitting || !selectedTime} className="font-black px-8">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              Confirmar
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
            <Button variant="ghost" size="sm" onClick={() => setDate(new Date())} className="h-8 text-[10px] font-black uppercase">Hoje</Button>
          </CardHeader>
          <CardContent className="p-0 flex justify-center">
            <Calendar mode="single" selected={date} onSelect={setDate} locale={ptBR} className="w-full p-4" />
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl flex flex-col bg-white rounded-2xl overflow-hidden">
          <CardHeader className="border-b bg-card/50 p-6">
            <CardTitle className="text-2xl font-black tracking-tight">Compromissos</CardTitle>
            <p className="text-xs text-muted-foreground font-bold uppercase">Agenda para {date ? format(date, "PPP", { locale: ptBR }) : ''}</p>
          </CardHeader>
          
          <CardContent className="flex-1 p-0 overflow-auto min-h-[400px]">
            {isInitialLoading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground font-black uppercase">Sincronizando...</p>
              </div>
            ) : (
              <div className="divide-y-2 divide-border/50">
                {appointments && appointments.length > 0 ? (
                  [...appointments]
                    .sort((a, b) => a.startTime.localeCompare(b.startTime))
                    .map((apt) => {
                      const service = services?.find(s => s.id === apt.serviceId);
                      const employee = collaborators?.find(e => e.id === apt.employeeId);
                      const aptTime = format(new Date(apt.startTime), "HH:mm");

                      return (
                        <div key={apt.id} className="group flex gap-4 p-6 hover:bg-secondary/5 transition-all border-l-4 border-l-transparent hover:border-l-primary">
                          <div className="flex flex-col items-center min-w-[60px]">
                            <span className="text-xl font-black">{aptTime}</span>
                            <div className="w-1.5 h-full mt-2 rounded-full bg-green-500" />
                          </div>

                          <div className="flex-1 space-y-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-lg font-black">{apt.clientName}</h4>
                                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                  <Phone className="w-3.5 h-3.5 text-primary" /> {apt.clientPhone || "Sem tel"}
                                </p>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-10 w-10 border-2">
                                    <MoreVertical className="w-5 h-5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="font-bold">
                                  <DropdownMenuItem onClick={() => handleOpenEditDialog(apt)} className="gap-2">
                                    <Edit2 className="w-4 h-4 text-primary" /> Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDeleteAppointment(apt.id)} className="gap-2 text-destructive">
                                    <Trash2 className="w-4 h-4" /> Remover
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="flex items-center gap-3 text-sm bg-white p-3 rounded-xl border-2">
                                <Scissors className="w-5 h-5 text-primary" />
                                <span className="font-black text-xs uppercase">{service?.name || 'Serviço'}</span>
                              </div>
                              <div className="flex items-center gap-3 text-sm bg-white p-3 rounded-xl border-2">
                                <User className="w-5 h-5 text-accent" />
                                <span className="font-black text-xs uppercase">{employee?.name || 'Profissional'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <div className="flex flex-col items-center justify-center py-40">
                    <Clock className="w-12 h-12 text-muted-foreground/30 mb-4" />
                    <p className="text-muted-foreground font-bold uppercase tracking-widest">Nenhum agendamento.</p>
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
