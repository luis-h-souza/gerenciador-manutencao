// src/components/layout/Header/Header.jsx
import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import UserActions from './UserActions';

const PAGE_TITLES = {
  '/dashboard':    'Dashboard',
  '/tarefas':      'Tarefas',
  '/chamados':     'Controle Financeiro',
  '/estoque':      'Estoque de Peças',
  '/fornecedores': 'Fornecedores',
  '/usuarios':     'Usuários',
};

export default function Header({ onMenuClick }) {
  const { pathname } = useLocation();

  return (
    <header
      className="flex items-center justify-between px-5"
      style={{
        height: '60px',
        background: 'var(--color-surface-800)',
        borderBottom: '1px solid var(--color-border)',
        flexShrink: 0,
      }}
    >
      <div className="flex items-center gap-3">
        <button className="btn btn-ghost btn-sm" onClick={onMenuClick} style={{ padding: '6px' }}>
          <Menu size={18} />
        </button>
        <h1 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
          {PAGE_TITLES[pathname] || 'Sistema'}
        </h1>
      </div>

      <UserActions />
    </header>
  );
}
