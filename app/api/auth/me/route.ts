import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

/** GET /api/auth/me — returns session user or 401 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session.user) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }
    return NextResponse.json({ data: { id: session.user.id, email: session.user.email } });
  } catch (error) {
    console.error('GET /api/auth/me error:', error);
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 });
  }
}
