"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  Calendar as CalendarIcon, 
  DollarSign, 
  TrendingUp,
  Clock,
  CheckCircle2
} from "lucide-react";
import { SALON_DATA } from "@/lib/mock-data";

export default function AdminDashboard() {
  const stats = [
    { label: "Agendamentos Hoje", value: "12", icon: CalendarIcon, color: "text-blue-500", bg: "bg-blue-50" },
    { label: "Faturamento Previsto", value: "R$ 850,00", icon: DollarSign, color: "text-green-600", bg: "bg-green-50" },
    { label: "Novos Clientes", value: "4", icon: Users, color: "text-purple-500", bg: "bg-purple-50" },
    { label: "Taxa de Ocupação", value: "82%", icon: TrendingUp, color: "text-orange-500", bg: "bg-orange-50" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Olá, Administrador 👋</h1>
        <p className="text-muted-foreground">Aqui está o resumo do seu salão hoje.</p>
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
              {SALON_DATA.appointments.map((apt) => {
                const service = SALON_DATA.services.find(s => s.id === apt.serviceId);
                const employee = SALON_DATA.employees.find(e => e.id === apt.employeeId);
                return (
                  <div key={apt.id} className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg border border-secondary">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center font-bold text-primary border">
                        {apt.time}
                      </div>
                      <div>
                        <p className="font-semibold">{apt.clientName}</p>
                        <p className="text-xs text-muted-foreground">{service?.name} com {employee?.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-1 rounded-full uppercase font-bold ${apt.status === 'confirmado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {apt.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              Destaques do Dia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
              <p className="text-sm font-medium text-primary mb-1">Mais Produtivo</p>
              <p className="font-bold">Ricardo Silva</p>
              <p className="text-xs text-muted-foreground">8 serviços realizados</p>
            </div>
            <div className="p-4 bg-accent/5 rounded-lg border border-accent/10">
              <p className="text-sm font-medium text-accent mb-1">Serviço em Alta</p>
              <p className="font-bold">Corte Masculino</p>
              <p className="text-xs text-muted-foreground">Represents 45% do faturamento</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}