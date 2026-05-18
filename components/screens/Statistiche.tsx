'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '../Card';
import { Pill } from '../Pill';
import { Icon } from '../Icon';
import { Num } from '../Num';
import { SectionHead } from '../SectionHead';
import { Vehicle, Refuel, MONTHS_IT } from '@/lib/types';

interface StatisticheProps {
  vehicle: Vehicle | null;
  refreshKey?: number;
}

type Range = '3m' | '6m' | '1y' | 'all';

const RANGE_LABELS: Record<Range, string> = {
  '3m': '3 mesi',
  '6m': '6 mesi',
  '1y': '1 anno',
  'all': 'Sempre',
};


function filterByRange(refuels: Refuel[], range: Range): Refuel[] {
  const now = new Date();
  if (range === 'all') return refuels;
  const months = range === '3m' ? 3 : range === '6m' ? 6 : 12;
  const cutoff = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
  return refuels.filter(r => new Date(r.date) >= cutoff);
}

function getMonthKey(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthShort(key: string) {
  const [, month] = key.split('-');
  return MONTHS_IT[parseInt(month) - 1].slice(0, 3).toUpperCase();
}

export function Statistiche({ vehicle, refreshKey }: StatisticheProps) {
  const [range, setRange] = useState<Range>('6m');
  const [allRefuels, setAllRefuels] = useState<Refuel[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRefuels = useCallback(async () => {
    if (!vehicle) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/refuels?vehicleId=${vehicle.id}`);
      if (res.ok) {
        const data: Refuel[] = await res.json();
        setAllRefuels(data);
      }
    } catch { /* show empty state */ }
    finally { setLoading(false); }
  }, [vehicle]);

  useEffect(() => { fetchRefuels(); }, [fetchRefuels, refreshKey]);

  const refuels = filterByRange(allRefuels, range);

  // KPIs
  const totalSpend = refuels.reduce((s, r) => s + r.total, 0);
  // Only fuel entries have odometer readings meaningful for km-driven
  const fuelRefuels = refuels.filter(r => r.expenseType === 'carburante' && r.odometer != null);
  const first = fuelRefuels.length > 0 ? fuelRefuels[fuelRefuels.length - 1] : null;
  const last = fuelRefuels.length > 0 ? fuelRefuels[0] : null;
  const kmDriven = first && last && first.odometer != null && last.odometer != null
    ? last.odometer - first.odometer
    : 0;
  const costPerKm = kmDriven > 0 ? totalSpend / kmDriven : null;

  // Avg consumption (L/100km) from consecutive full-tank pairs (fuel entries only)
  const fullTanks = fuelRefuels
    .filter(r => r.isFull && r.odometer != null)
    .sort((a, b) => (a.odometer ?? 0) - (b.odometer ?? 0));
  const consumptionReadings: number[] = [];
  for (let i = 1; i < fullTanks.length; i++) {
    const prevOdo = fullTanks[i - 1].odometer;
    const currOdo = fullTanks[i].odometer;
    const currLiters = fullTanks[i].liters;
    if (prevOdo == null || currOdo == null || currLiters == null) continue;
    const km = currOdo - prevOdo;
    if (km > 0) consumptionReadings.push((currLiters / km) * 100);
  }
  const avgConsumption = consumptionReadings.length > 0
    ? consumptionReadings.reduce((a, b) => a + b, 0) / consumptionReadings.length
    : null;

  // Monthly totals for bar chart
  const byMonth: Record<string, number> = {};
  for (const r of refuels) {
    const k = getMonthKey(r.date);
    byMonth[k] = (byMonth[k] || 0) + r.total;
  }
  const monthKeys = Object.keys(byMonth).sort().slice(-6);
  const maxMonthly = Math.max(...monthKeys.map(k => byMonth[k]), 1);

  // Monthly consumption for line chart (fuel entries only)
  const consumptionByMonth: Record<string, number[]> = {};
  for (let i = 1; i < fullTanks.length; i++) {
    const prevOdo = fullTanks[i - 1].odometer;
    const currOdo = fullTanks[i].odometer;
    const currLiters = fullTanks[i].liters;
    if (prevOdo == null || currOdo == null || currLiters == null) continue;
    const km = currOdo - prevOdo;
    if (km > 0) {
      const k = getMonthKey(fullTanks[i].date);
      if (!consumptionByMonth[k]) consumptionByMonth[k] = [];
      consumptionByMonth[k].push((currLiters / km) * 100);
    }
  }

  // Top stations
  const stationCounts: Record<string, { count: number; total: number }> = {};
  for (const r of refuels) {
    const s = r.station || 'Sconosciuto';
    if (!stationCounts[s]) stationCounts[s] = { count: 0, total: 0 };
    stationCounts[s].count++;
    stationCounts[s].total += r.total;
  }
  const topStations = Object.entries(stationCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 4);
  const maxCount = topStations.length > 0 ? topStations[0][1].count : 1;

  const formatEuroSimple = (n: number) =>
    n.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const lineData = monthKeys.map(k => {
    const readings = consumptionByMonth[k];
    return readings && readings.length > 0
      ? readings.reduce((a, b) => a + b, 0) / readings.length
      : null;
  });

  // Fill nulls with interpolated/avg
  const validLineData = lineData.map(v => v ?? avgConsumption ?? 7.0);

  if (loading) {
    return (
      <div style={{
        minHeight: '100dvh',
        background: 'var(--bg)',
        paddingBottom: 'calc(var(--tab-bar-height) + 16px)',
      }}>
        <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
        <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 76px) 20px 16px' }}>
          <div style={{ height: 28, width: 140, background: 'var(--surface)', borderRadius: 8, animation: 'pulse 1.4s ease-in-out infinite', marginBottom: 8 }} />
          <div style={{ height: 16, width: 200, background: 'var(--surface)', borderRadius: 6, animation: 'pulse 1.4s ease-in-out infinite' }} />
        </div>
        <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <StatSkeleton height={88} />
            <StatSkeleton height={88} />
          </div>
          <StatSkeleton height={180} />
          <StatSkeleton height={140} />
          <StatSkeleton height={100} />
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg)',
      paddingBottom: 'calc(var(--tab-bar-height) + 16px)',
    }}>
      {/* Header */}
      <div style={{ padding: 'calc(env(safe-area-inset-top, 0px) + 76px) 20px 16px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
          Statistiche
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-ter)', marginTop: '4px' }}>
          L&apos;andamento della tua auto
        </p>
      </div>

      {/* Range selector */}
      <div style={{ padding: '0 20px 16px' }}>
        <div style={{
          display: 'flex',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '3px',
          gap: '2px',
        }}>
          {(Object.keys(RANGE_LABELS) as Range[]).map(r => {
            const active = range === r;
            return (
              <button key={r} onClick={() => setRange(r)} style={{
                flex: 1,
                padding: '8px 4px',
                borderRadius: '9px',
                border: 'none',
                background: active ? 'var(--surface-hi)' : 'transparent',
                color: active ? 'var(--text)' : 'var(--text-sec)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all .15s',
              }}>{RANGE_LABELS[r]}</button>
            );
          })}
        </div>
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <Card padding="14px">
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--text-ter)' }}>
              Costo per km
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '8px' }}>
              <span style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-mono)', letterSpacing: '-0.5px' }}>
                {costPerKm != null ? costPerKm.toFixed(3).replace('.', ',') : '—'}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-sec)', fontWeight: 600 }}>€/km</span>
            </div>
          </Card>
          <Card padding="14px">
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--text-ter)' }}>
              Km percorsi
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '8px' }}>
              <span style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-mono)', letterSpacing: '-0.5px' }}>
                {kmDriven > 0 ? kmDriven.toLocaleString('it-IT') : '—'}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-sec)', fontWeight: 600 }}>km</span>
            </div>
            {kmDriven > 0 && monthKeys.length > 0 && (
              <div style={{ fontSize: '11px', color: 'var(--text-ter)', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
                ≈ {Math.round(kmDriven / monthKeys.length).toLocaleString('it-IT')} km/mese
              </div>
            )}
          </Card>
        </div>

        {/* Monthly spend bar chart */}
        <Card padding="18px">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>Spesa mensile</div>
            <span style={{ fontSize: '13px', color: 'var(--text-sec)', fontWeight: 700 }}>
              {formatEuroSimple(totalSpend)} €
            </span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-ter)', marginBottom: '16px' }}>
            Carburante · {refuels.length} rifornimenti
          </div>

          {monthKeys.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '120px' }}>
              {monthKeys.map((k, i) => {
                const val = byMonth[k];
                const barH = Math.max((val / maxMonthly) * 110, 4);
                const isLast = i === monthKeys.length - 1;
                return (
                  <div key={k} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                    <div style={{
                      fontSize: '9px', fontWeight: 700, color: 'var(--text-ter)',
                      fontFamily: 'var(--font-mono)', letterSpacing: '0.3px',
                      visibility: val > maxMonthly * 0.5 ? 'visible' : 'hidden',
                    }}>
                      {formatEuroSimple(val)}
                    </div>
                    <div style={{ width: '100%', height: `${barH}px`, borderRadius: '5px', background: isLast ? 'var(--accent)' : 'var(--surface-hi)', transition: 'height .3s ease' }} />
                    <div style={{ fontSize: '10px', fontWeight: 700, color: isLast ? 'var(--text)' : 'var(--text-ter)', letterSpacing: '0.5px' }}>
                      {getMonthShort(k)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-ter)', fontSize: '13px' }}>
              Nessun dato disponibile
            </div>
          )}
        </Card>

        {/* Consumption line chart */}
        <Card padding="18px">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>Consumo medio</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
                {avgConsumption != null ? avgConsumption.toFixed(1).replace('.', ',') : '—'}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-sec)', fontWeight: 600 }}>L/100km</span>
            </div>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-ter)', marginBottom: '12px' }}>
            Basato sui pieni effettuati
          </div>

          {validLineData.length >= 2 ? (
            <LineChart data={validLineData} labels={monthKeys.map(getMonthShort)} />
          ) : (
            <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-ter)', fontSize: '13px' }}>
              Servono almeno 2 pieni per il grafico
            </div>
          )}
        </Card>

        {/* Top stations */}
        {topStations.length > 0 && (
          <Card padding="18px">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>Distributori preferiti</div>
              <span style={{ fontSize: '11px', color: 'var(--text-ter)' }}>{refuels.length} rifornimenti</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {topStations.map(([name, stats], i) => (
                <div key={name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '5px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: '8px' }}>
                      {name}
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-ter)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                      {stats.count}×
                    </span>
                  </div>
                  <div style={{ height: '6px', borderRadius: '3px', background: 'var(--surface-hi)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${(stats.count / maxCount) * 100}%`,
                      background: i === 0 ? 'var(--accent)' : 'var(--info)',
                      borderRadius: '3px',
                      transition: 'width .3s ease',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Total summary */}
        <Card padding="18px" style={{ marginBottom: '8px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-ter)' }}>
                Spesa totale
              </div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text)', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
                {formatEuroSimple(totalSpend)} <span style={{ fontSize: '14px', color: 'var(--text-sec)', fontWeight: 600 }}>€</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-ter)' }}>
                Litri totali
              </div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text)', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
                {refuels.reduce((s, r) => s + (r.liters ?? 0), 0).toFixed(0)} <span style={{ fontSize: '14px', color: 'var(--text-sec)', fontWeight: 600 }}>L</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatSkeleton({ height }: { height: number }) {
  return (
    <div style={{
      height,
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      animation: 'pulse 1.4s ease-in-out infinite',
    }} />
  );
}

function LineChart({ data, labels }: { data: number[]; labels: string[] }) {
  const w = 300, h = 100, padX = 8, padY = 8;
  const min = Math.min(...data) - 0.5;
  const max = Math.max(...data) + 0.5;
  const step = (w - padX * 2) / (data.length - 1);
  const toY = (v: number) => h - padY - ((v - min) / (max - min)) * (h - padY * 2);
  const pts = data.map((v, i) => ({ x: padX + i * step, y: toY(v) }));
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const fill = `${d} L${pts[pts.length - 1].x} ${h} L${pts[0].x} ${h} Z`;

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id="statConsG" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Grid line at midpoint */}
        <line x1={padX} x2={w - padX} y1={toY((min + max) / 2)} y2={toY((min + max) / 2)} stroke="var(--border)" strokeDasharray="2 4" />
        <path d={fill} fill="url(#statConsG)" />
        <path d={d} fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={i === pts.length - 1 ? 4 : 2.5}
            fill={i === pts.length - 1 ? 'var(--accent)' : 'var(--bg)'}
            stroke="var(--accent)" strokeWidth="2" />
        ))}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', padding: `0 ${padX}px` }}>
        {labels.map((l, i) => (
          <div key={i} style={{
            fontSize: '10px', fontWeight: 700,
            color: i === labels.length - 1 ? 'var(--text)' : 'var(--text-ter)',
            letterSpacing: '0.4px',
          }}>{l}</div>
        ))}
      </div>
    </div>
  );
}
