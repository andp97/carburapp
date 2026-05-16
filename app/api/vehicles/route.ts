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

    // Validate name
    if (typeof name !== 'string' || name.trim().length === 0 || name.length > 100) {
      return NextResponse.json({ error: 'name must be a string between 1 and 100 characters' }, { status: 400 });
    }

    // Validate plate
    if (typeof plate !== 'string' || plate.trim().length === 0 || plate.length > 20) {
      return NextResponse.json({ error: 'plate must be a string between 1 and 20 characters' }, { status: 400 });
    }

    // Validate year
    const currentYear = new Date().getFullYear();
    const yearNum = Number(year);
    if (!Number.isInteger(yearNum) || !isFinite(yearNum) || yearNum < 1900 || yearNum > currentYear + 1) {
      return NextResponse.json(
        { error: `year must be an integer between 1900 and ${currentYear + 1}` },
        { status: 400 }
      );
    }

    const prisma = await getPrisma();
    const vehicle = await prisma.vehicle.create({
      data: {
        name: String(name).trim(),
        plate: String(plate).toUpperCase().trim(),
        year: yearNum,
      },
    });

    return NextResponse.json(vehicle, { status: 201 });
  } catch (error) {
    console.error('POST /api/vehicles error:', error);
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }
}
