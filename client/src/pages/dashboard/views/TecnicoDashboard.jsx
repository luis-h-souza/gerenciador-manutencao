import { useQuery } from "@tanstack/react-query";
import { ClipboardList } from "lucide-react";
import { tarefasService } from "../../../services";
import StatCard from "../components/StatCard";

export default function TecnicoDashboard() {
  const { data: tarefasRes, isLoading } = useQuery({
    queryKey: ["dashboard-tecnico-tarefas"],
    queryFn: () => tarefasService.listar({ limit: 50 }).then((r) => r.data),
  });

  const tarefas = tarefasRes?.data || [];
  const pendentes = tarefas.filter((t) => t.status === "PENDENTE");
  const emAndamento = tarefas.filter((t) => t.status === "EM_ANDAMENTO");

  if (isLoading)
    return (
      <div
        className="skeleton"
        style={{ height: "200px", borderRadius: "12px" }}
      />
    );

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <h2
        style={{
          fontSize: "1.25rem",
          fontWeight: 600,
          color: "var(--color-text-primary)",
        }}
      >
        Visão Resumida (Técnico)
      </h2>
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}
      >
        <StatCard
          label="Tarefas Pendentes"
          value={pendentes.length}
          sub={`${emAndamento.length} em andamento`}
          icon={ClipboardList}
          accent="var(--color-brand-500)"
        />
      </div>

      <div className="card mt-2">
        <h3
          style={{
            fontSize: "1rem",
            fontWeight: 600,
            color: "var(--color-text-primary)",
            marginBottom: "16px",
          }}
        >
          Minhas Próximas Tarefas
        </h3>
        {tarefas.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
            Nenhuma tarefa atribuída a você no momento.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {tarefas.slice(0, 5).map((t) => (
              <div
                key={t.id}
                style={{
                  padding: "12px",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <p
                    style={{
                      fontWeight: 500,
                      fontSize: "0.875rem",
                      color: "var(--color-text-primary)",
                    }}
                  >
                    {t.descricao}
                  </p>
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    {t.areResponsavel} • Prioridade: {t.prioridade}
                  </p>
                </div>
                <span
                  className={`badge ${t.status === "CONCLUIDA" ? "badge-success" : t.status === "EM_ANDAMENTO" ? "badge-warning" : "badge-neutral"}`}
                >
                  {t.status.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
