
"use client";

import { useState, useMemo, useEffect } from "react";
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
  Trash2,
  Edit2,
  Calendar as CalendarIcon,
  MessageSquare,
  AlertCircle,
  Search,
  Users
} from "lucide-react";
import { ptBR } from "date-fns/locale";
import { 
  useUser, 
  useFirestore, 
  useCollection, 
  useDoc, 
  useMemoFirebase, 
  addDocumentNonBlocking, 
  updateDocumentNonBlocking, 
  deleteDocumentNonBlocking,
  setDocumentNonBlocking
} from "@/firebase";
import { collection, doc, getDoc } from "firebase/firestore";
import { format, isSameDay, addMinutes, isBefore, parseISO } from "date-fns";
import { cn, maskPhone } from "@/lib/utils";
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const statusConfig = {
  pendente: { label: "Pendente", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  confirmado: { label: "Confirmado", color: "bg-blue-100 text-blue-700 border-blue-200" },
  concluido: { label: "Concluído", color: "bg-green-100 text-green-700 border-green-200" },
  cancelado: { label: "Cancelado", color: "bg-red-100 text-red-700 border-red-200" },
  nao_compareceu: { label: "Não Compareceu", color: "bg-gray-100 text-gray-700 border-gray-200" },
};

export default function AdminAgenda() {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("confirmado");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [contactSearch, setContactSearch] = useState("");

  useEffect(() => {
    const now = new Date();
    setDate(now);
    setSelectedDate(now);
  }, []);

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

  const loyaltyQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return collection(db, "empresas", user.uid, "fidelidade");
  }, [db, user?.uid]);

  const { data: companyData } = useDoc(companyRef);
  const { data: services } = useCollection(servicesQuery);
  const { data: collaborators } = useCollection(collaboratorsQuery);
  const { data: allAppointments, isLoading: loadingApts } = useCollection(appointmentsQuery);
  const { data: contacts } = useCollection(loyaltyQuery);

  const slotInterval = companyData?.slotIntervalMinutes || 30;

  const appointments = useMemo(() => {
    if (!allAppointments || !date) return [];
    return allAppointments
      .filter(apt => apt.startTime && isSameDay(parseISO(apt.startTime), date))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [allAppointments, date]);

  const timeSlots = useMemo(() => {
    if (!selectedDate) return [];
    const slots = [];
    let current = new Date(selectedDate);
    current.setHours(8, 0, 0, 0);
    const end = new Date(selectedDate);
    end.setHours(21, 0, 0, 0);

    while (current <= end) {
      slots.push(format(current, "HH:mm"));
      current = addMinutes(current, slotInterval);
    }
    return slots;
  }, [slotInterval, selectedDate]);

  const totalDuration = useMemo(() => {
    return selectedServiceIds.reduce((acc, id) => {
      const service = services?.find(s => s.id === id);
      return acc + (service?.durationMinutes || 0);
    }, 0);
  }, [selectedServiceIds, services]);

  const filteredCollaborators = useMemo(() => {
    if (!collaborators) return [];
    return collaborators.filter(c => 
      selectedServiceIds.length === 0 || 
      selectedServiceIds.every(sId => c.offeredServiceIds?.includes(sId))
    );
  }, [collaborators, selectedServiceIds]);

  const filteredContacts = useMemo(() => {
    if (!contacts) return [];
    return contacts.filter(c => 
      (c.clientName?.toLowerCase().includes(contactSearch.toLowerCase()) || 
       c.phone?.includes(contactSearch))
    ).slice(0, 5);
  }, [contacts, contactSearch]);

  const isSlotBusy = (time: string) => {
    if (!allAppointments || !selectedEmployeeId || !selectedDate) return false;
    const [h, m] = time.split(':').map(Number);
    const slotStart = new Date(selectedDate);
    slotStart.setHours(h, m, 0, 0);
    const slotEnd = addMinutes(slotStart, totalDuration || 30);

    return allAppointments.some(apt => {
      // Ignora cancelados ou não comparecidos
      if (!apt.startTime || apt.id === editingAppointmentId || apt.employeeId !== selectedEmployeeId || apt.status === 'cancelado' || apt.status === 'nao_compareceu') return false;
      const aptStart = parseISO(apt.startTime);
      const aptEnd = parseISO(apt.endTime);
      
      // Regra de Conflito Robusta: novoInicio < existFim && novoFim > existInicio
      return (slotStart < aptEnd && slotEnd > aptStart);
    });
  };

  const resetForm = () => {
    setClientName("");
    setClientPhone("");
    setSelectedServiceIds([]);
    setSelectedEmployeeId("");
    setSelectedTime("");
    setSelectedStatus("confirmado");
    setSelectedDate(date || new Date());
    setEditingAppointmentId(null);
  };

  const handleOpenEditDialog = (apt: any) => {
    setEditingAppointmentId(apt.id);
    setClientName(apt.clientName || "");
    setClientPhone(apt.clientPhone ? maskPhone(apt.clientPhone) : "");
    setSelectedServiceIds(apt.serviceIds || [apt.serviceId].filter(Boolean));
    setSelectedEmployeeId(apt.employeeId || "");
    setSelectedStatus(apt.status || "confirmado");
    if (apt.startTime) {
      const start = parseISO(apt.startTime);
      setSelectedDate(start);
      setSelectedTime(format(start, "HH:mm"));
    }
    setIsDialogOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setTimeout(resetForm, 300);
    }
  };

  const handleQuickStatusUpdate = async (apt: any, newStatus: string) => {
    if (!user) return;
    const docRef = doc(db, "empresas", user.uid, "agendamentos", apt.id);
    updateDocumentNonBlocking(docRef, { status: newStatus, updatedAt: new Date().toISOString() });

    if (newStatus === 'concluido' && companyData?.loyaltyEnabled) {
      const cleanPhone = (apt.clientPhone || "").replace(/\D/g, '');
      if (cleanPhone) {
        const loyaltyDocRef = doc(db, "empresas", user.uid, "fidelidade", cleanPhone);
        const loyaltySnap = await getDoc(loyaltyDocRef);
        const currentPoints = loyaltySnap.exists() ? (loyaltySnap.data().points || 0) : 0;
        const pointsToAdd = companyData.loyaltyPointsPerVisit || 1;
        
        setDocumentNonBlocking(loyaltyDocRef, {
          phone: cleanPhone,
          clientName: apt.clientName,
          points: currentPoints + pointsToAdd,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
    }

    toast({ 
      title: "Status atualizado!",
      description: newStatus === 'concluido' ? "O atendimento foi finalizado e os pontos de fidelidade foram creditados." : `Status alterado para ${statusConfig[newStatus as keyof typeof statusConfig].label}.`
    });
  };

  const handleSelectContact = (contact: any) => {
    setClientName(contact.clientName || "");
    setClientPhone(maskPhone(contact.phone || ""));
    setContactSearch("");
    toast({
      title: "Cliente Selecionado",
      description: `${contact.clientName} importado da lista de contatos.`,
    });
  };

  const handleSaveAppointment = async () => {
    if (!user || !clientName || selectedServiceIds.length === 0 || !selectedEmployeeId || !selectedTime || !selectedDate) {
      toast({ title: "Campos obrigatórios", description: "Preencha todos os campos corretamente.", variant: "destructive" });
      return;
    }

    const [hours, minutes] = selectedTime.split(':').map(Number);
    const startTime = new Date(selectedDate);
    startTime.setHours(hours, minutes, 0, 0);
    const endTime = addMinutes(startTime, totalDuration);

    setIsSubmitting(true);
    
    const cleanClientPhone = clientPhone.replace(/\D/g, '');
    const data = {
      salonId: user.uid,
      clientName,
      clientPhone: cleanClientPhone,
      serviceIds: selectedServiceIds,
      employeeId: selectedEmployeeId,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(), // Salvo para persistência robusta
      timezone: "America/Sao_Paulo",
      status: selectedStatus,
      updatedAt: new Date().toISOString(),
    };

    try {
      if (editingAppointmentId) {
        const docRef = doc(db, "empresas", user.uid, "agendamentos", editingAppointmentId);
        updateDocumentNonBlocking(docRef, data);

        if (selectedStatus === 'concluido' && companyData?.loyaltyEnabled) {
          if (cleanClientPhone) {
            const loyaltyDocRef = doc(db, "empresas", user.uid, "fidelidade", cleanClientPhone);
            const loyaltySnap = await getDoc(loyaltyDocRef);
            const currentPoints = loyaltySnap.exists() ? (loyaltySnap.data().points || 0) : 0;
            const pointsToAdd = companyData.loyaltyPointsPerVisit || 1;
            
            setDocumentNonBlocking(loyaltyDocRef, {
              phone: cleanClientPhone,
              clientName: clientName,
              points: currentPoints + pointsToAdd,
              updatedAt: new Date().toISOString()
            }, { merge: true });
          }
        }
      } else {
        const appointmentsRef = collection(db, "empresas", user.uid, "agendamentos");
        addDocumentNonBlocking(appointmentsRef, { ...data, createdAt: new Date().toISOString() });
      }
      
      toast({ 
        title: editingAppointmentId ? "Agendamento atualizado!" : "Agendamento realizado!",
        description: selectedStatus === 'concluido' ? "O atendimento foi finalizado e os pontos de fidelidade foram creditados." : undefined
      });
      setIsDialogOpen(false);
    } catch (e) {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAppointment = (appointmentId: string) => {
    if (!user) return;
    const docRef = doc(db, "empresas", user.uid, "agendamentos", appointmentId);
    deleteDocumentNonBlocking(docRef);
    toast({ title: "Agendamento removido", variant: "destructive" });
  };

  const toggleService = (id: string) => {
    setSelectedServiceIds(prev => 
      prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
    );
    if (selectedEmployeeId) {
      const stillFits = collaborators?.find(c => c.id === selectedEmployeeId)?.offeredServiceIds?.includes(id);
      if (!stillFits) setSelectedEmployeeId("");
    }
  };

  const isInitialLoading = isUserLoading || (loadingApts && !allAppointments) || !date;

  return (
    <div className="flex flex-col space-y-8 max-w-2xl mx-auto w-full px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
        <div>
          <h1 className="text-3xl font-black flex items-center justify-center sm:justify-start gap-2 text-primary tracking-tight">
            <CalendarDays className="w-8 h-8" />
            Agenda
          </h1>
          <p className="text-muted-foreground font-medium">Gerencie seus horários e compromissos.</p>
        </div>
        <Button 
          className="gap-2 shadow-lg font-bold px-8 h-12 w-full sm:w-auto"
          onClick={() => { resetForm(); setIsDialogOpen(true); }}
        >
          <Plus className="w-4 h-4" />
          Agendar Cliente
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
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
                  <Button variant="outline" className="w-full justify-start text-left font-bold h-12 border-2 rounded-xl">
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="clientName" className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Nome do Cliente</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 gap-1 px-2 text-[10px] font-black uppercase text-primary">
                        <Users className="w-3 h-3" /> Contatos
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[250px] p-0" align="end">
                      <div className="p-3 border-b bg-secondary/10">
                        <div className="relative">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="Buscar contato..." 
                            className="pl-8 h-9 text-xs" 
                            value={contactSearch}
                            onChange={(e) => setContactSearch(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="max-h-[250px] overflow-y-auto">
                        {filteredContacts.length > 0 ? (
                          filteredContacts.map(contact => (
                            <div 
                              key={contact.id} 
                              className="p-3 hover:bg-secondary/20 cursor-pointer border-b last:border-0"
                              onClick={() => handleSelectContact(contact)}
                            >
                              <p className="text-xs font-bold">{contact.clientName}</p>
                              <p className="text-[10px] text-muted-foreground">{maskPhone(contact.phone)}</p>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center text-[10px] text-muted-foreground font-bold">Nenhum contato encontrado</div>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <Input id="clientName" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Ex: João Silva" className="h-12 border-2 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientPhone" className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Telefone</Label>
                <Input 
                  id="clientPhone" 
                  value={clientPhone} 
                  onChange={(e) => setClientPhone(maskPhone(e.target.value))} 
                  placeholder="(00) 00000-0000" 
                  className="h-12 border-2 rounded-xl" 
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Serviços</Label>
              <div className="grid grid-cols-2 gap-2 p-4 border-2 rounded-xl bg-secondary/5">
                {services?.map(s => (
                  <div 
                    key={s.id} 
                    className={cn(
                      "flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all",
                      selectedServiceIds.includes(s.id) ? "bg-primary/10 border-primary" : "bg-transparent border-transparent"
                    )}
                    onClick={() => toggleService(s.id)}
                  >
                    <span className="text-xs font-bold">{s.name}</span>
                    {selectedServiceIds.includes(s.id) ? <Check className="w-4 h-4 text-primary" /> : <Plus className="w-4 h-4 text-muted-foreground" />}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Profissional</Label>
                  {selectedServiceIds.length > 0 && filteredCollaborators.length === 0 && (
                    <span className="text-[8px] font-black uppercase text-destructive flex items-center gap-1">
                      <AlertCircle className="w-2.5 h-2.5" /> Nenhum profissional realiza todos esses serviços juntos.
                    </span>
                  )}
                </div>
                <Select 
                  onValueChange={setSelectedEmployeeId} 
                  value={selectedEmployeeId}
                  disabled={selectedServiceIds.length > 0 && filteredCollaborators.length === 0}
                >
                  <SelectTrigger className="h-12 border-2 rounded-xl">
                    <SelectValue placeholder={selectedServiceIds.length > 0 && filteredCollaborators.length === 0 ? "Indisponível" : "Escolha um profissional"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCollaborators.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Status</Label>
                <Select onValueChange={setSelectedStatus} value={selectedStatus}>
                  <SelectTrigger className="h-12 border-2 rounded-xl">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="confirmado">Confirmado</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                    <SelectItem value="nao_compareceu">Não Compareceu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Horários Disponíveis</Label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[200px] overflow-y-auto p-2 border-2 rounded-xl bg-background">
                {timeSlots.map(time => {
                  const isBusy = isSlotBusy(time);
                  return (
                    <Button
                      key={time}
                      variant={selectedTime === time ? "default" : "outline"}
                      disabled={isBusy || !selectedEmployeeId}
                      className={cn(
                        "h-10 text-[10px] font-black border-2 rounded-xl",
                        (isBusy || !selectedEmployeeId) && "opacity-20 bg-muted cursor-not-allowed",
                      )}
                      onClick={() => setSelectedTime(time)}
                    >
                      {time}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="font-bold">Cancelar</Button>
            <Button onClick={handleSaveAppointment} disabled={isSubmitting || !selectedTime} className="font-black px-8 h-12 rounded-xl">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              {editingAppointmentId ? "Atualizar" : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="border-none shadow-xl overflow-hidden bg-white rounded-2xl">
        <CardHeader className="pb-4 border-b bg-secondary/10 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" />
            {date ? format(date, "MMMM yyyy", { locale: ptBR }) : "Calendário"}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setDate(new Date())} className="h-8 text-[10px] font-black uppercase">Hoje</Button>
        </CardHeader>
        <CardContent className="p-2 flex justify-center">
          {date && <Calendar mode="single" selected={date} onSelect={setDate} locale={ptBR} className="w-full" />}
        </CardContent>
      </Card>

      <Card className="border-none shadow-xl flex flex-col bg-white rounded-2xl overflow-hidden min-h-[400px]">
        <CardHeader className="border-b bg-card/50 p-6">
          <CardTitle className="text-2xl font-black tracking-tight">Compromissos</CardTitle>
          <p className="text-xs text-muted-foreground font-bold uppercase">Agenda para {date ? format(date, "PPP", { locale: ptBR }) : ''}</p>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          {isInitialLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground font-black uppercase">Sincronizando...</p>
            </div>
          ) : appointments.length > 0 ? (
            <div className="divide-y-2 divide-border/50">
              {appointments.map((apt) => {
                const appointmentServices = services?.filter(s => (apt.serviceIds || [apt.serviceId]).includes(s.id));
                const employee = collaborators?.find(e => e.id === apt.employeeId);
                const aptTime = format(parseISO(apt.startTime), "HH:mm");
                const currentStatus = statusConfig[apt.status as keyof typeof statusConfig] || statusConfig.pendente;

                return (
                  <div key={apt.id} className="group relative flex gap-4 p-6 hover:bg-secondary/5 transition-all">
                    <div className="flex flex-col items-center min-w-[60px]">
                      <span className="text-xl font-black">{aptTime}</span>
                      <div className="w-1.5 h-full mt-2 rounded-full bg-primary/20" />
                    </div>
                    <div className="flex-1 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-lg font-black">{apt.clientName}</h4>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Badge className={cn("text-[8px] h-4 font-black uppercase border-2 leading-none px-1.5 cursor-pointer hover:opacity-80 transition-opacity", currentStatus.color)}>
                                  {currentStatus.label}
                                </Badge>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start">
                                {Object.entries(statusConfig).map(([key, config]) => (
                                  <DropdownMenuItem key={key} onClick={() => handleQuickStatusUpdate(apt, key)} className="text-[10px] font-black uppercase">
                                    <div className={cn("w-2 h-2 rounded-full mr-2", config.color.split(' ')[0])} />
                                    {config.label}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <p className="text-sm text-muted-foreground flex items-center gap-1.5 font-bold">
                            <Phone className="w-3.5 h-3.5 text-primary" /> {apt.clientPhone ? maskPhone(apt.clientPhone) : "Sem tel"}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 border-2 rounded-full">
                              <MoreVertical className="w-4 h-4" />
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
                      <div className="grid grid-cols-1 gap-3">
                        <div className="flex flex-wrap gap-2">
                          {appointmentServices?.map(s => (
                            <Badge key={s.id} variant="secondary" className="gap-1.5 py-1.5 px-3 border-2">
                              <Scissors className="w-3 h-3" />
                              <span className="text-[10px] uppercase font-black">{s.name}</span>
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 text-sm bg-white p-3 rounded-xl border-2 w-fit">
                          <User className="w-4 h-4 text-accent" />
                          <span className="font-black text-[10px] uppercase">{employee?.name || 'Profissional'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 text-center px-4">
              <CalendarIcon className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground font-bold uppercase text-xs">Nenhum agendamento para este dia.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
