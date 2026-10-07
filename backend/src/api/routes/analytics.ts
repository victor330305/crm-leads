// Rutas de analytics — métricas del dashboard
import { Router, Request, Response } from 'express';
import { prisma } from '../../prisma/client';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

router.use(authMiddleware);

// ─── GET /api/v1/analytics/summary ──────────────────────────────────────────
// Métricas principales para el dashboard
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.user!;

    // Fecha de inicio del día actual y de los últimos 7 días
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setDate(monthAgo.getDate() - 30);

    // Ejecutar todas las consultas en paralelo para mejor performance
    const [
      totalLeads,
      leadsToday,
      leadsThisWeek,
      leadsThisMonth,
      coldLeads,
      warmLeads,
      hotLeads,
      waitingHuman,
      converted,
      lost,
      recovered,
      totalConversations,
    ] = await Promise.all([
      prisma.lead.count({ where: { tenantId } }),
      prisma.lead.count({ where: { tenantId, createdAt: { gte: today } } }),
      prisma.lead.count({ where: { tenantId, createdAt: { gte: weekAgo } } }),
      prisma.lead.count({ where: { tenantId, createdAt: { gte: monthAgo } } }),
      prisma.lead.count({ where: { tenantId, temperature: 'COLD' } }),
      prisma.lead.count({ where: { tenantId, temperature: 'WARM' } }),
      prisma.lead.count({ where: { tenantId, temperature: 'HOT' } }),
      prisma.lead.count({ where: { tenantId, status: 'WAITING_HUMAN' } }),
      prisma.lead.count({ where: { tenantId, status: 'CONVERTED' } }),
      prisma.lead.count({ where: { tenantId, status: 'LOST' } }),
      prisma.lead.count({ where: { tenantId, isRecovered: true } }),
      prisma.conversation.count({ where: { tenantId } }),
    ]);

    // Promedio de score
    const scoreAvg = await prisma.lead.aggregate({
      where: { tenantId },
      _avg: { score: true },
    });

    // Tasa de conversión
    const conversionRate = totalLeads > 0
      ? Math.round((converted / totalLeads) * 100)
      : 0;

    // Leads por canal
    const byChannel = await prisma.lead.groupBy({
      by: ['channel'],
      where: { tenantId },
      _count: true,
    });

    // Top productos consultados
    const topProducts = await prisma.lead.groupBy({
      by: ['product'],
      where: { tenantId, product: { not: null } },
      _count: true,
      orderBy: { _count: { product: 'desc' } },
      take: 5,
    });

    res.json({
      ok: true,
      summary: {
        leads: {
          total:       totalLeads,
          today:       leadsToday,
          thisWeek:    leadsThisWeek,
          thisMonth:   leadsThisMonth,
        },
        byTemperature: {
          cold: coldLeads,
          warm: warmLeads,
          hot:  hotLeads,
        },
        byStatus: {
          waitingHuman,
          converted,
          lost,
        },
        metrics: {
          recovered,
          conversionRate,
          avgScore:   Math.round(scoreAvg._avg.score ?? 0),
          totalConversations,
        },
        byChannel: byChannel.map((c) => ({ channel: c.channel, count: c._count })),
        topProducts: topProducts.map((p) => ({ product: p.product, count: p._count })),
      },
    });
  } catch (error) {
    console.error('[Analytics] Error en GET /summary:', error);
    res.status(500).json({ ok: false, error: 'Error al obtener métricas' });
  }
});

export default router;
