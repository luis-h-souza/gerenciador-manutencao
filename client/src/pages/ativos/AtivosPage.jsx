import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { ativosService, falhaAtivoService, lojasService, usuariosService } from "../../services";
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
  Eye,
  Activity,
  Clock,
  CheckCircle2,
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
  "Bebê Conforto",
  "Carrinho Motorizado",
  "Escada",
  "Escada de Abastecimento",
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

function AtivosTable({ ativos, onEdit, onRemove, onViewDetails, canEdit }) {
  return (
     <div className="table-container">
        <table className="table">
           <thead>
              <tr>
                 <th>Ativo</th>
                 <th>Status</th>
                 <th>Qtd.</th>
                 <th>Identificação</th>
                 <th>Localização</th>
                 <th style={{ width: "120px" }}>Ações</th>
              </tr>
           </thead>
           <tbody>
              {ativos.map((a) => (
                 <tr key={a.id}>
                    <td>
                       <div className="flex items-center gap-2.5">
                          <div>
                             <div style={{ fontWeight: 600 }}>{a.nome}</div>
                             <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{[a.fabricante, a.modelo].filter(Boolean).join(" / ") || a.tipo || "-"}</div>
                          </div>
                       </div>
                    </td>
                    <td style={{ fontSize: "0.8125rem" }}>{STATUS.find((s) => s.value === a.status)?.label || a.status}</td>
                    <td>{a.quantidade}</td>
                    <td style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>{a.patrimonio || a.numeroSerie || "-"}</td>
                    <td style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>{a.localizacao || "-"}</td>
                    <td>
                       <div className="flex gap-1">
                          <button className="btn btn-ghost btn-sm" title="Detalhes e KPIs" onClick={() => onViewDetails(a)} style={{ padding: "4px 6px" }}><Eye size={13} /></button>
                          {canEdit && (
                             <>
                                <button className="btn btn-ghost btn-sm" title="Editar" onClick={() => onEdit(a)} style={{ padding: "4px 6px" }}><Pencil size={13} /></button>
                                <button className="btn btn-ghost btn-sm" title="Remover" onClick={() => onRemove(a.id)} style={{ padding: "4px 6px", color: "var(--color-danger)" }}><Trash2 size={13} /></button>
                             </>
                          )}
                       </div>
                    </td>
                 </tr>
              ))}
           </tbody>
        </table>
     </div>
  );
}

function CategoriaAccordion({ categoria, ativos, onEdit, onRemove, onViewDetails, canEdit }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="card" style={{ padding: 0, border: "1px dashed var(--color-border)", overflow: "hidden", marginBottom: "0.5rem" }}>
       <div className="pointer flex items-center justify-between" onClick={() => setExpanded(!expanded)} style={{ padding: "0.75rem 1rem", background: expanded ? "var(--color-surface-700)" : "transparent" }}>
          <div className="flex items-center gap-3">
             <div className="flex items-center justify-center w-8 h-8 rounded-lg" style={{ background: "rgba(14,165,233,0.1)", color: "var(--color-brand-500)" }}><Boxes size={18} /></div>
             <h3 style={{ fontWeight: 600, fontSize: "0.9375rem" }}>{categoria}</h3>
             <span className="badge badge-neutral" style={{ fontSize: "0.7rem" }}>{ativos.length} {ativos.length === 1 ? "ativo" : "ativos"}</span>
          </div>
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
       </div>
       {expanded && (
          <div className="animate-fade-in" style={{ padding: "1rem", borderTop: "1px dashed var(--color-border)" }}>
             <AtivosTable ativos={ativos} onEdit={onEdit} onRemove={onRemove} onViewDetails={onViewDetails} canEdit={canEdit} />
          </div>
       )}
    </div>
  )
}

