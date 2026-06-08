import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// ── GET /api/leaderboard ────────────────────────────────────────
// Retorna el ranking de todos los usuarios ordenado por puntos
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  const usuarios = await prisma.usuario.findMany({
    where: { rol: 'USER' },
    select: {
      id: true,
      cedula: true,
      nombre: true,
      puntosTotales: true,
      _count: { select: { predicciones: true } },
      predicciones: {
        select: { puntosObtenidos: true },
        where: { puntosObtenidos: { not: null } },
      },
    },
    orderBy: [
      { puntosTotales: 'desc' },
      { nombre: 'asc' },
    ],
  });

  const leaderboard = usuarios.map((u, index) => {
    const exactos = u.predicciones.filter((p) => p.puntosObtenidos === 3).length;
    const parciales = u.predicciones.filter((p) => p.puntosObtenidos === 1).length;
    const fallos = u.predicciones.filter((p) => p.puntosObtenidos === 0).length;

    return {
      posicion: index + 1,
      id: u.id,
      nombre: u.nombre,
      cedula: u.cedula,
      puntosTotales: u.puntosTotales,
      totalPredicciones: u._count.predicciones,
      exactos,
      parciales,
      fallos,
    };
  });

  // Marcar posición del usuario actual
  const miPosicion = leaderboard.findIndex((u) => u.id === req.user!.userId) + 1;

  return res.json({ leaderboard, miPosicion: miPosicion || null });
});

export default router;
