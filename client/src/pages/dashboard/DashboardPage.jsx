import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { dashboardService, tarefasService, checklistService } from '../../services';
import { useAuth } from '../../contexts/AuthContext';
import {
  ClipboardList, DollarSign, AlertTriangle, Package,
  TrendingUp, TrendingDown, Minus, ClipboardCheck, ShoppingCart,
  MapPin, ChevronRight, BarChart3, Users
} from 'lucide-react';

const CORES_SEGMENTO = [
  '#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6',
  '#06b6d4','#f97316','#14b8a6','#84cc16','#ec4899','#6366f1',
];

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

function StatCard({ label, value, sub, icon: Icon, accent, trend }) {
  const trendIcon = trend > 0
    ? <TrendingUp size={13} style={{ color: 'var(--color-danger)' }} />
    : trend < 0
    ? <TrendingDown size={13} style={{ color: 'var(--color-success)' }} />
    : <Minus size={13} style={{ color: 'var(--color-text-muted)' }} />;

  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
          <p style={{ fontSize: '1.625rem', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '6px', lineHeight: 1 }}>{value}</p>
          {sub && (
            <div className="flex items-center gap-1 mt-2">
              {trend !== undefined && trendIcon}
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{sub}</p>
            </div>
          )}
        </div>
        <div className="flex items-center justify-center w-10 h-10 rounded-xl" style={{ background: accent + '20' }}>
          <Icon size={20} style={{ color: accent }} />
        </div>
      </div>
    </div>
  );
}