function LojaAccordion({ loja, onEdit, onRemove, onViewDetails, canEdit }) {
  const [expanded, setExpanded] = useState(false);
  
  const { data: ativosData, isLoading } = useQuery({
    queryKey: ["ativos-loja-all", loja.nome],
    queryFn: () => ativosService.listar({ unidade: loja.nome, limit: 10000 }).then(r => r.data?.data || []),
    enabled: expanded,
  });

  const categorias = useMemo(() => {
    if (!ativosData) return [];
    const cats = [...new Set(ativosData.map(a => a.categoria).filter(Boolean))];
    return cats.sort();
  }, [ativosData]);

  return (
    <div className="card" style={{ padding: 0, border: "1px solid var(--color-border-light)", overflow: "hidden", marginBottom: "0.75rem" }}>
       <div className="pointer flex items-center justify-between" onClick={() => setExpanded(!expanded)} style={{ padding: "1rem", background: expanded ? "var(--color-surface-700)" : "var(--color-surface-800)" }}>
          <div className="flex items-center gap-4">
             <div className="flex items-center justify-center w-10 h-10 rounded-xl" style={{ background: "var(--color-surface-600)", color: "var(--color-brand-400)" }}><Store size={20} /></div>
             <div>
                <h3 style={{ fontWeight: 600, fontSize: "1rem", color: "var(--color-text-primary)" }}>{loja.nome}</h3>
                <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Unidade: {loja.numero || "S/N"}</p>
             </div>
          </div>
          {expanded ? <ChevronUp size={20} style={{ color: "var(--color-brand-500)" }} /> : <ChevronDown size={20} style={{ color: "var(--color-text-muted)" }} />}
       </div>
       {expanded && (
          <div className="animate-fade-in" style={{ padding: "1rem", borderTop: "1px solid var(--color-border-light)", background: "var(--color-surface-800)" }}>
             {isLoading ? (
                 <div className="flex justify-center p-4"><Loader2 className="animate-spin" style={{ color: "var(--color-brand-500)" }} /></div>
             ) : (
                <div className="flex flex-col gap-1">
                  {categorias.length > 0 ? categorias.map(cat => (
                     <CategoriaAccordion key={cat} categoria={cat} ativos={ativosData.filter(a => a.categoria === cat)} onEdit={onEdit} onRemove={onRemove} onViewDetails={onViewDetails} canEdit={canEdit} />
                  )) : <p className="text-muted text-sm text-center py-4">Nenhum ativo cadastrado nesta loja.</p>}
                </div>
             )}
          </div>
       )}
    </div>
  )
}

function RegionalAccordion({ regiao, onEdit, onRemove, onViewDetails, canEdit }) {
  const [expanded, setExpanded] = useState(false);
  const { data: lojasRes, isLoading } = useQuery({
    queryKey: ["lojas-ativos-list", regiao],
    queryFn: () => lojasService.listar({ regiao, limit: 1000 }).then((r) => r.data),
    enabled: expanded,
  });

  return (
    <div className="card" style={{ marginBottom: "1rem", overflow: "hidden", padding: 0 }}>
       <div className="pointer flex items-center justify-between" onClick={() => setExpanded(!expanded)} style={{ padding: "1.25rem", background: expanded ? "var(--color-surface-700)" : "var(--color-surface-800)", transition: "background 0.2s" }}>
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "var(--color-brand-100)", color: "var(--color-brand-600)" }}><MapPin size={24} /></div>
             <div>
               <h3 style={{ fontWeight: 700, fontSize: "1.125rem", color: "var(--color-text-primary)" }}>{regiao}</h3>
               <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>Expandir lojas da regional</p>
             </div>
          </div>
          {expanded ? <ChevronUp size={24} style={{ color: "var(--color-brand-500)" }} /> : <ChevronDown size={24} style={{ color: "var(--color-text-muted)" }} />}
       </div>
       {expanded && (
          <div className="animate-fade-in" style={{ padding: "1.25rem", borderTop: "1px solid var(--color-border)", background: "var(--color-surface-900)" }}>
             {isLoading ? (
                <div className="flex justify-center p-4"><Loader2 className="animate-spin" style={{ color: "var(--color-brand-500)" }} /></div>
             ) : (
                <div className="flex flex-col gap-1">
                  {(lojasRes?.data || []).sort((a,b)=>a.nome.localeCompare(b.nome)).map(loja => (
                     <LojaAccordion key={loja.id} loja={loja} onEdit={onEdit} onRemove={onRemove} onViewDetails={onViewDetails} canEdit={canEdit} />
                  ))}
                  {lojasRes?.data?.length === 0 && <p className="text-muted text-sm text-center py-4">Nenhuma loja encontrada nesta regional.</p>}
                </div>
             )}
          </div>
       )}
    </div>
  )
}

