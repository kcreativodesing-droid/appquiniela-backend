import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authMiddleware, adminMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Todos los endpoints de admin requieren auth + rol ADMIN
router.use(authMiddleware, adminMiddleware);

// ── GET /api/admin/usuarios ─────────────────────────────────────
router.get('/usuarios', async (_req: Request, res: Response) => {
  const usuarios = await prisma.usuario.findMany({
    select: {
      id: true,
      cedula: true,
      nombre: true,
      telefono: true,
      rol: true,
      puntosTotales: true,
      createdAt: true,
      _count: { select: { predicciones: true } },
    },
    orderBy: { puntosTotales: 'desc' },
  });
  return res.json(usuarios);
});

// ── PUT /api/admin/partidos/:id ─────────────────────────────────
// Permite al admin actualizar resultado manualmente
const ResultadoSchema = z.object({
  golesLocal: z.number().int().min(0),
  golesVisitante: z.number().int().min(0),
  estado: z.enum(['Pendiente', 'EnJuego', 'Finalizado']).optional(),
});

router.put('/partidos/:id', async (req: Request, res: Response) => {
  const parsed = ResultadoSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
  }

  const { golesLocal, golesVisitante, estado } = parsed.data;

  try {
    const partido = await prisma.partido.update({
      where: { id: req.params.id },
      data: {
        golesLocal,
        golesVisitante,
        ...(estado && { estado }),
      },
    });

    // Si se marca como Finalizado, calcular puntos automáticamente
    if (estado === 'Finalizado') {
      await calcularPuntosPartido(partido.id, golesLocal, golesVisitante);
      
      // Auto-generar la siguiente ronda/jornada del mundial si corresponde
      const { checkAndGenerateNextPhase } = await import('../services/bracket.service');
      await checkAndGenerateNextPhase();

      // Enviar notificación a todos los usuarios
      try {
        const { sendNotificationToAll } = await import('../services/notification.service');
        const golesTxt = `${partido.equipoLocal} ${golesLocal} - ${golesVisitante} ${partido.equipoVisitante}`;
        await sendNotificationToAll(
          '¡Resultado de Partido! 🏆',
          `El partido de ${partido.fase} ha finalizado: ${golesTxt}`,
          '/dashboard'
        );
      } catch (err: any) {
        console.error('❌ Error al enviar notificaciones de partido finalizado:', err.message);
      }
    }

    return res.json({ message: 'Partido actualizado correctamente', partido });
  } catch {
    return res.status(404).json({ error: 'Partido no encontrado' });
  }
});

// ── POST /api/admin/partidos/:id/calcular ──────────────────────
// Recalcular puntos de un partido manualmente
router.post('/partidos/:id/calcular', async (req: Request, res: Response) => {
  const partido = await prisma.partido.findUnique({ where: { id: req.params.id } });
  if (!partido) return res.status(404).json({ error: 'Partido no encontrado' });
  if (partido.estado !== 'Finalizado') {
    return res.status(400).json({ error: 'El partido no está finalizado' });
  }
  if (partido.golesLocal === null || partido.golesVisitante === null) {
    return res.status(400).json({ error: 'El partido no tiene resultado registrado' });
  }

  const resumen = await calcularPuntosPartido(
    partido.id,
    partido.golesLocal,
    partido.golesVisitante
  );
  return res.json({ message: 'Puntos recalculados', ...resumen });
});

// ── POST /api/admin/sync-api ─────────────────────────────────────
// Sincronizar partidos desde la API-Football
router.post('/sync-api', async (_req: Request, res: Response) => {
  try {
    const { syncMatchesFromAPI } = await import('../services/apiFootball.service');
    const result = await syncMatchesFromAPI();
    if (!result.success) {
      return res.status(500).json({ error: result.message });
    }
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Error al procesar la sincronización.' });
  }
});

// ── Función interna: calcular puntos de un partido ─────────────
async function calcularPuntosPartido(
  partidoId: string,
  golesLocal: number,
  golesVisitante: number
) {
  const { calcularPuntos } = await import('../services/scoring.service');

  const predicciones = await prisma.prediccion.findMany({
    where: { partidoId },
  });

  let exactos = 0, parciales = 0, fallos = 0;

  for (const pred of predicciones) {
    const { puntosObtenidos, tipo } = calcularPuntos(
      pred.predGolesLocal,
      pred.predGolesVisitante,
      golesLocal,
      golesVisitante
    );

    // Actualizar puntos en la predicción
    await prisma.prediccion.update({
      where: { id: pred.id },
      data: { puntosObtenidos },
    });

    // Sumar al acumulado del usuario
    await prisma.usuario.update({
      where: { id: pred.usuarioId },
      data: { puntosTotales: { increment: puntosObtenidos } },
    });

    if (tipo === 'exacto') exactos++;
    else if (tipo === 'parcial') parciales++;
    else fallos++;
  }

  return {
    totalPredicciones: predicciones.length,
    exactos,
    parciales,
    fallos,
  };
}

export { calcularPuntosPartido };
export default router;
