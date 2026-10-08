// Rutas del módulo de leads — gestión del pipeline de ventas
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../prisma/client';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

// Todas las rutas de leads requieren autenticación
router.use(authMiddleware);

// ─── GET /api/v1/leads ───────────────────────────────────────────────────────
// Lista leads con filtros opcionales por temperatura, estado y búsqueda
router.get('/', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.user!;
    const { temperature, status, search, limit = '50', offset = '0' } = req.query;

    const leads = await prisma.lead.findMany({
      where: {
        tenantId,
        ...(temperature && { temperature: temperature as 'COLD' | 'WARM' | 'HOT' }),
        ...(status && { status: status as 'NEW' | 'IN_PROGRESS' | 'WAITING_HUMAN' | 'ASSIGNED' | 'FOLLOWUP' | 'CONVERTED' | 'LOST' | 'CLOSED' }),
        ...(search && {
          OR: [
            { name: { contains: search as string, mode: 'insensitive' } },
            { phone: { contains: search as string } },
            { city: { contains: search as string, mode: 'insensitive' } },
            { product: { contains: search as string, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
      select: {
        id:          true,
        name:        true,
        phone:       true,
        city:        true,
        province:    true,
        channel:     true,
        score:       true,
        temperature: true,
        status:      true,
        intention:   true,
        product:     true,
        use:         true,
        assignedTo:  true,
        isRecovered: true,
        createdAt:   true,
        updatedAt:   true,
        _count: { select: { conversations: true } },
      },
    });

    const total = await prisma.lead.count({
      where: {
        tenantId,
        ...(temperature && { temperature: temperature as 'COLD' | 'WARM' | 'HOT' }),
        ...(status && { status: status as 'NEW' | 'IN_PROGRESS' | 'WAITING_HUMAN' | 'ASSIGNED' | 'FOLLOWUP' | 'CONVERTED' | 'LOST' | 'CLOSED' }),
      },
    });

    res.json({ ok: true, leads, total });
  } catch (error) {
    console.error('[Leads] Error en GET /:', error);
    res.status(500).json({ ok: false, error: 'Error al obtener los leads' });
  }
});

// ─── GET /api/v1/leads/:id ───────────────────────────────────────────────────
// Detalle de un lead con todas sus conversaciones y mensajes
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.user!;
    const { id } = req.params;

    const lead = await prisma.lead.findFirst({
      where: { id, tenantId },
      include: {
        conversations: {
          orderBy: { createdAt: 'desc' },
          include: {
            messages: {
              orderBy: { createdAt: 'asc' },
              select: {
                id:             true,
                role:           true,
                content:        true,
                intentDetected: true,
                scoreChange:    true,
                createdAt:      true,
              },
            },
          },
        },
        followUps: {
          orderBy: { scheduledAt: 'asc' },
        },
      },
    });

    if (!lead) {
      res.status(404).json({ ok: false, error: 'Lead no encontrado' });
      return;
    }

    res.json({ ok: true, lead });
  } catch (error) {
    console.error('[Leads] Error en GET /:id:', error);
    res.status(500).json({ ok: false, error: 'Error al obtener el lead' });
  }
});

// ─── PATCH /api/v1/leads/:id ─────────────────────────────────────────────────
// Actualiza campos editables de un lead (estado, notas, asignación)
const updateLeadSchema = z.object({
  status:     z.enum(['NEW', 'IN_PROGRESS', 'WAITING_HUMAN', 'ASSIGNED', 'FOLLOWUP', 'CONVERTED', 'LOST', 'CLOSED']).optional(),
  notes:      z.string().optional(),
  assignedTo: z.string().optional(),
  name:       z.string().optional(),
  phone:      z.string().optional(),
});

router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.user!;
    const { id } = req.params;

    const parsed = updateLeadSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ ok: false, error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors });
      return;
    }

    // Verificar que el lead pertenece al tenant
    const existing = await prisma.lead.findFirst({ where: { id, tenantId } });
    if (!existing) {
      res.status(404).json({ ok: false, error: 'Lead no encontrado' });
      return;
    }

    const updated = await prisma.lead.update({
      where: { id },
      data: { ...parsed.data, updatedAt: new Date() },
    });

    res.json({ ok: true, lead: updated });
  } catch (error) {
    console.error('[Leads] Error en PATCH /:id:', error);
    res.status(500).json({ ok: false, error: 'Error al actualizar el lead' });
  }
});

// ─── DELETE /api/v1/leads/:id ────────────────────────────────────────────────
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.user!;
    const { id } = req.params;

    const existing = await prisma.lead.findFirst({ where: { id, tenantId } });
    if (!existing) {
      res.status(404).json({ ok: false, error: 'Lead no encontrado' });
      return;
    }

    await prisma.lead.delete({ where: { id } });
    res.json({ ok: true, deleted: true });
  } catch (error) {
    console.error('[Leads] Error en DELETE /:id:', error);
    res.status(500).json({ ok: false, error: 'Error al eliminar el lead' });
  }
});

// ─── GET /api/v1/leads/:id/followups ────────────────────────────────────────
// Lista los seguimientos automáticos de un lead
router.get('/:id/followups', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.user!;
    const { id } = req.params;

    const lead = await prisma.lead.findFirst({ where: { id, tenantId } });
    if (!lead) {
      res.status(404).json({ ok: false, error: 'Lead no encontrado' });
      return;
    }

    const followUps = await prisma.followUp.findMany({
      where:   { leadId: id },
      orderBy: { scheduledAt: 'asc' },
    });

    res.json({ ok: true, followUps });
  } catch (error) {
    console.error('[Leads] Error en GET /:id/followups:', error);
    res.status(500).json({ ok: false, error: 'Error al obtener los seguimientos' });
  }
});

// ─── GET /api/v1/leads/:id/summary ──────────────────────────────────────────
// Devuelve el resumen de la última conversación para el vendedor
router.get('/:id/summary', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.user!;
    const { id } = req.params;

    const lead = await prisma.lead.findFirst({
      where: { id, tenantId },
      include: {
        conversations: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { summary: true, createdAt: true },
        },
      },
    });

    if (!lead) {
      res.status(404).json({ ok: false, error: 'Lead no encontrado' });
      return;
    }

    const lastConversation = lead.conversations[0];

    res.json({
      ok: true,
      leadId: lead.id,
      name:        lead.name,
      phone:       lead.phone,
      city:        lead.city,
      product:     lead.product,
      score:       lead.score,
      temperature: lead.temperature,
      status:      lead.status,
      summary:     lastConversation?.summary ?? 'Sin resumen disponible todavía.',
      conversationAt: lastConversation?.createdAt,
    });
  } catch (error) {
    console.error('[Leads] Error en GET /:id/summary:', error);
    res.status(500).json({ ok: false, error: 'Error al obtener el resumen' });
  }
});

export default router;
