// src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const refreshTimerRef = useRef(null);

  // Agenda renovação automática do access token (a cada 13 minutos para token de 15min)
  const agendarRenovacao = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(async () => {
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) return;
        const { data } = await api.post('/auth/refresh', { refreshToken });
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        agendarRenovacao();
      } catch {
        logout();
      }
    }, 13 * 60 * 1000);
  }, []);

  const login = useCallback(async (email, senha) => {
    const { data } = await api.post('/auth/login', { email, senha });
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setUsuario(data.usuario);
    agendarRenovacao();
    return data.usuario;
  }, [agendarRenovacao]);

  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      await api.post('/auth/logout', { refreshToken });
    } catch { /* silencioso */ }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUsuario(null);
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
  }, []);

  // Verifica sessão ao carregar
  useEffect(() => {
    const verificarSessao = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) { setCarregando(false); return; }

      try {
        const { data } = await api.get('/auth/me');
        setUsuario(data.usuario);
        agendarRenovacao();
      } catch (err) {
        // Tenta renovar com refresh token
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          try {
            const { data } = await api.post('/auth/refresh', { refreshToken });
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
            const meRes = await api.get('/auth/me');
            setUsuario(meRes.data.usuario);
            agendarRenovacao();
          } catch {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
          }
        }
      } finally {
        setCarregando(false);
      }
    };

    verificarSessao();
    return () => { if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current); };
  }, [agendarRenovacao]);

  const hasRole = useCallback((...roles) => {
    return usuario ? roles.includes(usuario.role) : false;
  }, [usuario]);

  return (
    <AuthContext.Provider value={{ usuario, carregando, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
};
