'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';

type View = 'login' | 'reset' | 'sent';

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--surface)',
  border: '1px solid var(--border-hi)',
  borderRadius: '14px',
  padding: '14px 16px',
  fontSize: '16px',
  fontWeight: 500,
  color: 'var(--text)',
  fontFamily: 'var(--font-ui)',
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: 'var(--text-ter)',
  marginBottom: '8px',
};

export default function LoginPage() {
  const [view, setView] = useState<View>('login');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Reset request form state
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error ?? 'Errore di accesso');
        return;
      }
      window.location.href = '/app';
    } catch {
      setLoginError('Errore di rete. Riprova.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetLoading(true);
    try {
      const res = await fetch('/api/auth/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, cfToken: resetToken }),
      });
      if (!res.ok) {
        const data = await res.json();
        setResetError(data.error ?? 'Errore del server');
        turnstileRef.current?.reset();
        setResetToken('');
        return;
      }
      setView('sent');
    } catch {
      setResetError('Errore di rete. Riprova.');
      turnstileRef.current?.reset();
      setResetToken('');
    } finally {
      setResetLoading(false);
    }
  };

  const logo = (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
      <div style={{ width: 64, height: 64, borderRadius: 20, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 21V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16M5 21h11M5 12h11M16 9l2.5 2.5a1.5 1.5 0 0 1 .5 1.1V17a1.5 1.5 0 0 0 3 0V8.4a1.5 1.5 0 0 0-.4-1L19 5" />
        </svg>
      </div>
    </div>
  );

  if (view === 'sent') {
    return (
      <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          {logo}
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text)', textAlign: 'center', marginBottom: '6px', letterSpacing: '-0.02em' }}>
            Email inviata
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--text-ter)', textAlign: 'center', marginBottom: '36px' }}>
            {"Se l'email è registrata, riceverai un link a breve."}
          </p>
          <button
            onClick={() => { setView('login'); setResetEmail(''); setResetToken(''); }}
            style={{ width: '100%', padding: '16px', borderRadius: '16px', background: 'var(--accent)', color: '#fff', fontSize: '16px', fontWeight: 800, border: 'none', cursor: 'pointer', minHeight: '56px', fontFamily: 'var(--font-ui)' }}
          >
            Torna al login
          </button>
        </div>
      </div>
    );
  }

  if (view === 'reset') {
    return (
      <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          {logo}
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text)', textAlign: 'center', marginBottom: '6px', letterSpacing: '-0.02em' }}>
            Password dimenticata
          </h1>
          <p style={{ fontSize: '15px', color: 'var(--text-ter)', textAlign: 'center', marginBottom: '36px' }}>
            Inserisci la tua email e ti invieremo un link per reimpostare la password.
          </p>

          <form onSubmit={handleResetRequest} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                autoComplete="email"
                value={resetEmail}
                onChange={e => setResetEmail(e.target.value)}
                placeholder="tuaemail@esempio.it"
                required
                style={inputStyle}
              />
            </div>

            <Turnstile
              ref={turnstileRef}
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
              onSuccess={setResetToken}
              onExpire={() => setResetToken('')}
              options={{ size: 'flexible', theme: 'auto' }}
            />

            {resetError && (
              <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: '12px', padding: '12px 14px', fontSize: '14px', color: 'var(--danger)' }}>
                {resetError}
              </div>
            )}

            <button
              type="submit"
              disabled={resetLoading || !resetToken}
              style={{ marginTop: '6px', width: '100%', padding: '16px', borderRadius: '16px', background: 'var(--accent)', color: '#fff', fontSize: '16px', fontWeight: 800, border: 'none', cursor: resetLoading || !resetToken ? 'not-allowed' : 'pointer', opacity: resetLoading || !resetToken ? 0.5 : 1, minHeight: '56px', fontFamily: 'var(--font-ui)', transition: 'opacity 0.15s' }}
            >
              {resetLoading ? 'Invio in corso…' : 'Invia link di reset'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-ter)' }}>
            <button
              onClick={() => { setView('login'); setResetError(null); setResetToken(''); }}
              style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 700, fontSize: '14px', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-ui)' }}
            >
              Torna al login
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {logo}
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text)', textAlign: 'center', marginBottom: '6px', letterSpacing: '-0.02em' }}>
          CarburApp
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-ter)', textAlign: 'center', marginBottom: '36px' }}>
          Accedi al tuo account
        </p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tuaemail@esempio.it"
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={inputStyle}
            />
          </div>

          <div style={{ textAlign: 'right' }}>
            <button
              type="button"
              onClick={() => { setView('reset'); setLoginError(null); }}
              style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 600, fontSize: '13px', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-ui)' }}
            >
              Hai dimenticato la password?
            </button>
          </div>

          {loginError && (
            <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: '12px', padding: '12px 14px', fontSize: '14px', color: 'var(--danger)' }}>
              {loginError}
            </div>
          )}

          <button
            type="submit"
            disabled={loginLoading}
            style={{ marginTop: '6px', width: '100%', padding: '16px', borderRadius: '16px', background: 'var(--accent)', color: '#fff', fontSize: '16px', fontWeight: 800, border: 'none', cursor: loginLoading ? 'not-allowed' : 'pointer', opacity: loginLoading ? 0.7 : 1, minHeight: '56px', fontFamily: 'var(--font-ui)' }}
          >
            {loginLoading ? 'Accesso in corso…' : 'Accedi'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-ter)' }}>
          Non hai un account?{' '}
          <Link href="/register" style={{ color: 'var(--accent)', fontWeight: 700, textDecoration: 'none' }}>
            Registrati
          </Link>
        </p>
      </div>
    </div>
  );
}
