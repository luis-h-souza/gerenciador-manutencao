import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import toast from "react-hot-toast";
import {
  Plus,
  X,
  Loader2,
  Pencil,
  Trash2,
  Search,
  MapPin,
  ChevronRight,
  BarChart3,
  Building2,
  ArrowLeft,
  Store,
  DollarSign,
  UserRound,
  ChevronUp,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Factory,
  Tag,
  Activity,
  AlertTriangle,
  CircleHelp,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  ComposedChart,
  Line,
  CartesianGrid,
} from "recharts";
import {
  chamadosService,
  dashboardService,
  lojasService,
  usuariosService,
} from "../../services";
import { useAuth } from "../../contexts/AuthContext";

const SEGMENTOS = [
  "ELETRICA",
  "EMPILHADEIRA",
  "REFRIGERACAO",
  "REFRIGERACAO-PÃ‡S",
  "SERRALHERIA",
  "AR-CONDICIONADO",
  "SERVIÃ‡OS GERAIS",
  "CIVIL",
  "EQUIPAMENTOS",
  "GERADOR",
  "ELEVADOR",
  "PCI",
  "DIVERSOS",
  "ALUGUEL",
];
const STATUSES = [
  "CHAMADO_ABERTO",
  "AGUARDANDO_APROVACAO",
  "AGUARDANDO_OM_ENTREGA",
  "FINALIZADO",
  "ALUGUEL_OUTROS",
];
const STATUS_LABEL = {
  CHAMADO_ABERTO: "Aberto",
  AGUARDANDO_APROVACAO: "Ag. AprovaÃ§Ã£o",
  AGUARDANDO_OM_ENTREGA: "Ag. OM/Entrega",
  FINALIZADO: "Finalizado",
  ALUGUEL_OUTROS: "Aluguel/Outros",
};
const STATUS_BADGE = {
  CHAMADO_ABERTO: "badge-info",
  AGUARDANDO_APROVACAO: "badge-warning",
  AGUARDANDO_OM_ENTREGA: "badge-warning",
  FINALIZADO: "badge-success",
  ALUGUEL_OUTROS: "badge-neutral",
};
const fmt = (v) =>
  v
    ? new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(v)
    : "â€”";
const CORES = [
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
      }}
    >
      <p style={{ color: "var(--color-text-secondary)", marginBottom: "4px" }}>
        {label}
      </p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  );
};

