"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  Calendar as CalendarIcon, 
  DollarSign, 
  TrendingUp,
  Clock,
  CheckCircle2,
  Loader2,
  Plus
} from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function AdminDashboard() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  // Queries protegidas por check rigoroso de usuário
  const appointmentsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid || isUserLoading) return null;
    return query(
      collection(db, "empresas", user.uid, "agendamentos"),
      orderBy("time", "asc"),
      limit(5)
    );
  }, [db, user?.uid, isUserLoading]);

  const servicesQuery = useMemoFirebase(() => {
    if (!db || !user?.uid || isUserLoading) return null;
    return collection(db, "empresas", user.uid, "servicos");
  }, [db, user?.uid, isUserLoading]);

  const collaboratorsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid || isUserLoading) return null;
    return collection(db, "empresas", user.uid, "colaboradores");
  }, [db, user?.uid, isUserLoading]);

  const { data: appointments, isLoading: loadingApts } = useCollection(appointmentsQuery);
  const { data: services, isLoading: loadingServices } = useCollection(servicesQuery);
  const { data: collaborators, isLoading: loadingColabs } = useCollection(collaboratorsQuery);

  const isInitialLoading = isUserLoading || loadingApts || loadingServices || loadingColabs;

  // Cálculos básicos baseados nos dados reais
  const totalFaturamento = appointments?.reduce((acc, apt) => {
    const service = services?.find(s => s.id === apt.serviceId);
    return acc + (service?.basePrice || 0);
  }, 0) || 0;

  const stats = [
    { 
      label: "Agendamentos Hoje", 
      value: appointments?.length.toString() || "0", 
      icon: CalendarIcon, 
      color: "text-blue-500", 
      bg: "bg-blue-50" 
    },
    { 
      label: "Faturamento Previsto", 
      value: `R$ ${totalFaturamento.toFixed(2)}`, 
      icon: DollarSign, 
      color: "text-green-600", 
      bg: "bg-green-50" 
    },
    { 
      label: "Profissionais", 
      value: collaborators?.length.toString() || "0", 
      icon: Users, 
      color: "text-purple-500", 
      bg: "bg-purple-50" 
    },
    { 
      label: "Serviços Ativos", 
      value: services?.filter(s => s.isActive).length.toString() || "0", 
      icon: TrendingUp, 
      color: "text-orange-500", 
      bg: "bg-orange-50" 
    },
  ];

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Olá, {user?.displayName?.split(' ')[0] || 'Administrador'} 👋</h1>
          <p className="text-muted-foreground">Aqui está o resumo do seu estabelecimento hoje.</p>
        </div>
        <Link href="/admin/agenda">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Agendamento
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-none shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                </div>
                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Próximos Agendamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {appointments && appointments.length > 0 ? (
                appointments.map((apt) => {
                  const service = services?.find(s => s.id === apt.serviceId);
                  const employee = collaborators?.find(e => e.id === apt.employeeId);
                  return (
                    <div key={apt.id} className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg border border-secondary transition-hover hover:border-primary/50">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center font-bold text-primary border shadow-sm">
                          {apt.time}
                        </div>
                        <div>
                          <p className="font-semibold">{apt.clientName}</p>
                          <p className="text-xs text-muted-foreground">
                            {service?.name || 'Serviço'} com {employee?.name || 'Profissional'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-1 rounded-full uppercase font-bold ${apt.status === 'confirmado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {apt.status || 'pendente'}
                        </span>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-12 flex flex-col items-center justify-center space-y-3">
                  <CalendarIcon className="w-12 h-12 text-muted-foreground/20" />
                  <p className="text-muted-foreground">Nenhum agendamento para hoje.</p>
                  <Link href="/admin/agenda">
                    <Button variant="outline" size="sm">Ir para Agenda</Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              Destaques
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
              <p className="text-sm font-medium text-primary mb-1">Capacidade de Atendimento</p>
              <p className="font-bold">{collaborators?.length || 0} Profissionais</p>
              <p className="text-xs text-muted-foreground">Disponíveis no momento</p>
            </div>
            <div className="p-4 bg-accent/5 rounded-lg border border-accent/10">
              <p className="text-sm font-medium text-accent mb-1">Catálogo</p>
              <p className="font-bold">{services?.length || 0} Serviços</p>
              <p className="text-xs text-muted-foreground">Configurados para venda</p>
            </div>
            <div className="bg-secondary/20 p-4 rounded-lg border border-dashed text-center">
              <p className="text-xs text-muted-foreground">Dica: Complete seu catálogo para atrair mais clientes.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}