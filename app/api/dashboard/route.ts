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

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // Current month fuel expenses only
    const currentFuelExpenses = await prisma.expense.findMany({
      where: { vehicleId, expenseType: 'carburante', date: { gte: startOfMonth } },
      orderBy: { date: 'desc' },
    });

    // Current month non-fuel expenses (for maint/other breakdown)
    const currentMaintExpenses = await prisma.expense.findMany({
      where: { vehicleId, expenseType: 'manutenzione', date: { gte: startOfMonth } },
    });
    const currentOtherExpenses = await prisma.expense.findMany({
      where: { vehicleId, expenseType: 'altro', date: { gte: startOfMonth } },
    });

    // Previous month fuel expenses only
    const prevFuelExpenses = await prisma.expense.findMany({
      where: {
        vehicleId,
        expenseType: 'carburante',
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

    // Last fuel expense (non-fuel entries don't belong on the fuel card)
    const lastExpense = await prisma.expense.findFirst({
      where: { vehicleId, expenseType: 'carburante' },
      orderBy: { date: 'desc' },
    });

    // Average consumption from last 10 full fuel expenses (carburante only)
    const fullFuelExpenses = await prisma.expense.findMany({
      where: { vehicleId, isFull: true, expenseType: 'carburante' },
      orderBy: [{ date: 'desc' }, { odometer: 'desc' }],
      take: 10,
    });

    let avgConsumption: number | null = null;
    if (fullFuelExpenses.length >= 2) {
      const pairs: { liters: number; km: number }[] = [];
      for (let i = 0; i < fullFuelExpenses.length - 1; i++) {
        const newer = fullFuelExpenses[i];
        const older = fullFuelExpenses[i + 1];
        if (newer.odometer == null || older.odometer == null || newer.liters == null) continue;
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

    const currentMonthFuel = currentFuelExpenses.reduce((s: number, r: { total: number }) => s + r.total, 0);

    const currentMonthDeadlines = await prisma.deadline.findMany({
      where: {
        vehicleId,
        dueDate: { gte: startOfMonth },
        amount: { not: null },
      },
    });

    const maintFromDeadlines = currentMonthDeadlines
      .filter((d: { kind: string }) => d.kind === 'tagliando' || d.kind === 'revisione')
      .reduce((s: number, d: { amount: number | null }) => s + (d.amount ?? 0), 0);
    const maintFromExpenses = currentMaintExpenses.reduce((s: number, r: { total: number }) => s + r.total, 0);
    const maintTotal = maintFromDeadlines + maintFromExpenses;

    const otherFromDeadlines = currentMonthDeadlines
      .filter((d: { kind: string }) => d.kind === 'assicurazione' || d.kind === 'bollo' || d.kind === 'altro')
      .reduce((s: number, d: { amount: number | null }) => s + (d.amount ?? 0), 0);
    const otherFromExpenses = currentOtherExpenses.reduce((s: number, r: { total: number }) => s + r.total, 0);
    const otherTotal = otherFromDeadlines + otherFromExpenses;

    const result = {
      currentMonth: {
        fuel: currentMonthFuel,
        maint: maintTotal,
        other: otherTotal,
        total: currentMonthFuel + maintTotal + otherTotal,
      },
      prevMonth: {
        total: prevFuelExpenses.reduce((s: number, r: { total: number }) => s + r.total, 0),
      },
      avgConsumption,
      lastExpense,
      upcomingDeadlines,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/dashboard error:', error);
    return NextResponse.json({ error: 'Database unavailable' }, { status: 503 });
  }
}
