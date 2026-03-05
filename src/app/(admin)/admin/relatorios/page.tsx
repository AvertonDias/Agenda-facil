"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { TrendingUp, DollarSign, Users, Calendar, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { format, subDays, startOfDay, isWithinInterval, parseISO, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminReports() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [daysRange, setDaysRange] = useState("7");

  // Queries para buscar dados reais
  const appointmentsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return collection(db, "empresas", user.uid, "agendamentos");
  }, [db, user?.uid]);

  const servicesQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return collection(db, "empresas", user.uid, "servicos");
  }, [db, user?.uid]);

  const { data: allAppointments, isLoading: loadingApts } = useCollection(appointmentsQuery);
  const { data: allServices, isLoading: loadingServices } = useCollection(servicesQuery);

  const isInitialLoading = isUserLoading || loadingApts || loadingServices;

  // Processamento de dados para relatórios
  const stats = useMemo(() => {
    if (!allAppointments || !allServices) return null;

    const now = new Date();
    const days = parseInt(daysRange);
    const startDate = subDays(startOfDay(now), days - 1);

    // Calcular faturamento de um agendamento (soma de todos os serviços)
    const calculateAptTotal = (apt: any) => {
      const serviceIds = apt.serviceIds || [apt.serviceId].filter(Boolean);
      return serviceIds.reduce((acc: number, sId: string) => {
        const service = allServices.find(s => s.id === sId);
        return acc + (service?.basePrice || 0);
      }, 0);
    };

    // Filtrar agendamentos do período selecionado
    const periodAppointments = allAppointments.filter(apt => {
      if (!apt.startTime) return false;
      const date = parseISO(apt.startTime);
      return isWithinInterval(date, { start: startDate, end: now });
    });

    const totalRevenue = periodAppointments.reduce((acc, apt) => acc + calculateAptTotal(apt), 0);
    
    // Contagem de clientes únicos no período
    const uniqueClients = new Set(periodAppointments.map(apt => apt.clientPhone || apt.clientName)).size;

    // Gerar dados para o gráfico (intervalo selecionado)
    const intervalDays = eachDayOfInterval({
      start: startDate,
      end: startOfDay(now)
    });

    const chartData = intervalDays.map(day => {
      const dayAppointments = allAppointments.filter(apt => {
        if (!apt.startTime) return false;
        const aptDate = parseISO(apt.startTime);
        return format(aptDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
      });

      const dayRevenue = dayAppointments.reduce((acc, apt) => acc + calculateAptTotal(apt), 0);

      return {
        name: format(day, 'dd/MM'),
        faturamento: dayRevenue,
        atendimentos: dayAppointments.length
      };
    });

    return {
      totalRevenue,
      appointmentCount: periodAppointments.length,
      clientCount: uniqueClients,
      chartData
    };
  }, [allAppointments, allServices, daysRange]);

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground">Acompanhe o desempenho real do seu negócio.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select value={daysRange} onValueChange={setDaysRange}>
            <SelectTrigger className="w-full sm:w-[200px] h-11 border-2 font-bold rounded-xl bg-white">
              <SelectValue placeholder="Escolher período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="15">Últimos 15 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="60">Últimos 60 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2 h-11 border-2 font-bold rounded-xl px-6" onClick={() => window.print()}>
            <Download className="w-4 h-4" />
            Imprimir
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-50 rounded-xl text-green-600">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Faturamento no Período</p>
                <h3 className="text-2xl font-bold">R$ {stats?.totalRevenue.toFixed(2) || '0,00'}</h3>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3" /> acumulado do filtro
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Clientes Atendidos</p>
                <h3 className="text-2xl font-bold">{stats?.clientCount || 0}</h3>
                <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                   Clientes únicos no período
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Total de Atendimentos</p>
                <h3 className="text-2xl font-bold">{stats?.appointmentCount || 0}</h3>
                <p className="text-xs text-purple-600 flex items-center gap-1 mt-1">
                  Agendamentos no período
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-xl bg-white rounded-2xl overflow-hidden">
          <CardHeader className="bg-secondary/10 border-b">
            <CardTitle className="text-lg font-black uppercase tracking-widest text-primary">Evolução do Faturamento (Período)</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.chartData || []}>
                  <defs>
                    <linearGradient id="colorFat" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} tickFormatter={(v) => `R$${v}`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                    formatter={(value: any) => [`R$ ${value.toFixed(2)}`, "Faturamento"]}
                  />
                  <Area type="monotone" dataKey="faturamento" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorFat)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-white rounded-2xl overflow-hidden">
          <CardHeader className="bg-secondary/10 border-b">
            <CardTitle className="text-lg font-black uppercase tracking-widest text-accent">Volume Diário (Período)</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.chartData || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                    cursor={{fill: '#f8faf9'}}
                    formatter={(value: any) => [value, "Atendimentos"]}
                  />
                  <Bar dataKey="atendimentos" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
