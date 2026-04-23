// src/components/layout/Sidebar.jsx
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardList, DollarSign,
  Package, Building2, Users, Wrench, X, ClipboardCheck, Settings, Store
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const NAV = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard',    roles: ['ADMINISTRADOR','DIRETOR','GERENTE','COORDENADOR','GESTOR','TECNICO'] },
  { to: '/tarefas',      icon: ClipboardList,   label: 'Tarefas',      roles: ['ADMINISTRADOR','DIRETOR','GERENTE','COORDENADOR','GESTOR','TECNICO'] },
  { to: '/checklists',   icon: ClipboardCheck,  label: 'Checklists',   roles: ['GESTOR'] },
  { to: '/checklists-consolidado', icon: ClipboardCheck, label: 'Checklists', roles: ['ADMINISTRADOR','DIRETOR','GERENTE','COORDENADOR'] },
  { to: '/chamados',     icon: DollarSign,      label: 'Controle Financeiro', roles: ['ADMINISTRADOR','DIRETOR','GERENTE','COORDENADOR','GESTOR'] },
  { to: '/estoque',      icon: Package,         label: 'Estoque',      roles: ['ADMINISTRADOR','DIRETOR','GERENTE','COORDENADOR','GESTOR'] },
  { to: '/fornecedores', icon: Building2,       label: 'Fornecedores', roles: ['ADMINISTRADOR','DIRETOR','GERENTE','COORDENADOR','GESTOR'] },
  { to: '/usuarios',     icon: Users,           label: 'Usuários',     roles: ['ADMINISTRADOR','DIRETOR'] },
  { to: '/lojas',        icon: Store,           label: 'Lojas',        roles: ['ADMINISTRADOR','DIRETOR'] },
];

export default function Sidebar({ open, onClose, onOpenConfig }) {
  const { usuario } = useAuth();

  const itensVisiveis = NAV.filter(item => item.roles.includes(usuario?.role));

  return (
    <aside
      className="flex flex-col shrink-0 transition-all duration-200 z-30"
      style={{
        width: open ? '240px' : '0px',
        minWidth: open ? '240px' : '0px',
        background: 'var(--color-surface-800)',
        borderRight: '1px solid var(--color-border)',
        overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: '1px solid var(--color-border)', minHeight: '60px' }}>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg" style={{ background: 'var(--color-brand-600)' }}>
            <Wrench size={16} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
              Manutenção
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
              Sistema de Gestão
            </div>
          </div>
        </div>
        <button className="btn-ghost btn-sm lg:hidden" onClick={onClose} style={{ padding: '4px' }}>
          <X size={16} />
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-3 flex flex-col gap-0.5 overflow-y-auto">
        {itensVisiveis.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            style={{ whiteSpace: 'nowrap' }}
          >
            <Icon size={17} className="nav-icon shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Perfil do usuário */}
      <div className="px-3 py-3" style={{ borderTop: '1px solid var(--color-border)' }}>
        <button
          onClick={onOpenConfig}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg group transition-colors"
          style={{ background: 'var(--color-surface-700)', border: 'none', cursor: 'pointer', textAlign: 'left' }}
          title="Configurações"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-full shrink-0" style={{ background: 'var(--color-brand-600)', fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>
            {usuario?.nome?.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden flex-1">
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {usuario?.nome}
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
              {usuario?.role}
            </div>
          </div>
          <Settings size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
        </button>
      </div>
    </aside>
  );
}
