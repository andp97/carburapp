import { NextRequest, NextResponse } from 'next/server';
import { getMissingPushEnvVars, sendPush } from '@/lib/push';
import { isApproaching, isExpired } from '@/lib/deadlineUtils';

export const dynamic = 'force-dynamic';

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  return prisma;
}

function daysUntil(date: Date): number {
  return Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

// GET /api/cron/notify — called daily by Vercel Cron at 09:00 UTC
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const missingPushEnvVars = getMissingPushEnvVars();
  if (missingPushEnvVars.length > 0) {
    console.error('GET /api/cron/notify missing VAPID env vars:', missingPushEnvVars.join(', '));
    return NextResponse.json(
      { error: 'Push notifications are not configured', missingEnvVars: missingPushEnvVars },
      { status: 500 },
    );
  }

  const prisma = await getPrisma();

  const deadlines = await prisma.deadline.findMany({
    include: {
      vehicle: {
        include: {
          user: {
            include: { pushSubscriptions: true },
          },
        },
      },
    },
  });

  let sent = 0;
  const staleEndpoints: string[] = [];

  for (const deadline of deadlines) {
    const dueDate = new Date(deadline.dueDate);
    const subscriptions = deadline.vehicle.user.pushSubscriptions;
    if (subscriptions.length === 0) continue;

    let payload: { title: string; body: string } | null = null;

    if (isExpired(dueDate)) {
      payload = {
        title: 'Scadenza scaduta',
        body: `${deadline.title} è scaduta`,
      };
    } else if (isApproaching(dueDate)) {
      const days = daysUntil(dueDate);
      payload = {
        title: 'Scadenza imminente',
        body: days === 0
          ? `${deadline.title} scade oggi`
          : days === 1
          ? `${deadline.title} scade domani`
          : `${deadline.title} scade tra ${days} giorni`,
      };
    }

    if (!payload) continue;

    for (const sub of subscriptions) {
      const result = await sendPush(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
      );
      if (result === 'sent') sent++;
      if (result === 'stale') staleEndpoints.push(sub.endpoint);
    }
  }

  if (staleEndpoints.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint: { in: staleEndpoints } } });
  }

  return NextResponse.json({ sent, stale: staleEndpoints.length });
}
