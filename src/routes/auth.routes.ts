import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authMiddleware, adminMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// ── Schemas de validación ───────────────────────────────────────
const RegisterSchema = z.object({
  cedula: z.string().min(6).max(15).regex(/^\d+$/, 'La cédula debe contener solo números'),
  nombre: z.string().min(2).max(100),
  telefono: z.string().optional(),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

const LoginSchema = z.object({
  cedula: z.string().min(6).max(15),
  password: z.string().min(1),
});

const ResetPasswordSchema = z.object({
  cedula: z.string(),
  nuevaPassword: z.string().min(6),
});

// ── POST /api/auth/register ─────────────────────────────────────
router.post('/register', async (req: Request, res: Response) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
  }

  const { cedula, nombre, telefono, password } = parsed.data;

  // Verificar si la cédula ya existe
  const existe = await prisma.usuario.findUnique({ where: { cedula } });
  if (existe) {
    return res.status(409).json({ error: 'Ya existe un usuario con esa cédula' });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const usuario = await prisma.usuario.create({
    data: { cedula, nombre, telefono, passwordHash },
    select: { id: true, cedula: true, nombre: true, rol: true, puntosTotales: true },
  });

  const token = jwt.sign(
    { userId: usuario.id, cedula: usuario.cedula, rol: usuario.rol },
    process.env.JWT_SECRET!,
    { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
  );

  return res.status(201).json({ token, usuario });
});

// ── POST /api/auth/login ────────────────────────────────────────
router.post('/login', async (req: Request, res: Response) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Cédula y contraseña son requeridos' });
  }

  const { cedula, password } = parsed.data;

  const usuario = await prisma.usuario.findUnique({ where: { cedula } });
  if (!usuario) {
    return res.status(401).json({ error: 'Cédula o contraseña incorrectos' });
  }

  const passwordValida = await bcrypt.compare(password, usuario.passwordHash);
  if (!passwordValida) {
    return res.status(401).json({ error: 'Cédula o contraseña incorrectos' });
  }

  const token = jwt.sign(
    { userId: usuario.id, cedula: usuario.cedula, rol: usuario.rol },
    process.env.JWT_SECRET!,
    { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
  );

  return res.json({
    token,
    usuario: {
      id: usuario.id,
      cedula: usuario.cedula,
      nombre: usuario.nombre,
      rol: usuario.rol,
      puntosTotales: usuario.puntosTotales,
    },
  });
});

// ── GET /api/auth/me ────────────────────────────────────────────
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  const usuario = await prisma.usuario.findUnique({
    where: { id: req.user!.userId },
    select: { id: true, cedula: true, nombre: true, telefono: true, rol: true, puntosTotales: true },
  });

  if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
  return res.json(usuario);
});

// ── POST /api/auth/admin/reset-password ─────────────────────────
// Solo el admin puede resetear contraseñas
router.post(
  '/admin/reset-password',
  authMiddleware,
  adminMiddleware,
  async (req: Request, res: Response) => {
    const parsed = ResetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    }

    const { cedula, nuevaPassword } = parsed.data;
    const passwordHash = await bcrypt.hash(nuevaPassword, 12);

    try {
      const usuario = await prisma.usuario.update({
        where: { cedula },
        data: { passwordHash },
        select: { id: true, cedula: true, nombre: true },
      });
      return res.json({ message: `Contraseña restablecida para ${usuario.nombre}`, usuario });
    } catch {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
  }
);

export default router;
