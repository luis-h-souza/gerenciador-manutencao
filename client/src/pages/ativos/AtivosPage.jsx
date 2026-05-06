import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { ativosService, lojasService } from "../../services";
import { useAuth } from "../../contexts/AuthContext";
import {
  Plus,
  X,
  Loader2,
  Pencil,
  Trash2,
  Search,
  Boxes,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";

const LIMIT = 20;
const STATUS = [
  { value: "ATIVO", label: "Ativo" },
  { value: "EM_MANUTENCAO", label: "Em manutenção" },
  { value: "INATIVO", label: "Inativo" },
];
const CATEGORIAS = [
  "Carrinhos",
  "Refrigeração",
  "Ar Condicionado",
  "Cozinha",
  "Empilhadeira",
  "Transpaleteira",
  "Elétrica",
  "Hidráulica",
  "Civil",
  "Segurança",
  "Outros",
];

function Paginacao({ paginaAtual, totalPaginas, onMudar }) {
  if (totalPaginas <= 1) return null;
  const visiveis = new Set(
    [1, totalPaginas, paginaAtual, paginaAtual - 1, paginaAtual + 1].filter((p) => p >= 1 && p <= totalPaginas),
  );
  const lista = [...visiveis].sort((a, b) => a - b);

  return (
    <div className="flex items-center justify-center gap-1 mt-2">
      <button className="btn btn-ghost btn-sm" style={{ padding: "4px 8px" }} disabled={paginaAtual === 1} onClick={() => onMudar(paginaAtual - 1)}>
        <ChevronLeft size={16} />
      </button>
      {lista.map((p, i) => {
        const prev = lista[i - 1];
        return (
          <span key={p} className="flex items-center gap-1">
            {prev && p - prev > 1 && <span style={{ color: "var(--color-text-muted)", padding: "0 2px" }}>...</span>}
            <button className={`btn btn-sm ${paginaAtual === p ? "btn-primary" : "btn-ghost"}`} style={{ minWidth: "32px", padding: "4px 8px" }} onClick={() => onMudar(p)}>
              {p}
            </button>
          </span>
        );
      })}
      <button className="btn btn-ghost btn-sm" style={{ padding: "4px 8px" }} disabled={paginaAtual === totalPaginas} onClick={() => onMudar(paginaAtual + 1)}>
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

function AtivoModal({ ativo, onClose }) {
  const qc = useQueryClient();
  const isEdit = !!ativo;
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: ativo || { quantidade: 1, status: "ATIVO" },
  });

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? ativosService.atualizar(ativo.id, data) : ativosService.criar(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ativos"] });
      toast.success(isEdit ? "Ativo atualizado!" : "Ativo cadastrado!");
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || err.response?.data?.error || "Erro ao salvar ativo"),
  });

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content animate-fade-in" style={{ maxWidth: "720px" }}>
        <div className="flex items-center justify-between mb-5">
          <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>{isEdit ? "Editar Ativo" : "Novo Ativo"}</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: "4px" }}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="flex flex-col gap-4">
          <div className="grid gap-4" style={{ gridTemplateColumns: "1.5fr 1fr" }}>
            <div>
              <label className="label">Nome *</label>
              <input className="input" placeholder="Ex: Chiller principal, carrinho abastecimento" {...register("nome", { required: "Obrigatório" })} />
              {errors.nome && <p className="field-error">{errors.nome.message}</p>}
            </div>
            <div>
              <label className="label">Categoria *</label>
              <input className="input" list="categorias-ativos" {...register("categoria", { required: "Obrigatório" })} />
              <datalist id="categorias-ativos">
                {CATEGORIAS.map((c) => <option key={c} value={c} />)}
              </datalist>
              {errors.categoria && <p className="field-error">{errors.categoria.message}</p>}
            </div>
          </div>

          <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr 100px" }}>
            <div>
              <label className="label">Tipo</label>
              <input className="input" placeholder="Ex: Split, forno, prancha" {...register("tipo")} />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="select" {...register("status")}>
                {STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Qtd.</label>
              <input className="input" type="number" min="1" {...register("quantidade", { valueAsNumber: true, min: 1 })} />
            </div>
          </div>

          <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div>
              <label className="label">Fabricante</label>
              <input className="input" {...register("fabricante")} />
            </div>
            <div>
              <label className="label">Modelo</label>
              <input className="input" {...register("modelo")} />
            </div>
          </div>

          <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div>
              <label className="label">Nº de Série</label>
              <input className="input" {...register("numeroSerie")} />
            </div>
            <div>
              <label className="label">Patrimônio</label>
              <input className="input" {...register("patrimonio")} />
            </div>
          </div>

          <div>
            <label className="label">Localização</label>
            <input className="input" placeholder="Ex: cozinha, doca, sala de máquinas" {...register("localizacao")} />
          </div>

          <div>
            <label className="label">Observações</label>
            <textarea className="input" rows={3} style={{ resize: "vertical" }} {...register("observacoes")} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 size={16} className="animate-spin" />}
              {isEdit ? "Salvar" : "Cadastrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AtivosPage() {
  const { usuario } = useAuth();
  const qc = useQueryClient();
  const canEdit = usuario?.role === "GESTOR";
  const [modal, setModal] = useState(null);
  const [page, setPage] = useState(1);
  const [filtros, setFiltros] = useState({ nome: "", categoria: "", status: "", regiao: "", unidade: "" });

  const atualizarFiltro = (campo, valor) => {
    setFiltros((f) => ({ ...f, [campo]: valor }));
    setPage(1);
  };

  const { data: regioes = [] } = useQuery({
    queryKey: ["lojas-regioes"],
    queryFn: () => lojasService.listarRegioes().then((r) => r.data),
  });

  const { data: lojasData } = useQuery({
    queryKey: ["lojas-ativos", filtros.regiao],
    queryFn: () => lojasService.listar({ regiao: filtros.regiao, limit: 500 }).then((r) => r.data),
    enabled: !canEdit,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["ativos", filtros, page],
    queryFn: () => ativosService.listar({ ...filtros, page, limit: LIMIT }).then((r) => r.data),
    placeholderData: (prev) => prev,
  });

  const ativos = data?.data ?? [];
  const meta = data?.meta ?? { total: 0 };
  const totalPaginas = Math.ceil(meta.total / LIMIT);
  const inicio = (page - 1) * LIMIT + 1;
  const fim = Math.min(page * LIMIT, meta.total);

  const remover = useMutation({
    mutationFn: (id) => ativosService.remover(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ativos"] });
      toast.success("Ativo inativado");
    },
    onError: () => toast.error("Erro ao inativar ativo"),
  });

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search size={15} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
            <input className="input" style={{ paddingLeft: "32px", width: "220px" }} placeholder="Buscar ativo..." value={filtros.nome} onChange={(e) => atualizarFiltro("nome", e.target.value)} />
          </div>
          <input className="input" style={{ width: "160px" }} placeholder="Categoria..." value={filtros.categoria} onChange={(e) => atualizarFiltro("categoria", e.target.value)} />
          <select className="select" style={{ width: "auto" }} value={filtros.status} onChange={(e) => atualizarFiltro("status", e.target.value)}>
            <option value="">Todos status</option>
            {STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          {!canEdit && (
            <>
              <select className="select" style={{ width: "auto" }} value={filtros.regiao} onChange={(e) => atualizarFiltro("regiao", e.target.value)}>
                <option value="">Todas regiões</option>
                {regioes.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <select className="select" style={{ width: "auto", maxWidth: "220px" }} value={filtros.unidade} onChange={(e) => atualizarFiltro("unidade", e.target.value)}>
                <option value="">Todas lojas</option>
                {(lojasData?.data || []).map((l) => <option key={l.id} value={l.nome}>{l.numero} - {l.nome}</option>)}
              </select>
            </>
          )}
        </div>
        {canEdit && (
          <button className="btn btn-primary" onClick={() => setModal("novo")}>
            <Plus size={16} /> Novo Ativo
          </button>
        )}
      </div>

      {!canEdit && (
        <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
          Visualização por hierarquia. Alterações ficam disponíveis apenas para gestores da loja.
        </div>
      )}

      {!isLoading && meta.total > 0 && (
        <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
          Exibindo {inicio}-{fim} de {meta.total} ativo{meta.total !== 1 ? "s" : ""}
        </div>
      )}

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Ativo</th>
              <th>Categoria</th>
              <th>Loja</th>
              <th>Status</th>
              <th>Qtd.</th>
              <th>Identificação</th>
              <th>Localização</th>
              {canEdit && <th style={{ width: "86px" }}>Ações</th>}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={canEdit ? 8 : 7}><div className="flex justify-center py-8"><Loader2 size={22} className="animate-spin" style={{ color: "var(--color-brand-500)" }} /></div></td></tr>
            ) : ativos.length === 0 ? (
              <tr><td colSpan={canEdit ? 8 : 7} style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "2rem", fontSize: "0.875rem" }}>Nenhum ativo encontrado</td></tr>
            ) : ativos.map((a) => (
              <tr key={a.id}>
                <td>
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg" style={{ background: "var(--color-surface-600)" }}>
                      <Boxes size={15} style={{ color: "var(--color-brand-400)" }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{a.nome}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{[a.fabricante, a.modelo].filter(Boolean).join(" / ") || a.tipo || "-"}</div>
                    </div>
                  </div>
                </td>
                <td><span className="badge badge-brand" style={{ fontSize: "0.7rem" }}>{a.categoria}</span></td>
                <td style={{ fontSize: "0.8125rem" }}>{a.unidade}<br /><span style={{ color: "var(--color-text-muted)" }}>{a.regiao}</span></td>
                <td style={{ fontSize: "0.8125rem" }}>{STATUS.find((s) => s.value === a.status)?.label || a.status}</td>
                <td>{a.quantidade}</td>
                <td style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>{a.patrimonio || a.numeroSerie || "-"}</td>
                <td style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>{a.localizacao || "-"}</td>
                {canEdit && (
                  <td>
                    <div className="flex gap-1">
                      <button className="btn btn-ghost btn-sm" onClick={() => setModal(a)} style={{ padding: "4px 6px" }}><Pencil size={13} /></button>
                      <button className="btn btn-ghost btn-sm" onClick={() => remover.mutate(a.id)} style={{ padding: "4px 6px", color: "var(--color-danger)" }}><Trash2 size={13} /></button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Paginacao paginaAtual={page} totalPaginas={totalPaginas} onMudar={setPage} />

      {modal && <AtivoModal ativo={modal === "novo" ? null : modal} onClose={() => setModal(null)} />}
    </div>
  );
}
