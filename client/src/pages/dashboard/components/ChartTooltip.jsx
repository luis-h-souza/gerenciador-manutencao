const fmt = (v) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    v || 0,
  );

export default function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--color-surface-700)",
        border: "1px solid var(--color-border)",
        borderRadius: "8px",
        padding: "10px 14px",
        fontSize: "0.8125rem",
        boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
      }}
    >
      <p
        style={{
          color: "var(--color-text-secondary)",
          marginBottom: "4px",
          fontWeight: 700,
        }}
      >
        {label}
      </p>
      {payload.map((p, i) => {
        const isCurrency =
          p.name?.toLowerCase().includes("custo") ||
          p.name?.toLowerCase().includes("valor") ||
          p.name?.includes("R$") ||
          p.dataKey === "valor" ||
          p.dataKey === "total";
        const isPercent =
          p.name?.toLowerCase().includes("%") ||
          p.name?.toLowerCase().includes("acumulada") ||
          p.dataKey === "acumulado";

        return (
          <p
            key={i}
            style={{
              color: p.color,
              fontWeight: 600,
              display: "flex",
              justifyContent: "space-between",
              gap: "16px",
            }}
          >
            <span>{p.name}:</span>
            <span>
              {isCurrency
                ? fmt(p.value)
                : isPercent
                  ? `${Number(p.value).toFixed(1)}%`
                  : p.value}
            </span>
          </p>
        );
      })}
    </div>
  );
}
