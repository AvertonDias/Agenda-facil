# Agenda-facil

Plataforma de gestão inteligente para salões de beleza, barbearias e profissionais autônomos.

## Sobre o Projeto

O **AgendaFácil Pro** é uma solução completa para automatizar agendamentos, gerenciar equipes e fidelizar clientes através de tecnologia moderna e inteligência artificial.

### Recursos Principais:
- **Agendamento Público**: Página personalizada para clientes agendarem horários sozinhos.
- **Agenda Administrativa**: Controle total dos compromissos e status.
- **Programa de Fidelidade**: Cartão fidelidade digital automático por telefone.
- **Mensagens com IA**: Assistente Genkit para criar mensagens de confirmação e lembretes para WhatsApp.
- **Promoções Automáticas**: Sistema de descontos inteligentes para dias específicos ou combos.

## Como subir para o GitHub

Se você recebeu o erro `updates were rejected because the remote contains work that you do not have locally`, utilize os comandos abaixo para forçar a sincronização inicial:

### 1. Sincronizar arquivos do GitHub com o local:
```bash
git pull origin main --allow-unrelated-histories
```

### 2. Agora, envie seus arquivos:
```bash
git push -u origin main
```

---

### Comandos Iniciais (Caso esteja começando do zero):
```bash
git init
git add .
git commit -m "primeiro commit"
git branch -M main
git remote add origin https://github.com/AvertonDias/Agenda-facil.git
git push -u origin main
```

## Tecnologias Utilizadas
- **Next.js 15** (App Router)
- **Firebase** (Auth & Firestore)
- **Genkit** (Google AI)
- **Tailwind CSS** & **Shadcn UI**
