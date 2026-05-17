import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

/** POST /api/auth/logout — clears the session cookie */
export async function POST() {
  try {
    const session = await getSession();
    session.destroy();
    return NextResponse.json({ data: { ok: true } });
  } catch (error) {
    console.error('POST /api/auth/logout error:', error);
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 });
  }
}
