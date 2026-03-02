"use client";

import { useState } from "react";
import { Plus, Search, Scissors, Clock, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { SALON_DATA } from "@/lib/mock-data";

export default function AdminServices() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredServices = SALON_DATA.services.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold">Serviços</h1>
          <p className="text-muted-foreground">Gerencie o catálogo de serviços do seu salão.</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Serviço
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input 
          className="pl-10 max-w-md" 
          placeholder="Buscar serviço ou categoria..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service) => (
          <Card key={service.id} className="overflow-hidden border-none shadow-sm hover:ring-2 hover:ring-primary/20 transition-all cursor-pointer">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Scissors className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs font-bold text-primary uppercase tracking-wider bg-primary/5 px-2 py-1 rounded">
                  {service.category}
                </span>
              </div>
              <h3 className="text-lg font-bold mb-4">{service.name}</h3>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {service.duration} min
                </div>
                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  <DollarSign className="w-4 h-4" />
                  R$ {service.price.toFixed(2)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}