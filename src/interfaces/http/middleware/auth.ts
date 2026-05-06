import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'kova_secret_dev';

export interface JwtPayload { id: number; email: string; role: string; name: string; }

declare global {
  namespace Express {
    interface Request { user?: JwtPayload; }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim();
  if (!token) { res.status(401).json({ error: 'Token requerido' }); return; }
  try { req.user = jwt.verify(token, JWT_SECRET) as JwtPayload; next(); }
  catch { res.status(401).json({ error: 'Token inválido o expirado' }); }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim();
  if (token) { try { req.user = jwt.verify(token, JWT_SECRET) as JwtPayload; } catch {} }
  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) { res.status(401).json({ error: 'No autenticado' }); return; }
    if (!roles.includes(req.user.role)) { res.status(403).json({ error: 'Acceso denegado' }); return; }
    next();
  };
}

export function signToken(payload: JwtPayload): string {
  const exp = (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'];
  return jwt.sign(payload as unknown as Record<string,unknown>, JWT_SECRET, { expiresIn: exp });
}
