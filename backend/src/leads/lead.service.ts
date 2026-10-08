// Servicio de leads
// Crea, actualiza y calcula el score de los leads

import { prisma } from '../prisma/client';
import { Temperature, LeadStatus } from '@prisma/client';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface CreateOrUpdateLeadInput {
  tenantId: string;
  sessionId: string;
  channel: string;
  leadId?: string;
  extractedData?: Record<string, unknown>;
  scoreDelta?: number;
}

// ─── Crear o actualizar lead ──────────────────────────────────────────────────

export async function createOrUpdateLead(input: CreateOrUpdateLeadInput) {
  const { tenantId, sessionId, channel, leadId, extractedData = {}, scoreDelta = 0 } = input;

  // Si ya tenemos el ID del lead, actualizarlo
  if (leadId) {
    const existing = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!existing) throw new Error(`Lead ${leadId} no encontrado`);

    const newScore = Math.min(100, Math.max(0, existing.score + scoreDelta));
    const newTemperature = getTemperature(newScore);

    // Determinar si el lead fue "recuperado" (primera respuesta del bot)
    const isFirstResponse = !existing.firstResponseAt;

    return prisma.lead.update({
      where: { id: leadId },
      data: {
        name:        extractedData.name        ? (extractedData.name        as string) : existing.name,
        phone:       extractedData.phone       ? (extractedData.phone       as string) : existing.phone,
        city:        extractedData.city        ? (extractedData.city        as string) : existing.city,
        province:    extractedData.province    ? (extractedData.province    as string) : existing.province,
        product:     extractedData.product     ? (extractedData.product     as string) : existing.product,
        use:         extractedData.use         ? (extractedData.use         as string) : existing.use,
        intention:   extractedData.intention   ? (extractedData.intention   as string) : existing.intention,
        score:       newScore,
        temperature: newTemperature,
        status:      getStatus(existing.status, newScore),
        firstResponseAt: isFirstResponse ? new Date() : existing.firstResponseAt,
        isRecovered:     isFirstResponse ? true : existing.isRecovered,
        updatedAt:   new Date(),
      },
    });
  }

  // Crear un nuevo lead
  return prisma.lead.create({
    data: {
      tenantId,
      channel,
      score: 0,
      temperature: Temperature.COLD,
      status: LeadStatus.NEW,
      firstResponseAt: new Date(),
      isRecovered: true, // El bot respondió, si no hubiera bot se perdería
      notes: `Session ID: ${sessionId}`,
    },
  });
}

// ─── Motor de scoring ─────────────────────────────────────────────────────────

/**
 * Calcula cuántos puntos suma un mensaje según los datos extraídos y el contenido.
 * Basado en la tabla de scoring del MVP_PLAN.
 */
export function calculateScoreDelta(
  extractedData: Record<string, unknown>,
  message: string
): number {
  let delta = 0;
  const lower = message.toLowerCase();

  // Datos de contacto
  if (extractedData.name)     delta += 5;
  if (extractedData.phone)    delta += 10;
  if (extractedData.city)     delta += 5;

  // Intención y comportamiento
  if (extractedData.intention === 'price_inquiry')  delta += 10;
  if (extractedData.intention === 'quote_request')  delta += 20;
  if (extractedData.intention === 'buy_intent')     delta += 25;
  if (extractedData.product)                        delta += 10;
  if (extractedData.use === 'commercial')           delta += 15;
  if (extractedData.use === 'institutional')        delta += 15;
  if (extractedData.urgency === true)               delta += 15;

  // Palabras clave adicionales en el mensaje
  if (lower.includes('envío') || lower.includes('envio'))     delta += 10;
  if (lower.includes('cuándo') || lower.includes('cuando'))   delta += 5;
  if (lower.includes('instala'))                              delta += 5;

  return delta;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Convierte el score numérico en temperatura del lead.
 */
function getTemperature(score: number): Temperature {
  if (score >= 71) return Temperature.HOT;
  if (score >= 31) return Temperature.WARM;
  return Temperature.COLD;
}

/**
 * Actualiza el estado del lead según el score, sin retroceder en el pipeline.
 */
function getStatus(currentStatus: LeadStatus, score: number): LeadStatus {
  // No retroceder estados ya avanzados
  if (
    currentStatus === LeadStatus.WAITING_HUMAN ||
    currentStatus === LeadStatus.ASSIGNED ||
    currentStatus === LeadStatus.CONVERTED ||
    currentStatus === LeadStatus.LOST ||
    currentStatus === LeadStatus.CLOSED
  ) {
    return currentStatus;
  }

  if (score >= 71) return LeadStatus.IN_PROGRESS;
  if (score >= 31) return LeadStatus.IN_PROGRESS;
  return LeadStatus.NEW;
}
