"use client";

import { useState } from "react";
import { Plus, Search, Scissors, Clock, DollarSign, Loader2, MoreHorizontal, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  useUser, 
  useCollection, 
  useFirestore, 
  useMemoFirebase,
  addDocumentNonBlocking,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking
} from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export default function AdminServices() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);

  // Form state
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("30");
  const [price, setPrice] = useState("0");

  const servicesQuery = useMemoFirebase(() => {
    if (!db || !user?.uid || isUserLoading) return null;
    return collection(db, "empresas", user.uid, "servicos");
  }, [db, user?.uid, isUserLoading]);

  const { data: services, isLoading } = useCollection(servicesQuery);

  const filteredServices = services?.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDialog = (service?: any) => {
    if (service) {
      setEditingService(service);
      setName(service.name);
      setDuration(service.durationMinutes.toString());
      setPrice(service.basePrice.toString());
    } else {
      setEditingService(null);
      setName("");
      setDuration("30");
      setPrice("0");
    }
    // Delay estratégico para garantir que o DropdownMenu feche antes do Dialog abrir, prevenindo UI freeze
    setTimeout(() => setIsDialogOpen(true), 200);
  };

  const handleSubmit = () => {
    if (!user || !name) return;

    const data = {
      name,
      durationMinutes: parseInt(duration),
      basePrice: parseFloat(price),
      isActive: true,
      ownerId: user.uid,
    };

    if (editingService) {
      const docRef = doc(db, "empresas", user.uid, "servicos", editingService.id);
      updateDocumentNonBlocking(docRef, data);
      toast({ title: "Serviço atualizado" });
    } else {
      const colRef = collection(db, "empresas", user.uid, "servicos");
      addDocumentNonBlocking(colRef, data);
      toast({ title: "Serviço adicionado" });
    }

    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!user) return;
    const docRef = doc(db, "empresas", user.uid, "servicos", id);
    deleteDocumentNonBlocking(docRef);
    toast({ title: "Serviço removido", variant: "destructive" });
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold">Serviços</h1>
          <p className="text-muted-foreground">Gerencie o catálogo de serviços do seu salão.</p>
        </div>
        
        <Button className="gap-2" onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4" />
          Novo Serviço
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingService ? "Editar Serviço" : "Novo Serviço"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome do Serviço</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Corte de Cabelo" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="duration">Duração (min)</Label>
                <Input id="duration" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price">Preço (R$)</Label>
                <Input id="price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSubmit} disabled={!name}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input 
          className="pl-10 max-w-md" 
          placeholder="Buscar serviço..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {(isLoading || isUserLoading) ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices?.map((service) => (
            <Card key={service.id} className="overflow-hidden border-none shadow-sm hover:ring-2 hover:ring-primary/20 transition-all">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Scissors className="w-5 h-5 text-primary" />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onSelect={(e) => {
                          e.preventDefault(); // Previne fechamento abrupto que trava o foco
                          handleOpenDialog(service);
                        }} 
                        className="gap-2"
                      >
                        <Edit2 className="w-4 h-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onSelect={() => handleDelete(service.id)} 
                        className="gap-2 text-destructive"
                      >
                        <Trash2 className="w-4 h-4" /> Remover
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <h3 className="text-lg font-bold mb-4">{service.name}</h3>
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {service.durationMinutes} min
                  </div>
                  <div className="flex items-center gap-1.5 font-semibold text-foreground">
                    <DollarSign className="w-4 h-4" />
                    R$ {service.basePrice.toFixed(2)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredServices?.length === 0 && (
            <div className="col-span-full text-center py-20 text-muted-foreground">
              Nenhum serviço cadastrado. Comece adicionando um novo serviço.
            </div>
          )}
        </div>
      )}
    </div>
  );
}