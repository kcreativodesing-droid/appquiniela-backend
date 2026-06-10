import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

const PrediccionSchema = z.object({
  partidoId: z.string().uuid(),
  predGolesLocal: z.number().int().min(0).max(20),
  predGolesVisitante: z.number().int().min(0).max(20),
});

// ── GET /api/predicciones/mis ───────────────────────────────────
// Retorna todas las predicciones del usuario autenticado
router.get('/mis', authMiddleware, async (req: Request, res: Response) => {
  const predicciones = await prisma.prediccion.findMany({
    where: { usuarioId: req.user!.userId },
    include: {
      partido: {
        select: {
          id: true,
          equipoLocal: true,
          equipoVisitante: true,
          fechaHora: true,
          estado: true,
          golesLocal: true,
          golesVisitante: true,
          fase: true,
          grupo: true,
        },
      },
    },
    orderBy: { partido: { fechaHora: 'asc' } },
  });

  return res.json(predicciones);
});

// ── POST /api/predicciones ──────────────────────────────────────
// Crea o actualiza una predicción (upsert)
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  const parsed = PrediccionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
  }

  const { partidoId, predGolesLocal, predGolesVisitante } = parsed.data;
  const usuarioId = req.user!.userId;

  // Verificar que el partido existe y no ha empezado
  const partido = await prisma.partido.findUnique({ where: { id: partidoId } });
  if (!partido) {
    return res.status(404).json({ error: 'Partido no encontrado' });
  }

  if (partido.estado !== 'Pendiente') {
    return res.status(400).json({
      error: 'No se pueden modificar predicciones de partidos que ya comenzaron o finalizaron',
    });
  }

  // Verificar deadline: bloquear 5 minutos antes del partido (comparación robusta en ms)
  const ahoraMs = Date.now();
  const deadlineMs = new Date(partido.fechaHora).getTime() - (5 * 60 * 1000);
  if (ahoraMs >= deadlineMs) {
    return res.status(400).json({
      error: 'El plazo para ingresar predicciones ha cerrado (5 minutos antes del partido)',
    });
  }

  // Upsert: crear si no existe, actualizar si ya existe
  const prediccion = await prisma.prediccion.upsert({
    where: {
      usuarioId_partidoId: { usuarioId, partidoId },
    },
    update: { predGolesLocal, predGolesVisitante },
    create: { usuarioId, partidoId, predGolesLocal, predGolesVisitante },
    include: {
      partido: {
        select: {
          equipoLocal: true,
          equipoVisitante: true,
          fechaHora: true,
        },
      },
    },
  });

  return res.status(201).json(prediccion);
});

export default router;
