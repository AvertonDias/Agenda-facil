"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

  return (
    <aside className="w-64 bg-white border-r h-screen sticky top-0 flex flex-col">
      <div className="p-6">
        <h1 className="text-xl font-bold text-primary flex items-center gap-2">
          <Calendar className="w-6 h-6" />
          AgendaFácil <span className="text-accent">Pro</span>
        </h1>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-white"
                  : "text-muted-foreground hover:bg-secondary hover:text-primary"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t">
        <button className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm font-medium text-destructive hover:bg-red-50 transition-colors">
          <LogOut className="w-5 h-5" />
          Sair do Sistema
        </button>
      </div>
    </aside>
  );
}