function AtivoModal({ ativo, onClose }) {
  const qc = useQueryClient();
  const isEdit = !!ativo;

  const formatForInputDate = (isoString) => {
    if (!isoString) return "";
    return new Date(isoString).toISOString().split("T")[0];
  };

  const formattedDefaultValues = useMemo(() => {
    if (!ativo) return { quantidade: 1, status: "ATIVO" };
    return {
      ...ativo,
      ultimaPreventiva: formatForInputDate(ativo.ultimaPreventiva),
      proximaPreventiva: formatForInputDate(ativo.proximaPreventiva),
      ultimaTrocaBateria: formatForInputDate(ativo.ultimaTrocaBateria),
      proximaTrocaBateria: formatForInputDate(ativo.proximaTrocaBateria),
      dadosTecnicosText: ativo.dadosTecnicos ? (typeof ativo.dadosTecnicos === "object" ? JSON.stringify(ativo.dadosTecnicos) : String(ativo.dadosTecnicos)) : "",
    };
  }, [ativo]);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: formattedDefaultValues,
  });

  const categoriaWatch = watch("categoria") || "";
  const isGerador = categoriaWatch.toLowerCase().includes("gerador");
  const isNobreak = categoriaWatch.toLowerCase().includes("nobreak");
  const isCabine = categoriaWatch.toLowerCase().includes("cabine");
  const isInfra = isGerador || isNobreak || isCabine;

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? ativosService.atualizar(ativo.id, data) : ativosService.criar(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ativos"] });
      qc.invalidateQueries({ queryKey: ["ativos-loja-all"] });
      toast.success(isEdit ? "Ativo atualizado!" : "Ativo cadastrado!");
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || err.response?.data?.error || "Erro ao salvar ativo"),
  });

  const onSubmit = (d) => {
    const data = { ...d };
    if (data.dadosTecnicosText) {
      try {
        data.dadosTecnicos = JSON.parse(data.dadosTecnicosText);
      } catch (e) {
        data.dadosTecnicos = data.dadosTecnicosText;
      }
    } else {
      data.dadosTecnicos = null;
    }
    delete data.dadosTecnicosText;

    // Limpa strings vazias de datas para nulo
    for (const f of ['ultimaPreventiva', 'proximaPreventiva', 'ultimaTrocaBateria', 'proximaTrocaBateria']) {
      if (data[f] === "") data[f] = null;
    }
    if (data.intervaloPreventiva === "" || isNaN(data.intervaloPreventiva)) {
      data.intervaloPreventiva = null;
    }

    mutation.mutate(data);
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content animate-fade-in" style={{ maxWidth: "720px" }}>
        <div className="flex items-center justify-between mb-5">
          <h2 style={{ fontSize: "1rem", fontWeight: 700 }}>{isEdit ? "Editar Ativo" : "Novo Ativo"}</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: "4px" }}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
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

          {isInfra && (
            <div className="card" style={{ padding: "16px", background: "rgba(var(--color-brand-rgb), 0.02)", border: "1px dashed var(--color-border)", display: "flex", flexDirection: "column", gap: "16px", marginTop: "8px" }}>
              <h3 style={{ fontSize: "0.875rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px", color: "var(--color-brand-500)" }}>
                <Activity size={16} />
                Parâmetros e Validades de Infraestrutura
              </h3>
              
              {(isGerador || isNobreak) && (
                <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
                  <div>
                    <label className="label">Última Troca de Bateria</label>
                    <input className="input" type="date" {...register("ultimaTrocaBateria")} />
                  </div>
                  <div>
                    <label className="label">Próxima Troca de Bateria *</label>
                    <input className="input" type="date" {...register("proximaTrocaBateria", { required: "Obrigatório para monitoramento" })} />
                    {errors.proximaTrocaBateria && <p className="field-error">{errors.proximaTrocaBateria.message}</p>}
                  </div>
                </div>
              )}

              {isCabine && (
                <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
                  <div>
                    <label className="label">Última Preventiva (Emissão Laudo)</label>
                    <input className="input" type="date" {...register("ultimaPreventiva")} />
                  </div>
                  <div>
                    <label className="label">Próxima Preventiva (Validade Laudo) *</label>
                    <input className="input" type="date" {...register("proximaPreventiva", { required: "Obrigatório para monitoramento" })} />
                    {errors.proximaPreventiva && <p className="field-error">{errors.proximaPreventiva.message}</p>}
                  </div>
                </div>
              )}

              <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <div>
                  <label className="label">Intervalo de Manutenção (Dias)</label>
                  <input className="input" type="number" placeholder="Ex: 365 para anual" {...register("intervaloPreventiva", { valueAsNumber: true })} />
                </div>
                <div>
                  <label className="label">Tensão/Capacidade (Dados Técnicos)</label>
                  <input className="input" placeholder="Ex: 15kV, 10kVA, 250kVA" {...register("dadosTecnicosText")} />
                </div>
              </div>
            </div>
          )}

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

