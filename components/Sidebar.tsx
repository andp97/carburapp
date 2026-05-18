'use client';

import React from 'react';
import { Icon } from './Icon';
import type { TabId } from './TabBar';

const NAV_ITEMS: { id: TabId; label: string; icon: string }[] = [
  { id: 'riepilogo',   label: 'Riepilogo',   icon: 'home'    },
  { id: 'storico',     label: 'Storico',     icon: 'receipt' },
  { id: 'scadenze',   label: 'Scadenze',   icon: 'bell'    },
  { id: 'statistiche', label: 'Statistiche', icon: 'chart'   },
];

interface SidebarProps {
  active: TabId;
  onChange: (tab: TabId) => void;
  onAdd: () => void;
}

export function Sidebar({ active, onChange, onAdd }: SidebarProps) {
  return (
    <div
      className="sidebar"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: 220,
        zIndex: 50,
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        flexDirection: 'column',
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 64px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {/* Aggiungi CTA */}
      <div style={{ padding: '12px 12px 8px' }}>
        <button
          onClick={onAdd}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '12px',
            background: 'var(--accent)',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            minHeight: '44px',
            touchAction: 'manipulation',
          }}
        >
          <Icon name="plus" size={18} color="#fff" strokeWidth={2.5} />
          Aggiungi spesa
        </button>
      </div>

      {/* Nav items */}
      <nav style={{
        flex: 1,
        padding: '8px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
      }}>
        {NAV_ITEMS.map(item => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '10px',
                background: isActive ? 'rgba(255,122,61,0.1)' : 'transparent',
                color: isActive ? 'var(--accent)' : 'var(--text-sec)',
                fontSize: '14px',
                fontWeight: isActive ? 700 : 500,
                border: 'none',
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left',
                transition: 'all 0.15s',
                touchAction: 'manipulation',
              }}
            >
              <Icon
                name={item.icon as any}
                size={18}
                color={isActive ? 'var(--accent)' : 'var(--text-sec)'}
                strokeWidth={isActive ? 2.2 : 1.75}
              />
              {item.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