function ChamadoModal({ chamado, onClose }) {
  const qc = useQueryClient();
  const isEdit = !!chamado;
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: isEdit
      ? {
        ...chamado,
        dataAbertura: chamado.dataAbertura
          ? format(new Date(chamado.dataAbertura), "yyyy-MM-dd")
          : "",
        valor: chamado.valor || "",
      }
      : {
        dataAbertura: format(new Date(), "yyyy-MM-dd"),
        status: "CHAMADO_ABERTO",
        mauUso: false,
      },
  });

  const mutation = useMutation({
    mutationFn: (data) =>
      isEdit
        ? chamadosService.atualizar(chamado.id, data)
        : chamadosService.criar(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chamados"] });
      qc.invalidateQueries({ queryKey: ["dashboard-resumo"] });
      toast.success(isEdit ? "Chamado atualizado!" : "Chamado criado!");
      onClose();
    },
    onError: (err) =>
      toast.error(err.response?.data?.message || "Erro ao salvar"),
  });

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="modal-content animate-fade-in"
        style={{ maxWidth: "640px" }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>
            {isEdit ? "Editar Chamado" : "Novo Chamado"}
          </h2>
          <button
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            style={{ padding: "4px" }}
          >
            <X size={18} />
          </button>
        </div>
        <form
          onSubmit={handleSubmit((d) => mutation.mutate(d))}
          className="flex flex-col gap-4"
        >
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: "1fr 1fr" }}
          >
            <div>
              <label className="label">Data de Abertura *</label>
              <input
                type="date"
                className="input"
                {...register("dataAbertura", { required: "Obrigatório" })}
              />
              {errors.dataAbertura && (
                <p className="field-error">{errors.dataAbertura.message}</p>
              )}
            </div>
            <div>
              <label className="label">Nº do Chamado (CSA) *</label>
              <input
                className="input"
                placeholder="CSA-00000"
                {...register("numeroChamado", { required: "Obrigatório" })}
              />
            </div>
          </div>

          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: "1fr 1fr" }}
          >
            <div>
              <label className="label">Segmento *</label>
              <select
                className="select"
                {...register("segmento", { required: "Obrigatório" })}
              >
                <option value="">Selecione...</option>
                {SEGMENTOS.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0) + s.slice(1).toLowerCase().replace("_", " ")}
                  </option>
                ))}
              </select>
              {errors.segmento && (
                <p className="field-error">{errors.segmento.message}</p>
              )}
            </div>
            <div>
              <label className="label">Empresa *</label>
              <input
                className="input"
                placeholder="Nome da empresa"
                {...register("empresa", { required: "Obrigatório" })}
              />
            </div>
          </div>

          <div>
            <label className="label">Descrição *</label>
            <textarea
              className="input"
              rows={2}
              style={{ resize: "vertical" }}
              {...register("descricao", { required: "Obrigatório" })}
            />
          </div>

          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: "1fr 1fr 1fr" }}
          >
            <div>
              <label className="label">Nº Orçamento</label>
              <input
                className="input"
                placeholder="ORC-000"
                {...register("numeroOrcamento")}
              />
            </div>
            <div>
              <label className="label">Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                className="input"
                placeholder="0,00"
                {...register("valor")}
              />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="select" {...register("status")}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="mauUso"
              className="w-4 h-4 rounded"
              style={{ accentColor: "var(--color-brand-500)" }}
              {...register("mauUso")}
            />
            <label
              htmlFor="mauUso"
              style={{
                fontSize: "0.875rem",
                color: "var(--color-text-secondary)",
                cursor: "pointer",
              }}
            >
              Mau uso
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : null}
              {isEdit ? "Salvar" : "Criar Chamado"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CorporativoRegiaoDetalhe({ regiao, mes, ano, onBack }) {
  const { data: detalhe, isLoading } = useQuery({
    queryKey: ["dashboard-detalhe-regional", regiao, mes, ano],
    queryFn: () =>
      dashboardService
        .detalheRegional(regiao, { mes: parseInt(mes), ano: parseInt(ano) })
        .then((r) => r.data),
  });

  if (isLoading)
    return (
      <div
        className="skeleton"
        style={{ height: "400px", borderRadius: "12px" }}
      />
    );
  if (!detalhe)
    return (
      <p
        style={{
          padding: "2rem",
          textAlign: "center",
          color: "var(--color-text-muted)",
        }}
      >
        Erro ao carregar dados da regional.
      </p>
    );

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button className="btn btn-ghost btn-sm" onClick={onBack}>
          <ArrowLeft size={18} /> Voltar
        </button>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>
          Análise Consolidada: {regiao}
        </h2>
      </div>

      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}
      >
        <div
          className="card"
          style={{
            padding: "20px",
            borderLeft: "4px solid var(--color-brand-500)",
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-lg"
              style={{
                background: "var(--color-brand-100)",
                color: "var(--color-brand-600)",
              }}
            >
              <DollarSign size={20} />
            </div>
            <h3
              style={{
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--color-text-secondary)",
                textTransform: "uppercase",
              }}
            >
              Total Gasto (Mês)
            </h3>
          </div>
          <div className="flex items-end gap-2">
            <span
              style={{
                fontSize: "1.75rem",
                fontWeight: 800,
                color: "var(--color-text-primary)",
              }}
            >
              {fmt(detalhe.financeiro?.totalGasto)}
            </span>
          </div>
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--color-text-muted)",
              marginTop: "8px",
            }}
          >
            Referente a{" "}
            <strong>{detalhe.financeiro?.totalChamados} chamados</strong>{" "}
            abertos.
          </p>
        </div>

        <div
          className="card"
          style={{
            padding: "20px",
            borderLeft: "4px solid var(--color-danger)",
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-lg"
              style={{
                background: "var(--color-danger-100)",
                color: "var(--color-danger-600)",
              }}
            >
              <AlertTriangle size={20} />
            </div>
            <h3
              style={{
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--color-danger-600)",
                textTransform: "uppercase",
              }}
            >
              Registros de Mau Uso
            </h3>
          </div>
          <div className="flex items-end gap-2">
            <span
              style={{
                fontSize: "1.75rem",
                fontWeight: 800,
                color: "var(--color-danger-700)",
              }}
            >
              {detalhe.financeiro?.mauUso?.quantidade ?? 0}
            </span>
            <span
              style={{
                fontSize: "0.875rem",
                color: "var(--color-danger-600)",
                marginBottom: "6px",
                fontWeight: 600,
              }}
            >
              registros
            </span>
          </div>
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--color-danger-600)",
              marginTop: "8px",
            }}
          >
            Prejuízo estimado:{" "}
            <strong>{fmt(detalhe.financeiro?.mauUso?.valor)}</strong>
          </p>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <div className="card">
          <h3
            className="flex items-center gap-2 mb-4"
            style={{ fontSize: "0.875rem", fontWeight: 600 }}
          >
            <BarChart3 size={16} /> Gastos por Segmento
          </h3>
          <div style={{ height: "300px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={detalhe.segmentos} layout="vertical">
                <XAxis type="number" hide />
                <YAxis
                  dataKey="segmento"
                  type="category"
                  width={100}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip content={<TooltipCustom />} />
                <Bar
                  dataKey="valor"
                  fill="var(--color-brand-500)"
                  radius={[0, 4, 4, 0]}
                  name="Valor"
                />
              </BarChart>
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
            <span className="flex items-center gap-2">
              <Building2 size={16} /> Top 10 Empresas
            </span>
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
                    data={detalhe.empresas}
                    dataKey="valor"
                    nameKey="empresa"
                    cx="50%"
                    cy="50%"
                    outerRadius="72%"
                    innerRadius="44%"
                  >
                    {detalhe.empresas?.map((_, i) => (
                      <Cell key={i} fill={CORES[i % CORES.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(v)} />
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
              {detalhe.empresas?.map((item, i) => (
                <div
                  key={`${item.empresa}-${i}`}
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
                        background: CORES[i % CORES.length],
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
                      title={item.empresa}
                    >
                      {item.empresa}
                    </span>
                  </div>
                  <strong
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--color-text-primary)",
                      flexShrink: 0,
                    }}
                  >
                    {fmt(item.valor)}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PainelExecutivo({ mes, ano }) {
  const [paretoTipo, setParetoTipo] = useState("segmentos"); // 'segmentos' ou 'empresas'
  const [fornecedorHelpOpen, setFornecedorHelpOpen] = useState(false);
  const [paretoHelpOpen, setParetoHelpOpen] = useState(false);

  const { data: res, isLoading } = useQuery({
    queryKey: ["dashboard-executivo", mes, ano],
    queryFn: () =>
      dashboardService
        .executivo({ mes: parseInt(mes), ano: parseInt(ano) })
        .then((r) => r.data),
  });

  if (isLoading)
    return (
      <div className="flex justify-center p-12">
        <Loader2
          className="animate-spin"
          style={{ color: "var(--color-brand-500)" }}
          size={32}
        />
      </div>
    );
  if (!res) return null;

  const {
    comparativo,
    ticketMedio,
    top5Lojas,
    fornecedores,
    paretoSegmentos,
    paretoEmpresas,
  } = res;

  // Usar dados baseado no tipo selecionado
  const paretoData =
    paretoTipo === "segmentos" ? paretoSegmentos : paretoEmpresas;
  const paretoLabel = paretoTipo === "segmentos" ? "segmento" : "empresa";
  const paretoTitle =
    paretoTipo === "segmentos"
      ? "Pareto de Segmentos"
      : "Pareto de Empresas (Fornecedores)";
  const fornecedoresCriticos = fornecedores.filter(
    (item) => Number(item.share || 0) > 40,
  );
  const principalFornecedor = fornecedores[0] || null;
  const maiorShareFornecedor = Number(principalFornecedor?.share || 0);

  return (
    <div className="flex flex-col gap-6 animate-fade-in mb-8">

      {/* Cards KPI */}
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}
      >
        <div
          className="card"
          style={{
            padding: "20px",
            borderLeft: "4px solid var(--color-brand-500)",
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div
              className="p-2 rounded-lg"
              style={{
                background: "var(--color-brand-100)",
                color: "var(--color-brand-600)",
              }}
            >
              <DollarSign size={20} />
            </div>
            <h3
              style={{
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--color-text-secondary)",
              }}
            >
              Total Mês Atual
            </h3>
          </div>
          <div className="flex items-end gap-2">
            <span
              style={{
                fontSize: "1.75rem",
                fontWeight: 800,
                color: "var(--color-text-primary)",
              }}
            >
              {fmt(comparativo.atual)}
            </span>
          </div>
        </div>

        <div
          className={`card`}
          style={{
            padding: "20px",
            borderLeft: `4px solid ${comparativo.variacao > 0 ? "var(--color-danger)" : "var(--color-success)"}`,
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div
              className={`p-2 rounded-lg ${comparativo.variacao > 0 ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}
            >
              {comparativo.variacao > 0 ? (
                <TrendingUp size={20} />
              ) : (
                <TrendingDown size={20} />
              )}
            </div>
            <h3
              style={{
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--color-text-secondary)",
              }}
            >
              Variação (vs. Mês Anterior)
            </h3>
          </div>
          <div className="flex items-end gap-2">
            <span
              style={{
                fontSize: "1.75rem",
                fontWeight: 800,
                color: "var(--color-text-primary)",
              }}
            >
              {comparativo.variacao > 0 ? "+" : ""}
              {comparativo.variacao.toFixed(1)}%
            </span>
            <span
              style={{
                fontSize: "0.75rem",
                color: "var(--color-text-muted)",
                marginBottom: "6px",
              }}
            >
              ({fmt(comparativo.passado)})
            </span>
          </div>
        </div>

        <div
          className="card"
          style={{
            padding: "20px",
            borderLeft: "4px solid var(--color-warning)",
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
              <Activity size={20} />
            </div>
            <h3
              style={{
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--color-text-secondary)",
              }}
            >
              Ticket Médio
            </h3>
          </div>
          <div className="flex items-end gap-2">
            <span
              style={{
                fontSize: "1.75rem",
                fontWeight: 800,
                color: "var(--color-text-primary)",
              }}
            >
              {fmt(ticketMedio)}
            </span>
            <span
              style={{
                fontSize: "0.75rem",
                color: "var(--color-text-muted)",
                marginBottom: "6px",
              }}
            >
              por chamado
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        
        {/* Top 5 Lojas */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Store size={20} style={{ color: "var(--color-danger)" }} />
            <h3
              style={{
                fontSize: "1.125rem",
                fontWeight: 700,
                color: "var(--color-text-primary)",
              }}
            >
              Top 10 Lojas Críticas (Custo)
            </h3>
          </div>
          <div className="flex flex-col  gap-3">
            {top5Lojas.map((loja, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center p-3 rounded-lg"
                style={{ background: "var(--color-surface-600)" }}
              >
                <span
                  style={{
                    fontWeight: 600,
                    color: "var(--color-text-primary)",
                  }}
                >
                  {idx + 1}. {loja.unidade}
                </span>
                <span style={{ fontWeight: 700, color: "var(--color-danger)" }}>
                  {fmt(loja.valor)}
                </span>
              </div>
            ))}
            {top5Lojas.length === 0 && (
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "var(--color-text-muted)",
                }}
              >
                Sem dados reportados.
              </p>
            )}
          </div>
        </div>

        {/* Fornecedores */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Factory size={20} style={{ color: "var(--color-brand-500)" }} />
            <div style={{ flex: 1 }}>
              <div className="flex items-center gap-2">
                <h3
                  style={{
                    fontSize: "1.125rem",
                    fontWeight: 700,
                    color: "var(--color-text-primary)",
                  }}
                >
                  Concentração por Fornecedor
                </h3>
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
                    onMouseEnter={() => setFornecedorHelpOpen(true)}
                    onMouseLeave={() => setFornecedorHelpOpen(false)}
                    style={{
                      padding: 0,
                      minWidth: "20px",
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      color: "var(--color-warning)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CircleHelp size={14} />
                  </button>
                  {fornecedorHelpOpen && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: "calc(100% + 8px)",
                        left: 0,
                        width: "260px",
                        padding: "10px 12px",
                        borderRadius: "10px",
                        background: "var(--color-surface-700)",
                        border: "1px solid var(--color-border)",
                        color: "var(--color-text-secondary)",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
                        lineHeight: 1.4,
                        zIndex: 50,
                        fontSize: '0.75rem'
                      }}
                    >
                      <p style={{ fontWeight: 700, color: 'var(--color-brand-400)', marginBottom: '4px' }}>Concentração de Budget</p>
                      Mostra quanto do budget do mês está concentrado em cada
                      fornecedor. Se algum passar de 40%, o painel sinaliza risco
                      de dependência.
                    </div>
                  )}
                </div>
              </div>
              <p
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--color-text-muted)",
                  marginTop: "4px",
                }}
              >
                Share do budget mensal por empresa de manutenção.
              </p>
            </div>
          </div>
          <div
            className="flex items-center justify-between gap-3 flex-wrap mb-4"
            style={{
              padding: "10px 12px",
              borderRadius: "10px",
              background:
                fornecedoresCriticos.length > 0
                  ? "rgba(239,68,68,0.08)"
                  : "rgba(16,185,129,0.08)",
              border: `1px solid ${fornecedoresCriticos.length > 0
                  ? "rgba(239,68,68,0.22)"
                  : "rgba(16,185,129,0.22)"
                }`,
            }}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle
                size={16}
                style={{
                  color:
                    fornecedoresCriticos.length > 0
                      ? "var(--color-danger)"
                      : "var(--color-success)",
                }}
              />
              <span
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--color-text-secondary)",
                }}
              >
                {fornecedoresCriticos.length > 0
                  ? `Alerta: ${fornecedoresCriticos.length} fornecedor(es) acima de 40% do budget.`
                  : "Distribuição sem concentração crítica acima de 40%."}
              </span>
            </div>
            {principalFornecedor && (
              <span
                className={
                  fornecedoresCriticos.length > 0
                    ? "badge badge-danger"
                    : "badge badge-success"
                }
                style={{ fontSize: "0.75rem" }}
              >
                Top 1: {principalFornecedor.empresa} •{" "}
                {maiorShareFornecedor.toFixed(1)}%
              </span>
            )}
          </div>
          <div className="grid gap-4 items-start lg:grid-cols-2">
            <div
              style={{
                minWidth: 0,
                height: "clamp(260px, 48vw, 420px)",
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={fornecedores}
                    dataKey="valor"
                    nameKey="empresa"
                    cx="50%"
                    cy="50%"
                    outerRadius="72%"
                    innerRadius="44%"
                  >
                    {fornecedores.map((_, i) => (
                      <Cell key={i} fill={CORES[i % CORES.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div
              className="flex flex-col gap-2"
              style={{
                maxHeight: "clamp(220px, 42vw, 420px)",
                overflowY: "auto",
                paddingRight: "4px",
              }}
            >
              {fornecedores.map((item, i) => {
                const isCritico = Number(item.share || 0) > 40;
                return (
                  <div
                    key={`${item.empresa}-${i}`}
                    className="flex items-center justify-between gap-3"
                    style={{
                      padding: "10px 12px",
                      borderRadius: "10px",
                      background: isCritico
                        ? "rgba(239,68,68,0.08)"
                        : "var(--color-surface-700)",
                      border: isCritico
                        ? "1px solid rgba(239,68,68,0.22)"
                        : "1px solid var(--color-border)",
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
                          background: CORES[i % CORES.length],
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
                        title={item.empresa}
                      >
                        {item.empresa}
                      </span>
                    </div>
                    <strong
                      style={{
                        fontSize: "0.8rem",
                        color: isCritico
                          ? "var(--color-danger)"
                          : "var(--color-text-primary)",
                        flexShrink: 0,
                      }}
                    >
                      {Number(item.share || 0).toFixed(1)}%
                    </strong>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Pareto */}
      <div className="card p-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Tag size={20} style={{ color: "var(--color-brand-600)" }} />
            <div className="flex items-center gap-2">
              <h3
                style={{
                  fontSize: "1.125rem",
                  fontWeight: 700,
                  color: "var(--color-text-primary)",
                }}
              >
                {paretoTitle}
              </h3>
                <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onMouseEnter={() => setParetoHelpOpen(true)}
                    onMouseLeave={() => setParetoHelpOpen(false)}
                    style={{
                      padding: 0,
                      minWidth: "auto",
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      color: "var(--color-warning)",
                    }}
                  >
                    <CircleHelp size={14} />
                  </button>
                  {paretoHelpOpen && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "calc(100% + 8px)",
                      left: 0,
                      width: "260px",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      background: "var(--color-surface-700)",
                      border: "1px solid var(--color-border)",
                      color: "var(--color-text-secondary)",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
                      lineHeight: 1.4,
                      zIndex: 50,
                      fontSize: '0.75rem'
                    }}
                  >
                    <p style={{ fontWeight: 700, color: 'var(--color-brand-400)', marginBottom: '4px' }}>Análise de Pareto (ABC)</p>
                    As barras mostram os maiores custos e a linha mostra a
                    porcentagem acumulada. Use para ver quais poucos itens
                    concentram a maior parte do gasto.
                  </div>
                )}
              </div>
            </div>
          </div>
          <select
            value={paretoTipo}
            onChange={(e) => setParetoTipo(e.target.value)}
            className="select"
            style={{ width: 'auto', height: '32px', padding: '0 10px', fontSize: '0.75rem' }}
          >
            <option value="segmentos">Por Segmentos</option>
            <option value="empresas">Por Empresas</option>
          </select>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart
            data={paretoData}
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="var(--color-border)"
            />
            <XAxis
              dataKey={paretoLabel}
              tick={{ fontSize: 12, fill: "var(--color-text-muted)" }}
              angle={-45}
              height={80}
              interval={0}
              textAnchor="end"
            />
            <YAxis
              yAxisId="left"
              tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 12, fill: "var(--color-text-muted)" }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={(v) => `${v}%`}
              tick={{ fontSize: 12, fill: "var(--color-danger)" }}
            />
            <Tooltip
              formatter={(value, name, item) => {
                const isCusto = item?.dataKey === "valor" || name === "Custo";
                return [
                  isCusto ? fmt(value) : `${Number(value).toFixed(1)}%`,
                  isCusto ? "Custo" : "% Acumulada",
                ];
              }}
            />
            <Bar
              yAxisId="left"
              dataKey="valor"
              fill="var(--color-brand-500)"
              radius={[4, 4, 0, 0]}
              name="Custo"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="acumulado"
              stroke="var(--color-danger)"
              strokeWidth={3}
              dot={{
                r: 4,
                fill: "var(--color-danger)",
                stroke: "var(--color-danger)",
              }}
              name="% Acumulada"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function CorporativoRegioes({ onSelect, mes, ano, regioesContexto }) {
  const { data: regionalRes = {}, isLoading } = useQuery({
    queryKey: ["dashboard-regional", mes, ano],
    queryFn: () =>
      dashboardService
        .regional({ mes: parseInt(mes), ano: parseInt(ano) })
        .then((r) => r.data),
  });

  if (isLoading)
    return (
      <div
        className="grid gap-5"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}
      >
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="skeleton"
            style={{ height: "120px", borderRadius: "12px" }}
          />
        ))}
      </div>
    );

  const regionalData = regionalRes?.data || [];
  let regioesOrdenadas = [...regionalData].sort(
    (a, b) => (b.gastosMes || 0) - (a.gastosMes || 0),
  );
  if (regioesContexto) {
    regioesOrdenadas = regioesOrdenadas.filter((r) =>
      regioesContexto.includes(r.regiao.toUpperCase()),
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <h2 style={{ fontSize: "1.25rem", fontWeight: 700 }}>
        Controle por Regional
      </h2>
      <div
        className="grid gap-5"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}
      >
        {regioesOrdenadas.map((reg) => (
          <div
            key={reg.regiao}
            className="card hover-scale pointer"
            style={{ padding: "20px" }}
            onClick={() => onSelect(reg.regiao)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{
                    background: "var(--color-brand-100)",
                    color: "var(--color-brand-600)",
                  }}
                >
                  <MapPin size={20} />
                </div>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 700 }}>
                  {reg.regiao}
                </h3>
              </div>
              <ChevronRight
                size={20}
                style={{ color: "var(--color-text-muted)" }}
              />
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "var(--color-text-muted)",
                }}
              >
                Gasto Mensal:
              </span>
              <span
                style={{
                  fontSize: "0.925rem",
                  fontWeight: 700,
                  color: "var(--color-success)",
                }}
              >
                {fmt(reg.gastosMes)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnaliseLojaHistorico({ regiao, unidade, height = 240 }) {
  const { data: historico, isLoading } = useQuery({
    queryKey: ["historico-mensal-loja", regiao, unidade],
    queryFn: () =>
      dashboardService
        .historicoMensal({ regiao, unidade })
        .then((r) => r.data),
    enabled: !!unidade,
  });

  if (isLoading)
    return (
      <div className="card p-6">
        <div className="skeleton" style={{ height: `${height + 20}px`, borderRadius: "8px" }} />
      </div>
    );
  if (!historico?.length) return null;

  return (
    <div className="card p-6" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp size={18} style={{ color: "var(--color-success)" }} />
        <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text-primary)" }}>
          Evolução Mensal de Gastos
        </h3>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height={height}>
          <ComposedChart data={historico} margin={{ top: 10, right: 20, bottom: 0, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
            <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} />
            <YAxis
              tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 11, fill: "var(--color-text-muted)" }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div style={{ background: "var(--color-surface-700)", border: "1px solid var(--color-border)", borderRadius: "8px", padding: "10px 14px", fontSize: "0.8125rem" }}>
                    <p style={{ color: "var(--color-text-secondary)", marginBottom: "4px", fontWeight: 600 }}>{label}</p>
                    {payload.map((p, i) => (
                      <p key={i} style={{ color: p.color }}>{p.name}: {p.name === "Chamados" ? p.value : fmt(p.value)}</p>
                    ))}
                  </div>
                );
              }}
            />
            <Bar dataKey="valor" name="Gasto" fill="var(--color-brand-500)" radius={[4, 4, 0, 0]} />
            <Line type="monotone" dataKey="quantidade" name="Chamados" stroke="var(--color-warning)" strokeWidth={2} dot={{ r: 3 }} yAxisId={0} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function ChamadosPage() {
  const { usuario } = useAuth();
  const [searchParams] = useSearchParams();
  const mesParam = searchParams.get("mes");
  const anoParam = searchParams.get("ano");
  const regiaoParam = searchParams.get("regiao");
  const unidadeParam = searchParams.get("unidade");
  const viewParam = searchParams.get("view");

  const qc = useQueryClient();
  const [modal, setModal] = useState(null);
  const [busca, setBusca] = useState("");
  const [filtros, setFiltros] = useState({ status: "", segmento: "" });
  const [periodo, setPeriodo] = useState(() => {
    const mesInicial = mesParam
      ? String(mesParam).padStart(2, "0")
      : format(new Date(), "MM");
    const anoInicial = anoParam || format(new Date(), "yyyy");
    return `${anoInicial}-${mesInicial}`;
  });

  const [ano, mes] = periodo.split("-");

  const hasDrilldown = [
    "ADMINISTRADOR",
    "DIRETOR",
    "GERENTE",
    "COORDENADOR",
    "GESTOR",
  ].includes(usuario?.role);
  const getInitialEtapa = (role) => {
    if (!hasDrilldown) return "chamados";
    if (["ADMINISTRADOR", "DIRETOR"].includes(role)) return "gerentes";
    if (role === "GERENTE") return "coordenadores";
    if (role === "COORDENADOR") return "regionais";
    if (role === "GESTOR") return "chamados";
    return "regionais";
  };
  const [etapa, setEtapa] = useState(() => getInitialEtapa(usuario?.role));

  const [gerenteSelecionado, setGerenteSelecionado] = useState(null);
  const [coordenadorSelecionado, setCoordenadorSelecionado] = useState(null);
  const [regionalSelecionada, setRegionalSelecionada] = useState(null);
  const [lojaSelecionada, setLojaSelecionada] = useState(() => {
    if (usuario?.role === "GESTOR" && usuario?.loja) {
      return usuario.loja;
    }
    return null;
  });
  const [visualizandoAnalise, setVisualizandoAnalise] = useState(false);
  const [paretoTipo, setParetoTipo] = useState("segmentos"); // 'segmentos' ou 'empresas'
  const [paretoHelpOpen, setParetoHelpOpen] = useState(false);

  useEffect(() => {
    if (!hasDrilldown) return;

    if (regiaoParam && unidadeParam) {
      setRegionalSelecionada(regiaoParam);
      setLojaSelecionada({ nome: unidadeParam, unidade: unidadeParam });
      setEtapa("chamados");
      return;
    }

    if (regiaoParam) {
      setRegionalSelecionada(regiaoParam);
      setLojaSelecionada(null);
      setEtapa(viewParam === "regional-bi" ? "lojas" : "chamados");
    }
  }, [hasDrilldown, regiaoParam, unidadeParam, viewParam]);

  const splitRegions = (r) =>
    r
      ? r
        .split(",")
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean)
      : [];
  const hasOverlap = (r1, r2) => {
    const arr1 = splitRegions(r1);
    const arr2 = splitRegions(r2);
    return arr1.some((r) => arr2.includes(r));
  };

  const { data: gerentesData, isLoading: loadingGerentes } = useQuery({
    queryKey: ["gerentes-fin"],
    queryFn: () =>
      usuariosService
        .listar({ role: "GERENTE", limit: 100, ativo: true })
        .then((r) => r.data?.data || []),
    enabled:
      ["ADMINISTRADOR", "DIRETOR"].includes(usuario?.role) &&
      etapa === "gerentes",
  });

  const { data: coordenadoresData, isLoading: loadingCoordenadores } = useQuery(
    {
      queryKey: ["coordenadores-fin"],
      queryFn: () =>
        usuariosService
          .listar({ role: "COORDENADOR", limit: 100, ativo: true })
          .then((r) => r.data?.data || []),
      enabled: ["ADMINISTRADOR", "DIRETOR", "GERENTE"].includes(usuario?.role),
    },
  );

  const coordenadoresFiltrados = (() => {
    if (!coordenadoresData) return [];
    if (usuario?.role === "GERENTE")
      return coordenadoresData.filter((c) =>
        hasOverlap(c.regiao, usuario.regiao),
      );
    if (gerenteSelecionado)
      return coordenadoresData.filter((c) =>
        hasOverlap(c.regiao, gerenteSelecionado.regiao),
      );
    return coordenadoresData;
  })();

  const regioesDoContexto = (() => {
    if (coordenadorSelecionado)
      return splitRegions(coordenadorSelecionado.regiao);
    if (usuario?.role === "COORDENADOR") return splitRegions(usuario.regiao);
    return null;
  })();

  // Busca lojas quando estiver na etapa "lojas"
  const { data: lojasRes, isLoading: loadingLojas } = useQuery({
    queryKey: ["lojas", regionalSelecionada],
    queryFn: () => lojasService.listar({ limit: 1000 }).then((r) => r.data), // Ideally we would pass regiao, filtering below
    enabled: etapa === "lojas" && !!regionalSelecionada,
  });

  const lojasDaRegional = (lojasRes?.data || lojasRes || []).filter(
    (l) => l.regiao === regionalSelecionada,
  );

  // Busca chamados da loja selecionada (ou geral se não houver drilldown)
  const { data, isLoading } = useQuery({
    queryKey: [
      "chamados",
      filtros,
      ano,
      mes,
      regionalSelecionada,
      lojaSelecionada?.nome,
    ],
    queryFn: () =>
      chamadosService
        .listar({
          ...filtros,
          ano,
          mes,
          regiao:
            hasDrilldown && lojaSelecionada ? undefined : regionalSelecionada, // Se tem loja, busca direto pela loja
          unidade: lojaSelecionada?.nome,
          limit: 100,
        })
        .then((r) => r.data),
    enabled: etapa === "chamados",
  });

  const remover = useMutation({
    mutationFn: (id) => chamadosService.remover(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chamados"] });
      toast.success("Chamado removido");
    },
    onError: () => toast.error("Erro ao remover"),
  });

  const chamados = (data?.data || []).filter(
    (c) =>
      busca === "" ||
      c.empresa?.toLowerCase().includes(busca.toLowerCase()) ||
      c.numeroChamado?.includes(busca),
  );

  const totalFiltrado = chamados.reduce(
    (s, c) => s + parseFloat(c.valor || 0),
    0,
  );

  // ———————————————————————————————————————————————— Dados para Análise Gráfica da Loja ————————————————————————————————————————
  const chamadosPorSegmento = Object.values(
    chamados.reduce((acc, c) => {
      const seg = c.segmento || "DIVERSOS";
      if (!acc[seg]) acc[seg] = { segmento: seg, valor: 0, count: 0 };
      acc[seg].valor += parseFloat(c.valor || 0);
      acc[seg].count += 1;
      return acc;
    }, {})
  ).sort((a, b) => b.valor - a.valor);

  const chamadosPorEmpresa = Object.values(
    chamados.reduce((acc, c) => {
      const emp = c.empresa || "Sem Empresa";
      if (!acc[emp]) acc[emp] = { empresa: emp, valor: 0 };
      acc[emp].valor += parseFloat(c.valor || 0);
      return acc;
    }, {})
  ).sort((a, b) => b.valor - a.valor).slice(0, 10);

  let acumuladoPareto = 0;
  const chamadosParetoSegmentos = chamadosPorSegmento
    .filter((s) => s.valor > 0)
    .map((s) => {
      acumuladoPareto += s.valor;
      return {
        label: s.segmento,
        valor: s.valor,
        acumulado: totalFiltrado > 0 ? Math.min((acumuladoPareto / totalFiltrado) * 100, 100) : 0,
      };
    });

  let acumuladoParetoEmp = 0;
  const chamadosParetoEmpresas = chamadosPorEmpresa
    .filter((e) => e.valor > 0)
    .map((e) => {
      acumuladoParetoEmp += e.valor;
      return {
        label: e.empresa,
        valor: e.valor,
        acumulado: totalFiltrado > 0 ? Math.min((acumuladoParetoEmp / totalFiltrado) * 100, 100) : 0,
      };
    });

  const paretoData = paretoTipo === "segmentos" ? chamadosParetoSegmentos : chamadosParetoEmpresas;

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-10">
      {/* Cabeçalho de Controle e Seleção de Data */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "var(--color-text-primary)",
            }}
          >
            Controle Financeiro
          </h1>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
            Gerenciamento de gastos e chamados por loja
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="month"
            className="input"
            style={{
              width: "auto",
              fontWeight: 600,
              color: "var(--color-brand-600)",
            }}
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
          />
        </div>
      </div>

      {/* ——— PAINEL EXECUTIVO ——— */}
      {hasDrilldown &&
        ["gerentes", "coordenadores", "regionais"].includes(etapa) && (
          <PainelExecutivo mes={mes} ano={ano} />
        )}

      {/* ——— Lista de Gerentes ——— */}
      {etapa === "gerentes" && hasDrilldown && (
        <div className="flex flex-col gap-6 animate-fade-in">
          <div>
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "var(--color-text-primary)",
              }}
            >
              Gerentes Regionais
            </h2>
            <p
              style={{
                fontSize: "0.8125rem",
                color: "var(--color-text-muted)",
              }}
            >
              Selecione um gerente para visualizar a equipe de coordenadores
            </p>
          </div>
          {loadingGerentes ? (
            <div className="flex justify-center p-12">
              <Loader2
                className="animate-spin"
                style={{ color: "var(--color-brand-500)" }}
                size={32}
              />
            </div>
          ) : gerentesData?.length > 0 ? (
            <div
              className="grid gap-4"
              style={{
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              }}
            >
              {gerentesData.map((gerente) => (
                <div
                  key={gerente.id}
                  className="card hover-scale pointer"
                  onClick={() => {
                    setGerenteSelecionado(gerente);
                    setEtapa("coordenadores");
                  }}
                  style={{ padding: "20px" }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="flex items-center justify-center w-12 h-12 rounded-xl"
                      style={{
                        background: "var(--color-brand-100)",
                        color: "var(--color-brand-600)",
                      }}
                    >
                      <UserRound size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3
                        style={{
                          fontWeight: 700,
                          color: "var(--color-text-primary)",
                          marginBottom: "4px",
                        }}
                      >
                        {gerente.nome}
                      </h3>
                      <p
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--color-text-muted)",
                        }}
                      >
                        <strong style={{ color: "var(--color-brand-400)" }}>
                          {splitRegions(gerente.regiao).length}
                        </strong>{" "}
                        regionais atreladas
                      </p>
                    </div>
                    <ChevronDown
                      size={18}
                      className="rotate-270"
                      style={{ color: "var(--color-text-muted)" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              className="card text-center p-12"
              style={{ border: "1px dashed var(--color-border)" }}
            >
              <p style={{ color: "var(--color-text-muted)" }}>
                Nenhum gerente encontrado.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ——— Lista de Coordenadores ——— */}
      {etapa === "coordenadores" && hasDrilldown && (
        <div className="flex flex-col gap-6 animate-fade-in">
          <div className="flex items-center gap-3">
            {["ADMINISTRADOR", "DIRETOR"].includes(usuario?.role) && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setEtapa("gerentes");
                  setGerenteSelecionado(null);
                }}
                style={{ padding: "8px" }}
              >
                <ChevronUp className="rotate-270" size={18} />
              </button>
            )}
            <div>
              <h2
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color: "var(--color-text-primary)",
                }}
              >
                Coordenadores
              </h2>
              <p
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--color-text-muted)",
                }}
              >
                {gerenteSelecionado
                  ? `Equipe de ${gerenteSelecionado.nome}`
                  : "Selecione um coordenador"}
              </p>
            </div>
          </div>
          {loadingCoordenadores ? (
            <div className="flex justify-center p-12">
              <Loader2
                className="animate-spin"
                style={{ color: "var(--color-brand-500)" }}
                size={32}
              />
            </div>
          ) : coordenadoresFiltrados.length > 0 ? (
            <div
              className="grid gap-4"
              style={{
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              }}
            >
              {coordenadoresFiltrados.map((coordenador) => (
                <div
                  key={coordenador.id}
                  className="card hover-scale pointer"
                  onClick={() => {
                    setCoordenadorSelecionado(coordenador);
                    setEtapa("regionais");
                  }}
                  style={{ padding: "20px" }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="flex items-center justify-center w-12 h-12 rounded-xl"
                      style={{
                        background: "var(--color-surface-600)",
                        color: "var(--color-text-primary)",
                      }}
                    >
                      <UserRound size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3
                        style={{
                          fontWeight: 700,
                          color: "var(--color-text-primary)",
                          marginBottom: "4px",
                        }}
                      >
                        {coordenador.nome}
                      </h3>
                      <p
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--color-text-muted)",
                        }}
                      >
                        <strong style={{ color: "var(--color-brand-400)" }}>
                          {splitRegions(coordenador.regiao).length}
                        </strong>{" "}
                        regionais
                      </p>
                    </div>
                    <ChevronDown
                      size={18}
                      className="rotate-270"
                      style={{ color: "var(--color-text-muted)" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              className="card text-center p-12"
              style={{ border: "1px dashed var(--color-border)" }}
            >
              <p style={{ color: "var(--color-text-muted)" }}>
                Nenhum coordenador encontrado.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ——— Lista de Regionais ——— */}
      {etapa === "regionais" && hasDrilldown && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 mb-2">
            {["ADMINISTRADOR", "DIRETOR", "GERENTE"].includes(
              usuario?.role,
            ) && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setEtapa("coordenadores");
                    setCoordenadorSelecionado(null);
                  }}
                  style={{ padding: "8px" }}
                >
                  <ChevronUp className="rotate-270" size={18} />
                </button>
              )}
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "var(--color-text-primary)",
              }}
            >
              Regionais{" "}
              {coordenadorSelecionado
                ? `de ${coordenadorSelecionado.nome}`
                : ""}
            </h2>
          </div>
          <CorporativoRegioes
            onSelect={(r) => {
              setRegionalSelecionada(r);
              setEtapa("lojas");
            }}
            mes={mes}
            ano={ano}
            regioesContexto={regioesDoContexto}
          />
        </div>
      )}

      {/* ——— Lojas da Regional com Detalhes ——— */}
      {etapa === "lojas" && hasDrilldown && regionalSelecionada && (
        <div className="flex flex-col gap-8 animate-fade-in">
          <CorporativoRegiaoDetalhe
            regiao={regionalSelecionada}
            mes={mes}
            ano={ano}
            onBack={() => {
              setRegionalSelecionada(null);
              setEtapa("regionais");
            }}
          />

          <div>
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                marginBottom: "16px",
                color: "var(--color-text-primary)",
              }}
            >
              Lojas da Regional {regionalSelecionada}
            </h3>

            {loadingLojas ? (
              <div className="flex justify-center p-12">
                <Loader2
                  size={32}
                  className="animate-spin"
                  style={{ color: "var(--color-brand-500)" }}
                />
              </div>
            ) : lojasDaRegional.length === 0 ? (
              <div
                className="card text-center p-12"
                style={{ border: "1px dashed var(--color-border)" }}
              >
                <p style={{ color: "var(--color-text-muted)" }}>
                  Nenhuma loja encontrada para esta região.
                </p>
              </div>
            ) : (
              <div
                className="grid gap-4"
                style={{
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                }}
              >
                {lojasDaRegional
                  .sort((a, b) => a.nome.localeCompare(b.nome))
                  .map((loja) => (
                    <div
                      key={loja.unidade || loja.id}
                      className="card hover-scale pointer"
                      onClick={() => {
                        setLojaSelecionada(loja);
                        setEtapa("chamados");
                      }}
                      style={{ padding: "20px" }}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="flex items-center justify-center w-12 h-12 rounded-xl"
                          style={{
                            background: "var(--color-brand-100)",
                            color: "var(--color-brand-600)",
                          }}
                        >
                          <Store size={24} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <h3
                            style={{
                              fontWeight: 700,
                              color: "var(--color-text-primary)",
                              marginBottom: "4px",
                            }}
                          >
                            {loja.nome}
                          </h3>
                          <p
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--color-text-muted)",
                            }}
                          >
                            Unidade:{" "}
                            <strong
                              style={{ color: "var(--color-text-secondary)" }}
                            >
                              {loja.numero || loja.unidade || "S/N"}
                            </strong>
                          </p>
                        </div>
                        <ChevronRight
                          size={18}
                          style={{ color: "var(--color-text-muted)" }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ——— Tabela de Chamados da Loja ——— */}
      {etapa === "chamados" && !visualizandoAnalise && (
        <div className="flex flex-col gap-6 animate-fade-in">
          {hasDrilldown && (
            <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
              <div className="flex items-center gap-3">
                {lojaSelecionada && usuario?.role !== "GESTOR" ? (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setEtapa("lojas")}
                  >
                    <ArrowLeft size={18} /> Voltar para Lojas
                  </button>
                ) : regionalSelecionada ? (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setEtapa("regionais")}
                  >
                    <ArrowLeft size={18} /> Voltar para Regionais
                  </button>
                ) : null}
                {lojaSelecionada && (
                  <h2
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: 700,
                      color: "var(--color-text-primary)",
                    }}
                  >
                    Chamados: {lojaSelecionada.nome}
                  </h2>
                )}
                {!lojaSelecionada && regionalSelecionada && (
                  <h2
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: 700,
                      color: "var(--color-text-primary)",
                    }}
                  >
                    Chamados da Regional: {regionalSelecionada}
                  </h2>
                )}
              </div>

              {lojaSelecionada && (
                <button
                  className="btn btn-ghost"
                  onClick={() => setVisualizandoAnalise(true)}
                  style={{
                    gap: "6px",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface-700)",
                  }}
                >
                  <BarChart3 size={16} style={{ color: "var(--color-brand-500)" }} /> Análise Gráfica
                </button>
              )}
            </div>
          )}

          {/* ——— Barra de Ferramentas (Filtros e Ações) ——— */}
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              gap: '20px', 
              flexWrap: 'wrap',
              padding: '16px 20px',
              background: 'var(--color-surface-800)',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              marginBottom: '4px'
            }}
          >
            {/* Bloco de Filtros */}
            <div className="flex items-center gap-3 flex-1 min-w-[320px]">
              <div className="relative flex-1 max-w-[300px]">
                <Search
                  size={15}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--color-text-muted)",
                  }}
                />
                <input
                  className="input"
                  style={{ paddingLeft: "36px" }}
                  placeholder="Buscar empresa ou chamado..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
              </div>
              
              <div className="flex items-center gap-2">
                <select
                  className="select"
                  style={{ width: "auto", minWidth: "140px" }}
                  value={filtros.status}
                  onChange={(e) =>
                    setFiltros((f) => ({ ...f, status: e.target.value }))
                  }
                >
                  <option value="">Todos Status</option>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>

                <select
                  className="select"
                  style={{ width: "auto", minWidth: "140px" }}
                  value={filtros.segmento}
                  onChange={(e) =>
                    setFiltros((f) => ({ ...f, segmento: e.target.value }))
                  }
                >
                  <option value="">Todos Segmentos</option>
                  {SEGMENTOS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bloco de Resumo e Ação */}
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-end">
                <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '2px' }}>
                  Investimento Total
                </span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-brand-400)', lineHeight: 1 }}>
                  {fmt(totalFiltrado)}
                </span>
              </div>

              <div style={{ width: '1px', height: '32px', background: 'var(--color-border)' }}></div>

              <button
                className="btn btn-primary"
                style={{ 
                  height: '42px', 
                  padding: '0 20px', 
                  boxShadow: '0 4px 12px rgba(14, 165, 233, 0.2)' 
                }}
                onClick={() => setModal("novo")}
              >
                <Plus size={18} /> Novo Chamado
              </button>
            </div>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Chamado</th>
                  <th>Segmento</th>
                  <th>Empresa</th>
                  <th>Descrição</th>
                  <th>Orçamento</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th>Mau Uso</th>
                  <th style={{ width: "80px" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={10}>
                      <div className="flex justify-center py-8">
                        <Loader2
                          size={22}
                          className="animate-spin"
                          style={{ color: "var(--color-brand-500)" }}
                        />
                      </div>
                    </td>
                  </tr>
                ) : chamados.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      style={{
                        textAlign: "center",
                        color: "var(--color-text-muted)",
                        padding: "2rem",
                      }}
                    >
                      Nenhum chamado encontrado nesta loja
                    </td>
                  </tr>
                ) : (
                  chamados.map((c) => (
                    <tr key={c.id}>
                      <td
                        style={{ whiteSpace: "nowrap", fontSize: "0.8125rem" }}
                      >
                        {c.dataAbertura
                          ? format(new Date(c.dataAbertura), "dd/MM/yy")
                          : "—"}
                      </td>
                      <td
                        style={{
                          fontWeight: 600,
                          fontSize: "0.8125rem",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {c.numeroChamado}
                      </td>
                      <td>
                        <span
                          className="badge badge-brand"
                          style={{ fontSize: "0.7rem" }}
                        >
                          {c.segmento}
                        </span>
                      </td>
                      <td
                        style={{
                          fontSize: "0.8125rem",
                          maxWidth: "150px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {c.empresa}
                      </td>
                      <td
                        style={{
                          fontSize: "0.8125rem",
                          maxWidth: "200px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={c.descricao}
                      >
                        {c.descricao}
                      </td>
                      <td
                        style={{
                          fontSize: "0.8125rem",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        {c.numeroOrcamento || "—"}
                      </td>
                      <td
                        style={{
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                          color: "var(--color-success)",
                        }}
                      >
                        {fmt(c.valor)}
                      </td>
                      <td>
                        <span
                          className={`badge ${STATUS_BADGE[c.status]}`}
                          style={{ fontSize: "0.7rem" }}
                        >
                          {STATUS_LABEL[c.status]}
                        </span>
                      </td>
                      <td>
                        {c.mauUso ? (
                          <span
                            className="badge badge-danger"
                            style={{ fontSize: "0.7rem" }}
                          >
                            Sim
                          </span>
                        ) : (
                          <span
                            style={{
                              color: "var(--color-text-muted)",
                              fontSize: "0.8125rem",
                            }}
                          >
                            Não
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setModal(c)}
                            style={{ padding: "4px 6px" }}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => {
                              if (confirm("Remover chamado?"))
                                remover.mutate(c.id);
                            }}
                            style={{
                              padding: "4px 6px",
                              color: "var(--color-danger)",
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ——— Análise Gráfica da Loja ——— */}
      {etapa === "chamados" && visualizandoAnalise && lojaSelecionada && (
        <div className="flex flex-col gap-6 animate-fade-in">
          <div className="flex items-center gap-3">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setVisualizandoAnalise(false)}
            >
              <ArrowLeft size={18} /> Voltar para Planilha
            </button>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
              Análise Gráfica: {lojaSelecionada.nome}
            </h2>
          </div>

          {/* KPI Cards */}
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            <div className="card" style={{ padding: "18px", borderLeft: "4px solid var(--color-brand-500)" }}>
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase", fontWeight: 600 }}>Total do Mês</p>
              <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-text-primary)" }}>{fmt(totalFiltrado)}</span>
            </div>
            <div className="card" style={{ padding: "18px", borderLeft: "4px solid var(--color-warning)" }}>
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase", fontWeight: 600 }}>Chamados</p>
              <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-text-primary)" }}>{chamados.length}</span>
            </div>
            <div className="card" style={{ padding: "18px", borderLeft: "4px solid var(--color-success)" }}>
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase", fontWeight: 600 }}>Ticket Médio</p>
              <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-text-primary)" }}>{fmt(chamados.length > 0 ? totalFiltrado / chamados.length : 0)}</span>
            </div>
            <div className="card" style={{ padding: "18px", borderLeft: "4px solid var(--color-danger)" }}>
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "6px", textTransform: "uppercase", fontWeight: 600 }}>Mau Uso</p>
              <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-danger)" }}>{chamados.filter((c) => c.mauUso).length}</span>
            </div>
          </div>

          <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
            {/* Evolução Mensal */}
            <AnaliseLojaHistorico 
              regiao={regionalSelecionada} 
              unidade={lojaSelecionada?.nome} 
              height={260} 
            />

            {/* Top Empresas */}
            <div className="card">
              <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "16px" }}>
                Top 10 Empresas (Fornecedores)
              </h3>
              <div style={{ height: "320px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={chamadosPorEmpresa} 
                    layout="vertical"
                    margin={{ left: 10, right: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="empresa" 
                      type="category" 
                      width={110} 
                      tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} 
                    />
                    <Tooltip content={<TooltipCustom />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                    <Bar 
                      dataKey="valor" 
                      fill="var(--color-brand-600)" 
                      radius={[0, 4, 4, 0]} 
                      barSize={18}
                      name="Gasto"
                    >
                      {chamadosPorEmpresa.map((_, i) => (
                        <Cell key={i} fill={CORES[(i + 4) % CORES.length]} fillOpacity={0.9} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Pareto de Segmentos / Empresas */}
          {paretoData.length > 0 && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Tag size={18} style={{ color: "var(--color-brand-600)" }} />
                  <div className="flex items-center gap-2">
                    <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
                      Análise de Pareto: {paretoTipo === "segmentos" ? "Segmentos" : "Empresas"}
                    </h3>
                    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                      <button 
                        type="button"
                        className="btn btn-ghost btn-sm" 
                        style={{ padding: 0, minWidth: 'auto', width: '20px', height: '20px', borderRadius: '50%', color: 'var(--color-text-muted)' }}
                        onMouseEnter={() => setParetoHelpOpen(true)}
                        onMouseLeave={() => setParetoHelpOpen(false)}
                      >
                        <CircleHelp size={14} style={{ color: "var(--color-warning)" }}/>
                      </button>
                      {paretoHelpOpen && (
                        <div style={{
                          position: "absolute",
                          bottom: "calc(100% + 8px)",
                          left: 0,
                          width: "260px",
                          padding: "10px 12px",
                          borderRadius: "10px",
                          background: "var(--color-surface-700)",
                          border: "1px solid var(--color-border)",
                          color: "var(--color-text-secondary)",
                          boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
                          lineHeight: 1.4,
                          zIndex: 50,
                          fontSize: '0.75rem'
                        }}>
                          <p style={{ fontWeight: 700, color: 'var(--color-brand-400)', marginBottom: '4px' }}>O que é a Análise de Pareto?</p>
                          Indica que aproximadamente 80% dos custos costumam vir de apenas 20% das causas ({paretoTipo === "segmentos" ? "Segmentos" : "Empresas"}). 
                          As barras mostram o valor individual e a linha vermelha o impacto acumulado.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <select 
                  className="select" 
                  style={{ width: 'auto', height: '32px', padding: '0 10px', fontSize: '0.75rem' }}
                  value={paretoTipo}
                  onChange={(e) => setParetoTipo(e.target.value)}
                >
                  <option value="segmentos">Por Segmento</option>
                  <option value="empresas">Por Empresa</option>
                </select>
              </div>

              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={paretoData} margin={{ top: 20, right: 30, bottom: 55, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis 
                    dataKey="label" 
                    tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} 
                    angle={-40} 
                    height={70} 
                    interval={0} 
                    textAnchor="end" 
                  />
                  <YAxis yAxisId="left" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: "var(--color-danger)" }} domain={[0, 100]} />
                  <Tooltip content={<TooltipCustom />} />
                  <Bar yAxisId="left" dataKey="valor" fill="var(--color-brand-500)" radius={[4, 4, 0, 0]} name="Custo" />
                  <Line yAxisId="right" type="monotone" dataKey="acumulado" stroke="var(--color-danger)" strokeWidth={2.5} dot={{ r: 4, fill: "var(--color-danger)" }} name="% Acumulada" />
                </ComposedChart>
              </ResponsiveContainer>
              <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '10px', textAlign: 'center' }}>
                * A linha vermelha indica o percentual acumulado em relação ao gasto total da loja no mês.
              </p>
            </div>
          )}

        </div>
      )}

      {/* Modal de Detalhes */}
      {modal && (
        <ChamadoModal
          chamado={modal === "novo" ? null : modal}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
