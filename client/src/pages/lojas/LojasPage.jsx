// src/pages/lojas/LojasPage.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { lojasService } from '../../services';
import { Plus, X, Loader2, Pencil, Search, Store, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const LIMIT = 20;

/* ── Modal criar/editar ─────────────────────────────────────────────────── */
function LojaModal({ loja, onClose }) {
  const qc = useQueryClient();
  const isEdit = !!loja;
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: loja || {},
  });

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? lojasService.atualizar(loja.id, data) : lojasService.criar(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lojas'] });
      toast.success(isEdit ? 'Atualizado!' : 'Loja criada!');
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Erro ao salvar'),
  });

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>{isEdit ? 'Editar Loja' : 'Nova Loja'}</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: '4px' }}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="flex flex-col gap-4">
          <div className="grid gap-4" style={{ gridTemplateColumns: '80px 1fr' }}>
            <div>
              <label className="label">Nº *</label>
              <input
                className="input"
                type="number"
                {...register('numero', { required: 'Obrigatório', valueAsNumber: true })}
              />
              {errors.numero && <p className="field-error">{errors.numero.message}</p>}
            </div>
            <div>
              <label className="label">Nome *</label>
              <input className="input" {...register('nome', { required: 'Obrigatório' })} />
              {errors.nome && <p className="field-error">{errors.nome.message}</p>}
            </div>
          </div>
          <div>
            <label className="label">Região *</label>
            <input className="input" placeholder="ex: SP 07, RJ 01, NE" {...register('regiao', { required: 'Obrigatório' })} />
            {errors.regiao && <p className="field-error">{errors.regiao.message}</p>}
          </div>
          <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div>
              <label className="label">Telefone</label>
              <input className="input" placeholder="(11) 99999-0000" {...register('telefone')} />
            </div>
            <div>
              <label className="label">Endereço</label>
              <input className="input" placeholder="Rua, número, cidade" {...register('endereco')} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 size={16} className="animate-spin" />}
              {isEdit ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Paginação ──────────────────────────────────────────────────────────── */
function Paginacao({ paginaAtual, totalPaginas, onMudar }) {
  if (totalPaginas <= 1) return null;
  const visiveis = new Set(
    [1, totalPaginas, paginaAtual, paginaAtual - 1, paginaAtual + 1].filter(p => p >= 1 && p <= totalPaginas)
  );
  const lista = [...visiveis].sort((a, b) => a - b);
  return (
    <div className="flex items-center justify-center gap-1 mt-4">
      <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }} disabled={paginaAtual === 1} onClick={() => onMudar(paginaAtual - 1)}>
        <ChevronLeft size={16} />
      </button>
      {lista.map((p, i) => {
        const prev = lista[i - 1];
        return (
          <span key={p} className="flex items-center gap-1">
            {prev && p - prev > 1 && <span style={{ color: 'var(--color-text-muted)', padding: '0 2px' }}>…</span>}
            <button className={`btn btn-sm ${paginaAtual === p ? 'btn-primary' : 'btn-ghost'}`} style={{ minWidth: '32px', padding: '4px 8px' }} onClick={() => onMudar(p)}>{p}</button>
          </span>
        );
      })}
      <button className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }} disabled={paginaAtual === totalPaginas} onClick={() => onMudar(paginaAtual + 1)}>
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

/* ── Página principal ───────────────────────────────────────────────────── */
export default function LojasPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null);
  const [page, setPage] = useState(1);
  const [filtros, setFiltros] = useState({ nome: '', regiao: '' });

  const atualizar = (campo, valor) => { setFiltros(f => ({ ...f, [campo]: valor })); setPage(1); };

  const { data: regioes = [] } = useQuery({
    queryKey: ['lojas-regioes'],
    queryFn: () => lojasService.listarRegioes().then(r => r.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['lojas', filtros, page],
    queryFn: () => lojasService.listar({ ...filtros, page, limit: LIMIT }).then(r => r.data),
    placeholderData: prev => prev,
  });

  const lojas = data?.data ?? [];
  const meta = data?.meta ?? { total: 0 };
  const totalPaginas = Math.ceil(meta.total / LIMIT);
  const inicio = (page - 1) * LIMIT + 1;
  const fim = Math.min(page * LIMIT, meta.total);

  const remover = useMutation({
    mutationFn: (id) => lojasService.remover(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['lojas'] }); toast.success('Loja desativada'); },
    onError: () => toast.error('Erro ao desativar'),
  });

  return (
    <div className="flex flex-col gap-4 animate-fade-in">

      {/* Filtros + botão novo */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input className="input" style={{ paddingLeft: '32px', width: '200px' }} placeholder="Nome da loja..." value={filtros.nome} onChange={e => atualizar('nome', e.target.value)} />
          </div>
          <select className="select" style={{ width: 'auto' }} value={filtros.regiao} onChange={e => atualizar('regiao', e.target.value)}>
            <option value="">Todas as regiões</option>
            {regioes.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('nova')}>
          <Plus size={16} /> Nova Loja
        </button>
      </div>

      {/* Contador */}
      {!isLoading && meta.total > 0 && (
        <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
          Exibindo {inicio}–{fim} de {meta.total} loja{meta.total !== 1 ? 's' : ''}
        </div>
      )}

      {/* Tabela */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: '60px' }}>Nº</th>
              <th>Nome</th>
              <th style={{ width: '100px' }}>Região</th>
              <th>Telefone</th>
              <th>Endereço</th>
              <th style={{ width: '80px' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6}><div className="flex justify-center py-8"><Loader2 size={22} className="animate-spin" style={{ color: 'var(--color-brand-500)' }} /></div></td></tr>
            ) : lojas.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem', fontSize: '0.875rem' }}>Nenhuma loja encontrada</td></tr>
            ) : lojas.map(l => (
              <tr key={l.id}>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-7 h-7 rounded-lg" style={{ background: 'var(--color-surface-600)' }}>
                      <Store size={13} style={{ color: 'var(--color-brand-400)' }} />
                    </div>
                    <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{l.numero}</span>
                  </div>
                </td>
                <td style={{ fontWeight: 500 }}>{l.nome}</td>
                <td><span className="badge badge-brand" style={{ fontSize: '0.7rem' }}>{l.regiao}</span></td>
                <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>{l.telefone || '—'}</td>
                <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.endereco || '—'}</td>
                <td>
                  <div className="flex gap-1">
                    <button className="btn btn-ghost btn-sm" onClick={() => setModal(l)} style={{ padding: '4px 6px' }}><Pencil size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Paginacao paginaAtual={page} totalPaginas={totalPaginas} onMudar={setPage} />

      {modal && <LojaModal loja={modal === 'nova' ? null : modal} onClose={() => setModal(null)} />}
    </div>
  );
}
