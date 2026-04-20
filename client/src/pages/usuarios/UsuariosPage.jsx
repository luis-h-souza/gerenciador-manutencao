// src/pages/usuarios/UsuariosPage.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { usuariosService, lojasService } from '../../services';
import { Plus, X, Loader2, Pencil, UserX, ShieldCheck, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const ROLES = ['ADMINISTRADOR', 'DIRETOR', 'GERENTE', 'SUPERVISOR', 'COORDENADOR', 'GESTOR', 'TECNICO'];
const ROLE_BADGE = { 
  ADMINISTRADOR: 'badge-danger', 
  DIRETOR: 'badge-danger',
  GERENTE: 'badge-warning',
  SUPERVISOR: 'badge-warning', 
  COORDENADOR: 'badge-info', 
  GESTOR: 'badge-brand', 
  TECNICO: 'badge-neutral' 
};

function UsuarioModal({ usuario, onClose }) {
  const qc = useQueryClient();
  const isEdit = !!usuario;
  const [regiaoFiltro, setRegiaoFiltro] = useState(usuario?.loja?.regiao || '');

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    defaultValues: usuario ? { ...usuario, lojaId: usuario.lojaId || '' } : { role: 'TECNICO' },
  });

  const { data: regioes = [] } = useQuery({
    queryKey: ['lojas-regioes'],
    queryFn: () => lojasService.listarRegioes().then(r => r.data),
  });

  const { data: lojasData } = useQuery({
    queryKey: ['lojas-por-regiao', regiaoFiltro],
    queryFn: () => lojasService.listar({ regiao: regiaoFiltro, limit: 200 }).then(r => r.data),
    enabled: !!regiaoFiltro,
  });
  const lojas = lojasData?.data ?? [];

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? usuariosService.atualizar(usuario.id, data) : usuariosService.criar(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['usuarios'] }); toast.success(isEdit ? 'Atualizado!' : 'Usuário criado!'); onClose(); },
    onError: (err) => toast.error(err.response?.data?.message || 'Erro ao salvar'),
  });

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h2 style={{ fontSize:'1rem', fontWeight:700 }}>{isEdit ? 'Editar Usuário' : 'Novo Usuário'}</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding:'4px' }}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="flex flex-col gap-4">
          <div><label className="label">Nome *</label>
            <input className="input" {...register('nome', { required: 'Obrigatório' })} />
            {errors.nome && <p className="field-error">{errors.nome.message}</p>}
          </div>
          <div><label className="label">E-mail *</label>
            <input type="email" className="input" {...register('email', { required: 'Obrigatório' })} />
          </div>
          <div className="grid gap-4" style={{ gridTemplateColumns:'1fr 1fr' }}>
            <div><label className="label">Senha {isEdit && '(deixe em branco para manter)'}</label>
              <input type="password" className="input" {...register('senha', { ...(!isEdit && { required: 'Obrigatório', minLength: { value: 8, message: 'Mín. 8 caracteres' } }) })} />
              {errors.senha && <p className="field-error">{errors.senha.message}</p>}
            </div>
            <div><label className="label">Perfil *</label>
              <select className="select" {...register('role', { required: true })}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div><label className="label">Região (acesso)</label>
            <input className="input" placeholder="ex: SP Capital (deixe em branco para acesso global)" {...register('regiao')} />
          </div>
          <div className="grid gap-4" style={{ gridTemplateColumns:'1fr 1fr' }}>
            <div>
              <label className="label">Região da loja</label>
              <select
                className="select"
                value={regiaoFiltro}
                onChange={e => { setRegiaoFiltro(e.target.value); setValue('lojaId', ''); }}
              >
                <option value="">Selecione a região</option>
                {regioes.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Loja</label>
              <select className="select" {...register('lojaId')} disabled={!regiaoFiltro}>
                <option value="">{regiaoFiltro ? 'Selecione a loja' : '← Primeiro a região'}</option>
                {lojas.map(l => <option key={l.id} value={l.id}>{l.numero} — {l.nome}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 size={16} className="animate-spin" />}
              {isEdit ? 'Salvar' : 'Criar Usuário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UsuariosPage() {
  const qc = useQueryClient();
  const { usuario: usuarioLogado } = useAuth();
  const [modal, setModal] = useState(null);

  const isSupervisor = usuarioLogado?.role === 'SUPERVISOR';
  // Somente Admin pode gerenciar
  const canManage = ['ADMINISTRADOR', 'DIRETOR'].includes(usuarioLogado?.role);

  const { data, isLoading } = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => usuariosService.listar({ limit: 100 }).then(r => r.data),
  });

  const desativar = useMutation({
    mutationFn: (id) => usuariosService.remover(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['usuarios'] }); toast.success('Usuário desativado'); },
    onError: () => toast.error('Erro'),
  });

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700 }}>
            {isSupervisor ? 'Visualização de Coordenadores' : 'Gestão de Usuários'}
          </h2>
          {!canManage && (
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
              <EyeOff size={14} /> Visualização somente leitura
            </span>
          )}
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={() => setModal('novo')}><Plus size={16} /> Novo Usuário</button>
        )}
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Região</th><th>Status</th><th>Criado em</th><th style={{ width:'80px' }}>Ações</th></tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7}><div className="flex justify-center py-8"><Loader2 size={22} className="animate-spin" style={{ color:'var(--color-brand-500)' }} /></div></td></tr>
            ) : data?.data?.map(u => (
              <tr key={u.id}>
                <td>
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full shrink-0" style={{ background:'var(--color-brand-600)', fontSize:'0.75rem', fontWeight:700, color:'#fff' }}>
                      {u.nome?.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontWeight:600 }}>{u.nome}</span>
                  </div>
                </td>
                <td style={{ color:'var(--color-text-secondary)', fontSize:'0.8125rem' }}>{u.email}</td>
                <td><span className={`badge ${ROLE_BADGE[u.role]}`} style={{ fontSize:'0.7rem' }}>{u.role}</span></td>
                <td>
                  <div style={{ fontSize:'0.75rem', fontWeight:500, color:'var(--color-text-secondary)' }}>{u.regiao || '—'}</div>
                  {u.loja && <div style={{ fontSize:'0.7rem', color:'var(--color-text-muted)' }}>{u.loja.numero} — {u.loja.nome}</div>}
                </td>
                <td>
                  {u.ativo
                    ? <span className="badge badge-success" style={{ fontSize:'0.7rem' }}>Ativo</span>
                    : <span className="badge badge-neutral" style={{ fontSize:'0.7rem' }}>Inativo</span>
                  }
                </td>
                <td style={{ fontSize:'0.8125rem', color:'var(--color-text-muted)' }}>
                  {new Date(u.criadoEm).toLocaleDateString('pt-BR')}
                </td>
                <td>
                  <div className="flex items-center gap-1">
                    {canManage && (
                      <>
                        <button className="btn btn-ghost btn-sm" onClick={() => setModal(u)} style={{ padding:'4px 6px' }}><Pencil size={14} /></button>
                        {u.ativo && (
                          <button className="btn btn-ghost btn-sm" onClick={() => { if(confirm('Desativar usuário?')) desativar.mutate(u.id); }} style={{ padding:'4px 6px', color:'var(--color-warning)' }}><UserX size={14} /></button>
                        )}
                      </>
                    )}
                    {!canManage && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>—</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && canManage && <UsuarioModal usuario={modal === 'novo' ? null : modal} onClose={() => setModal(null)} />}
    </div>
  );
}
