'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { TabBar, TabId } from './TabBar';
import { Dashboard } from './screens/Dashboard';
import { Storico } from './screens/Storico';
import { Scadenze } from './screens/Scadenze';
import { Statistiche } from './screens/Statistiche';
import { Onboarding } from './screens/Onboarding';
import { SheetAddFuel } from './SheetAddFuel';
import { Vehicle } from '@/lib/types';

export function AppShell() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('riepilogo');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchVehicles = useCallback(async () => {
    try {
      const res = await fetch('/api/vehicles');
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

  const handleOnboardingComplete = (vehicle: Vehicle) => {
    setVehicles([vehicle]);
    setSelectedVehicle(vehicle);
  };

  const handleTabChange = (tab: TabId) => {
    if (tab === 'aggiungi') {
      setSheetOpen(true);
      return;
    }
    setActiveTab(tab);
  };

  const handleRefuelSuccess = () => {
    setSheetOpen(false);
    setRefreshKey(k => k + 1);
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
            vehicles={vehicles}
            selectedVehicle={selectedVehicle}
            onSelectVehicle={setSelectedVehicle}
            onOpenAddFuel={() => setSheetOpen(true)}
            onNavigate={setActiveTab}
            refreshKey={refreshKey}
          />
        );
      case 'storico':
        return (
          <Storico
            vehicle={selectedVehicle}
            onOpenAddFuel={() => setSheetOpen(true)}
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
      <main style={{ minHeight: '100dvh', background: 'var(--bg)' }}>
        {renderScreen()}
      </main>
      <TabBar active={activeTab} onChange={handleTabChange} />
      <SheetAddFuel
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        vehicle={selectedVehicle}
        onSuccess={handleRefuelSuccess}
      />
    </>
  );
}
