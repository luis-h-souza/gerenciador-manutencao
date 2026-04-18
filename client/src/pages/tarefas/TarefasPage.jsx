// src/pages/tarefas/TarefasPage.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { tarefasService, usuariosService } from '../../services';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, X, Loader2, Pencil, Trash2, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PRIORIDADE_BADGE = {
  BAIXA:   'badge-neutral',
  MEDIA:   'badge-info',
  ALTA:    'badge-warning',
  CRITICA: 'badge-danger',
};
const STATUS_BADGE = {
  PENDENTE:     'badge-neutral',
  EM_ANDAMENTO: 'badge-info',
  CONCLUIDA:    'badge-success',
  CANCELADA:    'badge-danger',
};
const STATUS_LABEL = {
  PENDENTE: 'Pendente', EM_ANDAMENTO: 'Em Andamento', CONCLUIDA: 'Concluída', CANCELADA: 'Cancelada',
};

function TarefaModal({ tarefa, onClose }) {
  const qc = useQueryClient();
  const { usuario } = useAuth();
  const isEdit = !!tarefa;

  const { data: usuarios = [] } = useQuery({
    queryKey: ['usuarios-lista'],
    queryFn: () => usuariosService.listar({ role: 'TECNICO', limit: 100 }).then(r => r.data.data),
    enabled: !['TECNICO'].includes(usuario?.role),
  });

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues: isEdit ? {
      ...tarefa,
      dataConclusao: tarefa.dataConclusao ? format(new Date(tarefa.dataConclusao), 'yyyy-MM-dd') : '',
    } : {},
  });

  const mutation = useMutation({
    mutationFn: (data) => isEdit
      ? tarefasService.atualizar(tarefa.id, data)
      : tarefasService.criar(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tarefas'] });
      toast.success(isEdit ? 'Tarefa atualizada!' : 'Tarefa criada!');
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Erro ao salvar'),
  });

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>{isEdit ? 'Editar Tarefa' : 'Nova Tarefa'}</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: '4px' }}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="flex flex-col gap-4">
          <div>
            <label className="label">Descrição *</label>
            <textarea className="input" rows={3} style={{ resize: 'vertical' }}
              {...register('descricao', { required: 'Obrigatório' })} />
            {errors.descricao && <p className="field-error">{errors.descricao.message}</p>}
          </div>

          <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div>
              <label className="label">Prioridade</label>
              <select className="select" {...register('prioridade')}>
                <option value="BAIXA">Baixa</option>
                <option value="MEDIA">Média</option>
                <option value="ALTA">Alta</option>
                <option value="CRITICA">Crítica</option>
              </select>
            </div>
            <div>
              <label className="label">Área Responsável *</label>
              <input className="input" placeholder="Ex: Elétrica" {...register('areResponsavel', { required: 'Obrigatório' })} />
              {errors.areResponsavel && <p className="field-error">{errors.areResponsavel.message}</p>}
            </div>
          </div>

          {isEdit && (
            <div>
              <label className="label">Status</label>
              <select className="select" {...register('status')}>
                {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          )}

          <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div>
              <label className="label">Data de Conclusão</label>
              <input type="date" className="input" {...register('dataConclusao')} />
            </div>
            {!['TECNICO'].includes(usuario?.role) && (
              <div>
                <label className="label">Atribuir para</label>
                <select className="select" {...register('atribuidoParaId')}>
                  <option value="">Não atribuído</option>
                  {usuarios.map(u => <option key={u.id} value={u.id}>{u.nome}</option>)}
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting || mutation.isPending}>
              {(isSubmitting || mutation.isPending) ? <Loader2 size={16} className="animate-spin" /> : null}
              {isEdit ? 'Salvar' : 'Criar Tarefa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TarefasPage() {
  const qc = useQueryClient();
  const { usuario } = useAuth();
  const [modal, setModal] = useState(null); // null | 'novo' | tarefaObj
  const [filtros, setFiltros] = useState({ status: '', prioridade: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['tarefas', filtros],
    queryFn: () => tarefasService.listar({ ...filtros, limit: 50 }).then(r => r.data),
  });

  const removerMutation = useMutation({
    mutationFn: (id) => tarefasService.remover(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tarefas'] }); toast.success('Tarefa removida'); },
    onError: () => toast.error('Erro ao remover'),
  });

  const podeGerenciar = !['TECNICO'].includes(usuario?.role);

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <select className="select" style={{ width: 'auto' }} value={filtros.status} onChange={e => setFiltros(f => ({ ...f, status: e.target.value }))}>
            <option value="">Todos os status</option>
            {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <select className="select" style={{ width: 'auto' }} value={filtros.prioridade} onChange={e => setFiltros(f => ({ ...f, prioridade: e.target.value }))}>
            <option value="">Todas as prioridades</option>
            {['BAIXA','MEDIA','ALTA','CRITICA'].map(p => <option key={p} value={p}>{p.charAt(0)+p.slice(1).toLowerCase()}</option>)}
          </select>
        </div>
        {podeGerenciar && (
          <button className="btn btn-primary" onClick={() => setModal('novo')}>
            <Plus size={16} /> Nova Tarefa
          </button>
        )}
      </div>

      {/* Tabela */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Área</th>
              <th>Prioridade</th>
              <th>Status</th>
              <th>Atribuído</th>
              <th>Conclusão</th>
              {podeGerenciar && <th style={{ width: '80px' }}>Ações</th>}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={podeGerenciar ? 7 : 6}>
                <div className="flex justify-center py-8"><Loader2 size={22} className="animate-spin" style={{ color: 'var(--color-brand-500)' }} /></div>
              </td></tr>
            ) : data?.data?.length === 0 ? (
              <tr><td colSpan={podeGerenciar ? 7 : 6} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>Nenhuma tarefa encontrada</td></tr>
            ) : (
              data?.data?.map(t => (
                <tr key={t.id}>
                  <td style={{ maxWidth: '300px' }}>
                    <span style={{ fontWeight: 500, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.descricao}>{t.descricao}</span>
                  </td>
                  <td style={{ color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{t.areResponsavel}</td>
                  <td><span className={`badge ${PRIORIDADE_BADGE[t.prioridade]}`}>{t.prioridade}</span></td>
                  <td><span className={`badge ${STATUS_BADGE[t.status]}`}>{STATUS_LABEL[t.status]}</span></td>
                  <td>
                    {t.atribuidoPara ? (
                      <div className="flex items-center gap-1.5">
                        <User size={13} style={{ color: 'var(--color-text-muted)' }} />
                        <span style={{ fontSize: '0.8125rem' }}>{t.atribuidoPara.nome}</span>
                      </div>
                    ) : <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>—</span>}
                  </td>
                  <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                    {t.dataConclusao ? format(new Date(t.dataConclusao), 'dd/MM/yyyy', { locale: ptBR }) : '—'}
                  </td>
                  {podeGerenciar && (
                    <td>
                      <div className="flex items-center gap-1">
                        <button className="btn btn-ghost btn-sm" onClick={() => setModal(t)} style={{ padding: '4px 6px' }}><Pencil size={14} /></button>
                        <button className="btn btn-ghost btn-sm" onClick={() => {
                          if (confirm('Remover tarefa?')) removerMutation.mutate(t.id);
                        }} style={{ padding: '4px 6px', color: 'var(--color-danger)' }}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <TarefaModal
          tarefa={modal === 'novo' ? null : modal}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
