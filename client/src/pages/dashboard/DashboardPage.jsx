import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  ReferenceLine,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  ComposedChart,
  Line,
} from "recharts";
import {
  dashboardService,
  tarefasService,
  checklistService,
  usuariosService,
} from "../../services";
import { useAuth } from "../../contexts/AuthContext";
import {
  ClipboardList,
  DollarSign,
  AlertTriangle,
  Package,
  TrendingUp,
  TrendingDown,
  Minus,
  ClipboardCheck,
  ShoppingCart,
  MapPin,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  BarChart3,
  Users,
  UserRound,
  Trophy,
  CircleHelp,
  Eye,
  X,
  Calendar,
} from "lucide-react";

// ─── Utilitário: gera lista de meses disponíveis (últimos 24 meses) ────────────
function gerarOpcoesMes() {
  const hoje = new Date();
  const opcoes = [];
  for (let i = 0; i < 24; i++) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    opcoes.push({
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleString("pt-BR", { month: "long", year: "numeric" }),
      mes: d.getMonth() + 1,
      ano: d.getFullYear(),
    });
  }
  return opcoes;
}
const OPCOES_MES = gerarOpcoesMes();

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

const fmtMonthYear = (mes, ano) =>
  new Date(ano, (mes || 1) - 1, 1).toLocaleString("pt-BR", {
    month: "long",
    year: "numeric",
  });

function StatCard({ label, value, sub, icon: Icon, accent, trend }) {
  const trendIcon =
    trend > 0 ? (
      <TrendingUp size={13} style={{ color: "var(--color-danger)" }} />
    ) : trend < 0 ? (
      <TrendingDown size={13} style={{ color: "var(--color-success)" }} />
    ) : (
      <Minus size={13} style={{ color: "var(--color-text-muted)" }} />
    );

  return (
    <div className="stat-card" style={{ "--stat-accent": accent }}>
      <div className="flex items-start justify-between">
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
            {label}
          </p>
          <p
            style={{
              fontSize: "1.625rem",
              fontWeight: 700,
              color: "var(--color-text-primary)",
              marginTop: "6px",
              lineHeight: 1,
            }}
          >
            {value}
          </p>
          {sub && (
            <div className="flex items-center gap-1 mt-2">
              {trend !== undefined && trendIcon}
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "var(--color-text-muted)",
                }}
              >
                {sub}
              </p>
            </div>
          )}
        </div>
        <div
          className="flex items-center justify-center w-10 h-10 rounded-xl"
          style={{
            background: accent
              ? "rgba(14, 165, 233, 0.1)"
              : "var(--color-surface-600)",
            color: accent || "var(--color-brand-500)",
          }}
        >
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

const TooltipCustom = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--color-surface-700)",
        border: "1px solid var(--color-border)",
        borderRadius: "8px",
        padding: "10px 14px",
        fontSize: "0.8125rem",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
      }}
    >
      <p
        style={{
          color: "var(--color-text-secondary)",
          marginBottom: "4px",
          fontWeight: 700,
        }}
      >
        {label}
      </p>
      {payload.map((p, i) => {
        const isCurrency =
          p.name?.toLowerCase().includes("custo") ||
          p.name?.toLowerCase().includes("valor") ||
          p.name?.includes("R$") ||
          p.dataKey === "valor" ||
          p.dataKey === "total";
        const isPercent =
          p.name?.toLowerCase().includes("%") ||
          p.name?.toLowerCase().includes("acumulada") ||
          p.dataKey === "acumulado";

        return (
          <p
            key={i}
            style={{
              color: p.color,
              fontWeight: 600,
              display: "flex",
              justifyContent: "space-between",
              gap: "16px",
            }}
          >
            <span>{p.name}:</span>
            <span>
              {isCurrency
                ? fmt(p.value)
                : isPercent
                  ? `${Number(p.value).toFixed(1)}%`
                  : p.value}
            </span>
          </p>
        );
      })}
    </div>
  );
};

