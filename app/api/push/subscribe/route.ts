import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  return prisma;
}

// POST /api/push/subscribe — save a push subscription for the current user
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session.user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const body = await req.json();
    const { endpoint, keys } = body as { endpoint: string; keys: { p256dh: string; auth: string } };

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: 'endpoint, keys.p256dh, and keys.auth are required' }, { status: 400 });
    }

    const prisma = await getPrisma();
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { p256dh: keys.p256dh, auth: keys.auth },
      create: { userId: session.user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('POST /api/push/subscribe error:', error);
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 });
  }
}

// DELETE /api/push/subscribe — remove a push subscription
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session.user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const body = await req.json();
    const { endpoint } = body as { endpoint: string };

    if (!endpoint) {
      return NextResponse.json({ error: 'endpoint is required' }, { status: 400 });
    }

    const prisma = await getPrisma();
    await prisma.pushSubscription.deleteMany({
      where: { endpoint, userId: session.user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/push/subscribe error:', error);
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 });
  }
}
