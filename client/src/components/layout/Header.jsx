// src/components/layout/Header.jsx
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Bell, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { notificacoesService } from '../../services';
import toast from 'react-hot-toast';

const PAGE_TITLES = {
  '/dashboard':    'Dashboard',
  '/tarefas':      'Tarefas',
  '/chamados':     'Controle Financeiro',
  '/estoque':      'Estoque de Peças',
  '/fornecedores': 'Fornecedores',
  '/usuarios':     'Usuários',
};

export default function Header({ onMenuClick }) {
  const { logout } = useAuth();
  const { pathname } = useLocation();
  const [showNotif, setShowNotif] = useState(false);

  const { data: notifs = [] } = useQuery({
    queryKey: ['notificacoes'],
    queryFn: () => notificacoesService.listar().then(r => r.data),
    refetchInterval: 60000,
  });

  const naoLidas = notifs.filter(n => !n.lida).length;

  const handleLogout = async () => {
    await logout();
    toast.success('Até logo!');
  };

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

      <div className="flex items-center gap-2">
        {/* Notificações */}
        <div className="relative">
          <button
            className="btn btn-ghost btn-sm relative"
            style={{ padding: '6px' }}
            onClick={() => setShowNotif(!showNotif)}
          >
            <Bell size={18} />
            {naoLidas > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 rounded-full text-white"
                style={{ fontSize: '0.625rem', fontWeight: 700, background: 'var(--color-danger)' }}
              >
                {naoLidas > 9 ? '9+' : naoLidas}
              </span>
            )}
          </button>

          {showNotif && (
            <div
              className="absolute right-0 top-full mt-1 w-80 rounded-xl overflow-hidden shadow-2xl z-50"
              style={{ background: 'var(--color-surface-700)', border: '1px solid var(--color-border-light)' }}
            >
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Notificações</span>
                {naoLidas > 0 && (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={async () => {
                      await notificacoesService.marcarTodasLidas();
                      setShowNotif(false);
                    }}
                    style={{ fontSize: '0.75rem', padding: '2px 8px' }}
                  >
                    Marcar todas
                  </button>
                )}
              </div>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {notifs.length === 0 ? (
                  <div className="px-4 py-6 text-center" style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                    Nenhuma notificação
                  </div>
                ) : (
                  notifs.slice(0, 10).map(n => (
                    <div
                      key={n.id}
                      className="px-4 py-3"
                      style={{
                        borderBottom: '1px solid var(--color-border)',
                        background: n.lida ? 'transparent' : 'rgba(14,165,233,0.05)',
                      }}
                    >
                      <div style={{ fontSize: '0.8125rem', fontWeight: n.lida ? 400 : 600, color: 'var(--color-text-primary)' }}>
                        {n.titulo}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        {n.mensagem}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Logout */}
        <button className="btn btn-ghost btn-sm" onClick={handleLogout} style={{ padding: '6px' }} title="Sair">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
