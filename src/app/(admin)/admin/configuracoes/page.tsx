"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Save, Building2, Bell, Shield, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminSettings() {
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: "Configurações salvas",
      description: "Suas alterações foram aplicadas com sucesso.",
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as preferências e informações do seu salão.</p>
      </div>

      <Tabs defaultValue="perfil" className="space-y-6">
        <TabsList className="bg-background border">
          <TabsTrigger value="perfil" className="gap-2">
            <Building2 className="w-4 h-4" />
            Perfil do Salão
          </TabsTrigger>
          <TabsTrigger value="notificacoes" className="gap-2">
            <Bell className="w-4 h-4" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="agendamento" className="gap-2">
            <Smartphone className="w-4 h-4" />
            Regras de Agendamento
          </TabsTrigger>
        </TabsList>

        <TabsContent value="perfil">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Informações Gerais</CardTitle>
              <CardDescription>Estes dados aparecerão para seus clientes na página de agendamento.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Nome do Estabelecimento</Label>
                  <Input defaultValue="AgendaFácil Pro Studio" />
                </div>
                <div className="space-y-2">
                  <Label>Telefone / WhatsApp</Label>
                  <Input defaultValue="(11) 99999-9999" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Endereço Completo</Label>
                  <Input defaultValue="Rua das Flores, 123 - São Paulo, SP" />
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <Button onClick={handleSave} className="gap-2">
                  <Save className="w-4 h-4" />
                  Salvar Alterações
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notificacoes">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Automações de WhatsApp</CardTitle>
              <CardDescription>Configure quais mensagens automáticas deseja enviar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Confirmação Instantânea</Label>
                    <p className="text-sm text-muted-foreground">Envia mensagem assim que o cliente agenda.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Lembrete 24h antes</Label>
                    <p className="text-sm text-muted-foreground">Reduza faltas com um lembrete um dia antes.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Lembrete 3h antes</Label>
                    <p className="text-sm text-muted-foreground">Um aviso final para garantir a pontualidade.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <Button onClick={handleSave} className="gap-2">
                  <Save className="w-4 h-4" />
                  Salvar Alterações
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agendamento">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Regras de Negócio</CardTitle>
              <CardDescription>Defina como seus clientes podem agendar horários.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Antecedência Mínima (Horas)</Label>
                  <Input type="number" defaultValue="2" />
                </div>
                <div className="space-y-2">
                  <Label>Intervalo entre Agendamentos (Minutos)</Label>
                  <Input type="number" defaultValue="15" />
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <Button onClick={handleSave} className="gap-2">
                  <Save className="w-4 h-4" />
                  Salvar Alterações
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
