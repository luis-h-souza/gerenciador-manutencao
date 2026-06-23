// src/pages/metas/MetasOrcamentariasPage.jsx
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  Target, TrendingUp, TrendingDown, Minus, Plus, Pencil, Trash2,
  Loader2, ChevronLeft, ArrowLeft, AlertCircle, X, Filter, RefreshCw,
} from 'lucide-react';
import { metasService, lojasService } from '../../services';
import { useAuth } from '../../contexts/AuthContext';

const MESES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];

const ROLES_GESTAO = ['ADMINISTRADOR', 'DIRETOR', 'GERENTE'];

const hoje = new Date();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtBRL(valor) {
  if (valor === null || valor === undefined) return '—';
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarMoedaBRL(valor) {
  if (valor === undefined || valor === null || valor === '') return '';
  const apenasDigitos = String(valor).replace(/\D/g, '');
  if (!apenasDigitos) return '';
  const valorFloat = parseFloat(apenasDigitos) / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(valorFloat);
}

function fmtPct(pct) {
  if (pct === null || pct === undefined) return '—';
  return `${pct}%`;
}

function getStatusConfig(status) {
  switch (status) {
    case 'VERDE':    return { bg: 'var(--color-success-muted,#14532d22)', border: 'var(--color-success,#22c55e)', text: 'var(--color-success,#22c55e)', icon: TrendingDown, label: 'Dentro da meta' };
    case 'AMARELO':  return { bg: 'var(--color-warning-muted,#78350f22)', border: 'var(--color-warning,#f59e0b)', text: 'var(--color-warning,#f59e0b)', icon: Minus,       label: 'Atenção'         };
    case 'VERMELHO': return { bg: 'var(--color-danger-muted,#7f1d1d22)',  border: 'var(--color-danger,#ef4444)',  text: 'var(--color-danger,#ef4444)',  icon: TrendingUp,  label: 'Estouro de meta' };
    default:         return { bg: 'var(--color-surface-700)',              border: 'var(--color-border)',          text: 'var(--color-text-muted)',      icon: Minus,       label: 'Sem meta'        };
  }
}

// ─── Componente Card de Status ─────────────────────────────────────────────────

function StatusCard({ card, onClick }) {
  const cfg = getStatusConfig(card.status);
  const Icon = cfg.icon;
  const pct  = card.percentual ?? 0;
  const barWidth = Math.min(pct, 150); // cap visual em 150%

  return (
    <button
      onClick={onClick}
      style={{
        background: cfg.bg,
        border: `1.5px solid ${cfg.border}`,
        borderRadius: '14px',
        padding: '20px',
        textAlign: 'left',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.15s, box-shadow 0.15s',
        width: '100%',
      }}
      onMouseEnter={e => { if (onClick) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.18)'; }}}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>
            {card.tipo === 'REGIONAL' ? 'Regional' : `Loja${card.lojaNumero ? ` ${card.lojaNumero}` : ''}`}
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {card.tipo === 'REGIONAL' ? card.regiao : card.unidade}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,0.15)', borderRadius: '8px', padding: '4px 10px' }}>
          <Icon size={13} style={{ color: cfg.text }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: cfg.text }}>{cfg.label}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
        <div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginBottom: '2px' }}>Gasto Real</div>
          <div style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{fmtBRL(card.gastoReal)}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginBottom: '2px' }}>Meta</div>
          <div style={{ fontSize: '1.0625rem', fontWeight: 700, color: card.semMeta ? 'var(--color-text-muted)' : 'var(--color-text-primary)' }}>
            {card.semMeta ? 'Não definida' : fmtBRL(card.valorMeta)}
          </div>
        </div>
      </div>

      {/* Barra de progresso */}
      {!card.semMeta && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>Execução</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: cfg.text }}>{fmtPct(card.percentual)}</span>
          </div>
          <div style={{ height: '6px', background: 'rgba(0,0,0,0.2)', borderRadius: '99px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${(barWidth / 150) * 100}%`,
              background: cfg.border,
              borderRadius: '99px',
              transition: 'width 0.6s ease',
            }} />
          </div>
        </div>
      )}

      {card.semMeta && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
          <AlertCircle size={13} style={{ color: 'var(--color-text-muted)' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Sem meta cadastrada para o período</span>
        </div>
      )}

      {onClick && card.tipo === 'REGIONAL' && (
        <div style={{ marginTop: '10px', fontSize: '0.6875rem', color: 'var(--color-text-muted)', opacity: 0.7 }}>
          Clique para ver as lojas →
        </div>
      )}
    </button>
  );
}

