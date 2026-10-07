// Rutas del módulo de conversaciones
import { Router, Request, Response } from 'express';
import { prisma } from '../../prisma/client';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

router.use(authMiddleware);

// ─── GET /api/v1/conversations ───────────────────────────────────────────────
// Lista conversaciones del tenant ordenadas por más reciente
router.get('/', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.user!;
    const { limit = '20', offset = '0' } = req.query;

    const conversations = await prisma.conversation.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      include: {
        lead: {
          select: {
            id:          true,
            name:        true,
            score:       true,
            temperature: true,
            status:      true,
          },
        },
        _count: { select: { messages: true } },
      },
    });

    const total = await prisma.conversation.count({ where: { tenantId } });

    res.json({ ok: true, conversations, total });
  } catch (error) {
    console.error('[Conversations] Error en GET /:', error);
    res.status(500).json({ ok: false, error: 'Error al obtener las conversaciones' });
  }
});

// ─── GET /api/v1/conversations/:id ──────────────────────────────────────────
// Detalle de una conversación con todos sus mensajes
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.user!;
    const { id } = req.params;

    const conversation = await prisma.conversation.findFirst({
      where: { id, tenantId },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        lead: true,
      },
    });

    if (!conversation) {
      res.status(404).json({ ok: false, error: 'Conversación no encontrada' });
      return;
    }

    res.json({ ok: true, conversation });
  } catch (error) {
    console.error('[Conversations] Error en GET /:id:', error);
    res.status(500).json({ ok: false, error: 'Error al obtener la conversación' });
  }
});

export default router;
