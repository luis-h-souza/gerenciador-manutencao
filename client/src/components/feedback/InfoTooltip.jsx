import { useState } from "react";
import { CircleHelp } from "lucide-react";

/**
 * Componente de Tooltip Informativo padronizado para o sistema.
 * @param {string} text - O conteúdo explicativo do tooltip.
 * @param {string} title - O título que aparece no topo do balão.
 * @param {object} balloonStyle - Estilos extras para sobrescrever o posicionamento do balão.
 */
export default function InfoTooltip({ text, title = "Como funciona?", balloonStyle = {} }) {
  const [visible, setVisible] = useState(false);

  return (
    <div
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        marginLeft: "8px",
      }}
    >
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        style={{
          padding: "2px",
          minWidth: "auto",
          width: "22px",
          height: "22px",
          borderRadius: "999px",
          color: "var(--color-warning)",
        }}
      >
        <CircleHelp size={16} />
      </button>
      <div
        style={{
          position: "absolute",
          top: "calc(100% + 8px)",
          right: -140,
          width: "280px",
          padding: "12px 14px",
          borderRadius: "10px",
          background: "var(--color-surface-700)",
          border: "1px solid var(--color-border)",
          color: "var(--color-text-secondary)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
          lineHeight: 1.5,
          zIndex: 100,
          opacity: visible ? 1 : 0,
          visibility: visible ? "visible" : "hidden",
          pointerEvents: visible ? "auto" : "none",
          transition: "all 0.2s ease",
          fontSize: "0.75rem",
          ...balloonStyle,
        }}
      >
        <p
          style={{
            fontWeight: 700,
            color: "var(--color-brand-400)",
            marginBottom: "4px",
          }}
        >
          {title}
        </p>
        {text}
      </div>
    </div>
  );
}
