// src/pages/checklists/ChecklistPage.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
import {
  usuariosService,
  checklistService,
  ativosService,
} from "../../services";
import {
  getWeek,
  getYear,
  setWeek,
  setYear,
  startOfWeek,
  format,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { ptBR } from "date-fns/locale";

// Retorna o nome do mês correspondente à semana/ano
const mesDoChecklist = (semana, ano) => {
  const d = startOfWeek(
    setWeek(setYear(new Date(), ano), semana, { weekStartsOn: 5 }),
    { weekStartsOn: 5 },
  );
  return format(d, "MMMM", { locale: ptBR });
};
import {
  Save,
  ClipboardCheck,
  ShoppingCart,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Users,
  Building2,
} from "lucide-react";
import toast from "react-hot-toast";

// ─── Constantes ──────────────────────────────────────────────────────────────

const EQUIPAMENTOS = [
  { key: "EMPILHADEIRA_ELETRICA", label: "Empilhadeira Elétrica" },
  { key: "EMPILHADEIRA_COMBUSTAO", label: "Empilhadeira a Combustão" },
  { key: "EMPILHADEIRA_PATOLADA", label: "Empilhadeira Patolada" },
  { key: "MAQUINA_MOER_CARNE", label: "Máquina de Moer Carne" },
  { key: "SERRA_FITA", label: "Serra Fita" },
  { key: "EMBALADORA_VACUO", label: "Embaladora a Vácuo" },
  { key: "FATIADORA", label: "Fatiadora" },
  { key: "FATIADORA_GRANDE", label: "Fatiadora Grande (JetCut)" },
  { key: "ELEVADOR", label: "Elevador" },
  { key: "ILHASELF", label: "Ilhaself" },
  { key: "ESCADA_ROLANTE", label: "Escada Rolante" },
];

const CARRINHOS = [
  { key: "MARIA_GORDA", label: "Maria Gorda" },
  { key: "SUPERCAR", label: "Supercar" },
  { key: "DOIS_ANDARES", label: "Dois Andares" },
  { key: "PRANCHA", label: "Prancha" },
  { key: "PRANCHA_PERECIVEIS", label: "Prancha Perecíveis" },
  { key: "CARRINHO_ABASTECIMENTO", label: "Carrinho de Abastecimento" },
  { key: "ESCADA", label: "Escada" },
  { key: "BEBE_CONFORTO", label: "Bebê Conforto" },
  { key: "CARRINHO_MOTORIZADO", label: "Carrinho Motorizado" },
  { key: "ESCADA_ABASTECIMENTO", label: "Escada de Abastecimento" },
];

const normalizarTexto = (valor) =>
  String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();

const resolverTipoCarrinhoAtivo = (ativo) => {
  const candidatos = [ativo.tipo, ativo.nome]
    .map(normalizarTexto)
    .filter(Boolean);

  const aliases = {
    MARIA_GORDA: "MARIA_GORDA",
    SUPERCAR: "SUPERCAR",
    DOIS_ANDARES: "DOIS_ANDARES",
    CARRINHO_DOIS_ANDARES: "DOIS_ANDARES",
    DOIS_ANDAR: "DOIS_ANDARES",
    PRANCHA: "PRANCHA",
    PRANCHA_PERECIVEIS: "PRANCHA_PERECIVEIS",
    PRANCHA_PERECIVEL: "PRANCHA_PERECIVEIS",
    PRANCHA_PERECIIVEL: "PRANCHA_PERECIVEIS",
    CARRINHO_ABASTECIMENTO: "CARRINHO_ABASTECIMENTO",
    CARRINHO_DE_ABASTECIMENTO: "CARRINHO_ABASTECIMENTO",
    ABASTECIMENTO: "CARRINHO_ABASTECIMENTO",
    ESCADA: "ESCADA",
    BEBE_CONFORTO: "BEBE_CONFORTO",
    CARRINHO_BEBE: "BEBE_CONFORTO",
    BEBE: "BEBE_CONFORTO",
    CONFORTO: "BEBE_CONFORTO",
    CARRINHO_MOTORIZADO: "CARRINHO_MOTORIZADO",
    MOTORIZADO: "CARRINHO_MOTORIZADO",
    ESCADA_ABASTECIMENTO: "ESCADA_ABASTECIMENTO",
    ESCADA_DE_ABASTECIMENTO: "ESCADA_ABASTECIMENTO",
  };

  // 1ª passagem: match exato contra aliases e labels normalizados
  for (const candidato of candidatos) {
    if (aliases[candidato]) return aliases[candidato];
    const encontrado = CARRINHOS.find(
      (c) => normalizarTexto(c.label) === candidato || c.key === candidato,
    );
    if (encontrado) return encontrado.key;
  }

  // 2ª passagem: match por substring — útil para nomes como "Maria Gorda 01" ou "Supercar - Grande"
  const PADROES = [
    { key: "MARIA_GORDA", tokens: ["MARIA_GORDA", "MARIA"] },
    { key: "SUPERCAR", tokens: ["SUPERCAR"] },
    {
      key: "DOIS_ANDARES",
      tokens: ["DOIS_ANDARES", "DOIS_ANDAR", "2_ANDARES", "2_ANDAR"],
    },
    { key: "PRANCHA_PERECIVEIS", tokens: ["PRANCHA_PERECIV", "PERECIV"] },
    { key: "PRANCHA", tokens: ["PRANCHA"] },
    { key: "CARRINHO_ABASTECIMENTO", tokens: ["ABASTECIMENTO"] },
    { key: "ESCADA", tokens: ["ESCADA"] },
    { key: "BEBE_CONFORTO", tokens: ["BEBE_CONFORTO", "BEBE", "CONFORTO"] },
    { key: "CARRINHO_MOTORIZADO", tokens: ["MOTORIZADO"] },
    { key: "ESCADA_ABASTECIMENTO", tokens: ["ESCADA_ABASTECIMENTO"] },
  ];

  for (const candidato of candidatos) {
    for (const { key, tokens } of PADROES) {
      if (tokens.some((t) => candidato.includes(t))) return key;
    }
  }

  return null;
};

const montarFrotaCarrinhosPorAtivos = (ativos) =>
  Object.values(
    ativos.reduce((acc, ativo) => {
      const tipoCarrinho = resolverTipoCarrinhoAtivo(ativo);
      if (!tipoCarrinho) return acc;
      if (!acc[tipoCarrinho]) acc[tipoCarrinho] = { tipoCarrinho, total: 0 };
      acc[tipoCarrinho].total += parseInt(ativo.quantidade) || 0;
      return acc;
    }, {}),
  );

// ─── Componente de linha do equipamento ─────────────────────────────────────

function LinhaEquipamento({
  equip,
  value,
  onChange,
  readOnly,
  ativosUnidade = [],
}) {
  const [expanded, setExpanded] = useState(!value.operacional);

  const set = (field, val) => onChange({ ...value, [field]: val });

  const bgColor = !value.operacional ? "rgba(239,68,68,0.06)" : "transparent";

  return (
    <div
      style={{
        borderBottom: "1px solid var(--color-border)",
        background: bgColor,
        transition: "background 0.2s",
      }}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Status principal */}
        <div className="flex items-center gap-2" style={{ minWidth: "200px" }}>
          {value.operacional ? (
            <CheckCircle
              size={16}
              style={{ color: "var(--color-success)", flexShrink: 0 }}
            />
          ) : (
            <AlertTriangle
              size={16}
              style={{ color: "var(--color-danger)", flexShrink: 0 }}
            />
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
            <span
              style={{
                fontWeight: 600,
                fontSize: "0.875rem",
                color: "var(--color-text-primary)",
              }}
            >
              {equip.label}
            </span>
            {equip.identificador && (
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "var(--color-text-muted)",
                  fontWeight: 400,
                }}
              >
                {equip.identificador}
              </span>
            )}
          </div>
        </div>

        {/* Toggle operacional */}
        {!readOnly && (
          <label
            className="flex items-center gap-2 cursor-pointer"
            style={{ marginLeft: "auto" }}
          >
            <span
              style={{
                fontSize: "0.8125rem",
                color: "var(--color-text-secondary)",
              }}
            >
              {value.operacional ? "Operacional" : "Com Problema"}
            </span>
            <div
              onClick={() => {
                set("operacional", !value.operacional);
                setExpanded(value.operacional);
              }}
              style={{
                width: "44px",
                height: "24px",
                borderRadius: "12px",
                cursor: "pointer",
                background: value.operacional
                  ? "var(--color-success)"
                  : "var(--color-danger)",
                position: "relative",
                transition: "background 0.2s",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "3px",
                  left: value.operacional ? "22px" : "3px",
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  background: "#fff",
                  transition: "left 0.2s",
                }}
              />
            </div>
          </label>
        )}

        {readOnly && (
          <span
            className={`badge ${value.operacional ? "badge-success" : "badge-danger"}`}
            style={{ marginLeft: "auto", fontSize: "0.75rem" }}
          >
            {value.operacional ? "Operacional" : "Com Problema"}
          </span>
        )}

        {!value.operacional && (
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              color: "var(--color-text-muted)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
            }}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
      </div>

      {/* Detalhes — só quando quebrado e expandido */}
      {!value.operacional && expanded && (
        <div
          className="grid gap-3 px-4 pb-4"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          }}
        >
          <div>
            <label className="label">Qtd. com problema</label>
            <input
              type="number"
              min="0"
              className="input"
              value={value.quantidadeQuebrada || ""}
              readOnly={readOnly}
              onChange={(e) => set("quantidadeQuebrada", e.target.value)}
              placeholder="0"
            />
          </div>
          <div>
            <label className="label">Nº Série</label>
            <input
              className="input"
              value={value.numeroSerie || ""}
              readOnly={readOnly}
              onChange={(e) => set("numeroSerie", e.target.value)}
              placeholder="SN-000"
            />
          </div>
          <div>
            <label className="label">Chamado Aberto</label>
            <input
              className="input"
              value={value.numeroChamado || ""}
              readOnly={readOnly}
              onChange={(e) => set("numeroChamado", e.target.value)}
              placeholder="CSA-0000"
            />
          </div>
          <div>
            <label className="label">Valor (R$)</label>
            <input
              type="number"
              step="0.01"
              className="input"
              value={value.valor || ""}
              readOnly={readOnly}
              onChange={(e) => set("valor", e.target.value)}
              placeholder="0,00"
            />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label className="label">Vincular Ativo (Opcional)</label>
            <select
              className="input"
              value={value.ativoId || ""}
              onChange={(e) => set("ativoId", e.target.value)}
              disabled={readOnly}
            >
              <option value="">Selecione um ativo...</option>
              {ativosUnidade.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome} {a.patrimonio ? `(${a.patrimonio})` : ""} -{" "}
                  {a.categoria}
                </option>
              ))}
            </select>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label className="label">Descrição do Problema</label>
            <textarea
              className="input"
              rows={2}
              value={value.descricaoProblema || ""}
              readOnly={readOnly}
              onChange={(e) => set("descricaoProblema", e.target.value)}
              placeholder="Descreva o problema..."
              style={{ resize: "vertical" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Componente de linha do carrinho ────────────────────────────────────────

function LinhaCarrinho({ carrinho, value, onChange, readOnly }) {
  const set = (field, val) => onChange({ ...value, [field]: val });
  const temProblema = parseInt(value.quebrados) > 0;

  return (
    <div
      style={{
        borderBottom: "1px solid var(--color-border)",
        background: temProblema ? "rgba(239,68,68,0.06)" : "transparent",
      }}
    >
      <div className="flex items-center gap-3 px-4 py-3 flex-wrap">
        <div className="flex items-center gap-2" style={{ minWidth: "200px" }}>
          {temProblema ? (
            <AlertTriangle
              size={16}
              style={{ color: "var(--color-danger)", flexShrink: 0 }}
            />
          ) : (
            <CheckCircle
              size={16}
              style={{ color: "var(--color-success)", flexShrink: 0 }}
            />
          )}
          <span
            style={{
              fontWeight: 600,
              fontSize: "0.875rem",
              color: "var(--color-text-primary)",
            }}
          >
            {carrinho?.label || value.tipoCarrinho}
          </span>
        </div>

        <div
          className="flex items-center gap-4"
          style={{ marginLeft: "auto", flexWrap: "wrap", gap: "12px" }}
        >
          <div className="flex items-center gap-2">
            <label
              style={{
                fontSize: "0.8125rem",
                color: "var(--color-text-muted)",
                whiteSpace: "nowrap",
              }}
            >
              Total:
            </label>
            <span
              style={{
                fontWeight: 700,
                fontSize: "0.875rem",
                minWidth: "40px",
                textAlign: "center",
              }}
            >
              {value.total || 0}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <label
              style={{
                fontSize: "0.8125rem",
                color: "var(--color-danger)",
                whiteSpace: "nowrap",
              }}
            >
              Quebrados:
            </label>
            <input
              type="number"
              min="0"
              className="input"
              style={{
                width: "70px",
                borderColor: temProblema ? "var(--color-danger)" : undefined,
              }}
              value={value.quebrados || 0}
              readOnly={readOnly}
              onChange={(e) => set("quebrados", e.target.value)}
            />
          </div>
          {temProblema && (
            <input
              className="input"
              style={{ width: "160px" }}
              value={value.numeroChamado || ""}
              readOnly={readOnly}
              onChange={(e) => set("numeroChamado", e.target.value)}
              placeholder="Nº Chamado"
            />
          )}
        </div>
      </div>
      {temProblema && (
        <div className="px-4 pb-3">
          <textarea
            className="input"
            rows={1}
            style={{ resize: "vertical" }}
            value={value.descricaoProblema || ""}
            readOnly={readOnly}
            onChange={(e) => set("descricaoProblema", e.target.value)}
            placeholder="Descrição do problema..."
          />
        </div>
      )}
    </div>
  );
}

// ─── Tab de Equipamentos ────────────────────────────────────────────────────

function TabEquipamentos({ semana, ano, usuario, canEdit }) {
  const qc = useQueryClient();

  const { data: checklistExistente, isLoading } = useQuery({
    queryKey: ["checklist-equip", semana, ano, usuario.unidade],
    queryFn: () =>
      api
        .get("/checklists/equipamentos/semana", {
          params: { semana, ano, unidade: usuario.unidade },
        })
        .then((r) => r.data),
    enabled: !!usuario.unidade,
  });

  const [itens, setItens] = useState([]);
  const [observacoes, setObservacoes] = useState("");

  // Ativos da unidade — base para montar os itens dinamicamente
  const { data: ativosUnidade = [], isLoading: isLoadingAtivos } = useQuery({
    queryKey: ["ativos-equipamentos-checklist", usuario.unidade],
    queryFn: () =>
      ativosService
        .listar({ unidade: usuario.unidade, status: "ATIVO", limit: 500 })
        .then((r) => r.data.data || []),
    enabled: !!usuario.unidade,
  });

  // Monta os itens assim que ativos e checklist existente estiverem disponíveis
  useEffect(() => {
    if (isLoadingAtivos) return;

    if (checklistExistente?.itens?.length) {
      // Checklist já existente: usar os itens salvos como base
      // Suporte a itens antigos (tipoEquipamento) e novos (ativoId)
      setItens(checklistExistente.itens);
      setObservacoes(checklistExistente.observacoes || "");
    } else if (ativosUnidade.length > 0) {
      // Sem checklist salvo: montar um item por ativo cadastrado
      // Filtra ativos que representam carrinhos (pois estes têm checklist próprio)
      const ativosSomenteEquip = ativosUnidade.filter(
        (a) => !resolverTipoCarrinhoAtivo(a),
      );
      setItens(
        ativosSomenteEquip.map((ativo) => ({
          ativoId: ativo.id,
          nomeEquipamento: ativo.nome,
          tipoEquipamento: null,
          operacional: true,
          quantidade: ativo.quantidade || 1,
          quantidadeQuebrada: 0,
          numeroSerie: ativo.numeroSerie || "",
          numeroChamado: "",
          descricaoProblema: "",
          valor: "",
        })),
      );
      setObservacoes("");
    } else {
      setItens([]);
      setObservacoes("");
    }
  }, [checklistExistente, ativosUnidade, isLoadingAtivos]);

  const mutation = useMutation({
    mutationFn: () =>
      api.post("/checklists/equipamentos", { semana, ano, itens, observacoes }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["checklist-equip"] });
      toast.success("Checklist salvo!");
    },
    onError: (e) => toast.error(e.response?.data?.error || "Erro ao salvar"),
  });

  // Identifica um item por ativoId (novo) ou tipoEquipamento (legado)
  const itemKey = (i) => i.ativoId || i.tipoEquipamento;
  const setItem = (key, val) =>
    setItens((prev) => prev.map((i) => (itemKey(i) === key ? val : i)));
  const problemCount = itens.filter((i) => !i.operacional).length;

  if (isLoading || isLoadingAtivos)
    return (
      <div className="flex justify-center py-12">
        <Loader2
          size={24}
          className="animate-spin"
          style={{ color: "var(--color-brand-500)" }}
        />
      </div>
    );

  if (!isLoading && !isLoadingAtivos && ativosUnidade.length === 0)
    return (
      <div className="card" style={{ padding: "32px", textAlign: "center" }}>
        <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
          Nenhum ativo cadastrado para esta unidade. Cadastre os equipamentos na
          página de <strong>Ativos da Loja</strong> para habilitar o checklist.
        </p>
      </div>
    );

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <div className="flex items-stretch gap-3 flex-wrap">
        <div
          className="card"
          style={{
            padding: "12px 20px",
            flex: 1,
            minWidth: "160px",
            borderTop: "4px solid var(--color-danger)",
          }}
        >
          <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
            Equipamentos c/ Problema
          </p>
          <p
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color:
                problemCount > 0
                  ? "var(--color-danger)"
                  : "var(--color-success)",
            }}
          >
            {problemCount}
          </p>
        </div>
        <div
          className="card"
          style={{
            padding: "12px 20px",
            flex: 1,
            minWidth: "160px",
            borderTop: "4px solid var(--color-success)",
          }}
        >
          <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
            Operacionais
          </p>
          <p
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "var(--color-success)",
            }}
          >
            {itens.length - problemCount}
          </p>
        </div>
        {checklistExistente && (
          <div
            className="card"
            style={{ padding: "12px 20px", flex: 1, minWidth: "160px", borderTop: "4px solid var(--color-warning)" }}
          >
            <p
              style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", minHeight: "25px" }}
            >
              Último preenchimento
            </p>
            <p
              style={{
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--color-text-primary)",
              }}
            >
              {(() => {
                const raw = checklistExistente?.criadoEm;
                if (!raw) return "-";
                const d = new Date(raw);
                return isNaN(d.getTime()) ? "-" : d.toLocaleDateString("pt-BR");
              })()}
              {checklistExistente?.ultimoPreenchimentoNote && (
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--color-text-muted)",
                    marginTop: 4,
                  }}
                >
                  {checklistExistente.ultimoPreenchimentoNote}
                </div>
              )}
            </p>
          </div>
        )}
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--color-border)",
            fontWeight: 600,
            color: "var(--color-text-primary)",
            fontSize: "0.875rem",
          }}
        >
          Equipamentos — Semana {semana} ·{" "}
          {mesDoChecklist(semana, ano).charAt(0).toUpperCase() +
            mesDoChecklist(semana, ano).slice(1)}
          /{ano}
        </div>
        {itens.map((item) => {
          // Legado: item do enum fixo
          const equipLegado = item.tipoEquipamento
            ? EQUIPAMENTOS.find((e) => e.key === item.tipoEquipamento)
            : null;
          // Label: nome do ativo (novo) ou label do enum (legado) ou o próprio key
          const label =
            item.nomeEquipamento ||
            equipLegado?.label ||
            item.tipoEquipamento ||
            "Equipamento";
          // Identificador: patrimônio ou número de série do ativo vinculado
          const ativoVinculado = item.ativoId
            ? ativosUnidade.find((a) => a.id === item.ativoId)
            : null;
          const identificador = ativoVinculado
            ? ativoVinculado.patrimonio
              ? `Patrimônio: ${ativoVinculado.patrimonio}`
              : ativoVinculado.numeroSerie
                ? `Nº Série: ${ativoVinculado.numeroSerie}`
                : null
            : item.numeroSerie
              ? `S/N ${item.numeroSerie}`
              : null;
          const key = itemKey(item);
          return (
            <LinhaEquipamento
              key={key}
              equip={{ label, identificador }}
              value={item}
              onChange={(val) => setItem(key, val)}
              readOnly={!canEdit}
              ativosUnidade={ativosUnidade || []}
            />
          );
        })}

        {canEdit && (
          <div
            style={{
              padding: "16px 20px",
              borderTop: "1px solid var(--color-border)",
            }}
          >
            <label className="label">Observações Gerais</label>
            <textarea
              className="input"
              rows={2}
              style={{ resize: "vertical" }}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações adicionais..."
            />
          </div>
        )}
      </div>

      {canEdit && (
        <div className="flex justify-end">
          <button
            className="btn btn-primary"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Salvar Checklist
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Componente Setup de Frota ──────────────────────────────────────────────

function SetupFrota({ onSaved }) {
  const [itens, setItens] = useState(
    CARRINHOS.map((c) => ({ tipoCarrinho: c.key, total: 0 })),
  );
  const mutation = useMutation({
    mutationFn: (data) => checklistService.salvarFrota({ itens: data }),
    onSuccess: () => {
      toast.success("Frota inicial configurada!");
      onSaved();
    },
    onError: (e) => toast.error("Erro ao salvar frota"),
  });

  const update = (key, val) =>
    setItens((prev) =>
      prev.map((i) =>
        i.tipoCarrinho === key ? { ...i, total: parseInt(val) || 0 } : i,
      ),
    );

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div
        className="card"
        style={{
          border: "1px solid var(--color-border)",
          background: "var(--color-surface-700)",
          padding: "30px",
          textAlign: "center",
        }}
      >
        <div className="flex justify-center mb-4">
          <div
            className="flex items-center justify-center w-16 h-16 rounded-full"
            style={{
              background: "rgba(14, 165, 233, 0.15)",
              color: "var(--color-brand-500)",
            }}
          >
            <ShoppingCart size={32} />
          </div>
        </div>
        <h2 style={{ fontWeight: 700, color: "var(--color-text-primary)" }}>
          Configuração de Inventário
        </h2>
        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--color-text-secondary)",
            maxWidth: "500px",
            margin: "8px auto",
          }}
        >
          Identificamos que sua loja ainda não possui uma frota de carrinhos
          cadastrada. Informe o total de ativos que a loja possui em estoque
          para prosseguir com o checklist.
        </p>

        <div
          className="grid gap-3 mt-8"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            textAlign: "left",
          }}
        >
          {CARRINHOS.map((c) => (
            <div key={c.key} className="card" style={{ padding: "12px 16px" }}>
              <label className="label" style={{ marginBottom: "8px" }}>
                {c.label}
              </label>
              <input
                type="number"
                min="0"
                className="input"
                placeholder="Total na loja"
                value={itens.find((i) => i.tipoCarrinho === c.key).total}
                onChange={(e) => update(c.key, e.target.value)}
              />
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-8">
          <button
            className="btn btn-primary"
            style={{ padding: "12px 40px" }}
            onClick={() => mutation.mutate(itens)}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            Salvar Inventário da Loja
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tab de Carrinhos ────────────────────────────────────────────────────────

function TabCarrinhos({ semana, ano, usuario, canEdit }) {
  const qc = useQueryClient();

  const { data: ativosCarrinhos = [], isLoading: loadingAtivos } = useQuery({
    queryKey: ["ativos-carrinhos-checklist", usuario.unidade],
    queryFn: () =>
      ativosService
        .listar({
          categoria: "Carrinho,Escada",
          unidade: usuario.unidade,
          status: "ATIVO",
          limit: 500,
        })
        .then((r) => r.data.data || []),
    enabled: !!usuario.unidade,
  });

  const { data: checklistExistente, isLoading: loadingChecklist } = useQuery({
    queryKey: ["checklist-carrinho", semana, ano, usuario.unidade],
    queryFn: () =>
      checklistService
        .buscarCarrinhoSemana({ semana, ano, unidade: usuario.unidade })
        .then((r) => r.data),
  });

  const frota = montarFrotaCarrinhosPorAtivos(ativosCarrinhos);
  const hasAtivosCarrinhos = frota.length > 0 && frota.some((f) => f.total > 0);
  const ativosNaoResolvidos = ativosCarrinhos.filter(
    (a) => resolverTipoCarrinhoAtivo(a) === null,
  );

  const [itens, setItens] = useState([]);
  const [observacoes, setObservacoes] = useState("");

  useEffect(() => {
    if (loadingAtivos || loadingChecklist) return;

    if (checklistExistente?.itens?.length) {
      setItens(
        frota.map((base) => {
          const found = checklistExistente.itens.find(
            (i) => i.tipoCarrinho === base.tipoCarrinho,
          );
          return found
            ? { ...found, total: base.total }
            : {
              tipoCarrinho: base.tipoCarrinho,
              total: base.total,
              quebrados: 0,
            };
        }),
      );
      setObservacoes(checklistExistente.observacoes || "");
    } else {
      setItens(
        frota.map((base) => ({
          tipoCarrinho: base.tipoCarrinho,
          total: base.total,
          quebrados: 0,
          numeroChamado: "",
          descricaoProblema: "",
        })),
      );
      setObservacoes("");
    }
  }, [checklistExistente, ativosCarrinhos, loadingAtivos, loadingChecklist]);

  const mutation = useMutation({
    mutationFn: () =>
      checklistService.salvarCarrinhos({ semana, ano, itens, observacoes }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["checklist-carrinho"] });
      toast.success("Checklist salvo!");
    },
    onError: (e) => toast.error(e.response?.data?.error || "Erro ao salvar"),
  });

  const setItem = (key, val) =>
    setItens((prev) => prev.map((i) => (i.tipoCarrinho === key ? val : i)));
  const totalQuebrados = itens.reduce(
    (s, i) => s + (parseInt(i.quebrados) || 0),
    0,
  );
  const totalGeral = itens.reduce((s, i) => s + (parseInt(i.total) || 0), 0);

  if (loadingAtivos || loadingChecklist)
    return (
      <div className="flex justify-center py-12">
        <Loader2
          size={24}
          className="animate-spin"
          style={{ color: "var(--color-brand-500)" }}
        />
      </div>
    );

  if (!hasAtivosCarrinhos && canEdit) {
    return (
      <div
        className="card animate-fade-in"
        style={{ padding: "28px", textAlign: "center" }}
      >
        <ShoppingCart
          size={34}
          style={{ color: "var(--color-brand-500)", margin: "0 auto 12px" }}
        />
        <h3
          style={{
            fontSize: "1rem",
            fontWeight: 700,
            color: "var(--color-text-primary)",
            marginBottom: "8px",
          }}
        >
          Cadastre os carrinhos em Ativos da Loja
        </h3>
        <p
          style={{
            fontSize: "0.875rem",
            color: "var(--color-text-secondary)",
            maxWidth: "520px",
            margin: "0 auto 18px",
          }}
        >
          O checklist usa os ativos cadastrados na categoria Carrinhos para
          montar a frota semanal da loja.
        </p>
        <Link className="btn btn-primary" to="/ativos">
          Abrir Ativos da Loja
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <div className="flex items-center gap-3 flex-wrap">
        <div
          className="card"
          style={{
            padding: "12px 20px",
            flex: 1,
            minWidth: "140px",
            borderTop: "4px solid var(--color-brand-400)",
          }}
        >
          <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
            Ativos da Loja (Total)
          </p>
          <p
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "var(--color-text-primary)",
            }}
          >
            {totalGeral}
          </p>
        </div>
        <div
          className="card"
          style={{
            padding: "12px 20px",
            flex: 1,
            minWidth: "140px",
            borderTop: "4px solid var(--color-danger)",
          }}
        >
          <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
            Ativos Quebrados
          </p>
          <p
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color:
                totalQuebrados > 0
                  ? "var(--color-danger)"
                  : "var(--color-success)",
            }}
          >
            {totalQuebrados}
          </p>
        </div>
        <div
          className="card"
          style={{
            padding: "12px 20px",
            flex: 1,
            minWidth: "140px",
            borderTop: "4px solid var(--color-warning)",
          }}
        >
          <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
            Taxa de Quebra (%)
          </p>
          <p
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "var(--color-warning)",
            }}
          >
            {totalGeral > 0
              ? ((totalQuebrados / totalGeral) * 100).toFixed(1)
              : 0}
            %
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div
          className="flex items-center justify-between"
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          <span
            style={{
              fontWeight: 600,
              color: "var(--color-text-primary)",
              fontSize: "0.875rem",
            }}
          >
            Carrinhos — Semana {semana} ·{" "}
            {mesDoChecklist(semana, ano).charAt(0).toUpperCase() +
              mesDoChecklist(semana, ano).slice(1)}
            /{ano}
          </span>
        </div>
        {itens.map((item) => {
          const carrinho = CARRINHOS.find((c) => c.key === item.tipoCarrinho);
          return (
            <LinhaCarrinho
              key={item.tipoCarrinho}
              carrinho={carrinho}
              value={item}
              onChange={(val) => setItem(item.tipoCarrinho, val)}
              readOnly={!canEdit}
            />
          );
        })}

        {canEdit && (
          <div
            style={{
              padding: "16px 20px",
              borderTop: "1px solid var(--color-border)",
            }}
          >
            <label className="label">Observações Gerais</label>
            <textarea
              className="input"
              rows={2}
              style={{ resize: "vertical" }}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações adicionais..."
            />
          </div>
        )}
      </div>

      {ativosNaoResolvidos.length > 0 && (
        <div
          className="card"
          style={{
            padding: "14px 18px",
            borderLeft: "4px solid var(--color-warning)",
            background: "rgba(245,158,11,0.06)",
          }}
        >
          <p
            style={{
              fontSize: "0.8125rem",
              fontWeight: 600,
              color: "var(--color-warning)",
              marginBottom: "6px",
            }}
          >
            {ativosNaoResolvidos.length} ativo(s) não puderam ser mapeados para
            o checklist:
          </p>
          <ul style={{ listStyle: "disc", paddingLeft: "18px" }}>
            {ativosNaoResolvidos.map((a) => (
              <li
                key={a.id}
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--color-text-secondary)",
                }}
              >
                <strong>{a.nome}</strong>
                {a.tipo ? ` — tipo: "${a.tipo}"` : " — tipo não preenchido"}
              </li>
            ))}
          </ul>
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--color-text-muted)",
              marginTop: "8px",
            }}
          >
            Acesse{" "}
            <Link to="/ativos" style={{ color: "var(--color-brand-400)" }}>
              Ativos da Loja
            </Link>{" "}
            e defina o campo <strong>Tipo</strong> como: Maria Gorda, Supercar,
            Dois Andares, Prancha, Prancha Perecíveis, Carrinho de Abastecimento
            ou Escada.
          </p>
        </div>
      )}

      {canEdit && (
        <div className="flex justify-end">
          <button
            className="btn btn-primary"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Salvar Checklist Semanal
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Componentes de Visão Corporativa / Regional ───────────────────────────

function GerenteList({ onSelect }) {
  const { data: gerentesRes, isLoading } = useQuery({
    queryKey: ["usuario-gerentes"],
    queryFn: () =>
      usuariosService
        .listar({ role: "GERENTE", limit: 100, ativo: true })
        .then((r) => r.data),
  });

  if (isLoading)
    return (
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}
      >
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="skeleton"
            style={{ height: "100px", borderRadius: "12px" }}
          />
        ))}
      </div>
    );

  const todosGerentes = gerentesRes?.data || [];
  const gerentes = todosGerentes.filter((u) => u.role === "GERENTE");

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <div>
        <h2
          style={{
            fontSize: "1rem",
            fontWeight: 600,
            color: "var(--color-text-primary)",
          }}
        >
          Gerentes Regionais
        </h2>
        <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
          Selecione um gerente para visualizar seus coordenadores
        </p>
      </div>

      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}
      >
        {gerentes.map((g) => (
          <div
            key={g.id}
            className="card hover-scale pointer"
            onClick={() => onSelect(g)}
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
                <Users size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    fontWeight: 700,
                    color: "var(--color-text-primary)",
                    marginBottom: "4px",
                  }}
                >
                  {g.nome}
                </h3>
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--color-text-muted)",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Building2 size={12} /> Regionais:{" "}
                  <strong style={{ color: "var(--color-brand-400)" }}>
                    {g.regiao || "N/A"}
                  </strong>
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
        {gerentes.length === 0 && (
          <div
            className="card text-center p-10 col-span-full"
            style={{ border: "1px dashed var(--color-border)" }}
          >
            <p style={{ color: "var(--color-text-muted)" }}>
              Nenhum gerente encontrado.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function CoordenadorList({ onSelect, regiaoFiltro }) {
  const { data: coordenadoresRes, isLoading } = useQuery({
    queryKey: ["usuario-coordenadores", regiaoFiltro],
    queryFn: () =>
      usuariosService.listar({ role: "COORDENADOR" }).then((r) => r.data),
  });

  if (isLoading)
    return (
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}
      >
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="skeleton"
            style={{ height: "100px", borderRadius: "12px" }}
          />
        ))}
      </div>
    );

  const todosCoords = coordenadoresRes?.data || [];
  const { usuario } = useAuth();

  // Filtra por regional do gerente selecionado (ou do gerente logado) e remove o próprio usuário
  const coordenadores = todosCoords.filter((c) => {
    if (c.id === usuario?.id) return false;
    if (c.role !== "COORDENADOR") return false;
    if (!regiaoFiltro) return true;

    const regioesCoordenador = (c.regiao || "")
      .split(",")
      .map((r) => r.trim().toUpperCase())
      .filter(Boolean);
    const regioesFiltro = regiaoFiltro
      .split(",")
      .map((r) => r.trim().toUpperCase())
      .filter(Boolean);
    return regioesCoordenador.some((r) => regioesFiltro.includes(r));
  });

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <div>
        <h2
          style={{
            fontSize: "1rem",
            fontWeight: 600,
            color: "var(--color-text-primary)",
          }}
        >
          Coordenadores Regionais
        </h2>
        <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
          Selecione um coordenador para visualizar os gestores da regional
        </p>
      </div>

      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}
      >
        {coordenadores.map((c) => (
          <div
            key={c.id}
            className="card hover-scale pointer"
            onClick={() => onSelect(c)}
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
                <Users size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    fontWeight: 700,
                    color: "var(--color-text-primary)",
                    marginBottom: "4px",
                  }}
                >
                  {c.nome}
                </h3>
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--color-text-muted)",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Building2 size={12} /> Regional:{" "}
                  <strong style={{ color: "var(--color-brand-400)" }}>
                    {c.regiao || "N/A"}
                  </strong>
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
        {coordenadores.length === 0 && (
          <div
            className="card text-center p-10 col-span-full"
            style={{ border: "1px dashed var(--color-border)" }}
          >
            <p style={{ color: "var(--color-text-muted)" }}>
              Nenhum coordenador encontrado.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function GestorList({ onSelect, regiao, onBack }) {
  const { usuario: usuarioLogado } = useAuth();
  const { data: gestoresRes, isLoading } = useQuery({
    queryKey: ["usuario-gestores-regional", regiao],
    queryFn: () =>
      usuariosService
        .listar({ role: "GESTOR", ...(regiao ? { regiao } : {}) })
        .then((r) => r.data),
  });

  if (isLoading)
    return (
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}
      >
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="skeleton"
            style={{ height: "100px", borderRadius: "12px" }}
          />
        ))}
      </div>
    );

  const gestores = gestoresRes?.data || [];

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={onBack}
            style={{ padding: "8px" }}
          >
            <ChevronUp className="rotate-270" size={18} />
          </button>
        )}
        <div>
          <h2
            style={{
              fontSize: "1rem",
              fontWeight: 600,
              color: "var(--color-text-primary)",
            }}
          >
            {["ADMINISTRADOR", "DIRETOR", "GERENTE"].includes(
              usuarioLogado?.role,
            )
              ? `Gestores da Regional: ${regiao || ""}`
              : "Gestores da Regional"}
          </h2>
          <p
            style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}
          >
            Selecione um gestor para visualizar o quantitativo de reports
          </p>
        </div>
      </div>

      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}
      >
        {gestores.map((g) => (
          <div
            key={g.id}
            className="card hover-scale pointer"
            onClick={() => onSelect(g)}
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
                <ClipboardCheck size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    fontWeight: 700,
                    color: "var(--color-text-primary)",
                    marginBottom: "4px",
                  }}
                >
                  {g.nome}
                </h3>
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--color-text-muted)",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Building2 size={12} /> {g.loja?.nome || "Loja Não Informada"}
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
        {gestores.length === 0 && (
          <div
            className="card text-center p-10 col-span-full"
            style={{ border: "1px dashed var(--color-border)" }}
          >
            <p style={{ color: "var(--color-text-muted)" }}>
              Nenhum gestor encontrado para esta regional.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function GestorMonthlyView({ gestor, onSelectMonth, onBack }) {
  const agora = new Date();
  const [ano, setAno] = useState(agora.getFullYear());
  const meses = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={onBack}
            style={{ padding: "8px" }}
          >
            <ChevronUp className="rotate-270" size={18} />
          </button>
        )}
        <div>
          <h2
            style={{
              fontSize: "1.125rem",
              fontWeight: 700,
              color: "var(--color-text-primary)",
            }}
          >
            Reports: {gestor?.nome || "Gestor"}
          </h2>
          <p
            style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}
          >
            Quantitativo Mensal por Competência
          </p>
        </div>
      </div>

      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}
      >
        {meses.map((mes, idx) => (
          <MonthCard
            key={mes}
            mesNome={mes}
            mesIdx={idx + 1}
            ano={ano}
            gestorId={gestor?.id}
            onClick={() => onSelectMonth(idx + 1, ano)}
          />
        ))}
      </div>
    </div>
  );
}

