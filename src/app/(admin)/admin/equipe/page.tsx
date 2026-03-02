"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Mail, Phone, MoreHorizontal, UserCheck } from "lucide-react";
import { SALON_DATA } from "@/lib/mock-data";

export default function AdminEquipe() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold">Equipe</h1>
          <p className="text-muted-foreground">Gerencie os profissionais do seu salão.</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Colaborador
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SALON_DATA.employees.map((employee) => (
          <Card key={employee.id} className="border-none shadow-sm overflow-hidden group">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <Avatar className="w-16 h-16 border-2 border-background shadow-sm">
                  <AvatarImage src={`https://picsum.photos/seed/${employee.id}/100/100`} />
                  <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-4">
                <CardTitle className="text-xl">{employee.name}</CardTitle>
                <p className="text-sm text-primary font-medium">{employee.role}</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {employee.services.map(sId => {
                  const service = SALON_DATA.services.find(s => s.id === sId);
                  return (
                    <Badge key={sId} variant="secondary" className="font-normal">
                      {service?.name}
                    </Badge>
                  );
                })}
              </div>
              
              <div className="pt-4 border-t space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  (11) 98888-0000
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <UserCheck className="w-4 h-4" />
                  Ativo no Sistema
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
