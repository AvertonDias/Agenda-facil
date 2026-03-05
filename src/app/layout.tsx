
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase/client-provider";
import { PWARegister } from "./pwa-register";

export const metadata: Metadata = {
  title: 'AgendaFácil Pro | Gestão Inteligente para Salões',
  description: 'Automatize sua agenda, confirmações e lembretes via WhatsApp.',
  manifest: '/manifest.json',
  themeColor: '#53A181',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'AgendaFácil',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <meta name="theme-color" content="#53A181" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="AgendaFácil" />
        <link rel="apple-touch-icon" href="https://picsum.photos/seed/pwa1/192/192" />
      </head>
      <body className="font-body antialiased">
        <FirebaseClientProvider>
          <PWARegister />
          {children}
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
