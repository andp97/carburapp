'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../Card';
import { Pill } from '../Pill';
import { Icon } from '../Icon';
import { IconTile } from '../IconTile';
import { Num } from '../Num';
import { SectionHead } from '../SectionHead';
import { Vehicle, Deadline, DeadlineKind, Refuel, MONTHS_IT, DEADLINE_LABELS, EXPENSE_TYPE_LABELS, EXPENSE_TYPE_ICONS } from '@/lib/types';
import { formatEuro, getDaysUntil, formatDate } from '@/lib/utils';

interface ScadenzeProps {
  vehicle: Vehicle | null;
}

const DEADLINE_ICON: Record<string, string> = {
  assicurazione: 'shield',
  bollo: 'document',
  revisione: 'check',
  tagliando: 'wrench',
  altro: 'bell',
};

function getDeadlineTone(days: number): 'danger' | 'warn' | 'ok' | 'info' {
  if (days < 0) return 'danger';
  if (days < 14) return 'warn';
  if (days < 60) return 'info';
  return 'ok';
}

function getDaysLabel(days: number): string {
  if (days < 0) return `Scaduto ${Math.abs(days)}g fa`;
  if (days === 0) return 'Oggi';
  if (days === 1) return 'Domani';
  return `Tra ${days} giorni`;
}

const KIND_OPTIONS: DeadlineKind[] = ['assicurazione', 'bollo', 'revisione', 'tagliando', 'altro'];