// ─── Componente Barra de Orçamento Regional ───────────────────────────────────

function BarraRegional({ barra, mes, ano }) {
  if (!barra) return null;

  const pct      = barra.percentual ?? 0;
  const estourou = pct > 100;
  const saldo    = barra.saldoRestante;

  const corBarra =
    barra.semMeta ? 'var(--color-border)'
    : estourou    ? 'var(--color-danger)'
    : pct > 90    ? 'var(--color-warning)'
                  : 'var(--color-success)';

  const bgBarra =
    barra.semMeta ? 'var(--color-surface-700)'
    : estourou    ? 'rgba(239,68,68,0.08)'
    : pct > 90    ? 'rgba(245,158,11,0.08)'
                  : 'rgba(34,197,94,0.08)';

  return (
    <div style={{
      background: bgBarra,
      border: `1.5px solid ${corBarra}`,
      borderRadius: '14px',
      padding: '20px 24px',
      marginBottom: '16px',
    }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>
            Orçamento Regional — {barra.regiao}
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
            {barra.semMeta
              ? 'Nenhuma meta regional cadastrada para este período'
              : 'Consumo consolidado das lojas vs. meta da regional'}
          </div>
        </div>
        {!barra.semMeta && (
          <div style={{
            background: estourou ? 'rgba(239,68,68,0.15)' : pct > 90 ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.15)',
            border: `1px solid ${corBarra}`,
            borderRadius: '8px',
            padding: '4px 12px',
            fontSize: '0.8125rem',
            fontWeight: 700,
            color: corBarra,
            whiteSpace: 'nowrap',
          }}>
            {pct}% consumido
          </div>
        )}
      </div>

      {/* Valores */}
      {!barra.semMeta && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Gasto Total das Lojas</div>
              <div style={{ fontSize: '1.1875rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{fmtBRL(barra.gastoTotal)}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Meta Regional</div>
              <div style={{ fontSize: '1.1875rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{fmtBRL(barra.valorMeta)}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                {saldo >= 0 ? 'Saldo Disponível' : 'Estouro'}
              </div>
              <div style={{ fontSize: '1.1875rem', fontWeight: 700, color: saldo >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                {fmtBRL(Math.abs(saldo))}
              </div>
            </div>
          </div>

          {/* Barra de progresso */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>Orçamento consumido</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: corBarra }}>{pct}%</span>
            </div>
            <div style={{ height: '10px', background: 'rgba(0,0,0,0.18)', borderRadius: '99px', overflow: 'hidden', position: 'relative' }}>
              <div style={{
                height: '100%',
                width: `${Math.min(pct, 100)}%`,
                background: corBarra,
                borderRadius: '99px',
                transition: 'width 0.8s ease',
              }} />
              {/* Marcador de 100% */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: '100%',
                transform: 'translateX(-1px)',
                width: '2px',
                height: '100%',
                background: 'rgba(255,255,255,0.3)',
              }} />
            </div>
            {estourou && (
              <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertCircle size={12} />
                Orçamento regional estourado em {fmtBRL(Math.abs(saldo))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Modal de Formulário de Meta ───────────────────────────────────────────────

function ModalMeta({ onClose, metaEdicao, regioes }) {
  const queryClient = useQueryClient();
  const [regiaoSel, setRegiaoSel] = useState(metaEdicao?.regiao || '');
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      regiao:    metaEdicao?.regiao    || '',
      unidade:   metaEdicao?.unidade   || '',
      mes:       metaEdicao?.mes       || hoje.getMonth() + 1,
      ano:       metaEdicao?.ano       || hoje.getFullYear(),
      valorMeta: metaEdicao ? formatarMoedaBRL(Math.round(Number(metaEdicao.valorMeta) * 100)) : '',
    },
  });
  // Busca lojas ao selecionar região
  const { data: lojaOpcoes = [], isFetching: buscandoLojas } = useQuery({
    queryKey: ['lojas-para-meta', regiaoSel],
    queryFn: () => lojasService.listar({ regiao: regiaoSel, limit: 200 }).then(r => {
      const res = r.data?.dados ?? r.data?.data ?? [];
      return Array.isArray(res) ? res : res?.data ?? [];
    }),
    enabled: !!regiaoSel,
  });

  const mutation = useMutation({
    mutationFn: (data) => metasService.upsert(data),
    onSuccess: () => {
      toast.success('Meta salva com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['metas-lista'] });
      queryClient.invalidateQueries({ queryKey: ['metas-cards'] });
      onClose();
    },
    onError: (err) => {
      const msg = err?.response?.data?.mensagem || err?.response?.data?.message || 'Erro ao salvar meta';
      toast.error(msg);
    },
  });

  const onSubmit = (data) => {
    const apenasDigitos = String(data.valorMeta).replace(/\D/g, '');
    const valorFloat = apenasDigitos ? parseFloat(apenasDigitos) / 100 : 0;

    mutation.mutate({
      ...data,
      unidade: data.unidade || null,
      mes: parseInt(data.mes),
      ano: parseInt(data.ano),
      valorMeta: valorFloat,
    });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'var(--color-surface-800)', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '480px', boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              {metaEdicao ? 'Editar Meta' : 'Nova Meta Orçamentária'}
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              Meta fixa por loja ou regional para o período
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Região */}
          <div>
            <label className="label">Região *</label>
            <select
              className="select"
              {...register('regiao', { required: 'Obrigatório' })}
              onChange={(e) => { setValue('regiao', e.target.value); setValue('unidade', ''); setRegiaoSel(e.target.value); }}
            >
              <option value="">Selecione a região</option>
              {regioes.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            {errors.regiao && <p className="field-error">{errors.regiao.message}</p>}
          </div>

          {/* Loja (opcional) */}
          <div>
            <label className="label">Loja <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(opcional — vazio = meta para toda a regional)</span></label>
            <select className="select" {...register('unidade')} disabled={!regiaoSel || buscandoLojas}>
              <option value="">Toda a regional</option>
              {lojaOpcoes.map(l => <option key={l.id} value={l.nome}>{l.numero} — {l.nome}</option>)}
            </select>
          </div>

          {/* Período */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label className="label">Mês *</label>
              <select className="select" {...register('mes', { required: true })}>
                {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Ano *</label>
              <input
                type="number"
                className="input"
                min={2020}
                max={2040}
                {...register('ano', { required: true, min: 2020, max: 2040 })}
              />
            </div>
          </div>

          {/* Valor */}
          <div>
            <label className="label">Valor da Meta (R$) *</label>
            <input
              type="text"
              className="input"
              placeholder="R$ 0,00"
              {...register('valorMeta', {
                required: 'Obrigatório',
                onChange: (e) => {
                  const formatted = formatarMoedaBRL(e.target.value);
                  setValue('valorMeta', formatted, { shouldValidate: true });
                }
              })}
            />
            {errors.valorMeta && <p className="field-error">{errors.valorMeta.message}</p>}
          </div>

          <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending} style={{ flex: 1 }}>
              {mutation.isPending && <Loader2 size={15} className="animate-spin" />}
              {mutation.isPending ? 'Salvando...' : metaEdicao ? 'Salvar alterações' : 'Criar meta'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Página Principal ──────────────────────────────────────────────────────────

export default function MetasOrcamentariasPage() {
  const { usuario } = useAuth();
  const queryClient = useQueryClient();
  const podeGerenciar = ROLES_GESTAO.includes(usuario?.role);

  const [filtro, setFiltro] = useState({
    regiao: '',
    unidade: '',
    mes: hoje.getMonth() + 1,
    ano: hoje.getFullYear(),
  });
  const [showModal, setShowModal] = useState(false);
  const [metaEdicao, setMetaEdicao] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Regiões disponíveis para dropdowns
  const { data: regioes = [] } = useQuery({
    queryKey: ['lojas-regioes'],
    queryFn: () => lojasService.listarRegioes().then(r => r.data?.dados ?? r.data ?? []),
  });

  // Cards de status (gasto vs meta)
  const { data: cardsData = [], isLoading: cardsLoading, refetch: refetchCards } = useQuery({
    queryKey: ['metas-cards', filtro.mes, filtro.ano, filtro.regiao],
    queryFn: () => metasService.cards({ mes: filtro.mes, ano: filtro.ano, regiao: filtro.regiao || undefined }).then(r => r.data?.dados ?? r.data ?? []),
    staleTime: 2 * 60 * 1000,
  });

  // Listagem de metas (para tabela de gestão)
  const { data: metasRes, isLoading: metasLoading } = useQuery({
    queryKey: ['metas-lista', filtro.regiao, filtro.unidade, filtro.mes, filtro.ano],
    queryFn: () => metasService.listar({
      regiao:  filtro.regiao  || undefined,
      unidade: filtro.unidade || undefined,
      mes:     filtro.mes,
      ano:     filtro.ano,
    }).then(r => r.data?.dados ?? r.data ?? { data: [] }),
    enabled: podeGerenciar,
  });
  const metas = metasRes?.data ?? [];

  const deleteMutation = useMutation({
    mutationFn: (id) => metasService.remover(id),
    onSuccess: () => {
      toast.success('Meta removida!');
      queryClient.invalidateQueries({ queryKey: ['metas-lista'] });
      queryClient.invalidateQueries({ queryKey: ['metas-cards'] });
      setConfirmDelete(null);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.mensagem || 'Erro ao remover meta');
    },
  });

  const temFiltroRegiao = !!filtro.regiao;

  // Lojas para o filtro de loja (quando região selecionada)
  const { data: lojasRegiao = [] } = useQuery({
    queryKey: ['lojas-por-regiao-filtro', filtro.regiao],
    queryFn: () => lojasService.listar({ regiao: filtro.regiao, limit: 200 }).then(r => {
      const raw = r.data?.dados ?? r.data?.data ?? r.data ?? [];
      return Array.isArray(raw) ? raw : raw?.data ?? [];
    }),
    enabled: !!filtro.regiao,
  });

  const anosDisponiveis = useMemo(() => {
    const anoAtual = hoje.getFullYear();
    return Array.from({ length: 5 }, (_, i) => anoAtual - 1 + i);
  }, []);

  return (
    <div className="flex flex-col gap-6 animate-fade-in" style={{ paddingBottom: '32px' }}>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'var(--color-brand-600)', borderRadius: '10px', padding: '8px', display: 'flex' }}>
              <Target size={18} color="#fff" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Metas Orçamentárias
              </h1>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                Acompanhe e gerencie as metas financeiras de manutenção
              </p>
            </div>
          </div>

          {podeGerenciar && (
            <button
              className="btn btn-primary"
              onClick={() => { setMetaEdicao(null); setShowModal(true); }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={15} /> Nova Meta
            </button>
          )}
        </div>
      </div>

      {/* ── Filtros ──────────────────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--color-surface-800)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        padding: '16px 20px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'flex-end',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px', width: '100%' }}>
          <Filter size={14} style={{ color: 'var(--color-text-muted)' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filtros</span>
        </div>

        {/* Mês */}
        <div style={{ minWidth: '140px', flex: '1' }}>
          <label className="label" style={{ fontSize: '0.6875rem' }}>Mês</label>
          <select className="select" value={filtro.mes} onChange={e => setFiltro(f => ({ ...f, mes: parseInt(e.target.value) }))}>
            {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        </div>

        {/* Ano */}
        <div style={{ minWidth: '100px', flex: '0 0 auto' }}>
          <label className="label" style={{ fontSize: '0.6875rem' }}>Ano</label>
          <select className="select" value={filtro.ano} onChange={e => setFiltro(f => ({ ...f, ano: parseInt(e.target.value) }))}>
            {anosDisponiveis.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        {/* Regional (não exibe para GESTOR) */}
        {usuario?.role !== 'GESTOR' && (
          <div style={{ minWidth: '160px', flex: '1' }}>
            <label className="label" style={{ fontSize: '0.6875rem' }}>Regional</label>
            <select className="select" value={filtro.regiao} onChange={e => setFiltro(f => ({ ...f, regiao: e.target.value, unidade: '' }))}>
              <option value="">Todas as regionais</option>
              {regioes.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        )}

        {/* Loja (só aparece quando regional selecionada) */}
        {temFiltroRegiao && (
          <div style={{ minWidth: '200px', flex: '1' }}>
            <label className="label" style={{ fontSize: '0.6875rem' }}>Loja</label>
            <select className="select" value={filtro.unidade} onChange={e => setFiltro(f => ({ ...f, unidade: e.target.value }))}>
              <option value="">Todas as lojas</option>
              {lojasRegiao.map(l => <option key={l.id} value={l.nome}>{l.numero} — {l.nome}</option>)}
            </select>
          </div>
        )}

        {/* Limpar filtro */}
        {(filtro.regiao || filtro.unidade) && (
          <button
            className="btn btn-secondary"
            onClick={() => setFiltro(f => ({ ...f, regiao: '', unidade: '' }))}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
          >
            <ChevronLeft size={14} /> Limpar filtro
          </button>
        )}

        <button
          className="btn btn-secondary"
          onClick={() => refetchCards()}
          title="Atualizar dados"
          style={{ padding: '8px 10px' }}
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* ── Cards de Status ────────────────────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
          {temFiltroRegiao && usuario?.role !== 'GESTOR' && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setFiltro(f => ({ ...f, regiao: '', unidade: '' }))}
            >
              <ArrowLeft size={18} /> Voltar para Regionais
            </button>
          )}
          <h2 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
            {temFiltroRegiao ? `Lojas — ${filtro.regiao}` : 'Visão por Regional'}
            {' '}
            <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
              {MESES[filtro.mes - 1]} / {filtro.ano}
            </span>
          </h2>
        </div>

        {cardsLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-muted)', padding: '32px 0' }}>
            <Loader2 size={18} className="animate-spin" />
            <span>Carregando...</span>
          </div>
        ) : (() => {
          const barraRegional = temFiltroRegiao ? cardsData.find(c => c.tipo === 'BARRA_REGIONAL') ?? null : null;
          const lojaCards     = cardsData.filter(c => c.tipo !== 'BARRA_REGIONAL');

          return lojaCards.length === 0 && !barraRegional ? (
            <div style={{
              background: 'var(--color-surface-800)',
              border: '1px dashed var(--color-border)',
              borderRadius: '12px',
              padding: '40px',
              textAlign: 'center',
              color: 'var(--color-text-muted)',
            }}>
              <Target size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
              <p style={{ margin: 0 }}>Nenhuma regional ou loja encontrada para os filtros selecionados.</p>
            </div>
          ) : (
            <>
              {/* Barra de orçamento regional (drill-down de lojas) */}
              {temFiltroRegiao && (
                <BarraRegional
                  barra={barraRegional}
                  mes={filtro.mes}
                  ano={filtro.ano}
                />
              )}

              {/* Cards das lojas / regionais */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {lojaCards.map((card, i) => (
                  <StatusCard
                    key={i}
                    card={card}
                    onClick={card.tipo === 'REGIONAL' && usuario?.role !== 'GESTOR'
                      ? () => setFiltro(f => ({ ...f, regiao: card.regiao, unidade: '' }))
                      : null
                    }
                  />
                ))}
              </div>
            </>
          );
        })()}
      </div>

      {/* ── Tabela de Gestão (apenas ADMIN, DIRETOR, GERENTE) ─────────────── */}
      {podeGerenciar && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h2 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              Metas Cadastradas
            </h2>
          </div>

          {metasLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-muted)', padding: '24px 0' }}>
              <Loader2 size={18} className="animate-spin" /> <span>Carregando...</span>
            </div>
          ) : metas.length === 0 ? (
            <div style={{
              background: 'var(--color-surface-800)',
              border: '1px dashed var(--color-border)',
              borderRadius: '12px',
              padding: '32px',
              textAlign: 'center',
              color: 'var(--color-text-muted)',
            }}>
              <p style={{ margin: 0 }}>Nenhuma meta cadastrada para os filtros selecionados.</p>
              <button className="btn btn-primary" onClick={() => { setMetaEdicao(null); setShowModal(true); }} style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <Plus size={14} /> Cadastrar primeira meta
              </button>
            </div>
          ) : (
            <div style={{ background: 'var(--color-surface-800)', border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--color-surface-700)', borderBottom: '1px solid var(--color-border)' }}>
                    {['Regional', 'Loja', 'Período', 'Valor da Meta', 'Ações'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '0.6875rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {metas.map((meta, i) => (
                    <tr key={meta.id} style={{ borderBottom: i < metas.length - 1 ? '1px solid var(--color-border)' : 'none', transition: 'background 0.12s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-700)'}
                      onMouseLeave={e => e.currentTarget.style.background = ''}
                    >
                      <td style={{ padding: '12px 16px', fontSize: '0.875rem', color: 'var(--color-text-primary)', fontWeight: 500 }}>{meta.regiao}</td>
                      <td style={{ padding: '12px 16px', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{meta.unidade || <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Regional inteira</span>}</td>
                      <td style={{ padding: '12px 16px', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{MESES[meta.mes - 1]} / {meta.ano}</td>
                      <td style={{ padding: '12px 16px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{fmtBRL(meta.valorMeta)}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '5px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                            onClick={() => { setMetaEdicao(meta); setShowModal(true); }}
                            title="Editar"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            className="btn"
                            style={{ padding: '5px 8px', fontSize: '0.75rem', background: 'var(--color-danger-muted,#7f1d1d22)', color: 'var(--color-danger)', border: '1px solid var(--color-danger)', borderRadius: '6px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                            onClick={() => setConfirmDelete(meta)}
                            title="Excluir"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Modal de Criação/Edição ─────────────────────────────────────────── */}
      {showModal && (
        <ModalMeta
          onClose={() => { setShowModal(false); setMetaEdicao(null); }}
          metaEdicao={metaEdicao}
          regioes={Array.isArray(regioes) ? regioes : regioes?.dados ?? regioes?.data ?? []}
        />
      )}

      {/* ── Confirmar Exclusão ──────────────────────────────────────────────── */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'var(--color-surface-800)', border: '1px solid var(--color-border)', borderRadius: '14px', padding: '28px', maxWidth: '380px', width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ background: '#7f1d1d44', borderRadius: '8px', padding: '8px', display: 'flex' }}>
                <Trash2 size={18} style={{ color: 'var(--color-danger)' }} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Confirmar exclusão</h3>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: '0 0 20px' }}>
              Deseja remover a meta de <strong>{fmtBRL(confirmDelete.valorMeta)}</strong> para{' '}
              <strong>{confirmDelete.unidade || confirmDelete.regiao}</strong> em{' '}
              <strong>{MESES[confirmDelete.mes - 1]} / {confirmDelete.ano}</strong>?
              <br />Esta ação não pode ser desfeita.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn"
                style={{ flex: 1, background: 'var(--color-danger)', color: '#fff', border: 'none', borderRadius: '8px', padding: '9px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                onClick={() => deleteMutation.mutate(confirmDelete.id)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                {deleteMutation.isPending ? 'Removendo...' : 'Sim, remover'}
              </button>
              <button className="btn btn-secondary" onClick={() => setConfirmDelete(null)} style={{ flex: 1 }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
