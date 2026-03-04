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
  MoreVertical
} from "lucide-react";
import { ptBR } from "date-fns/locale";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function AdminAgenda() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

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
        <Button className="gap-2 shadow-lg hover:shadow-xl transition-all">
          <Plus className="w-4 h-4" />
          Agendar Cliente
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
        {/* Lado Esquerdo: Seletor de Data */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                locale={ptBR}
                className="w-full rounded-none p-4"
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
            </CardContent>
          </Card>
        </div>

        {/* Lado Direito: Linha do Tempo/Lista */}
        <div className="lg:col-span-8">
          <Card className="border-none shadow-sm h-full flex flex-col">
            <CardHeader className="border-b bg-card/50 sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">
                    {date ? format(date, "EEEE, dd 'de' MMMM", { locale: ptBR }) : 'Selecione uma data'}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">Horários de hoje</p>
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
                                  <p className="text-sm text-muted-foreground mt-1">{apt.clientPhone}</p>
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
                                  <span className="ml-auto font-bold text-foreground">R$ {service?.basePrice?.toFixed(2)}</span>
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
                      <Button variant="outline" className="mt-6 gap-2 border-dashed">
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