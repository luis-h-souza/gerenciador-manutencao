import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  X,
  Bot,
  Sparkles,
  Loader2,
  Calendar,
  Layers,
  MapPin,
  Store,
  RefreshCw,
  Copy,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";
import { chamadosService, lojasService } from "../../services";

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const fmt = (v) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(v || 0);

/**
 * Renderizador de Markdown nativo ultra-resiliente
 * Garante visualização imediata no React 19 sem conflitos de CSS
 */
function MarkdownVisualizador({ conteudo }) {
  if (!conteudo || typeof conteudo !== "string") {
    return (
      <p style={{ color: "var(--color-text-muted)", textAlign: "center", padding: "16px" }}>
        Nenhum texto de análise disponível.
      </p>
    );
  }

  const formatarInline = (texto) => {
    // Quebra partes em negrito **texto**
    const partes = texto.split(/(\*\*.*?\*\*)/g);
    return partes.map((parte, idx) => {
      if (parte.startsWith("**") && parte.endsWith("**")) {
        return (
          <strong key={idx} style={{ color: "#ffffff", fontWeight: 700 }}>
            {parte.slice(2, -2)}
          </strong>
        );
      }
      return parte;
    });
  };

  const linhas = conteudo.split("\n");
  const elementos = [];
  let listaItens = [];
  let tipoLista = null; // 'ul' ou 'ol'

  const fecharLista = () => {
    if (listaItens.length > 0) {
      if (tipoLista === "ol") {
        elementos.push(
          <ol
            key={`ol-${elementos.length}`}
            style={{
              paddingLeft: "1.5rem",
              marginBottom: "1rem",
              listStyleType: "decimal",
              color: "var(--color-text-secondary, #cbd5e1)",
            }}
          >
            {listaItens}
          </ol>
        );
      } else {
        elementos.push(
          <ul
            key={`ul-${elementos.length}`}
            style={{
              paddingLeft: "1.5rem",
              marginBottom: "1rem",
              listStyleType: "disc",
              color: "var(--color-text-secondary, #cbd5e1)",
            }}
          >
            {listaItens}
          </ul>
        );
      }
      listaItens = [];
      tipoLista = null;
    }
  };

  linhas.forEach((linha, idx) => {
    const limpa = linha.trim();

    if (!limpa) {
      fecharLista();
      return;
    }

    if (limpa.startsWith("---") || limpa.startsWith("***")) {
      fecharLista();
      elementos.push(
        <hr
          key={`hr-${idx}`}
          style={{
            borderColor: "var(--color-border)",
            margin: "1.5rem 0",
          }}
        />
      );
      return;
    }

    if (limpa.startsWith("# ")) {
      fecharLista();
      elementos.push(
        <h1
          key={`h1-${idx}`}
          style={{
            fontSize: "1.35rem",
            fontWeight: 800,
            color: "var(--color-brand-400, #38bdf8)",
            marginTop: "1.5rem",
            marginBottom: "0.75rem",
            borderBottom: "1px solid var(--color-border)",
            paddingBottom: "0.5rem",
          }}
        >
          {formatarInline(limpa.replace(/^#\s+/, ""))}
        </h1>
      );
      return;
    }

    if (limpa.startsWith("## ")) {
      fecharLista();
      elementos.push(
        <h2
          key={`h2-${idx}`}
          style={{
            fontSize: "1.15rem",
            fontWeight: 700,
            color: "var(--color-brand-300, #7dd3fc)",
            marginTop: "1.4rem",
            marginBottom: "0.6rem",
          }}
        >
          {formatarInline(limpa.replace(/^##\s+/, ""))}
        </h2>
      );
      return;
    }

    if (limpa.startsWith("### ")) {
      fecharLista();
      elementos.push(
        <h3
          key={`h3-${idx}`}
          style={{
            fontSize: "1rem",
            fontWeight: 700,
            color: "var(--color-text-primary, #f8fafc)",
            marginTop: "1.1rem",
            marginBottom: "0.5rem",
          }}
        >
          {formatarInline(limpa.replace(/^###\s+/, ""))}
        </h3>
      );
      return;
    }

    if (limpa.startsWith("#### ")) {
      fecharLista();
      elementos.push(
        <h4
          key={`h4-${idx}`}
          style={{
            fontSize: "0.925rem",
            fontWeight: 700,
            color: "var(--color-brand-400, #38bdf8)",
            marginTop: "0.9rem",
            marginBottom: "0.4rem",
          }}
        >
          {formatarInline(limpa.replace(/^####\s+/, ""))}
        </h4>
      );
      return;
    }

    // Lista numerada: 1. , 2. , etc.
    const matchNum = limpa.match(/^(\d+)\.\s+(.*)$/);
    if (matchNum) {
      if (tipoLista && tipoLista !== "ol") fecharLista();
      tipoLista = "ol";
      listaItens.push(
        <li
          key={`li-ol-${idx}`}
          style={{
            marginBottom: "0.4rem",
            color: "var(--color-text-secondary, #cbd5e1)",
            lineHeight: "1.75",
          }}
        >
          {formatarInline(matchNum[2])}
        </li>
      );
      return;
    }

    // Lista com bullets: * ou -
    if (limpa.startsWith("* ") || limpa.startsWith("- ")) {
      if (tipoLista && tipoLista !== "ul") fecharLista();
      tipoLista = "ul";
      listaItens.push(
        <li
          key={`li-ul-${idx}`}
          style={{
            marginBottom: "0.4rem",
            color: "var(--color-text-secondary, #cbd5e1)",
            lineHeight: "1.75",
          }}
        >
          {formatarInline(limpa.replace(/^[\*\-]\s+/, ""))}
        </li>
      );
      return;
    }

    // Citação: >
    if (limpa.startsWith(">")) {
      fecharLista();
      elementos.push(
        <blockquote
          key={`quote-${idx}`}
          style={{
            borderLeft: "4px solid var(--color-brand-500)",
            color: "var(--color-text-muted, #94a3b8)",
            fontStyle: "italic",
            margin: "12px 0",
            background: "rgba(14, 165, 233, 0.06)",
            padding: "10px 16px",
            borderRadius: "0 8px 8px 0",
          }}
        >
          {formatarInline(limpa.replace(/^>\s*/, ""))}
        </blockquote>
      );
      return;
    }

    // Parágrafo comum
    fecharLista();
    elementos.push(
      <p
        key={`p-${idx}`}
        style={{
          marginBottom: "0.9rem",
          color: "var(--color-text-secondary, #cbd5e1)",
          lineHeight: "1.75",
        }}
      >
        {formatarInline(limpa)}
      </p>
    );
  });

  fecharLista();

  return <div style={{ wordBreak: "break-word" }}>{elementos}</div>;
}

export default function AnaliseIaModal({
  onClose,
  mesInicial,
  anoInicial,
  regiaoInicial,
  lojaInicial,
}) {
  const [tipoEscopo, setTipoEscopo] = useState(() => {
    if (lojaInicial) return "loja";
    if (regiaoInicial) return "regional";
    return "geral";
  });

  const [mes, setMes] = useState(() => mesInicial || new Date().getMonth() + 1);
  const [ano, setAno] = useState(() => anoInicial || new Date().getFullYear());
  const [regiao, setRegiao] = useState(() => regiaoInicial || "");
  const [unidade, setUnidade] = useState(() => lojaInicial?.nome || "");

  const [gerando, setGerando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [copiado, setCopiado] = useState(false);

  // Busca lista de regiões disponíveis
  const { data: regioesData } = useQuery({
    queryKey: ["lojas-regioes-ia"],
    queryFn: () => lojasService.listarRegioes().then((r) => r.data?.data || []),
  });

  // Busca lista de lojas disponíveis
  const { data: lojasData } = useQuery({
    queryKey: ["lojas-todas-ia"],
    queryFn: () =>
      lojasService
        .listar({ limit: 1000, ativo: true })
        .then((r) => r.data?.data || r.data || []),
  });

  const lojasFiltradas = (lojasData || []).filter((l) =>
    regiao ? l.regiao === regiao : true,
  );

  const handleGerarAnalise = async () => {
    setGerando(true);
    setResultado(null);
    setCopiado(false);

    try {
      const params = {
        mes: parseInt(mes),
        ano: parseInt(ano),
      };

      if (tipoEscopo === "regional" && regiao) {
        params.regiao = regiao;
      } else if (tipoEscopo === "loja") {
        if (regiao) params.regiao = regiao;
        if (unidade) params.unidade = unidade;
      }

      const res = await chamadosService.analiseIa(params);
      
      // Normalização robusta de payload (suporta res.data.dados, res.data.data ou res.data direto)
      let payload = res.data?.dados || res.data?.data || res.data;
      if (payload && payload.dados && !payload.analise && payload.dados.analise) {
        payload = payload.dados;
      }
      
      setResultado(payload);
      toast.success("Análise gerada com sucesso pelo Gemini!");
    } catch (err) {
      const msg =
        err.response?.data?.mensagem ||
        err.response?.data?.message ||
        "Erro ao gerar análise com IA.";
      toast.error(msg);
    } finally {
      setGerando(false);
    }
  };

  const handleCopiarTexto = () => {
    const textoParaCopiar =
      resultado?.analise ||
      resultado?.dados?.analise ||
      (typeof resultado === "string" ? resultado : "");
    if (!textoParaCopiar) return;
    navigator.clipboard.writeText(textoParaCopiar);
    setCopiado(true);
    toast.success("Análise copiada para a área de transferência!");
    setTimeout(() => setCopiado(false), 3000);
  };

  return (
    <div
      className="modal-overlay"
      style={{
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="modal-content animate-fade-in flex flex-col"
        style={{
          width: "100%",
          maxWidth: "880px",
          maxHeight: "90vh",
          borderRadius: "16px",
          overflow: "hidden",
          background: "var(--color-surface-800)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          border: "1px solid var(--color-border)",
        }}
      >
        {/* Topo do Modal */}
        <div
          className="flex items-center justify-between p-5 border-b"
          style={{
            borderColor: "var(--color-border)",
            background:
              "linear-gradient(135deg, rgba(14, 165, 233, 0.12) 0%, rgba(2, 132, 199, 0.04) 100%)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-xl"
              style={{
                background:
                  "linear-gradient(135deg, var(--color-brand-600) 0%, var(--color-brand-500) 100%)",
                color: "#fff",
                boxShadow: "0 4px 12px rgba(14, 165, 233, 0.3)",
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  style={{
                    fontSize: "1.125rem",
                    fontWeight: 700,
                    color: "var(--color-text-primary)",
                  }}
                >
                  Análise Financeira com IA
                </h2>
                <span
                  style={{
                    fontSize: "0.6875rem",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "9999px",
                    background: "rgba(14, 165, 233, 0.15)",
                    color: "var(--color-brand-400)",
                    border: "1px solid rgba(14, 165, 233, 0.3)",
                  }}
                >
                  Google Gemini
                </span>
              </div>
              <p
                style={{
                  fontSize: "0.75rem",
                  color: "var(--color-text-muted)",
                  marginTop: "2px",
                }}
              >
                Diagnóstico de custos, anomalias, mau uso e recomendações
                estratégicas
              </p>
            </div>
          </div>

          <button
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            style={{
              padding: "6px",
              borderRadius: "8px",
              color: "var(--color-text-muted)",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Barra de Filtros e Configuração do Escopo */}
        <div
          className="p-4 border-b flex flex-col gap-3"
          style={{
            borderColor: "var(--color-border)",
            background: "var(--color-surface-700)",
          }}
        >
          <div className="flex items-center gap-4 flex-wrap">
            {/* Tipo de Escopo */}
            <div
              className="flex items-center gap-1 p-1 rounded-lg border"
              style={{
                background: "var(--color-surface-900)",
                borderColor: "var(--color-border)",
              }}
            >
              <button
                type="button"
                onClick={() => setTipoEscopo("geral")}
                className={`btn btn-sm ${
                  tipoEscopo === "geral" ? "btn-primary" : "btn-ghost"
                }`}
                style={{ fontSize: "0.75rem", padding: "4px 10px" }}
              >
                <Layers size={14} className="mr-1 inline" /> Geral (Rede)
              </button>
              <button
                type="button"
                onClick={() => setTipoEscopo("regional")}
                className={`btn btn-sm ${
                  tipoEscopo === "regional" ? "btn-primary" : "btn-ghost"
                }`}
                style={{ fontSize: "0.75rem", padding: "4px 10px" }}
              >
                <MapPin size={14} className="mr-1 inline" /> Por Regional
              </button>
              <button
                type="button"
                onClick={() => setTipoEscopo("loja")}
                className={`btn btn-sm ${
                  tipoEscopo === "loja" ? "btn-primary" : "btn-ghost"
                }`}
                style={{ fontSize: "0.75rem", padding: "4px 10px" }}
              >
                <Store size={14} className="mr-1 inline" /> Por Loja
              </button>
            </div>

            {/* Seletores de Região / Loja condicionais */}
            {(tipoEscopo === "regional" || tipoEscopo === "loja") && (
              <div className="flex items-center gap-2">
                <select
                  className="select"
                  style={{ minWidth: "140px", fontSize: "0.8125rem" }}
                  value={regiao}
                  onChange={(e) => {
                    setRegiao(e.target.value);
                    if (tipoEscopo === "loja") setUnidade("");
                  }}
                >
                  <option value="">Todas as Regionais</option>
                  {(regioesData || []).map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {tipoEscopo === "loja" && (
              <div className="flex items-center gap-2">
                <select
                  className="select"
                  style={{ minWidth: "160px", fontSize: "0.8125rem" }}
                  value={unidade}
                  onChange={(e) => setUnidade(e.target.value)}
                >
                  <option value="">Selecione uma loja...</option>
                  {lojasFiltradas.map((l) => (
                    <option key={l.id} value={l.nome}>
                      {l.numero ? `${l.numero} - ${l.nome}` : l.nome}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Período */}
            <div className="flex items-center gap-2 ml-auto">
              <Calendar
                size={15}
                style={{ color: "var(--color-text-muted)" }}
              />
              <select
                className="select"
                style={{ minWidth: "120px", fontSize: "0.8125rem" }}
                value={mes}
                onChange={(e) => setMes(parseInt(e.target.value))}
              >
                {MESES.map((m, i) => (
                  <option key={i + 1} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
              <input
                type="number"
                className="input"
                style={{ width: "80px", fontSize: "0.8125rem" }}
                value={ano}
                onChange={(e) => setAno(parseInt(e.target.value))}
                placeholder="Ano"
              />
            </div>

            {/* Botão Gerar */}
            <button
              onClick={handleGerarAnalise}
              disabled={gerando || (tipoEscopo === "loja" && !unidade)}
              className="btn btn-primary"
              style={{
                fontWeight: 600,
                padding: "8px 16px",
                boxShadow: "0 4px 12px rgba(14, 165, 233, 0.25)",
              }}
            >
              {gerando ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-1" />{" "}
                  Analisando...
                </>
              ) : (
                <>
                  <Sparkles size={16} className="mr-1" /> Gerar Análise
                </>
              )}
            </button>
          </div>
        </div>

        {/* Corpo com o Resultado da Análise */}
        <div
          className="p-6 overflow-y-auto flex-1"
          style={{
            minHeight: "360px",
            background: "var(--color-surface-800)",
          }}
        >
          {gerando && (
            <div
              className="flex flex-col items-center justify-center p-12 text-center"
              style={{ minHeight: "300px" }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 animate-pulse"
                style={{
                  background: "rgba(14, 165, 233, 0.15)",
                  border: "1px solid rgba(14, 165, 233, 0.3)",
                  color: "var(--color-brand-400)",
                }}
              >
                <Bot size={32} />
              </div>
              <h3
                style={{
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: "var(--color-text-primary)",
                  marginBottom: "6px",
                }}
              >
                O Gemini está analisando seus dados de manutenção...
              </h3>
              <p
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--color-text-muted)",
                  maxWidth: "400px",
                }}
              >
                Cruzando métricas de segmentos, desvios de orçamento, histórico
                de mau uso e padrões de fornecedores para formular
                recomendações.
              </p>
            </div>
          )}

          {!gerando && !resultado && (
            <div
              className="flex flex-col items-center justify-center p-12 text-center"
              style={{ minHeight: "300px" }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{
                  background: "var(--color-surface-700)",
                  color: "var(--color-text-muted)",
                }}
              >
                <Sparkles size={28} />
              </div>
              <h3
                style={{
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: "var(--color-text-primary)",
                  marginBottom: "4px",
                }}
              >
                Pronto para gerar insights
              </h3>
              <p
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--color-text-muted)",
                  maxWidth: "420px",
                }}
              >
                Escolha o escopo (Geral, Regional ou Loja) e o período desejado e
                clique em <strong>"Gerar Análise"</strong> para receber um
                diagnóstico completo elaborado por Inteligência Artificial.
              </p>
            </div>
          )}

          {!gerando && resultado && (
            <div className="flex flex-col gap-6 animate-fade-in">
              {/* Mini Cards com resumo rápido dos dados */}
              {resultado.dados && (
                <div
                  className="grid gap-3"
                  style={{
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(180px, 1fr))",
                  }}
                >
                  <div
                    className="card"
                    style={{
                      padding: "12px 16px",
                      borderLeft: "3px solid var(--color-brand-500)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.6875rem",
                        fontWeight: 600,
                        color: "var(--color-text-muted)",
                        textTransform: "uppercase",
                      }}
                    >
                      Total Gasto
                    </span>
                    <div
                      style={{
                        fontSize: "1.125rem",
                        fontWeight: 800,
                        color: "var(--color-text-primary)",
                        marginTop: "2px",
                      }}
                    >
                      {fmt(resultado.dados.totalGeral?.valor)}
                    </div>
                    <span
                      style={{
                        fontSize: "0.6875rem",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      {resultado.dados.totalGeral?.quantidade} chamados
                    </span>
                  </div>

                  <div
                    className="card"
                    style={{
                      padding: "12px 16px",
                      borderLeft: "3px solid var(--color-danger)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.6875rem",
                        fontWeight: 600,
                        color: "var(--color-danger-600)",
                        textTransform: "uppercase",
                      }}
                    >
                      Mau Uso
                    </span>
                    <div
                      style={{
                        fontSize: "1.125rem",
                        fontWeight: 800,
                        color: "var(--color-danger-700)",
                        marginTop: "2px",
                      }}
                    >
                      {fmt(resultado.dados.mauUso?.valor)}
                    </div>
                    <span
                      style={{
                        fontSize: "0.6875rem",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      {resultado.dados.mauUso?.quantidade} registros (
                      {resultado.dados.mauUso?.percentualGasto}%)
                    </span>
                  </div>

                  {resultado.dados.meta ? (
                    <div
                      className="card"
                      style={{
                        padding: "12px 16px",
                        borderLeft: `3px solid ${
                          Number(resultado.dados.meta.percentualUtilizado) > 100
                            ? "var(--color-danger)"
                            : "var(--color-success)"
                        }`,
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.6875rem",
                          fontWeight: 600,
                          color: "var(--color-text-muted)",
                          textTransform: "uppercase",
                        }}
                      >
                        Uso da Meta
                      </span>
                      <div
                        style={{
                          fontSize: "1.125rem",
                          fontWeight: 800,
                          color: "var(--color-text-primary)",
                          marginTop: "2px",
                        }}
                      >
                        {resultado.dados.meta.percentualUtilizado}%
                      </div>
                      <span
                        style={{
                          fontSize: "0.6875rem",
                          color: "var(--color-text-muted)",
                        }}
                      >
                        Meta: {fmt(resultado.dados.meta.valorMeta)}
                      </span>
                    </div>
                  ) : (
                    <div
                      className="card"
                      style={{
                        padding: "12px 16px",
                        borderLeft: "3px solid var(--color-border)",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.6875rem",
                          fontWeight: 600,
                          color: "var(--color-text-muted)",
                          textTransform: "uppercase",
                        }}
                      >
                        Meta Orçamentária
                      </span>
                      <div
                        style={{
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          color: "var(--color-text-muted)",
                          marginTop: "4px",
                        }}
                      >
                        Sem meta cadastrada
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Barra de Ações do Relatório */}
              <div
                className="flex items-center justify-between p-3 rounded-lg border"
                style={{
                  borderColor: "var(--color-border)",
                  background: "var(--color-surface-700)",
                }}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    Gerado em:{" "}
                    <strong>
                      {resultado.geradoEm
                        ? new Date(resultado.geradoEm).toLocaleString("pt-BR")
                        : "Agora"}
                    </strong>
                  </span>
                  {resultado.modeloUsado && (
                    <span
                      style={{
                        fontSize: "0.6875rem",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        background: "rgba(14, 165, 233, 0.15)",
                        color: "var(--color-brand-400)",
                        fontWeight: 600,
                        border: "1px solid rgba(14, 165, 233, 0.25)",
                      }}
                    >
                      {resultado.modeloUsado}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopiarTexto}
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: "0.75rem" }}
                  >
                    {copiado ? (
                      <>
                        <Check size={14} className="mr-1 text-green-500" />{" "}
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy size={14} className="mr-1" /> Copiar Análise
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleGerarAnalise}
                    disabled={gerando}
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: "0.75rem" }}
                  >
                    <RefreshCw size={14} className="mr-1" /> Recalcular
                  </button>
                </div>
              </div>

              {/* Texto Markdown Renderizado */}
              <div
                className="p-6 rounded-xl border"
                style={{
                  borderColor: "var(--color-border)",
                  background: "var(--color-surface-900)",
                  lineHeight: "1.75",
                  fontSize: "0.875rem",
                  color: "var(--color-text-primary, #e2e8f0)",
                }}
              >
                <MarkdownVisualizador
                  conteudo={
                    resultado?.analise ||
                    resultado?.dados?.analise ||
                    (typeof resultado === "string" ? resultado : "") ||
                    resultado?.texto ||
                    resultado?.message ||
                    ""
                  }
                />
              </div>
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div
          className="p-4 border-t flex items-center justify-between"
          style={{
            borderColor: "var(--color-border)",
            background: "var(--color-surface-700)",
          }}
        >
          <span
            style={{
              fontSize: "0.6875rem",
              color: "var(--color-text-muted)",
            }}
          >
            Insights gerados via Inteligência Artificial Google Gemini para apoio
            à decisão.
          </span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
