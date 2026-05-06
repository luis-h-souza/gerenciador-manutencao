import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { ativosService, lojasService, usuariosService } from "../../services";
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
  UserRound,
  MapPin,
  Store,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
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
const TIPOS_ATIVOS = [
  "Maria Gorda",
  "Supercar",
  "Dois Andares",
  "Prancha",
  "Prancha Perecíveis",
  "Carrinho de Abastecimento",
  "Escada",
  "Chiller",
  "Split",
  "Self",
  "Forno",
  "Fatiadora",
  "Serra Fita",
  "Empilhadeira Elétrica",
  "Transpaleteira",
];

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
              <input className="input" list="tipos-ativos" placeholder="Ex: Split, forno, prancha" {...register("tipo")} />
              <datalist id="tipos-ativos">
                {TIPOS_ATIVOS.map((t) => <option key={t} value={t} />)}
              </datalist>
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
  
  const hasDrilldown = [
    "ADMINISTRADOR",
    "DIRETOR",
    "GERENTE",
    "COORDENADOR",
  ].includes(usuario?.role);

  const getInitialEtapa = (role) => {
    if (!hasDrilldown) return "ativos";
    if (["ADMINISTRADOR", "DIRETOR"].includes(role)) return "gerentes";
    if (role === "GERENTE") return "coordenadores";
    if (role === "COORDENADOR") return "regionais";
    return "ativos";
  };

  const [etapa, setEtapa] = useState(() => getInitialEtapa(usuario?.role));
  const [gerenteSelecionado, setGerenteSelecionado] = useState(null);
  const [coordenadorSelecionado, setCoordenadorSelecionado] = useState(null);
  const [regionalSelecionada, setRegionalSelecionada] = useState(null);
  const [lojaSelecionada, setLojaSelecionada] = useState(null);

  const [modal, setModal] = useState(null);
  const [page, setPage] = useState(1);
  const [filtros, setFiltros] = useState({ nome: "", categoria: "", status: "" });

  const atualizarFiltro = (campo, valor) => {
    setFiltros((f) => ({ ...f, [campo]: valor }));
    setPage(1);
  };

  // Queries para Hierarquia
  const { data: gerentesRes, isLoading: loadingGerentes } = useQuery({
    queryKey: ["gerentes-ativos"],
    queryFn: () => usuariosService.listar({ role: "GERENTE", limit: 100, ativo: true }).then((r) => r.data?.data || []),
    enabled: ["ADMINISTRADOR", "DIRETOR"].includes(usuario?.role) && etapa === "gerentes",
  });

  const gerentesData = (gerentesRes || []).filter(u => u.role === 'GERENTE');

  const { data: coordenadoresData, isLoading: loadingCoordenadores } = useQuery({
    queryKey: ["coordenadores-ativos"],
    queryFn: () => usuariosService.listar({ role: "COORDENADOR", limit: 100, ativo: true }).then((r) => r.data?.data || []),
    enabled: hasDrilldown && etapa === "coordenadores",
  });

  const coordenadoresFiltrados = (() => {
    if (!coordenadoresData) return [];
    let base = coordenadoresData.filter(u => u.role === "COORDENADOR" && u.id !== usuario?.id);
    if (usuario?.role === "GERENTE") return base.filter((c) => hasOverlap(c.regiao, usuario.regiao));
    if (gerenteSelecionado) return base.filter((c) => hasOverlap(c.regiao, gerenteSelecionado.regiao));
    return base;
  })();

  const regioesDisponiveis = (() => {
    if (coordenadorSelecionado) return splitRegions(coordenadorSelecionado.regiao);
    if (usuario?.role === "COORDENADOR") return splitRegions(usuario.regiao);
    return [];
  })();

  const { data: lojasRes, isLoading: loadingLojas } = useQuery({
    queryKey: ["lojas-ativos-list", regionalSelecionada],
    queryFn: () => lojasService.listar({ regiao: regionalSelecionada, limit: 1000 }).then((r) => r.data),
    enabled: etapa === "lojas" && !!regionalSelecionada,
  });

  const { data, isLoading: loadingAtivos } = useQuery({
    queryKey: ["ativos", filtros, page, regionalSelecionada, lojaSelecionada?.nome],
    queryFn: () => 
      ativosService.listar({ 
        ...filtros, 
        regiao: regionalSelecionada, 
        unidade: lojaSelecionada?.nome,
        page, 
        limit: LIMIT 
      }).then((r) => r.data),
    enabled: etapa === "ativos",
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
    <div className="flex flex-col gap-6 animate-fade-in pb-10">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-1">
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
          Ativos da Loja
        </h1>
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
          Gestão de inventário e equipamentos por unidade
        </p>
      </div>

      {/* ——— Lista de Gerentes ——— */}
      {etapa === "gerentes" && (
        <div className="flex flex-col gap-6">
          <div>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700 }}>Gerentes Regionais</h2>
            <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>Selecione um gerente para ver os coordenadores</p>
          </div>
          {loadingGerentes ? (
            <div className="flex justify-center p-12"><Loader2 className="animate-spin" style={{ color: "var(--color-brand-500)" }} size={32} /></div>
          ) : (
            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
              {gerentesData?.map((g) => (
                <div key={g.id} className="card hover-scale pointer" onClick={() => { setGerenteSelecionado(g); setEtapa("coordenadores"); }} style={{ padding: "20px" }}>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl" style={{ background: "var(--color-brand-100)", color: "var(--color-brand-600)" }}><UserRound size={24} /></div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontWeight: 700 }}>{g.nome}</h3>
                      <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{splitRegions(g.regiao).length} regionais</p>
                    </div>
                    <ChevronRight size={18} style={{ color: "var(--color-text-muted)" }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ——— Lista de Coordenadores ——— */}
      {etapa === "coordenadores" && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            {["ADMINISTRADOR", "DIRETOR"].includes(usuario?.role) && (
              <button className="btn btn-ghost btn-sm" onClick={() => { setEtapa("gerentes"); setGerenteSelecionado(null); }} style={{ padding: "8px" }}><ArrowLeft size={18} /></button>
            )}
            <div>
              <h2 style={{ fontSize: "1.125rem", fontWeight: 700 }}>Coordenadores</h2>
              <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>{gerenteSelecionado ? `Equipe de ${gerenteSelecionado.nome}` : "Selecione um coordenador"}</p>
            </div>
          </div>
          {loadingCoordenadores ? (
            <div className="flex justify-center p-12"><Loader2 className="animate-spin" style={{ color: "var(--color-brand-500)" }} size={32} /></div>
          ) : (
            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
              {coordenadoresFiltrados.map((c) => (
                <div key={c.id} className="card hover-scale pointer" onClick={() => { setCoordenadorSelecionado(c); setEtapa("regionais"); }} style={{ padding: "20px" }}>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl" style={{ background: "var(--color-surface-600)", color: "var(--color-text-primary)" }}><UserRound size={24} /></div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontWeight: 700 }}>{c.nome}</h3>
                      <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{splitRegions(c.regiao).length} regionais</p>
                    </div>
                    <ChevronRight size={18} style={{ color: "var(--color-text-muted)" }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ——— Lista de Regionais ——— */}
      {etapa === "regionais" && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            {["ADMINISTRADOR", "DIRETOR", "GERENTE"].includes(usuario?.role) && (
              <button className="btn btn-ghost btn-sm" onClick={() => { setEtapa("coordenadores"); setCoordenadorSelecionado(null); }} style={{ padding: "8px" }}><ArrowLeft size={18} /></button>
            )}
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700 }}>Regionais</h2>
          </div>
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
            {regioesDisponiveis.map((r) => (
              <div key={r} className="card hover-scale pointer" onClick={() => { setRegionalSelecionada(r); setEtapa("lojas"); }} style={{ padding: "20px" }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "var(--color-brand-100)", color: "var(--color-brand-600)" }}><MapPin size={20} /></div>
                    <h3 style={{ fontWeight: 700 }}>{r}</h3>
                  </div>
                  <ChevronRight size={20} style={{ color: "var(--color-text-muted)" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ——— Lista de Lojas ——— */}
      {etapa === "lojas" && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <button className="btn btn-ghost btn-sm" onClick={() => { setRegionalSelecionada(null); setEtapa("regionais"); }} style={{ padding: "8px" }}><ArrowLeft size={18} /></button>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700 }}>Lojas da Regional {regionalSelecionada}</h2>
          </div>
          {loadingLojas ? (
            <div className="flex justify-center p-12"><Loader2 className="animate-spin" size={32} style={{ color: "var(--color-brand-500)" }} /></div>
          ) : (
            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
              {(lojasRes?.data || []).sort((a, b) => a.nome.localeCompare(b.nome)).map((l) => (
                <div key={l.id} className="card hover-scale pointer" onClick={() => { setLojaSelecionada(l); setEtapa("ativos"); }} style={{ padding: "20px" }}>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl" style={{ background: "var(--color-brand-100)", color: "var(--color-brand-600)" }}><Store size={24} /></div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontWeight: 700 }}>{l.nome}</h3>
                      <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Unidade: {l.numero || "S/N"}</p>
                    </div>
                    <ChevronRight size={18} style={{ color: "var(--color-text-muted)" }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ——— Tabela de Ativos ——— */}
      {etapa === "ativos" && (
        <div className="flex flex-col gap-4 animate-fade-in">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              {lojaSelecionada && (
                <button className="btn btn-ghost btn-sm" onClick={() => { setLojaSelecionada(null); setEtapa("lojas"); }}><ArrowLeft size={18} /> Voltar</button>
              )}
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
              </div>
            </div>
            {canEdit && (
              <button className="btn btn-primary" onClick={() => setModal("novo")}>
                <Plus size={16} /> Novo Ativo
              </button>
            )}
          </div>

          <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
            {lojaSelecionada ? `Lupa de ativos: ${lojaSelecionada.nome}` : "Exibindo todos os ativos permitidos"}
          </div>

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
                {loadingAtivos ? (
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
        </div>
      )}

      {modal && <AtivoModal ativo={modal === "novo" ? null : modal} onClose={() => setModal(null)} />}
    </div>
  );
}