function MonthCard({ mesNome, mesIdx, ano, gestorId, onClick }) {
  const inicioMes = startOfMonth(new Date(ano, mesIdx - 1));
  const fimMes = endOfMonth(new Date(ano, mesIdx - 1));
  const semanaInicio = getWeek(inicioMes, { weekStartsOn: 5 });
  const semanaFim = getWeek(fimMes, { weekStartsOn: 5 });
  const semanasNoMes = Math.max(semanaFim - semanaInicio + 1, 1);

  const { data: kpi, isLoading } = useQuery({
    queryKey: ["kpi-mensal-gestor", gestorId, mesIdx, ano, semanasNoMes],
    queryFn: () =>
      checklistService
        .kpiMensal({
          usuarioId: gestorId,
          mes: mesIdx,
          ano,
          weeksToShow: semanasNoMes,
        })
        .then((r) => r.data),
    enabled: !!gestorId,
  });

  const equipSemanas = kpi?.equipamentos?.semanasPrenchidas || 0;
  const carrinhoSemanas = kpi?.carrinhos?.semanasPrenchidas || 0;
  const totalSemanasNoMes = Math.max(
    kpi?.equipamentos?.totalSemanasNoMes || 4,
    1,
  );

  const equipCompleto = equipSemanas === totalSemanasNoMes;
  const carrinhoCompleto = carrinhoSemanas === totalSemanasNoMes;
  const tudoCompleto = equipCompleto && carrinhoCompleto;

  return (
    <div
      className="card hover-scale pointer"
      onClick={onClick}
      style={{
        padding: "20px",
        background: tudoCompleto
          ? "rgba(16,185,129,0.06)"
          : equipSemanas > 0 || carrinhoSemanas > 0
            ? "rgba(59,130,246,0.04)"
            : "rgba(0,0,0,0.02)",
        border: tudoCompleto
          ? "1px solid rgba(16,185,129,0.2)"
          : "1px solid var(--color-border)",
        transition: "all 0.2s ease",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "14px" }}>
        <p
          style={{
            fontWeight: 700,
            fontSize: "1rem",
            color: "var(--color-text-primary)",
            marginBottom: "4px",
          }}
        >
          {mesNome}
        </p>
        <p
          style={{
            fontSize: "0.7rem",
            color: "var(--color-text-muted)",
            fontWeight: 500,
          }}
        >
          {ano} • {totalSemanasNoMes} semanas no mês
        </p>
      </div>

      {isLoading ? (
        <>
          <div
            className="skeleton mt-2"
            style={{ height: "12px", width: "80%", marginBottom: "8px" }}
          />
          <div className="skeleton" style={{ height: "12px", width: "60%" }} />
        </>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Equipamentos */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "6px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <ClipboardCheck
                  size={14}
                  style={{
                    color: equipCompleto
                      ? "var(--color-success)"
                      : "var(--color-brand-500)",
                  }}
                />
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "var(--color-text-secondary)",
                  }}
                >
                  Equipamentos
                </span>
              </div>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: equipCompleto
                    ? "var(--color-success)"
                    : "var(--color-brand-500)",
                  background: equipCompleto
                    ? "rgba(16,185,129,0.1)"
                    : "rgba(59,130,246,0.1)",
                  padding: "2px 8px",
                  borderRadius: "4px",
                }}
              >
                {equipSemanas}/{totalSemanasNoMes}
              </span>
            </div>
            <div style={{ display: "flex", gap: "2px" }}>
              {totalSemanasNoMes > 0 &&
                [...Array(Math.min(totalSemanasNoMes, 4))].map((_, i) => (
                  <div
                    key={`equip-${i}`}
                    style={{
                      height: "6px",
                      flex: 1,
                      borderRadius: "3px",
                      background:
                        i < equipSemanas
                          ? "var(--color-brand-500)"
                          : "var(--color-border)",
                      transition: "all 0.2s ease",
                    }}
                  />
                ))}
            </div>
          </div>

          {/* Carrinhos */}
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "6px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <ShoppingCart
                  size={14}
                  style={{
                    color: carrinhoCompleto
                      ? "var(--color-success)"
                      : "var(--color-warning)",
                  }}
                />
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "var(--color-text-secondary)",
                  }}
                >
                  Carrinhos
                </span>
              </div>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: carrinhoCompleto
                    ? "var(--color-success)"
                    : "var(--color-warning)",
                  background: carrinhoCompleto
                    ? "rgba(16,185,129,0.1)"
                    : "rgba(245,158,11,0.1)",
                  padding: "2px 8px",
                  borderRadius: "4px",
                }}
              >
                {carrinhoSemanas}/{totalSemanasNoMes}
              </span>
            </div>
            <div style={{ display: "flex", gap: "2px" }}>
              {totalSemanasNoMes > 0 &&
                [...Array(Math.min(totalSemanasNoMes, 4))].map((_, i) => (
                  <div
                    key={`carr-${i}`}
                    style={{
                      height: "6px",
                      flex: 1,
                      borderRadius: "3px",
                      background:
                        i < carrinhoSemanas
                          ? "var(--color-warning)"
                          : "var(--color-border)",
                      transition: "all 0.2s ease",
                    }}
                  />
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Status Badge */}
      {!isLoading && (
        <div
          style={{
            marginTop: "12px",
            paddingTop: "12px",
            borderTop: "1px solid var(--color-border)",
          }}
        >
          {tudoCompleto ? (
            <span
              style={{
                fontSize: "0.7rem",
                fontWeight: 700,
                color: "var(--color-success)",
                background: "rgba(16,185,129,0.15)",
                padding: "4px 8px",
                borderRadius: "4px",
                display: "inline-block",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              ✓ Completo
            </span>
          ) : equipSemanas > 0 || carrinhoSemanas > 0 ? (
            <span
              style={{
                fontSize: "0.7rem",
                fontWeight: 600,
                color: "var(--color-text-muted)",
                display: "inline-block",
              }}
            >
              {totalSemanasNoMes - Math.max(equipSemanas, carrinhoSemanas)}{" "}
              pendente(s)
            </span>
          ) : (
            <span
              style={{
                fontSize: "0.7rem",
                fontWeight: 600,
                color: "var(--color-text-muted)",
                display: "inline-block",
              }}
            >
              Sem reports
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function GestorWeeklyList({ gestor, mes, ano, onSelectReport, onBack }) {
  const inicioMes = startOfMonth(new Date(ano, mes - 1));
  const fimMes = endOfMonth(new Date(ano, mes - 1));
  const semanaInicio = getWeek(inicioMes, { weekStartsOn: 5 });
  const semanaFim = getWeek(fimMes, { weekStartsOn: 5 });

  const semanasNoMes = Array.from(
    { length: semanaFim - semanaInicio + 1 },
    (_, i) => semanaInicio + i,
  );
  const semanaHoje = getWeek(new Date(), { weekStartsOn: 5 });

  // Buscar checklists de TODAS as semanas do mês
  const { data: checklistsEquip = [], isLoading: l1 } = useQuery({
    queryKey: [
      "list-equip-gestor-weeks",
      gestor?.id,
      semanaInicio,
      semanaFim,
      ano,
    ],
    queryFn: async () => {
      const promises = semanasNoMes.map((s) =>
        checklistService
          .listarEquipamentos({
            criadoPorId: gestor?.id,
            semana: s,
            ano,
          })
          .then((r) => r.data)
          .catch(() => []),
      );
      const results = await Promise.all(promises);
      return results.flat();
    },
    enabled: !!gestor?.id,
  });

  if (l1)
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button
          className="btn btn-ghost btn-sm"
          onClick={onBack}
          style={{ padding: "8px" }}
        >
          <ChevronUp className="rotate-270" size={18} />
        </button>
        <div>
          <h2
            style={{
              fontSize: "1.125rem",
              fontWeight: 700,
              color: "var(--color-text-primary)",
            }}
          >
            Reports Semanais — {mes}/{ano}
          </h2>
          <p
            style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}
          >
            Visualizando reports de: <strong>{gestor?.nome || "—"}</strong>
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {semanasNoMes.map((s, idx) => {
          const report = checklistsEquip.find((c) => c.semana === s);
          const ehSemanaAtual = s === semanaHoje;
          const temPreenchimento = !!report;

          return (
            <div
              key={s}
              className="card hover-scale pointer"
              onClick={() => onSelectReport(s, ano)}
              style={{
                padding: "16px 20px",
                background: temPreenchimento
                  ? "rgba(16,185,129,0.06)"
                  : "rgba(107,114,128,0.04)",
                border: temPreenchimento
                  ? "1px solid rgba(16,185,129,0.2)"
                  : "1px solid var(--color-border)",
                transition: "all 0.2s ease",
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "8px",
                      background: temPreenchimento
                        ? "var(--color-success)"
                        : "var(--color-border)",
                      color: temPreenchimento
                        ? "#fff"
                        : "var(--color-text-secondary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.875rem",
                      fontWeight: 700,
                      transition: "all 0.2s ease",
                    }}
                  >
                    {temPreenchimento ? "✓" : idx + 1}
                  </div>
                  <div>
                    <h4
                      style={{
                        fontWeight: 600,
                        color: "var(--color-text-primary)",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      Semana {idx + 1}
                      {ehSemanaAtual && (
                        <span
                          style={{
                            fontSize: "0.65rem",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            background: "var(--color-brand-100)",
                            color: "var(--color-brand-600)",
                            textTransform: "uppercase",
                            fontWeight: 700,
                          }}
                        >
                          Atual
                        </span>
                      )}
                    </h4>
                    <p
                      style={{
                        fontSize: "0.75rem",
                        color: temPreenchimento
                          ? "var(--color-success)"
                          : "var(--color-text-muted)",
                        fontWeight: temPreenchimento ? 500 : 400,
                      }}
                    >
                      {temPreenchimento
                        ? `✓ Preenchido em ${new Date(report.criadoEm).toLocaleDateString("pt-BR")}`
                        : "○ Não preenchido"}
                    </p>
                  </div>
                </div>
                {temPreenchimento ? (
                  <span
                    className="badge badge-success"
                    style={{ fontSize: "0.75rem", fontWeight: 600 }}
                  >
                    ✓ Pronto
                  </span>
                ) : (
                  <span
                    className="badge badge-neutral"
                    style={{ fontSize: "0.75rem", fontWeight: 600 }}
                  >
                    Pendente
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Página Principal ────────────────────────────────────────────────────────

export default function ChecklistPage() {
  const { usuario } = useAuth();
  const agora = new Date();

  if (!usuario) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2
          className="animate-spin"
          size={32}
          style={{ color: "var(--color-brand-500)" }}
        />
      </div>
    );
  }

  const [viewState, setViewState] = useState({
    // DIRETOR -> começa nos gerentes
    // GERENTE -> começa nos coordenadores (filtrado pelas suas regionais)
    // COORDENADOR -> começa nos gestores
    // GESTOR -> começa direto nos meses
    mode:
      usuario?.role === "DIRETOR" || usuario?.role === "ADMINISTRADOR"
        ? "GERENTE_LIST"
        : ["GERENTE"].includes(usuario?.role)
          ? "COORDENADOR_LIST"
          : usuario?.role === "COORDENADOR"
            ? "GESTOR_LIST"
            : "MONTHS",
    gestor: usuario?.role === "GESTOR" ? usuario : null,
    gerenteSelecionado: null, // guarda o gerente clicado (para filtrar coords)
    regiaoSelecionada:
      usuario?.role === "GERENTE" ? usuario?.regiao || null : null,
    mes: agora.getMonth() + 1,
    ano: agora.getFullYear(),
    week: null,
  });

  const [tab, setTab] = useState("equipamentos");
  const canEdit = usuario?.role === "GESTOR";

  // ─── DIRETOR: lista de gerentes ───────────────────────────────────────────
  if (viewState.mode === "GERENTE_LIST") {
    return (
      <GerenteList
        onSelect={(g) =>
          setViewState((p) => ({
            ...p,
            mode: "COORDENADOR_LIST",
            gerenteSelecionado: g,
            // regiaoSelecionada permanece null até selecionar coordenador
          }))
        }
      />
    );
  }

  if (viewState.mode === "COORDENADOR_LIST") {
    return (
      <CoordenadorList
        // Filtra por regional do gerente selecionado (DIRETOR) ou do próprio gerente logado
        regiaoFiltro={
          viewState.gerenteSelecionado?.regiao || // DIRETOR que selecionou um gerente
          (usuario?.role === "GERENTE" ? usuario.regiao : null) // GERENTE logado
        }
        onSelect={(c) =>
          setViewState((p) => ({
            ...p,
            mode: "GESTOR_LIST",
            regiaoSelecionada: c.regiao,
          }))
        }
      />
    );
  }

  if (viewState.mode === "GESTOR_LIST") {
    return (
      <GestorList
        regiao={viewState.regiaoSelecionada}
        onBack={
          // DIRETOR volta para coordenadores (que volta para gerentes)
          // GERENTE volta para coordenadores
          // COORDENADOR não tem voltar (é a tela inicial)
          ["ADMINISTRADOR", "DIRETOR", "GERENTE"].includes(usuario?.role)
            ? () =>
              setViewState((p) => ({
                ...p,
                mode: "COORDENADOR_LIST",
                regiaoSelecionada: null,
              }))
            : null
        }
        onSelect={(g) =>
          setViewState((p) => ({ ...p, mode: "MONTHS", gestor: g }))
        }
      />
    );
  }

  if (viewState.mode === "MONTHS") {
    return (
      <GestorMonthlyView
        gestor={viewState.gestor}
        onBack={() =>
          setViewState((p) => ({ ...p, mode: "GESTOR_LIST", gestor: null }))
        }
        onSelectMonth={(m, a) =>
          setViewState((p) => ({ ...p, mode: "WEEKS", mes: m, ano: a }))
        }
      />
    );
  }

  if (viewState.mode === "WEEKS") {
    return (
      <GestorWeeklyList
        gestor={viewState.gestor}
        mes={viewState.mes}
        ano={viewState.ano}
        onBack={() => setViewState((p) => ({ ...p, mode: "MONTHS" }))}
        onSelectReport={(s, a) =>
          setViewState((p) => ({ ...p, mode: "FORM", week: s, ano: a }))
        }
      />
    );
  }

  if (viewState.mode === "FORM") {
    return (
      <div className="flex flex-col gap-5 animate-fade-in">
        <div className="flex items-center gap-3">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setViewState((p) => ({ ...p, mode: "WEEKS" }))}
            style={{ padding: "8px" }}
          >
            <ChevronUp className="rotate-270" size={18} />
          </button>
          <div>
            <h1
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "var(--color-text-primary)",
              }}
            >
              {canEdit ? "Preencher Checklist" : "Report de Manutenção"} —
              Semana {viewState.week}
            </h1>
            <p
              style={{
                fontSize: "0.8125rem",
                color: "var(--color-text-muted)",
              }}
            >
              Competência:{" "}
              <strong style={{ color: "var(--color-brand-400)" }}>
                {mesDoChecklist(viewState.week, viewState.ano)} de{" "}
                {viewState.ano}
              </strong>
            </p>
          </div>
        </div>

        <div
          className="flex gap-1"
          style={{ borderBottom: "2px solid var(--color-border)" }}
        >
          {[
            {
              key: "equipamentos",
              icon: ClipboardCheck,
              label: "Equipamentos",
            },
            {
              key: "carrinhos",
              icon: ShoppingCart,
              label: "Carrinhos de Loja",
            },
          ].map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="flex items-center gap-2"
              style={{
                padding: "10px 20px",
                fontWeight: tab === key ? 700 : 500,
                fontSize: "0.875rem",
                color:
                  tab === key
                    ? "var(--color-brand-400)"
                    : "var(--color-text-secondary)",
                borderBottom:
                  tab === key
                    ? "2px solid var(--color-brand-500)"
                    : "2px solid transparent",
                marginBottom: "-2px",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        {tab === "equipamentos" && (
          <TabEquipamentos
            semana={viewState.week}
            ano={viewState.ano}
            usuario={viewState.gestor}
            canEdit={canEdit}
          />
        )}
        {tab === "carrinhos" && (
          <TabCarrinhos
            semana={viewState.week}
            ano={viewState.ano}
            usuario={viewState.gestor}
            canEdit={canEdit}
          />
        )}
      </div>
    );
  }

  return null;
}
