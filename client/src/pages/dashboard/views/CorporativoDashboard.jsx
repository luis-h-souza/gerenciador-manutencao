import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  DollarSign,
  AlertTriangle,
  ClipboardCheck,
  MapPin,
  ChevronRight,
  BarChart3,
  Users,
  UserRound,
  Trophy,
  CircleHelp,
} from "lucide-react";
import {
  dashboardService,
  checklistService,
  usuariosService,
} from "../../../services";
import { useAuth } from "../../../contexts/AuthContext";
import StatCard from "../components/StatCard";
import TooltipCustom from "../components/ChartTooltip";
import RegionalDrilldown from "../components/RegionalDrilldown";
import { OPCOES_MES } from "../hooks/useDashboardFilters";

const CORES_SEGMENTO = [
  "#0ea5e9","#10b981","#f59e0b","#ef4444","#8b5cf6",
  "#e2670f","#4d7412","#ec4899","#fcd34d","#db2777",
  "#c9ff71","#f87171","#eab308","#a78bfa",
];

const fmt = (v) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

const fmtMonthYear = (mes, ano) =>
  new Date(ano, (mes || 1) - 1, 1).toLocaleString("pt-BR", {
    month: "long",
    year: "numeric",
  });

export default function CorporativoDashboard({ filtro, setFiltro }) {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [showExecutiveSummary, setShowExecutiveSummary] = useState(true);
  const [regionalSelecionada, setRegionalSelecionada] = useState(null);
  const [rankingHelpOpen, setRankingHelpOpen] = useState(false);

  // Controle de Drill-down (Gerentes -> Coordenadores -> Regionais)
  const roleInicial =
    usuario?.role === "DIRETOR" || usuario?.role === "ADMINISTRADOR"
      ? "gerentes"
      : usuario?.role === "GERENTE"
        ? "coordenadores"
        : "regionais";

  const [dashboardEtapa, setDashboardEtapa] = useState(roleInicial);
  const [gerenteDrill, setGerenteDrill] = useState(null);
  const [coordenadorDrill, setCoordenadorDrill] = useState(null);

  // Histórico não muda com o filtro de mês — sempre exibe os últimos 6 meses
  const filtroHistorico = { regiao: filtro.regiao };

  const { data: regionalRes, isLoading: l1 } = useQuery({
    queryKey: ["dashboard-regional", filtro],
    queryFn: () => dashboardService.regional(filtro).then((r) => r.data),
  });

  const { data: macroResumo, isLoading: l2 } = useQuery({
    queryKey: ["dashboard-resumo-macro", filtro],
    queryFn: () => dashboardService.resumo(filtro).then((r) => r.data),
  });

  const { data: historicoMacro = [], isLoading: l3 } = useQuery({
    queryKey: ["dashboard-historico-macro", filtroHistorico],
    queryFn: () =>
      dashboardService.historicoMensal(filtroHistorico).then((r) => r.data),
  });

  const { data: porSegmentoMacro = [], isLoading: l4 } = useQuery({
    queryKey: ["dashboard-segmento-macro", filtro],
    queryFn: () =>
      dashboardService.gastosPorSegmento(filtro).then((r) => r.data),
  });

  const { data: rankingCoordenadores, isLoading: l5 } = useQuery({
    queryKey: ["dashboard-ranking-coordenadores", filtro],
    queryFn: () =>
      dashboardService.rankingCoordenadores(filtro).then((r) => r.data),
  });

  const ranking = rankingCoordenadores?.data || [];

  // Dados de Checklist para o card de Adesão
  const { data: checklistData } = useQuery({
    queryKey: ["checklist-consolidado-regional-all", filtro.mes, filtro.ano],
    queryFn: () =>
      checklistService
        .consolidadoRegional({ mes: filtro.mes, ano: filtro.ano })
        .then((res) => res.data),
  });

  const checklistStats = useMemo(() => {
    if (!checklistData?.lojas)
      return { taxaAdesao: 0, lojasComPreenchimento: 0, totalLojas: 0 };
    const lojas = checklistData.lojas;
    const totalLojas = lojas.length;
    const lojasComPreenchimento = lojas.filter(
      (l) => Object.keys(l.consolidado || {}).length > 0,
    ).length;
    const taxaAdesao =
      totalLojas > 0
        ? Math.round((lojasComPreenchimento / totalLojas) * 100)
        : 0;
    return { taxaAdesao, lojasComPreenchimento, totalLojas };
  }, [checklistData]);

  // Queries para Hierarquia (Gerentes e Coordenadores)
  const { data: gerentesData, isLoading: lG } = useQuery({
    queryKey: ["users-gerentes"],
    queryFn: () =>
      usuariosService
        .listar({ role: "GERENTE", limit: 100, ativo: true })
        .then((r) => r.data?.data || []),
    enabled: ["ADMINISTRADOR", "DIRETOR"].includes(usuario?.role),
  });

  const { data: coordenadoresData, isLoading: lC } = useQuery({
    queryKey: ["users-coordenadores"],
    queryFn: () =>
      usuariosService
        .listar({ role: "COORDENADOR", limit: 100, ativo: true })
        .then((r) => r.data?.data || []),
    enabled: ["ADMINISTRADOR", "DIRETOR", "GERENTE"].includes(usuario?.role),
  });

  const { data: detalheRegional, isLoading: l6 } = useQuery({
    queryKey: ["dashboard-detalhe-regional", regionalSelecionada, filtro],
    queryFn: () =>
      dashboardService
        .detalheRegional(regionalSelecionada, filtro)
        .then((r) => r.data),
    enabled: !!regionalSelecionada,
  });

  // ─── LÓGICA DE AGREGAÇÃO PARA HIERARQUIA ────────────────────────────────────

  const splitRegions = (r) =>
    r
      ? r
          .split(",")
          .map((s) => s.trim().toUpperCase())
          .filter(Boolean)
      : [];

  // Agrega dados para Gerentes
  const gerentesAgregados = useMemo(() => {
    if (!gerentesData || !regionalRes?.data) return [];
    const regionalData = regionalRes.data;
    return gerentesData
      .filter((u) => u.role === "GERENTE")
      .map((g) => {
        const regioesG = splitRegions(g.regiao);
        const regionaisAtreladas = regionalData.filter((r) =>
          regioesG.includes(r.regiao.toUpperCase()),
        );
        return {
          ...g,
          gastosMes: regionaisAtreladas.reduce((sum, r) => sum + (r.gastosMes || 0), 0),
          totalLojas: regionaisAtreladas.reduce((sum, r) => sum + (r.totalLojas || 0), 0),
          numRegionais: regionaisAtreladas.length,
        };
      })
      .sort((a, b) => b.gastosMes - a.gastosMes);
  }, [gerentesData, regionalRes?.data]);

  // Agrega dados para Coordenadores
  const coordenadoresAgregados = useMemo(() => {
    if (!coordenadoresData || !regionalRes?.data) return [];
    const regionalData = regionalRes.data;

    let baseCoords = coordenadoresData.filter((c) => c.id !== usuario?.id);
    if (gerenteDrill) {
      const regioesGerente = splitRegions(gerenteDrill.regiao);
      baseCoords = baseCoords.filter((c) => {
        const regioesC = splitRegions(c.regiao);
        return regioesC.some((r) => regioesGerente.includes(r));
      });
    } else if (usuario?.role === "GERENTE") {
      const regioesG = splitRegions(usuario.regiao);
      baseCoords = coordenadoresData.filter((c) => {
        if (c.id === usuario?.id) return false;
        const regioesC = splitRegions(c.regiao);
        return regioesC.some((r) => regioesG.includes(r));
      });
    }

    return baseCoords
      .filter((u) => u.role === "COORDENADOR")
      .map((c) => {
        const regioesC = splitRegions(c.regiao);
        const regionaisAtreladas = regionalData.filter((r) =>
          regioesC.includes(r.regiao.toUpperCase()),
        );
        return {
          ...c,
          gastosMes: regionaisAtreladas.reduce((sum, r) => sum + (r.gastosMes || 0), 0),
          totalLojas: regionaisAtreladas.reduce((sum, r) => sum + (r.totalLojas || 0), 0),
          numRegionais: regionaisAtreladas.length,
        };
      })
      .sort((a, b) => b.gastosMes - a.gastosMes);
  }, [coordenadoresData, regionalRes?.data, gerenteDrill, usuario]);

  const regionalOrdenado = useMemo(() => {
    const data = regionalRes?.data || [];
    return [...data].sort((a, b) => (b.gastosMes || 0) - (a.gastosMes || 0));
  }, [regionalRes?.data]);

  const regionaisFiltradas = useMemo(() => {
    if (coordenadorDrill) {
      const regioesC = splitRegions(coordenadorDrill.regiao);
      return regionalOrdenado.filter((r) =>
        regioesC.includes(r.regiao.toUpperCase()),
      );
    }
    return regionalOrdenado;
  }, [regionalOrdenado, coordenadorDrill]);

  const handleBack = () => {
    if (dashboardEtapa === "regionais") {
      setDashboardEtapa("coordenadores");
      setCoordenadorDrill(null);
    } else if (dashboardEtapa === "coordenadores") {
      if (usuario?.role === "DIRETOR" || usuario?.role === "ADMINISTRADOR") {
        setDashboardEtapa("gerentes");
        setGerenteDrill(null);
      }
    }
  };

  const isLoading =
    l1 ||
    l2 ||
    l3 ||
    l4 ||
    l5 ||
    (dashboardEtapa === "gerentes" && lG) ||
    (dashboardEtapa === "coordenadores" && lC);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}
        >
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: "110px", borderRadius: "12px" }} />
          ))}
        </div>
        <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div className="skeleton" style={{ height: "250px", borderRadius: "12px" }} />
          <div className="skeleton" style={{ height: "250px", borderRadius: "12px" }} />
        </div>
      </div>
    );
  }

  const variacaoMacro = parseFloat(macroResumo?.financeiro?.variacaoPercent || 0);
  const opcoesRegionais = regionalOrdenado.map((item) => item.regiao);
  const periodoAtual = fmtMonthYear(
    macroResumo?.periodo?.mes || filtro.mes,
    macroResumo?.periodo?.ano || filtro.ano,
  );
  const escopoAtual = filtro.regiao ? `Regional ${filtro.regiao}` : "Levantamento geral";

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      {/* ─── SEÇÃO 1: VISÃO MACRO (CONSOLIDADA) ──────────────────────────────── */}
      <section className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "var(--color-text-primary)",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <BarChart3 size={22} style={{ color: "var(--color-brand-500)" }} />
            Visão Macro Global
          </h2>
        </div>

        <div className="card" style={{ padding: "16px 18px" }}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "var(--color-text-muted)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Resumo Financeiro
              </p>
              <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", marginTop: "4px" }}>
                Filtre regional e/ou mês para detalhar gastos, histórico e composição financeira.
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "8px" }}>
                Exibindo:{" "}
                <strong style={{ color: "var(--color-brand-400)" }}>{periodoAtual}</strong>{" "}
                • Escopo: {escopoAtual}
                {filtro.mes !== new Date().getMonth() + 1 ||
                filtro.ano !== new Date().getFullYear() ? (
                  <span style={{ marginLeft: "8px", color: "var(--color-warning)", fontSize: "0.7rem" }}>
                    ⚠ Histórico de 6 meses não é afetado por este filtro
                  </span>
                ) : null}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                id="dashboard-filtro-mes"
                className="select"
                style={{ minWidth: "185px" }}
                value={`${filtro.ano}-${String(filtro.mes).padStart(2, "0")}`}
                onChange={(e) => {
                  const opt = OPCOES_MES.find((o) => o.value === e.target.value);
                  if (opt)
                    setFiltro((prev) => ({ ...prev, mes: opt.mes, ano: opt.ano }));
                }}
              >
                {OPCOES_MES.map((opt) => {
                  const hoje = new Date();
                  const isAtual =
                    opt.mes === hoje.getMonth() + 1 && opt.ano === hoje.getFullYear();
                  return (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                      {isAtual ? " (atual)" : ""}
                    </option>
                  );
                })}
              </select>

              <span style={{ color: "var(--color-border)", fontSize: "1.2rem", lineHeight: 1 }}>|</span>

              <select
                id="dashboard-filtro-regional"
                className="select"
                style={{ minWidth: "185px" }}
                value={filtro.regiao}
                onChange={(e) =>
                  setFiltro((prev) => ({ ...prev, regiao: e.target.value }))
                }
              >
                <option value="">Todas as regionais</option>
                {opcoesRegionais.map((regiao) => (
                  <option key={regiao} value={regiao}>
                    {regiao}
                  </option>
                ))}
              </select>
              {filtro.regiao && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setFiltro((prev) => ({ ...prev, regiao: "" }))}
                >
                  Limpar
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 items-stretch">
          <div style={{ flex: "1 1 300px" }}>
            <StatCard
              label="Gastos Globais"
              value={fmt(macroResumo?.financeiro?.gastosMes)}
              sub={`${Math.abs(variacaoMacro)}% vs mês anterior`}
              icon={DollarSign}
              accent="var(--color-success)"
              trend={variacaoMacro}
            />
          </div>
          <div style={{ flex: "1 1 300px" }}>
            <StatCard
              label="Chamados / Mau Uso Total"
              value={macroResumo?.financeiro?.chamadosMes ?? "—"}
              sub={`${macroResumo?.financeiro?.mauUso ?? 0} alertas de mau uso`}
              icon={AlertTriangle}
              accent="var(--color-warning)"
            />
          </div>
          <div
            style={{ flex: "1 1 300px", cursor: "pointer" }}
            onClick={() => navigate("/checklists-consolidado")}
          >
            <StatCard
              label="Adesão Checklists"
              value={`${checklistStats.taxaAdesao}%`}
              sub={`${checklistStats.lojasComPreenchimento} de ${checklistStats.totalLojas} lojas preencheram`}
              icon={ClipboardCheck}
              accent="var(--color-brand-400)"
            />
          </div>
        </div>

        {/* Gráficos Macros */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Card 1: Histórico de Gastos */}
          <div className="card h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <BarChart3 size={18} style={{ color: "var(--color-brand-500)" }} />
                <h3 style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
                  Histórico de Gastos Global (6 meses)
                </h3>
              </div>
              {historicoMacro.length > 0 && (
                <div className="text-right">
                  <p style={{ fontSize: "0.6rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
                    Média Rede
                  </p>
                  <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--color-brand-400)" }}>
                    {fmt(
                      historicoMacro.reduce((acc, h) => acc + (h.valor || 0), 0) /
                        historicoMacro.length,
                    )}
                  </p>
                </div>
              )}
            </div>

            <div style={{ flex: 1, minHeight: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={historicoMacro}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  onClick={(state) => {
                    if (state && state.activePayload) {
                      if (!state.activePayload || state.activePayload.length === 0) return;
                      const d = state.activePayload[0].payload;
                      navigate(`/chamados?mes=${d.mesNum}&ano=${d.anoNum}`);
                    }
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <defs>
                    <linearGradient id="colorGastoMacro" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-brand-500)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-brand-500)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis
                    dataKey="mes"
                    tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis
                    tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 10, fill: "var(--color-text-muted)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<TooltipCustom />} />
                  <Area
                    type="monotone"
                    dataKey="valor"
                    name="Total Gasto"
                    stroke="var(--color-brand-500)"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorGastoMacro)"
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "16px" }}>
              Distribuição de Gastos por Segmento (Rede)
            </h3>
            <div className="grid gap-4 items-start grid-cols-1 lg:grid-cols-2">
              <div style={{ minWidth: 0, height: "clamp(240px, 42vw, 320px)" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={porSegmentoMacro}
                      dataKey="total"
                      nameKey="segmento"
                      cx="50%"
                      cy="50%"
                      outerRadius="72%"
                      innerRadius="44%"
                    >
                      {porSegmentoMacro.map((_, i) => (
                        <Cell key={i} fill={CORES_SEGMENTO[i % CORES_SEGMENTO.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<TooltipCustom />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div
                className="flex flex-col gap-2"
                style={{ maxHeight: "clamp(220px, 36vw, 320px)", overflowY: "auto", paddingRight: "4px" }}
              >
                {porSegmentoMacro.map((item, i) => (
                  <div
                    key={`${item.segmento}-${i}`}
                    className="flex items-center justify-between gap-3"
                    style={{
                      padding: "10px 12px",
                      borderRadius: "10px",
                      background: "var(--color-surface-700)",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    <div className="flex items-center gap-2" style={{ minWidth: 0 }}>
                      <span
                        style={{
                          width: "10px",
                          height: "10px",
                          borderRadius: "999px",
                          background: CORES_SEGMENTO[i % CORES_SEGMENTO.length],
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontSize: "0.8125rem",
                          color: "var(--color-text-secondary)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                        title={item.segmento}
                      >
                        {item.segmento}
                      </span>
                    </div>
                    <strong style={{ fontSize: "0.8rem", color: "var(--color-text-primary)", flexShrink: 0 }}>
                      {fmt(item.total)}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SEÇÃO 2: HIERARQUIA FINANCEIRA ────────────────────────────────────── */}
      <section className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {dashboardEtapa !== roleInicial && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleBack}
                style={{ padding: "8px" }}
              >
                <ChevronRight className="rotate-180" size={18} />
              </button>
            )}
            <div className="flex items-center gap-2">
              {dashboardEtapa === "regionais" ? (
                <MapPin size={20} style={{ color: "var(--color-brand-500)" }} />
              ) : (
                <Users size={20} style={{ color: "var(--color-brand-500)" }} />
              )}
              <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
                {dashboardEtapa === "gerentes" && "Status por Gerente Regional"}
                {dashboardEtapa === "coordenadores" &&
                  (gerenteDrill
                    ? `Coordenadores de ${gerenteDrill.nome}`
                    : "Status por Coordenador")}
                {dashboardEtapa === "regionais" &&
                  (coordenadorDrill
                    ? `Regionais de ${coordenadorDrill.nome}`
                    : "Status por Regional")}
              </h2>
            </div>
          </div>

          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
            {dashboardEtapa === "gerentes" && "Clique em um gerente para detalhar coordenadores"}
            {dashboardEtapa === "coordenadores" && "Clique em um coordenador para detalhar regionais"}
            {dashboardEtapa === "regionais" && "Visão analítica por regional"}
          </p>
        </div>

        <div
          className="grid gap-5"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}
        >
          {/* CARDS DE GERENTES */}
          {dashboardEtapa === "gerentes" &&
            gerentesAgregados.map((ger) => (
              <div
                key={ger.id}
                className="card hover-scale pointer"
                onClick={() => {
                  setGerenteDrill(ger);
                  setDashboardEtapa("coordenadores");
                }}
                style={{ padding: "20px" }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex items-center justify-center w-10 h-10 rounded-full"
                      style={{ background: "var(--color-brand-100)", color: "var(--color-brand-600)" }}
                    >
                      <UserRound size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
                        {ger.nome}
                      </h3>
                      <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                        Gerente Regional • {ger.numRegionais} regionais
                      </p>
                    </div>
                  </div>
                </div>
                <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "12px", marginTop: "8px" }}>
                  <div className="flex justify-between items-center">
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
                      Gastos Gerenciados
                    </span>
                    <span style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--color-brand-500)" }}>
                      {fmt(ger.gastosMes)}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", marginTop: "4px" }}>
                    Engloba {ger.totalLojas} lojas ativas
                  </p>
                </div>
              </div>
            ))}

          {/* CARDS DE COORDENADORES */}
          {dashboardEtapa === "coordenadores" &&
            coordenadoresAgregados.map((coord) => (
              <div
                key={coord.id}
                className="card hover-scale pointer"
                onClick={() => {
                  setCoordenadorDrill(coord);
                  setDashboardEtapa("regionais");
                }}
                style={{ padding: "20px" }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex items-center justify-center w-10 h-10 rounded-full"
                      style={{ background: "var(--color-surface-600)", color: "var(--color-text-primary)" }}
                    >
                      <Users size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
                        {coord.nome}
                      </h3>
                      <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                        Coordenador • {coord.numRegionais} regionais
                      </p>
                    </div>
                  </div>
                </div>
                <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "12px", marginTop: "8px" }}>
                  <div className="flex justify-between items-center">
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
                      Gastos Coordenados
                    </span>
                    <span style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--color-text-primary)" }}>
                      {fmt(coord.gastosMes)}
                    </span>
                  </div>
                </div>
              </div>
            ))}

          {/* CARDS DE REGIONAIS */}
          {dashboardEtapa === "regionais" &&
            regionaisFiltradas.map((reg) => (
              <div
                key={reg.regiao}
                className="card hover-scale"
                style={{ padding: "20px", cursor: "default" }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex items-center justify-center w-10 h-10 rounded-full"
                      style={{ background: "var(--color-brand-100)", color: "var(--color-brand-600)" }}
                    >
                      <MapPin size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
                        {reg.regiao}
                      </h3>
                      <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                        {periodoAtual} • {reg.totalLojas || 0} lojas ativas
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className="grid gap-4"
                  style={{
                    gridTemplateColumns: "1fr 1fr",
                    borderTop: "1px solid var(--color-border)",
                    borderBottom: "1px solid var(--color-border)",
                    padding: "12px 0",
                    margin: "8px 0",
                  }}
                >
                  <div className="text-center">
                    <p style={{ fontSize: "0.625rem", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase" }}>
                      Gastos Mensais
                    </p>
                    <p style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-success)", marginTop: "4px" }}>
                      {fmt(reg.gastosMes)}
                    </p>
                  </div>
                  <div className="text-center" style={{ borderLeft: "1px solid var(--color-border)" }}>
                    <p style={{ fontSize: "0.625rem", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase" }}>
                      Chamados Abertos
                    </p>
                    <p style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text-primary)", marginTop: "4px" }}>
                      {reg.chamadosMes}
                    </p>
                  </div>
                  <div className="text-center">
                    <p style={{ fontSize: "0.625rem", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase" }}>
                      Tarefas ativas
                    </p>
                    <p style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text-primary)", marginTop: "4px" }}>
                      {reg.tarefasAtivas}
                    </p>
                  </div>
                  <div className="text-center" style={{ borderLeft: "1px solid var(--color-border)" }}>
                    <p style={{ fontSize: "0.625rem", fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase" }}>
                      Lojas
                    </p>
                    <p style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text-primary)", marginTop: "4px" }}>
                      {reg.totalLojas || 0}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex justify-between gap-2 flex-wrap">
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ fontSize: "0.75rem" }}
                    onClick={() => setRegionalSelecionada(reg.regiao)}
                  >
                    Drill-down
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{
                      fontSize: "0.75rem",
                      gap: "4px",
                      border: "1px solid var(--color-border)",
                      background: "var(--color-surface-700)",
                    }}
                    onClick={() =>
                      navigate(
                        `/chamados?regiao=${reg.regiao}&mes=${filtro.mes}&ano=${filtro.ano}&view=regional-bi`,
                      )
                    }
                  >
                    BI Regional <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ))}
        </div>
      </section>

      {/* ─── SEÇÃO 3: RANKING DE COORDENADORES ──────────────────────────────────── */}
      <section className="flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <Trophy size={20} style={{ color: "var(--color-brand-500)" }} />
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
              Ranking de Coordenadores
            </h2>
            <div className="flex items-center gap-2" style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
              <p>Indicador proxy por disponibilidade, eficiência de custo e cobertura de checklist.</p>
              <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  aria-label="Como funciona o score do ranking"
                  onMouseEnter={() => setRankingHelpOpen(true)}
                  onMouseLeave={() => setRankingHelpOpen(false)}
                  onFocus={() => setRankingHelpOpen(true)}
                  onBlur={() => setRankingHelpOpen(false)}
                  style={{
                    padding: "2px",
                    minWidth: "auto",
                    width: "22px",
                    height: "22px",
                    borderRadius: "999px",
                    color: "var(--color-warning)",
                  }}
                >
                  <CircleHelp size={15} />
                </button>
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    width: "280px",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    background: "var(--color-surface-700)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text-secondary)",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                    lineHeight: 1.5,
                    zIndex: 50,
                    opacity: rankingHelpOpen ? 1 : 0,
                    visibility: rankingHelpOpen ? "visible" : "hidden",
                    pointerEvents: rankingHelpOpen ? "auto" : "none",
                    transition: "all 0.2s ease",
                    fontSize: "0.75rem",
                  }}
                >
                  <p style={{ fontWeight: 700, color: "var(--color-brand-400)", marginBottom: "4px" }}>
                    Como funciona o Score?
                  </p>
                  O score sobe com mais disponibilidade, menor custo por chamado e melhor cobertura de
                  checklist. Cai com equipamentos parados, carrinhos quebrados, tarefas ativas e registros
                  de mau uso.
                </div>
              </div>
            </div>
          </div>
        </div>

        {ranking.length === 0 ? (
          <div className="card" style={{ padding: "24px", color: "var(--color-text-muted)", textAlign: "center" }}>
            Nenhum coordenador encontrado para o escopo atual.
          </div>
        ) : (
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}
          >
            {ranking.map((item) => (
              <div key={item.id} className="card" style={{ padding: "18px" }}>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="badge badge-brand"
                        style={{ fontSize: "0.7rem", minWidth: "30px", justifyContent: "center" }}
                      >
                        #{item.posicao}
                      </span>
                      <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
                        {item.nome}
                      </h3>
                    </div>
                    <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "6px" }}>
                      {item.regiao || item.regioes?.join(" / ") || "Sem regional"}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", textTransform: "uppercase" }}>
                      Score
                    </p>
                    <p style={{ fontSize: "1.35rem", fontWeight: 700, color: "var(--color-brand-500)" }}>
                      {item.score}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
                  {[
                    { label: "Disponibilidade", value: item.disponibilidadeBruta.toFixed(1), color: "var(--color-success)" },
                    { label: "Custo / chamado", value: fmt(item.custoPorChamado), color: "var(--color-text-primary)" },
                    { label: "Ativos indisponíveis", value: item.equipamentosParados + item.carrinhosQuebrados, color: "var(--color-warning)" },
                    { label: "Checklist", value: `${item.semanasCobertas}/${item.totalSemanasNoMes} sem.`, color: "var(--color-text-primary)" },
                  ].map(({ label, value, color }) => (
                    <div
                      key={label}
                      style={{ padding: "10px 12px", borderRadius: "10px", background: "var(--color-surface-700)" }}
                    >
                      <p style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>{label}</p>
                      <p style={{ fontSize: "1rem", fontWeight: 700, color }}>{value}</p>
                    </div>
                  ))}
                </div>

                <div
                  className="flex items-center justify-between mt-4 pt-3"
                  style={{ borderTop: "1px solid var(--color-border)" }}
                >
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                    Chamados: {item.chamadosMes} • Mau uso: {item.mauUsoMes}
                  </span>
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--color-success)" }}>
                    {fmt(item.gastosMes)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ─── SEÇÃO 4: RESUMO EXECUTIVO ────────────────────────────────────────── */}
      {showExecutiveSummary && (
        <div
          className="card"
          style={{
            background: "linear-gradient(135deg, var(--color-surface-800) 0%, var(--color-surface-900) 100%)",
            border: "1px solid var(--color-surface-600)",
            boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "4px",
              height: "100%",
              background: "var(--color-brand-500)",
            }}
          />

          <div className="flex items-start justify-between gap-4" style={{ position: "relative", zIndex: 1 }}>
            <div className="flex items-start gap-4">
              <div
                className="flex items-center justify-center w-10 h-10 rounded-lg shrink-0"
                style={{ background: "var(--color-surface-600)", color: "var(--color-brand-400)" }}
              >
                <BarChart3 size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "8px" }}>
                  Resumo Executivo
                </h3>
                <p style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)", lineHeight: "1.6" }}>
                  Este painel combina a visão de alto nível (Macro) com o detalhamento tático (Regional). Os
                  indicadores refletem o status em tempo real de todas as unidades conectadas ao sistema de
                  manutenção.
                </p>
              </div>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              style={{ padding: "4px 8px", fontSize: "1rem", lineHeight: 1 }}
              onClick={() => setShowExecutiveSummary(false)}
              aria-label="Fechar resumo executivo"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <RegionalDrilldown
        detalhe={detalheRegional}
        loading={l6}
        onClose={() => setRegionalSelecionada(null)}
        onOpenRegional={(regiao) =>
          navigate(`/chamados?regiao=${regiao}&mes=${filtro.mes}&ano=${filtro.ano}`)
        }
        onOpenLoja={(unidade) =>
          navigate(
            `/chamados?regiao=${regionalSelecionada}&unidade=${encodeURIComponent(unidade)}&mes=${filtro.mes}&ano=${filtro.ano}`,
          )
        }
      />
    </div>
  );
}
