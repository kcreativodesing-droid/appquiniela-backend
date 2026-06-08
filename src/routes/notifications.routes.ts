import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middlewares/auth.middleware';
import { subscribeUser } from '../services/notification.service';

const router = Router();

// GET /api/notifications/vapid-key
router.get('/vapid-key', (_req: Request, res: Response) => {
  const publicKey = process.env.VAPID_PUBLIC_KEY || '';
  return res.json({ publicKey });
});

// POST /api/notifications/subscribe - requiere estar logueado
const SubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

router.post('/subscribe', authMiddleware, async (req: Request, res: Response) => {
  const parsed = SubscriptionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
  }

  const userId = req.user?.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Usuario no autenticado' });
  }

  try {
    await subscribeUser(userId, parsed.data);
    return res.status(201).json({ message: 'Suscripción registrada correctamente' });
  } catch (error: any) {
    console.error('❌ Error al registrar suscripción:', error.message);
    return res.status(500).json({ error: 'No se pudo guardar la suscripción' });
  }
});

export default router;
