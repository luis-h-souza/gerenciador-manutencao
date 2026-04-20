// src/components/layout/ConfiguracaoModal.jsx
import { useState } from 'react';
import { X, Sun, Moon, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import { authService, usuariosService, lojasService } from '../../services';

const ROLES = [
  { value: 'ADMINISTRADOR', label: 'Administrador' },
  { value: 'DIRETOR', label: 'Diretor' },
  { value: 'GERENTE', label: 'Gerente' },
  { value: 'COORDENADOR', label: 'Coordenador' },
  { value: 'GESTOR', label: 'Gestor' },
  { value: 'TECNICO', label: 'Técnico' },
];

export default function ConfiguracaoModal({ open, onClose }) {
  const { usuario } = useAuth();
  const isAdmin = usuario?.role === 'ADMINISTRADOR';

  const tabs = [
    { id: 'aparencia', label: 'Aparência' },
    { id: 'seguranca', label: 'Segurança' },
    ...(isAdmin ? [{ id: 'novo-usuario', label: 'Novo Usuário' }] : []),
  ];

  const [activeTab, setActiveTab] = useState('aparencia');

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content animate-fade-in" style={{ maxWidth: '460px' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Configurações
          </h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div
          className="flex gap-1 mb-5 p-1 rounded-lg"
          style={{ background: 'var(--color-surface-700)' }}
        >
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 rounded-md transition-all"
              style={{
                padding: '6px 12px',
                fontSize: '0.8125rem',
                fontWeight: activeTab === tab.id ? 600 : 400,
                background: activeTab === tab.id ? 'var(--color-surface-800)' : 'transparent',
                color: activeTab === tab.id ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'aparencia' && <AparenciaTab />}
        {activeTab === 'seguranca' && <SegurancaTab onClose={onClose} />}
        {activeTab === 'novo-usuario' && isAdmin && <NovoUsuarioTab onClose={onClose} />}
      </div>
    </div>
  );
}

/* ── Aba Aparência ───────────────────────────────────────────────────────── */
function AparenciaTab() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex flex-col gap-3">
      <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
        Escolha o tema da interface
      </p>
      <div className="flex gap-3">
        {[
          { value: 'dark', label: 'Escuro', icon: Moon },
          { value: 'light', label: 'Claro', icon: Sun },
        ].map(({ value, label, icon: Icon }) => {
          const active = theme === value;
          return (
            <button
              key={value}
              onClick={() => !active && toggleTheme()}
              className="flex-1 flex flex-col items-center gap-2 rounded-xl py-5 transition-all"
              style={{
                background: active ? 'var(--color-brand-600)' : 'var(--color-surface-700)',
                border: `2px solid ${active ? 'var(--color-brand-400)' : 'var(--color-border)'}`,
                color: active ? '#fff' : 'var(--color-text-muted)',
                cursor: active ? 'default' : 'pointer',
              }}
            >
              <Icon size={22} />
              <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Aba Segurança ───────────────────────────────────────────────────────── */
function SegurancaTab({ onClose }) {
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const [showAtual, setShowAtual] = useState(false);
  const [showNova, setShowNova] = useState(false);

  const mutation = useMutation({
    mutationFn: (data) => authService.alterarSenha(data),
    onSuccess: () => {
      toast.success('Senha alterada com sucesso!');
      reset();
      onClose();
    },
    onError: (err) => {
      const msg = err?.response?.data?.error || 'Erro ao alterar senha';
      toast.error(msg);
    },
  });

  const novaSenha = watch('novaSenha');

  return (
    <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="flex flex-col gap-4">
      <div>
        <label className="label">Senha atual</label>
        <div className="relative">
          <input
            type={showAtual ? 'text' : 'password'}
            className="input pr-10"
            {...register('senhaAtual', { required: 'Obrigatório' })}
          />
          <button
            type="button"
            onClick={() => setShowAtual(v => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            {showAtual ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.senhaAtual && <p className="field-error">{errors.senhaAtual.message}</p>}
      </div>

      <div>
        <label className="label">Nova senha</label>
        <div className="relative">
          <input
            type={showNova ? 'text' : 'password'}
            className="input pr-10"
            {...register('novaSenha', { required: 'Obrigatório', minLength: { value: 8, message: 'Mínimo 8 caracteres' } })}
          />
          <button
            type="button"
            onClick={() => setShowNova(v => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            {showNova ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.novaSenha && <p className="field-error">{errors.novaSenha.message}</p>}
      </div>

      <div>
        <label className="label">Confirmar nova senha</label>
        <input
          type="password"
          className="input"
          {...register('confirmar', {
            required: 'Obrigatório',
            validate: v => v === novaSenha || 'As senhas não coincidem',
          })}
        />
        {errors.confirmar && <p className="field-error">{errors.confirmar.message}</p>}
      </div>

      <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
        {mutation.isPending ? 'Salvando...' : 'Alterar senha'}
      </button>
    </form>
  );
}

/* ── Aba Novo Usuário (apenas ADMINISTRADOR) ─────────────────────────────── */
function NovoUsuarioTab({ onClose }) {
  const queryClient = useQueryClient();
  const [regiaoFiltro, setRegiaoFiltro] = useState('');

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    defaultValues: { role: 'TECNICO' },
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
    mutationFn: (data) => usuariosService.criar(data),
    onSuccess: () => {
      toast.success('Usuário criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      reset({ role: 'TECNICO' });
      setRegiaoFiltro('');
      onClose();
    },
    onError: (err) => {
      const msg = err?.response?.data?.error || 'Erro ao criar usuário';
      toast.error(msg);
    },
  });

  return (
    <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="flex flex-col gap-4">
      <div>
        <label className="label">Nome *</label>
        <input className="input" {...register('nome', { required: 'Obrigatório' })} />
        {errors.nome && <p className="field-error">{errors.nome.message}</p>}
      </div>

      <div>
        <label className="label">E-mail *</label>
        <input
          type="email"
          className="input"
          {...register('email', { required: 'Obrigatório', pattern: { value: /^\S+@\S+\.\S+$/, message: 'E-mail inválido' } })}
        />
        {errors.email && <p className="field-error">{errors.email.message}</p>}
      </div>

      <div>
        <label className="label">Senha *</label>
        <input
          type="password"
          className="input"
          {...register('senha', { required: 'Obrigatório', minLength: { value: 8, message: 'Mínimo 8 caracteres' } })}
        />
        {errors.senha && <p className="field-error">{errors.senha.message}</p>}
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="label">Perfil *</label>
          <select className="select" {...register('role', { required: true })}>
            {ROLES.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="label">Região (acesso)</label>
          <input className="input" placeholder="ex: SP Capital" {...register('regiao')} />
        </div>
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
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

      <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
        {mutation.isPending ? 'Criando...' : 'Criar usuário'}
      </button>
    </form>
  );
}
