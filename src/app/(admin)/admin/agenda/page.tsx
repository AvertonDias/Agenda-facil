"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Clock, User, Scissors, Loader2 } from "lucide-react";
import { ptBR } from "date-fns/locale";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, orderBy } from "firebase/firestore";
import { format } from "date-fns";

export default function AdminAgenda() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  // Queries protegidas por check rigoroso de usuário e loading
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
      where("date", "==", dateStr),
      orderBy("time", "asc")
    );
  }, [db, user?.uid, date, isUserLoading]);

  const { data: services } = useCollection(servicesQuery);
  const { data: collaborators } = useCollection(collaboratorsQuery);
  const { data: appointments, isLoading: loadingApts } = useCollection(appointmentsQuery);

  const isInitialLoading = isUserLoading || loadingApts;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold">Agenda</h1>
          <p className="text-muted-foreground">Gerencie seus horários e compromissos.</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Agendamento
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <Card className="lg:col-span-4 border-none shadow-sm h-fit">
          <CardContent className="p-4">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              locale={ptBR}
              className="rounded-md border-none"
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-8 border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">
              Compromissos para {date ? format(date, "dd 'de' MMMM", { locale: ptBR }) : 'Selecione uma data'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isInitialLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                {appointments?.map((apt) => {
                  const service = services?.find(s => s.id === apt.serviceId);
                  const employee = collaborators?.find(e => e.id === apt.employeeId);
                  return (
                    <div key={apt.id} className="group relative flex items-start gap-4 p-4 rounded-xl border bg-card hover:border-primary/50 transition-colors">
                      <div className="flex flex-col items-center justify-center w-16 h-16 rounded-lg bg-secondary/50 text-primary font-bold">
                        <span className="text-lg">{apt.time}</span>
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between">
                          <h4 className="font-bold">{apt.clientName}</h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${apt.status === 'confirmado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {apt.status || 'pendente'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Scissors className="w-3.5 h-3.5" />
                            {service?.name || 'Serviço'}
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" />
                            {employee?.name || 'Profissional'}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        Detalhes
                      </Button>
                    </div>
                  );
                })}
                {(!appointments || appointments.length === 0) && (
                  <div className="text-center py-12">
                    <Clock className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhum agendamento para este dia.</p>
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