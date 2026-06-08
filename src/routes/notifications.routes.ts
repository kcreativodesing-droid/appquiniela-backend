import { Router, Request, Response } from 'express';
import { saveSubscription } from '../services/notification.service';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Guardar suscripción del usuario
router.post('/subscribe', authMiddleware, async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const subscription = req.body;
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'Suscripción inválida' });
  }
  try {
    await saveSubscription(userId, subscription);
    res.json({ ok: true });
  } catch (e) {
    console.error('Error guardando suscripción', e);
    res.status(500).json({ error: 'Error interno' });
  }
});

export default router;
