
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
import { format, parseISO } from "date-fns";
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
  Phone
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn, maskPhone } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminHistory() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState("");

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

  // Filtra agendamentos concluídos
  const completedAppointments = useMemo(() => {
    if (!allAppointments) return [];
    return allAppointments
      .filter(apt => apt.status === 'concluido')
      .filter(apt => 
        apt.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.clientPhone?.includes(searchTerm)
      )
      .sort((a, b) => b.startTime.localeCompare(a.startTime));
  }, [allAppointments, searchTerm]);

  // Ranking de clientes baseado em atendimentos concluídos
  const clientRanking = useMemo(() => {
    if (!allAppointments) return [];
    const counts: Record<string, { name: string, phone: string, count: number }> = {};
    
    allAppointments
      .filter(apt => apt.status === 'concluido')
      .forEach(apt => {
        const key = apt.clientPhone?.replace(/\D/g, '') || apt.clientName;
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
    <div className="space-y-8 max-w-5xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-primary flex items-center gap-2">
            <History className="w-8 h-8" />
            Histórico
          </h1>
          <p className="text-muted-foreground font-medium">Veja o registro de todos os serviços finalizados.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ranking de Clientes */}
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
                        <p className="text-[10px] text-muted-foreground font-bold">{maskPhone(client.phone)}</p>
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

        {/* Lista de Histórico */}
        <div className="lg:col-span-2 space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar cliente ou telefone no histórico..." 
              className="pl-12 h-12 border-2 rounded-2xl font-bold bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white">
            <CardHeader className="bg-secondary/10 border-b">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Atendimentos Finalizados
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/5 border-none">
                    <TableHead className="font-black uppercase text-[10px]">Data/Hora</TableHead>
                    <TableHead className="font-black uppercase text-[10px]">Cliente</TableHead>
                    <TableHead className="font-black uppercase text-[10px]">Serviços</TableHead>
                    <TableHead className="font-black uppercase text-[10px]">Profissional</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedAppointments.length > 0 ? (
                    completedAppointments.map((apt) => {
                      const aptServices = services?.filter(s => (apt.serviceIds || []).includes(s.id));
                      const employee = collaborators?.find(c => c.id === apt.employeeId);
                      return (
                        <TableRow key={apt.id} className="hover:bg-secondary/5 border-b border-secondary/10">
                          <TableCell className="py-4">
                            <div className="flex flex-col">
                              <span className="font-black text-xs text-primary">{format(parseISO(apt.startTime), "dd/MM/yy")}</span>
                              <span className="text-[10px] text-muted-foreground font-bold">{format(parseISO(apt.startTime), "HH:mm")}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-bold text-sm">{apt.clientName}</span>
                              <span className="text-[10px] text-muted-foreground">{maskPhone(apt.clientPhone)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {aptServices?.map(s => (
                                <Badge key={s.id} variant="secondary" className="text-[8px] font-black uppercase border leading-none py-0.5 px-1.5">
                                  {s.name}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-[10px] font-black uppercase text-accent-foreground bg-accent/10 px-2 py-1 rounded-full border border-accent/20">
                              {employee?.name || "---"}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="py-20 text-center">
                        <History className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                        <p className="text-muted-foreground font-bold uppercase text-xs">Nenhum histórico encontrado.</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
