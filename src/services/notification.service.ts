import webpush from 'web-push';
import prisma from '../lib/prisma';

// ── Configuración VAPID ───────────────────────────────────────────
const VAPID_EMAIL  = process.env.VAPID_EMAIL   || 'mailto:soporte@quiniela2026.com';
const VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY  || '';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || '';

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);
} else {
  console.warn('⚠️ VAPID keys no configuradas — las notificaciones push están desactivadas.');
}

// ── Registrar / actualizar suscripción ────────────────────────────
export async function subscribeUser(
  usuarioId: string,
  subscription: { endpoint: string; keys: { p256dh: string; auth: string }; userAgent?: string }
) {
  const { endpoint, keys } = subscription;
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    throw new Error('Payload de suscripción push inválido.');
  }

  return prisma.pushSubscription.upsert({
    where:  { endpoint },
    create: { usuarioId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
    update: { usuarioId, p256dh: keys.p256dh, auth: keys.auth },
  });
}

// ── Enviar a todos los usuarios suscritos ─────────────────────────
export async function sendNotificationToAll(
  title: string,
  body: string,
  url: string = '/dashboard',
  tag: string = 'quiniela-resultado'
) {
  // Si no hay VAPID keys, no hacer nada (no lanzar error)
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return;

  const subscriptions = await prisma.pushSubscription.findMany();
  if (subscriptions.length === 0) return;

  const payload = JSON.stringify({
    title,
    body,
    icon:  '/icons/icon.svg',
    badge: '/icons/icon.svg',
    tag,
    data: { url },
  });

  const sends = subscriptions.map(async (sub) => {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
        { TTL: 60 * 60 * 24 } // 24 horas de TTL — llega aunque el dispositivo esté offline
      );
    } catch (err: any) {
      // 404 / 410 → suscripción expirada o cancelada → limpiar
      if (err.statusCode === 410 || err.statusCode === 404) {
        console.log(`🗑️  Eliminando suscripción inválida: ${sub.endpoint.slice(0, 60)}...`);
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
      } else {
        console.error(`❌ Push error (${err.statusCode}): ${err.message}`);
      }
    }
  });

  await Promise.allSettled(sends);
  console.log(`📲 Notificación enviada a ${subscriptions.length} suscriptor(es).`);
}
