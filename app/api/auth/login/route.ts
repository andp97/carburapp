import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  return prisma;
}

/** POST /api/auth/login — { email, password } → verifies credentials and sets session cookie */
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

    const normalizedEmail = email.toLowerCase().trim();

    const prisma = await getPrisma();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    // Use a constant-time compare regardless of whether the user exists to prevent timing attacks
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
