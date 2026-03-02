"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";
import { TrendingUp, DollarSign, Users, Calendar, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const data = [
  { name: "Seg", faturamento: 400, atendimentos: 10 },
  { name: "Ter", faturamento: 600, atendimentos: 15 },
  { name: "Qua", faturamento: 500, atendimentos: 12 },
  { name: "Qui", faturamento: 800, atendimentos: 20 },
  { name: "Sex", faturamento: 1200, atendimentos: 25 },
  { name: "Sáb", faturamento: 1500, atendimentos: 30 },
  { name: "Dom", faturamento: 200, atendimentos: 5 },
];

export default function AdminReports() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground">Acompanhe o desempenho do seu negócio.</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Exportar PDF
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-50 rounded-xl text-green-600">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Faturamento Mensal</p>
                <h3 className="text-2xl font-bold">R$ 15.420,00</h3>
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3" /> +12% vs mês anterior
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Novos Clientes</p>
                <h3 className="text-2xl font-bold">48</h3>
                <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                   Média de 1.6 por dia
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Agendamentos</p>
                <h3 className="text-2xl font-bold">186</h3>
                <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                  5 cancelamentos (2%)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Faturamento por Dia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorFat" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="faturamento" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorFat)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Volume de Atendimentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    cursor={{fill: '#f8faf9'}}
                  />
                  <Bar dataKey="atendimentos" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
