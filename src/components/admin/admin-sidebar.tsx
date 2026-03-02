"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Scissors,
  Users,
  MessageSquare,
  Settings,
  TrendingUp,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/firebase";
import { signOut } from "firebase/auth";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

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
  const router = useRouter();
  const { state } = useSidebar();

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/');
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-4 flex flex-row items-center justify-between overflow-hidden">
        <div className={cn(
          "flex items-center gap-2 transition-all duration-300",
          state === "collapsed" ? "w-0 opacity-0" : "w-auto opacity-100"
        )}>
          <Calendar className="w-6 h-6 text-primary shrink-0" />
          <span className="text-xl font-bold text-primary whitespace-nowrap">
            AgendaFácil <span className="text-accent">Pro</span>
          </span>
        </div>
        <SidebarTrigger className="h-8 w-8" />
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
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleSignOut}
              tooltip="Sair do Sistema"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-red-50 hover:text-destructive transition-colors"
            >
              <LogOut className="w-5 h-5 shrink-0" />
              <span>Sair do Sistema</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
