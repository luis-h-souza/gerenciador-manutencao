import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Package,
  DollarSign,
  ClipboardCheck,
  MapPin,
  ChevronDown,
  ChevronUp,
  Store,
} from "lucide-react";
import { dashboardService } from "../../../services";
import InfoTooltip from "../../../components/feedback/InfoTooltip";
import StatCard from "../components/StatCard";
import toast from "react-hot-toast";

const fmt = (v) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

const formatMetric = (value, unit, fallback = "Sem histórico") => {
  if (value === null || value === undefined || value === "") return fallback;
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return fallback;
  if (numeric > 0 && numeric < 1) return `< 1 ${unit}`;
  return `${numeric.toFixed(1)} ${unit}`;
};

export default function BuyVsMaintainDashboard() {
  const { data: assetsRes, isLoading } = useQuery({
    queryKey: ["dashboard-buy-vs-maintain"],
    queryFn: () => dashboardService.buyVsMaintain().then((r) => r.data),
  });

  const [expandedRegions, setExpandedRegions] = useState({});
  const [expandedLojas, setExpandedLojas] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});

  const filteredItems = useMemo(() => {
    return (assetsRes || []).filter((asset) => {
      const cat = (asset.categoria || "").toLowerCase();
      const nome = (asset.nome || "").toLowerCase();
      return !/(carrinho|escada|cart|trolley)/i.test(`${cat} ${nome}`);
    });
  }, [assetsRes]);

  const grouped = useMemo(() => {
    const regions = {};
    filteredItems.forEach((asset) => {
      const reg = asset.regiao || "Sem Regional";
      const store = asset.unidade || "Sem Unidade";
      if (!regions[reg]) regions[reg] = {};
      if (!regions[reg][store]) regions[reg][store] = [];
      regions[reg][store].push(asset);
    });
    return regions;
  }, [filteredItems]);

  const totals = useMemo(
    () => ({
      total: filteredItems.length,
      buy: filteredItems.filter((i) => i.recomendacao === "BUY").length,
      maintain: filteredItems.filter((i) => i.recomendacao === "MAINTAIN").length,
      repairCost: fmt(filteredItems.reduce((acc, curr) => acc + curr.custoAcumulado, 0)),
    }),
    [filteredItems],
  );

  const toggleRegion = (reg) => {
    setExpandedRegions((prev) => ({ ...prev, [reg]: !prev[reg] }));
  };

  const toggleLoja = (regiao, loja) => {
    const key = `${regiao}-${loja}`;
    setExpandedLojas((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleCategory = (regiao, loja, categoria) => {
    const key = `${regiao}-${loja}-${categoria}`;
    setExpandedCategories((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const groupAssetsByCategory = (assets) => {
    const categories = {};
    assets.forEach((asset) => {
      const categoria = asset.categoria || asset.tipo || "Sem Categoria";
      if (!categories[categoria]) categories[categoria] = [];
      categories[categoria].push(asset);
    });

    return Object.entries(categories)
      .map(([categoria, categoryAssets]) => ({
        categoria,
        assets: categoryAssets.sort((a, b) => a.nome.localeCompare(b.nome)),
      }))
      .sort((a, b) => a.categoria.localeCompare(b.categoria));
  };

  if (isLoading) {
    return <div className="skeleton" style={{ height: "400px", borderRadius: "12px" }} />;
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--color-text-primary)", margin: 0 }}>
            Decisão Comprar x Manter
          </h3>
          <InfoTooltip
            title="Comprar x manter"
            text="Cruza falhas, MTBF, MTTR e custos de manutenção para indicar ativos que podem exigir substituição em vez de novos reparos."
            balloonStyle={{ right: "auto", left: -100 }}
          />
        </div>
        <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)", margin: 0 }}>
          Inteligência de ativos para priorizar substituições, reparos e abertura de chamados.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total de Ativos Analisados" value={totals.total} sub="Monitoramento contínuo" icon={Package} accent="var(--color-brand-500)" />
        <StatCard label="Recomendação: Substituir" value={totals.buy} sub="Badge vermelho de criticidade" icon={AlertTriangle} accent="var(--color-danger)" />
        <StatCard label="Recomendação: Manter" value={totals.maintain} sub="Saúde operacional estável" icon={ClipboardCheck} accent="var(--color-success)" />
        <StatCard label="Custo Total de Reparos" value={totals.repairCost} sub="Acumulado histórico na rede" icon={DollarSign} accent="var(--color-warning)" />
      </div>

      <div className="flex flex-col gap-2">
        {totals.total === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "40px", color: "var(--color-text-muted)" }}>
            Nenhum ativo encontrado para análise Comprar vs Manter.
          </div>
        ) : (
          Object.entries(grouped).map(([regiao, stores]) => {
            const isRegionOpen = !!expandedRegions[regiao];
            const regionAssets = Object.values(stores).flat();
            const regionBuyCount = regionAssets.filter((a) => a.recomendacao === "BUY").length;

            return (
              <div key={regiao} className="card" style={{ overflow: "hidden", padding: 0, marginBottom: "0.75rem" }}>
                {/* Nível 1: Regional */}
                <div
                  className="pointer flex items-center justify-between"
                  onClick={() => toggleRegion(regiao)}
                  style={{
                    padding: "1.25rem",
                    background: isRegionOpen ? "var(--color-surface-700)" : "var(--color-surface-800)",
                    transition: "background 0.2s",
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ background: "rgba(14, 165, 233, 0.15)", color: "var(--color-brand-500)" }}
                    >
                      <MapPin size={22} />
                    </div>
                    <div>
                      <h3 style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--color-text-primary)", margin: 0 }}>
                        {regiao}
                      </h3>
                      <p style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", margin: 0, marginTop: "2px" }}>
                        Expandir lojas da regional
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                      <span className="badge badge-danger" style={{ fontSize: "0.7rem" }}>
                        {regionBuyCount} SUBSTITUIR
                      </span>
                      <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>
                        {regionAssets.length} ativos totais
                      </span>
                    </div>
                    {isRegionOpen ? (
                      <ChevronUp size={22} style={{ color: "var(--color-brand-500)" }} />
                    ) : (
                      <ChevronDown size={22} style={{ color: "var(--color-text-muted)" }} />
                    )}
                  </div>
                </div>

                {/* Nível 2: Lojas */}
                {isRegionOpen && (
                  <div
                    className="animate-fade-in"
                    style={{
                      padding: "1rem",
                      borderTop: "1px solid var(--color-border)",
                      background: "var(--color-surface-900)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                    }}
                  >
                    {Object.entries(stores).map(([store, assets]) => {
                      const isLojaOpen = !!expandedLojas[`${regiao}-${store}`];

                      return (
                        <div key={store} style={{ borderRadius: "10px", overflow: "hidden", border: "1px solid var(--color-border)" }}>
                          {/* Header da Loja */}
                          <div
                            className="pointer flex items-center justify-between"
                            onClick={() => toggleLoja(regiao, store)}
                            style={{
                              padding: "0.875rem 1rem",
                              background: isLojaOpen ? "var(--color-surface-700)" : "var(--color-surface-800)",
                              transition: "background 0.2s",
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                style={{
                                  width: "36px",
                                  height: "36px",
                                  borderRadius: "8px",
                                  background: "rgba(14, 165, 233, 0.1)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <Store size={18} style={{ color: "var(--color-brand-400)" }} />
                              </div>
                              <div>
                                <h4
                                  style={{
                                    fontWeight: 700,
                                    fontSize: "0.9rem",
                                    color: "var(--color-text-primary)",
                                    margin: 0,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.02em",
                                  }}
                                >
                                  {store}
                                </h4>
                                <p style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", margin: 0, marginTop: "2px" }}>
                                  Unidade: {assets.length} ativos
                                </p>
                              </div>
                            </div>
                            {isLojaOpen ? (
                              <ChevronUp size={18} style={{ color: "var(--color-brand-400)" }} />
                            ) : (
                              <ChevronDown size={18} style={{ color: "var(--color-text-muted)" }} />
                            )}
                          </div>

                          {/* Nível 3: Categorias da Loja */}
                          {isLojaOpen && (
                            <div
                              className="animate-fade-in"
                              style={{ padding: "1rem", borderTop: "1px solid var(--color-border)", background: "var(--color-background)" }}
                            >
                              <div className="flex flex-col gap-2">
                                {groupAssetsByCategory(assets).map(({ categoria, assets: categoryAssets }) => {
                                  const categoryKey = `${regiao}-${store}-${categoria}`;
                                  const isCategoryOpen = !!expandedCategories[categoryKey];
                                  const categoryBuyCount = categoryAssets.filter((a) => a.recomendacao === "BUY").length;

                                  return (
                                    <div
                                      key={categoria}
                                      style={{
                                        borderRadius: "10px",
                                        overflow: "hidden",
                                        border: "1px dashed var(--color-border)",
                                      }}
                                    >
                                      <div
                                        className="pointer flex items-center justify-between"
                                        onClick={() => toggleCategory(regiao, store, categoria)}
                                        style={{
                                          padding: "0.8rem 1rem",
                                          background: isCategoryOpen ? "var(--color-surface-700)" : "var(--color-surface-800)",
                                          transition: "background 0.2s",
                                        }}
                                      >
                                        <div className="flex items-center gap-3">
                                          <div
                                            style={{
                                              width: "34px",
                                              height: "34px",
                                              borderRadius: "8px",
                                              background: "rgba(245, 158, 11, 0.12)",
                                              display: "flex",
                                              alignItems: "center",
                                              justifyContent: "center",
                                            }}
                                          >
                                            <Package size={17} style={{ color: "var(--color-warning)" }} />
                                          </div>
                                          <div>
                                            <h5 style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--color-text-primary)", margin: 0 }}>
                                              {categoria}
                                            </h5>
                                            <p style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", margin: 0, marginTop: "2px" }}>
                                              {categoryAssets.length}{" "}
                                              {categoryAssets.length === 1 ? "ativo" : "ativos"} na categoria
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          {categoryBuyCount > 0 && (
                                            <span className="badge badge-danger" style={{ fontSize: "0.68rem" }}>
                                              {categoryBuyCount} SUBSTITUIR
                                            </span>
                                          )}
                                          {isCategoryOpen ? (
                                            <ChevronUp size={18} style={{ color: "var(--color-brand-400)" }} />
                                          ) : (
                                            <ChevronDown size={18} style={{ color: "var(--color-text-muted)" }} />
                                          )}
                                        </div>
                                      </div>

                                      {isCategoryOpen && (
                                        <div
                                          className="animate-fade-in"
                                          style={{
                                            padding: "1rem",
                                            borderTop: "1px dashed var(--color-border)",
                                            background: "var(--color-background)",
                                          }}
                                        >
                                          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                            {categoryAssets.map((ativo) => (
                                              <div
                                                key={ativo.ativoId}
                                                className="card flex flex-col justify-between"
                                                style={{
                                                  borderTop: `4px solid ${ativo.recomendacao === "BUY" ? "var(--color-danger)" : "var(--color-success)"}`,
                                                  gap: "16px",
                                                  background: "var(--color-surface-800)",
                                                }}
                                              >
                                                <div>
                                                  <div className="flex items-center justify-between mb-2">
                                                    <span className="badge badge-neutral" style={{ fontSize: "0.6875rem", textTransform: "uppercase" }}>
                                                      {ativo.categoria || "Sem Categoria"}
                                                    </span>
                                                    <span
                                                      className={`badge ${ativo.recomendacao === "BUY" ? "badge-danger" : "badge-success"}`}
                                                      style={{ fontWeight: 700 }}
                                                    >
                                                      {ativo.recomendacao === "BUY" ? "SUBSTITUIR" : "MANTER"}
                                                    </span>
                                                  </div>
                                                  <h4 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
                                                    {ativo.nome}
                                                  </h4>
                                                  <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "12px" }}>
                                                    Unidade:{" "}
                                                    <strong style={{ color: "var(--color-text-secondary)" }}>{ativo.unidade}</strong> • Patr.:{" "}
                                                    {ativo.patrimonio || "N/A"}
                                                  </p>
                                                  <hr style={{ borderTop: "1px solid var(--color-border)", borderRight: 0, borderBottom: 0, borderLeft: 0, margin: "12px 0" }} />
                                                  <div className="grid grid-cols-2 gap-3 text-sm">
                                                    <div>
                                                      <p style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
                                                        MTBF
                                                      </p>
                                                      <p style={{ fontWeight: 700, color: "var(--color-text-primary)" }}>
                                                        {formatMetric(ativo.mtbfDias, "dias")}
                                                      </p>
                                                    </div>
                                                    <div>
                                                      <p style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
                                                        MTTR
                                                      </p>
                                                      <p style={{ fontWeight: 700, color: "var(--color-text-primary)" }}>
                                                        {formatMetric(ativo.mttrHoras, "horas", ativo.falhasAbertas > 0 ? "Em aberto" : "Sem reparos")}
                                                      </p>
                                                    </div>
                                                    <div>
                                                      <p style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
                                                        Custo Reparo
                                                      </p>
                                                      <p style={{ fontWeight: 700, color: "var(--color-warning)" }}>
                                                        {fmt(ativo.custoAcumulado)}
                                                      </p>
                                                    </div>
                                                    <div>
                                                      <p style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 600 }}>
                                                        Custo Subst.
                                                      </p>
                                                      <p style={{ fontWeight: 700, color: "var(--color-text-secondary)" }}>
                                                        {fmt(ativo.custoSubstituicao)}
                                                      </p>
                                                    </div>
                                                  </div>
                                                </div>
                                                <div className="flex gap-2 mt-4 pt-3" style={{ borderTop: "1px solid var(--color-border)" }}>
                                                  <button
                                                    type="button"
                                                    className="btn btn-secondary btn-sm flex-1"
                                                    style={{ fontSize: "0.75rem", padding: "6px" }}
                                                    onClick={() => {
                                                      toast.success(`Chamado CSA aberto para ${ativo.nome}!`);
                                                    }}
                                                  >
                                                    Abrir Chamado
                                                  </button>
                                                  <button
                                                    type="button"
                                                    className="btn btn-primary btn-sm flex-1"
                                                    style={{ fontSize: "0.75rem", padding: "6px" }}
                                                    disabled={ativo.recomendacao !== "BUY"}
                                                    onClick={() => {
                                                      toast.success(`Cotação de substituição iniciada para ${ativo.nome}!`);
                                                    }}
                                                  >
                                                    Cotar Troca
                                                  </button>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
