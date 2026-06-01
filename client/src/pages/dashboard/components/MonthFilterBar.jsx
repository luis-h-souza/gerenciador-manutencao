import { Calendar } from "lucide-react";
import { OPCOES_MES } from "../hooks/useDashboardFilters";

export default function MonthFilterBar({
  filtro,
  setFiltro,
  showRegional = false,
  opcoesRegionais = [],
  compact = false,
}) {
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
        <div
          className="flex items-center gap-2"
          style={{ color: "var(--color-brand-500)" }}
        >
          <Calendar size={16} />
          <span
            style={{
              fontSize: "0.78rem",
              fontWeight: 600,
              color: "var(--color-text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
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
              if (opt)
                setFiltro((prev) => ({ ...prev, mes: opt.mes, ano: opt.ano }));
            }}
          >
            {OPCOES_MES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
                {opt.value ===
                `${anoAtual}-${String(mesAtual).padStart(2, "00")}`
                  ? " (atual)"
                  : ""}
              </option>
            ))}
          </select>
          {!isCurrentMonth && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() =>
                setFiltro((prev) => ({ ...prev, mes: mesAtual, ano: anoAtual }))
              }
              title="Voltar ao mês atual"
              style={{
                gap: "4px",
                fontSize: "0.75rem",
                border: "1px solid var(--color-border)",
              }}
            >
              Mês atual
            </button>
          )}
        </div>

        {/* Filtro Regional (opcional) */}
        {showRegional && (
          <div
            className="flex items-center gap-2"
            style={{ marginLeft: "8px" }}
          >
            <select
              id="dashboard-filtro-regional"
              className="select"
              style={{ minWidth: "200px" }}
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
                onClick={() => setFiltro((prev) => ({ ...prev, regiao: "" }))}
                style={{
                  fontSize: "0.75rem",
                  border: "1px solid var(--color-border)",
                }}
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
