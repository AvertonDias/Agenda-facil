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
  Check
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

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CalendarDays className="w-8 h-8 text-primary" />
            Agenda
          </h1>
          <p className="text-muted-foreground">Visualize e organize seus atendimentos diários.</p>
        </div>
        <Button 
          className="gap-2 shadow-lg hover:shadow-xl transition-all"
          onClick={() => setIsDialogOpen(true)}
        >
          <Plus className="w-4 h-4" />
          Agendar Cliente
        </Button>
      </div>

      {/* Modal de Novo Agendamento */}
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
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
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
              <Label>Horário Disponível (para {date ? format(date, "dd/MM") : ""})</Label>
              <div className="grid grid-cols-4 gap-2 h-[120px] overflow-y-auto p-2 border rounded-md bg-secondary/10">
                {timeSlots.map(time => (
                  <Button
                    key={time}
                    variant={selectedTime === time ? "default" : "outline"}
                    size="sm"
                    className="text-xs h-8"
                    onClick={() => setSelectedTime(time)}
                  >
                    {time}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateAppointment} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              Confirmar Agendamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col gap-8 flex-1">
        {/* Seção do Calendário */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-none shadow-sm overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary">Selecione a Data</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                locale={ptBR}
                className="w-full flex justify-center p-4"
              />
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary">Resumo do Dia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Agendamentos</span>
                <span className="font-bold">{appointments?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Confirmados</span>
                <span className="font-bold text-green-600">
                  {appointments?.filter(a => a.status === 'confirmado').length || 0}
                </span>
              </div>
              <div className="pt-4 border-t">
                 <p className="text-xs text-muted-foreground text-center">
                   {date ? format(date, "dd 'de' MMMM", { locale: ptBR }) : ''}
                 </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Seção dos Agendamentos (Abaixo) */}
        <div className="w-full">
          <Card className="border-none shadow-sm h-full flex flex-col">
            <CardHeader className="border-b bg-card/50 sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">
                    {date ? format(date, "EEEE, dd 'de' MMMM", { locale: ptBR }) : 'Selecione uma data'}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">Horários agendados</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setDate(new Date())}>Hoje</Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 p-0 overflow-auto max-h-[70vh]">
              {isInitialLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="w-10 h-10 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground animate-pulse">Buscando horários...</p>
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
                            <div className="flex flex-col items-center justify-start pt-1 min-w-[60px]">
                              <span className="text-lg font-bold text-foreground">{apt.time}</span>
                              <div className={cn(
                                "w-1 h-full mt-2 rounded-full",
                                isConfirmed ? "bg-green-500" : "bg-yellow-500"
                              )} />
                            </div>

                            <div className="flex-1 space-y-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="text-lg font-bold leading-none">{apt.clientName}</h4>
                                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
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
                                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background p-2 rounded-lg border border-border/40">
                                  <Scissors className="w-4 h-4 text-primary" />
                                  <span className="truncate">{service?.name || 'Serviço'}</span>
                                  <span className="ml-auto font-bold text-foreground">
                                    {service?.basePrice ? `R$ ${service.basePrice.toFixed(2)}` : '--'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background p-2 rounded-lg border border-border/40">
                                  <User className="w-4 h-4 text-accent" />
                                  <span className="truncate">{employee?.name || 'Profissional'}</span>
                                  <ChevronRight className="w-3 h-3 ml-auto opacity-20" />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                  ) : (
                    <div className="flex flex-col items-center justify-center py-32 text-center px-4">
                      <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mb-4">
                        <Clock className="w-8 h-8 text-muted-foreground/50" />
                      </div>
                      <h3 className="text-lg font-semibold">Tudo tranquilo por aqui</h3>
                      <p className="text-muted-foreground max-w-[250px] mt-2">
                        Nenhum agendamento marcado para o dia selecionado.
                      </p>
                      <Button 
                        variant="outline" 
                        className="mt-6 gap-2 border-dashed"
                        onClick={() => setIsDialogOpen(true)}
                      >
                        <Plus className="w-4 h-4" /> Criar Primeiro Horário
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