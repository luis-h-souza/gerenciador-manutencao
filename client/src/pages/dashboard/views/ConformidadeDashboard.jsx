import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Calendar,
  ClipboardCheck,
  MapPin,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { dashboardService } from "../../../services";
import InfoTooltip from "../../../components/feedback/InfoTooltip";
import StatCard from "../components/StatCard";
import toast from "react-hot-toast";

export default function ConformidadeDashboard({ filtro }) {
  const { data: conformidadeRes, isLoading } = useQuery({
    queryKey: ["dashboard-conformidade", filtro.mes, filtro.ano],
    queryFn: () =>
      dashboardService
        .conformidade({ mes: filtro.mes, ano: filtro.ano })
        .then((r) => r.data),
  });

  const [collapsedRegions, setCollapsedRegions] = useState({});

  const toggleRegion = (reg) => {
    setCollapsedRegions((prev) => ({ ...prev, [reg]: !prev[reg] }));
  };

  const items = conformidadeRes || [];

  const grouped = useMemo(() => {
    const groups = {};
    items.forEach((loja) => {
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
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h3
            style={{
              fontSize: "1.05rem",
              fontWeight: 700,
              color: "var(--color-text-primary)",
              margin: 0,
            }}
          >
            Conformidade Operacional
          </h3>
          <InfoTooltip
            title="Conformidade operacional"
            text="Mostra a aderência das lojas aos checklists, rotinas de infraestrutura, preventivas, baterias e laudos. Use para identificar pendências e priorizar ações."
            balloonStyle={{ right: "auto", left: -100 }}
          />
        </div>
        <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", margin: 0 }}>
          Visão por unidade da aderência às rotinas, preventivas e vencimentos críticos.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Média de Cobertura de Checklists"
          value={`${
            items.length > 0
              ? Math.round(
                  items.reduce((acc, curr) => acc + curr.checklistCoverage, 0) /
                    items.length,
                )
              : 100
          }%`}
          sub="Preenchimento de checklists nas lojas"
          icon={ClipboardCheck}
          accent="var(--color-brand-500)"
        />
        <StatCard
          label="Adesão de Preventivas"
          value={`${
            items.length > 0
              ? Math.round(
                  items.reduce((acc, curr) => acc + curr.preventivaAdherence, 0) /
                    items.length,
                )
              : 100
          }%`}
          sub="Ativos com preventiva em dia"
          icon={Calendar}
          accent="var(--color-success)"
        />
        <StatCard
          label="Sistemas Críticos Vencidos"
          value={items.reduce(
            (acc, curr) =>
              acc +
              (curr.statusBaterias === "VENCIDO" ? 1 : 0) +
              (curr.statusCabine === "VENCIDO" ? 1 : 0),
            0,
          )}
          sub="Baterias ou laudos pendentes"
          icon={AlertTriangle}
          accent="var(--color-danger)"
        />
      </div>

      <div className="flex flex-col gap-4">
        <h3
          style={{
            fontSize: "1.05rem",
            fontWeight: 700,
            color: "var(--color-text-primary)",
            marginBottom: "4px",
          }}
        >
          Matriz de Conformidade por Regional
        </h3>

        {items.length === 0 ? (
          <div
            className="card"
            style={{ padding: "24px", textAlign: "center", color: "var(--color-text-muted)" }}
          >
            Nenhuma loja cadastrada ou com dados no período.
          </div>
        ) : (
          Object.entries(grouped).map(([regiao, lojas]) => {
            const isCollapsed = !!collapsedRegions[regiao];
            const totalAlerts = lojas.reduce(
              (acc, curr) =>
                acc +
                (curr.checklistCoverage < 100 ? 1 : 0) +
                (curr.preventivaAdherence < 100 ? 1 : 0) +
                (curr.statusBaterias === "VENCIDO" ? 1 : 0) +
                (curr.statusCabine === "VENCIDO" ? 1 : 0),
              0,
            );

            return (
              <div
                key={regiao}
                className="card"
                style={{
                  background: "var(--color-surface-800)",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  border: "1px solid var(--color-border)",
                }}
              >
                <div
                  className="flex items-center justify-between pointer"
                  onClick={() => toggleRegion(regiao)}
                  style={{ userSelect: "none" }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{
                        background: "rgba(var(--color-brand-rgb), 0.1)",
                        color: "var(--color-brand-400)",
                      }}
                    >
                      <MapPin size={16} />
                    </div>
                    <div>
                      <h4
                        style={{
                          fontSize: "0.9375rem",
                          fontWeight: 700,
                          margin: 0,
                          color: "var(--color-text-primary)",
                        }}
                      >
                        Regional {regiao}
                      </h4>
                      <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: 0 }}>
                        {lojas.length} {lojas.length === 1 ? "loja" : "lojas"} sob gestão •{" "}
                        {totalAlerts === 0
                          ? "100% em dia"
                          : `${totalAlerts} pendências de conformidade`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {totalAlerts > 0 && (
                      <span
                        className="badge badge-danger"
                        style={{ fontSize: "0.6875rem", fontWeight: 700 }}
                      >
                        Atenção
                      </span>
                    )}
                    {isCollapsed ? (
                      <ChevronDown size={18} style={{ color: "var(--color-text-muted)" }} />
                    ) : (
                      <ChevronUp size={18} style={{ color: "var(--color-text-muted)" }} />
                    )}
                  </div>
                </div>

                {!isCollapsed && (
                  <div
                    style={{
                      overflowX: "auto",
                      borderTop: "1px solid var(--color-border)",
                      paddingTop: "12px",
                      marginTop: "4px",
                    }}
                  >
                    <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--color-border)", textAlign: "left" }}>
                          {["Unidade", "Cobertura Checklists", "Adesão Preventivas", "Status Baterias", "Laudo Cabine Primária", "Ações"].map(
                            (col) => (
                              <th
                                key={col}
                                style={{
                                  padding: "12px 8px",
                                  color: "var(--color-text-muted)",
                                  fontSize: "0.75rem",
                                  textTransform: "uppercase",
                                  fontWeight: 600,
                                }}
                              >
                                {col}
                              </th>
                            ),
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {lojas.map((loja, idx) => (
                          <tr
                            key={idx}
                            style={{ borderBottom: "1px solid var(--color-border)", fontSize: "0.875rem" }}
                          >
                            <td style={{ padding: "12px 8px", fontWeight: 600, color: "var(--color-text-primary)" }}>
                              {loja.unidade}
                            </td>
                            <td style={{ padding: "12px 8px" }}>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`badge ${loja.checklistCoverage >= 90 ? "badge-success" : loja.checklistCoverage >= 70 ? "badge-warning" : "badge-danger"}`}
                                >
                                  {loja.checklistCoverage}%
                                </span>
                                <div
                                  style={{
                                    width: "60px",
                                    height: "6px",
                                    background: "var(--color-surface-600)",
                                    borderRadius: "3px",
                                    overflow: "hidden",
                                  }}
                                >
                                  <div
                                    style={{
                                      width: `${loja.checklistCoverage}%`,
                                      height: "100%",
                                      background:
                                        loja.checklistCoverage >= 90
                                          ? "var(--color-success)"
                                          : loja.checklistCoverage >= 70
                                            ? "var(--color-warning)"
                                            : "var(--color-danger)",
                                    }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: "12px 8px" }}>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`badge ${loja.preventivaAdherence >= 90 ? "badge-success" : loja.preventivaAdherence >= 70 ? "badge-warning" : "badge-danger"}`}
                                >
                                  {loja.preventivaAdherence}%
                                </span>
                                <div
                                  style={{
                                    width: "60px",
                                    height: "6px",
                                    background: "var(--color-surface-600)",
                                    borderRadius: "3px",
                                    overflow: "hidden",
                                  }}
                                >
                                  <div
                                    style={{
                                      width: `${loja.preventivaAdherence}%`,
                                      height: "100%",
                                      background:
                                        loja.preventivaAdherence >= 90
                                          ? "var(--color-success)"
                                          : loja.preventivaAdherence >= 70
                                            ? "var(--color-warning)"
                                            : "var(--color-danger)",
                                    }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: "12px 8px" }}>
                              <span
                                className={`badge ${loja.statusBaterias === "OK" ? "badge-success" : "badge-danger"}`}
                              >
                                {loja.statusBaterias}
                              </span>
                            </td>
                            <td style={{ padding: "12px 8px" }}>
                              <span
                                className={`badge ${loja.statusCabine === "OK" ? "badge-success" : loja.statusCabine === "VENCIDO" ? "badge-danger" : "badge-neutral"}`}
                              >
                                {loja.statusCabine}
                              </span>
                            </td>
                            <td style={{ padding: "12px 8px" }}>
                              <button
                                className="btn btn-ghost btn-sm"
                                disabled={
                                  loja.checklistCoverage >= 100 &&
                                  loja.preventivaAdherence >= 100 &&
                                  loja.statusBaterias === "OK" &&
                                  loja.statusCabine !== "VENCIDO"
                                }
                                onClick={() => {
                                  toast.success(
                                    `Tarefa de conformidade delegada com sucesso para a unidade ${loja.unidade}!`,
                                  );
                                }}
                                style={{
                                  padding: "4px 8px",
                                  fontSize: "0.75rem",
                                  border: "1px solid var(--color-border)",
                                }}
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
        <h4
          style={{
            fontSize: "0.9375rem",
            fontWeight: 700,
            color: "var(--color-danger)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "12px",
          }}
        >
          <AlertTriangle size={18} />
          Alertas Críticos de Infraestrutura
        </h4>
        <div className="flex flex-col gap-2">
          {items.flatMap((l) => l.alertas.map((a) => ({ loja: l.unidade, msg: a }))).length === 0 ? (
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
              Nenhum alerta crítico ativo no momento. Toda a infraestrutura está em conformidade!
            </p>
          ) : (
            items
              .flatMap((l) => l.alertas.map((a) => ({ loja: l.unidade, msg: a })))
              .map((alerta, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "rgba(239, 68, 68, 0.05)",
                    border: "1px solid rgba(239, 68, 68, 0.1)",
                    borderRadius: "8px",
                    padding: "10px 14px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 700, marginRight: "8px", color: "var(--color-text-primary)" }}>
                      [{alerta.loja}]
                    </span>
                    <span style={{ color: "var(--color-text-secondary)" }}>{alerta.msg}</span>
                  </div>
                  <span
                    className="badge badge-danger"
                    style={{ textTransform: "uppercase", fontSize: "0.6875rem" }}
                  >
                    Vencido
                  </span>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
}
