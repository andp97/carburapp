'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '../Card';
import { Pill } from '../Pill';
import { Icon } from '../Icon';
import { Num } from '../Num';
import { Vehicle, Refuel, FuelType, FUEL_COLORS, FUEL_LABELS } from '@/lib/types';
import { formatEuro, formatLiters, getWeekLabel, getMonthKeyLabel, groupByMonth, groupByWeek } from '@/lib/utils';

interface StoricoProps {
  vehicle: Vehicle | null;
  onOpenAddFuel: () => void;
  refreshKey?: number;
}

type GroupMode = 'settimana' | 'mese';
type FuelFilter = 'tutto' | FuelType;

const FUEL_FILTERS: { id: FuelFilter; label: string }[] = [
  { id: 'tutto', label: 'Tutto' },
  { id: 'benzina', label: 'Carburante' },
  { id: 'diesel', label: 'Diesel' },
  { id: 'gpl', label: 'GPL' },
  { id: 'metano', label: 'Metano' },
  { id: 'elettrico', label: 'Altro' },
];

export function Storico({ vehicle, onOpenAddFuel, refreshKey }: StoricoProps) {
  const [refuels, setRefuels] = useState<Refuel[]>([]);
  const [loading, setLoading] = useState(false);
  const [groupMode, setGroupMode] = useState<GroupMode>('mese');
  const [search, setSearch] = useState('');
  const [fuelFilter, setFuelFilter] = useState<FuelFilter>('tutto');

  const fetchRefuels = useCallback(async () => {
    if (!vehicle) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/refuels?vehicleId=${vehicle.id}`);
      if (res.ok) {
        const data: Refuel[] = await res.json();
        setRefuels(data);
      }
    } catch {
      setRefuels([]);
    } finally {
      setLoading(false);
    }
  }, [vehicle]);

  useEffect(() => { fetchRefuels(); }, [fetchRefuels, refreshKey]);

  const filtered = refuels.filter(r => {
    if (fuelFilter !== 'tutto' && r.fuelType !== fuelFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (r.fuelType ?? '').includes(q) ||
        r.station?.toLowerCase().includes(q) ||
        r.notes?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const groups = groupMode === 'mese'
    ? groupByMonth(filtered)
    : groupByWeek(filtered);

  const sortedKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg)',
      paddingBottom: 'calc(var(--tab-bar-height) + 16px)',
    }}>
      {/* Header */}
      <div style={{ padding: '56px 20px 16px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
          Storico
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-ter)', marginTop: '4px' }}>
          {refuels.length} {refuels.length === 1 ? 'rifornimento' : 'rifornimenti'} registrati
        </p>
      </div>

      {/* Search + filter */}
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
        {/* Search bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '0 14px',
          height: 46,
        }}>
          <Icon name="search" size={16} color="var(--text-ter)" />
          <input
            type="text"
            placeholder="Cerca carburante, distributore…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              fontSize: '14px',
              color: 'var(--text)',
              fontFamily: 'var(--font-ui)',
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ color: 'var(--text-ter)' }}>
              <Icon name="x" size={14} color="var(--text-ter)" />
            </button>
          )}
        </div>

        {/* Fuel type filter chips */}
        <div style={{
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          paddingBottom: '2px',
          scrollbarWidth: 'none',
        }}>
          {FUEL_FILTERS.map(f => {
            const active = fuelFilter === f.id;
            const color = f.id !== 'tutto' ? FUEL_COLORS[f.id as FuelType] : 'var(--accent)';
            return (
              <button
                key={f.id}
                onClick={() => setFuelFilter(f.id)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '100px',
                  fontSize: '13px',
                  fontWeight: 600,
                  background: active ? color : 'var(--surface)',
                  color: active ? '#fff' : 'var(--text-sec)',
                  border: active ? 'none' : '1px solid var(--border)',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(.2,.8,.25,1)',
                  minHeight: '34px',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Group mode toggle */}
        <div style={{
          display: 'flex',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '3px',
          gap: '3px',
          alignSelf: 'flex-start',
        }}>
          {(['mese', 'settimana'] as GroupMode[]).map(m => (
            <button
              key={m}
              onClick={() => setGroupMode(m)}
              style={{
                padding: '7px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                background: groupMode === m ? 'var(--accent)' : 'transparent',
                color: groupMode === m ? '#fff' : 'var(--text-sec)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                minHeight: '34px',
                textTransform: 'capitalize',
              }}
            >
              Per {m}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {loading ? (
          <SkeletonGroup />
        ) : filtered.length === 0 ? (
          <EmptyState onAdd={onOpenAddFuel} />
        ) : (
          sortedKeys.map(key => {
            const items = groups[key];
            const label = groupMode === 'mese' ? getMonthKeyLabel(key) : getWeekLabel(key);
            const total = items.reduce((s, r) => s + r.total, 0);
            return (
              <div key={key}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                }}>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    textTransform: 'uppercase' as const,
                    letterSpacing: '0.08em',
                    color: 'var(--text-ter)',
                  }}>
                    {label}
                  </span>
                  <Num size="13px" weight={700} color="var(--text-sec)">
                    {formatEuro(total)}
                  </Num>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {items.map(refuel => (
                    <RefuelRow key={refuel.id} refuel={refuel} />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function RefuelRow({ refuel }: { refuel: Refuel }) {
  const fuelColor = FUEL_COLORS[refuel.fuelType as keyof typeof FUEL_COLORS] || 'var(--info)';
  const label = FUEL_LABELS[refuel.fuelType as keyof typeof FUEL_LABELS] || refuel.fuelType;
  const d = new Date(refuel.date);
  const dayNum = d.getDate().toString().padStart(2, '0');
  const monthAbbr = ['gen','feb','mar','apr','mag','giu','lug','ago','set','ott','nov','dic'][d.getMonth()];

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Date stamp box */}
        <div style={{
          width: 40,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1px',
        }}>
          <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)', lineHeight: 1, fontFamily: 'var(--font-mono)' }}>
            {dayNum}
          </span>
          <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-ter)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {monthAbbr}
          </span>
        </div>

        {/* Colored vertical bar */}
        <div style={{
          width: 3,
          alignSelf: 'stretch',
          borderRadius: '2px',
          background: fuelColor,
          flexShrink: 0,
          minHeight: '44px',
        }} />

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>
              {refuel.station || label}
            </span>
            {refuel.isFull && refuel.expenseType === 'carburante' && <Pill tone="info">Pieno</Pill>}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-ter)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ color: fuelColor, fontWeight: 600 }}>{label}</span>
            {refuel.liters != null && (
              <>
                <span>·</span>
                <span>{formatLiters(refuel.liters)}</span>
                <span>·</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>
                  €{(refuel.total / refuel.liters).toFixed(3).replace('.', ',')}/L
                </span>
              </>
            )}
          </div>
          {refuel.odometer != null && (
            <div style={{ fontSize: '11px', color: 'var(--text-ter)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
              {refuel.odometer.toLocaleString('it-IT')} km
            </div>
          )}
        </div>

        <Num size="16px" weight={700} color="var(--text)" style={{ flexShrink: 0 }}>
          {formatEuro(refuel.total)}
        </Num>
      </div>
    </Card>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      padding: '60px 0',
      textAlign: 'center',
    }}>
      <div style={{
        width: 72, height: 72,
        borderRadius: '22px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name="receipt" size={32} color="var(--text-ter)" />
      </div>
      <div>
        <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-sec)', marginBottom: '6px' }}>
          Nessun rifornimento
        </div>
        <div style={{ fontSize: '14px', color: 'var(--text-ter)' }}>
          Inizia a tracciare le spese<br />del tuo veicolo
        </div>
      </div>
      <button
        onClick={onAdd}
        style={{
          padding: '12px 24px',
          borderRadius: '14px',
          background: 'var(--accent)',
          color: '#fff',
          fontSize: '15px',
          fontWeight: 700,
          border: 'none',
          cursor: 'pointer',
          minHeight: '48px',
        }}
      >
        Primo rifornimento
      </button>
    </div>
  );
}

function SkeletonGroup() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {[1, 2, 3].map(i => (
        <div
          key={i}
          style={{
            height: 80,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            animation: 'pulse 1.4s ease-in-out infinite',
          }}
        />
      ))}
      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </div>
  );
}

