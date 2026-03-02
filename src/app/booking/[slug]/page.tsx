
"use client";

import * as React from "react";
import { useState } from "react";
import { SALON_DATA } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar as CalendarIcon, Clock, Scissors, User, ArrowRight, ChevronLeft, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function BookingPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = React.use(props.params);
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const steps = ["Serviço", "Profissional", "Horário", "Confirmar"];
  const progress = (step / steps.length) * 100;

  const currentService = SALON_DATA.services.find(s => s.id === selectedService);
  const currentEmployee = SALON_DATA.employees.find(e => e.id === selectedEmployee);

  const nextStep = () => setStep(s => Math.min(s + 1, steps.length));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  if (step === 4 && selectedTime) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-none shadow-xl text-center">
          <CardContent className="pt-12 pb-12 space-y-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Agendamento Realizado!</h1>
              <p className="text-muted-foreground mt-2">Enviamos uma confirmação para o seu WhatsApp.</p>
            </div>
            <div className="bg-secondary/50 p-4 rounded-xl text-left space-y-2">
              <p className="text-sm font-semibold">Resumo:</p>
              <p className="text-sm">{currentService?.name} com {currentEmployee?.name}</p>
              <p className="text-sm font-bold">Hoje, {selectedTime}</p>
            </div>
            <Button className="w-full h-12 rounded-full text-lg" onClick={() => window.location.reload()}>
              Fechar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-white p-6 border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          {step > 1 && (
            <Button variant="ghost" size="icon" onClick={prevStep}>
              <ChevronLeft className="w-6 h-6" />
            </Button>
          )}
          <div className="flex-1">
            <h1 className="font-bold text-lg">{SALON_DATA.name}</h1>
            <p className="text-xs text-muted-foreground">{steps[step - 1]}</p>
          </div>
          <div className="w-24">
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-2xl mx-auto w-full pb-24">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">O que você gostaria de fazer?</h2>
            {SALON_DATA.services.map((service) => (
              <Card 
                key={service.id} 
                className={`cursor-pointer transition-all border-none ${selectedService === service.id ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-secondary/20'}`}
                onClick={() => { setSelectedService(service.id); nextStep(); }}
              >
                <CardContent className="p-4 flex justify-between items-center">
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                      <Scissors className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold">{service.name}</p>
                      <p className="text-xs text-muted-foreground">{service.duration} min • R$ {service.price}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Escolha um profissional</h2>
            {SALON_DATA.employees.filter(e => selectedService && e.services.includes(selectedService)).map((employee) => (
              <Card 
                key={employee.id} 
                className={`cursor-pointer transition-all border-none ${selectedEmployee === employee.id ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-secondary/20'}`}
                onClick={() => { setSelectedEmployee(employee.id); nextStep(); }}
              >
                <CardContent className="p-4 flex justify-between items-center">
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center text-accent">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold">{employee.name}</p>
                      <p className="text-xs text-muted-foreground">{employee.role}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Qual o melhor horário?</h2>
            <div className="grid grid-cols-3 gap-3">
              {['09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00', '16:00'].map((time) => (
                <Button 
                  key={time} 
                  variant={selectedTime === time ? "default" : "outline"}
                  className="h-14 text-lg font-bold rounded-xl"
                  onClick={() => { setSelectedTime(time); nextStep(); }}
                >
                  {time}
                </Button>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t p-6 md:hidden">
        <div className="flex justify-between items-center max-w-2xl mx-auto">
          <div>
            <p className="text-xs text-muted-foreground">Total:</p>
            <p className="font-bold text-lg">R$ {currentService?.price || 0}</p>
          </div>
          {step < 3 && (
            <Button disabled={!selectedService && step === 1} onClick={nextStep}>
              Próximo
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}
