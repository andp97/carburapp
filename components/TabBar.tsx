'use client';

import React from 'react';
import { Icon } from './Icon';

export type TabId = 'riepilogo' | 'storico' | 'aggiungi' | 'scadenze' | 'statistiche';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

const TABS: Tab[] = [
  { id: 'riepilogo', label: 'Riepilogo', icon: 'home' },
  { id: 'storico', label: 'Storico', icon: 'receipt' },
  { id: 'aggiungi', label: 'Aggiungi', icon: 'plus' },
  { id: 'scadenze', label: 'Scadenze', icon: 'bell' },
  { id: 'statistiche', label: 'Statistiche', icon: 'chart' },
];

interface TabBarProps {
  active: TabId;
  onChange: (tab: TabId) => void;
}

export function TabBar({ active, onChange }: TabBarProps) {
  return (
    <div
      className="tab-bar"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        height: 'var(--tab-bar-height)',
        display: 'flex',
        alignItems: 'flex-start',
        paddingTop: '4px',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        background: 'linear-gradient(to top, var(--bg) 60%, transparent)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--border)',
      }}
    >
      {TABS.map((tab) => {
        const isCenter = tab.id === 'aggiungi';
        const isActive = active === tab.id;

        if (isCenter) {
          return (
            <button
              key={tab.id}
              aria-label="Aggiungi"
              onClick={() => onChange(tab.id)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0',
                paddingTop: '0',
                minHeight: '44px',
                position: 'relative',
                top: '-18px',
                touchAction: 'manipulation',
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 0 6px var(--accent-glow), 0 4px 20px rgba(255,122,61,0.4)',
                  transition: 'transform 0.15s cubic-bezier(.2,.8,.25,1)',
                  transform: isActive ? 'scale(0.94)' : 'scale(1)',
                }}
              >
                <Icon name="plus" size={26} color="#fff" strokeWidth={2.5} />
              </div>
            </button>
          );
        }

        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              padding: '8px 0',
              minHeight: '44px',
              color: isActive ? 'var(--accent)' : 'var(--text-ter)',
              transition: 'color 0.15s',
              touchAction: 'manipulation',
            }}
          >
            <Icon
              name={tab.icon as any}
              size={22}
              color={isActive ? 'var(--accent)' : 'var(--text-ter)'}
              strokeWidth={isActive ? 2.2 : 1.75}
            />
            <span
              style={{
                fontSize: '10px',
                fontWeight: isActive ? 700 : 500,
                letterSpacing: '0.01em',
                lineHeight: 1,
              }}
            >
              {tab.label}
            </span>
            {isActive && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  width: '18px',
                  height: '2px',
                  borderRadius: '1px',
                  background: 'var(--accent)',
                  opacity: 0,
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
