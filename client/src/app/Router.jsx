// src/app/Router.jsx
import React from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import ProtectedRoute from "../guards/ProtectedRoute";
import { ROLES } from "../utils/permissions";

// Layout
import MainLayout from "../components/layout/MainLayout";

// Páginas
import LoginPage from "../pages/auth/LoginPage";
import DashboardPage from "../pages/dashboard/DashboardPage";
import TarefasPage from "../pages/tarefas/TarefasPage";
import ChamadosPage from "../pages/chamados/ChamadosListPage";
import EstoquePage from "../pages/estoque/EstoquePage";
import FornecedoresPage from "../pages/fornecedores/FornecedoresPage";
import UsuariosPage from "../pages/usuarios/UsuariosPage";
import ChecklistPage from "../pages/checklists/ChecklistPage";
import ChecklistConsolidadoPage from "../pages/checklists/ChecklistConsolidadoPage";
import LojasPage from "../pages/lojas/LojasPage";

export default function AppRouter() {
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
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />

        <Route
          path="dashboard"
          element={
            <ProtectedRoute roles={ROLES.TODOS}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="tarefas"
          element={
            <ProtectedRoute roles={ROLES.OPERACIONAIS}>
              <TarefasPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="chamados"
          element={
            <ProtectedRoute roles={ROLES.GESTORES}>
              <ChamadosPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="estoque"
          element={
            <ProtectedRoute roles={ROLES.ESTOQUE}>
              <EstoquePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="fornecedores"
          element={
            <ProtectedRoute roles={ROLES.GESTORES}>
              <FornecedoresPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="usuarios"
          element={
            <ProtectedRoute roles={ROLES.USUARIOS}>
              <UsuariosPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="checklists"
          element={
            <ProtectedRoute roles={ROLES.GESTORES}>
              <ChecklistPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="checklists-consolidado"
          element={
            <ProtectedRoute roles={ROLES.GESTORES}>
              <ChecklistConsolidadoPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="lojas"
          element={
            <ProtectedRoute roles={["ADMINISTRADOR", "DIRETOR"]}>
              <LojasPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
