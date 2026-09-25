// src/pages/chamados/RelatorioIaPage.jsx
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
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
  Printer,
  DollarSign,
  AlertTriangle,
  Target,
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
 * Extrai o texto da análise de qualquer formato retornado pela API
 */
const extrairTextoAnalise = (obj) => {
  if (!obj) return "";
  if (typeof obj === "string") return obj;
  if (typeof obj?.analise === "string") return obj.analise;
  if (typeof obj?.dados?.analise === "string") return obj.dados.analise;
  if (typeof obj?.data?.analise === "string") return obj.data.analise;
  if (typeof obj?.data?.dados?.analise === "string") return obj.data.dados.analise;
  if (typeof obj?.analise?.text === "string") return obj.analise.text;
  if (typeof obj?.texto === "string") return obj.texto;
  if (typeof obj?.text === "string") return obj.text;
  if (typeof obj?.message === "string") return obj.message;
  if (typeof obj?.candidates?.[0]?.content?.parts?.[0]?.text === "string") {
    return obj.candidates[0].content.parts[0].text;
  }
  return "";
};

const normalizarResultadoAnalise = (resposta) => {
  let payload = resposta?.data ?? resposta;

  for (let i = 0; i < 3 && payload && typeof payload === "object"; i += 1) {
    if (extrairTextoAnalise(payload)) break;
    const proximo = payload.dados ?? payload.data ?? payload.resultado ?? payload.result;
    if (!proximo || proximo === payload) break;
    payload = proximo;
  }

  return payload;
};

/**
 * Renderizador de Markdown nativo para visualização limpa e espaçosa
 */
