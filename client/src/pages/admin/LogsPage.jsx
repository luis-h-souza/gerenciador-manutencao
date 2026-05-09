// client/src/pages/admin/LogsPage.jsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../../services/api";
import { 
  History, 
  Search, 
  Filter, 
  User, 
  Activity, 
  Calendar, 
  Terminal, 
  Info,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const LogBadge = ({ action }) => {
  const getStyle = (action) => {
    if (action.includes('LOGIN')) return 'badge-success';
    if (action.includes('DELETE') || action.includes('REMOVER')) return 'badge-danger';
    if (action.includes('UPDATE') || action.includes('EDITAR')) return 'badge-warning';
    if (action.includes('CREATE') || action.includes('CRIAR')) return 'badge-info';
    return 'badge-ghost';
  };

  return <span className={`badge ${getStyle(action)}`}>{action}</span>;
};

const ModuloIcon = ({ modulo }) => {
  switch (modulo) {
    case 'AUTH': return <ShieldCheck size={14} />;
    case 'USUARIO': return <User size={14} />;
    case 'CHAMADO': return <Terminal size={14} />;
    default: return <Activity size={14} />;
  }
};

export default function LogsPage() {
  const [page, setPage] = useState(1);
  const [modulo, setModulo] = useState("");
  const [dataInicio, setDataInicio] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-logs", page, modulo, dataInicio],
    queryFn: async () => {
      const params = { page, limit: 20 };
      if (modulo) params.modulo = modulo;
      if (dataInicio) params.dataInicio = dataInicio;
      
      const response = await api.get("/logs", { params });
      return response.data;
    }
  });

  const logs = data?.data || [];
  const meta = data?.meta || { totalPages: 1 };

  return (
    <div className="flex flex-col w-full animate-fade-in">
      <div className="card" style={{ padding: "24px", margin: "24px" }}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <History className="text-brand-500" size={24} />
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>Trilha de Auditoria</h1>
            </div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              Histórico completo de ações administrativas e acessos ao sistema
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-1">
              <label className="label" style={{ fontSize: '0.7rem' }}>Filtrar Módulo</label>
              <select 
                className="select select-sm" 
                value={modulo} 
                onChange={(e) => { setModulo(e.target.value); setPage(1); }}
              >
                <option value="">Todos</option>
                <option value="AUTH">Autenticação</option>
                <option value="USUARIO">Usuários</option>
                <option value="CHAMADO">Chamados</option>
                <option value="TAREFA">Tarefas</option>
                <option value="CHECKLIST">Checklists</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="label" style={{ fontSize: '0.7rem' }}>A partir de</label>
              <input 
                type="date" 
                className="input input-sm" 
                value={dataInicio} 
                onChange={(e) => { setDataInicio(e.target.value); setPage(1); }} 
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-brand-500" size={40} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Data/Hora</th>
                  <th>Usuário</th>
                  <th>Módulo</th>
                  <th>Ação</th>
                  <th>Detalhes</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-muted">
                      Nenhum log encontrado para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover">
                      <td style={{ whiteSpace: 'nowrap', fontSize: '0.8125rem' }}>
                        <div className="flex flex-col">
                          <span style={{ fontWeight: 600 }}>{format(new Date(log.criadoEm), 'dd/MM/yyyy')}</span>
                          <span style={{ color: 'var(--color-text-muted)' }}>{format(new Date(log.criadoEm), 'HH:mm:ss')}</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-surface-700 flex items-center justify-center text-brand-500 font-bold text-xs">
                            {log.usuario?.nome?.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{log.usuario?.nome}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{log.usuario?.role}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1 text-muted" style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                          <ModuloIcon modulo={log.modulo} />
                          {log.modulo}
                        </div>
                      </td>
                      <td>
                        <LogBadge action={log.acao} />
                      </td>
                      <td>
                        <div 
                          className="max-w-xs truncate text-muted" 
                          style={{ fontSize: '0.75rem' }}
                          title={JSON.stringify(log.detalhes)}
                        >
                          {Object.entries(log.detalhes || {}).map(([key, val]) => (
                            <span key={key} className="mr-2">
                              <strong>{key}:</strong> {String(val)}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        {log.ip || '---'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between mt-8 pt-4 border-t border-border">
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            Mostrando página {page} de {meta.totalPages}
          </p>
          <div className="flex gap-2">
            <button 
              className="btn btn-sm btn-ghost"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft size={16} /> Anterior
            </button>
            <button 
              className="btn btn-sm btn-ghost"
              disabled={page >= meta.totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Próximo <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
