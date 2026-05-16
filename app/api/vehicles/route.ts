import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  return prisma;
}

export async function GET() {
  try {
    const prisma = await getPrisma();
    const vehicles = await prisma.vehicle.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json(vehicles);
  } catch (error) {
    console.error('GET /api/vehicles error:', error);
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, plate, year } = body;

    if (!name || !plate || !year) {
      return NextResponse.json({ error: 'name, plate, year are required' }, { status: 400 });
    }

    const prisma = await getPrisma();
    const vehicle = await prisma.vehicle.create({
      data: {
        name: String(name),
        plate: String(plate).toUpperCase(),
        year: Number(year),
      },
    });

    return NextResponse.json(vehicle, { status: 201 });
  } catch (error) {
    console.error('POST /api/vehicles error:', error);
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }
}
