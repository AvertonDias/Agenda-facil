"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Plus, 
  Phone, 
  MoreHorizontal, 
  UserCheck, 
  Loader2, 
  Trash2, 
  Edit2, 
  UserPlus 
} from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

export default function AdminEquipe() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCollaborator, setEditingCollaborator] = useState<any>(null);

  // Form state
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  // Queries
  const collaboratorsQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return collection(db, "empresas", user.uid, "colaboradores");
  }, [db, user?.uid]);

  const servicesQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return collection(db, "empresas", user.uid, "servicos");
  }, [db, user?.uid]);

  const { data: collaborators, isLoading: loadingColabs } = useCollection(collaboratorsQuery);
  const { data: services } = useCollection(servicesQuery);

  const handleOpenDialog = (colab?: any) => {
    if (colab) {
      setEditingCollaborator(colab);
      setName(colab.name);
      setRole(colab.role || "");
      setPhone(colab.phoneNumber || "");
      setSelectedServices(colab.offeredServiceIds || []);
    } else {
      setEditingCollaborator(null);
      setName("");
      setRole("");
      setPhone("");
      setSelectedServices([]);
    }
    // Delay para garantir fechamento do menu antes da abertura do modal
    setTimeout(() => setIsDialogOpen(true), 150);
  };

  const handleSubmit = () => {
    if (!user || !name) return;

    const data = {
      name,
      role,
      phoneNumber: phone,
      offeredServiceIds: selectedServices,
      isActive: true,
      ownerId: user.uid,
    };

    if (editingCollaborator) {
      const colabRef = doc(db, "empresas", user.uid, "colaboradores", editingCollaborator.id);
      updateDocumentNonBlocking(colabRef, data);
      toast({ title: "Colaborador atualizado" });
    } else {
      const colabRef = collection(db, "empresas", user.uid, "colaboradores");
      addDocumentNonBlocking(colabRef, data);
      toast({ title: "Colaborador adicionado" });
    }

    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (!user) return;
    const colabRef = doc(db, "empresas", user.uid, "colaboradores", id);
    deleteDocumentNonBlocking(colabRef);
    toast({ title: "Colaborador removido", variant: "destructive" });
  };

  const toggleService = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId) 
        : [...prev, serviceId]
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold">Equipe</h1>
          <p className="text-muted-foreground">Gerencie os profissionais do seu salão.</p>
        </div>
        
        <Button className="gap-2" onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4" />
          Novo Colaborador
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingCollaborator ? "Editar Colaborador" : "Novo Colaborador"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Ricardo Silva" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Cargo / Especialidade</Label>
              <Input id="role" value={role} onChange={(e) => setRole(e.target.value)} placeholder="Ex: Barbeiro" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" />
            </div>
            <div className="grid gap-2">
              <Label>Serviços Realizados</Label>
              <div className="grid grid-cols-2 gap-2 mt-2 max-h-[150px] overflow-y-auto p-2 border rounded-md">
                {services?.map(service => (
                  <div key={service.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={service.id} 
                      checked={selectedServices.includes(service.id)}
                      onCheckedChange={() => toggleService(service.id)}
                    />
                    <label htmlFor={service.id} className="text-sm cursor-pointer truncate">
                      {service.name}
                    </label>
                  </div>
                ))}
                {(!services || services.length === 0) && (
                  <p className="text-xs text-muted-foreground col-span-2">Nenhum serviço cadastrado.</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSubmit} disabled={!name}>
              {editingCollaborator ? "Salvar Alterações" : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {(loadingColabs || isUserLoading) ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collaborators?.map((employee) => (
            <Card key={employee.id} className="border-none shadow-sm overflow-hidden group">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <Avatar className="w-16 h-16 border-2 border-background shadow-sm">
                    <AvatarImage src={`https://picsum.photos/seed/${employee.id}/100/100`} />
                    <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onSelect={() => handleOpenDialog(employee)} 
                        className="gap-2"
                      >
                        <Edit2 className="w-4 h-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onSelect={() => handleDelete(employee.id)} 
                        className="gap-2 text-destructive"
                      >
                        <Trash2 className="w-4 h-4" /> Remover
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="mt-4">
                  <CardTitle className="text-xl">{employee.name}</CardTitle>
                  <p className="text-sm text-primary font-medium">{employee.role || "Profissional"}</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {employee.offeredServiceIds?.map((sId: string) => {
                    const service = services?.find(s => s.id === sId);
                    return service ? (
                      <Badge key={sId} variant="secondary" className="font-normal">
                        {service.name}
                      </Badge>
                    ) : null;
                  })}
                  {(!employee.offeredServiceIds || employee.offeredServiceIds.length === 0) && (
                    <span className="text-xs text-muted-foreground italic">Sem serviços vinculados</span>
                  )}
                </div>
                
                <div className="pt-4 border-t space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    {employee.phoneNumber || "Sem telefone"}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <UserCheck className="w-4 h-4" />
                    {employee.isActive ? "Ativo no Sistema" : "Inativo"}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {collaborators?.length === 0 && (
            <Card className="col-span-full border-dashed bg-secondary/20 py-20">
              <CardContent className="flex flex-col items-center text-center space-y-4">
                <UserPlus className="w-12 h-12 text-muted-foreground/50" />
                <div>
                  <h3 className="text-xl font-bold">Nenhum colaborador encontrado</h3>
                  <p className="text-muted-foreground">Comece adicionando seu primeiro profissional à equipe.</p>
                </div>
                <Button onClick={() => handleOpenDialog()}>Adicionar Agora</Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}