// Middleware de tenant — identifica el negocio (tenant) en cada request
// El sistema es multi-tenant: cada negocio tiene sus propios leads, productos y usuarios
import { Request, Response, NextFunction, RequestHandler } from 'express';

// Extensión del tipo Request de Express para incluir el tenantId resuelto
declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
    }
  }
}

/**
 * tenantMiddleware
 * Extrae el tenantId del header x-tenant-id o del query param tenantId.
 * Si no se encuentra, responde 400. Si se encuentra, lo adjunta a req.tenantId.
 */
export const tenantMiddleware: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Intentar obtener el tenantId del header HTTP primero (preferido)
  const tenantIdFromHeader = req.headers['x-tenant-id'];

  // Si el header tiene múltiples valores, tomar el primero
  const headerValue = Array.isArray(tenantIdFromHeader)
    ? tenantIdFromHeader[0]
    : tenantIdFromHeader;

  // Fallback al query param (útil para requests desde el frontend sin headers personalizados)
  const tenantIdFromQuery = typeof req.query['tenantId'] === 'string'
    ? req.query['tenantId']
    : undefined;

  const tenantId = headerValue ?? tenantIdFromQuery;

  if (!tenantId || tenantId.trim() === '') {
    res.status(400).json({ ok: false, error: 'Tenant no especificado' });
    return;
  }

  // Adjuntar al request para que los handlers puedan usarlo
  req.tenantId = tenantId.trim();

  next();
};
