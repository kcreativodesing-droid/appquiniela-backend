import webpush from 'web-push';
import prisma from '../lib/prisma';

// Configurar las credenciales VAPID
const email = process.env.VAPID_EMAIL || 'mailto:soporte@quiniela2026.com';
const publicKey = process.env.VAPID_PUBLIC_KEY || '';
const privateKey = process.env.VAPID_PRIVATE_KEY || '';

if (publicKey && privateKey) {
  webpush.setVapidDetails(email, publicKey, privateKey);
} else {
  console.warn('⚠️ VAPID keys no están completamente configuradas. Las notificaciones push no se enviarán.');
}

/**
 * Registra o actualiza una suscripción de notificaciones push de un usuario.
 */
export async function subscribeUser(usuarioId: string, subscription: any) {
  const { endpoint, keys } = subscription;
  if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
    throw new Error('Suscripción push inválida');
  }

  // Guardar en la base de datos (evitando duplicar por endpoint)
  return prisma.pushSubscription.upsert({
    where: { endpoint },
    create: {
      usuarioId,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    },
    update: {
      usuarioId,
      p256dh: keys.p256dh,
      auth: keys.auth,
    },
  });
}

/**
 * Envía una notificación a todas las suscripciones registradas.
 */
export async function sendNotificationToAll(title: string, body: string, url: string = '/dashboard') {
  const subscriptions = await prisma.pushSubscription.findMany();
  
  const payload = JSON.stringify({
    title,
    body,
    icon: '/icons/icon.svg',
    badge: '/icons/icon.svg',
    data: { url },
  });

  const promises = subscriptions.map(async (sub) => {
    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
    };

    try {
      await webpush.sendNotification(pushSubscription, payload);
    } catch (error: any) {
      // Si el navegador ya no acepta la suscripción (ej. expiró o bloqueado), la eliminamos
      if (error.statusCode === 408 || error.statusCode === 410 || error.statusCode === 404) {
        console.log(`❌ Eliminando suscripción inválida/expirada: ${sub.endpoint}`);
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
      } else {
        console.error(`❌ Error al enviar notificación a ${sub.endpoint}:`, error.message);
      }
    }
  });

  await Promise.all(promises);
}
