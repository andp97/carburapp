import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  return prisma;
}

/** POST /api/auth/register — { email, password } → creates user and sets session cookie */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || typeof email !== 'string' || !email.includes('@') || email.length > 254) {
      return NextResponse.json({ error: 'Email non valida' }, { status: 400 });
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { error: 'La password deve contenere almeno 8 caratteri' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    const prisma = await getPrisma();

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: 'Esiste già un account con questa email' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
      },
    });

    const session = await getSession();
    session.user = { id: user.id, email: user.email };
    await session.save();

    return NextResponse.json({ data: { id: user.id, email: user.email } }, { status: 201 });
  } catch (error) {
    console.error('POST /api/auth/register error:', error);
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 });
  }
}