export function Scadenze({ vehicle }: ScadenzeProps) {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [maintenanceHistory, setMaintenanceHistory] = useState<Refuel[]>([]);

  const fetchDeadlines = useCallback(async () => {
    if (!vehicle) return;
    setLoading(true);
    try {
      const [deadlineRes, refuelRes] = await Promise.all([
        fetch(`/api/deadlines?vehicleId=${vehicle.id}`),
        fetch(`/api/refuels?vehicleId=${vehicle.id}`),
      ]);
      if (deadlineRes.ok) {
        const data: Deadline[] = await deadlineRes.json();
        setDeadlines(data);
      }
      if (refuelRes.ok) {
        const refuelData: Refuel[] = await refuelRes.json();
        const history = refuelData
          .filter(r => r.expenseType === 'manutenzione')
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setMaintenanceHistory(history);
      }
    } catch {
      // ignore, show empty state
    } finally {
      setLoading(false);
    }
  }, [vehicle]);

  useEffect(() => { fetchDeadlines(); }, [fetchDeadlines]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/deadlines?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchDeadlines();
    } catch {
      // ignore
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await fetch(`/api/deadlines/${id}/resolve`, { method: 'POST' });
      fetchDeadlines();
    } catch {
      // ignore
    }
  };

  const expired = deadlines.filter(d => getDaysUntil(d.dueDate) < 0);
  const upcoming = deadlines.filter(d => getDaysUntil(d.dueDate) >= 0);

  // Group upcoming by month for timeline
  const byMonth: Record<string, Deadline[]> = {};
  for (const d of upcoming) {
    const date = new Date(d.dueDate);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(d);
  }
  const monthKeys = Object.keys(byMonth).sort();

  const totalUpcoming = upcoming.reduce((s, d) => s + (d.amount || 0), 0);

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg)',
      paddingBottom: 'calc(var(--tab-bar-height) + 16px)',
    }}>
      {/* Header */}
      <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 76px) 20px 16px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
          Scadenze
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-ter)', marginTop: '4px' }}>
          {upcoming.length} prossime · {formatEuro(totalUpcoming)} previsti
        </p>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: 72, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', animation: 'pulse 1.4s ease-in-out infinite' }} />
            ))}
            <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
          </div>
        ) : deadlines.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '60px 0', textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: '22px', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="bell" size={32} color="var(--text-ter)" />
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-sec)', marginBottom: '6px' }}>Nessuna scadenza</div>
              <div style={{ fontSize: '14px', color: 'var(--text-ter)' }}>Aggiungi promemoria per non<br />dimenticare le scadenze</div>
            </div>
            <button
              onClick={() => setShowForm(true)}
              style={{ padding: '12px 24px', borderRadius: '14px', background: 'var(--accent)', color: '#fff', fontSize: '15px', fontWeight: 700, border: 'none', cursor: 'pointer', minHeight: '48px' }}
            >
              Aggiungi scadenza
            </button>
          </div>
        ) : (
          <>
            {/* Summary card */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '20px' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-ter)', marginBottom: '16px' }}>
                Riepilogo anno
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <SummaryItem label="Scadute" value={String(expired.length)} color="var(--danger)" />
                <SummaryItem label="Imminenti" value={String(upcoming.filter(d => getDaysUntil(d.dueDate) < 30).length)} color="var(--warn)" />
                <SummaryItem label="Previste" value={formatEuro(totalUpcoming)} color="var(--info)" />
              </div>
            </div>

            {/* Expired */}
            {expired.length > 0 && (
              <div>
                <SectionHead title="Scadute" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {expired.map(d => <DeadlineCard key={d.id} deadline={d} onDelete={handleDelete} onResolve={handleResolve} />)}
                </div>
              </div>
            )}

            {/* Timeline by month */}
            {monthKeys.map(key => {
              const [year, month] = key.split('-');
              const label = `${MONTHS_IT[parseInt(month) - 1]} ${year}`;
              const items = byMonth[key];
              const monthTotal = items.reduce((s, d) => s + (d.amount || 0), 0);
              return (
                <div key={key}>
                  <SectionHead title={label} action={monthTotal > 0 ? formatEuro(monthTotal) : undefined} />
                  <div style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '21px', top: 0, bottom: 0, width: 2, background: 'var(--border)', borderRadius: 1 }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {items.map((d, idx) => <TimelineDeadline key={d.id} deadline={d} isLast={idx === items.length - 1} onDelete={handleDelete} onResolve={handleResolve} />)}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Add deadline button */}
            <button
              aria-label="Aggiungi scadenza"
              onClick={() => setShowForm(true)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%', padding: '16px', borderRadius: 'var(--radius-lg)', background: 'var(--surface)', border: '1px dashed var(--border-hi)', color: 'var(--text-sec)', fontSize: '15px', fontWeight: 600, cursor: 'pointer', minHeight: '56px' }}
            >
              <Icon name="plus" size={18} color="var(--text-ter)" />
              Aggiungi scadenza
            </button>
          </>
        )}

        {/* Maintenance history — always visible */}
        <div>
          <SectionHead title="Storico manutenzioni" />
          {maintenanceHistory.length === 0 ? (
            <p style={{ fontSize: '14px', color: 'var(--text-ter)', paddingTop: '8px' }}>
              Nessuna manutenzione registrata
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {maintenanceHistory.map(r => {
                const iconName = EXPENSE_TYPE_ICONS[r.expenseType];
                const iconColor = 'var(--warn)';
                const title = r.notes || r.station || EXPENSE_TYPE_LABELS[r.expenseType];
                return (
                  <Card key={r.id}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <IconTile name={iconName as any} color={iconColor} size={20} tileSize={44} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {title}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-ter)', marginTop: '2px' }}>
                          {formatDate(r.date)}
                        </div>
                      </div>
                      <Num size="14px" weight={700} color="var(--text)" style={{ flexShrink: 0 }}>
                        {formatEuro(r.total)}
                      </Num>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add deadline form sheet */}
      {showForm && (
        <AddDeadlineSheet
          vehicle={vehicle}
          onClose={() => setShowForm(false)}
          onSuccess={() => { fetchDeadlines(); setShowForm(false); }}
        />
      )}
    </div>
  );
}

function SummaryItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        fontSize: '18px',
        fontWeight: 800,
        color,
        fontFamily: 'var(--font-mono)',
        letterSpacing: '-0.02em',
      }}>{value}</div>
      <div style={{ fontSize: '11px', color: 'var(--text-ter)', marginTop: '2px' }}>{label}</div>
    </div>
  );
}

