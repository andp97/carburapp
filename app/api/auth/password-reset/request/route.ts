import { after } from 'next/server';
import { NextRequest, NextResponse } from 'next/server';
import { generateToken, hashToken } from '@/lib/token';
import { sendPasswordResetEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

const TOKEN_EXPIRY_MS = 60 * 60 * 1000;

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  return prisma;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, cfToken } = body;

    if (!cfToken || typeof cfToken !== 'string') {
      return NextResponse.json({ error: 'Verifica di sicurezza richiesta' }, { status: 400 });
    }

    const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: process.env.TURNSTILE_SECRET_KEY, response: cfToken }),
    });
    const verifyData = await verifyRes.json();
    if (!verifyData.success) {
      return NextResponse.json({ error: 'Verifica di sicurezza fallita. Riprova.' }, { status: 400 });
    }

    const ok = NextResponse.json({
      data: { message: "Se l'email è registrata, riceverai un link a breve." },
    });

    if (!email || typeof email !== 'string') return ok;

    const normalizedEmail = email.toLowerCase().trim();
    const prisma = await getPrisma();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) return ok;

    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    });

    const raw = generateToken();
    const token = hashToken(raw);
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS);

    await prisma.passwordResetToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const resetUrl = `${appUrl}/reset-password?token=${raw}`;

    after(async () => {
      try {
        await sendPasswordResetEmail(normalizedEmail, resetUrl);
      } catch (err) {
        console.error('Failed to send password reset email:', err);
      }
    });

    return ok;
  } catch (error) {
    console.error('POST /api/auth/password-reset/request error:', error);
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 });
  }
}
