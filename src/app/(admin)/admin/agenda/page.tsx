"use client";

import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Clock, User, Scissors, ChevronLeft, ChevronRight } from "lucide-react";
import { SALON_DATA } from "@/lib/mock-data";
import { ptBR } from "date-fns/locale";

export default function AdminAgenda() {
  const [date, setDate] = useState<Date | undefined>(new Date());

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
              Compromissos para {date?.toLocaleDateString('pt-BR')}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {SALON_DATA.appointments.map((apt) => {
                const service = SALON_DATA.services.find(s => s.id === apt.serviceId);
                const employee = SALON_DATA.employees.find(e => e.id === apt.employeeId);
                return (
                  <div key={apt.id} className="group relative flex items-start gap-4 p-4 rounded-xl border bg-card hover:border-primary/50 transition-colors">
                    <div className="flex flex-col items-center justify-center w-16 h-16 rounded-lg bg-secondary/50 text-primary font-bold">
                      <span className="text-lg">{apt.time}</span>
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between">
                        <h4 className="font-bold">{apt.clientName}</h4>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${apt.status === 'confirmado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {apt.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Scissors className="w-3.5 h-3.5" />
                          {service?.name}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          {employee?.name}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      Detalhes
                    </Button>
                  </div>
                );
              })}
              {SALON_DATA.appointments.length === 0 && (
                <div className="text-center py-12">
                  <Clock className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum agendamento para este dia.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
