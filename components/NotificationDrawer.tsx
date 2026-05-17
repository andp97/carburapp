'use client';

import React, { useState } from 'react';
import { Icon } from './Icon';
import { IconTile } from './IconTile';
import { Pill } from './Pill';
import { Num } from './Num';
import { Deadline, DEADLINE_LABELS } from '@/lib/types';
import { getDaysUntil, formatDate, formatEuro } from '@/lib/utils';

const DEADLINE_ICON: Record<string, string> = {
  assicurazione: 'shield',
  bollo: 'document',
  revisione: 'check',
  tagliando: 'wrench',
  altro: 'bell',
};

function getDeadlineTone(days: number): 'danger' | 'warn' {
  return days < 0 ? 'danger' : 'warn';
}

function getDaysLabel(days: number): string {
  if (days < 0) return `Scaduto ${Math.abs(days)}g fa`;
  if (days === 0) return 'Oggi';
  if (days === 1) return 'Domani';
  return `Tra ${days} giorni`;
}

interface NotificationDrawerProps {
  deadlines: Deadline[];
  onClose: () => void;
  onResolve: (id: string) => Promise<void>;
}

export function NotificationDrawer({ deadlines, onClose, onResolve }: NotificationDrawerProps) {
  const [resolving, setResolving] = useState<string | null>(null);

  const urgent = deadlines.filter((d) => getDaysUntil(d.dueDate) <= 7);

  const handleResolve = async (id: string) => {
    setResolving(id);
    try {
      await onResolve(id);
    } finally {
      setResolving(null);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
      />

      {/* Sheet */}
      <div style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 201,
        background: 'var(--surface)',
        borderRadius: '24px 24px 0 0',
        border: '1px solid var(--border-hi)',
        borderBottom: 'none',
        maxHeight: '80dvh',
        overflowY: 'auto',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '12px', paddingBottom: '4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-hi)' }} />
        </div>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 20px 16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Icon name="bell" size={20} color="var(--accent)" />
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)' }}>Avvisi</h2>
          </div>
          <button
            aria-label="Chiudi"
            onClick={onClose}
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'var(--surface-hi)', border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Icon name="x" size={18} color="var(--text-sec)" />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '0 20px 32px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {urgent.length === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: '12px', padding: '40px 0', textAlign: 'center',
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: '18px',
                background: 'var(--surface-hi)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name="check" size={26} color="var(--ok)" />
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-sec)' }}>
                Tutto a posto
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-ter)' }}>
                Nessuna scadenza urgente
              </div>
            </div>
          ) : (
            urgent.map((d) => {
              const days = getDaysUntil(d.dueDate);
              const tone = getDeadlineTone(days);
              const icon = DEADLINE_ICON[d.kind] || 'bell';
              const isResolving = resolving === d.id;

              return (
                <div
                  key={d.id}
                  style={{
                    background: 'var(--surface-lo)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '14px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <IconTile name={icon as any} color={`var(--${tone})`} size={18} tileSize={40} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>
                          {d.title}
                        </span>
                        <Pill tone={tone}>{getDaysLabel(days)}</Pill>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-ter)', marginTop: '3px' }}>
                        {DEADLINE_LABELS[d.kind as keyof typeof DEADLINE_LABELS]} · {formatDate(d.dueDate)}
                      </div>
                      {d.amount != null && (
                        <Num size="13px" weight={700} color="var(--text)" style={{ display: 'block', marginTop: '4px' }}>
                          {formatEuro(d.amount)}
                        </Num>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleResolve(d.id)}
                    disabled={isResolving}
                    style={{
                      marginTop: '12px',
                      width: '100%',
                      padding: '10px',
                      borderRadius: 'var(--radius-md)',
                      background: isResolving ? 'var(--surface-hi)' : 'var(--accent)',
                      color: isResolving ? 'var(--text-ter)' : '#fff',
                      fontSize: '13px',
                      fontWeight: 700,
                      border: 'none',
                      cursor: isResolving ? 'not-allowed' : 'pointer',
                      transition: 'opacity 0.15s',
                    }}
                  >
                    {isResolving ? 'Salvataggio...' : 'Segna come pagata'}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
