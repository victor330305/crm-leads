// Rutas de productos — catálogo del tenant
import { Router, Request, Response } from 'express';
import { prisma } from '../../prisma/client';
import { authMiddleware } from '../middlewares/auth';

const router = Router();
router.use(authMiddleware);

// ─── GET /api/v1/products ────────────────────────────────────────────────────
router.get('/', async (req: Request, res: Response) => {
  try {
    const { tenantId } = req.user!;
    const products = await prisma.product.findMany({
      where: { tenantId, isActive: true },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
    res.json({ ok: true, products });
  } catch (error) {
    console.error('[Products] Error en GET /:', error);
    res.status(500).json({ ok: false, error: 'Error al obtener los productos' });
  }
});

export default router;
