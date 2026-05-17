import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  return prisma;
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session.user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const { id } = await params;
    const prisma = await getPrisma();

    const vehicle = await prisma.vehicle.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!vehicle) return NextResponse.json({ error: 'Veicolo non trovato' }, { status: 404 });

    await prisma.vehicle.delete({ where: { id } });
    return NextResponse.json({ data: { ok: true } });
  } catch (error) {
    console.error('DELETE /api/vehicles/[id] error:', error);
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 });
  }
}
