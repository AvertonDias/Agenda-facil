"use client";

import { useMemo } from "react";
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

export default function AdminReports() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

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
    const thirtyDaysAgo = subDays(now, 30);

    // Filtrar agendamentos dos últimos 30 dias para métricas mensais
    const recentAppointments = allAppointments.filter(apt => {
      if (!apt.startTime) return false;
      const date = parseISO(apt.startTime);
      return isWithinInterval(date, { start: thirtyDaysAgo, end: now });
    });

    // Calcular faturamento total (soma de todos os serviços de cada agendamento)
    const calculateAptTotal = (apt: any) => {
      const serviceIds = apt.serviceIds || [apt.serviceId].filter(Boolean);
      return serviceIds.reduce((acc: number, sId: string) => {
        const service = allServices.find(s => s.id === sId);
        return acc + (service?.basePrice || 0);
      }, 0);
    };

    const totalRevenue = allAppointments.reduce((acc, apt) => acc + calculateAptTotal(apt), 0);
    
    // Contagem de clientes únicos (baseado em telefone ou nome)
    const uniqueClients = new Set(allAppointments.map(apt => apt.clientPhone || apt.clientName)).size;

    // Gerar dados para o gráfico (últimos 7 dias)
    const last7Days = eachDayOfInterval({
      start: subDays(startOfDay(now), 6),
      end: startOfDay(now)
    });

    const chartData = last7Days.map(day => {
      const dayAppointments = allAppointments.filter(apt => {
        if (!apt.startTime) return false;
        const aptDate = parseISO(apt.startTime);
        return format(aptDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
      });

      const dayRevenue = dayAppointments.reduce((acc, apt) => acc + calculateAptTotal(apt), 0);

      return {
        name: format(day, 'EEE', { locale: ptBR }),
        faturamento: dayRevenue,
        atendimentos: dayAppointments.length
      };
    });

    return {
      totalRevenue,
      appointmentCount: allAppointments.length,
      clientCount: uniqueClients,
      chartData
    };
  }, [allAppointments, allServices]);

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
        <Button variant="outline" className="gap-2 h-11" onClick={() => window.print()}>
          <Download className="w-4 h-4" />
          Imprimir Relatório
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-50 rounded-xl text-green-600">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Faturamento Total</p>
                <h3 className="text-2xl font-bold">R$ {stats?.totalRevenue.toFixed(2) || '0,00'}</h3>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3" /> acumulado histórico
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
                <p className="text-sm text-muted-foreground font-medium">Clientes Únicos</p>
                <h3 className="text-2xl font-bold">{stats?.clientCount || 0}</h3>
                <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                   Na sua base de dados
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
                  Agendamentos realizados
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-xl bg-white rounded-2xl overflow-hidden">
          <CardHeader className="bg-secondary/10 border-b">
            <CardTitle className="text-lg font-black uppercase tracking-widest text-primary">Faturamento (Últimos 7 dias)</CardTitle>
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
            <CardTitle className="text-lg font-black uppercase tracking-widest text-accent">Volume de Atendimentos</CardTitle>
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
