'use server';
/**
 * @fileOverview A Genkit flow for generating personalized WhatsApp messages for salon owners.
 *
 * - generateWhatsappMessage - A function that generates WhatsApp messages based on input parameters.
 * - GenerateWhatsappMessageInput - The input type for the generateWhatsappMessage function.
 * - GenerateWhatsappMessageOutput - The return type for the generateWhatsappMessage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateWhatsappMessageInputSchema = z.object({
  messageType: z
    .enum(['confirmation', 'reminder24h', 'reminder3h', 'post_service', 'offer'])
    .describe('Type of WhatsApp message to generate (e.g., confirmation, reminder, offer).'),
  salonName: z.string().describe('The name of the salon.'),
  clientName: z.string().describe('The name of the client.'),
  serviceDetails: z.string().optional().describe('Details of the service(s) booked, if applicable.'),
  appointmentDateTime: z.string().optional().describe('Date and time of the appointment, if applicable (e.g., "2024-07-20 10:00").'),
  offerDetails: z.string().optional().describe('Details of the special offer, if messageType is "offer".'),
  tone: z
    .enum(['professional', 'friendly', 'formal', 'playful'])
    .default('friendly')
    .describe('The desired tone for the message.'),
});
export type GenerateWhatsappMessageInput = z.infer<typeof GenerateWhatsappMessageInputSchema>;

const GenerateWhatsappMessageOutputSchema = z.object({
  message: z.string().describe('The generated WhatsApp message text.'),
});
export type GenerateWhatsappMessageOutput = z.infer<typeof GenerateWhatsappMessageOutputSchema>;

export async function generateWhatsappMessage(
  input: GenerateWhatsappMessageInput
): Promise<GenerateWhatsappMessageOutput> {
  return generateWhatsappMessageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateWhatsappMessagePrompt',
  input: {schema: GenerateWhatsappMessageInputSchema},
  output: {schema: GenerateWhatsappMessageOutputSchema},
  prompt: `Você é um assistente de IA para proprietários de salões, especializado em criar mensagens de WhatsApp personalizadas e eficazes para clientes, com foco na comunicação profissional e eficiente. Gere uma mensagem com base nos detalhes fornecidos.

### Instruções:
- O idioma da mensagem deve ser Português (Brasil).
- Use a persona de um salão de beleza/barbearia/manicure/estúdio de estética.
- Mantenha a mensagem concisa e clara, adequada para o WhatsApp.
- Inclua emojis relevantes e amigáveis para o contexto de um salão, mas sem excesso.
- Se o messageType for 'confirmation' ou 'reminder', inclua o nome do cliente, o serviço e a data/hora do agendamento.
- Se o messageType for 'offer', foque nos detalhes da oferta.
- Adapte o tom de voz conforme solicitado ({{tone}}).

### Detalhes para a Mensagem:
Tipo de Mensagem: {{{messageType}}}
Nome do Salão: {{{salonName}}}
Nome do Cliente: {{{clientName}}}
{{#if serviceDetails}}Detalhes do Serviço: {{{serviceDetails}}}{{/if}}
{{#if appointmentDateTime}}Data/Hora do Agendamento: {{{appointmentDateTime}}}{{/if}}
{{#if offerDetails}}Detalhes da Oferta: {{{offerDetails}}}{{/if}}
Tom de Voz Desejado: {{{tone}}}

---

Gerar Mensagem:`,
});

const generateWhatsappMessageFlow = ai.defineFlow(
  {
    name: 'generateWhatsappMessageFlow',
    inputSchema: GenerateWhatsappMessageInputSchema,
    outputSchema: GenerateWhatsappMessageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
