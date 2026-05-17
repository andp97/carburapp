import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  return prisma;
}

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
    const session = await getSession();
    if (!session.user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const body = await req.json();
    const { vehicleId, expenseType: rawExpenseType, fuelType, liters, total, odometer, station, notes, isFull, date } = body;

    const VALID_EXPENSE_TYPES = ['carburante', 'manutenzione', 'altro'];
    const expenseType = rawExpenseType ?? 'carburante';
    if (!VALID_EXPENSE_TYPES.includes(String(expenseType))) {
      return NextResponse.json(
        { error: `expenseType must be one of: ${VALID_EXPENSE_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    if (!vehicleId || total == null) {
      return NextResponse.json(
        { error: 'vehicleId and total are required' },
        { status: 400 }
      );
    }

    // Carburante-specific required fields
    if (expenseType === 'carburante') {
      if (!fuelType || liters == null || odometer == null) {
        return NextResponse.json(
          { error: 'fuelType, liters, and odometer are required for carburante' },
          { status: 400 }
        );
      }

      const VALID_FUEL_TYPES = ['benzina', 'diesel', 'gpl', 'metano', 'elettrico'];
      if (!VALID_FUEL_TYPES.includes(String(fuelType))) {
        return NextResponse.json(
          { error: `fuelType must be one of: ${VALID_FUEL_TYPES.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Validate liters if provided
    let litersNum: number | null = null;
    if (liters != null) {
      litersNum = Number(liters);
      if (!isFinite(litersNum) || litersNum <= 0 || litersNum >= 10000) {
        return NextResponse.json({ error: 'liters must be a positive number less than 10000' }, { status: 400 });
      }
    }

    // Validate total
    const totalNum = Number(total);
    if (!isFinite(totalNum) || totalNum <= 0 || totalNum >= 100000) {
      return NextResponse.json({ error: 'total must be a positive number less than 100000' }, { status: 400 });
    }

    // Validate odometer if provided
    let odometerNum: number | null = null;
    if (odometer != null) {
      odometerNum = Number(odometer);
      if (!Number.isInteger(odometerNum) || odometerNum <= 0 || odometerNum >= 10000000) {
        return NextResponse.json({ error: 'odometer must be a positive integer less than 10000000' }, { status: 400 });
      }
    }

    // Validate date if provided
    let parsedDate: Date | undefined;
    if (date !== undefined && date !== null) {
      parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json({ error: 'date must be a valid date' }, { status: 400 });
      }
    }

    // Truncate station and notes to 500 chars max
    const stationTrimmed = station ? String(station).slice(0, 500) : null;
    const notesTrimmed = notes ? String(notes).slice(0, 500) : null;

    const prisma = await getPrisma();

    const vehicle = await prisma.vehicle.findFirst({ where: { id: String(vehicleId), userId: session.user.id } });
    if (!vehicle) return NextResponse.json({ error: 'Veicolo non trovato' }, { status: 404 });

    const refuel = await prisma.refuel.create({
      data: {
        vehicleId: String(vehicleId),
        expenseType: String(expenseType),
        fuelType: fuelType ? String(fuelType) : null,
        liters: litersNum,
        total: totalNum,
        odometer: odometerNum,
        station: stationTrimmed,
        notes: notesTrimmed,
        isFull: Boolean(isFull ?? true),
        date: parsedDate,
      },
    });

    return NextResponse.json(refuel, { status: 201 });
  } catch (error) {
    console.error('POST /api/refuels error:', error);
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }
}
