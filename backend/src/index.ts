// Punto de entrada del servidor Express
// Carga variables de entorno antes de cualquier otra importación
import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Importar rutas de la API
import chatRoutes from './api/routes/chat';
import leadsRoutes from './api/routes/leads';
import conversationsRoutes from './api/routes/conversations';
import analyticsRoutes from './api/routes/analytics';
import productsRoutes from './api/routes/products';
import authRoutes from './api/routes/auth';

// Importar scheduler de seguimientos
import { startFollowUpScheduler } from './followup/scheduler';

const app = express();
const httpServer = createServer(app);

// Configuración de Socket.io con CORS
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// ─── Middlewares globales ────────────────────────────────────────────────────

// Seguridad básica con helmet
app.use(helmet());

// CORS: permite el frontend del dashboard y el widget embebido en cualquier origen
const allowedOrigins = [
  process.env.FRONTEND_URL ?? 'http://localhost:5173',
  'http://localhost:5174', // widget dev server
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir requests sin origen (Postman, curl, server-to-server)
      // y cualquier origen registrado
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // En producción el widget se sirve desde el sitio del cliente
        // así que permitimos todos los orígenes para /api/v1/chat
        callback(null, true);
      }
    },
    credentials: true,
  })
);

// Parseo de JSON en el body de las requests
app.use(express.json());

// ─── Rutas ──────────────────────────────────────────────────────────────────

// Health check — no requiere autenticación
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    ok: true,
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Montar todas las rutas bajo /api/v1/
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/leads', leadsRoutes);
app.use('/api/v1/conversations', conversationsRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/products', productsRoutes);
app.use('/api/v1/auth', authRoutes);

// ─── Eventos de Socket.io ────────────────────────────────────────────────────

io.on('connection', (socket) => {
  console.log(`[Socket.io] Cliente conectado: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Cliente desconectado: ${socket.id}`);
  });
});

// ─── Manejador de errores global ─────────────────────────────────────────────
// Debe ir como último middleware para capturar errores de todas las rutas
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Error global]', err.message);
  res.status(500).json({
    ok: false,
    error: 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { detail: err.message }),
  });
});

// ─── Inicio del servidor ─────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT ?? '3001', 10);

httpServer.listen(PORT, () => {
  console.log(`[Servidor] CRM Backend corriendo en http://localhost:${PORT}`);
  console.log(`[Servidor] Entorno: ${process.env.NODE_ENV ?? 'development'}`);

  // Iniciar scheduler de seguimientos automáticos
  startFollowUpScheduler();
});

export { io };
