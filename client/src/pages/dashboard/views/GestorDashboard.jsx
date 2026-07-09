import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  ClipboardList,
  DollarSign,
  AlertTriangle,
  Package,
  TrendingUp,
  MapPin,
  ClipboardCheck,
  ShoppingCart,
  Target,
} from "lucide-react";
import { dashboardService, checklistService } from "../../../services";
import { useAuth } from "../../../contexts/AuthContext";
import StatCard from "../components/StatCard";
import TooltipCustom from "../components/ChartTooltip";
import { OPCOES_MES } from "../hooks/useDashboardFilters";

const CORES_SEGMENTO = [
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#e2670f",
  "#4d7412",
  "#ec4899",
  "#fcd34d",
  "#db2777",
  "#c9ff71",
  "#f87171",
  "#eab308",
  "#a78bfa",
];

const fmt = (v) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    v || 0,
  );

export default function GestorDashboard({
  filtro,
  setFiltro,
  opcoesRegionais = [],
}) {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const isGestor = usuario?.role === "GESTOR";
  const isCoordenador = usuario?.role === "COORDENADOR";
  const [weeksToShow, setWeeksToShow] = useState(1);

  const { data: resumo, isLoading: l1 } = useQuery({
    queryKey: ["dashboard-resumo", filtro],
    queryFn: () => dashboardService.resumo(filtro).then((r) => r.data),
  });

  // Histórico não muda com o filtro de mês — sempre exibe os últimos 6 meses
  const filtroHistorico = { regiao: filtro.regiao };
  const { data: historico = [], isLoading: l2 } = useQuery({
    queryKey: ["dashboard-historico", filtroHistorico],
    queryFn: () =>
      dashboardService.historicoMensal(filtroHistorico).then((r) => r.data),
  });

  const { data: porSegmento = [], isLoading: l3 } = useQuery({
    queryKey: ["dashboard-segmento", filtro],
    queryFn: () =>
      dashboardService.gastosPorSegmento(filtro).then((r) => r.data),
  });

  const { data: kpiChecklist } = useQuery({
    queryKey: ["dashboard-kpi-checklist", filtro, weeksToShow],
    queryFn: () =>
      checklistService
        .kpiMensal({ ...filtro, weeksToShow })
        .then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const loading = l1 || l2 || l3;
  const hasMeta = Boolean(
    resumo?.meta && !resumo.meta.semMeta && Number(resumo.meta.valorMeta) > 0,
  );
  const avgGastos =
    historico && historico.length > 0
      ? historico.reduce((acc, h) => acc + (Number(h.valor) || 0), 0) /
        historico.length
      : 0;

  if (loading) {
    return (
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}
      >
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="skeleton"
            style={{ height: "110px", borderRadius: "12px" }}
          />
        ))}
      </div>
    );
  }

  const variacao = parseFloat(resumo?.financeiro?.variacaoPercent || 0);

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      {/* Cabeçalho + Filtros integrados */}
      <div className="card" style={{ padding: "16px 18px" }}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Texto do lado esquerdo */}
          <div>
            <h2
              style={{
                fontSize: "1.125rem",
                fontWeight: 700,
                color: "var(--color-text-primary)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              Dashboard Operacional
            </h2>
            <p
              style={{
                fontSize: "0.8125rem",
                color: "var(--color-text-muted)",
                marginTop: "4px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <MapPin size={13} /> {usuario?.unidade} {usuario?.regiao}
            </p>
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--color-text-muted)",
                marginTop: "6px",
              }}
            >
              Exibindo:{" "}
              <strong style={{ color: "var(--color-brand-400)" }}>
                {new Date(filtro.ano, filtro.mes - 1, 1).toLocaleString(
                  "pt-BR",
                  { month: "long", year: "numeric" },
                )}
              </strong>
              {filtro.mes !== new Date().getMonth() + 1 ||
              filtro.ano !== new Date().getFullYear() ? (
                <span
                  style={{
                    marginLeft: "6px",
                    color: "var(--color-warning)",
                    fontSize: "0.68rem",
                  }}
                >
                  ⚠ Histórico 6 meses não é afetado
                </span>
              ) : null}
            </p>
          </div>

          {/* Filtros no lado direito */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filtro Mês */}
            <select
              id="dashboard-filtro-mes"
              className="select"
              style={{ minWidth: "185px" }}
              value={`${filtro.ano}-${String(filtro.mes).padStart(2, "0")}`}
              onChange={(e) => {
                const opt = OPCOES_MES.find((o) => o.value === e.target.value);
                if (opt)
                  setFiltro((prev) => ({
                    ...prev,
                    mes: opt.mes,
                    ano: opt.ano,
                  }));
              }}
            >
              {OPCOES_MES.map((opt) => {
                const hoje = new Date();
                const isAtual =
                  opt.mes === hoje.getMonth() + 1 &&
                  opt.ano === hoje.getFullYear();
                return (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                    {isAtual ? " (atual)" : ""}
                  </option>
                );
              })}
            </select>

            {/* Filtro Regional — só para Coordenador */}
            {isCoordenador && (
              <>
                <span
                  style={{
                    color: "var(--color-border)",
                    fontSize: "1.2rem",
                    lineHeight: 1,
                  }}
                >
                  |
                </span>
                <select
                  id="dashboard-filtro-regional"
                  className="select"
                  style={{ minWidth: "185px" }}
                  value={filtro.regiao || ""}
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
                    onClick={() =>
                      setFiltro((prev) => ({ ...prev, regiao: "" }))
                    }
                    style={{
                      fontSize: "0.75rem",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    Limpar
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="flex flex-wrap gap-4 items-stretch">
        <div style={{ flex: "1 1 240px" }}>
          <StatCard
            label="Tarefas Pendentes"
            value={resumo?.tarefas?.pendentes ?? "—"}
            sub={`${resumo?.tarefas?.emAndamento ?? 0} em andamento`}
            icon={ClipboardList}
            accent="var(--color-brand-500)"
          />
        </div>
        <div style={{ flex: "1 1 240px" }}>
          <StatCard
            label="Gastos Gerais"
            value={fmt(resumo?.financeiro?.gastosMes)}
            sub={`${Math.abs(variacao)}% em relação ao mês anterior`}
            icon={DollarSign}
            accent="var(--color-success)"
            trend={variacao}
          />
        </div>
        <div style={{ flex: "1 1 240px" }}>
          <StatCard
            label="Meta Orçamentária"
            value={
              resumo?.meta?.semMeta ? "Sem Meta" : fmt(resumo?.meta?.valorMeta)
            }
            sub={
              resumo?.meta?.semMeta
                ? "Nenhuma meta definida"
                : `Gasto: ${resumo?.meta?.percentualExecucao}% da meta`
            }
            icon={Target}
            accent={
              resumo?.meta?.semMeta
                ? "var(--color-text-muted)"
                : resumo?.meta?.statusMeta === "VERDE"
                  ? "var(--color-success)"
                  : resumo?.meta?.statusMeta === "AMARELO"
                    ? "var(--color-warning)"
                    : "var(--color-danger)"
            }
          />
        </div>
        <div style={{ flex: "1 1 240px" }}>
          <StatCard
            label="Chamados / Mau Uso"
            value={resumo?.financeiro?.chamadosMes ?? "—"}
            sub={
              <>
                <span
                  style={{
                    color:
                      (resumo?.financeiro?.mauUso ?? 0) > 0
                        ? "var(--color-danger)"
                        : "inherit",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                  }}
                >
                  {resumo?.financeiro?.mauUso ?? 0}
                </span>{" "}
                registros de mau uso
              </>
            }
            icon={AlertTriangle}
            accent="var(--color-warning)"
          />
        </div>
        {resumo?.investimento?.pci?.valor > 0 && (
          <div style={{ flex: "1 1 240px" }}>
            <StatCard
              label="Investimento - PCI"
              value={fmt(resumo.investimento.pci.valor)}
              sub={`${resumo.investimento.pci.quantidade} chamado(s)`}
              icon={TrendingUp}
              accent="#8b5cf6"
            />
          </div>
        )}
        {resumo?.investimento?.laudos?.valor > 0 && (
          <div style={{ flex: "1 1 240px" }}>
            <StatCard
              label="Investimento - Laudos"
              value={fmt(resumo.investimento.laudos.valor)}
              sub={`${resumo.investimento.laudos.quantidade} chamado(s)`}
              icon={TrendingUp}
              accent="#a78bfa"
            />
          </div>
        )}
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Histórico mensal */}
        <div className="card h-full flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp
                size={18}
                style={{ color: "var(--color-brand-500)" }}
              />
              <h3
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  color: "var(--color-text-primary)",
                }}
              >
                Evolução de Gastos (6 meses)
              </h3>
            </div>
            {avgGastos > 0 && (
              <div className="text-right">
                <p
                  style={{
                    fontSize: "0.6rem",
                    color: "var(--color-text-muted)",
                    textTransform: "uppercase",
                    fontWeight: 600,
                  }}
                >
                  Média Mensal
                </p>
                <p
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    color: "var(--color-brand-400)",
                  }}
                >
                  {fmt(avgGastos)}
                </p>
              </div>
            )}
          </div>

          <div style={{ flex: 1, minHeight: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={historico}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                onClick={(state) => {
                  if (state && state.activePayload) {
                    if (
                      !state.activePayload ||
                      state.activePayload.length === 0
                    )
                      return;
                    const d = state.activePayload[0].payload;
                    navigate(`/chamados?mes=${d.mesNum}&ano=${d.anoNum}`);
                  }
                }}
                style={{ cursor: "pointer" }}
              >
                <defs>
                  <linearGradient
                    id="colorGastoDash"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="var(--color-brand-500)"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-brand-500)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--color-border)"
                />
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
                <ReferenceLine
                  y={avgGastos}
                  stroke="var(--color-warning)"
                  strokeDasharray="5 5"
                  label={{
                    position: "insideBottomLeft",
                    value: "Média",
                    fill: "var(--color-warning)",
                    fontSize: 10,
                  }}
                />
                {hasMeta && (
                  <ReferenceLine
                    y={resumo.meta.valorMeta}
                    stroke="var(--color-danger)"
                    strokeDasharray="5 5"
                    label={{
                      position: "insideTop",
                      value: `Meta: R$${(resumo.meta.valorMeta / 1000).toFixed(0)}k`,
                      fill: "var(--color-danger)",
                      fontSize: 10,
                    }}
                  />
                )}
                <Area
                  type="monotone"
                  dataKey="valor"
                  name="OPEX Manutenção"
                  stroke="var(--color-brand-500)"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorGastoDash)"
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex items-center justify-center gap-4 border-t border-border pt-4">
            <div className="flex items-center gap-2">
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "var(--color-brand-500)",
                }}
              />
              <span
                style={{
                  fontSize: "0.7rem",
                  color: "var(--color-text-secondary)",
                }}
              >
                OPEX Manutenção
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                style={{
                  width: 10,
                  height: 1,
                  borderTop: "1px dashed var(--color-warning)",
                }}
              />
              <span
                style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}
              >
                Média
              </span>
            </div>
            {hasMeta && (
              <div className="flex items-center gap-2">
                <div
                  style={{
                    width: 10,
                    height: 1,
                    borderTop: "1px dashed var(--color-danger)",
                  }}
                />
                <span
                  style={{
                    fontSize: "0.7rem",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  Meta Orçamentária
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h3
            style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "var(--color-text-primary)",
              marginBottom: "16px",
            }}
          >
            Gastos por Segmento
          </h3>
          {!porSegmento || porSegmento.length === 0 ? (
            <div
              className="flex items-center justify-center h-48"
              style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}
            >
              Sem dados para o período
            </div>
          ) : (
            <div className="grid gap-4 items-start grid-cols-1 lg:grid-cols-2">
              <div style={{ minWidth: 0, height: "clamp(240px, 42vw, 320px)" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={porSegmento}
                      dataKey="total"
                      nameKey="segmento"
                      cx="50%"
                      cy="50%"
                      outerRadius="72%"
                      innerRadius="44%"
                    >
                      {porSegmento.map((_, i) => (
                        <Cell
                          key={i}
                          fill={CORES_SEGMENTO[i % CORES_SEGMENTO.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<TooltipCustom />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div
                className="flex flex-col gap-2"
                style={{
                  maxHeight: "clamp(220px, 36vw, 320px)",
                  overflowY: "auto",
                  paddingRight: "4px",
                }}
              >
                {porSegmento.map((item, i) => (
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
                    <div
                      className="flex items-center gap-2"
                      style={{ minWidth: 0 }}
                    >
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
                    <strong
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--color-text-primary)",
                        flexShrink: 0,
                      }}
                    >
                      {fmt(item.total)}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Card: KPI Checklists do Mês */}
      <div className="card">
        <h3
          style={{
            fontSize: "0.875rem",
            fontWeight: 600,
            color: "var(--color-text-primary)",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <ClipboardCheck
              size={16}
              style={{ color: "var(--color-brand-400)" }}
            />
            {usuario?.role === "COORDENADOR"
              ? "Atividade Mensal (Consolidado Regional)"
              : "Meus Checklists"}{" "}
            —{" "}
            {new Date().toLocaleString("pt-BR", {
              month: "long",
              year: "numeric",
            })}
          </div>
          <select
            className="select"
            style={{ width: "auto", minWidth: "160px" }}
            value={weeksToShow}
            onChange={(e) => setWeeksToShow(parseInt(e.target.value))}
          >
            <option value={1}>Última semana</option>
            <option value={2}>2 últimas semanas</option>
            <option value={3}>3 últimas semanas</option>
            <option value={4}>Mês inteiro</option>
          </select>
        </h3>
        {!kpiChecklist ? (
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
            Sem dados de checklist para este mês.
          </p>
        ) : (
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            }}
          >
            {/* Equipamentos */}
            <div
              style={{
                padding: "16px",
                borderRadius: "10px",
                background:
                  kpiChecklist.equipamentos.totalParados > 0
                    ? "rgba(239,68,68,0.07)"
                    : "rgba(16,185,129,0.07)",
                border: `1px solid ${kpiChecklist.equipamentos.totalParados > 0 ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.2)"}`,
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <ClipboardCheck
                  size={15}
                  style={{
                    color:
                      kpiChecklist.equipamentos.totalParados > 0
                        ? "var(--color-danger)"
                        : "var(--color-success)",
                  }}
                />
                <span
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    color: "var(--color-text-secondary)",
                  }}
                >
                  Equipamentos Parados
                </span>
              </div>
              <p
                style={{
                  fontSize: "2rem",
                  fontWeight: 700,
                  color:
                    kpiChecklist.equipamentos.totalParados > 0
                      ? "var(--color-danger)"
                      : "var(--color-success)",
                  lineHeight: 1,
                }}
              >
                {kpiChecklist.equipamentos.totalParados}
              </p>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "var(--color-text-muted)",
                  marginTop: "6px",
                }}
              >
                {kpiChecklist.equipamentos.semanasPrenchidas}/
                {kpiChecklist.equipamentos.totalSemanasNoMes} semanas
                preenchidas
              </p>
              {Object.entries(kpiChecklist.equipamentos.porTipo || {})
                .slice(0, 3)
                .map(([tipo, qtd]) => (
                  <div
                    key={tipo}
                    className="flex justify-between items-center mt-2"
                  >
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      {tipo.replace(/_/g, " ")}
                    </span>
                    <span
                      className="badge badge-danger"
                      style={{ fontSize: "0.7rem", padding: "1px 6px" }}
                    >
                      {qtd} parado(s)
                    </span>
                  </div>
                ))}
            </div>

            {/* Carrinhos */}
            <div
              style={{
                padding: "16px",
                borderRadius: "10px",
                background:
                  kpiChecklist.carrinhos.totalQuebrados > 0
                    ? "rgba(245,158,11,0.07)"
                    : "rgba(16,185,129,0.07)",
                border: `1px solid ${kpiChecklist.carrinhos.totalQuebrados > 0 ? "rgba(245,158,11,0.25)" : "rgba(16,185,129,0.2)"}`,
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <ShoppingCart
                  size={15}
                  style={{
                    color:
                      kpiChecklist.carrinhos.totalQuebrados > 0
                        ? "var(--color-warning)"
                        : "var(--color-success)",
                  }}
                />
                <span
                  style={{
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    color: "var(--color-text-secondary)",
                  }}
                >
                  Carrinhos Quebrados
                </span>
              </div>
              <p
                style={{
                  fontSize: "2rem",
                  fontWeight: 700,
                  color:
                    kpiChecklist.carrinhos.totalQuebrados > 0
                      ? "var(--color-warning)"
                      : "var(--color-success)",
                  lineHeight: 1,
                }}
              >
                {kpiChecklist.carrinhos.totalQuebrados}
              </p>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "var(--color-text-muted)",
                  marginTop: "6px",
                }}
              >
                de {kpiChecklist.carrinhos.totalGeral} cadastrados • Taxa:{" "}
                {kpiChecklist.carrinhos.taxaQuebra}%
              </p>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "var(--color-text-muted)",
                  marginTop: "4px",
                }}
              >
                {kpiChecklist.carrinhos.semanasPrenchidas}/
                {kpiChecklist.carrinhos.totalSemanasNoMes} semanas preenchidas
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
