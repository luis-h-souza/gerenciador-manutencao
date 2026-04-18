// src/pages/fornecedores/FornecedoresPage.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { fornecedoresService } from '../../services';
import { Plus, X, Loader2, Pencil, Trash2, Search, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

const SEGMENTOS = ['ELETRICA','EMPILHADEIRA','REFRIGERACAO','SERRALHERIA','CIVIL','EQUIPAMENTOS','GERADOR','ELEVADOR','PCI','ALUGUEL','DIVERSOS'];

function FornecedorModal({ fornecedor, onClose }) {
  const qc = useQueryClient();
  const isEdit = !!fornecedor;
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ defaultValues: fornecedor || {} });

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? fornecedoresService.atualizar(fornecedor.id, data) : fornecedoresService.criar(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fornecedores'] }); toast.success(isEdit ? 'Atualizado!' : 'Criado!'); onClose(); },
    onError: (err) => toast.error(err.response?.data?.message || 'Erro ao salvar'),
  });

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>{isEdit ? 'Editar Fornecedor' : 'Novo Fornecedor'}</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: '4px' }}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="flex flex-col gap-4">
          <div>
            <label className="label">Nome da Empresa *</label>
            <input className="input" {...register('nome', { required: 'Obrigatório' })} />
            {errors.nome && <p className="field-error">{errors.nome.message}</p>}
          </div>
          <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div>
              <label className="label">CNPJ *</label>
              <input className="input" placeholder="00000000000000" maxLength={14} {...register('cnpj', { required: 'Obrigatório', pattern: { value: /^\d{14}$/, message: '14 dígitos sem pontuação' } })} />
              {errors.cnpj && <p className="field-error">{errors.cnpj.message}</p>}
            </div>
            <div>
              <label className="label">Segmento *</label>
              <select className="select" {...register('segmento', { required: 'Obrigatório' })}>
                <option value="">Selecione...</option>
                {SEGMENTOS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div>
              <label className="label">Telefone</label>
              <input className="input" placeholder="(11) 99999-0000" {...register('telefone')} />
            </div>
            <div>
              <label className="label">E-mail</label>
              <input type="email" className="input" {...register('email')} />
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

export default function FornecedoresPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null);
  const [filtros, setFiltros] = useState({ nome: '', segmento: '', cnpj: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['fornecedores', filtros],
    queryFn: () => fornecedoresService.listar({ ...filtros, limit: 100 }).then(r => r.data),
  });

  const remover = useMutation({
    mutationFn: (id) => fornecedoresService.remover(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['fornecedores'] }); toast.success('Removido!'); },
    onError: () => toast.error('Erro ao remover'),
  });

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search size={15} style={{ position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', color:'var(--color-text-muted)' }} />
            <input className="input" style={{ paddingLeft:'32px', width:'180px' }} placeholder="Nome..." value={filtros.nome} onChange={e => setFiltros(f => ({ ...f, nome: e.target.value }))} />
          </div>
          <input className="input" style={{ width:'160px' }} placeholder="CNPJ..." value={filtros.cnpj} onChange={e => setFiltros(f => ({ ...f, cnpj: e.target.value }))} />
          <select className="select" style={{ width:'auto' }} value={filtros.segmento} onChange={e => setFiltros(f => ({ ...f, segmento: e.target.value }))}>
            <option value="">Todos os segmentos</option>
            {SEGMENTOS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('novo')}><Plus size={16} /> Novo Fornecedor</button>
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))' }}>
        {isLoading ? (
          [...Array(6)].map((_, i) => <div key={i} className="skeleton" style={{ height:'120px', borderRadius:'12px' }} />)
        ) : data?.data?.length === 0 ? (
          <div style={{ gridColumn:'1/-1', textAlign:'center', color:'var(--color-text-muted)', padding:'3rem', fontSize:'0.875rem' }}>
            Nenhum fornecedor encontrado
          </div>
        ) : data?.data?.map(f => (
          <div key={f.id} className="card" style={{ position:'relative' }}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0" style={{ background:'var(--color-surface-600)' }}>
                  <Building2 size={16} style={{ color:'var(--color-brand-400)' }} />
                </div>
                <div>
                  <div style={{ fontWeight:600, fontSize:'0.875rem', color:'var(--color-text-primary)' }}>{f.nome}</div>
                  <div style={{ fontSize:'0.75rem', color:'var(--color-text-muted)', marginTop:'2px' }}>CNPJ: {f.cnpj}</div>
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button className="btn btn-ghost btn-sm" onClick={() => setModal(f)} style={{ padding:'4px 6px' }}><Pencil size={13} /></button>
                <button className="btn btn-ghost btn-sm" onClick={() => { if(confirm('Remover?')) remover.mutate(f.id); }} style={{ padding:'4px 6px', color:'var(--color-danger)' }}><Trash2 size={13} /></button>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-3" style={{ paddingTop:'12px', borderTop:'1px solid var(--color-border)' }}>
              <span className="badge badge-brand" style={{ fontSize:'0.7rem' }}>{f.segmento}</span>
              {f.telefone && <span style={{ fontSize:'0.75rem', color:'var(--color-text-muted)' }}>{f.telefone}</span>}
              {f.email && <span style={{ fontSize:'0.75rem', color:'var(--color-text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.email}</span>}
            </div>
          </div>
        ))}
      </div>

      {modal && <FornecedorModal fornecedor={modal === 'novo' ? null : modal} onClose={() => setModal(null)} />}
    </div>
  );
}
