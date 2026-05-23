// src/pages/configuracoes/ConfiguracaoPage.jsx
import { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Sun,
  Moon,
  Eye,
  EyeOff,
  User,
  Palette,
  Shield,
  Store,
  UserPlus,
  MapPin,
  Phone,
  Lightbulb,
  Loader2,
  HelpCircle,
  X,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import { authService, usuariosService, lojasService } from '../../services';
import AjudaPage from '../ajuda/AjudaPage';

const ROLE_LABELS = {
  ADMINISTRADOR: 'Administrador',
  DIRETOR: 'Diretor',
  GERENTE: 'Gerente',
  COORDENADOR: 'Coordenador',
  GESTOR: 'Gestor',
  TECNICO: 'Técnico',
};

const ROLES_CADASTRO = [
  { value: 'ADMINISTRADOR', label: 'Administrador' },
  { value: 'DIRETOR', label: 'Diretor' },
  { value: 'GERENTE', label: 'Gerente' },
  { value: 'COORDENADOR', label: 'Coordenador' },
  { value: 'GESTOR', label: 'Gestor' },
  { value: 'TECNICO', label: 'Técnico' },
];

const SUGESTOES_FUTURAS = [
  'Preferências de notificação (e-mail e alertas no sistema)',
  'Edição do nome e foto de perfil',
  'Autenticação em dois fatores (2FA)',
  'Exportação dos seus dados (LGPD)',
  'Atalhos de teclado personalizados',
];

function SettingsSection({ title, description, children }) {
  return (
    <section className="settings-section">
      <header className="settings-section-header">
        <h2 className="settings-section-title">{title}</h2>
        {description && <p className="settings-section-desc">{description}</p>}
      </header>
      {children}
    </section>
  );
}

function SettingsNavItem({ id, label, icon: Icon, active, onClick }) {
  return (
    <button
      type="button"
      className={`settings-nav-item ${active ? 'active' : ''}`}
      onClick={() => onClick(id)}
    >
      <Icon size={17} className="settings-nav-icon shrink-0" />
      <span>{label}</span>
    </button>
  );
}

export default function ConfiguracaoPage() {
  const { usuario } = useAuth();
  const isAdmin = usuario?.role === 'ADMINISTRADOR';
  const isGestor = usuario?.role === 'GESTOR';

  const sections = useMemo(() => {
    const list = [
      { id: 'conta', label: 'Minha conta', icon: User },
      { id: 'aparencia', label: 'Aparência', icon: Palette },
      { id: 'seguranca', label: 'Segurança', icon: Shield },
    ];
    if (isGestor) list.push({ id: 'loja', label: 'Minha loja', icon: Store });
    if (isAdmin) list.push({ id: 'equipe', label: 'Novo usuário', icon: UserPlus });
    list.push({ id: 'ajuda', label: 'Ajuda', icon: HelpCircle });
    return list;
  }, [isAdmin, isGestor]);

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialTab = searchParams.get('tab') || 'conta';
  
  const [activeSection, setActiveSection] = useState(initialTab);

  // Update active section if query param changes
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && sections.some(s => s.id === tab)) {
      setActiveSection(tab);
    }
  }, [location.search, sections]);

  const current = sections.find((s) => s.id === activeSection)?.id ?? sections[0]?.id;

  return (
    <div className="settings-page animate-fade-in">
      <header className="settings-header">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>
            Configurações
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '0.35rem' }}>
            Personalize sua experiência e gerencie dados da sua conta
          </p>
        </div>
        <div className="settings-user-chip">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-full shrink-0"
            style={{ background: 'var(--color-brand-600)', fontSize: '0.875rem', fontWeight: 700, color: '#fff' }}
          >
            {usuario?.nome?.charAt(0).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {usuario?.nome}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
              {ROLE_LABELS[usuario?.role] || usuario?.role}
            </div>
          </div>
        </div>
      </header>

      <div className="settings-layout">
        <nav className="settings-nav" aria-label="Seções de configuração">
          {sections.map((s) => (
            <SettingsNavItem
              key={s.id}
              id={s.id}
              label={s.label}
              icon={s.icon}
              active={current === s.id}
              onClick={setActiveSection}
            />
          ))}
        </nav>

        <div className="settings-panel">
          {current === 'conta' && <ContaSection usuario={usuario} />}
          {current === 'aparencia' && <AparenciaSection />}
          {current === 'seguranca' && <SegurancaSection />}
          {current === 'loja' && isGestor && <MinhaLojaSection />}
          {current === 'equipe' && isAdmin && <NovoUsuarioSection />}
          {current === 'ajuda' && <AjudaPage />}
          <SugestoesSection />
        </div>
      </div>
    </div>
  );
}

