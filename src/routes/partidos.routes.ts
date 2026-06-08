import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// ── GET /api/partidos ───────────────────────────────────────────
// Lista todos los partidos, con filtros opcionales
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  const { fase, estado, grupo } = req.query;

  const where: Record<string, unknown> = {};
  if (fase) where.fase = fase as string;
  if (estado) where.estado = estado as string;
  if (grupo) where.grupo = grupo as string;

  const partidos = await prisma.partido.findMany({
    where,
    orderBy: { fechaHora: 'asc' },
    include: {
      _count: { select: { predicciones: true } },
    },
  });

  return res.json(partidos);
});

// ── GET /api/partidos/proximo ───────────────────────────────────
// Retorna el próximo partido pendiente
router.get('/proximo', authMiddleware, async (req: Request, res: Response) => {
  const ahora = new Date();

  const proximo = await prisma.partido.findFirst({
    where: {
      estado: 'Pendiente',
      fechaHora: { gte: ahora },
    },
    orderBy: { fechaHora: 'asc' },
  });

  if (!proximo) {
    return res.status(404).json({ message: 'No hay partidos próximos programados' });
  }

  // Verificar si el usuario ya tiene predicción para este partido
  const miPrediccion = await prisma.prediccion.findUnique({
    where: {
      usuarioId_partidoId: {
        usuarioId: req.user!.userId,
        partidoId: proximo.id,
      },
    },
  });

  return res.json({ partido: proximo, tienePrediccion: !!miPrediccion });
});

// ── GET /api/partidos/:id ───────────────────────────────────────
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  const partido = await prisma.partido.findUnique({
    where: { id: req.params.id },
    include: {
      _count: { select: { predicciones: true } },
    },
  });

  if (!partido) return res.status(404).json({ error: 'Partido no encontrado' });
  return res.json(partido);
});

export default router;
