import { getIronSession, IronSession, IronSessionOptions } from 'iron-session';
import { cookies } from 'next/headers';
import type { SessionUser } from '@/lib/types';

/** Session data stored in the encrypted cookie. */
export interface SessionData {
  user?: SessionUser;
}

const SESSION_OPTIONS: IronSessionOptions = {
  cookieName: 'carburapp_session',
  password: process.env.SESSION_SECRET as string,
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
};

/**
 * Returns the iron-session instance for the current request.
 * Must be called inside a Server Component, API Route, or Server Action.
 */
export async function getSession(): Promise<IronSession<SessionData>> {
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
    throw new Error('SESSION_SECRET env var must be set and at least 32 characters long');
  }
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, SESSION_OPTIONS);
}
