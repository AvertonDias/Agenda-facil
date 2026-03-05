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

  // States para Perfil
  const [salonName, setSalonName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // States para Notificações
  const [notifyInstant, setNotifyInstant] = useState(true);
  const [notifyReminder24h, setNotifyReminder24h] = useState(true);

  // States para Regras de Negócio
  const [minLeadTimeHours, setMinLeadTimeHours] = useState("2");
  const [slotIntervalMinutes, setSlotIntervalMinutes] = useState("30");

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
      setNotifyInstant(companyData.notifyInstant ?? true);
      setNotifyReminder24h(companyData.notifyReminder24h ?? true);
      setMinLeadTimeHours(String(companyData.minLeadTimeHours ?? "2"));
      setSlotIntervalMinutes(String(companyData.slotIntervalMinutes ?? "30"));
    }
  }, [companyData]);

  const handleSaveAll = () => {
    if (!user || !companyRef) return;
    
    setLoading(true);
    const data = {
      id: user.uid,
      name: salonName,
      phoneNumber: phone,
      address: address,
      notifyInstant,
      notifyReminder24h,
      minLeadTimeHours: parseInt(minLeadTimeHours) || 0,
      slotIntervalMinutes: parseInt(slotIntervalMinutes) || 30,
      ownerId: user.uid,
      updatedAt: serverTimestamp(),
    };

    setDocumentNonBlocking(companyRef, data, { merge: true });
    
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Configurações atualizadas!",
        description: "Suas preferências foram salvas e aplicadas à agenda.",
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">Gerencie as preferências do seu estabelecimento.</p>
        </div>
        <Button onClick={handleSaveAll} className="gap-2 shadow-lg h-12 px-8" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar Tudo
        </Button>
      </div>

      <Tabs defaultValue="perfil" className="space-y-6">
        <TabsList className="bg-background border w-full sm:w-auto justify-start h-auto p-1 flex-wrap">
          <TabsTrigger value="perfil" className="gap-2 px-4 py-2">
            <Building2 className="w-4 h-4" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="notificacoes" className="gap-2 px-4 py-2">
            <Bell className="w-4 h-4" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="regras" className="gap-2 px-4 py-2">
            <Clock className="w-4 h-4" />
            Regras de Agenda
          </TabsTrigger>
        </TabsList>

        <TabsContent value="perfil" className="space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Dados do Salão</CardTitle>
              <CardDescription>Informações visíveis para seus clientes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Nome do Estabelecimento</Label>
                  <Input 
                    value={salonName} 
                    onChange={(e) => setSalonName(e.target.value)} 
                    placeholder="Ex: Studio VIP" 
                    className="h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp</Label>
                  <Input 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    placeholder="(11) 99999-9999" 
                    className="h-12"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Endereço</Label>
                  <Input 
                    value={address} 
                    onChange={(e) => setAddress(e.target.value)} 
                    placeholder="Rua, Número, Bairro - Cidade, UF" 
                    className="h-12"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notificacoes">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Automações</CardTitle>
              <CardDescription>Configure os envios automáticos via WhatsApp.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label className="text-base">Confirmação Instantânea</Label>
                    <p className="text-sm text-muted-foreground">Envia mensagem assim que o cliente agenda.</p>
                  </div>
                  <Switch checked={notifyInstant} onCheckedChange={setNotifyInstant} />
                </div>
                <Separator />
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <Label className="text-base">Lembrete 24h</Label>
                    <p className="text-sm text-muted-foreground">Reduza faltas enviando um lembrete um dia antes.</p>
                  </div>
                  <Switch checked={notifyReminder24h} onCheckedChange={setNotifyReminder24h} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regras">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle>Regras de Negócio</CardTitle>
              <CardDescription>Defina os limites de agendamento.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Antecedência Mínima (horas)</Label>
                  <Input 
                    type="number" 
                    value={minLeadTimeHours} 
                    onChange={(e) => setMinLeadTimeHours(e.target.value)} 
                    className="h-12"
                  />
                  <p className="text-[10px] text-muted-foreground">Impede agendamentos "em cima da hora".</p>
                </div>
                <div className="space-y-2">
                  <Label>Intervalo entre Vagas (minutos)</Label>
                  <Input 
                    type="number" 
                    value={slotIntervalMinutes} 
                    onChange={(e) => setSlotIntervalMinutes(e.target.value)} 
                    className="h-12"
                  />
                  <p className="text-[10px] text-muted-foreground">Ex: 15, 30, 45 ou 60 minutos.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
