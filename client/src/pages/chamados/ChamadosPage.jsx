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
  AlertTriangle
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
  Legend,
} from "recharts";
import { chamadosService, dashboardService, lojasService, usuariosService } from "../../services";
import { useAuth } from "../../contexts/AuthContext";

const SEGMENTOS = [
  "ELETRICA",
  "EMPILHADEIRA",
  "REFRIGERACAO",
  "REFRIGERACAO-PÇS",
  "SERRALHERIA",
  "AR-CONDICIONADO",
  "SERVIÇOS GERAIS",
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
  AGUARDANDO_APROVACAO: "Ag. Aprovação",
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
    : "—";
const CORES = [
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
  "#14b8a6",
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
              <label className="label">Número do Chamado (CSA) *</label>
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
        <div className="card" style={{ padding: "20px", borderLeft: "4px solid var(--color-brand-500)" }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg" style={{ background: "var(--color-brand-100)", color: "var(--color-brand-600)" }}>
              <DollarSign size={20} />
            </div>
            <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-text-secondary)", textTransform: "uppercase" }}>
              Total Gasto (Mês)
            </h3>
          </div>
          <div className="flex items-end gap-2">
            <span style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--color-text-primary)" }}>
              {fmt(detalhe.financeiro?.totalGasto)}
            </span>
          </div>
          <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "8px" }}>
            Referente a <strong>{detalhe.financeiro?.totalChamados} chamados</strong> abertos.
          </p>
        </div>

        <div className="card" style={{ padding: "20px", borderLeft: "4px solid var(--color-danger)" }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg" style={{ background: "var(--color-danger-100)", color: "var(--color-danger-600)" }}>
              <AlertTriangle size={20} />
            </div>
            <h3 style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-danger-600)", textTransform: "uppercase" }}>
              Registros de Mau Uso
            </h3>
          </div>
          <div className="flex items-end gap-2">
            <span style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--color-danger-700)" }}>
              {detalhe.financeiro?.mauUso?.quantidade ?? 0}
            </span>
            <span style={{ fontSize: "0.875rem", color: "var(--color-danger-600)", marginBottom: "6px", fontWeight: 600 }}>
              registros
            </span>
          </div>
          <p style={{ fontSize: "0.75rem", color: "var(--color-danger-600)", marginTop: "8px" }}>
            Prejuízo estimado: <strong>{fmt(detalhe.financeiro?.mauUso?.valor)}</strong>
          </p>
        </div>
      </div>

      <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 1fr" }}>
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
            className="flex items-center gap-2 mb-4"
            style={{ fontSize: "0.875rem", fontWeight: 600 }}
          >
            <Building2 size={16} /> Top 10 Empresas
          </h3>
          <div style={{ height: "300px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={detalhe.empresas}
                  dataKey="valor"
                  nameKey="empresa"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={60}
                >
                  {detalhe.empresas?.map((_, i) => (
                    <Cell key={i} fill={CORES[i % CORES.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function PainelExecutivo({ mes, ano }) {
  const { data: res, isLoading } = useQuery({
    queryKey: ["dashboard-executivo", mes, ano],
    queryFn: () => dashboardService.executivo({ mes: parseInt(mes), ano: parseInt(ano) }).then((r) => r.data),
  });

  if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" style={{ color: "var(--color-brand-500)" }} size={32} /></div>;
  if (!res) return null;

  const { comparativo, ticketMedio, top5Lojas, fornecedores, pareto } = res;

  return (
    <div className="flex flex-col gap-6 animate-fade-in mb-8">
      {/* Cards KPI */}
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid var(--color-brand-500)' }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg" style={{ background: 'var(--color-brand-100)', color: 'var(--color-brand-600)' }}>
              <DollarSign size={20} />
            </div>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Total Mês Atual</h3>
          </div>
          <div className="flex items-end gap-2">
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>{fmt(comparativo.atual)}</span>
          </div>
        </div>

        <div className={`card`} style={{ padding: '20px', borderLeft: `4px solid ${comparativo.variacao > 0 ? 'var(--color-danger)' : 'var(--color-success)'}` }}>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg ${comparativo.variacao > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
              {comparativo.variacao > 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            </div>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Variação (vs. Mês Anterior)</h3>
          </div>
          <div className="flex items-end gap-2">
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>{comparativo.variacao > 0 ? '+' : ''}{comparativo.variacao.toFixed(1)}%</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '6px' }}>({fmt(comparativo.passado)})</span>
          </div>
        </div>

        <div className="card" style={{ padding: '20px', borderLeft: '4px solid var(--color-warning)' }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
              <Activity size={20} />
            </div>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Ticket Médio</h3>
          </div>
          <div className="flex items-end gap-2">
            <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>{fmt(ticketMedio)}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '6px' }}>por chamado</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top 5 Lojas */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Store size={20} style={{ color: 'var(--color-danger)' }} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Top 5 Lojas Críticas (Custo)</h3>
          </div>
          <div className="flex flex-col gap-3">
            {top5Lojas.map((loja, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 rounded-lg" style={{ background: 'var(--color-surface-600)' }}>
                <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{idx + 1}. {loja.unidade}</span>
                <span style={{ fontWeight: 700, color: 'var(--color-danger)' }}>{fmt(loja.valor)}</span>
              </div>
            ))}
            {top5Lojas.length === 0 && <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Sem dados reportados.</p>}
          </div>
        </div>

        {/* Fornecedores */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Factory size={20} style={{ color: 'var(--color-brand-500)' }} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Concentração por Fornecedor</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={fornecedores} dataKey="valor" nameKey="empresa" cx="50%" cy="50%" outerRadius={80} innerRadius={50}>
                {fornecedores.map((_, i) => <Cell key={i} fill={CORES[i % CORES.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => fmt(v)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pareto */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Tag size={20} style={{ color: 'var(--color-brand-600)' }} />
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Pareto de Segmentos</h3>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={pareto} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
            <XAxis dataKey="segmento" tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} />
            <YAxis yAxisId="left" tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} />
            <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${v}%`} tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} />
            <Tooltip 
              formatter={(value, name) => [name === 'valor' ? fmt(value) : `${value.toFixed(1)}%`, name === 'valor' ? 'Custo' : '% Acumulada']}
            />
            <Bar yAxisId="left" dataKey="valor" fill="var(--color-brand-500)" radius={[4, 4, 0, 0]} name="Custo" />
            <Line yAxisId="right" type="monotone" dataKey="acumulado" stroke="var(--color-danger)" strokeWidth={3} dot={{ r: 4 }} name="% Acumulada" />
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
    regioesOrdenadas = regioesOrdenadas.filter(r => regioesContexto.includes(r.regiao.toUpperCase()));
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

export default function ChamadosPage() {
  const { usuario } = useAuth();
  const [searchParams] = useSearchParams();
  const mesParam = searchParams.get("mes");
  const anoParam = searchParams.get("ano");

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

  const hasDrilldown = ["ADMINISTRADOR", "DIRETOR", "GERENTE", "COORDENADOR"].includes(usuario?.role);
  const getInitialEtapa = (role) => {
    if (!hasDrilldown) return "chamados";
    if (["ADMINISTRADOR", "DIRETOR"].includes(role)) return "gerentes";
    if (role === "GERENTE") return "coordenadores";
    if (role === "COORDENADOR") return "regionais";
    return "regionais";
  };
  const [etapa, setEtapa] = useState(() => getInitialEtapa(usuario?.role));

  const [gerenteSelecionado, setGerenteSelecionado] = useState(null);
  const [coordenadorSelecionado, setCoordenadorSelecionado] = useState(null);
  const [regionalSelecionada, setRegionalSelecionada] = useState(null);
  const [lojaSelecionada, setLojaSelecionada] = useState(null);

  const splitRegions = (r) => (r ? r.split(',').map(s => s.trim().toUpperCase()).filter(Boolean) : []);
  const hasOverlap = (r1, r2) => {
    const arr1 = splitRegions(r1);
    const arr2 = splitRegions(r2);
    return arr1.some(r => arr2.includes(r));
  };

  const { data: gerentesData, isLoading: loadingGerentes } = useQuery({
    queryKey: ["gerentes-fin"],
    queryFn: () => usuariosService.listar({ role: "GERENTE", limit: 100, ativo: true }).then(r => r.data?.data || []),
    enabled: ["ADMINISTRADOR", "DIRETOR"].includes(usuario?.role) && etapa === "gerentes",
  });

  const { data: coordenadoresData, isLoading: loadingCoordenadores } = useQuery({
    queryKey: ["coordenadores-fin"],
    queryFn: () => usuariosService.listar({ role: "COORDENADOR", limit: 100, ativo: true }).then(r => r.data?.data || []),
    enabled: ["ADMINISTRADOR", "DIRETOR", "GERENTE"].includes(usuario?.role),
  });

  const coordenadoresFiltrados = (() => {
    if (!coordenadoresData) return [];
    if (usuario?.role === "GERENTE") return coordenadoresData.filter(c => hasOverlap(c.regiao, usuario.regiao));
    if (gerenteSelecionado) return coordenadoresData.filter(c => hasOverlap(c.regiao, gerenteSelecionado.regiao));
    return coordenadoresData;
  })();

  const regioesDoContexto = (() => {
    if (coordenadorSelecionado) return splitRegions(coordenadorSelecionado.regiao);
    if (usuario?.role === "COORDENADOR") return splitRegions(usuario.regiao);
    return null; 
  })();

  // Busca lojas quando estiver na etapa "lojas"
  const { data: lojasRes, isLoading: loadingLojas } = useQuery({
    queryKey: ["lojas", regionalSelecionada],
    queryFn: () => lojasService.listar({ limit: 1000 }).then(r => r.data), // Ideally we would pass regiao, filtering below
    enabled: etapa === "lojas" && !!regionalSelecionada,
  });

  const lojasDaRegional = (lojasRes?.data || lojasRes || []).filter(l => l.regiao === regionalSelecionada);

  // Busca chamados da loja selecionada (ou geral se não houver drilldown)
  const { data, isLoading } = useQuery({
    queryKey: ["chamados", filtros, ano, mes, regionalSelecionada, lojaSelecionada?.nome],
    queryFn: () =>
      chamadosService
        .listar({ 
          ...filtros, 
          ano, 
          mes, 
          regiao: hasDrilldown && lojaSelecionada ? undefined : regionalSelecionada, // Se tem loja, busca direto pela loja
          unidade: lojaSelecionada?.nome, 
          limit: 100 
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

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-10">
      
      {/* Cabeçalho de Controle e Seleção de Data */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Controle Financeiro</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Gerenciamento de gastos e chamados por loja</p>
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

      {/* ─── PAINEL EXECUTIVO ─── */}
      {hasDrilldown && ["gerentes", "coordenadores", "regionais"].includes(etapa) && (
        <PainelExecutivo mes={mes} ano={ano} />
      )}

      {/* ─── Lista de Gerentes ─── */}
      {etapa === "gerentes" && hasDrilldown && (
        <div className="flex flex-col gap-6 animate-fade-in">
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Gerentes Regionais</h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Selecione um gerente para visualizar a equipe de coordenadores</p>
          </div>
          {loadingGerentes ? (
            <div className="flex justify-center p-12"><Loader2 className="animate-spin" style={{ color: 'var(--color-brand-500)' }} size={32} /></div>
          ) : gerentesData?.length > 0 ? (
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {gerentesData.map((gerente) => (
                <div key={gerente.id} className="card hover-scale pointer" onClick={() => { setGerenteSelecionado(gerente); setEtapa("coordenadores"); }} style={{ padding: '20px' }}>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl" style={{ background: 'var(--color-brand-100)', color: 'var(--color-brand-600)' }}>
                      <UserRound size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '4px' }}>{gerente.nome}</h3>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        <strong style={{ color: 'var(--color-brand-400)' }}>{splitRegions(gerente.regiao).length}</strong> regionais atreladas
                      </p>
                    </div>
                    <ChevronDown size={18} className="rotate-270" style={{ color: 'var(--color-text-muted)' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card text-center p-12" style={{ border: '1px dashed var(--color-border)' }}>
              <p style={{ color: 'var(--color-text-muted)' }}>Nenhum gerente encontrado.</p>
            </div>
          )}
        </div>
      )}

      {/* ─── Lista de Coordenadores ─── */}
      {etapa === "coordenadores" && hasDrilldown && (
        <div className="flex flex-col gap-6 animate-fade-in">
          <div className="flex items-center gap-3">
            {["ADMINISTRADOR", "DIRETOR"].includes(usuario?.role) && (
              <button className="btn btn-ghost btn-sm" onClick={() => { setEtapa("gerentes"); setGerenteSelecionado(null); }} style={{ padding: '8px' }}>
                <ChevronUp className="rotate-270" size={18} />
              </button>
            )}
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Coordenadores</h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{gerenteSelecionado ? `Equipe de ${gerenteSelecionado.nome}` : 'Selecione um coordenador'}</p>
            </div>
          </div>
          {loadingCoordenadores ? (
            <div className="flex justify-center p-12"><Loader2 className="animate-spin" style={{ color: 'var(--color-brand-500)' }} size={32} /></div>
          ) : coordenadoresFiltrados.length > 0 ? (
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {coordenadoresFiltrados.map((coordenador) => (
                <div key={coordenador.id} className="card hover-scale pointer" onClick={() => { setCoordenadorSelecionado(coordenador); setEtapa("regionais"); }} style={{ padding: '20px' }}>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl" style={{ background: 'var(--color-surface-600)', color: 'var(--color-text-primary)' }}>
                      <UserRound size={24} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '4px' }}>{coordenador.nome}</h3>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        <strong style={{ color: 'var(--color-brand-400)' }}>{splitRegions(coordenador.regiao).length}</strong> regionais
                      </p>
                    </div>
                    <ChevronDown size={18} className="rotate-270" style={{ color: 'var(--color-text-muted)' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card text-center p-12" style={{ border: '1px dashed var(--color-border)' }}>
              <p style={{ color: 'var(--color-text-muted)' }}>Nenhum coordenador encontrado.</p>
            </div>
          )}
        </div>
      )}

      {/* ─── Lista de Regionais ─── */}
      {etapa === "regionais" && hasDrilldown && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 mb-2">
            {["ADMINISTRADOR", "DIRETOR", "GERENTE"].includes(usuario?.role) && (
              <button className="btn btn-ghost btn-sm" onClick={() => { setEtapa("coordenadores"); setCoordenadorSelecionado(null); }} style={{ padding: '8px' }}>
                <ChevronUp className="rotate-270" size={18} />
              </button>
            )}
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Regionais {coordenadorSelecionado ? `de ${coordenadorSelecionado.nome}` : ''}
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

      {/* ─── Lojas da Regional com Detalhes ─── */}
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
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "16px", color: "var(--color-text-primary)" }}>
              Lojas da Regional {regionalSelecionada}
            </h3>
            
            {loadingLojas ? (
              <div className="flex justify-center p-12">
                <Loader2 size={32} className="animate-spin" style={{ color: "var(--color-brand-500)" }} />
              </div>
            ) : lojasDaRegional.length === 0 ? (
              <div className="card text-center p-12" style={{ border: '1px dashed var(--color-border)' }}>
                <p style={{ color: 'var(--color-text-muted)' }}>Nenhuma loja encontrada para esta região.</p>
              </div>
            ) : (
              <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                {lojasDaRegional.sort((a,b)=>a.nome.localeCompare(b.nome)).map((loja) => (
                  <div 
                    key={loja.unidade || loja.id} 
                    className="card hover-scale pointer" 
                    onClick={() => {
                      setLojaSelecionada(loja);
                      setEtapa("chamados");
                    }} 
                    style={{ padding: '20px' }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl" style={{ background: 'var(--color-brand-100)', color: 'var(--color-brand-600)' }}>
                        <Store size={24} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '4px' }}>{loja.nome}</h3>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          Unidade: <strong style={{ color: 'var(--color-text-secondary)' }}>{loja.numero || loja.unidade || "S/N"}</strong>
                        </p>
                      </div>
                      <ChevronRight size={18} style={{ color: 'var(--color-text-muted)' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Tabela de Chamados da Loja ─── */}
      {etapa === "chamados" && (
        <div className="flex flex-col gap-6 animate-fade-in">
          {hasDrilldown && (
            <div className="flex items-center gap-3 mb-2">
              <button className="btn btn-ghost btn-sm" onClick={() => setEtapa("lojas")}>
                <ArrowLeft size={18} /> Voltar para Lojas
              </button>
              {lojaSelecionada && (
                <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
                  Chamados: {lojaSelecionada.nome}
                </h2>
              )}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search
                  size={15}
                  style={{
                    position: "absolute",
                    left: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--color-text-muted)",
                  }}
                />
                <input
                  className="input"
                  style={{ paddingLeft: "32px", width: "200px" }}
                  placeholder="Empresa ou chamado..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
              </div>
              <select
                className="select"
                style={{ width: "auto" }}
                value={filtros.status}
                onChange={(e) =>
                  setFiltros((f) => ({ ...f, status: e.target.value }))
                }
              >
                <option value="">Todos os status</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
              <select
                className="select"
                style={{ width: "auto" }}
                value={filtros.segmento}
                onChange={(e) =>
                  setFiltros((f) => ({ ...f, segmento: e.target.value }))
                }
              >
                <option value="">Todos os segmentos</option>
                {SEGMENTOS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="badge badge-brand" style={{ fontSize: "0.8125rem" }}>
                Total: {fmt(totalFiltrado)}
              </span>
              <button className="btn btn-primary" onClick={() => setModal("novo")}>
                <Plus size={16} /> Novo Chamado
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
                      <td style={{ whiteSpace: "nowrap", fontSize: "0.8125rem" }}>
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
                              if (confirm("Remover chamado?")) remover.mutate(c.id);
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

      {modal && (
        <ChamadoModal
          chamado={modal === "novo" ? null : modal}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
