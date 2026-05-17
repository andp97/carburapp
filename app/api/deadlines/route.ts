import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
export const dynamic = 'force-dynamic';

// Allowed values for kind
const VALID_KINDS = ['assicurazione', 'bollo', 'revisione', 'tagliando', 'altro'] as const;

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  return prisma;
}

// GET /api/deadlines?vehicleId=xxx  — list all deadlines for a vehicle, sorted by dueDate asc
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session.user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const vehicleId = searchParams.get('vehicleId');

    if (!vehicleId) {
      return NextResponse.json({ error: 'vehicleId is required' }, { status: 400 });
    }

    const prisma = await getPrisma();

    const vehicle = await prisma.vehicle.findFirst({ where: { id: vehicleId, userId: session.user.id } });
    if (!vehicle) return NextResponse.json({ error: 'Veicolo non trovato' }, { status: 404 });

    const deadlines = await prisma.deadline.findMany({
      where: { vehicleId },
      orderBy: { dueDate: 'asc' },
    });

    return NextResponse.json(deadlines);
  } catch (error) {
    console.error('GET /api/deadlines error:', error);
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }
}

// POST /api/deadlines  — create deadline
// Required body: { vehicleId, title, dueDate, kind }
// Optional body: { subtitle, amount }
// Validate: vehicleId non-empty string, title 1-200 chars, kind in VALID_KINDS,
//           dueDate is valid ISO date, amount if present must be finite positive number
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session.user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const body = await req.json();
    const { vehicleId, title, dueDate, kind, subtitle, amount } = body;

    // Validate vehicleId
    if (!vehicleId || typeof vehicleId !== 'string' || vehicleId.trim().length === 0) {
      return NextResponse.json({ error: 'vehicleId must be a non-empty string' }, { status: 400 });
    }

    // Validate title
    if (!title || typeof title !== 'string' || title.trim().length === 0 || title.length > 200) {
      return NextResponse.json({ error: 'title must be a string between 1 and 200 characters' }, { status: 400 });
    }

    // Validate kind
    if (!kind || !(VALID_KINDS as readonly string[]).includes(kind)) {
      return NextResponse.json(
        { error: `kind must be one of: ${VALID_KINDS.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate dueDate
    if (!dueDate) {
      return NextResponse.json({ error: 'dueDate is required' }, { status: 400 });
    }
    const parsedDate = new Date(dueDate);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: 'dueDate must be a valid ISO date' }, { status: 400 });
    }

    // Validate amount if present
    if (amount !== undefined && amount !== null) {
      const numAmount = Number(amount);
      if (!isFinite(numAmount) || numAmount <= 0) {
        return NextResponse.json({ error: 'amount must be a finite positive number' }, { status: 400 });
      }
    }

    const prisma = await getPrisma();

    const vehicle = await prisma.vehicle.findFirst({ where: { id: String(vehicleId).trim(), userId: session.user.id } });
    if (!vehicle) return NextResponse.json({ error: 'Veicolo non trovato' }, { status: 404 });

    const deadline = await prisma.deadline.create({
      data: {
        vehicleId: String(vehicleId).trim(),
        title: String(title).trim(),
        subtitle: subtitle ? String(subtitle) : null,
        dueDate: parsedDate,
        kind: String(kind),
        amount: amount !== undefined && amount !== null ? Number(amount) : null,
      },
    });

    return NextResponse.json(deadline, { status: 201 });
  } catch (error) {
    console.error('POST /api/deadlines error:', error);
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }
}

// DELETE /api/deadlines?id=xxx  — delete single deadline
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session.user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const prisma = await getPrisma();

    const existing = await prisma.deadline.findFirst({ where: { id, vehicle: { userId: session.user.id } } });
    if (!existing) return NextResponse.json({ error: 'Scadenza non trovata' }, { status: 404 });

    await prisma.deadline.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/deadlines error:', error);
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }
}
