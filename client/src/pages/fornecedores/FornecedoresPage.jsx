// src/pages/fornecedores/FornecedoresPage.jsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { fornecedoresService } from "../../services";
import {
  Plus,
  X,
  Loader2,
  Pencil,
  Trash2,
  Search,
  Building2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";

const SEGMENTOS = [
  "AR_CONDICIONADO",
  "CARRINHO_CLIENTE",
  "CARRO_PIPA",
  "LIMPEZA_ESGOTO",
  "CIVIL",
  "COZINHA_REFEITORIO",
  "ELETRICA",
  "TRANSPALETEIRA",
  "EMPILHADEIRA",
  "GERADOR",
  "HIDRAULICA",
  "LAUDOS",
  "NOBREAK",
  "MATERIAL_MANUTENCAO",
  "PINTURA",
  "REFRIGERACAO",
  "REFRIGERACAO_PECAS",
  "SERRALHERIA",
  "SISTEMA_INCENDIO",
  "LOCACAO",
  "LIMPEZA",
  "TRATAMENTO_AGUA",
  "PORTA_PALETES",
  "FERRAMENTAS",
  "COMUNICACAO_VISUAL",
  "ELEVADORES",
  "ESTEIRAS",
  "TELHADO",
  "CHECKOUT",
  "VIDRACARIA",
  "FATIADORA",
  "SERRA_FITA",
  "EMBALADORA",
  "MAQUINA_VACUO",
  "LAVA_LOUCA",
  "CAFETERIA",
  "SISTEMA_SOM",
  "FRENTE_CAIXA",
  "GALERIAS",
  "FRETE",
  "OUTROS",
];

const formatarSegmento = (s) =>
  s
    ?.split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ") || s;

const somenteDigitos = (valor = "") => String(valor).replace(/\D/g, "");

const formatarCnpj = (valor = "") => {
  const digitos = somenteDigitos(valor).slice(0, 14);

  return digitos
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
};

const formatarTelefone = (valor = "") => {
  const digitos = somenteDigitos(valor).slice(0, 11);

  if (digitos.length <= 10) {
    return digitos
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  return digitos
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
};

const LIMIT = 20;

/* ── Modal criar/editar ─────────────────────────────────────────────────── */
function FornecedorModal({ fornecedor, onClose }) {
  const qc = useQueryClient();
  const isEdit = !!fornecedor;
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: fornecedor
      ? {
          ...fornecedor,
          cnpj: formatarCnpj(fornecedor.cnpj),
          telefone: formatarTelefone(fornecedor.telefone),
        }
      : {},
  });

  const cnpjField = register("cnpj", {
    required: "Obrigatório",
    setValueAs: somenteDigitos,
    validate: (valor) =>
      somenteDigitos(valor).length === 14 || "CNPJ deve ter 14 dígitos",
    onChange: (e) => {
      e.target.value = formatarCnpj(e.target.value);
    },
  });
  const telefoneField = register("telefone", {
    setValueAs: somenteDigitos,
    onChange: (e) => {
      e.target.value = formatarTelefone(e.target.value);
    },
  });

  const mutation = useMutation({
    mutationFn: (data) =>
      isEdit
        ? fornecedoresService.atualizar(fornecedor.id, {
            ...data,
            cnpj: somenteDigitos(data.cnpj),
            telefone: somenteDigitos(data.telefone),
          })
        : fornecedoresService.criar({
            ...data,
            cnpj: somenteDigitos(data.cnpj),
            telefone: somenteDigitos(data.telefone),
          }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fornecedores"] });
      toast.success(isEdit ? "Atualizado!" : "Criado!");
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
      <div className="modal-content animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>
            {isEdit ? "Editar Fornecedor" : "Novo Fornecedor"}
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
          <div>
            <label className="label">Nome da Empresa *</label>
            <input
              className="input"
              {...register("nome", { required: "Obrigatório" })}
            />
            {errors.nome && (
              <p className="field-error">{errors.nome.message}</p>
            )}
          </div>
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: "1fr 1fr" }}
          >
            <div>
              <label className="label">CNPJ *</label>
              <input
                className="input"
                placeholder="00.000.000/0000-00"
                maxLength={18}
                {...cnpjField}
              />
              {errors.cnpj && (
                <p className="field-error">{errors.cnpj.message}</p>
              )}
            </div>
            <div>
              <label className="label">Segmento *</label>
              <select
                className="select"
                {...register("segmento", { required: "Obrigatório" })}
              >
                <option value="">Selecione...</option>
                {SEGMENTOS.map((s) => (
                  <option key={s} value={s}>
                    {formatarSegmento(s)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: "1fr 1fr" }}
          >
            <div>
              <label className="label">Telefone</label>
              <input
                className="input"
                placeholder="(11) 99999-0000"
                maxLength={15}
                {...telefoneField}
              />
            </div>
            <div>
              <label className="label">E-mail</label>
              <input type="email" className="input" {...register("email")} />
            </div>
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
              {mutation.isPending && (
                <Loader2 size={16} className="animate-spin" />
              )}
              {isEdit ? "Salvar" : "Criar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Paginação ──────────────────────────────────────────────────────────── */
function Paginacao({ paginaAtual, totalPaginas, onMudar }) {
  if (totalPaginas <= 1) return null;

  const visiveis = new Set(
    [1, totalPaginas, paginaAtual, paginaAtual - 1, paginaAtual + 1].filter(
      (p) => p >= 1 && p <= totalPaginas,
    ),
  );
  const lista = [...visiveis].sort((a, b) => a - b);

  return (
    <div className="flex items-center justify-center gap-1 mt-2">
      <button
        className="btn btn-ghost btn-sm"
        style={{ padding: "4px 8px" }}
        disabled={paginaAtual === 1}
        onClick={() => onMudar(paginaAtual - 1)}
      >
        <ChevronLeft size={16} />
      </button>

      {lista.map((p, i) => {
        const prev = lista[i - 1];
        return (
          <span key={p} className="flex items-center gap-1">
            {prev && p - prev > 1 && (
              <span
                style={{
                  color: "var(--color-text-muted)",
                  padding: "0 2px",
                  fontSize: "0.875rem",
                }}
              >
                …
              </span>
            )}
            <button
              className={`btn btn-sm ${paginaAtual === p ? "btn-primary" : "btn-ghost"}`}
              style={{ minWidth: "32px", padding: "4px 8px" }}
              onClick={() => onMudar(p)}
            >
              {p}
            </button>
          </span>
        );
      })}

      <button
        className="btn btn-ghost btn-sm"
        style={{ padding: "4px 8px" }}
        disabled={paginaAtual === totalPaginas}
        onClick={() => onMudar(paginaAtual + 1)}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

/* ── Página principal ───────────────────────────────────────────────────── */
export default function FornecedoresPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState(null);
  const [page, setPage] = useState(1);
  const [filtros, setFiltros] = useState({
    nome: "",
    segmento: "",
    cnpj: "",
    regiao: "",
  });

  const atualizarFiltro = (campo, valor) => {
    setFiltros((f) => ({ ...f, [campo]: valor }));
    setPage(1);
  };

  const { data, isLoading } = useQuery({
    queryKey: ["fornecedores", filtros, page],
    queryFn: () =>
      fornecedoresService
        .listar({ ...filtros, page, limit: LIMIT })
        .then((r) => r.data),
    placeholderData: (prev) => prev,
  });

  const { data: regioes = [] } = useQuery({
    queryKey: ["fornecedores-regioes"],
    queryFn: () => fornecedoresService.listarRegioes().then((r) => r.data),
  });

  const fornecedores = data?.data ?? [];
  const meta = data?.meta ?? { total: 0, page: 1 };
  const totalPaginas = Math.ceil(meta.total / LIMIT);
  const inicio = (page - 1) * LIMIT + 1;
  const fim = Math.min(page * LIMIT, meta.total);

  const remover = useMutation({
    mutationFn: (id) => fornecedoresService.remover(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fornecedores"] });
      toast.success("Removido!");
    },
    onError: () => toast.error("Erro ao remover"),
  });

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Filtros + botão novo */}
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
              style={{ paddingLeft: "32px", width: "180px" }}
              placeholder="Nome..."
              value={filtros.nome}
              onChange={(e) => atualizarFiltro("nome", e.target.value)}
            />
          </div>
          <input
            className="input"
            style={{ width: "180px" }}
            placeholder="CNPJ..."
            value={formatarCnpj(filtros.cnpj)}
            maxLength={18}
            onChange={(e) =>
              atualizarFiltro(
                "cnpj",
                somenteDigitos(e.target.value).slice(0, 14),
              )
            }
          />
          <select
            className="select"
            style={{ width: "auto" }}
            value={filtros.regiao}
            onChange={(e) => atualizarFiltro("regiao", e.target.value)}
          >
            <option value="">Todas as regiões</option>
            {regioes.map((regiao) => (
              <option key={regiao} value={regiao}>
                {regiao}
              </option>
            ))}
          </select>
          <select
            className="select"
            style={{ width: "auto" }}
            value={filtros.segmento}
            onChange={(e) => atualizarFiltro("segmento", e.target.value)}
          >
            <option value="">Todos os segmentos</option>
            {SEGMENTOS.map((s) => (
              <option key={s} value={s}>
                {formatarSegmento(s)}
              </option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary" onClick={() => setModal("novo")}>
          <Plus size={16} /> Novo Fornecedor
        </button>
      </div>

      {/* Contador de resultados */}
      {!isLoading && meta.total > 0 && (
        <div
          style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}
        >
          Exibindo {inicio}–{fim} de {meta.total} fornecedor
          {meta.total !== 1 ? "es" : ""}
        </div>
      )}

      {/* Grid de cards */}
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))" }}
      >
        {isLoading ? (
          [...Array(LIMIT)].map((_, i) => (
            <div
              key={i}
              className="skeleton"
              style={{ height: "120px", borderRadius: "12px" }}
            />
          ))
        ) : fornecedores.length === 0 ? (
          <div
            style={{
              gridColumn: "1/-1",
              textAlign: "center",
              color: "var(--color-text-muted)",
              padding: "3rem",
              fontSize: "0.875rem",
            }}
          >
            Nenhum fornecedor encontrado
          </div>
        ) : (
          fornecedores.map((f) => (
            <div key={f.id} className="card" style={{ position: "relative" }}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0"
                    style={{ background: "var(--color-surface-600)" }}
                  >
                    <Building2
                      size={16}
                      style={{ color: "var(--color-brand-400)" }}
                    />
                  </div>
                  <div>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        color: "var(--color-text-primary)",
                      }}
                    >
                      {f.nome}
                    </div>
                    <div className="flex flex-col justify-between">
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--color-text-muted)",
                          marginTop: "2px",
                        }}
                      >
                        CNPJ: {formatarCnpj(f.cnpj)}
                      </div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--color-text-muted)",
                          marginBlock: "2px",
                        }}
                      >
                        Região: {f.regiao}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setModal(f)}
                    style={{ padding: "4px 6px" }}
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ padding: "4px 6px", color: "var(--color-danger)" }}
                    onClick={() => {
                      if (confirm("Remover fornecedor?")) remover.mutate(f.id);
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <div
                style={{
                  paddingTop: "12px",
                  borderTop: "1px solid var(--color-border)",
                }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="badge badge-brand"
                    style={{ fontSize: "0.7rem" }}
                  >
                    {formatarSegmento(f.segmento)}
                  </span>
                  {f.telefone && (
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      Telefone: {formatarTelefone(f.telefone)}
                    </span>
                  )}
                </div>
                {f.email && (
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--color-text-muted)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      marginTop: "4px",
                      paddingTop: "2px"
                    }}
                  >
                    {f.email}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Paginação */}
      <Paginacao
        paginaAtual={page}
        totalPaginas={totalPaginas}
        onMudar={setPage}
      />

      {modal && (
        <FornecedorModal
          fornecedor={modal === "novo" ? null : modal}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