function DeadlineCard({ deadline, onDelete, onResolve }: { deadline: Deadline; onDelete: (id: string) => void; onResolve: (id: string) => void }) {
  const days = getDaysUntil(deadline.dueDate);
  const tone = getDeadlineTone(days);
  const icon = DEADLINE_ICON[deadline.kind] || 'bell';

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <IconTile name={icon as any} color={`var(--${tone})`} size={20} tileSize={44} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>
            {deadline.title}
          </div>
          {deadline.subtitle && (
            <div style={{ fontSize: '12px', color: 'var(--text-ter)', marginTop: '2px' }}>
              {deadline.subtitle}
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <Pill tone={tone}>{getDaysLabel(days)}</Pill>
          {deadline.amount && (
            <Num size="12px" color="var(--text-sec)" style={{ display: 'block', marginTop: '4px' }}>
              {formatEuro(deadline.amount)}
            </Num>
          )}
        </div>
        <button
          aria-label="Elimina scadenza"
          onClick={() => onDelete(deadline.id)}
          style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--surface-hi)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          <Icon name="x" size={13} color="var(--text-ter)" />
        </button>
        <button
          aria-label="Segna come pagata"
          onClick={() => onResolve(deadline.id)}
          style={{
            padding: '6px 12px',
            borderRadius: '10px',
            background: 'color-mix(in srgb, var(--ok) 15%, transparent)',
            color: 'var(--ok)',
            fontSize: '12px',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          Pagata
        </button>
      </div>
    </Card>
  );
}

function TimelineDeadline({ deadline, isLast, onDelete, onResolve }: { deadline: Deadline; isLast: boolean; onDelete: (id: string) => void; onResolve: (id: string) => void }) {
  const days = getDaysUntil(deadline.dueDate);
  const tone = getDeadlineTone(days);
  const icon = DEADLINE_ICON[deadline.kind] || 'bell';

  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', paddingLeft: '8px' }}>
      {/* Timeline dot */}
      <div style={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        background: 'var(--bg)',
        border: `2px solid var(--${tone})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        marginTop: '2px',
        zIndex: 1,
      }}>
        <Icon name={icon as any} size={12} color={`var(--${tone})`} />
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 14px',
        marginBottom: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>
              {deadline.title}
            </div>
            {deadline.subtitle && (
              <div style={{ fontSize: '12px', color: 'var(--text-ter)', marginTop: '2px' }}>
                {deadline.subtitle}
              </div>
            )}
            <div style={{ fontSize: '11px', color: 'var(--text-ter)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
              {formatDate(deadline.dueDate)}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <Pill tone={tone}>{getDaysLabel(days)}</Pill>
            {deadline.amount && (
              <Num size="13px" weight={700} color="var(--text)" style={{ display: 'block', marginTop: '4px' }}>
                {formatEuro(deadline.amount)}
              </Num>
            )}
          </div>
          <button
            aria-label="Elimina scadenza"
            onClick={() => onDelete(deadline.id)}
            style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--surface-hi)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >
            <Icon name="x" size={13} color="var(--text-ter)" />
          </button>
        </div>
        <button
          aria-label="Segna come pagata"
          onClick={() => onResolve(deadline.id)}
          style={{
            marginTop: '10px',
            width: '100%',
            padding: '8px',
            borderRadius: 'var(--radius-md)',
            background: 'color-mix(in srgb, var(--ok) 15%, transparent)',
            color: 'var(--ok)',
            fontSize: '12px',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Segna come pagata
        </button>
      </div>
    </div>
  );
}

interface AddDeadlineFormData {
  title: string;
  subtitle: string;
  dueDate: string;
  kind: DeadlineKind;
  amount: string;
}

function AddDeadlineSheet({ vehicle, onClose, onSuccess }: { vehicle: Vehicle | null; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState<AddDeadlineFormData>({ title: '', subtitle: '', dueDate: '', kind: 'assicurazione', amount: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!vehicle) return;
    if (!form.title || !form.dueDate) { setError('Titolo e data sono obbligatori'); return; }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/deadlines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: vehicle.id,
          title: form.title,
          subtitle: form.subtitle || undefined,
          dueDate: form.dueDate,
          kind: form.kind,
          amount: form.amount ? parseFloat(form.amount) : undefined,
        }),
      });
      if (!res.ok) throw new Error('Errore nel salvataggio');
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore sconosciuto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }}
      />
      {/* Sheet */}
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 201, background: 'var(--surface)', borderRadius: '24px 24px 0 0', border: '1px solid var(--border-hi)', borderBottom: 'none', maxHeight: '92dvh', overflowY: 'auto', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '12px', paddingBottom: '4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-hi)' }} />
        </div>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px 16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)' }}>Nuova scadenza</h2>
          <button
            aria-label="Chiudi"
            onClick={onClose}
            style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--surface-hi)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="x" size={18} color="var(--text-sec)" />
          </button>
        </div>

        <div style={{ padding: '0 20px 32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Title */}
          <div>
            <FormLabel>Titolo *</FormLabel>
            <FormInput type="text" placeholder="Es. Assicurazione RC" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>

          {/* Subtitle */}
          <div>
            <FormLabel>Note aggiuntive</FormLabel>
            <FormInput type="text" placeholder="Note aggiuntive" value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} />
          </div>

          {/* Due date */}
          <div>
            <FormLabel>Data scadenza *</FormLabel>
            <FormInput type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
          </div>

          {/* Kind */}
          <div>
            <FormLabel>Tipo</FormLabel>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
              {KIND_OPTIONS.map(k => (
                <button
                  key={k}
                  onClick={() => setForm(f => ({ ...f, kind: k }))}
                  style={{ padding: '7px 14px', borderRadius: '100px', fontSize: '13px', fontWeight: 600, background: form.kind === k ? 'var(--accent)' : 'var(--surface-hi)', color: form.kind === k ? '#fff' : 'var(--text-sec)', border: 'none', cursor: 'pointer', minHeight: '34px' }}
                >
                  {DEADLINE_LABELS[k]}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <FormLabel>Importo (€)</FormLabel>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--surface-lo)', border: '1px solid var(--border-hi)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <span style={{ padding: '14px 12px 14px 14px', fontSize: '16px', color: 'var(--text-ter)' }}>€</span>
              <input
                type="number"
                placeholder="0,00"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                inputMode="decimal"
                step="0.01"
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', padding: '14px 14px 14px 0', fontSize: '16px', fontWeight: 500, color: 'var(--text)', fontFamily: 'var(--font-ui)' }}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 'var(--radius-md)', padding: '12px', fontSize: '13px', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="x" size={16} color="var(--danger)" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onClose}
              style={{ flex: 1, padding: '14px', borderRadius: 'var(--radius-lg)', background: 'var(--surface-hi)', color: 'var(--text-sec)', fontSize: '15px', fontWeight: 700, border: 'none', cursor: 'pointer', minHeight: '52px' }}
            >
              Annulla
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{ flex: 2, padding: '14px', borderRadius: 'var(--radius-lg)', background: 'var(--accent)', color: '#fff', fontSize: '15px', fontWeight: 800, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, minHeight: '52px' }}
            >
              {loading ? 'Salvataggio...' : 'Salva'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function FormLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-ter)', marginBottom: '8px' }}>
      {children}
    </div>
  );
}

function FormInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{ width: '100%', background: 'var(--surface-lo)', border: '1px solid var(--border-hi)', borderRadius: 'var(--radius-md)', padding: '14px', fontSize: '16px', fontWeight: 500, color: 'var(--text)', outline: 'none', fontFamily: 'var(--font-ui)', ...props.style }}
    />
  );
}
