# AgendaFácil Pro

Plataforma de gestão inteligente para salões de beleza, barbearias e profissionais autônomos.

## ⚠️ ALERTA DE SEGURANÇA (API Key)

Se você recebeu um e-mail do Google sobre "Publicly accessible Google API key", não entre em pânico. Em aplicativos Firebase Web, a chave de API é **pública por design**. No entanto, você deve **restringi-la** para evitar uso indevido.

### Como resolver:
1. Vá para [APIs & Services > Credentials](https://console.cloud.google.com/apis/credentials) no Google Cloud Console.
2. Clique na chave de API mencionada no alerta.
3. Sob **"Set an application restriction"**, escolha **"HTTP referrers (web sites)"**.
4. Adicione os domínios permitidos:
   - `localhost:*` (para desenvolvimento)
   - `seu-dominio.com/*` (seu site oficial)
5. Clique em **Save**. Isso tornará sua chave segura mesmo estando no GitHub.

## Recursos Principais:
- **Agendamento Público**: Página personalizada para clientes agendarem horários sozinhos.
- **Agenda Administrativa**: Controle total dos compromissos e status.
- **Programa de Fidelidade**: Cartão fidelidade digital automático por telefone.
- **Assistente de Mensagens AI**: Gere textos para WhatsApp com IA Genkit.
- **QR Code de Agendamento**: Gere um código para seu balcão direto no painel.

## Como subir para o GitHub

### 1. Envie seus arquivos:
```bash
git add .
git commit -m "feat: melhorias no sistema e segurança"
git push origin main
```

### Dicas Úteis:
- **ERRO DE PUSH?** Se o GitHub recusar o push, rode:
  `git pull origin main --no-rebase --allow-unrelated-histories`
- **TELA TRAVADA NO TERMINAL?** Se aparecer uma mensagem sobre "Waiting for editor", feche a aba `MERGE_MSG` ou `COMMIT_EDITMSG` aqui no editor do Firebase Studio.

## Tecnologias Utilizadas
- **Next.js 15** (App Router)
- **Firebase** (Auth & Firestore)
- **Genkit** (Google AI)
- **Tailwind CSS** & **Shadcn UI**
