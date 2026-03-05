"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, X, Smartphone, Share, PlusSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [platform, setPlatform] = useState<"ios" | "other" | null>(null);

  useEffect(() => {
    // 1. Verificar se já está instalado (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes('android-app://');

    if (isStandalone) return;

    // 2. Detectar Plataforma
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform("ios");
      // Mostrar prompt para iOS após um pequeno delay
      const hasDismissed = localStorage.getItem("pwa-prompt-dismissed");
      if (!hasDismissed) {
        setTimeout(() => setShowPrompt(true), 2000);
      }
    }

    // 3. Capturar evento de instalação para Android/Chrome
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setPlatform("other");
      
      const hasDismissed = localStorage.getItem("pwa-prompt-dismissed");
      if (!hasDismissed) {
        setShowPrompt(true);
      }
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", () => {});
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-prompt-dismissed", "true");
  };

  if (!showPrompt) return null;

  return (
    <Card className="mb-6 border-2 border-primary/20 bg-primary/5 shadow-lg relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500 rounded-2xl">
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute top-2 right-2 h-8 w-8 rounded-full text-muted-foreground hover:text-primary"
        onClick={dismissPrompt}
      >
        <X className="h-4 w-4" />
      </Button>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="bg-primary text-white p-4 rounded-2xl shadow-inner">
            <Smartphone className="h-8 w-8" />
          </div>
          <div className="flex-1 text-center sm:text-left space-y-1">
            <h3 className="text-lg font-black text-primary uppercase tracking-tight">Instale o AgendaFácil Pro</h3>
            <p className="text-sm text-muted-foreground font-medium">
              {platform === "ios" 
                ? "Acesse sua agenda mais rápido! Instale na sua tela de início."
                : "Transforme sua gestão em um aplicativo real para acesso instantâneo."}
            </p>
          </div>
          
          {platform === "other" && (
            <Button 
              onClick={handleInstallClick} 
              className="gap-2 font-black h-12 px-8 rounded-xl shadow-lg"
            >
              <Download className="h-4 w-4" />
              Instalar Agora
            </Button>
          )}

          {platform === "ios" && (
            <div className="bg-white/50 p-3 rounded-xl border border-primary/10 flex items-center gap-4 animate-pulse">
              <div className="flex flex-col items-center gap-1">
                <Share className="h-4 w-4 text-blue-500" />
                <span className="text-[8px] font-black uppercase">Compartilhar</span>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex flex-col items-center gap-1">
                <PlusSquare className="h-4 w-4 text-primary" />
                <span className="text-[8px] font-black uppercase">Adicionar à Tela</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