function MarkdownVisualizador({ conteudo }) {
  const textoBruto = typeof conteudo === "string" ? conteudo : extrairTextoAnalise(conteudo);
  const textoParaExibir = textoBruto.replace(/\\([*_`])/g, "$1");

  if (!textoParaExibir) {
    return (
      <p style={{ color: "var(--color-text-muted)", textAlign: "center", padding: "32px" }}>
        Nenhum texto de análise disponível.
      </p>
    );
  }

  const formatarInline = (texto) => {
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

  const linhas = textoParaExibir.split("\n");
  const elementos = [];
  let listaItens = [];
  let tipoLista = null;

  const fecharLista = () => {
    if (listaItens.length > 0) {
      if (tipoLista === "ol") {
        elementos.push(
          <ol
            key={`ol-${elementos.length}`}
            style={{
              paddingLeft: "1.75rem",
              marginBottom: "1.25rem",
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
              paddingLeft: "1.75rem",
              marginBottom: "1.25rem",
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
            margin: "2rem 0",
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
            fontSize: "1.6rem",
            fontWeight: 800,
            color: "var(--color-brand-400, #38bdf8)",
            marginTop: "2rem",
            marginBottom: "1rem",
            borderBottom: "1px solid var(--color-border)",
            paddingBottom: "0.75rem",
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
            fontSize: "1.3rem",
            fontWeight: 700,
            color: "var(--color-brand-300, #7dd3fc)",
            marginTop: "1.75rem",
            marginBottom: "0.75rem",
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
            fontSize: "1.1rem",
            fontWeight: 700,
            color: "var(--color-text-primary, #f8fafc)",
            marginTop: "1.5rem",
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
            fontSize: "1rem",
            fontWeight: 700,
            color: "var(--color-brand-400, #38bdf8)",
            marginTop: "1.2rem",
            marginBottom: "0.4rem",
          }}
        >
          {formatarInline(limpa.replace(/^####\s+/, ""))}
        </h4>
      );
      return;
    }

    const matchNum = limpa.match(/^(\d+)\.\s+(.*)$/);
    if (matchNum) {
      if (tipoLista && tipoLista !== "ol") fecharLista();
      tipoLista = "ol";
      listaItens.push(
        <li
          key={`li-ol-${idx}`}
          style={{
            marginBottom: "0.5rem",
            color: "var(--color-text-secondary, #cbd5e1)",
            lineHeight: "1.8",
          }}
        >
          {formatarInline(matchNum[2])}
        </li>
      );
      return;
    }

    if (limpa.startsWith("* ") || limpa.startsWith("- ")) {
      if (tipoLista && tipoLista !== "ul") fecharLista();
      tipoLista = "ul";
      listaItens.push(
        <li
          key={`li-ul-${idx}`}
          style={{
            marginBottom: "0.5rem",
            color: "var(--color-text-secondary, #cbd5e1)",
            lineHeight: "1.8",
          }}
        >
          {formatarInline(limpa.replace(/^[\*\-]\s+/, ""))}
        </li>
      );
      return;
    }

    if (limpa.startsWith(">")) {
      fecharLista();
      elementos.push(
        <blockquote
          key={`quote-${idx}`}
          style={{
            borderLeft: "4px solid var(--color-brand-500)",
            color: "var(--color-text-muted, #94a3b8)",
            fontStyle: "italic",
            margin: "16px 0",
            background: "rgba(14, 165, 233, 0.06)",
            padding: "12px 20px",
            borderRadius: "0 10px 10px 0",
            lineHeight: "1.75",
          }}
        >
          {formatarInline(limpa.replace(/^>\s*/, ""))}
        </blockquote>
      );
      return;
    }

    fecharLista();
    elementos.push(
      <p
        key={`p-${idx}`}
        style={{
          marginBottom: "1rem",
          color: "var(--color-text-secondary, #cbd5e1)",
          lineHeight: "1.8",
          fontSize: "0.95rem",
        }}
      >
        {formatarInline(limpa)}
      </p>
    );
  });

  fecharLista();

  return <div style={{ wordBreak: "break-word" }}>{elementos}</div>;
}

export default function RelatorioIaPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const mesParam = searchParams.get("mes");
  const anoParam = searchParams.get("ano");
  const regiaoParam = searchParams.get("regiao");
  const unidadeParam = searchParams.get("unidade");

  const [tipoEscopo, setTipoEscopo] = useState(() => {
    if (unidadeParam) return "loja";
    if (regiaoParam) return "regional";
    return "geral";
  });

  const [mes, setMes] = useState(() => (mesParam ? parseInt(mesParam) : new Date().getMonth() + 1));
  const [ano, setAno] = useState(() => (anoParam ? parseInt(anoParam) : new Date().getFullYear()));
  const [regiao, setRegiao] = useState(() => regiaoParam || "");
  const [unidade, setUnidade] = useState(() => unidadeParam || "");

  const [gerando, setGerando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [copiado, setCopiado] = useState(false);

  // Busca lista de regiões disponíveis
  const { data: regioesData } = useQuery({
    queryKey: ["lojas-regioes-ia-page"],
    queryFn: () => lojasService.listarRegioes().then((r) => r.data?.data || []),
  });

  // Busca lista de lojas disponíveis
  const { data: lojasData } = useQuery({
    queryKey: ["lojas-todas-ia-page"],
    queryFn: () =>
      lojasService
        .listar({ limit: 1000, ativo: true })
        .then((r) => r.data?.data || r.data || []),
  });

  const lojasFiltradas = (lojasData || []).filter((l) =>
    regiao ? l.regiao === regiao : true
  );

  const executarAnalise = async (customParams = null) => {
    setGerando(true);
    setResultado(null);
    setCopiado(false);

    try {
      const params = customParams || {
        mes: parseInt(mes),
        ano: parseInt(ano),
      };

      if (!customParams) {
        if (tipoEscopo === "regional" && regiao) {
          params.regiao = regiao;
        } else if (tipoEscopo === "loja") {
          if (regiao) params.regiao = regiao;
          if (unidade) params.unidade = unidade;
        }
      }

      // Atualiza URL
      const newParams = new URLSearchParams();
      newParams.set("mes", String(params.mes));
      newParams.set("ano", String(params.ano));
      if (params.regiao) newParams.set("regiao", params.regiao);
      if (params.unidade) newParams.set("unidade", params.unidade);
      setSearchParams(newParams, { replace: true });

      const res = await chamadosService.analiseIa(params);
      let payload = normalizarResultadoAnalise(res);
      if (payload && payload.dados && !payload.analise && payload.dados.analise) {
        payload = payload.dados;
      }

      if (!extrairTextoAnalise(payload)) {
        throw new Error("A API respondeu, mas não enviou o texto da análise.");
      }

      setResultado(payload);
      toast.success("Relatório gerado com sucesso pelo Gemini!");
    } catch (err) {
      const msg =
        err.response?.data?.mensagem ||
        err.response?.data?.message ||
        err.message ||
        "Erro ao gerar relatório com IA.";
      toast.error(msg);
    } finally {
      setGerando(false);
    }
  };

  // Se veio com parâmetros na URL, executa automaticamente na montagem inicial
  useEffect(() => {
    if (mesParam && anoParam) {
      const params = {
        mes: parseInt(mesParam),
        ano: parseInt(anoParam),
      };
      if (regiaoParam) params.regiao = regiaoParam;
      if (unidadeParam) params.unidade = unidadeParam;
      executarAnalise(params);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopiarTexto = () => {
    const textoParaCopiar = extrairTextoAnalise(resultado);
    if (!textoParaCopiar) return;
    navigator.clipboard.writeText(textoParaCopiar);
    setCopiado(true);
    toast.success("Relatório copiado para a área de transferência!");
    setTimeout(() => setCopiado(false), 3000);
  };

  const handleImprimir = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in pb-12 max-w-7xl mx-auto w-full">
      {/* Topo / Navegação de Volta */}
      <div className="flex items-center justify-between flex-wrap gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate("/chamados")}
            className="btn btn-secondary flex items-center gap-2 h-10 px-3.5"
            style={{ border: "1px solid var(--color-border)" }}
          >
            <ArrowLeft size={18} />
            <span className="font-semibold text-sm">Voltar para Chamados</span>
          </button>

          <div>
            <div className="flex items-center gap-2.5">
              <h1
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 800,
                  color: "var(--color-text-primary)",
                  letterSpacing: "-0.02em",
                }}
              >
                Relatório Financeiro com IA
              </h1>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  padding: "3px 10px",
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
                fontSize: "0.875rem",
                color: "var(--color-text-muted)",
                marginTop: "2px",
              }}
            >
              Auditoria avançada de custos, detecção de anomalias, impacto de mau uso e plano de ação executivo.
            </p>
          </div>
        </div>

        {resultado && (
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleCopiarTexto}
              className="btn btn-secondary flex items-center gap-2 text-sm h-10 px-3.5"
              style={{ border: "1px solid var(--color-border)" }}
            >
              {copiado ? (
                <>
                  <Check size={16} className="text-green-500" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy size={16} />
                  <span>Copiar Texto</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleImprimir}
              className="btn btn-secondary flex items-center gap-2 text-sm h-10 px-3.5"
              style={{ border: "1px solid var(--color-border)" }}
            >
              <Printer size={16} />
              <span>Imprimir / PDF</span>
            </button>
          </div>
        )}
      </div>

      {/* Card de Configuração e Filtros */}
      <div
        className="card p-5 flex flex-col gap-4 print:hidden"
        style={{
          border: "1px solid var(--color-border)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
        }}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Seletor de Escopo */}
          <div className="flex items-center gap-2">
            <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>
              Escopo:
            </span>
            <div
              className="flex items-center gap-1 p-1 rounded-xl border"
              style={{
                background: "var(--color-surface-800)",
                borderColor: "var(--color-border)",
              }}
            >
              <button
                type="button"
                onClick={() => setTipoEscopo("geral")}
                className={`btn btn-sm ${tipoEscopo === "geral" ? "btn-primary" : "btn-ghost"}`}
                style={{ fontSize: "0.8125rem", padding: "6px 12px", borderRadius: "8px" }}
              >
                <Layers size={15} className="mr-1.5 inline" /> Geral (Rede)
              </button>
              <button
                type="button"
                onClick={() => setTipoEscopo("regional")}
                className={`btn btn-sm ${tipoEscopo === "regional" ? "btn-primary" : "btn-ghost"}`}
                style={{ fontSize: "0.8125rem", padding: "6px 12px", borderRadius: "8px" }}
              >
                <MapPin size={15} className="mr-1.5 inline" /> Por Regional
              </button>
              <button
                type="button"
                onClick={() => setTipoEscopo("loja")}
                className={`btn btn-sm ${tipoEscopo === "loja" ? "btn-primary" : "btn-ghost"}`}
                style={{ fontSize: "0.8125rem", padding: "6px 12px", borderRadius: "8px" }}
              >
                <Store size={15} className="mr-1.5 inline" /> Por Loja
              </button>
            </div>
          </div>

          {/* Seletores Condicionais de Região / Loja */}
          <div className="flex items-center gap-3 flex-wrap">
            {(tipoEscopo === "regional" || tipoEscopo === "loja") && (
              <div className="flex items-center gap-2">
                <select
                  className="select"
                  style={{ minWidth: "160px", height: "38px" }}
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
                  style={{ minWidth: "200px", height: "38px" }}
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

            {/* Mês e Ano */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Calendar size={16} style={{ color: "var(--color-text-muted)" }} />
                <select
                  className="select"
                  style={{ minWidth: "130px", height: "38px" }}
                  value={mes}
                  onChange={(e) => setMes(parseInt(e.target.value))}
                >
                  {MESES.map((m, i) => (
                    <option key={i + 1} value={i + 1}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <input
                type="number"
                className="input"
                style={{ width: "90px", height: "38px" }}
                value={ano}
                onChange={(e) => setAno(parseInt(e.target.value))}
                placeholder="Ano"
              />
            </div>

            {/* Botão de Disparo */}
            <button
              type="button"
              onClick={() => executarAnalise()}
              disabled={gerando || (tipoEscopo === "loja" && !unidade)}
              className="btn btn-primary flex items-center gap-2 h-10 px-5"
              style={{
                fontWeight: 700,
                boxShadow: "0 4px 14px rgba(14, 165, 233, 0.35)",
              }}
            >
              {gerando ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Analisando...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Gerar Relatório</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Estado: Carregando Análise */}
      {gerando && (
        <div
          className="card p-16 flex flex-col items-center justify-center text-center"
          style={{ minHeight: "450px" }}
        >
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 animate-pulse"
            style={{
              background: "rgba(14, 165, 233, 0.15)",
              border: "1px solid rgba(14, 165, 233, 0.3)",
              color: "var(--color-brand-400)",
            }}
          >
            <Bot size={40} />
          </div>
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: 800,
              color: "var(--color-text-primary)",
              marginBottom: "8px",
            }}
          >
            O Gemini está processando seus dados de manutenção...
          </h2>
          <p
            style={{
              fontSize: "0.925rem",
              color: "var(--color-text-muted)",
              maxWidth: "520px",
              lineHeight: "1.6",
            }}
          >
            A inteligência artificial está auditando custos por segmento, avaliando impacto de mau uso,
            cruzando padrões com fornecedores e gerando diagnósticos acionáveis para o seu planejamento.
          </p>
        </div>
      )}

      {/* Estado: Vazio / Pronto para gerar */}
      {!gerando && !resultado && (
        <div
          className="card p-16 flex flex-col items-center justify-center text-center"
          style={{ minHeight: "420px" }}
        >
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
            style={{
              background: "var(--color-surface-700)",
              color: "var(--color-brand-400)",
              border: "1px solid var(--color-border)",
            }}
          >
            <Sparkles size={36} />
          </div>
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: 700,
              color: "var(--color-text-primary)",
              marginBottom: "6px",
            }}
          >
            Pronto para auditar e gerar insights
          </h2>
          <p
            style={{
              fontSize: "0.925rem",
              color: "var(--color-text-muted)",
              maxWidth: "480px",
              lineHeight: "1.6",
            }}
          >
            Selecione o escopo desejado (Geral, Regional ou Loja), escolha o período e clique em{" "}
            <strong>"Gerar Relatório"</strong> para obter uma visão analítica completa em tela cheia.
          </p>
        </div>
      )}

      {/* Estado: Resultado Disponível */}
      {!gerando && resultado && (
        <div className="flex flex-col gap-6">
          {/* Métricas Rápidas em Cards de Destaque */}
          {resultado.dados && (
            <div
              className="grid gap-4"
              style={{
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              }}
            >
              {/* Card Total Gasto */}
              <div
                className="card p-5"
                style={{
                  borderLeft: "4px solid var(--color-brand-500)",
                  background: "var(--color-surface-800)",
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "var(--color-text-muted)",
                      textTransform: "uppercase",
                    }}
                  >
                    Total Gasto no Período
                  </span>
                  <DollarSign size={18} style={{ color: "var(--color-brand-400)" }} />
                </div>
                <div
                  style={{
                    fontSize: "1.75rem",
                    fontWeight: 800,
                    color: "var(--color-text-primary)",
                  }}
                >
                  {fmt(resultado.dados.totalGeral?.valor)}
                </div>
                <span
                  style={{
                    fontSize: "0.8125rem",
                    color: "var(--color-text-muted)",
                    marginTop: "4px",
                    display: "block",
                  }}
                >
                  {resultado.dados.totalGeral?.quantidade} chamados computados
                </span>
              </div>

              {/* Card Mau Uso */}
              <div
                className="card p-5"
                style={{
                  borderLeft: "4px solid var(--color-danger)",
                  background: "var(--color-surface-800)",
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "var(--color-danger-600)",
                      textTransform: "uppercase",
                    }}
                  >
                    Gasto com Mau Uso
                  </span>
                  <AlertTriangle size={18} style={{ color: "var(--color-danger)" }} />
                </div>
                <div
                  style={{
                    fontSize: "1.75rem",
                    fontWeight: 800,
                    color: "var(--color-danger-700)",
                  }}
                >
                  {fmt(resultado.dados.mauUso?.valor)}
                </div>
                <span
                  style={{
                    fontSize: "0.8125rem",
                    color: "var(--color-text-muted)",
                    marginTop: "4px",
                    display: "block",
                  }}
                >
                  {resultado.dados.mauUso?.quantidade} registros (
                  <strong style={{ color: "var(--color-danger)" }}>
                    {resultado.dados.mauUso?.percentualGasto}%
                  </strong>{" "}
                  do total)
                </span>
              </div>

              {/* Card Meta */}
              {resultado.dados.meta ? (
                <div
                  className="card p-5"
                  style={{
                    borderLeft: `4px solid ${
                      Number(resultado.dados.meta.percentualUtilizado) > 100
                        ? "var(--color-danger)"
                        : "var(--color-success)"
                    }`,
                    background: "var(--color-surface-800)",
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "var(--color-text-muted)",
                        textTransform: "uppercase",
                      }}
                    >
                      Utilização da Meta
                    </span>
                    <Target size={18} style={{ color: "var(--color-brand-400)" }} />
                  </div>
                  <div
                    style={{
                      fontSize: "1.75rem",
                      fontWeight: 800,
                      color:
                        Number(resultado.dados.meta.percentualUtilizado) > 100
                          ? "var(--color-danger)"
                          : "var(--color-success)",
                    }}
                  >
                    {resultado.dados.meta.percentualUtilizado}%
                  </div>
                  <span
                    style={{
                      fontSize: "0.8125rem",
                      color: "var(--color-text-muted)",
                      marginTop: "4px",
                      display: "block",
                    }}
                  >
                    Budget: {fmt(resultado.dados.meta.valorMeta)}
                  </span>
                </div>
              ) : (
                <div
                  className="card p-5"
                  style={{
                    borderLeft: "4px solid var(--color-border)",
                    background: "var(--color-surface-800)",
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "var(--color-text-muted)",
                        textTransform: "uppercase",
                      }}
                    >
                      Meta Orçamentária
                    </span>
                    <Target size={18} style={{ color: "var(--color-text-muted)" }} />
                  </div>
                  <div
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: 700,
                      color: "var(--color-text-muted)",
                      marginTop: "6px",
                    }}
                  >
                    Sem meta cadastrada
                  </div>
                  <span
                    style={{
                      fontSize: "0.8125rem",
                      color: "var(--color-text-muted)",
                      marginTop: "6px",
                      display: "block",
                    }}
                  >
                    Cadastre em Metas Orçamentárias
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Barra de Metadados do Relatório */}
          <div
            className="card px-5 py-3.5 flex items-center justify-between flex-wrap gap-4 border"
            style={{
              borderColor: "var(--color-border)",
              background: "var(--color-surface-800)",
            }}
          >
            <div className="flex items-center gap-3 flex-wrap">
              <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                Relatório gerado em:{" "}
                <strong style={{ color: "var(--color-text-primary)" }}>
                  {resultado.geradoEm ? new Date(resultado.geradoEm).toLocaleString("pt-BR") : "Agora"}
                </strong>
              </span>

              {resultado.modeloUsado && (
                <span
                  style={{
                    fontSize: "0.75rem",
                    padding: "3px 10px",
                    borderRadius: "6px",
                    background: "rgba(14, 165, 233, 0.15)",
                    color: "var(--color-brand-400)",
                    fontWeight: 700,
                    border: "1px solid rgba(14, 165, 233, 0.25)",
                  }}
                >
                  Modelo: {resultado.modeloUsado}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => executarAnalise()}
              disabled={gerando}
              className="btn btn-secondary flex items-center gap-2 text-xs h-8 px-3"
              style={{ border: "1px solid var(--color-border)" }}
            >
              <RefreshCw size={13} />
              <span>Regerar Análise</span>
            </button>
          </div>

          {/* Conteúdo Principal do Relatório em Tela Cheia */}
          <div
            className="card p-8 sm:p-10 border"
            style={{
              borderColor: "var(--color-border)",
              background: "var(--color-surface-800)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
              borderRadius: "16px",
            }}
          >
            <MarkdownVisualizador conteudo={resultado} />
          </div>
        </div>
      )}
    </div>
  );
}
