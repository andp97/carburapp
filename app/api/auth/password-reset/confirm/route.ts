import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { hashToken, isTokenValid } from '@/lib/token';

export const dynamic = 'force-dynamic';

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  return prisma;
}

const INVALID = NextResponse.json({ error: 'Token non valido o scaduto' }, { status: 400 });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, newPassword } = body;

    if (!token || typeof token !== 'string' || !newPassword || typeof newPassword !== 'string') {
      return INVALID;
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'La password deve contenere almeno 8 caratteri' },
        { status: 400 },
      );
    }

    const hashedToken = hashToken(token);
    const prisma = await getPrisma();

    const record = await prisma.passwordResetToken.findUnique({
      where: { token: hashedToken },
    });

    if (!record || !isTokenValid(record)) return INVALID;

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ data: { message: 'Password aggiornata' } });
  } catch (error) {
    console.error('POST /api/auth/password-reset/confirm error:', error);
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 });
  }
}
