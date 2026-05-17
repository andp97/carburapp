'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Le password non coincidono');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, cfToken: token }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Errore di registrazione');
        turnstileRef.current?.reset();
        setToken('');
        return;
      }
      window.location.href = '/';
    } catch {
      setError('Errore di rete. Riprova.');
      turnstileRef.current?.reset();
      setToken('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20,
            background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 21V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16M5 21h11M5 12h11M16 9l2.5 2.5a1.5 1.5 0 0 1 .5 1.1V17a1.5 1.5 0 0 0 3 0V8.4a1.5 1.5 0 0 0-.4-1L19 5" />
            </svg>
          </div>
        </div>

        <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text)', textAlign: 'center', marginBottom: '6px', letterSpacing: '-0.02em' }}>
          CarburApp
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-ter)', textAlign: 'center', marginBottom: '36px' }}>
          Crea il tuo account
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-ter)', marginBottom: '8px' }}>
              Email
            </label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tuaemail@esempio.it"
              required
              style={{
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
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-ter)', marginBottom: '8px' }}>
              Password
            </label>
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Almeno 8 caratteri"
              required
              style={{
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
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-ter)', marginBottom: '8px' }}>
              Conferma password
            </label>
            <input
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="••••••••"
              required
              style={{
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
              }}
            />
          </div>

          <Turnstile
            ref={turnstileRef}
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
            onSuccess={setToken}
            onExpire={() => setToken('')}
            options={{ size: 'flexible', theme: 'auto' }}
          />

          {error && (
            <div style={{
              background: 'rgba(248,113,113,0.1)',
              border: '1px solid rgba(248,113,113,0.25)',
              borderRadius: '12px',
              padding: '12px 14px',
              fontSize: '14px',
              color: 'var(--danger)',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !token}
            style={{
              marginTop: '6px',
              width: '100%',
              padding: '16px',
              borderRadius: '16px',
              background: 'var(--accent)',
              color: '#fff',
              fontSize: '16px',
              fontWeight: 800,
              border: 'none',
              cursor: loading || !token ? 'not-allowed' : 'pointer',
              opacity: loading || !token ? 0.5 : 1,
              minHeight: '56px',
              fontFamily: 'var(--font-ui)',
              transition: 'opacity 0.15s',
            }}
          >
            {loading ? 'Registrazione in corso…' : 'Registrati'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-ter)' }}>
          Hai già un account?{' '}
          <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 700, textDecoration: 'none' }}>
            Accedi
          </Link>
        </p>
      </div>
    </div>
  );
}
