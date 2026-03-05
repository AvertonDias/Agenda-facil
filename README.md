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

Se você já rodou o comando de `pull` e o terminal informou que está tudo atualizado, agora é só enviar os arquivos.

### 1. Envie seus arquivos para o GitHub:
```bash
git push -u origin main
```

---

### Dicas Úteis:

**"Waiting for your editor to close the file..."**
Se o terminal travar com essa mensagem em algum momento:
1. Olhe as abas de arquivos abertas no topo deste editor.
2. Procure por uma aba chamada `MERGE_MSG` ou `COMMIT_EDITMSG`.
3. **Feche essa aba** (clique no 'x'). O terminal destravará na hora.

### Comandos de Emergência (Caso precise recomeçar):
```bash
git init
git add .
git commit -m "primeiro commit"
git branch -M main
git remote add origin https://github.com/AvertonDias/Agenda-facil.git
git pull origin main --no-rebase --allow-unrelated-histories
git push -u origin main
```

## Tecnologias Utilizadas
- **Next.js 15** (App Router)
- **Firebase** (Auth & Firestore)
- **Genkit** (Google AI)
- **Tailwind CSS** & **Shadcn UI**
