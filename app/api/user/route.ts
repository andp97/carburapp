import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  return prisma;
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session.user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const body = await req.json();
    const { currentPassword, newEmail, newPassword } = body;

    if (!currentPassword || typeof currentPassword !== 'string') {
      return NextResponse.json({ error: 'Password attuale richiesta' }, { status: 400 });
    }
    if (!newEmail && !newPassword) {
      return NextResponse.json({ error: 'Nessuna modifica richiesta' }, { status: 400 });
    }

    const prisma = await getPrisma();
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 });

    const passwordOk = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!passwordOk) {
      return NextResponse.json({ error: 'Password attuale non corretta' }, { status: 400 });
    }

    if (newEmail) {
      if (typeof newEmail !== 'string' || !newEmail.includes('@') || newEmail.length > 254) {
        return NextResponse.json({ error: 'Email non valida' }, { status: 400 });
      }
      const normalized = newEmail.toLowerCase().trim();
      const existing = await prisma.user.findUnique({ where: { email: normalized } });
      if (existing) {
        return NextResponse.json({ error: 'Email già in uso' }, { status: 409 });
      }
      await prisma.user.update({ where: { id: user.id }, data: { email: normalized } });
      session.user = { ...session.user, email: normalized };
      await session.save();
    }

    if (newPassword) {
      if (typeof newPassword !== 'string' || newPassword.length < 8) {
        return NextResponse.json({ error: 'La password deve contenere almeno 8 caratteri' }, { status: 400 });
      }
      const hash = await bcrypt.hash(newPassword, 12);
      await prisma.user.update({ where: { id: user.id }, data: { passwordHash: hash } });
    }

    return NextResponse.json({ data: { ok: true } });
  } catch (error) {
    console.error('PUT /api/user error:', error);
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session.user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const body = await req.json();
    const { password } = body;

    if (!password || typeof password !== 'string') {
      return NextResponse.json({ error: 'Password richiesta' }, { status: 400 });
    }

    const prisma = await getPrisma();
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user) return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 });

    const passwordOk = await bcrypt.compare(password, user.passwordHash);
    if (!passwordOk) {
      return NextResponse.json({ error: 'Password non corretta' }, { status: 400 });
    }

    await prisma.user.delete({ where: { id: user.id } });
    await session.destroy();

    return NextResponse.json({ data: { ok: true } });
  } catch (error) {
    console.error('DELETE /api/user error:', error);
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 });
  }
}
