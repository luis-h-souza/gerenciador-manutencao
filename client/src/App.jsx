// src/App.jsx
// React Router v7: API compatível com v6 (sem breaking changes para modo SPA)
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, AuthProvider } from './contexts/AuthContext';

// Layout
import AppLayout from './components/layout/AppLayout';

// Páginas
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import TarefasPage from './pages/tarefas/TarefasPage';
import ChamadosPage from './pages/chamados/ChamadosPage';
import EstoquePage from './pages/estoque/EstoquePage';
import FornecedoresPage from './pages/fornecedores/FornecedoresPage';
import UsuariosPage from './pages/usuarios/UsuariosPage';
import ChecklistPage from './pages/checklists/ChecklistPage';
import LojasPage from './pages/lojas/LojasPage';

// Rota protegida
const ProtectedRoute = ({ children, roles }) => {
  const { usuario, carregando } = useAuth();

  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--color-surface-900)' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-brand-500)', borderTopColor: 'transparent' }} />
          <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Carregando...</span>
        </div>
      </div>
    );
  }

  if (!usuario) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(usuario.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const ROLES = {
  TODOS: ['ADMINISTRADOR', 'DIRETOR', 'GERENTE', 'SUPERVISOR', 'COORDENADOR', 'GESTOR', 'TECNICO'],
  GESTORES: ['ADMINISTRADOR', 'DIRETOR', 'GERENTE', 'SUPERVISOR', 'COORDENADOR', 'GESTOR'],
  ADMIN_DIRETOR_GERENTE: ['ADMINISTRADOR', 'DIRETOR', 'GERENTE', 'SUPERVISOR'],
  OPERACIONAIS: ['ADMINISTRADOR', 'COORDENADOR', 'GESTOR', 'TECNICO'], 
  ESTOQUE: ['ADMINISTRADOR', 'SUPERVISOR', 'COORDENADOR', 'GESTOR'],
};

function AppRoutes() {
  const { usuario } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={usuario ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />

      <Route
        path="/"
        element={
          <ProtectedRoute roles={ROLES.TODOS}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />

        <Route path="dashboard" element={
          <ProtectedRoute roles={ROLES.TODOS}><DashboardPage /></ProtectedRoute>
        } />

        <Route path="tarefas" element={
          <ProtectedRoute roles={ROLES.OPERACIONAIS}><TarefasPage /></ProtectedRoute>
        } />

        <Route path="chamados" element={
          <ProtectedRoute roles={ROLES.GESTORES}><ChamadosPage /></ProtectedRoute>
        } />

        <Route path="estoque" element={
          <ProtectedRoute roles={ROLES.ESTOQUE}><EstoquePage /></ProtectedRoute>
        } />

        <Route path="fornecedores" element={
          <ProtectedRoute roles={ROLES.GESTORES}><FornecedoresPage /></ProtectedRoute>
        } />

        <Route path="usuarios" element={
          <ProtectedRoute roles={ROLES.GESTORES}><UsuariosPage /></ProtectedRoute>
        } />

        <Route path="checklists" element={
          <ProtectedRoute roles={ROLES.GESTORES}><ChecklistPage /></ProtectedRoute>
        } />

        <Route path="lojas" element={
          <ProtectedRoute roles={['ADMINISTRADOR', 'DIRETOR']}><LojasPage /></ProtectedRoute>
        } />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
