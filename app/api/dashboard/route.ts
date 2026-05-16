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

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // Current month refuels
    const currentRefuels = await prisma.refuel.findMany({
      where: { vehicleId, date: { gte: startOfMonth } },
      orderBy: { date: 'desc' },
    });

    // Previous month refuels
    const prevRefuels = await prisma.refuel.findMany({
      where: {
        vehicleId,
        date: { gte: startOfPrevMonth, lte: endOfPrevMonth },
      },
    });

    // Upcoming deadlines (next 90 days)
    const upcomingDeadlines = await prisma.deadline.findMany({
      where: {
        vehicleId,
        dueDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { dueDate: 'asc' },
      take: 5,
    });

    // Last refuel
    const lastRefuel = await prisma.refuel.findFirst({
      where: { vehicleId },
      orderBy: { date: 'desc' },
    });

    // Average consumption from last 10 full refuels
    const fullRefuels = await prisma.refuel.findMany({
      where: { vehicleId, isFull: true },
      orderBy: { date: 'desc' },
      take: 10,
    });

    let avgConsumption: number | null = null;
    if (fullRefuels.length >= 2) {
      const pairs: { liters: number; km: number }[] = [];
      for (let i = 0; i < fullRefuels.length - 1; i++) {
        const newer = fullRefuels[i];
        const older = fullRefuels[i + 1];
        const km = newer.odometer - older.odometer;
        if (km > 0 && km < 5000) {
          pairs.push({ liters: newer.liters, km });
        }
      }
      if (pairs.length > 0) {
        const totalL = pairs.reduce((s: number, p: { liters: number; km: number }) => s + p.liters, 0);
        const totalKm = pairs.reduce((s: number, p: { liters: number; km: number }) => s + p.km, 0);
        avgConsumption = (totalL / totalKm) * 100;
      }
    }

    const currentMonthTotal = currentRefuels.reduce((s: number, r: { total: number }) => s + r.total, 0);

    const result = {
      currentMonth: {
        total: currentMonthTotal,
        fuel: currentMonthTotal,
        maint: 0,
        other: 0,
      },
      prevMonth: {
        total: prevRefuels.reduce((s: number, r: { total: number }) => s + r.total, 0),
      },
      avgConsumption,
      lastRefuel,
      upcomingDeadlines,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/dashboard error:', error);
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }
}