function ContaSection({ usuario }) {
  return (
    <SettingsSection
      title="Minha conta"
      description="Informações do seu perfil no sistema. Para alterar perfil ou região, contate um administrador."
    >
      <div className="settings-row">
        <span className="settings-row-label">Nome</span>
        <span className="settings-row-value">{usuario?.nome || '—'}</span>
      </div>
      <div className="settings-row">
        <span className="settings-row-label">E-mail</span>
        <span className="settings-row-value">{usuario?.email || '—'}</span>
      </div>
      <div className="settings-row">
        <span className="settings-row-label">Perfil</span>
        <span className="settings-row-value">
          <span className="badge badge-brand">{ROLE_LABELS[usuario?.role] || usuario?.role}</span>
        </span>
      </div>
      {usuario?.regiao && (
        <div className="settings-row">
          <span className="settings-row-label">Região</span>
          <span className="settings-row-value">{usuario.regiao}</span>
        </div>
      )}
      {usuario?.unidade && (
        <div className="settings-row">
          <span className="settings-row-label">Unidade</span>
          <span className="settings-row-value">{usuario.unidade}</span>
        </div>
      )}
    </SettingsSection>
  );
}

function AparenciaSection() {
  const { theme, toggleTheme } = useTheme();

  return (
    <SettingsSection
      title="Aparência"
      description="Defina como o sistema é exibido no seu dispositivo. A preferência fica salva neste navegador."
    >
      <div className="settings-theme-grid">
        {[
          { value: 'dark', label: 'Escuro', icon: Moon, hint: 'Menos cansaço visual' },
          { value: 'light', label: 'Claro', icon: Sun, hint: 'Ambientes iluminados' },
        ].map(({ value, label, icon: Icon, hint }) => {
          const active = theme === value;
          return (
            <button
              key={value}
              type="button"
              className={`settings-theme-option ${active ? 'active' : ''}`}
              onClick={() => !active && toggleTheme()}
              aria-pressed={active}
            >
              <Icon size={24} />
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{label}</span>
              <span style={{ fontSize: '0.6875rem', opacity: active ? 0.9 : 0.7 }}>{hint}</span>
            </button>
          );
        })}
      </div>
    </SettingsSection>
  );
}