const TooltipCustom = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--color-surface-700)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '10px 14px', fontSize: '0.8125rem' }}>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '4px' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {p.name?.includes('R$') || p.dataKey === 'valor' ? fmt(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

function CorporativoDashboard({ filtro }) {
  const navigate = useNavigate();
  const [showExecutiveSummary, setShowExecutiveSummary] = useState(true);
  const { data: regionalData = [], isLoading: l1 } = useQuery({
    queryKey: ['dashboard-regional'],
    queryFn: () => dashboardService.regional().then(r => r.data),
  });

  const { data: macroResumo, isLoading: l2 } = useQuery({
    queryKey: ['dashboard-resumo-macro', filtro],
    queryFn: () => dashboardService.resumo(filtro).then(r => r.data),
  });

  const { data: historicoMacro = [], isLoading: l3 } = useQuery({
    queryKey: ['dashboard-historico-macro'],
    queryFn: () => dashboardService.historicoMensal().then(r => r.data),
  });

  const { data: porSegmentoMacro = [], isLoading: l4 } = useQuery({
    queryKey: ['dashboard-segmento-macro', filtro],
    queryFn: () => dashboardService.gastosPorSegmento(filtro).then(r => r.data),
  });

  const isLoading = l1 || l2 || l3 || l4;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: '110px', borderRadius: '12px' }} />)}
        </div>
        <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="skeleton" style={{ height: '250px', borderRadius: '12px' }} />
          <div className="skeleton" style={{ height: '250px', borderRadius: '12px' }} />
        </div>
      </div>
    );
  }

  const variacaoMacro = parseFloat(macroResumo?.financeiro?.variacaoPercent || 0);
  const regionalOrdenado = [...regionalData].sort((a, b) => (b.gastosMes || 0) - (a.gastosMes || 0));

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      {/* ─── SEÇÃO 1: VISÃO MACRO (CONSOLIDADA) ──────────────────────────────── */}
      <section className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BarChart3 size={22} style={{ color: 'var(--color-brand-500)' }} />
            Visão Macro Global
          </h2>
          <span className="badge badge-brand">Consolidado Empresa</span>
        </div>

        <div className="flex flex-wrap gap-4 items-stretch">
          <div style={{ flex: '1 1 300px', maxWidth: '400px' }}>
            <StatCard
              label="Gastos Globais"
              value={fmt(macroResumo?.financeiro?.gastosMes)}
              sub={`${Math.abs(variacaoMacro)}% vs mês anterior`}
              icon={DollarSign}
              accent="var(--color-success)"
              trend={variacaoMacro}
            />
          </div>
          <div style={{ flex: '1 1 300px', maxWidth: '400px' }}>
            <StatCard
              label="Chamados / Mau Uso Total"
              value={macroResumo?.financeiro?.chamadosMes ?? '—'}
              sub={`${macroResumo?.financeiro?.mauUso ?? 0} alertas de mau uso`}
              icon={AlertTriangle}
              accent="var(--color-warning)"
            />
          </div>
        </div>

        {/* Gráficos Macros */}
        <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="card">
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '16px' }}>
              Histórico de Gastos Global (6 meses)
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart 
                data={historicoMacro} 
                barSize={32}
                onClick={(state) => {
                  if (state && state.activePayload) {
                    const d = state.activePayload[0].payload;
                    navigate(`/chamados?mes=${d.mesNum}&ano=${d.anoNum}`);
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                <XAxis dataKey="mes" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<TooltipCustom />} />
                <Bar dataKey="valor" fill="var(--color-brand-600)" radius={[4, 4, 0, 0]} name="R$ Gasto" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '16px' }}>
              Distribuição de Gastos por Segmento (Rede)
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={porSegmentoMacro}
                  dataKey="total"
                  nameKey="segmento"
                  cx="50%" cy="50%"
                  outerRadius={80}
                  innerRadius={50}
                >
                  {porSegmentoMacro.map((_, i) => (
                    <Cell key={i} fill={CORES_SEGMENTO[i % CORES_SEGMENTO.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => fmt(v)} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '0.75rem' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* ─── SEÇÃO 2: VISÃO POR REGIONAL ────────────────────────────────────── */}
      <section className="flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <MapPin size={20} style={{ color: 'var(--color-brand-500)' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Status por Regional
          </h2>
        </div>

        <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          {regionalOrdenado.map((reg) => (
            <div key={reg.regiao} className="card hover-scale" style={{ padding: '20px', cursor: 'default' }}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full" style={{ background: 'var(--color-brand-100)', color: 'var(--color-brand-600)' }}>
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{reg.regiao}</h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Métricas operacionais locais</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', padding: '12px 0', margin: '8px 0' }}>
                <div className="text-center">
                  <p style={{ fontSize: '0.625rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Gastos Mensais</p>
                  <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-success)', marginTop: '4px' }}>{fmt(reg.gastosMes)}</p>
                </div>
                <div className="text-center" style={{ borderLeft: '1px solid var(--color-border)' }}>
                  <p style={{ fontSize: '0.625rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Chamados Abertos</p>
                  <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '4px' }}>{reg.chamadosMes}</p>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button 
                  className="btn btn-ghost btn-sm" 
                  style={{ fontSize: '0.75rem', gap: '4px' }}
                  onClick={() => window.location.href = `/chamados?regiao=${reg.regiao}`}
                >
                  BI Regional <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>


      {/* ─── SEÇÃO 3: RESUMO EXECUTIVO ────────────────────────────────────────── */}
      {showExecutiveSummary && (
        <div className="card" style={{ 
          background: 'linear-gradient(135deg, var(--color-surface-800) 0%, var(--color-surface-900) 100%)', 
          border: '1px solid var(--color-surface-600)',
          boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--color-brand-500)' }} />
          
          <div className="flex items-start justify-between gap-4" style={{ position: 'relative', zIndex: 1 }}>
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg shrink-0" style={{ background: 'var(--color-surface-600)', color: 'var(--color-brand-400)' }}>
                <BarChart3 size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '8px' }}>Resumo Executivo</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                  Este painel combina a visão de alto nível (Macro) com o detalhamento tático (Regional).
                  Os indicadores refletem o status em tempo real de todas as unidades conectadas ao sistema de manutenção.
                </p>
              </div>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              style={{ padding: '4px 8px', fontSize: '1rem', lineHeight: 1 }}
              onClick={() => setShowExecutiveSummary(false)}
              aria-label="Fechar resumo executivo"
            >
              x
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


function GestorDashboard({ filtro }) {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const isGestor = usuario?.role === 'GESTOR';
  const { data: resumo, isLoading: l1 } = useQuery({
    queryKey: ['dashboard-resumo', filtro],
    queryFn: () => dashboardService.resumo(filtro).then(r => r.data),
  });
  const { data: historico = [], isLoading: l2 } = useQuery({
    queryKey: ['dashboard-historico'],
    queryFn: () => dashboardService.historicoMensal().then(r => r.data),
  });
  const { data: porSegmento = [], isLoading: l3 } = useQuery({
    queryKey: ['dashboard-segmento', filtro],
    queryFn: () => dashboardService.gastosPorSegmento(filtro).then(r => r.data),
  });
  const { data: kpiChecklist } = useQuery({
    queryKey: ['dashboard-kpi-checklist', filtro],
    queryFn: () => checklistService.kpiMensal(filtro).then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const loading = l1 || l2 || l3;

  if (loading) {
    return (
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: '110px', borderRadius: '12px' }} />
        ))}
      </div>
    );
  }

  const variacao = parseFloat(resumo?.financeiro?.variacaoPercent || 0);

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      {/* Cabeçalho do Gestor */}
      <div className="flex items-center justify-between">
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Dashboard Operacional
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={14} /> {usuario?.unidade} · {usuario?.regiao}
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="flex flex-wrap gap-4 items-stretch">
        <div style={{ flex: '1 1 240px' }}>
          <StatCard
            label="Tarefas Pendentes"
            value={resumo?.tarefas?.pendentes ?? '—'}
            sub={`${resumo?.tarefas?.emAndamento ?? 0} em andamento`}
            icon={ClipboardList}
            accent="var(--color-brand-500)"
          />
        </div>
        <div style={{ flex: '1 1 240px' }}>
          <StatCard
            label="Gastos Gerais"
            value={fmt(resumo?.financeiro?.gastosMes)}
            sub={`${Math.abs(variacao)}% em relação ao mês anterior`}
            icon={DollarSign}
            accent="var(--color-success)"
            trend={variacao}
          />
        </div>
        <div style={{ flex: '1 1 240px' }}>
          <StatCard
            label="Chamados / Mau Uso"
            value={resumo?.financeiro?.chamadosMes ?? '—'}
            sub={`${resumo?.financeiro?.mauUso ?? 0} registros de mau uso`}
            icon={AlertTriangle}
            accent="var(--color-warning)"
          />
        </div>
        {isGestor && (
          <div style={{ flex: '1 1 240px' }}>
            <StatCard
              label="Peças em Alerta"
              value={resumo?.estoque?.pecasBaixoEstoque?.length ?? 0}
              sub="Estoque ≤ 5 unidades"
              icon={Package}
              accent="var(--color-danger)"
            />
          </div>
        )}
      </div>

      {/* Gráficos */}
      <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* Histórico mensal */}
        <div className="card">
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '16px' }}>
            Histórico de Gastos (6 meses)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart 
              data={historico} 
              barSize={28}
              onClick={(state) => {
                if (state && state.activePayload) {
                  const d = state.activePayload[0].payload;
                  navigate(`/chamados?mes=${d.mesNum}&ano=${d.anoNum}`);
                }
              }}
              style={{ cursor: 'pointer' }}
            >
              <XAxis dataKey="mes" tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<TooltipCustom />} />
              <Bar dataKey="valor" fill="var(--color-brand-600)" radius={[4, 4, 0, 0]} name="R$ Gasto" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gastos por segmento */}
        <div className="card">
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '16px' }}>
            Gastos por Segmento
          </h3>
          {porSegmento.length === 0 ? (
            <div className="flex items-center justify-center h-48" style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              Sem dados para o período
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={porSegmento}
                  dataKey="total"
                  nameKey="segmento"
                  cx="50%" cy="50%"
                  outerRadius={75}
                  innerRadius={40}
                >
                  {porSegmento.map((_, i) => (
                    <Cell key={i} fill={CORES_SEGMENTO[i % CORES_SEGMENTO.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => fmt(v)} />
                <Legend
                  formatter={(v) => <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Card: KPI Checklists do Mês */}
      <div className="card">
        <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ClipboardCheck size={16} style={{ color: 'var(--color-brand-400)' }} />
          {usuario?.role === 'COORDENADOR' ? 'Atividade Mensal (Consolidado Regional)' : 'Meus Checklists'} — {new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
        </h3>
        {!kpiChecklist ? (
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Sem dados de checklist para este mês.</p>
        ) : (
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
            {/* Equipamentos */}
            <div style={{ padding: '16px', borderRadius: '10px', background: kpiChecklist.equipamentos.totalParados > 0 ? 'rgba(239,68,68,0.07)' : 'rgba(16,185,129,0.07)', border: `1px solid ${kpiChecklist.equipamentos.totalParados > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}` }}>
              <div className="flex items-center gap-2 mb-3">
                <ClipboardCheck size={15} style={{ color: kpiChecklist.equipamentos.totalParados > 0 ? 'var(--color-danger)' : 'var(--color-success)' }} />
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Equipamentos Parados</span>
              </div>
              <p style={{ fontSize: '2rem', fontWeight: 700, color: kpiChecklist.equipamentos.totalParados > 0 ? 'var(--color-danger)' : 'var(--color-success)', lineHeight: 1 }}>
                {kpiChecklist.equipamentos.totalParados}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '6px' }}>
                {kpiChecklist.equipamentos.semanasPrenchidas}/{kpiChecklist.equipamentos.totalSemanasNoMes} semanas preenchidas
              </p>
              {Object.entries(kpiChecklist.equipamentos.porTipo || {}).slice(0, 3).map(([tipo, qtd]) => (
                <div key={tipo} className="flex justify-between items-center mt-2">
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    {tipo.replace(/_/g, ' ')}
                  </span>
                  <span className="badge badge-danger" style={{ fontSize: '0.7rem', padding: '1px 6px' }}>{qtd} parado(s)</span>
                </div>
              ))}
            </div>

            {/* Carrinhos */}
            <div style={{ padding: '16px', borderRadius: '10px', background: kpiChecklist.carrinhos.totalQuebrados > 0 ? 'rgba(245,158,11,0.07)' : 'rgba(16,185,129,0.07)', border: `1px solid ${kpiChecklist.carrinhos.totalQuebrados > 0 ? 'rgba(245,158,11,0.25)' : 'rgba(16,185,129,0.2)'}` }}>
              <div className="flex items-center gap-2 mb-3">
                <ShoppingCart size={15} style={{ color: kpiChecklist.carrinhos.totalQuebrados > 0 ? 'var(--color-warning)' : 'var(--color-success)' }} />
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Carrinhos Quebrados</span>
              </div>
              <p style={{ fontSize: '2rem', fontWeight: 700, color: kpiChecklist.carrinhos.totalQuebrados > 0 ? 'var(--color-warning)' : 'var(--color-success)', lineHeight: 1 }}>
                {kpiChecklist.carrinhos.totalQuebrados}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '6px' }}>
                de {kpiChecklist.carrinhos.totalGeral} cadastrados • Taxa: {kpiChecklist.carrinhos.taxaQuebra}%
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                {kpiChecklist.carrinhos.semanasPrenchidas}/{kpiChecklist.carrinhos.totalSemanasNoMes} semanas preenchidas
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Lista de Peças em alerta */}
      {isGestor && resumo?.estoque?.pecasBaixoEstoque?.length > 0 && (
        <div className="card mt-2">
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-warning)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={15} /> Peças com estoque crítico
          </h3>
          <div className="flex flex-wrap gap-2">
            {resumo.estoque.pecasBaixoEstoque.map(p => (
              <div
                key={p.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-primary)' }}>{p.nome}</span>
                <span className="badge badge-danger" style={{ padding: '1px 6px' }}>{p.quantidadeEstoque} un.</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TecnicoDashboard() {
  const { usuario } = useAuth();
  const { data: tarefasRes, isLoading } = useQuery({
    queryKey: ['dashboard-tecnico-tarefas'],
    queryFn: () => tarefasService.listar({ limit: 50 }).then(r => r.data),
  });

  const tarefas = tarefasRes?.data || [];
  const pendentes = tarefas.filter(t => t.status === 'PENDENTE');
  const emAndamento = tarefas.filter(t => t.status === 'EM_ANDAMENTO');

  if (isLoading) return <div className="skeleton" style={{ height: '200px', borderRadius: '12px' }} />;

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
        Visão Resumida (Técnico)
      </h2>
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
        <StatCard
          label="Tarefas Pendentes"
          value={pendentes.length}
          sub={`${emAndamento.length} em andamento`}
          icon={ClipboardList}
          accent="var(--color-brand-500)"
        />
      </div>
      
      <div className="card mt-2">
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '16px' }}>Minhas Próximas Tarefas</h3>
        {tarefas.length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Nenhuma tarefa atribuída a você no momento.</p>
        ) : (
          <div className="flex flex-col gap-3">
             {tarefas.slice(0, 5).map(t => (
               <div key={t.id} style={{ padding: '12px', border: '1px solid var(--color-border)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <div>
                   <p style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>{t.descricao}</p>
                   <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{t.areResponsavel} • Prioridade: {t.prioridade}</p>
                 </div>
                 <span className={`badge ${t.status === 'CONCLUIDA' ? 'badge-success' : t.status === 'EM_ANDAMENTO' ? 'badge-warning' : 'badge-neutral'}`}>
                   {t.status.replace('_', ' ')}
                 </span>
               </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { usuario } = useAuth();
  const [filtro] = useState({
    mes: new Date().getMonth() + 1,
    ano: new Date().getFullYear()
  });
  
  const macroRoles = ['ADMINISTRADOR', 'DIRETOR', 'GERENTE', 'SUPERVISOR'];
  
  if (usuario?.role === 'TECNICO') return <TecnicoDashboard />;
  if (macroRoles.includes(usuario?.role)) {
    return <CorporativoDashboard filtro={filtro} />;
  }
  
  return <GestorDashboard filtro={filtro} />;
}
