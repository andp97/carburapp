'use client';

import React, { useState } from 'react';
import { Card } from '../Card';
import { Pill } from '../Pill';
import { Icon } from '../Icon';
import { IconTile } from '../IconTile';
import { Num } from '../Num';
import { SectionHead } from '../SectionHead';
import { Vehicle, Deadline, MONTHS_IT } from '@/lib/types';
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

const MOCK_DEADLINES: Deadline[] = [
  {
    id: '1', vehicleId: '',
    title: 'Assicurazione RC',
    subtitle: 'Generali Auto · polizza 4521-AB',
    dueDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
    kind: 'assicurazione', amount: 480, createdAt: '',
  },
  {
    id: '2', vehicleId: '',
    title: 'Revisione periodica',
    subtitle: 'Officina Fratelli Rossi',
    dueDate: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000).toISOString(),
    kind: 'revisione', amount: 120, createdAt: '',
  },
  {
    id: '3', vehicleId: '',
    title: 'Bollo auto',
    subtitle: 'Regione Lombardia',
    dueDate: new Date(Date.now() + 65 * 24 * 60 * 60 * 1000).toISOString(),
    kind: 'bollo', amount: 218, createdAt: '',
  },
  {
    id: '4', vehicleId: '',
    title: 'Tagliando',
    subtitle: 'Ogni 15.000 km · Officina Bianchi',
    dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    kind: 'tagliando', amount: 280, createdAt: '',
  },
  {
    id: '5', vehicleId: '',
    title: 'Sostituzione pneumatici',
    subtitle: 'Cambio stagionale',
    dueDate: new Date(Date.now() + 155 * 24 * 60 * 60 * 1000).toISOString(),
    kind: 'altro', amount: 420, createdAt: '',
  },
  {
    id: '6', vehicleId: '',
    title: 'Candele',
    subtitle: 'Sostituzione ordinaria',
    dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    kind: 'tagliando', amount: 90, createdAt: '',
  },
];

export function Scadenze({ vehicle }: ScadenzeProps) {
  const deadlines = MOCK_DEADLINES;
  const now = new Date();

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
      <div style={{ padding: '56px 20px 16px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
          Scadenze
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-ter)', marginTop: '4px' }}>
          {upcoming.length} prossime · {formatEuro(totalUpcoming)} previsti
        </p>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Summary card */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          padding: '20px',
        }}>
          <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-ter)', marginBottom: '16px' }}>
            Riepilogo anno
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <SummaryItem
              label="Scadute"
              value={String(expired.length)}
              color="var(--danger)"
            />
            <SummaryItem
              label="Imminenti"
              value={String(upcoming.filter(d => getDaysUntil(d.dueDate) < 30).length)}
              color="var(--warn)"
            />
            <SummaryItem
              label="Previste"
              value={formatEuro(totalUpcoming)}
              color="var(--info)"
            />
          </div>
        </div>

        {/* Expired */}
        {expired.length > 0 && (
          <div>
            <SectionHead title="Scadute" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {expired.map(d => <DeadlineCard key={d.id} deadline={d} />)}
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
              <SectionHead
                title={label}
                action={monthTotal > 0 ? formatEuro(monthTotal) : undefined}
              />
              {/* Timeline line */}
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  left: '21px',
                  top: 0,
                  bottom: 0,
                  width: 2,
                  background: 'var(--border)',
                  borderRadius: 1,
                }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {items.map((d, idx) => <TimelineDeadline key={d.id} deadline={d} isLast={idx === items.length - 1} />)}
                </div>
              </div>
            </div>
          );
        })}

        {/* Add deadline FAB */}
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            width: '100%',
            padding: '16px',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--surface)',
            border: '1px dashed var(--border-hi)',
            color: 'var(--text-sec)',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
            minHeight: '56px',
          }}
        >
          <Icon name="plus" size={18} color="var(--text-ter)" />
          Aggiungi scadenza
        </button>
      </div>
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

function DeadlineCard({ deadline }: { deadline: Deadline }) {
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
      </div>
    </Card>
  );
}

function TimelineDeadline({ deadline, isLast }: { deadline: Deadline; isLast: boolean }) {
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
        </div>
      </div>
    </div>
  );
}
