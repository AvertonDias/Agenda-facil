"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Save, Building2, Bell, Smartphone, Loader2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking } from "@/firebase";
import { doc, serverTimestamp } from "firebase/firestore";

export default function AdminSettings() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // States para os dados do formulário
  const [salonName, setSalonName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const companyRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "empresas", user.uid);
  }, [db, user]);

  const { data: companyData, isLoading } = useDoc(companyRef);

  useEffect(() => {
    if (companyData) {
      setSalonName(companyData.name || "");
      setPhone(companyData.phoneNumber || "");
      setAddress(companyData.address || "");
    }
  }, [companyData]);

  const handleSave = () => {
    if (!user || !companyRef) return;
    
    setLoading(true);
    const data = {
      id: user.uid,
      name: salonName,
      phoneNumber: phone,
      address: address,
      ownerId: user.uid,
      updatedAt: serverTimestamp(),
    };

    setDocumentNonBlocking(companyRef, data, { merge: true });
    
    // Pequeno delay para feedback visual
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Configurações salvas",
        description: "As informações da sua empresa foram atualizadas.",
      });
    }, 500);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as preferências e informações do seu estabelecimento.</p>
      </div>

      <Tabs defaultValue="perfil" className="space-y-6">
        <TabsList className="bg-background border w-full sm:w-auto justify-start h-auto p-1 flex-wrap">
          <TabsTrigger value="perfil" className="gap-2 px-4 py-2">
            <Building2 className="w-4 h-4" />
            Perfil do Salão
          </TabsTrigger>
          <TabsTrigger value="notificacoes" className="gap-2 px-4 py-2">
            <Bell className="w-4 h-4" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="regras" className="gap-2 px-4 py-2">
            <Clock className="w-4 h-4" />
            Regras de Agendamento
          </TabsTrigger>
        </TabsList>

        <TabsContent value="perfil" className="space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Informações Gerais</CardTitle>
              <CardDescription>Estes dados aparecerão para seus clientes na página de agendamento.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Nome do Estabelecimento</Label>
                  <Input 
                    value={salonName} 
                    onChange={(e) => setSalonName(e.target.value)} 
                    placeholder="Ex: Studio VIP" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone / WhatsApp</Label>
                  <Input 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    placeholder="(11) 99999-9999" 
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Endereço Completo</Label>
                  <Input 
                    value={address} 
                    onChange={(e) => setAddress(e.target.value)} 
                    placeholder="Rua, Número, Bairro - Cidade, UF" 
                  />
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <Button onClick={handleSave} className="gap-2 w-full sm:w-auto" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
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
              <CardDescription>Configure como e quando seus clientes recebem mensagens.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label className="text-base">Confirmação Instantânea</Label>
                    <p className="text-sm text-muted-foreground">Envia uma mensagem automática assim que o cliente finaliza o agendamento.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label className="text-base">Lembrete 24h antes</Label>
                    <p className="text-sm text-muted-foreground">Reduza faltas enviando um lembrete automático um dia antes do serviço.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <Button onClick={() => toast({ title: "Preferências salvas" })} className="gap-2 w-full sm:w-auto">
                  <Save className="w-4 h-4" />
                  Salvar Notificações
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regras">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Regras de Negócio</CardTitle>
              <CardDescription>Defina como sua agenda deve se comportar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Tempo de Antecedência Mínima (horas)</Label>
                  <Input type="number" defaultValue="2" />
                </div>
                <div className="space-y-2">
                  <Label>Intervalo entre Agendamentos (minutos)</Label>
                  <Input type="number" defaultValue="15" />
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <Button onClick={() => toast({ title: "Regras atualizadas" })} className="gap-2 w-full sm:w-auto">
                  <Save className="w-4 h-4" />
                  Salvar Regras
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
