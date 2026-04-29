// src/components/layout/Header/UserActions.jsx
import React, { useState } from 'react';
import { Bell, LogOut } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { notificacoesService } from '../../../services';
import toast from 'react-hot-toast';

export default function UserActions() {
  const { logout } = useAuth();
  const [showNotif, setShowNotif] = useState(false);
  const qc = useQueryClient();

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

  const handleMarkAllAsRead = async () => {
    try {
      await notificacoesService.marcarTodasLidas();
      await qc.invalidateQueries({ queryKey: ['notificacoes'] });
      setShowNotif(false);
      toast.success('Notificações marcadas como lidas');
    } catch (err) {
      toast.error('Erro ao atualizar notificações');
    }
  };

  return (
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
                  onClick={handleMarkAllAsRead}
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
  );
}
