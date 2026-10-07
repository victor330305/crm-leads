// Motor de IA — integración con Google Gemini usando @google/genai (SDK nueva)
// Orquesta la conversación: carga KB, construye el prompt, llama a Gemini,
// extrae datos del lead y guarda todo en la base de datos.

import { GoogleGenAI } from '@google/genai';
import { prisma } from '../prisma/client';
import { buildKnowledgeBase, formatConversationHistory } from '../knowledge/kb.service';
import { buildSystemPrompt, buildExtractionPrompt } from './prompts';
import { createOrUpdateLead, calculateScoreDelta } from '../leads/lead.service';
import { cancelFollowUps } from '../followup/engine';
import { io } from '../index';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? '' });

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface ChatInput {
  tenantId: string;
  sessionId: string;       // ID anónimo del visitante (viene del widget)
  message: string;
  conversationId?: string; // Si ya existe una conversación en curso
}

export interface ChatOutput {
  reply: string;
  conversationId: string;
  leadId: string;
  score: number;
  temperature: string;
  shouldHandoff: boolean;  // true cuando hay que derivar a un vendedor
}

// ─── Función principal ────────────────────────────────────────────────────────

export async function processMessage(input: ChatInput): Promise<ChatOutput> {
  const { tenantId, sessionId, message, conversationId } = input;

  // 1. Obtener o crear la conversación
  let conversation = conversationId
    ? await prisma.conversation.findFirst({
        where: { id: conversationId, tenantId },
        include: { messages: { orderBy: { createdAt: 'asc' } }, lead: true },
      })
    : null;

  // Si no hay conversación previa, crear lead y conversación nuevos
  if (!conversation) {
    const lead = await createOrUpdateLead({
      tenantId,
      sessionId,
      channel: 'web',
    });

    conversation = await prisma.conversation.create({
      data: {
        tenantId,
        leadId: lead.id,
        channel: 'web',
      },
      include: { messages: true, lead: true },
    });
  }

  const lead = conversation.lead;

  // 2. Guardar el mensaje del usuario en la DB
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: 'USER',
      content: message,
    },
  });

  // Cancelar seguimientos pendientes — el lead respondió
  await cancelFollowUps(conversation.leadId);

  // 3. Cargar la Knowledge Base del tenant
  const knowledgeBase = await buildKnowledgeBase(tenantId);

  // 4. Formatear historial de la conversación
  const historyText = formatConversationHistory(
    conversation.messages.map((m) => ({ role: m.role, content: m.content }))
  );

  // 5. Formatear datos actuales del lead
  const leadData = formatLeadData(lead);

  // 6. Construir el prompt completo
  const systemPrompt = buildSystemPrompt({
    knowledgeBase,
    conversationHistory: historyText,
    leadData,
  });

  // 7. Llamar a Gemini para generar la respuesta
  const reply = await callGemini(systemPrompt, message);

  // 8. Extraer datos del lead del mensaje
  const extractedData = await extractLeadData(message, leadData);
  console.log('[Lead] Datos extraídos:', JSON.stringify(extractedData));

  // 9. Calcular el delta de score
  const scoreDelta = calculateScoreDelta(extractedData, message);

  // 10. Guardar la respuesta del bot en la DB
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: 'ASSISTANT',
      content: reply,
      intentDetected: extractedData.intention as string | undefined,
      scoreChange: scoreDelta,
    },
  });

  // 11. Actualizar el lead con los datos extraídos y el nuevo score
  const updatedLead = await createOrUpdateLead({
    tenantId,
    sessionId,
    channel: 'web',
    leadId: lead.id,
    extractedData,
    scoreDelta,
  });

  // 12. Detectar si hay que derivar a un vendedor
  const shouldHandoff = detectHandoff(updatedLead.score, message, reply);

  if (shouldHandoff && updatedLead.status !== 'WAITING_HUMAN') {
    const summary = await generateSummary(conversation.id);

    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { summary },
    });

    await prisma.lead.update({
      where: { id: updatedLead.id },
      data: { status: 'WAITING_HUMAN' },
    });

    io.emit('lead:handoff', {
      leadId: updatedLead.id,
      tenantId,
      score: updatedLead.score,
      summary,
    });
  }

  // 13. Emitir el nuevo mensaje al dashboard en tiempo real
  io.emit('message:new', {
    tenantId,
    conversationId: conversation.id,
    leadId: updatedLead.id,
    role: 'ASSISTANT',
    content: reply,
  });

  return {
    reply,
    conversationId: conversation.id,
    leadId: updatedLead.id,
    score: updatedLead.score,
    temperature: updatedLead.temperature,
    shouldHandoff,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Llama a Gemini con el prompt del sistema y el mensaje del usuario.
 * Reintenta hasta 3 veces si hay error 503 (alta demanda).
 */
async function callGemini(systemPrompt: string, userMessage: string): Promise<string> {
  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\n---\nMENSAJE DEL CLIENTE: ${userMessage}` }],
          },
        ],
        config: {
          temperature: 0.7,
          maxOutputTokens: 300,
        },
      });
      return response.text?.trim() ?? 'Disculpá, hubo un problema al procesar tu mensaje. ¿Podés intentar de nuevo?';
    } catch (error: unknown) {
      const status = (error as { status?: number }).status;
      if (status === 503 && attempt < maxRetries) {
        console.warn(`[Gemini] 503 en intento ${attempt}, reintentando en ${attempt * 2}s...`);
        await new Promise((r) => setTimeout(r, attempt * 2000));
        continue;
      }
      console.error('[Gemini] Error al generar respuesta:', error);
      return 'Disculpá, hubo un problema al procesar tu mensaje. ¿Podés intentar de nuevo?';
    }
  }
  return 'Disculpá, hubo un problema al procesar tu mensaje. ¿Podés intentar de nuevo?';
}

/**
 * Formatea los datos conocidos del lead como texto para el prompt.
 */
function formatLeadData(lead: {
  name: string | null;
  phone: string | null;
  city: string | null;
  province: string | null;
  product: string | null;
  use: string | null;
  score: number;
  temperature: string;
}): string {
  const lines: string[] = [];
  if (lead.name)     lines.push(`Nombre: ${lead.name}`);
  if (lead.phone)    lines.push(`Teléfono: ${lead.phone}`);
  if (lead.city)     lines.push(`Ciudad: ${lead.city}`);
  if (lead.province) lines.push(`Provincia: ${lead.province}`);
  if (lead.product)  lines.push(`Producto de interés: ${lead.product}`);
  if (lead.use)      lines.push(`Tipo de uso: ${lead.use}`);
  lines.push(`Score actual: ${lead.score} (${lead.temperature})`);
  return lines.length > 1 ? lines.join('\n') : 'Sin datos del lead todavía.';
}

/**
 * Llama a Gemini para extraer datos estructurados del mensaje del usuario.
 */
async function extractLeadData(message: string, currentLeadData: string): Promise<Record<string, unknown>> {
  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const prompt = buildExtractionPrompt(message, currentLeadData);
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0,
          maxOutputTokens: 200,
        },
      });
      const raw = response.text?.trim() ?? '{}';
      return JSON.parse(raw) as Record<string, unknown>;
    } catch (error: unknown) {
      const status = (error as { status?: number }).status;
      if (status === 503 && attempt < maxRetries) {
        console.warn(`[Gemini Extracción] 503 en intento ${attempt}, reintentando...`);
        await new Promise((r) => setTimeout(r, attempt * 2000));
        continue;
      }
      console.error('[Gemini Extracción] Error:', error);
      return {};
    }
  }
  return {};
}

/**
 * Detecta si la conversación debe derivarse a un vendedor humano.
 */
function detectHandoff(score: number, userMessage: string, botReply: string): boolean {
  if (score >= 71) return true;

  const handoffTriggers = [
    'hablar con alguien',
    'hablar con una persona',
    'vendedor',
    'llamarme',
    'me llamen',
    'presupuesto formal',
    'quiero comprar',
    'lo quiero',
    'cómo compro',
    'cómo pago',
  ];

  const lowerMessage = userMessage.toLowerCase();
  if (handoffTriggers.some((trigger) => lowerMessage.includes(trigger))) return true;

  if (botReply.includes('alguien del equipo') && botReply.includes('contacte')) return true;

  return false;
}

/**
 * Genera un resumen de la conversación para el vendedor.
 */
async function generateSummary(conversationId: string): Promise<string> {
  try {
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });

    const history = messages
      .map((m) => `${m.role === 'USER' ? 'Cliente' : 'Bot'}: ${m.content}`)
      .join('\n');

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: `Generá un resumen ejecutivo de esta conversación para un vendedor de Juegos del Siglo XXI.
Incluí: qué necesita el cliente, qué producto le interesa, datos de contacto si los dio, y nivel de urgencia.
Máximo 5 líneas, en español argentino, directo al punto.

Conversación:
${history}`,
      config: { temperature: 0.3, maxOutputTokens: 200 },
    });
    return response.text?.trim() ?? 'Sin resumen disponible.';
  } catch {
    return 'Error al generar el resumen.';
  }
}
