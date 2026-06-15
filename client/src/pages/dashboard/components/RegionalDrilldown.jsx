import { Eye, X } from "lucide-react";

const fmt = (v) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    v || 0,
  );

const fmtMonthYear = (mes, ano) =>
  new Date(ano, (mes || 1) - 1, 1).toLocaleString("pt-BR", {
    month: "long",
    year: "numeric",
  });

export default function RegionalDrilldown({
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
                <p style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>
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
                <p style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>
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
                <p style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>
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

                      <div className="grid gap-3 mt-3 grid-cols-1 sm:grid-cols-3">
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
                            Meta
                          </p>
                          <p
                            style={{
                              fontSize: "0.95rem",
                              fontWeight: 700,
                              color: loja.semMeta
                                ? "var(--color-text-muted)"
                                : loja.statusMeta === "VERDE"
                                ? "var(--color-success)"
                                : loja.statusMeta === "AMARELO"
                                ? "var(--color-warning)"
                                : "var(--color-danger)",
                              marginTop: "4px",
                            }}
                          >
                            {loja.semMeta ? "Sem Meta" : fmt(loja.valorMeta)}
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

                      {!loja.semMeta && (
                        <div style={{ marginTop: "10px" }}>
                          <div className="flex justify-between items-center mb-1">
                            <span style={{ fontSize: "0.65rem", color: "var(--color-text-muted)" }}>Consumo da Meta</span>
                            <span
                              style={{
                                fontSize: "0.7rem",
                                fontWeight: 700,
                                color: loja.statusMeta === "VERDE"
                                  ? "var(--color-success)"
                                  : loja.statusMeta === "AMARELO"
                                  ? "var(--color-warning)"
                                  : "var(--color-danger)"
                              }}
                            >
                              {loja.percentualExecucao}%
                            </span>
                          </div>
                          <div style={{ width: "100%", height: "4px", background: "var(--color-surface-700)", borderRadius: "2px", overflow: "hidden" }}>
                            <div
                              style={{
                                width: `${Math.min(loja.percentualExecucao, 100)}%`,
                                height: "100%",
                                borderRadius: "2px",
                                background: loja.statusMeta === "VERDE"
                                  ? "var(--color-success)"
                                  : loja.statusMeta === "AMARELO"
                                  ? "var(--color-warning)"
                                  : "var(--color-danger)"
                              }}
                            />
                          </div>
                        </div>
                      )}
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
