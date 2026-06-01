import { useState } from "react";

// ─── Utilitário: gera lista de meses disponíveis (últimos 24 meses) ────────────
export function gerarOpcoesMes() {
  const hoje = new Date();
  const opcoes = [];
  for (let i = 0; i < 24; i++) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    opcoes.push({
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleString("pt-BR", { month: "long", year: "numeric" }),
      mes: d.getMonth() + 1,
      ano: d.getFullYear(),
    });
  }
  return opcoes;
}

export const OPCOES_MES = gerarOpcoesMes();

export default function useDashboardFilters() {
  const hoje = new Date();
  const [filtro, setFiltro] = useState({
    mes: hoje.getMonth() + 1,
    ano: hoje.getFullYear(),
    regiao: "",
  });

  return [filtro, setFiltro];
}
