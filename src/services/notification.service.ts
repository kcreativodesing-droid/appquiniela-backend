// src/services/notification.service.ts
import webpush from 'web-push';
import prisma from '../lib/prisma';
import { PushSubscription } from '@prisma/client';

// VAPID keys – generate once (npm run generate-vapid) or hard‑code for demo
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'YOUR_PUBLIC_KEY';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'YOUR_PRIVATE_KEY';

webpush.setVapidDetails(
  'mailto:admin@quiniela.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY,
);

export async function saveSubscription(userId: string, subscription: webpush.PushSubscription) {
  await prisma.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    update: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth, usuarioId: userId },
    create: { endpoint: subscription.endpoint, p256dh: subscription.keys.p256dh, auth: subscription.keys.auth, usuarioId: userId },
  });
}

export async function sendNotificationToAll(title: string, body: string, data?: any) {
  const subs = await prisma.pushSubscription.findMany();
  const payload = JSON.stringify({ title, body, data });
  const sendPromises = subs.map((sub) =>
    webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } } as any, payload).catch((err) => {
      if (err.statusCode === 410 || err.statusCode === 404) {
        // Subscription no longer valid → delete
        return prisma.pushSubscription.delete({ where: { endpoint: sub.endpoint } });
      }
    })
  );
  await Promise.all(sendPromises);
}
