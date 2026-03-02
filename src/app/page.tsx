import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle, Smartphone, Scissors } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-6 flex justify-between items-center border-b bg-white">
        <div className="flex items-center gap-2">
          <Calendar className="w-8 h-8 text-primary" />
          <span className="text-2xl font-bold text-primary">AgendaFácil <span className="text-accent">Pro</span></span>
        </div>
        <div className="flex gap-4">
          <Link href="/admin">
            <Button variant="ghost">Login Salão</Button>
          </Link>
          <Link href="/booking/agenda-facil-demo">
            <Button>Agendar Agora</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-20 px-6 text-center max-w-4xl mx-auto space-y-8">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-foreground">
            Sua agenda no <span className="text-primary">piloto automático</span>.
          </h1>
          <p className="text-xl text-muted-foreground">
            Automatize agendamentos, confirmações e lembretes via WhatsApp. 
            Menos tempo no telefone, mais tempo cuidando dos seus clientes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Link href="/admin">
              <Button size="lg" className="text-lg px-12 h-14 rounded-full">Começar Grátis</Button>
            </Link>
            <Link href="/booking/agenda-facil-demo">
              <Button size="lg" variant="outline" className="text-lg px-12 h-14 rounded-full">Ver Demo Cliente</Button>
            </Link>
          </div>
        </section>

        <section className="py-20 bg-secondary/30">
          <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
            <FeatureCard 
              icon={<Smartphone className="w-8 h-8" />}
              title="Foco em WhatsApp"
              description="Confirmações e lembretes automáticos enviados direto para o celular do seu cliente."
            />
            <FeatureCard 
              icon={<Scissors className="w-8 h-8" />}
              title="Gestão de Equipe"
              description="Controle a agenda de cada colaborador e suas comissões de forma simples."
            />
            <FeatureCard 
              icon={<CheckCircle className="w-8 h-8" />}
              title="Agendamento PWA"
              description="Uma interface moderna e leve para seus clientes agendarem sem precisar baixar nada."
            />
          </div>
        </section>
      </main>

      <footer className="p-12 bg-white border-t text-center text-muted-foreground">
        <p>© 2024 AgendaFácil Pro. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm space-y-4 border">
      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
        {icon}
      </div>
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}