// src/pages/estoque/EstoquePage.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { estoqueService, fornecedoresService } from '../../services';
import { Plus, X, Loader2, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const TABS = ['Estoque', 'Entradas', 'Movimentações', 'Saídas'];

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>{title}</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: '4px' }}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function EntradaForm({ onClose }) {
  const qc = useQueryClient();
  const { data: pecas = [] } = useQuery({ queryKey: ['pecas'], queryFn: () => estoqueService.listarPecas().then(r => r.data) });
  const { register, handleSubmit, watch } = useForm({ defaultValues: { dataEntrada: format(new Date(), 'yyyy-MM-dd') } });
  const qtd = parseFloat(watch('quantidade') || 0);
  const val = parseFloat(watch('valorUnitario') || 0);

  const mutation = useMutation({
    mutationFn: estoqueService.registrarEntrada,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pecas'] }); qc.invalidateQueries({ queryKey: ['entradas'] }); toast.success('Entrada registrada!'); onClose(); },
    onError: () => toast.error('Erro ao registrar'),
  });

  return (
    <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="flex flex-col gap-4">
      <div><label className="label">Peça *</label>
        <select className="select" {...register('pecaId', { required: true })}>
          <option value="">Selecione...</option>
          {pecas.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
        </select>
      </div>
      <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
        <div><label className="label">Quantidade *</label><input type="number" min="1" className="input" {...register('quantidade', { required: true })} /></div>
        <div><label className="label">Valor Unit. *</label><input type="number" step="0.01" className="input" {...register('valorUnitario', { required: true })} /></div>
        <div><label className="label">Total</label><input className="input" readOnly value={qtd && val ? `R$ ${(qtd*val).toFixed(2)}` : '—'} /></div>
      </div>
      <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div><label className="label">Fornecedor *</label><input className="input" {...register('fornecedor', { required: true })} /></div>
        <div><label className="label">Data *</label><input type="date" className="input" {...register('dataEntrada', { required: true })} /></div>
      </div>
      <div><label className="label">Nº Nota Fiscal</label><input className="input" {...register('numeroNotaFiscal')} /></div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
        <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>{mutation.isPending && <Loader2 size={16} className="animate-spin" />} Registrar</button>
      </div>
    </form>
  );
}

function MovimentacaoForm({ onClose }) {
  const qc = useQueryClient();
  const { data: pecas = [] } = useQuery({ queryKey: ['pecas'], queryFn: () => estoqueService.listarPecas().then(r => r.data) });
  const { register, handleSubmit } = useForm({ defaultValues: { dataMovimentacao: format(new Date(), 'yyyy-MM-dd') } });
  const mutation = useMutation({
    mutationFn: estoqueService.registrarMovimentacao,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pecas'] }); qc.invalidateQueries({ queryKey: ['movimentacoes'] }); toast.success('Movimentação registrada!'); onClose(); },
    onError: (err) => toast.error(err.response?.data?.message || 'Erro'),
  });
  return (
    <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="flex flex-col gap-4">
      <div><label className="label">Peça *</label>
        <select className="select" {...register('pecaId', { required: true })}>
          <option value="">Selecione...</option>
          {pecas.map(p => <option key={p.id} value={p.id}>{p.nome} (estoque: {p.quantidadeEstoque})</option>)}
        </select>
      </div>
      <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div><label className="label">Quantidade *</label><input type="number" min="1" className="input" {...register('quantidade', { required: true })} /></div>
        <div><label className="label">Data *</label><input type="date" className="input" {...register('dataMovimentacao')} /></div>
      </div>
      <div><label className="label">Loja Requisitante *</label><input className="input" {...register('lojaRequisitante', { required: true })} /></div>
      <div><label className="label">Nº Chamado</label><input className="input" {...register('numeroChamado')} /></div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
        <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>{mutation.isPending && <Loader2 size={16} className="animate-spin" />} Registrar</button>
      </div>
    </form>
  );
}

export default function EstoquePage() {
  const [aba, setAba] = useState(0);
  const [modal, setModal] = useState(null);

  const { data: pecas = [], isLoading: lPecas } = useQuery({ queryKey: ['pecas'], queryFn: () => estoqueService.listarPecas().then(r => r.data) });
  const { data: entradas = [], isLoading: lEnt } = useQuery({ queryKey: ['entradas'], queryFn: () => estoqueService.listarEntradas().then(r => r.data.data), enabled: aba === 1 });
  const { data: movs = [], isLoading: lMov } = useQuery({ queryKey: ['movimentacoes'], queryFn: () => estoqueService.listarMovimentacoes().then(r => r.data), enabled: aba === 2 });
  const { data: saidas = [], isLoading: lSai } = useQuery({ queryKey: ['saidas'], queryFn: () => estoqueService.listarSaidas().then(r => r.data), enabled: aba === 3 });

  const fmt = (v) => format(new Date(v), 'dd/MM/yyyy');

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Tabs */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-1 p-1 rounded-lg" style={{ background:'var(--color-surface-700)' }}>
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setAba(i)} className="btn btn-sm" style={{
              background: aba === i ? 'var(--color-brand-600)' : 'transparent',
              color: aba === i ? '#fff' : 'var(--color-text-secondary)',
              border: 'none',
            }}>{t}</button>
          ))}
        </div>
        <div className="flex gap-2">
          {aba === 1 && <button className="btn btn-primary btn-sm" onClick={() => setModal('entrada')}><Plus size={14} /> Entrada</button>}
          {aba === 2 && <button className="btn btn-primary btn-sm" onClick={() => setModal('movimentacao')}><Plus size={14} /> Movimentação</button>}
        </div>
      </div>

      {/* Aba: Estoque */}
      {aba === 0 && (
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))' }}>
          {lPecas ? [...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height:'90px', borderRadius:'12px' }} />) :
            pecas.map(p => (
              <div key={p.id} className="card" style={{ borderLeft: `3px solid ${p.quantidadeEstoque <= 5 ? 'var(--color-danger)' : p.quantidadeEstoque <= 15 ? 'var(--color-warning)' : 'var(--color-success)'}` }}>
                <div className="flex items-center gap-2.5">
                  <Package size={18} style={{ color:'var(--color-brand-400)', flexShrink:0 }} />
                  <div style={{ fontWeight:600, fontSize:'0.875rem', color:'var(--color-text-primary)' }}>{p.nome}</div>
                </div>
                <div className="flex items-center justify-between mt-3" style={{ paddingTop:'10px', borderTop:'1px solid var(--color-border)' }}>
                  <span style={{ fontSize:'0.75rem', color:'var(--color-text-muted)' }}>Estoque atual</span>
                  <span style={{ fontSize:'1.25rem', fontWeight:700, color: p.quantidadeEstoque <= 5 ? 'var(--color-danger)' : p.quantidadeEstoque <= 15 ? 'var(--color-warning)' : 'var(--color-success)' }}>
                    {p.quantidadeEstoque} <span style={{ fontSize:'0.75rem', fontWeight:400 }}>un.</span>
                  </span>
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* Aba: Entradas */}
      {aba === 1 && (
        <div className="table-container">
          <table className="table">
            <thead><tr><th>Peça</th><th>Data</th><th>Qtd</th><th>Valor Unit.</th><th>Fornecedor</th><th>NF</th><th>Total</th></tr></thead>
            <tbody>
              {lEnt ? <tr><td colSpan={7}><div className="flex justify-center py-8"><Loader2 size={22} className="animate-spin" style={{ color:'var(--color-brand-500)' }} /></div></td></tr> :
                entradas.map(e => (
                  <tr key={e.id}>
                    <td style={{ fontWeight:600 }}>{e.peca?.nome}</td>
                    <td style={{ fontSize:'0.8125rem' }}>{fmt(e.dataEntrada)}</td>
                    <td>{e.quantidade}</td>
                    <td style={{ color:'var(--color-text-secondary)' }}>R$ {parseFloat(e.valorUnitario).toFixed(2)}</td>
                    <td style={{ fontSize:'0.8125rem' }}>{e.fornecedor}</td>
                    <td style={{ color:'var(--color-text-muted)', fontSize:'0.8125rem' }}>{e.numeroNotaFiscal || '—'}</td>
                    <td style={{ fontWeight:600, color:'var(--color-success)' }}>R$ {parseFloat(e.total).toFixed(2)}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      )}

      {/* Aba: Movimentações */}
      {aba === 2 && (
        <div className="table-container">
          <table className="table">
            <thead><tr><th>Peça</th><th>Data</th><th>Qtd</th><th>Loja</th><th>Chamado</th><th>Status</th></tr></thead>
            <tbody>
              {lMov ? <tr><td colSpan={6}><div className="flex justify-center py-8"><Loader2 size={22} className="animate-spin" style={{ color:'var(--color-brand-500)' }} /></div></td></tr> :
                movs.map(m => (
                  <tr key={m.id}>
                    <td style={{ fontWeight:600 }}>{m.peca?.nome}</td>
                    <td style={{ fontSize:'0.8125rem' }}>{fmt(m.dataMovimentacao)}</td>
                    <td>{m.quantidade}</td>
                    <td>{m.lojaRequisitante}</td>
                    <td style={{ color:'var(--color-text-muted)', fontSize:'0.8125rem' }}>{m.numeroChamado || '—'}</td>
                    <td><span className="badge badge-info" style={{ fontSize:'0.7rem' }}>{m.status}</span></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      )}

      {/* Aba: Saídas */}
      {aba === 3 && (
        <div className="table-container">
          <table className="table">
            <thead><tr><th>Peça</th><th>Data</th><th>Destino</th><th>Responsável</th><th>Empresa</th></tr></thead>
            <tbody>
              {lSai ? <tr><td colSpan={5}><div className="flex justify-center py-8"><Loader2 size={22} className="animate-spin" style={{ color:'var(--color-brand-500)' }} /></div></td></tr> :
                saidas.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight:600 }}>{s.peca?.nome}</td>
                    <td style={{ fontSize:'0.8125rem' }}>{fmt(s.data)}</td>
                    <td>{s.destino}</td>
                    <td>{s.nomeRetirou}</td>
                    <td style={{ color:'var(--color-text-secondary)' }}>{s.empresa}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      )}

      {modal === 'entrada' && <Modal title="Registrar Entrada de Peça" onClose={() => setModal(null)}><EntradaForm onClose={() => setModal(null)} /></Modal>}
      {modal === 'movimentacao' && <Modal title="Registrar Movimentação" onClose={() => setModal(null)}><MovimentacaoForm onClose={() => setModal(null)} /></Modal>}
    </div>
  );
}