function RegionalDrilldown({
  detalhe,
  loading,
  onClose,
  onOpenRegional,
  onOpenLoja,
}) {
  if (!detalhe && !loading) return null;

  const lojas = detalhe?.lojas || [];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.55)",
        backdropFilter: "blur(3px)",
        zIndex: 50,
        padding: "24px",
        display: "flex",
        justifyContent: "flex-end",
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: "min(560px, 100%)",
          maxHeight: "100%",
          overflowY: "auto",
          padding: "20px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--color-text-muted)",
                textTransform: "uppercase",
                fontWeight: 600,
                letterSpacing: "0.05em",
              }}
            >
              Drill-down regional
            </p>
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "var(--color-text-primary)",
                marginTop: "4px",
              }}
            >
              {detalhe?.regiao || "Carregando..."}
            </h3>
            <p
              style={{
                fontSize: "0.8125rem",
                color: "var(--color-text-muted)",
                marginTop: "6px",
              }}
            >
              {detalhe?.periodo
                ? fmtMonthYear(detalhe.periodo.mes, detalhe.periodo.ano)
                : "Carregando período..."}
            </p>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            style={{
              fontSize: "0.75rem",
              gap: "4px",
              border: "1px solid var(--color-border)",
              background: "var(--color-surface-700)",
            }}
          >
            <X size={14} />
            Fechar
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[...Array(4)].map((_, index) => (
              <div
                key={index}
                className="skeleton"
                style={{ height: "74px", borderRadius: "12px" }}
              />
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
              <div
                style={{
                  padding: "14px",
                  borderRadius: "12px",
                  background: "var(--color-surface-700)",
                }}
              >
                <p
                  style={{
                    fontSize: "0.7rem",
                    color: "var(--color-text-muted)",
                  }}
                >
                  Gasto regional
                </p>
                <p
                  style={{
                    fontSize: "0.95rem",
                    fontWeight: 800,
                    color: "var(--color-success)",
                    marginTop: "4px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  title={fmt(detalhe?.financeiro?.totalGasto)}
                >
                  {fmt(detalhe?.financeiro?.totalGasto)}
                </p>
              </div>
              <div
                style={{
                  padding: "14px",
                  borderRadius: "12px",
                  background: "var(--color-surface-700)",
                }}
              >
                <p
                  style={{
                    fontSize: "0.7rem",
                    color: "var(--color-text-muted)",
                  }}
                >
                  Chamados
                </p>
                <p
                  style={{
                    fontSize: "1rem",
                    fontWeight: 700,
                    color: "var(--color-text-primary)",
                    marginTop: "4px",
                  }}
                >
                  {detalhe?.financeiro?.totalChamados ?? 0}
                </p>
              </div>
              <div
                style={{
                  padding: "14px",
                  borderRadius: "12px",
                  background: "var(--color-surface-700)",
                }}
              >
                <p
                  style={{
                    fontSize: "0.7rem",
                    color: "var(--color-text-muted)",
                  }}
                >
                  Mau uso
                </p>
                <p
                  style={{
                    fontSize: "1rem",
                    fontWeight: 700,
                    color: "var(--color-warning)",
                    marginTop: "4px",
                  }}
                >
                  {detalhe?.financeiro?.mauUso?.quantidade ?? 0}
                </p>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap mt-4">
              <button
                className="btn btn-primary btn-sm"
                onClick={() => onOpenRegional(detalhe.regiao)}
              >
                Abrir chamados da regional
              </button>
            </div>

            <div className="mt-5">
              <h4
                style={{
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  color: "var(--color-text-primary)",
                }}
              >
                Lojas da regional
              </h4>
              <p
                style={{
                  fontSize: "0.78rem",
                  color: "var(--color-text-muted)",
                  marginTop: "4px",
                }}
              >
                Visão por unidade para aprofundar a análise da regional.
              </p>
              <div className="flex flex-col gap-3 mt-3">
                {lojas.length === 0 ? (
                  <div
                    style={{
                      padding: "16px",
                      borderRadius: "12px",
                      border: "1px solid var(--color-border)",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    Nenhuma loja encontrada para essa regional.
                  </div>
                ) : (
                  lojas.map((loja) => (
                    <div
                      key={loja.id}
                      style={{
                        padding: "14px",
                        borderRadius: "12px",
                        border: "1px solid var(--color-border)",
                        background: "var(--color-surface-800)",
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p
                            style={{
                              fontSize: "0.95rem",
                              fontWeight: 700,
                              color: "var(--color-text-primary)",
                            }}
                          >
                            Loja {loja.numero} • {loja.nome}
                          </p>
                          <p
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--color-text-muted)",
                              marginTop: "4px",
                            }}
                          >
                            Gestores ativos: {loja.gestoresAtivos} • Mau uso:{" "}
                            {loja.mauUso}
                          </p>
                        </div>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => onOpenLoja(loja.nome)}
                          style={{
                            gap: "6px",
                            border: "1px solid var(--color-border)",
                            background: "var(--color-surface-700)",
                          }}
                        >
                          <Eye size={14} />
                          Ver chamados
                        </button>
                      </div>

                      <div className="grid gap-3 mt-3 grid-cols-1 sm:grid-cols-2">
                        <div>
                          <p
                            style={{
                              fontSize: "0.68rem",
                              color: "var(--color-text-muted)",
                              textTransform: "uppercase",
                            }}
                          >
                            Gasto
                          </p>
                          <p
                            style={{
                              fontSize: "0.95rem",
                              fontWeight: 700,
                              color: "var(--color-success)",
                              marginTop: "4px",
                            }}
                          >
                            {fmt(loja.totalGasto)}
                          </p>
                        </div>
                        <div>
                          <p
                            style={{
                              fontSize: "0.68rem",
                              color: "var(--color-text-muted)",
                              textTransform: "uppercase",
                            }}
                          >
                            Chamados
                          </p>
                          <p
                            style={{
                              fontSize: "0.95rem",
                              fontWeight: 700,
                              color: "var(--color-text-primary)",
                              marginTop: "4px",
                            }}
                          >
                            {loja.totalChamados}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="grid gap-4 mt-5 grid-cols-1 sm:grid-cols-2">
              <div>
                <h4
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    color: "var(--color-text-primary)",
                    marginBottom: "10px",
                  }}
                >
                  Top segmentos
                </h4>
                <div className="flex flex-col gap-2">
                  {(detalhe?.segmentos || []).slice(0, 5).map((item) => (
                    <div
                      key={item.segmento}
                      className="flex items-center justify-between"
                      style={{
                        padding: "10px 12px",
                        borderRadius: "10px",
                        background: "var(--color-surface-700)",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.78rem",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        {item.segmento}
                      </span>
                      <strong
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--color-text-primary)",
                        }}
                      >
                        {fmt(item.valor)}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    color: "var(--color-text-primary)",
                    marginBottom: "10px",
                  }}
                >
                  Top fornecedores
                </h4>
                <div className="flex flex-col gap-2">
                  {(detalhe?.empresas || []).slice(0, 5).map((item) => (
                    <div
                      key={item.empresa}
                      className="flex items-center justify-between gap-3"
                      style={{
                        padding: "10px 12px",
                        borderRadius: "10px",
                        background: "var(--color-surface-700)",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.78rem",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        {item.empresa}
                      </span>
                      <strong
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--color-text-primary)",
                        }}
                      >
                        {fmt(item.valor)}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function MonthFilterBar({ filtro, setFiltro, showRegional = false, opcoesRegionais = [], compact = false }) {
  const hoje = new Date();
  const mesAtual = hoje.getMonth() + 1;
  const anoAtual = hoje.getFullYear();
  const isCurrentMonth = filtro.mes === mesAtual && filtro.ano === anoAtual;
  const valorSelect = `${filtro.ano}-${String(filtro.mes).padStart(2, "0")}`;

  return (
    <div
      className="card"
      style={{
        padding: compact ? "12px 16px" : "14px 18px",
        marginBottom: compact ? "0" : "4px",
      }}
    >
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2" style={{ color: "var(--color-brand-500)" }}>
          <Calendar size={16} />
          <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Filtros
          </span>
        </div>

        {/* Filtro Mês */}
        <div className="flex items-center gap-2">
          <select
            id="dashboard-filtro-mes"
            className="select"
            style={{ minWidth: "200px" }}
            value={valorSelect}
            onChange={(e) => {
              const opt = OPCOES_MES.find((o) => o.value === e.target.value);
              if (opt) setFiltro((prev) => ({ ...prev, mes: opt.mes, ano: opt.ano }));
            }}
          >
            {OPCOES_MES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}{opt.value === `${anoAtual}-${String(mesAtual).padStart(2, "00")}` ? " (atual)" : ""}
              </option>
            ))}
          </select>
          {!isCurrentMonth && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setFiltro((prev) => ({ ...prev, mes: mesAtual, ano: anoAtual }))}
              title="Voltar ao mês atual"
              style={{ gap: "4px", fontSize: "0.75rem", border: "1px solid var(--color-border)" }}
            >
              Mês atual
            </button>
          )}
        </div>

        {/* Filtro Regional (opcional) */}
        {showRegional && (
          <div className="flex items-center gap-2" style={{ marginLeft: "8px" }}>
            <select
              id="dashboard-filtro-regional"
              className="select"
              style={{ minWidth: "200px" }}
              value={filtro.regiao || ""}
              onChange={(e) => setFiltro((prev) => ({ ...prev, regiao: e.target.value }))}
            >
              <option value="">Todas as regionais</option>
              {opcoesRegionais.map((regiao) => (
                <option key={regiao} value={regiao}>{regiao}</option>
              ))}
            </select>
            {filtro.regiao && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setFiltro((prev) => ({ ...prev, regiao: "" }))}
                style={{ fontSize: "0.75rem", border: "1px solid var(--color-border)" }}
              >
                Limpar
              </button>
            )}
          </div>
        )}

        {/* Badge indicativo */}
        {!isCurrentMonth && (
          <span
            className="badge"
            style={{
              background: "rgba(245,158,11,0.15)",
              color: "var(--color-warning)",
              border: "1px solid rgba(245,158,11,0.3)",
              fontSize: "0.7rem",
              marginLeft: "auto",
            }}
          >
            Histórico de 6 meses não muda com este filtro
          </span>
        )}
      </div>
    </div>
  );
}

function CorporativoDashboard({ filtro, setFiltro }) {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [showExecutiveSummary, setShowExecutiveSummary] = useState(true);
  const [regionalSelecionada, setRegionalSelecionada] = useState(null);
  const [rankingHelpOpen, setRankingHelpOpen] = useState(false);

  // Controle de Drill-down (Gerentes -> Coordenadores -> Regionais)
  const roleInicial = (usuario?.role === "DIRETOR" || usuario?.role === "ADMINISTRADOR")
    ? "gerentes"
    : (usuario?.role === "GERENTE" ? "coordenadores" : "regionais");

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
    queryFn: () => dashboardService.historicoMensal(filtroHistorico).then((r) => r.data),
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
    queryFn: () => checklistService.consolidadoRegional({ mes: filtro.mes, ano: filtro.ano }).then((res) => res.data),
  });

  const checklistStats = useMemo(() => {
    if (!checklistData?.lojas) return { taxaAdesao: 0, lojasComPreenchimento: 0, totalLojas: 0 };
    const lojas = checklistData.lojas;
    const totalLojas = lojas.length;
    const lojasComPreenchimento = lojas.filter(l => Object.keys(l.consolidado || {}).length > 0).length;
    const taxaAdesao = totalLojas > 0 ? Math.round((lojasComPreenchimento / totalLojas) * 100) : 0;
    return { taxaAdesao, lojasComPreenchimento, totalLojas };
  }, [checklistData]);

  // Queries para Hierarquia (Gerentes e Coordenadores)
  const { data: gerentesData, isLoading: lG } = useQuery({
    queryKey: ["users-gerentes"],
    queryFn: () => usuariosService.listar({ role: "GERENTE", limit: 100, ativo: true }).then(r => r.data?.data || []),
    enabled: ["ADMINISTRADOR", "DIRETOR"].includes(usuario?.role),
  });

  const { data: coordenadoresData, isLoading: lC } = useQuery({
    queryKey: ["users-coordenadores"],
    queryFn: () => usuariosService.listar({ role: "COORDENADOR", limit: 100, ativo: true }).then(r => r.data?.data || []),
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
  
  const splitRegions = (r) => (r ? r.split(',').map(s => s.trim().toUpperCase()).filter(Boolean) : []);
  
  // Agrega dados para Gerentes
  const gerentesAgregados = useMemo(() => {
    if (!gerentesData || !regionalRes?.data) return [];
    const regionalData = regionalRes.data;
    // Filtro explícito por role GERENTE
    return gerentesData
      .filter(u => u.role === "GERENTE")
      .map(g => {
      const regioesG = splitRegions(g.regiao);
      const regionaisAtreladas = regionalData.filter(r => regioesG.includes(r.regiao.toUpperCase()));
      return {
        ...g,
        gastosMes: regionaisAtreladas.reduce((sum, r) => sum + (r.gastosMes || 0), 0),
        totalLojas: regionaisAtreladas.reduce((sum, r) => sum + (r.totalLojas || 0), 0),
        numRegionais: regionaisAtreladas.length
      };
    }).sort((a, b) => b.gastosMes - a.gastosMes);
  }, [gerentesData, regionalRes?.data]);

  // Agrega dados para Coordenadores
  const coordenadoresAgregados = useMemo(() => {
    if (!coordenadoresData || !regionalRes?.data) return [];
    const regionalData = regionalRes.data;
    
    // Se houver um gerente selecionado, filtra apenas os coordenadores que têm interseção de regional
    let baseCoords = coordenadoresData.filter(c => c.id !== usuario?.id);
    if (gerenteDrill) {
      const regioesGerente = splitRegions(gerenteDrill.regiao);
      baseCoords = baseCoords.filter(c => {
        const regioesC = splitRegions(c.regiao);
        return regioesC.some(r => regioesGerente.includes(r));
      });
    } else if (usuario?.role === "GERENTE") {
      // Se for gerente logado, filtra seus coordenadores
      const regioesG = splitRegions(usuario.regiao);
      baseCoords = coordenadoresData.filter(c => {
        if (c.id === usuario?.id) return false;
        const regioesC = splitRegions(c.regiao);
        return regioesC.some(r => regioesG.includes(r));
      });
    }

    return baseCoords
      .filter(u => u.role === "COORDENADOR")
      .map(c => {
      const regioesC = splitRegions(c.regiao);
      const regionaisAtreladas = regionalData.filter(r => regioesC.includes(r.regiao.toUpperCase()));
      return {
        ...c,
        gastosMes: regionaisAtreladas.reduce((sum, r) => sum + (r.gastosMes || 0), 0),
        totalLojas: regionaisAtreladas.reduce((sum, r) => sum + (r.totalLojas || 0), 0),
        numRegionais: regionaisAtreladas.length
      };
    }).sort((a, b) => b.gastosMes - a.gastosMes);
  }, [coordenadoresData, regionalRes?.data, gerenteDrill, usuario]);

  const regionalOrdenado = useMemo(() => {
    const data = regionalRes?.data || [];
    return [...data].sort((a, b) => (b.gastosMes || 0) - (a.gastosMes || 0));
  }, [regionalRes?.data]);

  // Filtra regionais para a etapa final
  const regionaisFiltradas = useMemo(() => {
    if (coordenadorDrill) {
      const regioesC = splitRegions(coordenadorDrill.regiao);
      return regionalOrdenado.filter(r => regioesC.includes(r.regiao.toUpperCase()));
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

  const isLoading = l1 || l2 || l3 || l4 || l5 || (dashboardEtapa === "gerentes" && lG) || (dashboardEtapa === "coordenadores" && lC);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          }}
        >
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="skeleton"
              style={{ height: "110px", borderRadius: "12px" }}
            />
          ))}
        </div>
        <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div
            className="skeleton"
            style={{ height: "250px", borderRadius: "12px" }}
          />
          <div
            className="skeleton"
            style={{ height: "250px", borderRadius: "12px" }}
          />
        </div>
      </div>
    );
  }

  const variacaoMacro = parseFloat(
    macroResumo?.financeiro?.variacaoPercent || 0,
  );
  const regionalData = regionalRes?.data || [];
  const opcoesRegionais = regionalOrdenado.map((item) => item.regiao);
  const periodoAtual = fmtMonthYear(
    macroResumo?.periodo?.mes || filtro.mes,
    macroResumo?.periodo?.ano || filtro.ano,
  );
  const escopoAtual = filtro.regiao
    ? `Regional ${filtro.regiao}`
    : "Levantamento geral";

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
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "var(--color-text-secondary)",
                  marginTop: "4px",
                }}
              >
                Filtre regional e/ou mês para detalhar gastos, histórico e
                composição financeira.
              </p>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "var(--color-text-muted)",
                  marginTop: "8px",
                }}
              >
                Exibindo:{" "}
                <strong style={{ color: "var(--color-brand-400)" }}>
                  {periodoAtual}
                </strong>
                {" "}• Escopo: {escopoAtual}
                {filtro.mes !== new Date().getMonth() + 1 || filtro.ano !== new Date().getFullYear() ? (
                  <span
                    style={{
                      marginLeft: "8px",
                      color: "var(--color-warning)",
                      fontSize: "0.7rem",
                    }}
                  >
                    ⚠ Histórico de 6 meses não é afetado por este filtro
                  </span>
                ) : null}
              </p>
            </div>

            {/* Filtros lado a lado */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Filtro Mês */}
              <select
                id="dashboard-filtro-mes"
                className="select"
                style={{ minWidth: "185px" }}
                value={`${filtro.ano}-${String(filtro.mes).padStart(2, "0")}`}
                onChange={(e) => {
                  const opt = OPCOES_MES.find((o) => o.value === e.target.value);
                  if (opt) setFiltro((prev) => ({ ...prev, mes: opt.mes, ano: opt.ano }));
                }}
              >
                {OPCOES_MES.map((opt) => {
                  const hoje = new Date();
                  const isAtual = opt.mes === hoje.getMonth() + 1 && opt.ano === hoje.getFullYear();
                  return (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}{isAtual ? " (atual)" : ""}
                    </option>
                  );
                })}
              </select>

              {/* Divisor */}
              <span style={{ color: "var(--color-border)", fontSize: "1.2rem", lineHeight: 1 }}>|</span>

              {/* Filtro Regional */}
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
            style={{ flex: "1 1 300px", cursor: 'pointer' }}
            onClick={() => navigate('/checklists-consolidado')}
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
                  Histórico de Gastos Global (6 meses)
                </h3>
              </div>
              {historicoMacro.length > 0 && (
                <div className="text-right">
                  <p
                    style={{
                      fontSize: "0.6rem",
                      color: "var(--color-text-muted)",
                      textTransform: "uppercase",
                      fontWeight: 600,
                    }}
                  >
                    Média Rede
                  </p>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 700,
                      color: "var(--color-brand-400)",
                    }}
                  >
                    {fmt(
                      historicoMacro.reduce(
                        (acc, h) => acc + (h.valor || 0),
                        0,
                      ) / historicoMacro.length,
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
                      id="colorGastoMacro"
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
            <h3
              style={{
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--color-text-primary)",
                marginBottom: "16px",
              }}
            >
              Distribuição de Gastos por Segmento (Rede)
            </h3>
            <div className="grid gap-4 items-start grid-cols-1 lg:grid-cols-2">
              <div
                style={{
                  minWidth: 0,
                  height: "clamp(240px, 42vw, 320px)",
                }}
              >
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
                style={{ padding: '8px' }}
              >
                <ChevronUp className="rotate-270" size={18} />
              </button>
            )}
            <div className="flex items-center gap-2">
              {dashboardEtapa === "regionais" ? (
                <MapPin size={20} style={{ color: "var(--color-brand-500)" }} />
              ) : (
                <Users size={20} style={{ color: "var(--color-brand-500)" }} />
              )}
              <h2
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color: "var(--color-text-primary)",
                }}
              >
                {dashboardEtapa === "gerentes" && "Status por Gerente Regional"}
                {dashboardEtapa === "coordenadores" && (gerenteDrill ? `Coordenadores de ${gerenteDrill.nome}` : "Status por Coordenador")}
                {dashboardEtapa === "regionais" && (coordenadorDrill ? `Regionais de ${coordenadorDrill.nome}` : "Status por Regional")}
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
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          }}
        >
          {/* CARDS DE GERENTES */}
          {dashboardEtapa === "gerentes" && gerentesAgregados.map((ger) => (
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
                    style={{
                      background: "var(--color-brand-100)",
                      color: "var(--color-brand-600)",
                    }}
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
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Gastos Gerenciados</span>
                  <span style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--color-brand-500)" }}>{fmt(ger.gastosMes)}</span>
                </div>
                <p style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", marginTop: "4px" }}>
                  Engloba {ger.totalLojas} lojas ativas
                </p>
              </div>
            </div>
          ))}

          {/* CARDS DE COORDENADORES */}
          {dashboardEtapa === "coordenadores" && coordenadoresAgregados.map((coord) => (
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
                    style={{
                      background: "var(--color-surface-600)",
                      color: "var(--color-text-primary)",
                    }}
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
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Gastos Coordenados</span>
                  <span style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--color-text-primary)" }}>{fmt(coord.gastosMes)}</span>
                </div>
              </div>
            </div>
          ))}

          {/* CARDS DE REGIONAIS (ORIGINAL) */}
          {dashboardEtapa === "regionais" && regionaisFiltradas.map((reg) => (
            <div
              key={reg.regiao}
              className="card hover-scale"
              style={{ padding: "20px", cursor: "default" }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center justify-center w-10 h-10 rounded-full"
                    style={{
                      background: "var(--color-brand-100)",
                      color: "var(--color-brand-600)",
                    }}
                  >
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h3
                      style={{
                        fontSize: "1.125rem",
                        fontWeight: 700,
                        color: "var(--color-text-primary)",
                      }}
                    >
                      {reg.regiao}
                    </h3>
                    <p
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--color-text-muted)",
                      }}
                    >
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
                  <p
                    style={{
                      fontSize: "0.625rem",
                      fontWeight: 600,
                      color: "var(--color-text-muted)",
                      textTransform: "uppercase",
                    }}
                  >
                    Gastos Mensais
                  </p>
                  <p
                    style={{
                      fontSize: "1rem",
                      fontWeight: 700,
                      color: "var(--color-success)",
                      marginTop: "4px",
                    }}
                  >
                    {fmt(reg.gastosMes)}
                  </p>
                </div>
                <div
                  className="text-center"
                  style={{ borderLeft: "1px solid var(--color-border)" }}
                >
                  <p
                    style={{
                      fontSize: "0.625rem",
                      fontWeight: 600,
                      color: "var(--color-text-muted)",
                      textTransform: "uppercase",
                    }}
                  >
                    Chamados Abertos
                  </p>
                  <p
                    style={{
                      fontSize: "1rem",
                      fontWeight: 700,
                      color: "var(--color-text-primary)",
                      marginTop: "4px",
                    }}
                  >
                    {reg.chamadosMes}
                  </p>
                </div>
                <div className="text-center">
                  <p
                    style={{
                      fontSize: "0.625rem",
                      fontWeight: 600,
                      color: "var(--color-text-muted)",
                      textTransform: "uppercase",
                    }}
                  >
                    Tarefas ativas
                  </p>
                  <p
                    style={{
                      fontSize: "1rem",
                      fontWeight: 700,
                      color: "var(--color-text-primary)",
                      marginTop: "4px",
                    }}
                  >
                    {reg.tarefasAtivas}
                  </p>
                </div>
                <div
                  className="text-center"
                  style={{ borderLeft: "1px solid var(--color-border)" }}
                >
                  <p
                    style={{
                      fontSize: "0.625rem",
                      fontWeight: 600,
                      color: "var(--color-text-muted)",
                      textTransform: "uppercase",
                    }}
                  >
                    Lojas
                  </p>
                  <p
                    style={{
                      fontSize: "1rem",
                      fontWeight: 700,
                      color: "var(--color-text-primary)",
                      marginTop: "4px",
                    }}
                  >
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

      <section className="flex flex-col gap-5">
        <div className="flex items-center gap-2">
          <Trophy size={20} style={{ color: "var(--color-brand-500)" }} />
          <div>
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "var(--color-text-primary)",
              }}
            >
              Ranking de Coordenadores
            </h2>
            <div
              className="flex items-center gap-2"
              style={{
                fontSize: "0.8125rem",
                color: "var(--color-text-muted)",
              }}
            >
              <p>
                Indicador proxy por disponibilidade, eficiência de custo e
                cobertura de checklist.
              </p>
              <div
                style={{
                  position: "relative",
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  aria-label="Como funciona o score do ranking"
                  title="Como funciona o score do ranking"
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
                  <p
                    style={{
                      fontWeight: 700,
                      color: "var(--color-brand-400)",
                      marginBottom: "4px",
                    }}
                  >
                    Como funciona o Score?
                  </p>
                  O score sobe com mais disponibilidade, menor custo por chamado
                  e melhor cobertura de checklist. Cai com equipamentos parados,
                  carrinhos quebrados, tarefas ativas e registros de mau uso.
                </div>
              </div>
            </div>
          </div>
        </div>

        {ranking.length === 0 ? (
          <div
            className="card"
            style={{
              padding: "24px",
              color: "var(--color-text-muted)",
              textAlign: "center",
            }}
          >
            Nenhum coordenador encontrado para o escopo atual.
          </div>
        ) : (
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            }}
          >
            {ranking.map((item) => (
              <div key={item.id} className="card" style={{ padding: "18px" }}>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="badge badge-brand"
                        style={{
                          fontSize: "0.7rem",
                          minWidth: "30px",
                          justifyContent: "center",
                        }}
                      >
                        #{item.posicao}
                      </span>
                      <h3
                        style={{
                          fontSize: "1rem",
                          fontWeight: 700,
                          color: "var(--color-text-primary)",
                        }}
                      >
                        {item.nome}
                      </h3>
                    </div>
                    <p
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--color-text-muted)",
                        marginTop: "6px",
                      }}
                    >
                      {item.regiao ||
                        item.regioes?.join(" / ") ||
                        "Sem regional"}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p
                      style={{
                        fontSize: "0.7rem",
                        color: "var(--color-text-muted)",
                        textTransform: "uppercase",
                      }}
                    >
                      Score
                    </p>
                    <p
                      style={{
                        fontSize: "1.35rem",
                        fontWeight: 700,
                        color: "var(--color-brand-500)",
                      }}
                    >
                      {item.score}
                    </p>
                  </div>
                </div>

                <div
                  className="grid gap-3"
                  style={{ gridTemplateColumns: "1fr 1fr" }}
                >
                  <div
                    style={{
                      padding: "10px 12px",
                      borderRadius: "10px",
                      background: "var(--color-surface-700)",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "0.7rem",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      Disponibilidade
                    </p>
                    <p
                      style={{
                        fontSize: "1rem",
                        fontWeight: 700,
                        color: "var(--color-success)",
                      }}
                    >
                      {item.disponibilidadeBruta.toFixed(1)}
                    </p>
                  </div>
                  <div
                    style={{
                      padding: "10px 12px",
                      borderRadius: "10px",
                      background: "var(--color-surface-700)",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "0.7rem",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      Custo / chamado
                    </p>
                    <p
                      style={{
                        fontSize: "1rem",
                        fontWeight: 700,
                        color: "var(--color-text-primary)",
                      }}
                    >
                      {fmt(item.custoPorChamado)}
                    </p>
                  </div>
                  <div
                    style={{
                      padding: "10px 12px",
                      borderRadius: "10px",
                      background: "var(--color-surface-700)",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "0.7rem",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      Ativos indisponíveis
                    </p>
                    <p
                      style={{
                        fontSize: "1rem",
                        fontWeight: 700,
                        color: "var(--color-warning)",
                      }}
                    >
                      {item.equipamentosParados + item.carrinhosQuebrados}
                    </p>
                  </div>
                  <div
                    style={{
                      padding: "10px 12px",
                      borderRadius: "10px",
                      background: "var(--color-surface-700)",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "0.7rem",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      Checklist
                    </p>
                    <p
                      style={{
                        fontSize: "1rem",
                        fontWeight: 700,
                        color: "var(--color-text-primary)",
                      }}
                    >
                      {item.semanasCobertas}/{item.totalSemanasNoMes} sem.
                    </p>
                  </div>
                </div>

                <div
                  className="flex items-center justify-between mt-4 pt-3"
                  style={{ borderTop: "1px solid var(--color-border)" }}
                >
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    Chamados: {item.chamadosMes} • Mau uso: {item.mauUsoMes}
                  </span>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "var(--color-success)",
                    }}
                  >
                    {fmt(item.gastosMes)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ─── SEÇÃO 3: RESUMO EXECUTIVO ────────────────────────────────────────── */}
      {showExecutiveSummary && (
        <div
          className="card"
          style={{
            background:
              "linear-gradient(135deg, var(--color-surface-800) 0%, var(--color-surface-900) 100%)",
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

          <div
            className="flex items-start justify-between gap-4"
            style={{ position: "relative", zIndex: 1 }}
          >
            <div className="flex items-start gap-4">
              <div
                className="flex items-center justify-center w-10 h-10 rounded-lg shrink-0"
                style={{
                  background: "var(--color-surface-600)",
                  color: "var(--color-brand-400)",
                }}
              >
                <BarChart3 size={20} />
              </div>
              <div>
                <h3
                  style={{
                    fontSize: "1rem",
                    fontWeight: 700,
                    color: "var(--color-text-primary)",
                    marginBottom: "8px",
                  }}
                >
                  Resumo Executivo
                </h3>
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--color-text-secondary)",
                    lineHeight: "1.6",
                  }}
                >
                  Este painel combina a visão de alto nível (Macro) com o
                  detalhamento tático (Regional). Os indicadores refletem o
                  status em tempo real de todas as unidades conectadas ao
                  sistema de manutenção.
                </p>
              </div>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              style={{ padding: "4px 8px", fontSize: "1rem", lineHeight: 1 }}
              onClick={() => setShowExecutiveSummary(false)}
              aria-label="Fechar resumo executivo"
            >
              x
            </button>
          </div>
        </div>
      )}

      <RegionalDrilldown
        detalhe={detalheRegional}
        loading={l6}
        onClose={() => setRegionalSelecionada(null)}
        onOpenRegional={(regiao) =>
          navigate(
            `/chamados?regiao=${regiao}&mes=${filtro.mes}&ano=${filtro.ano}`,
          )
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

function GestorDashboard({ filtro, setFiltro, opcoesRegionais = [] }) {
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
    queryFn: () => dashboardService.historicoMensal(filtroHistorico).then((r) => r.data),
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
            <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "6px" }}>
              Exibindo:{" "}
              <strong style={{ color: "var(--color-brand-400)" }}>
                {new Date(filtro.ano, filtro.mes - 1, 1).toLocaleString("pt-BR", { month: "long", year: "numeric" })}
              </strong>
              {filtro.mes !== new Date().getMonth() + 1 || filtro.ano !== new Date().getFullYear() ? (
                <span style={{ marginLeft: "6px", color: "var(--color-warning)", fontSize: "0.68rem" }}>
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
                if (opt) setFiltro((prev) => ({ ...prev, mes: opt.mes, ano: opt.ano }));
              }}
            >
              {OPCOES_MES.map((opt) => {
                const hoje = new Date();
                const isAtual = opt.mes === hoje.getMonth() + 1 && opt.ano === hoje.getFullYear();
                return (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}{isAtual ? " (atual)" : ""}
                  </option>
                );
              })}
            </select>

            {/* Filtro Regional — só para Coordenador */}
            {isCoordenador && (
              <>
                <span style={{ color: "var(--color-border)", fontSize: "1.2rem", lineHeight: 1 }}>|</span>
                <select
                  id="dashboard-filtro-regional"
                  className="select"
                  style={{ minWidth: "185px" }}
                  value={filtro.regiao || ""}
                  onChange={(e) => setFiltro((prev) => ({ ...prev, regiao: e.target.value }))}
                >
                  <option value="">Todas as regionais</option>
                  {opcoesRegionais.map((regiao) => (
                    <option key={regiao} value={regiao}>{regiao}</option>
                  ))}
                </select>
                {filtro.regiao && (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setFiltro((prev) => ({ ...prev, regiao: "" }))}
                    style={{ fontSize: "0.75rem", border: "1px solid var(--color-border)" }}
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
            label="Chamados / Mau Uso"
            value={resumo?.financeiro?.chamadosMes ?? "—"}
            sub={`${resumo?.financeiro?.mauUso ?? 0} registros de mau uso`}
            icon={AlertTriangle}
            accent="var(--color-warning)"
          />
        </div>
        {isGestor && (
          <div style={{ flex: "1 1 240px" }}>
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
                  stroke="var(--color-text-muted)"
                  strokeDasharray="5 5"
                  label={{
                    position: "right",
                    value: "Média",
                    fill: "var(--color-text-muted)",
                    fontSize: 10,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="valor"
                  name="Total Gasto"
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
                Investimento
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                style={{
                  width: 10,
                  height: 1,
                  borderTop: "1px dashed var(--color-text-muted)",
                }}
              />
              <span
                style={{
                  fontSize: "0.7rem",
                  color: "var(--color-text-secondary)",
                }}
              >
                Média
              </span>
            </div>
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
              <div
                style={{
                  minWidth: 0,
                  height: "clamp(240px, 42vw, 320px)",
                }}
              >
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

      {/* Lista de Peças em alerta */}
      {isGestor && resumo?.estoque?.pecasBaixoEstoque?.length > 0 && (
        <div className="card mt-2">
          <h3
            style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "var(--color-warning)",
              marginBottom: "12px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <AlertTriangle size={15} /> Peças com estoque crítico
          </h3>
          <div className="flex flex-wrap gap-2">
            {resumo.estoque.pecasBaixoEstoque.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.2)",
                }}
              >
                <span
                  style={{
                    fontSize: "0.8125rem",
                    color: "var(--color-text-primary)",
                  }}
                >
                  {p.nome}
                </span>
                <span
                  className="badge badge-danger"
                  style={{ padding: "1px 6px" }}
                >
                  {p.quantidadeEstoque} un.
                </span>
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
    queryKey: ["dashboard-tecnico-tarefas"],
    queryFn: () => tarefasService.listar({ limit: 50 }).then((r) => r.data),
  });

  const tarefas = tarefasRes?.data || [];
  const pendentes = tarefas.filter((t) => t.status === "PENDENTE");
  const emAndamento = tarefas.filter((t) => t.status === "EM_ANDAMENTO");

  if (isLoading)
    return (
      <div
        className="skeleton"
        style={{ height: "200px", borderRadius: "12px" }}
      />
    );

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <h2
        style={{
          fontSize: "1.25rem",
          fontWeight: 600,
          color: "var(--color-text-primary)",
        }}
      >
        Visão Resumida (Técnico)
      </h2>
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}
      >
        <StatCard
          label="Tarefas Pendentes"
          value={pendentes.length}
          sub={`${emAndamento.length} em andamento`}
          icon={ClipboardList}
          accent="var(--color-brand-500)"
        />
      </div>

      <div className="card mt-2">
        <h3
          style={{
            fontSize: "1rem",
            fontWeight: 600,
            color: "var(--color-text-primary)",
            marginBottom: "16px",
          }}
        >
          Minhas Próximas Tarefas
        </h3>
        {tarefas.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            Nenhuma tarefa atribuída a você no momento.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {tarefas.slice(0, 5).map((t) => (
              <div
                key={t.id}
                style={{
                  padding: "12px",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <p
                    style={{
                      fontWeight: 500,
                      fontSize: "0.875rem",
                      color: "var(--color-text-primary)",
                    }}
                  >
                    {t.descricao}
                  </p>
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    {t.areResponsavel} • Prioridade: {t.prioridade}
                  </p>
                </div>
                <span
                  className={`badge ${t.status === "CONCLUIDA" ? "badge-success" : t.status === "EM_ANDAMENTO" ? "badge-warning" : "badge-neutral"}`}
                >
                  {t.status.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ConformidadeDashboard({ filtro }) {
  const { data: conformidadeRes, isLoading } = useQuery({
    queryKey: ["dashboard-conformidade", filtro.mes, filtro.ano],
    queryFn: () => dashboardService.conformidade({ mes: filtro.mes, ano: filtro.ano }).then(r => r.data),
  });

  const [collapsedRegions, setCollapsedRegions] = useState({});

  const toggleRegion = (reg) => {
    setCollapsedRegions(prev => ({ ...prev, [reg]: !prev[reg] }));
  };

  const items = conformidadeRes || [];

  const grouped = useMemo(() => {
    const groups = {};
    items.forEach(loja => {
      const reg = loja.regiao || "Sem Regional";
      if (!groups[reg]) groups[reg] = [];
      groups[reg].push(loja);
    });
    return groups;
  }, [items]);

  if (isLoading) {
    return (
      <div className="skeleton" style={{ height: "400px", borderRadius: "12px" }} />
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Média de Cobertura de Checklists"
          value={`${items.length > 0 ? Math.round(items.reduce((acc, curr) => acc + curr.checklistCoverage, 0) / items.length) : 100}%`}
          sub="Preenchimento de checklists nas lojas"
          icon={ClipboardCheck}
          accent="var(--color-brand-500)"
        />
        <StatCard
          label="Adesão de Preventivas"
          value={`${items.length > 0 ? Math.round(items.reduce((acc, curr) => acc + curr.preventivaAdherence, 0) / items.length) : 100}%`}
          sub="Ativos com preventiva em dia"
          icon={Calendar}
          accent="var(--color-success)"
        />
        <StatCard
          label="Sistemas Críticos Vencidos"
          value={items.reduce((acc, curr) => acc + (curr.statusBaterias === 'VENCIDO' ? 1 : 0) + (curr.statusCabine === 'VENCIDO' ? 1 : 0), 0)}
          sub="Baterias ou laudos pendentes"
          icon={AlertTriangle}
          accent="var(--color-danger)"
        />
      </div>

      <div className="flex flex-col gap-4">
        <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "4px" }}>
          Matriz de Conformidade por Regional
        </h3>

        {items.length === 0 ? (
          <div className="card" style={{ padding: "24px", textAlign: "center", color: "var(--color-text-muted)" }}>
            Nenhuma loja cadastrada ou com dados no período.
          </div>
        ) : (
          Object.entries(grouped).map(([regiao, lojas]) => {
            const isCollapsed = !!collapsedRegions[regiao];
            const totalAlerts = lojas.reduce((acc, curr) => acc + (curr.checklistCoverage < 100 ? 1 : 0) + (curr.preventivaAdherence < 100 ? 1 : 0) + (curr.statusBaterias === 'VENCIDO' ? 1 : 0) + (curr.statusCabine === 'VENCIDO' ? 1 : 0), 0);

            return (
              <div key={regiao} className="card" style={{ background: "var(--color-surface-800)", padding: "16px", display: "flex", flexDirection: "column", gap: "12px", border: "1px solid var(--color-border)" }}>
                <div 
                  className="flex items-center justify-between pointer" 
                  onClick={() => toggleRegion(regiao)}
                  style={{ userSelect: "none" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(var(--color-brand-rgb), 0.1)", color: "var(--color-brand-400)" }}>
                      <MapPin size={16} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: "0.9375rem", fontWeight: 700, margin: 0, color: "var(--color-text-primary)" }}>
                        Regional {regiao}
                      </h4>
                      <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: 0 }}>
                        {lojas.length} {lojas.length === 1 ? "loja" : "lojas"} sob gestão • {totalAlerts === 0 ? "100% em dia" : `${totalAlerts} pendências de conformidade`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {totalAlerts > 0 && (
                      <span className="badge badge-danger" style={{ fontSize: "0.6875rem", fontWeight: 700 }}>Atenção</span>
                    )}
                    {isCollapsed ? <ChevronDown size={18} style={{ color: "var(--color-text-muted)" }} /> : <ChevronUp size={18} style={{ color: "var(--color-text-muted)" }} />}
                  </div>
                </div>

                {!isCollapsed && (
                  <div style={{ overflowX: "auto", borderTop: "1px solid var(--color-border)", paddingTop: "12px", marginTop: "4px" }}>
                    <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--color-border)", textAlign: "left" }}>
                          <th style={{ padding: "12px 8px", color: "var(--color-text-muted)", fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 600 }}>Unidade</th>
                          <th style={{ padding: "12px 8px", color: "var(--color-text-muted)", fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 600 }}>Cobertura Checklists</th>
                          <th style={{ padding: "12px 8px", color: "var(--color-text-muted)", fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 600 }}>Adesão Preventivas</th>
                          <th style={{ padding: "12px 8px", color: "var(--color-text-muted)", fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 600 }}>Status Baterias</th>
                          <th style={{ padding: "12px 8px", color: "var(--color-text-muted)", fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 600 }}>Laudo Cabine Primária</th>
                          <th style={{ padding: "12px 8px", color: "var(--color-text-muted)", fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 600 }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lojas.map((loja, idx) => (
                          <tr key={idx} style={{ borderBottom: "1px solid var(--color-border)", fontSize: "0.875rem" }}>
                            <td style={{ padding: "12px 8px", fontWeight: 600, color: "var(--color-text-primary)" }}>{loja.unidade}</td>
                            <td style={{ padding: "12px 8px" }}>
                              <div className="flex items-center gap-2">
                                <span className={`badge ${loja.checklistCoverage >= 90 ? 'badge-success' : loja.checklistCoverage >= 70 ? 'badge-warning' : 'badge-danger'}`}>
                                  {loja.checklistCoverage}%
                                </span>
                                <div style={{ width: "60px", height: "6px", background: "var(--color-surface-600)", borderRadius: "3px", overflow: "hidden" }}>
                                  <div style={{ width: `${loja.checklistCoverage}%`, height: "100%", background: loja.checklistCoverage >= 90 ? "var(--color-success)" : loja.checklistCoverage >= 70 ? "var(--color-warning)" : "var(--color-danger)" }} />
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: "12px 8px" }}>
                              <div className="flex items-center gap-2">
                                <span className={`badge ${loja.preventivaAdherence >= 90 ? 'badge-success' : loja.preventivaAdherence >= 70 ? 'badge-warning' : 'badge-danger'}`}>
                                  {loja.preventivaAdherence}%
                                </span>
                                <div style={{ width: "60px", height: "6px", background: "var(--color-surface-600)", borderRadius: "3px", overflow: "hidden" }}>
                                  <div style={{ width: `${loja.preventivaAdherence}%`, height: "100%", background: loja.preventivaAdherence >= 90 ? "var(--color-success)" : loja.preventivaAdherence >= 70 ? "var(--color-warning)" : "var(--color-danger)" }} />
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: "12px 8px" }}>
                              <span className={`badge ${loja.statusBaterias === 'OK' ? 'badge-success' : 'badge-danger'}`}>
                                {loja.statusBaterias}
                              </span>
                            </td>
                            <td style={{ padding: "12px 8px" }}>
                              <span className={`badge ${loja.statusCabine === 'OK' ? 'badge-success' : loja.statusCabine === 'VENCIDO' ? 'badge-danger' : 'badge-neutral'}`}>
                                {loja.statusCabine}
                              </span>
                            </td>
                            <td style={{ padding: "12px 8px" }}>
                              <button
                                className="btn btn-ghost btn-sm"
                                disabled={loja.checklistCoverage >= 100 && loja.preventivaAdherence >= 100 && loja.statusBaterias === 'OK' && loja.statusCabine !== 'VENCIDO'}
                                onClick={() => {
                                  toast.success(`Tarefa de conformidade delegada com sucesso para a unidade ${loja.unidade}!`);
                                }}
                                style={{ padding: "4px 8px", fontSize: "0.75rem", border: "1px solid var(--color-border)" }}
                              >
                                Delegar Tarefa
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="card" style={{ borderLeft: "4px solid var(--color-danger)" }}>
        <h4 style={{ fontSize: "0.9375rem", fontWeight: 700, color: "var(--color-danger)", display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
          <AlertTriangle size={18} />
          Alertas Críticos de Infraestrutura
        </h4>
        <div className="flex flex-col gap-2">
          {items.flatMap(l => l.alertas.map(a => ({ loja: l.unidade, msg: a }))).length === 0 ? (
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
              Nenhum alerta crítico ativo no momento. Toda a infraestrutura está em conformidade!
            </p>
          ) : (
            items.flatMap(l => l.alertas.map(a => ({ loja: l.unidade, msg: a }))).map((alerta, idx) => (
              <div key={idx} style={{ background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.1)", borderRadius: "8px", padding: "10px 14px", display: "flex", justifyContext: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontWeight: 700, marginRight: "8px", color: "var(--color-text-primary)" }}>[{alerta.loja}]</span>
                  <span style={{ color: "var(--color-text-secondary)" }}>{alerta.msg}</span>
                </div>
                <span className="badge badge-danger" style={{ textTransform: "uppercase", fontSize: "0.6875rem" }}>Vencido</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function BuyVsMaintainDashboard() {
  const { data: assetsRes, isLoading } = useQuery({
    queryKey: ["dashboard-buy-vs-maintain"],
    queryFn: () => dashboardService.buyVsMaintain().then(r => r.data),
  });

  const [collapsedRegions, setCollapsedRegions] = useState({});

  const toggleRegion = (reg) => {
    setCollapsedRegions(prev => ({ ...prev, [reg]: !prev[reg] }));
  };

  const items = assetsRes || [];

  const grouped = useMemo(() => {
    const groups = {};
    items.forEach(asset => {
      const reg = asset.regiao || "Sem Regional";
      if (!groups[reg]) groups[reg] = [];
      groups[reg].push(asset);
    });
    return groups;
  }, [items]);

  if (isLoading) {
    return (
      <div className="skeleton" style={{ height: "400px", borderRadius: "12px" }} />
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Total de Ativos Analisados"
          value={items.length}
          sub="Monitoramento contínuo"
          icon={Package}
          accent="var(--color-brand-500)"
        />
        <StatCard
          label="Recomendação: Substituir"
          value={items.filter(i => i.recomendacao === 'BUY').length}
          sub="Badge vermelho de criticidade"
          icon={AlertTriangle}
          accent="var(--color-danger)"
        />
        <StatCard
          label="Recomendação: Manter"
          value={items.filter(i => i.recomendacao === 'MAINTAIN').length}
          sub="Saúde operacional estável"
          icon={ClipboardCheck}
          accent="var(--color-success)"
        />
        <StatCard
          label="Custo Total de Reparos"
          value={fmt(items.reduce((acc, curr) => acc + curr.custoAcumulado, 0))}
          sub="Acumulado histórico na rede"
          icon={DollarSign}
          accent="var(--color-warning)"
        />
      </div>

      <div className="flex flex-col gap-6">
        <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--color-text-primary)", marginBottom: "4px" }}>
          Inteligência de Ativos e Decisão Financeira por Regional
        </h3>

        {items.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "40px", color: "var(--color-text-muted)" }}>
            Nenhum ativo cadastrado ou com falhas históricas.
          </div>
        ) : (
          Object.entries(grouped).map(([regiao, assets]) => {
            const isCollapsed = !!collapsedRegions[regiao];
            const buyCount = assets.filter(a => a.recomendacao === 'BUY').length;

            return (
              <div key={regiao} className="flex flex-col gap-4">
                <div 
                  className="flex items-center justify-between pointer" 
                  onClick={() => toggleRegion(regiao)}
                  style={{ userSelect: "none", background: "var(--color-surface-700)", padding: "12px 18px", borderRadius: "12px", border: "1px solid var(--color-border)" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(var(--color-brand-rgb), 0.1)", color: "var(--color-brand-400)" }}>
                      <MapPin size={16} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: "0.9375rem", fontWeight: 700, margin: 0, color: "var(--color-text-primary)" }}>
                        Regional {regiao}
                      </h4>
                      <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: 0 }}>
                        {assets.length} {assets.length === 1 ? "ativo monitorado" : "ativos monitorados"} • {buyCount === 0 ? "Nenhuma recomendação de substituição" : `${buyCount} recomendação(ões) de substituição`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {buyCount > 0 && (
                      <span className="badge badge-danger" style={{ fontSize: "0.6875rem", fontWeight: 700 }}>Substituir</span>
                    )}
                    {isCollapsed ? <ChevronDown size={18} style={{ color: "var(--color-text-muted)" }} /> : <ChevronUp size={18} style={{ color: "var(--color-text-muted)" }} />}
                  </div>
                </div>

                {!isCollapsed && (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-fade-in" style={{ paddingBottom: "12px" }}>
                    {assets.map((ativo, idx) => (
                      <div
                        key={idx}
                        className="card flex flex-col justify-between"
                        style={{
                          borderTop: ativo.recomendacao === 'BUY' ? "4px solid var(--color-danger)" : "4px solid var(--color-success)",
                          gap: "16px",
                          background: "var(--color-surface-800)",
                        }}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="badge badge-neutral" style={{ fontSize: "0.6875rem", textTransform: "uppercase" }}>
                              {ativo.categoria}
                            </span>
                            <span className={`badge ${ativo.recomendacao === 'BUY' ? 'badge-danger' : 'badge-success'}`} style={{ fontWeight: 700 }}>
                              {ativo.recomendacao === 'BUY' ? 'SUBSTITUIR' : 'MANTER'}
                            </span>
                          </div>

                          <h4 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--color-text-primary)" }}>{ativo.nome}</h4>
                          <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "12px" }}>
                            Unidade: <strong style={{ color: "var(--color-text-secondary)" }}>{ativo.unidade}</strong> • Patr.: {ativo.patrimonio || "N/A"}
                          </p>

                          <hr style={{ border: 0, borderTop: "1px solid var(--color-border)", margin: "12px 0" }} />

                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 600 }}>MTBF</p>
                              <p style={{ fontWeight: 700, color: "var(--color-text-primary)" }}>
                                {ativo.mtbfDias} dias
                              </p>
                            </div>
                            <div>
                              <p style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 600 }}>MTTR</p>
                              <p style={{ fontWeight: 700, color: "var(--color-text-primary)" }}>
                                {ativo.mttrHoras} horas
                              </p>
                            </div>
                            <div>
                              <p style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Custo Reparo</p>
                              <p style={{ fontWeight: 700, color: "var(--color-warning)" }}>
                                {fmt(ativo.custoAcumulado)}
                              </p>
                            </div>
                            <div>
                              <p style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 600 }}>Custo Subst.</p>
                              <p style={{ fontWeight: 700, color: "var(--color-text-secondary)" }}>
                                {fmt(ativo.custoSubstituicao)}
                              </p>
                            </div>
                          </div>

                          {ativo.razoes && ativo.razoes.length > 0 && (
                            <div style={{ marginTop: "14px", padding: "10px", borderRadius: "8px", background: "rgba(239, 68, 68, 0.04)", border: "1px solid rgba(239, 68, 68, 0.08)" }}>
                              <p style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--color-danger)", textTransform: "uppercase", marginBottom: "4px" }}>Justificativa</p>
                              <ul style={{ margin: 0, paddingLeft: "12px", fontSize: "0.75rem", color: "var(--color-text-secondary)", listStyleType: "disc" }}>
                                {ativo.razoes.map((raz, rIdx) => <li key={rIdx}>{raz}</li>)}
                              </ul>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 mt-4 pt-3" style={{ borderTop: "1px solid var(--color-border)" }}>
                          <button
                            className="btn btn-secondary btn-sm flex-1"
                            onClick={() => {
                              const toast = require("react-hot-toast").default;
                              toast.success(`Chamado CSA aberto para ${ativo.nome}!`);
                            }}
                            style={{ fontSize: "0.75rem", padding: "6px" }}
                          >
                            Abrir Chamado
                          </button>
                          <button
                            className="btn btn-primary btn-sm flex-1"
                            disabled={ativo.recomendacao !== 'BUY'}
                            onClick={() => {
                              const toast = require("react-hot-toast").default;
                              toast.success(`Cotação de substituição iniciada para ${ativo.nome}!`);
                            }}
                            style={{ fontSize: "0.75rem", padding: "6px" }}
                          >
                            Cotar Troca
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { usuario } = useAuth();
  const hoje = new Date();
  const [filtro, setFiltro] = useState({
    mes: hoje.getMonth() + 1,
    ano: hoje.getFullYear(),
    regiao: "",
  });
  const [tabAtiva, setTabAtiva] = useState("indicadores");

  const isCoordenador = usuario?.role === "COORDENADOR";
  const { data: regionalResCoordenador } = useQuery({
    queryKey: ["dashboard-regional-coordenador"],
    queryFn: () =>
      dashboardService
        .regional({ mes: hoje.getMonth() + 1, ano: hoje.getFullYear(), regiao: "" })
        .then((r) => r.data),
    enabled: isCoordenador,
    staleTime: 5 * 60 * 1000,
  });
  const opcoesRegionaisCoordenador = (
    (regionalResCoordenador?.data || []).map((r) => r.regiao)
  );

  const macroRoles = ["ADMINISTRADOR", "DIRETOR", "GERENTE"];
  const temTabs = [...macroRoles, "COORDENADOR"].includes(usuario?.role);

  if (usuario?.role === "TECNICO") return <TecnicoDashboard />;

  if (!temTabs) {
    return (
      <GestorDashboard
        filtro={filtro}
        setFiltro={setFiltro}
        opcoesRegionais={opcoesRegionaisCoordenador}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in" style={{ paddingBottom: "24px" }}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--color-border)] pb-4">
        <div>
          <h1 style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
            Painel Executivo de Manutenção
          </h1>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
            Acompanhe a conformidade de infraestrutura, tendências financeiras e análises de ciclo de vida de ativos.
          </p>
        </div>

        <div className="flex items-center bg-[var(--color-surface-700)] p-1 rounded-xl border border-[var(--color-border)]">
          <button
            onClick={() => setTabAtiva("indicadores")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              tabAtiva === "indicadores"
                ? "bg-[var(--color-brand-500)] text-white shadow-md"
                : "text-[var(--color-text-secondary)] hover:text-white"
            }`}
          >
            <BarChart3 size={15} />
            <span>Indicadores</span>
          </button>
          <button
            onClick={() => setTabAtiva("conformidade")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              tabAtiva === "conformidade"
                ? "bg-[var(--color-brand-500)] text-white shadow-md"
                : "text-[var(--color-text-secondary)] hover:text-white"
            }`}
          >
            <ClipboardCheck size={15} />
            <span>Conformidade</span>
          </button>
          <button
            onClick={() => setTabAtiva("buy-vs-maintain")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              tabAtiva === "buy-vs-maintain"
                ? "bg-[var(--color-brand-500)] text-white shadow-md"
                : "text-[var(--color-text-secondary)] hover:text-white"
            }`}
          >
            <AlertTriangle size={15} />
            <span>Comprar vs. Manter</span>
          </button>
        </div>
      </div>

      {tabAtiva === "indicadores" && (
        macroRoles.includes(usuario?.role) ? (
          <CorporativoDashboard filtro={filtro} setFiltro={setFiltro} />
        ) : (
          <GestorDashboard
            filtro={filtro}
            setFiltro={setFiltro}
            opcoesRegionais={opcoesRegionaisCoordenador}
          />
        )
      )}

      {tabAtiva === "conformidade" && (
        <ConformidadeDashboard filtro={filtro} />
      )}

      {tabAtiva === "buy-vs-maintain" && (
        <BuyVsMaintainDashboard />
      )}
    </div>
  );
}
