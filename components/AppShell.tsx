'use client';

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import { TabBar, TabId } from './TabBar';
import { Dashboard } from './screens/Dashboard';
import { Storico } from './screens/Storico';
import { Scadenze } from './screens/Scadenze';
import { Statistiche } from './screens/Statistiche';
import { Onboarding } from './screens/Onboarding';
import { Settings } from './screens/Settings';
import { SheetAddFuel } from './SheetAddFuel';
import { Icon } from './Icon';
import { VehicleChip } from './VehicleChip';
import { NotificationDrawer } from './NotificationDrawer';
import { useTheme } from '@/contexts/ThemeContext';
import { Sidebar } from './Sidebar';
import type { Vehicle, Deadline, ExpenseType } from '@/lib/types';
import { getDaysUntil } from '@/lib/utils';

export function AppShell() {
  const { toggleMode, mode } = useTheme();
  const [, startTransition] = useTransition();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('riepilogo');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetInitialType, setSheetInitialType] = useState<ExpenseType | undefined>(undefined);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [alertDeadlines, setAlertDeadlines] = useState<Deadline[]>([]);
  const [notifDrawerOpen, setNotifDrawerOpen] = useState(false);

  const alertCount = alertDeadlines.filter((d) => getDaysUntil(d.dueDate) <= 7).length;

  const fetchVehicles = useCallback(async () => {
    try {
      const res = await fetch('/api/vehicles');
      if (res.status === 401) {
        window.location.href = '/login';
        return;
      }
      if (res.ok) {
        const data: Vehicle[] = await res.json();
        setVehicles(data);
        if (data.length > 0 && !selectedVehicle) {
          setSelectedVehicle(data[0]);
        }
      }
    } catch {
      // DB might not be available — show onboarding anyway but with no vehicles
    } finally {
      setLoading(false);
    }
  }, [selectedVehicle]);

  useEffect(() => { fetchVehicles(); }, [fetchVehicles]);

  useEffect(() => {
    if (!selectedVehicle) { setAlertDeadlines([]); return; }
    fetch(`/api/deadlines?vehicleId=${selectedVehicle.id}`)
      .then((r) => r.ok ? r.json() : [])
      .then((data: Deadline[]) => setAlertDeadlines(data))
      .catch(() => {});
  }, [selectedVehicle, refreshKey]);

  const handleOnboardingComplete = (vehicle: Vehicle) => {
    setVehicles([vehicle]);
    setSelectedVehicle(vehicle);
  };

  const handleTabChange = (tab: TabId) => {
    if (tab === 'aggiungi') {
      handleOpenSheet();
      return;
    }
    startTransition(() => setActiveTab(tab));
  };

  const handleOpenSheet = (expenseType?: ExpenseType) => {
    setSheetInitialType(expenseType);
    setSheetOpen(true);
  };

  const handleRefuelSuccess = () => {
    setSheetOpen(false);
    setSheetInitialType(undefined);
    setRefreshKey(k => k + 1);
  };

  const handleVehicleAdded = (vehicle: Vehicle) => {
    setVehicles(prev => [...prev, vehicle]);
    setSelectedVehicle(vehicle);
  };

  const handleVehicleDeleted = (id: string) => {
    setVehicles(prev => {
      const next = prev.filter(v => v.id !== id);
      if (selectedVehicle?.id === id) {
        setSelectedVehicle(next[0] ?? null);
      }
      return next;
    });
  };

  const handleResolve = async (id: string) => {
    await fetch(`/api/deadlines/${id}/resolve`, { method: 'POST' });
    setRefreshKey((k) => k + 1);
    if (selectedVehicle) {
      const r = await fetch(`/api/deadlines?vehicleId=${selectedVehicle.id}`);
      if (r.ok) setAlertDeadlines(await r.json());
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100dvh',
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 21V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16M5 21h11M5 12h11M16 9l2.5 2.5a1.5 1.5 0 0 1 .5 1.1V17a1.5 1.5 0 0 0 3 0V8.4a1.5 1.5 0 0 0-.4-1L19 5"/>
          </svg>
        </div>
      </div>
    );
  }

  if (vehicles.length === 0) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  const renderScreen = () => {
    switch (activeTab) {
      case 'riepilogo':
        return (
          <Dashboard
            selectedVehicle={selectedVehicle}
            onOpenAddFuel={() => handleOpenSheet()}
            onOpenManutenzione={() => handleOpenSheet('manutenzione')}
            onNavigate={setActiveTab}
            refreshKey={refreshKey}
          />
        );
      case 'storico':
        return (
          <Storico
            vehicle={selectedVehicle}
            onOpenAddFuel={() => handleOpenSheet()}
            refreshKey={refreshKey}
          />
        );
      case 'scadenze':
        return <Scadenze vehicle={selectedVehicle} />;
      case 'statistiche':
        return <Statistiche vehicle={selectedVehicle} refreshKey={refreshKey} />;
      default:
        return null;
    }
  };

  return (
    <>
      <Sidebar active={activeTab} onChange={handleTabChange} onAdd={handleOpenSheet} />
      <main className="main-content" style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
        {renderScreen()}
      </main>
      <TabBar active={activeTab} onChange={handleTabChange} />

      {/* Fixed top bar — visible on all tabs */}
      {vehicles.length > 0 && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'calc(env(safe-area-inset-top, 0px) + 12px) 20px 12px',
        }}>
          <VehicleChip vehicles={vehicles} selected={selectedVehicle} onSelect={setSelectedVehicle} />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={toggleMode}
              aria-label="Cambia tema"
              style={{
                width: 40, height: 40,
                borderRadius: '50%',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <Icon name={mode === 'notte' ? 'sun' : 'moon'} size={18} color="var(--text-sec)" />
            </button>
            <button
              aria-label="Impostazioni"
              onClick={() => setSettingsOpen(true)}
              style={{
                width: 40, height: 40,
                borderRadius: '50%',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <Icon name="settings" size={18} color="var(--text-sec)" />
            </button>
            <button
              aria-label={`Avvisi${alertCount > 0 ? ` (${alertCount})` : ''}`}
              onClick={() => setNotifDrawerOpen(true)}
              style={{
                position: 'relative',
                width: 40, height: 40,
                borderRadius: '50%',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <Icon name="bell" size={18} color={alertCount > 0 ? 'var(--accent)' : 'var(--text-sec)'} />
              {alertCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  minWidth: 18,
                  height: 18,
                  borderRadius: 9,
                  background: 'var(--danger)',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                  fontFamily: 'var(--font-mono)',
                  lineHeight: 1,
                }}>
                  {alertCount > 9 ? '9+' : alertCount}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      <SheetAddFuel
        open={sheetOpen}
        onClose={() => { setSheetOpen(false); setSheetInitialType(undefined); }}
        vehicle={selectedVehicle}
        onSuccess={handleRefuelSuccess}
        initialExpenseType={sheetInitialType}
      />
      <Settings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        vehicles={vehicles}
        selectedVehicle={selectedVehicle}
        onSelectVehicle={(v) => { setSelectedVehicle(v); setSettingsOpen(false); }}
        onVehicleAdded={handleVehicleAdded}
        onVehicleDeleted={handleVehicleDeleted}
      />
      {notifDrawerOpen && (
        <NotificationDrawer
          deadlines={alertDeadlines}
          onClose={() => setNotifDrawerOpen(false)}
          onResolve={handleResolve}
        />
      )}
    </>
  );
}
