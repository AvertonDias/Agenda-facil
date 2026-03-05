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

Se você recebeu o erro `fatal: Need to specify how to reconcile divergent branches`, utilize o comando abaixo para forçar a sincronização inicial:

### 1. Sincronizar arquivos do GitHub com o local:
```bash
git pull origin main --no-rebase --allow-unrelated-histories
```

### 2. Dica: "Waiting for your editor to close the file..."
Se o terminal travar com essa mensagem após o comando acima:
1. Olhe as abas de arquivos abertas no topo deste editor.
2. Procure por uma aba chamada `MERGE_MSG`.
3. **Feche essa aba** (clique no 'x'). O terminal destravará na hora.

### 3. Agora, envie seus arquivos:
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
