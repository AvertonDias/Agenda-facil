
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Calendar,
  Scissors,
  Users,
  MessageSquare,
  Settings,
  TrendingUp,
  LogOut,
  ExternalLink,
  Copy,
  QrCode,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, useUser } from "@/firebase";
import { signOut } from "firebase/auth";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { QRCodeSVG } from "qrcode.react";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  { icon: Calendar, label: "Agenda", href: "/admin/agenda" },
  { icon: Scissors, label: "Serviços", href: "/admin/servicos" },
  { icon: Users, label: "Equipe", href: "/admin/equipe" },
  { icon: MessageSquare, label: "Mensagens AI", href: "/admin/mensagens" },
  { icon: TrendingUp, label: "Relatórios", href: "/admin/relatorios" },
  { icon: Settings, label: "Configurações", href: "/admin/configuracoes" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const auth = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const { state, setOpenMobile, isMobile } = useSidebar();
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/');
  };

  const handleItemClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const bookingUrl = typeof window !== 'undefined' && user ? `${window.location.origin}/agendar/${user.uid}` : '';

  const copyBookingLink = () => {
    if (!user) return;
    const salonName = user.displayName?.split(' ')[0] || 'nosso salão';
    const message = `Olá! Você já pode agendar seu horário no ${salonName} diretamente pelo nosso site: ${bookingUrl}\n\nAguardo você!`;
    
    navigator.clipboard.writeText(message);
    toast({
      title: "Mensagem copiada!",
      description: "A mensagem com o seu link de agendamento foi copiada. Agora é só colar no WhatsApp!",
    });
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-4 flex flex-row items-center justify-between overflow-hidden h-14">
        <div className={cn(
          "flex items-center gap-2 transition-all duration-300",
          state === "collapsed" ? "w-0 opacity-0" : "w-auto opacity-100"
        )}>
          <Calendar className="w-6 h-6 text-primary shrink-0" />
          <span className="text-xl font-bold text-primary whitespace-nowrap">
            AgendaFácil <span className="text-accent">Pro</span>
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarMenu>
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.label}
                  onClick={handleItemClick}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-white hover:bg-primary/90 hover:text-white"
                      : "text-muted-foreground hover:bg-secondary hover:text-primary"
                  )}
                >
                  <Link href={item.href}>
                    <item.icon className="w-5 h-5 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}

          <div className="px-3 mt-4 mb-2">
            <div className={cn("h-px bg-border", state === "collapsed" && "hidden")} />
          </div>

          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={copyBookingLink}
              tooltip="Copiar Mensagem com Link"
              className="text-primary hover:bg-primary/10"
            >
              <Copy className="w-5 h-5 shrink-0" />
              <span>Copiar Mensagem com Link</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setIsQrDialogOpen(true)}
              tooltip="Gerar QR Code"
              className="text-primary hover:bg-primary/10"
            >
              <QrCode className="w-5 h-5 shrink-0" />
              <span>Gerar QR Code</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          {user && (
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip="Ver Página Pública"
                className="text-muted-foreground"
              >
                <Link href={`/agendar/${user.uid}`} target="_blank">
                  <ExternalLink className="w-5 h-5 shrink-0" />
                  <span>Ver Página Pública</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => {
                handleSignOut();
                handleItemClick();
              }}
              tooltip="Sair do Sistema"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-red-50 hover:text-destructive transition-colors"
            >
              <LogOut className="w-5 h-5 shrink-0" />
              <span>Sair do Sistema</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <Dialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-black">
              <QrCode className="w-6 h-6 text-primary" />
              Seu QR Code de Agendamento
            </DialogTitle>
            <DialogDescription className="font-medium text-muted-foreground">
              Este código permite que seus clientes acessem sua agenda instantaneamente apenas apontando a câmera do celular.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-8 bg-secondary/5 rounded-3xl border-2 border-dashed gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-xl border-2">
              {bookingUrl && <QRCodeSVG value={bookingUrl} size={200} />}
            </div>
            <div className="text-center px-6 space-y-2">
              <p className="text-[10px] font-black uppercase text-primary tracking-widest">Dica de Sucesso</p>
              <p className="text-xs font-bold text-muted-foreground leading-relaxed">
                Você pode imprimir este código e colocar no seu balcão, espelho ou cartão de visitas para facilitar o agendamento dos seus clientes no dia a dia.
              </p>
            </div>
          </div>
          <DialogFooter className="sm:justify-center flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              className="rounded-xl font-bold border-2 h-12 px-6"
              onClick={() => window.print()}
            >
              Imprimir QR Code
            </Button>
            <Button 
              onClick={() => setIsQrDialogOpen(false)} 
              className="rounded-xl font-black h-12 px-8"
            >
              Entendi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sidebar>
  );
}
