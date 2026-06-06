import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, ClipboardCheck, AlertTriangle } from "lucide-react";
import { dashboardService } from "../../services";
import { useAuth } from "../../contexts/AuthContext";

// Views
import TecnicoDashboard from "./views/TecnicoDashboard";
import GestorDashboard from "./views/GestorDashboard";
import CorporativoDashboard from "./views/CorporativoDashboard";
import ConformidadeDashboard from "./views/ConformidadeDashboard";
import BuyVsMaintainDashboard from "./views/BuyVsMaintainDashboard";

export default function DashboardPage() {
  const { usuario } = useAuth();
  const hoje = new Date();
  const [filtro, setFiltro] = useState({
    mes: hoje.getMonth() + 1,
    ano: hoje.getFullYear(),
    regiao: "",
  });
  const [tabAtiva, setTabAtiva] = useState("indicadores");

  const isCoordenador = usuario?.role === "COORDENADOR";
  const { data: regionalResCoordenador } = useQuery({
    queryKey: ["dashboard-regional-coordenador"],
    queryFn: () =>
      dashboardService
        .regional({
          mes: hoje.getMonth() + 1,
          ano: hoje.getFullYear(),
          regiao: "",
        })
        .then((r) => r.data),
    enabled: isCoordenador,
    staleTime: 5 * 60 * 1000,
  });
  const opcoesRegionaisCoordenador = (regionalResCoordenador?.data || []).map(
    (r) => r.regiao,
  );

  const macroRoles = ["ADMINISTRADOR", "DIRETOR", "GERENTE"];
  const temTabs = [...macroRoles, "COORDENADOR"].includes(usuario?.role);

  if (usuario?.role === "TECNICO") return <TecnicoDashboard />;

  if (!temTabs) {
    return (
      <GestorDashboard
        filtro={filtro}
        setFiltro={setFiltro}
        opcoesRegionais={opcoesRegionaisCoordenador}
      />
    );
  }

  return (
    <div
      className="flex flex-col gap-6 animate-fade-in"
      style={{ paddingBottom: "24px" }}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--color-border)] pb-4">
        <div>
          <h1
            style={{
              fontSize: "1.375rem",
              fontWeight: 700,
              color: "var(--color-text-primary)",
            }}
          >
            Painel Executivo de Manutenção
          </h1>
          <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
            Acompanhe a conformidade de infraestrutura, tendências financeiras e
            análises de ciclo de vida de ativos.
          </p>
        </div>

        <div className="flex items-center bg-[var(--color-surface-700)] p-1 rounded-xl border border-[var(--color-border)]">
          <button
            onClick={() => setTabAtiva("indicadores")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              tabAtiva === "indicadores"
                ? "bg-[var(--color-brand-500)] text-white shadow-md"
                : "text-[var(--color-text-secondary)] hover:text-white"
            }`}
          >
            <BarChart3 size={15} />
            <span>Indicadores</span>
          </button>
          <button
            onClick={() => setTabAtiva("conformidade")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              tabAtiva === "conformidade"
                ? "bg-[var(--color-brand-500)] text-white shadow-md"
                : "text-[var(--color-text-secondary)] hover:text-white"
            }`}
          >
            <ClipboardCheck size={15} />
            <span>Conformidade</span>
          </button>
          <button
            onClick={() => setTabAtiva("buy-vs-maintain")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              tabAtiva === "buy-vs-maintain"
                ? "bg-[var(--color-brand-500)] text-white shadow-md"
                : "text-[var(--color-text-secondary)] hover:text-white"
            }`}
          >
            <AlertTriangle size={15} />
            <span>Comprar vs. Manter</span>
          </button>
        </div>
      </div>

      {tabAtiva === "indicadores" &&
        (macroRoles.includes(usuario?.role) ? (
          <CorporativoDashboard filtro={filtro} setFiltro={setFiltro} />
        ) : (
          <GestorDashboard
            filtro={filtro}
            setFiltro={setFiltro}
            opcoesRegionais={opcoesRegionaisCoordenador}
          />
        ))}

      {tabAtiva === "conformidade" && <ConformidadeDashboard filtro={filtro} />}

      {tabAtiva === "buy-vs-maintain" && <BuyVsMaintainDashboard />}
    </div>
  );
}
