'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '../Card';
import { Pill } from '../Pill';
import { Icon } from '../Icon';
import { IconTile } from '../IconTile';
import { Num } from '../Num';
import { SectionHead } from '../SectionHead';
import { Spark } from '../Spark';
import { DashboardData, Vehicle, MONTHS_IT, FUEL_LABELS } from '@/lib/types';
import { TabId } from '../TabBar';
import { formatEuro, formatLiters, formatConsumption, getDaysUntil, formatDate } from '@/lib/utils';

interface DashboardProps {
  selectedVehicle: Vehicle | null;
  onOpenAddFuel: () => void;
  onOpenManutenzione: () => void;
  onNavigate: (tab: TabId) => void;
  refreshKey?: number;
}

export function Dashboard({ selectedVehicle, onOpenAddFuel, onOpenManutenzione, onNavigate, refreshKey }: DashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);

  const now = new Date();
  const monthLabel = `${MONTHS_IT[now.getMonth()]} ${now.getFullYear()}`;

  const fetchDashboard = useCallback(async () => {
    if (!selectedVehicle) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard?vehicleId=${selectedVehicle.id}`);
      if (res.ok) {
        const d: DashboardData = await res.json();
        setData(d);
      }
    } catch {
      // Fall back to null, show mock UI
    } finally {
      setLoading(false);
    }
  }, [selectedVehicle]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard, refreshKey]);

  const currentTotal = data?.currentMonth.total ?? 0;
  const prevTotal = data?.prevMonth.total ?? 0;
  const delta = prevTotal > 0 ? ((currentTotal - prevTotal) / prevTotal) * 100 : 0;
  const deltaPositive = delta <= 0;

  const lastRefuel = data?.lastRefuel;
  const avgConsumption = data?.avgConsumption;
  const upcomingDeadlines = data?.upcomingDeadlines ?? [];

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg)',
      paddingTop: 'calc(env(safe-area-inset-top, 0px) + 76px)',
      paddingBottom: 'calc(var(--tab-bar-height) + 16px)',
    }}>
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Hero card */}
        <div style={{
          background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface-hi) 100%)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          padding: '24px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Background sparkline strip — only render when real data is available */}
          {data && (
            <div style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              left: 0,
              height: '60px',
              opacity: 0.3,
            }}>
              <Spark
                data={Array.from({ length: 12 }, (_, i) => i === 11 ? data.currentMonth.total : 0)}
                width={400}
                height={60}
                color="var(--accent)"
                strokeWidth={2}
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          )}

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
            }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-sec)' }}>
                {monthLabel}
              </span>
              {prevTotal > 0 && (
                <Pill tone={deltaPositive ? 'ok' : 'danger'}>
                  <Icon
                    name={deltaPositive ? 'arrowDown' : 'arrowUp'}
                    size={10}
                    color={deltaPositive ? 'var(--ok)' : 'var(--danger)'}
                  />
                  {Math.abs(delta).toFixed(0)}%
                </Pill>
              )}
            </div>

            <Num
              size="42px"
              weight={800}
              color="var(--text)"
              style={{ display: 'block', letterSpacing: '-0.04em', lineHeight: 1 }}
            >
              {loading ? '—' : formatEuro(currentTotal)}
            </Num>

            <p style={{ fontSize: '13px', color: 'var(--text-ter)', marginTop: '6px' }}>
              {prevTotal > 0 ? `${formatEuro(prevTotal)} mese scorso` : 'Spesa del mese'}
            </p>

            {/* Spend breakdown */}
            {data && (
              <div style={{
                display: 'flex',
                gap: '16px',
                marginTop: '20px',
                paddingTop: '20px',
                borderTop: '1px solid var(--border)',
              }}>
                <SpendItem label="Carburante" amount={data.currentMonth.fuel} color="var(--info)" />
                <SpendItem label="Manutenzione" amount={data.currentMonth.maint} color="var(--warn)" />
                <SpendItem label="Altro" amount={data.currentMonth.other} color="var(--text-ter)" />
              </div>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <StatCard
            icon="speedo"
            color="var(--info)"
            label="Consumo medio"
            value={avgConsumption ? formatConsumption(avgConsumption) : '—'}
            sub="Ultimi rifornimenti"
          />
          <StatCard
            icon="road"
            color="var(--ok)"
            label="Autonomia stimata"
            value={avgConsumption ? `~${Math.round(50 / avgConsumption * 100)} km` : '—'}
            sub="Con pieno da 50 L"
          />
        </div>

        {/* Last refuel */}
        <div>
          <SectionHead title="Ultimo rifornimento" action="Vedi tutti" onAction={() => onNavigate('storico' as TabId)} />
          {lastRefuel ? (
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <IconTile name="fuel" color="var(--info)" size={20} tileSize={44} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>
                    {FUEL_LABELS[lastRefuel.fuelType as keyof typeof FUEL_LABELS] || lastRefuel.fuelType}
                    {lastRefuel.station && <span style={{ color: 'var(--text-ter)', fontWeight: 500 }}> · {lastRefuel.station}</span>}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-ter)', marginTop: '2px' }}>
                    {formatDate(lastRefuel.date)}{lastRefuel.liters != null ? ` · ${formatLiters(lastRefuel.liters)}` : ''}
                  </div>
                </div>
                <Num size="16px" weight={700} color="var(--text)">
                  {formatEuro(lastRefuel.total)}
                </Num>
              </div>
            </Card>
          ) : (
            <Card>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                padding: '16px 0',
              }}>
                <Icon name="fuel" size={32} color="var(--text-ter)" />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-sec)' }}>
                    Nessun rifornimento
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-ter)', marginTop: '4px' }}>
                    Aggiungi il primo rifornimento
                  </div>
                </div>
                <button
                  onClick={onOpenAddFuel}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '12px',
                    background: 'var(--accent)',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    minHeight: '44px',
                  }}
                >
                  Aggiungi ora
                </button>
              </div>
            </Card>
          )}
        </div>

        {/* Upcoming deadlines */}
        <div>
          <SectionHead title="Scadenze imminenti" action="Tutte" onAction={() => onNavigate('scadenze' as TabId)} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {upcomingDeadlines.length === 0 ? (
              <Card>
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <Icon name="check" size={28} color="var(--ok)" style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: '14px', color: 'var(--text-sec)' }}>Nessuna scadenza imminente</div>
                </div>
              </Card>
            ) : (
              upcomingDeadlines.slice(0, 3).map((d) => {
                const days = getDaysUntil(d.dueDate);
                const tone = days < 0 ? 'danger' : days < 14 ? 'warn' : 'ok';
                return (
                  <Card key={d.id}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <IconTile
                        name={DEADLINE_ICON[d.kind as keyof typeof DEADLINE_ICON] || 'document'}
                        color={`var(--${tone})`}
                        size={20}
                        tileSize={44}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>
                          {d.title}
                        </div>
                        {d.subtitle && (
                          <div style={{ fontSize: '12px', color: 'var(--text-ter)', marginTop: '2px' }}>
                            {d.subtitle}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <Pill tone={tone}>
                          {days < 0 ? 'Scaduto' : days === 0 ? 'Oggi' : `${days}g`}
                        </Pill>
                        {d.amount && (
                          <Num size="12px" color="var(--text-sec)" style={{ display: 'block', marginTop: '4px' }}>
                            {formatEuro(d.amount)}
                          </Num>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div>
          <SectionHead title="Azioni rapide" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <QuickAction icon="fuel" label="Rifornimento" color="var(--info)" onClick={onOpenAddFuel} />
            <QuickAction icon="wrench" label="Manutenzione" color="var(--warn)" onClick={onOpenManutenzione} />
            <QuickAction icon="bell" label="Scadenza" color="var(--danger)" onClick={() => onNavigate('scadenze' as TabId)} />
            <QuickAction icon="chart" label="Statistiche" color="var(--ok)" onClick={() => onNavigate('statistiche' as TabId)} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SpendItem({ label, amount, color }: { label: string; amount: number; color: string }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
        <span style={{ fontSize: '11px', color: 'var(--text-ter)' }}>{label}</span>
      </div>
      <Num size="14px" weight={700} color="var(--text)">
        {formatEuro(amount)}
      </Num>
    </div>
  );
}

function StatCard({ icon, color, label, value, sub }: {
  icon: string; color: string; label: string; value: string; sub: string;
}) {
  return (
    <Card>
      <IconTile name={icon as any} color={color} size={18} tileSize={38} style={{ marginBottom: '12px' }} />
      <div style={{ fontSize: '12px', color: 'var(--text-ter)', marginBottom: '4px' }}>{label}</div>
      <Num size="15px" weight={700} color="var(--text)" style={{ display: 'block' }}>{value}</Num>
      <div style={{ fontSize: '11px', color: 'var(--text-ter)', marginTop: '2px' }}>{sub}</div>
    </Card>
  );
}

function QuickAction({ icon, label, color, onClick }: {
  icon: string; label: string; color: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px',
        cursor: 'pointer',
        textAlign: 'left',
        minHeight: '60px',
        width: '100%',
      }}
    >
      <IconTile name={icon as any} color={color} size={18} tileSize={38} />
      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', minWidth: 0, wordBreak: 'break-word' }}>{label}</span>
    </button>
  );
}

const DEADLINE_ICON = {
  assicurazione: 'shield',
  bollo: 'document',
  revisione: 'check',
  tagliando: 'wrench',
  altro: 'bell',
};


