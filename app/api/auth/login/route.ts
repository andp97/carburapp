import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSession } from '@/lib/session';
import { isRateLimited, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  return prisma;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email non valida' }, { status: 400 });
    }

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Password non valida' }, { status: 400 });
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1';
    const prisma = await getPrisma();
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);

    const attemptCount = await prisma.loginAttempt.count({
      where: { ip, createdAt: { gte: windowStart } },
    });

    if (isRateLimited(attemptCount)) {
      return NextResponse.json(
        { error: 'Troppi tentativi. Riprova tra qualche minuto.' },
        { status: 429 },
      );
    }

    await prisma.loginAttempt.create({ data: { ip } });

    if (Math.random() < 0.05) {
      await prisma.loginAttempt.deleteMany({
        where: { createdAt: { lt: new Date(Date.now() - 60 * 60 * 1000) } },
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    const dummyHash = '$2b$12$invalidhashfortiminguniformity';
    const passwordMatch = user
      ? await bcrypt.compare(password, user.passwordHash)
      : await bcrypt.compare(password, dummyHash).then(() => false);

    if (!user || !passwordMatch) {
      return NextResponse.json({ error: 'Email o password non corretti' }, { status: 401 });
    }

    const session = await getSession();
    session.user = { id: user.id, email: user.email };
    await session.save();

    return NextResponse.json({ data: { id: user.id, email: user.email } });
  } catch (error) {
    console.error('POST /api/auth/login error:', error);
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 });
  }
}