function SegurancaSection() {
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const [showAtual, setShowAtual] = useState(false);
  const [showNova, setShowNova] = useState(false);

  const mutation = useMutation({
    mutationFn: (data) => authService.alterarSenha(data),
    onSuccess: () => {
      toast.success('Senha alterada com sucesso!');
      reset();
    },
    onError: (err) => {
      const msg = err?.response?.data?.error || err?.response?.data?.mensagem || 'Erro ao alterar senha';
      toast.error(msg);
    },
  });

  const novaSenha = watch('novaSenha');

  return (
    <SettingsSection
      title="Segurança"
      description="Altere sua senha de acesso. Use pelo menos 8 caracteres com letras e números."
    >
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="flex flex-col gap-4 max-w-md">
        <div>
          <label className="label">Senha atual</label>
          <div className="relative">
            <input
              type={showAtual ? 'text' : 'password'}
              className="input pr-10"
              autoComplete="current-password"
              {...register('senhaAtual', { required: 'Obrigatório' })}
            />
            <button
              type="button"
              onClick={() => setShowAtual((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
              aria-label={showAtual ? 'Ocultar senha' : 'Mostrar senha'}
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
              autoComplete="new-password"
              {...register('novaSenha', { required: 'Obrigatório', minLength: { value: 8, message: 'Mínimo 8 caracteres' } })}
            />
            <button
              type="button"
              onClick={() => setShowNova((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
              aria-label={showNova ? 'Ocultar senha' : 'Mostrar senha'}
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
            autoComplete="new-password"
            {...register('confirmar', {
              required: 'Obrigatório',
              validate: (v) => v === novaSenha || 'As senhas não coincidem',
            })}
          />
          {errors.confirmar && <p className="field-error">{errors.confirmar.message}</p>}
        </div>

        <div className="pt-1">
          <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 size={16} className="animate-spin" />}
            {mutation.isPending ? 'Salvando...' : 'Alterar senha'}
          </button>
        </div>
      </form>
    </SettingsSection>
  );
}

function MinhaLojaSection() {
  const { usuario, refreshUsuario } = useAuth();
  const temLoja = !!(usuario?.lojaId || usuario?.loja?.id);

  const { data: loja, isLoading, isError, refetch } = useQuery({
    queryKey: ['minha-loja'],
    queryFn: () => lojasService.buscarMinha().then((r) => r.data),
    enabled: usuario?.role === 'GESTOR' && temLoja,
    initialData: usuario?.loja?.id ? usuario.loja : undefined,
  });

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm({
    values: {
      telefone: loja?.telefone ?? '',
      endereco: loja?.endereco ?? '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data) => lojasService.atualizarMinha(data),
    onSuccess: async () => {
      toast.success('Dados da loja atualizados!');
      await refreshUsuario?.();
      refetch();
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.response?.data?.error || 'Erro ao salvar';
      toast.error(msg);
    },
  });

  if (!temLoja) {
    return (
      <SettingsSection
        title="Minha loja"
        description="Atualize telefone e endereço de contato da unidade que você gerencia."
      >
        <p style={{ fontSize: '0.875rem', color: 'var(--color-warning)' }}>
          Sua conta não está vinculada a uma loja. Peça ao administrador para associar sua unidade.
        </p>
      </SettingsSection>
    );
  }

  if (isLoading) {
    return (
      <SettingsSection title="Minha loja" description="Carregando dados da unidade...">
        <div className="flex items-center gap-2" style={{ color: 'var(--color-text-muted)' }}>
          <Loader2 size={18} className="animate-spin" />
          <span style={{ fontSize: '0.875rem' }}>Carregando...</span>
        </div>
      </SettingsSection>
    );
  }

  if (isError || !loja) {
    return (
      <SettingsSection title="Minha loja">
        <p style={{ fontSize: '0.875rem', color: 'var(--color-danger)', marginBottom: '0.75rem' }}>
          Não foi possível carregar os dados da loja. Verifique sua sessão ou tente novamente.
        </p>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => refetch()}>
          Tentar novamente
        </button>
      </SettingsSection>
    );
  }

  return (
    <SettingsSection
      title="Minha loja"
      description="Como gestor, você pode manter telefone e endereço da sua unidade atualizados para a equipe e relatórios."
    >
      <div className="settings-row" style={{ borderBottom: '1px solid var(--color-border)', marginBottom: '1rem', paddingBottom: '1rem' }}>
        <span className="settings-row-label">Unidade</span>
        <span className="settings-row-value">
          <strong>Loja {loja.numero}</strong> — {loja.nome}
          <br />
          <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Região: {loja.regiao}</span>
        </span>
      </div>

      <form
        onSubmit={handleSubmit((d) => mutation.mutate(d))}
        className="flex flex-col gap-4 max-w-lg"
      >
        <div>
          <label className="label flex items-center gap-1.5">
            <Phone size={14} /> Telefone
          </label>
          <input
            className="input"
            placeholder="(11) 99999-0000"
            {...register('telefone')}
          />
          {errors.telefone && <p className="field-error">{errors.telefone.message}</p>}
        </div>

        <div>
          <label className="label flex items-center gap-1.5">
            <MapPin size={14} /> Endereço
          </label>
          <input
            className="input"
            placeholder="Rua, número, bairro, cidade"
            {...register('endereco')}
          />
          {errors.endereco && <p className="field-error">{errors.endereco.message}</p>}
        </div>

        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>
          Número, nome e região da loja só podem ser alterados por administradores na tela de Lojas.
        </p>

        <div className="flex gap-2 pt-1">
          <button type="submit" className="btn btn-primary" disabled={mutation.isPending || !isDirty}>
            {mutation.isPending && <Loader2 size={16} className="animate-spin" />}
            {mutation.isPending ? 'Salvando...' : 'Salvar alterações'}
          </button>
          {isDirty && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => reset({ telefone: loja.telefone ?? '', endereco: loja.endereco ?? '' })}
            >
              Descartar
            </button>
          )}
        </div>
      </form>
    </SettingsSection>
  );
}

function NovoUsuarioSection() {
  const queryClient = useQueryClient();
  const [regiaoFiltro, setRegiaoFiltro] = useState('');

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    defaultValues: { role: 'TECNICO' },
  });

  const { data: regioes = [] } = useQuery({
    queryKey: ['lojas-regioes'],
    queryFn: () => lojasService.listarRegioes().then((r) => r.data),
  });

  const { data: lojasData } = useQuery({
    queryKey: ['lojas-por-regiao', regiaoFiltro],
    queryFn: () => lojasService.listar({ regiao: regiaoFiltro, limit: 200 }).then((r) => r.data),
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
    },
    onError: (err) => {
      const msg = err?.response?.data?.error || err?.response?.data?.mensagem || 'Erro ao criar usuário';
      toast.error(msg);
    },
  });

  return (
    <SettingsSection
      title="Novo usuário"
      description="Cadastre um colaborador com perfil e, se aplicável, vincule à loja de atuação."
    >
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="flex flex-col gap-4 max-w-lg">
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

        <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div>
            <label className="label">Perfil *</label>
            <select className="select" {...register('role', { required: true })}>
              {ROLES_CADASTRO.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Região (acesso)</label>
            <input className="input" placeholder="ex: SP Capital" {...register('regiao')} />
          </div>
        </div>

        <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div>
            <label className="label">Região da loja</label>
            <select
              className="select"
              value={regiaoFiltro}
              onChange={(e) => { setRegiaoFiltro(e.target.value); setValue('lojaId', ''); }}
            >
              <option value="">Selecione a região</option>
              {regioes.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Loja</label>
            <select className="select" {...register('lojaId')} disabled={!regiaoFiltro}>
              <option value="">{regiaoFiltro ? 'Selecione a loja' : '← Primeiro a região'}</option>
              {lojas.map((l) => <option key={l.id} value={l.id}>{l.numero} — {l.nome}</option>)}
            </select>
          </div>
        </div>

        <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 size={16} className="animate-spin" />}
          {mutation.isPending ? 'Criando...' : 'Criar usuário'}
        </button>
      </form>
    </SettingsSection>
  );
}

function SugestoesSection() {
  const [isVisible, setIsVisible] = useState(() => {
    return localStorage.getItem('hideConfigSuggestions') !== 'true';
  });

  if (!isVisible) return null;

  return (
    <aside className="settings-suggestions" style={{ position: 'relative' }}>
      <button 
        onClick={() => {
          setIsVisible(false);
          localStorage.setItem('hideConfigSuggestions', 'true');
        }}
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--color-text-muted)',
          padding: '4px',
        }}
        aria-label="Fechar"
      >
        <X size={16} />
      </button>
      <div className="flex items-start gap-2">
        <Lightbulb size={18} style={{ color: 'var(--color-warning)', flexShrink: 0, marginTop: 2 }} />
        <div>
          <strong style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
            Em breve nesta página
          </strong>
          <ul>
            {SUGESTOES_FUTURAS.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  );
}
