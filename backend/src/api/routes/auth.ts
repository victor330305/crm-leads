// Rutas de autenticación — login y perfil
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from '../../prisma/client';
import { authMiddleware } from '../middlewares/auth';

const router = Router();

const loginSchema = z.object({
  email:    z.string().email('Email inválido'),
  password: z.string().min(1, 'Password requerido'),
});

// ─── POST /api/v1/auth/login ─────────────────────────────────────────────────
router.post('/login', async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ ok: false, error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const { email, password } = parsed.data;

    // Buscar el usuario por email
    const user = await prisma.user.findFirst({
      where: { email },
      include: { tenant: { select: { id: true, name: true, slug: true } } },
    });

    if (!user) {
      res.status(401).json({ ok: false, error: 'Credenciales incorrectas' });
      return;
    }

    // Verificar password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ ok: false, error: 'Credenciales incorrectas' });
      return;
    }

    // Generar JWT
    const token = jwt.sign(
      {
        userId:   user.id,
        tenantId: user.tenantId,
        email:    user.email,
        role:     user.role,
      },
      process.env.JWT_SECRET ?? 'fallback-secret',
      { expiresIn: '7d' }
    );

    res.json({
      ok: true,
      token,
      user: {
        id:       user.id,
        name:     user.name,
        email:    user.email,
        role:     user.role,
        tenant:   user.tenant,
      },
    });
  } catch (error) {
    console.error('[Auth] Error en POST /login:', error);
    res.status(500).json({ ok: false, error: 'Error en el login' });
  }
});

// ─── GET /api/v1/auth/me ─────────────────────────────────────────────────────
// Devuelve el perfil del usuario autenticado
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: { tenant: { select: { id: true, name: true, slug: true } } },
    });

    if (!user) {
      res.status(404).json({ ok: false, error: 'Usuario no encontrado' });
      return;
    }

    res.json({
      ok: true,
      user: {
        id:     user.id,
        name:   user.name,
        email:  user.email,
        role:   user.role,
        tenant: user.tenant,
      },
    });
  } catch (error) {
    console.error('[Auth] Error en GET /me:', error);
    res.status(500).json({ ok: false, error: 'Error al obtener el perfil' });
  }
});

export default router;
