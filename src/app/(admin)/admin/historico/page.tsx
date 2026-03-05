
"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  useUser, 
  useFirestore, 
  useCollection, 
  useMemoFirebase,
} from "@/firebase";
import { collection } from "firebase/firestore";
import { format, parseISO, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Search, 
  History, 
  Trophy, 
  Loader2, 
  User, 
  Calendar as CalendarIcon, 
  Scissors,
  CheckCircle2,
  Phone,
  Clock,
  Filter,
  X,
  CalendarDays
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn, maskPhone } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";

export default function AdminHistory() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCollabId, setSelectedCollabId] = useState("all");
  const [selectedServiceId, setSelectedServiceId] = useState("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const appointmentsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return collection(db, "empresas", user.uid, "agendamentos");
  }, [db, user?.uid]);

  const servicesQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return collection(db, "empresas", user.uid, "servicos");
  }, [db, user?.uid]);

  const collaboratorsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return collection(db, "empresas", user.uid, "colaboradores");
  }, [db, user?.uid]);

  const { data: allAppointments, isLoading: loadingApts } = useCollection(appointmentsQuery);
  const { data: services } = useCollection(servicesQuery);
  const { data: collaborators } = useCollection(collaboratorsQuery);

  const completedAppointments = useMemo(() => {
    if (!allAppointments) return [];
    return allAppointments
      .filter(apt => apt.status === 'concluido')
      .filter(apt => {
        const matchesSearch = apt.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             apt.clientPhone?.includes(searchTerm);
        const matchesCollab = selectedCollabId === "all" || apt.employeeId === selectedCollabId;
        const matchesService = selectedServiceId === "all" || (apt.serviceIds || []).includes(selectedServiceId);
        const matchesDate = !selectedDate || (apt.startTime && isSameDay(parseISO(apt.startTime), selectedDate));
        
        return matchesSearch && matchesCollab && matchesService && matchesDate;
      })
      .sort((a, b) => b.startTime.localeCompare(a.startTime));
  }, [allAppointments, searchTerm, selectedCollabId, selectedServiceId, selectedDate]);

  const clientRanking = useMemo(() => {
    if (!allAppointments) return [];
    
    const concluidosOrdenados = [...allAppointments]
      .filter(apt => apt.status === 'concluido')
      .sort((a, b) => (b.startTime || "").localeCompare(a.startTime || ""));

    const counts: Record<string, { name: string, phone: string, count: number }> = {};
    
    concluidosOrdenados.forEach(apt => {
      const cleanPhone = apt.clientPhone?.replace(/\D/g, '') || "";
      const key = cleanPhone !== "" ? cleanPhone : `no-phone-${apt.clientName}`;
      
      if (!counts[key]) {
        counts[key] = { 
          name: apt.clientName, 
          phone: apt.clientPhone || "", 
          count: 0 
        };
      }
      counts[key].count++;
    });

    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [allAppointments]);

  const isInitialLoading = isUserLoading || loadingApts;

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-primary flex items-center gap-2">
            <History className="w-8 h-8" />
            Histórico
          </h1>
          <p className="text-muted-foreground font-medium">Veja o registro de todos os serviços finalizados.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white">
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Rank de Clientes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {clientRanking.length > 0 ? (
                <div className="divide-y">
                  {clientRanking.map((client, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 hover:bg-secondary/5">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center font-black text-xs",
                        index === 0 ? "bg-yellow-400 text-yellow-900" : 
                        index === 1 ? "bg-gray-300 text-gray-700" :
                        index === 2 ? "bg-orange-300 text-orange-900" : "bg-secondary text-muted-foreground"
                      )}>
                        #{index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm leading-none mb-1">{client.name}</p>
                        <p className="text-[10px] text-muted-foreground font-bold">{client.phone ? maskPhone(client.phone) : "Sem telefone"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-primary">{client.count}</p>
                        <p className="text-[8px] font-black uppercase text-muted-foreground leading-none">Visitas</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-muted-foreground font-bold uppercase text-[10px]">
                  Nenhum dado para o ranking.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar cliente..." 
                className="pl-12 h-12 border-2 rounded-2xl font-bold bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="w-full">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn(
                    "w-full h-12 border-2 rounded-2xl font-bold bg-white justify-start gap-2",
                    !selectedDate && "text-muted-foreground"
                  )}>
                    <CalendarDays className="w-4 h-4 text-primary" />
                    {selectedDate ? format(selectedDate, "dd/MM/yyyy") : "Todas as Datas"}
                    {selectedDate && (
                      <X 
                        className="ml-auto w-3 h-3 hover:text-destructive" 
                        onClick={(e) => { e.stopPropagation(); setSelectedDate(undefined); }} 
                      />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="w-full">
              <Select value={selectedCollabId} onValueChange={setSelectedCollabId}>
                <SelectTrigger className="h-12 border-2 rounded-2xl font-bold bg-white">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    <SelectValue placeholder="Profissional" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Profissionais</SelectItem>
                  {collaborators?.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-full">
              <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                <SelectTrigger className="h-12 border-2 rounded-2xl font-bold bg-white">
                  <div className="flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-primary" />
                    <SelectValue placeholder="Serviço" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Serviços</SelectItem>
                  {services?.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 px-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <h2 className="text-sm font-black uppercase tracking-widest text-foreground">
                Atendimentos Finalizados ({completedAppointments.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {completedAppointments.length > 0 ? (
                completedAppointments.map((apt) => {
                  const aptServices = services?.filter(s => (apt.serviceIds || []).includes(s.id));
                  const employee = collaborators?.find(c => c.id === apt.employeeId);
                  const startTime = parseISO(apt.startTime);

                  return (
                    <Card key={apt.id} className="border-none shadow-lg rounded-3xl overflow-hidden bg-white hover:ring-2 hover:ring-primary/20 transition-all">
                      <div className="bg-secondary/10 px-6 py-3 border-b flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <CalendarIcon className="w-3.5 h-3.5 text-primary" />
                          <span className="text-[10px] font-black text-primary uppercase">
                            {format(startTime, "dd 'de' MMMM", { locale: ptBR })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-[10px] font-black text-muted-foreground uppercase">
                            {format(startTime, "HH:mm")}
                          </span>
                        </div>
                      </div>
                      <CardContent className="p-6 space-y-4">
                        <div className="space-y-1">
                          <h4 className="text-lg font-black leading-tight">{apt.clientName}</h4>
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-bold">
                            <Phone className="w-3 h-3 text-primary" />
                            {apt.clientPhone ? maskPhone(apt.clientPhone) : "Sem telefone"}
                          </p>
                        </div>

                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-1.5">
                            {aptServices?.map(s => (
                              <Badge key={s.id} variant="secondary" className="text-[9px] font-black uppercase border-2 py-0.5 px-2 bg-white">
                                <Scissors className="w-2.5 h-2.5 mr-1" />
                                {s.name}
                              </Badge>
                            ))}
                          </div>
                          
                          <div className="pt-3 border-t flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">Profissional</span>
                            <span className="text-[10px] font-black uppercase text-accent-foreground bg-accent/10 px-3 py-1 rounded-full border border-accent/20">
                              {employee?.name || "---"}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <Card className="col-span-full border-none shadow-xl rounded-3xl py-20 bg-white">
                  <div className="flex flex-col items-center justify-center text-center px-4">
                    <History className="w-12 h-12 text-muted-foreground/20 mb-4" />
                    <p className="text-muted-foreground font-bold uppercase text-xs">Nenhum histórico encontrado com os filtros atuais.</p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
