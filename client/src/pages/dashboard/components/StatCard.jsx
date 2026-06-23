import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function StatCard({ label, value, sub, icon: Icon, accent, trend }) {
  const trendIcon =
    trend > 0 ? (
      <TrendingUp size={13} style={{ color: "var(--color-danger)" }} />
    ) : trend < 0 ? (
      <TrendingDown size={13} style={{ color: "var(--color-success)" }} />
    ) : (
      <Minus size={13} style={{ color: "var(--color-text-muted)" }} />
    );

  return (
    <div className="stat-card h-full flex flex-col justify-center" style={{ "--stat-accent": accent }}>
      <div className="flex items-start justify-between">
        <div>
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--color-text-muted)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {label}
          </p>
          <p
            style={{
              fontSize: "1.625rem",
              fontWeight: 700,
              color: "var(--color-text-primary)",
              marginTop: "6px",
              lineHeight: 1,
            }}
          >
            {value}
          </p>
          {sub && (
            <div className="flex items-center gap-1 mt-2">
              {trend !== undefined && trendIcon}
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "var(--color-text-muted)",
                }}
              >
                {sub}
              </p>
            </div>
          )}
        </div>
        <div
          className="flex items-center justify-center w-10 h-10 rounded-xl"
          style={{
            background: accent
              ? "rgba(14, 165, 233, 0.1)"
              : "var(--color-surface-600)",
            color: accent || "var(--color-brand-500)",
          }}
        >
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}
