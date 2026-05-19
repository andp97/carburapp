import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { deadlineKindToExpenseType } from '@/lib/deadlineUtils';
import type { DeadlineKind } from '@/lib/types';

export const dynamic = 'force-dynamic';

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma');
  return prisma;
}

// POST /api/deadlines/[id]/resolve
// Marks a deadline as paid: creates an Expense record and deletes the deadline.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session.user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const { id } = await params;

    const prisma = await getPrisma();

    const deadline = await prisma.deadline.findFirst({
      where: { id, vehicle: { userId: session.user.id } },
    });

    if (!deadline) {
      return NextResponse.json({ error: 'Scadenza non trovata' }, { status: 404 });
    }

    const expenseType = deadlineKindToExpenseType(deadline.kind as DeadlineKind);

    const [expense] = await prisma.$transaction([
      prisma.expense.create({
        data: {
          vehicleId: deadline.vehicleId,
          expenseType,
          total: deadline.amount ?? 0,
          notes: deadline.title,
          date: new Date(),
        },
      }),
      prisma.deadline.delete({ where: { id } }),
    ]);

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error('POST /api/deadlines/[id]/resolve error:', error);
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 });
  }
}