function DetalhesAtivoModal({ ativo, onClose }) {
  const { data: kpis, isLoading: loadingKpis } = useQuery({
    queryKey: ["ativo-confiabilidade", ativo.id],
    queryFn: () => falhaAtivoService.calcularConfiabilidade(ativo.id).then(r => r.data),
  });

  const { data: falhasData, isLoading: loadingFalhas } = useQuery({
    queryKey: ["ativo-falhas", ativo.id],
    queryFn: () => falhaAtivoService.listarPorAtivo(ativo.id, { limit: 10 }).then(r => r.data.data || []),
  });

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content animate-fade-in" style={{ maxWidth: "800px", padding: "24px" }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
              <Activity size={20} style={{ color: "var(--color-brand-500)" }} />
              Confiabilidade do Ativo
            </h2>
            <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
              {ativo.nome} {ativo.patrimonio ? `(${ativo.patrimonio})` : ""}
            </p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: "4px" }}><X size={18} /></button>
        </div>

        {loadingKpis ? (
          <div className="flex justify-center p-8"><Loader2 className="animate-spin" size={24} style={{ color: "var(--color-brand-500)" }} /></div>
        ) : kpis && (
          <div className="grid gap-4 mb-8" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
            <div className="card" style={{ padding: "16px", borderLeft: "4px solid var(--color-success)" }}>
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 600 }}>MTBF (Média entre falhas)</p>
              <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text-primary)" }}>{kpis.mtbfHoras}h</p>
            </div>
            <div className="card" style={{ padding: "16px", borderLeft: "4px solid var(--color-danger)" }}>
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 600 }}>MTTR (Tempo médio de reparo)</p>
              <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text-primary)" }}>{kpis.mttrHoras}h</p>
            </div>
            <div className="card" style={{ padding: "16px", borderLeft: "4px solid var(--color-brand-500)" }}>
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 600 }}>Uptime</p>
              <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text-primary)" }}>{kpis.uptimePercentual}%</p>
            </div>
            <div className="card" style={{ padding: "16px", borderLeft: "4px solid var(--color-warning)" }}>
              <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: 600 }}>Total de Falhas</p>
              <p style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-text-primary)" }}>{kpis.totalFalhas}</p>
            </div>
          </div>
        )}

        {(() => {
          const catLower = (ativo.categoria || "").toLowerCase();
          const isGerador = catLower.includes("gerador");
          const isNobreak = catLower.includes("nobreak");
          const isCabine = catLower.includes("cabine");
          const isInfra = isGerador || isNobreak || isCabine;

          if (!isInfra) return null;

          return (
            <div className="card animate-fade-in" style={{ padding: "16px", background: "var(--color-surface-600)", border: "1px dashed var(--color-border)", display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
              <h4 style={{ fontSize: "0.875rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px", color: "var(--color-brand-400)", margin: 0 }}>
                <Activity size={14} />
                Especificações Técnicas e Validades
              </h4>
              
              <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
                {(isGerador || isNobreak) && (
                  <>
                    <div>
                      <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", display: "block" }}>Última Troca de Bateria</span>
                      <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                        {ativo.ultimaTrocaBateria ? new Date(ativo.ultimaTrocaBateria).toLocaleDateString() : "Não informada"}
                      </span>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", display: "block" }}>Próxima Troca de Bateria</span>
                      <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--color-brand-400)" }}>
                        {ativo.proximaTrocaBateria ? new Date(ativo.proximaTrocaBateria).toLocaleDateString() : "Não cadastrada"}
                      </span>
                    </div>
                  </>
                )}

                {isCabine && (
                  <>
                    <div>
                      <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", display: "block" }}>Última Preventiva (Laudo)</span>
                      <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                        {ativo.ultimaPreventiva ? new Date(ativo.ultimaPreventiva).toLocaleDateString() : "Não informada"}
                      </span>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", display: "block" }}>Próxima Preventiva (Validade)</span>
                      <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--color-brand-400)" }}>
                        {ativo.proximaPreventiva ? new Date(ativo.proximaPreventiva).toLocaleDateString() : "Não cadastrada"}
                      </span>
                    </div>
                  </>
                )}

                {ativo.intervaloPreventiva && (
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", display: "block" }}>Frequência Preventiva</span>
                    <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>{ativo.intervaloPreventiva} dias</span>
                  </div>
                )}

                {ativo.dadosTecnicos && (
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", display: "block" }}>Especificação / Capacidade</span>
                    <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--color-text-primary)" }}>
                      {typeof ativo.dadosTecnicos === "object" ? JSON.stringify(ativo.dadosTecnicos) : String(ativo.dadosTecnicos)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "16px", borderBottom: "1px solid var(--color-border)", paddingBottom: "8px" }}>Histórico de Falhas</h3>
        
        {loadingFalhas ? (
           <div className="flex justify-center p-8"><Loader2 className="animate-spin" size={24} style={{ color: "var(--color-brand-500)" }} /></div>
        ) : falhasData && falhasData.length > 0 ? (
          <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-2">
            {falhasData.map(f => (
              <div key={f.id} className="card" style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ fontSize: "0.875rem", fontWeight: 600 }}>{f.descricao}</p>
                  <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                    <Clock size={12} /> {new Date(f.dataDeteccao).toLocaleDateString()}
                    {f.dataResolucao && (
                      <>
                        <span style={{ margin: "0 4px" }}>→</span>
                        <CheckCircle2 size={12} style={{ color: "var(--color-success)" }} /> {new Date(f.dataResolucao).toLocaleDateString()}
                      </>
                    )}
                  </p>
                </div>
                <div>
                  {!f.dataResolucao ? (
                    <span className="badge badge-danger">Aberta</span>
                  ) : (
                    <span className="badge badge-success">Resolvida</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", textAlign: "center", padding: "32px 0" }}>
            Nenhum registro de falha encontrado para este ativo.
          </p>
        )}
      </div>
    </div>
  );
}

export default function AtivosPage() {
  const { usuario } = useAuth();
  const qc = useQueryClient();
  const canEdit = usuario?.role === "GESTOR" || ["ADMINISTRADOR", "DIRETOR", "GERENTE", "COORDENADOR"].includes(usuario?.role);
  
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

  const [modal, setModal] = useState(null);
  const [modalDetalhes, setModalDetalhes] = useState(null);
  const [page, setPage] = useState(1);
  const [filtros, setFiltros] = useState({ nome: "", categoria: "", status: "" });

  const atualizarFiltro = (campo, valor) => {
    setFiltros((f) => ({ ...f, [campo]: valor }));
    setPage(1);
  };

  const isSearching = Boolean(filtros.nome || filtros.categoria || filtros.status);

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

  const { data, isLoading: loadingAtivos } = useQuery({
    queryKey: ["ativos", filtros, page],
    queryFn: () => 
      ativosService.listar({ 
        ...filtros, 
        page, 
        limit: LIMIT 
      }).then((r) => r.data),
    enabled: isSearching || (!hasDrilldown && etapa === "ativos"),
    placeholderData: (prev) => prev,
  });

  const ativos = data?.data ?? [];
  const meta = data?.meta ?? { total: 0 };
  const totalPaginas = Math.ceil(meta.total / LIMIT);

  const remover = useMutation({
    mutationFn: (id) => ativosService.remover(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ativos"] });
      qc.invalidateQueries({ queryKey: ["ativos-loja-all"] });
      toast.success("Ativo inativado");
    },
    onError: () => toast.error("Erro ao inativar ativo"),
  });

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-10">
      
      {/* Cabeçalho e Busca */}
      <div className="flex flex-col gap-4 mb-2">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex flex-col gap-1">
            <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
              Ativos e Equipamentos
            </h1>
            <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
              Gestão de inventário e equipamentos por unidade
            </p>
          </div>
          {canEdit && (
            <button className="btn btn-primary" onClick={() => setModal("novo")}>
              <Plus size={16} /> Novo Ativo
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap bg-surface-800 p-3 rounded-xl border border-border">
          <div className="relative">
            <Search size={15} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
            <input className="input" style={{ paddingLeft: "32px", width: "220px" }} placeholder="Buscar por nome ou serial..." value={filtros.nome} onChange={(e) => atualizarFiltro("nome", e.target.value)} />
          </div>
          <input className="input" style={{ width: "160px" }} placeholder="Categoria..." value={filtros.categoria} onChange={(e) => atualizarFiltro("categoria", e.target.value)} />
          <select className="select" style={{ width: "auto" }} value={filtros.status} onChange={(e) => atualizarFiltro("status", e.target.value)}>
            <option value="">Todos status</option>
            {STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          {isSearching && (
             <button className="btn btn-ghost btn-sm" onClick={() => setFiltros({nome:"", categoria:"", status:""})}>Limpar</button>
          )}
        </div>
      </div>

      {isSearching ? (
        /* ——— Tabela de Pesquisa Plana ——— */
        <div className="flex flex-col gap-4 animate-fade-in">
          <div style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>Resultados da busca ({meta.total} ativos encontrados)</div>
          {loadingAtivos ? (
            <div className="flex justify-center py-8"><Loader2 size={22} className="animate-spin" style={{ color: "var(--color-brand-500)" }} /></div>
          ) : ativos.length === 0 ? (
            <div className="card" style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "2rem", fontSize: "0.875rem" }}>Nenhum ativo corresponde à busca</div>
          ) : (
            <>
              <AtivosTable ativos={ativos} onEdit={setModal} onRemove={(id) => remover.mutate(id)} onViewDetails={setModalDetalhes} canEdit={canEdit} />
              <Paginacao paginaAtual={page} totalPaginas={totalPaginas} onMudar={setPage} />
            </>
          )}
        </div>
      ) : (
        <>
          {/* ——— Lista de Gerentes ——— */}
          {etapa === "gerentes" && (
            <div className="flex flex-col gap-4">
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
            <div className="flex flex-col gap-4">
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

          {/* ——— Lista de Regionais (Accordion Hierárquico) ——— */}
          {etapa === "regionais" && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 mb-2">
                {["ADMINISTRADOR", "DIRETOR", "GERENTE"].includes(usuario?.role) && (
                  <button className="btn btn-ghost btn-sm" onClick={() => { setEtapa("coordenadores"); setCoordenadorSelecionado(null); }} style={{ padding: "8px" }}><ArrowLeft size={18} /></button>
                )}
                <h2 style={{ fontSize: "1.125rem", fontWeight: 700 }}>Visão por Regional</h2>
              </div>
              
              <div className="flex flex-col gap-2">
                {regioesDisponiveis.map((r) => (
                  <RegionalAccordion 
                    key={r} 
                    regiao={r} 
                    canEdit={canEdit} 
                    onEdit={setModal} 
                    onRemove={(id) => remover.mutate(id)} 
                    onViewDetails={setModalDetalhes} 
                  />
                ))}
              </div>
            </div>
          )}

          {/* Para usuários sem drilldown (TECNICO, LOJA), listagem direta */}
          {!hasDrilldown && etapa === "ativos" && !isSearching && (
            <div className="flex flex-col gap-4 animate-fade-in">
              {loadingAtivos ? (
                <div className="flex justify-center py-8"><Loader2 size={22} className="animate-spin" style={{ color: "var(--color-brand-500)" }} /></div>
              ) : ativos.length === 0 ? (
                <div className="card" style={{ textAlign: "center", color: "var(--color-text-muted)", padding: "2rem", fontSize: "0.875rem" }}>Nenhum ativo encontrado na sua unidade</div>
              ) : (
                <>
                  <AtivosTable ativos={ativos} onEdit={setModal} onRemove={(id) => remover.mutate(id)} onViewDetails={setModalDetalhes} canEdit={canEdit} />
                  <Paginacao paginaAtual={page} totalPaginas={totalPaginas} onMudar={setPage} />
                </>
              )}
            </div>
          )}
        </>
      )}

      {modal && <AtivoModal ativo={modal === "novo" ? null : modal} onClose={() => setModal(null)} />}
      {modalDetalhes && <DetalhesAtivoModal ativo={modalDetalhes} onClose={() => setModalDetalhes(null)} />}
    </div>
  );
}
