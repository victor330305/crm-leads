// Rutas del módulo de chat — comunicación entre el lead y el asistente IA
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { processMessage } from '../../conversation/ai-engine';
import { prisma } from '../../prisma/client';

const router = Router();

// ─── Schemas de validación ────────────────────────────────────────────────────

const messageSchema = z.object({
  tenantId:       z.string().min(1, 'tenantId es requerido'),
  sessionId:      z.string().min(1, 'sessionId es requerido'),
  message:        z.string().min(1, 'message es requerido').max(1000),
  conversationId: z.string().optional(),
});

// ─── POST /api/v1/chat/message ───────────────────────────────────────────────
// Recibe un mensaje del lead, lo procesa con IA y devuelve la respuesta del bot
router.post('/message', async (req: Request, res: Response) => {
  try {
    // Validar body con zod
    const parsed = messageSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        ok: false,
        error: 'Datos inválidos',
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { tenantId, sessionId, message, conversationId } = parsed.data;

    // Verificar que el tenant existe
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      res.status(404).json({ ok: false, error: 'Tenant no encontrado' });
      return;
    }

    // Procesar el mensaje con el motor de IA
    const result = await processMessage({
      tenantId,
      sessionId,
      message,
      conversationId,
    });

    res.json({
      ok: true,
      reply:          result.reply,
      conversationId: result.conversationId,
      leadId:         result.leadId,
      score:          result.score,
      temperature:    result.temperature,
      shouldHandoff:  result.shouldHandoff,
    });
  } catch (error) {
    console.error('[Chat] Error en POST /message:', error);
    res.status(500).json({ ok: false, error: 'Error al procesar el mensaje' });
  }
});

// ─── GET /api/v1/chat/history/:conversationId ────────────────────────────────
// Devuelve el historial de mensajes de una conversación
router.get('/history/:conversationId', async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            id:            true,
            role:          true,
            content:       true,
            intentDetected: true,
            scoreChange:   true,
            createdAt:     true,
          },
        },
        lead: {
          select: {
            id:          true,
            name:        true,
            score:       true,
            temperature: true,
            status:      true,
          },
        },
      },
    });

    if (!conversation) {
      res.status(404).json({ ok: false, error: 'Conversación no encontrada' });
      return;
    }

    res.json({
      ok:             true,
      conversationId: conversation.id,
      channel:        conversation.channel,
      summary:        conversation.summary,
      lead:           conversation.lead,
      messages:       conversation.messages,
      createdAt:      conversation.createdAt,
    });
  } catch (error) {
    console.error('[Chat] Error en GET /history:', error);
    res.status(500).json({ ok: false, error: 'Error al obtener el historial' });
  }
});

export default router;
