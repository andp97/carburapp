import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  return prisma;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const vehicleId = searchParams.get('vehicleId');

    if (!vehicleId) {
      return NextResponse.json({ error: 'vehicleId is required' }, { status: 400 });
    }

    const prisma = await getPrisma();
    const refuels = await prisma.refuel.findMany({
      where: { vehicleId },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(refuels);
  } catch (error) {
    console.error('GET /api/refuels error:', error);
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { vehicleId, fuelType, liters, total, odometer, station, notes, isFull, date } = body;

    if (!vehicleId || !fuelType || liters == null || total == null || odometer == null) {
      return NextResponse.json(
        { error: 'vehicleId, fuelType, liters, total, odometer are required' },
        { status: 400 }
      );
    }

    const prisma = await getPrisma();
    const refuel = await prisma.refuel.create({
      data: {
        vehicleId: String(vehicleId),
        fuelType: String(fuelType),
        liters: Number(liters),
        total: Number(total),
        odometer: Number(odometer),
        station: station ? String(station) : null,
        notes: notes ? String(notes) : null,
        isFull: Boolean(isFull ?? true),
        date: date ? new Date(date) : undefined,
      },
    });

    return NextResponse.json(refuel, { status: 201 });
  } catch (error) {
    console.error('POST /api/refuels error:', error);
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }
}
