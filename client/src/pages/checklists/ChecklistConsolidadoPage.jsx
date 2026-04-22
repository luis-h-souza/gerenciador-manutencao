import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../contexts/AuthContext";
import { checklistService, usuariosService } from "../../services";
import { ChevronDown, Calendar, ArrowLeft } from "lucide-react";

// ─── Componente Card de Checklist ────────────────────────────────────────────
const ChecklistCard = ({ item, tipo, onClick }) => {
  const isEquipamento = tipo === "equipamento";
  const defeito = isEquipamento ? item.defeito : item.quebrados;
  const total = item.total;
  const percentual = item.percentual || 0;

  const getStatusColor = () => {
    if (percentual >= 50) return "bg-red-50 border-red-200";
    if (percentual >= 25) return "bg-yellow-50 border-yellow-200";
    return "bg-green-50 border-green-200";
  };

  const getStatusBadgeColor = () => {
    if (percentual >= 50) return "bg-red-100 text-red-800";
    if (percentual >= 25) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  return (
    <div
      onClick={onClick}
      className={`p-4 border-2 rounded-lg cursor-pointer transition hover:shadow-md ${getStatusColor()}`}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="font-semibold text-gray-700">{item.tipoLabel}</h4>
          <p className="text-sm text-gray-500">
            {isEquipamento ? "Equipamento" : "Carrinho"}
          </p>
        </div>
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor()}`}
        >
          {percentual}%
        </span>
      </div>

      <div className="space-y-1">
        <p className="text-sm text-gray-600">
          {isEquipamento ? "Com defeito" : "Quebrados"}:{" "}
          <span className="font-semibold">{defeito}</span> / {total}
        </p>
      </div>
    </div>
  );
};

// ─── Seletor de Semana ───────────────────────────────────────────────────────
const SemanaSelect = ({ semanas, semanaAtual, onMudar }) => {
  return (
    <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-2">
      <Calendar className="w-4 h-4 text-gray-500" />
      <select
        value={semanaAtual}
        onChange={(e) => onMudar(parseInt(e.target.value))}
        className="bg-transparent text-sm font-medium outline-none"
      >
        {semanas.map((sem) => (
          <option key={sem.numero} value={sem.numero}>
            {sem.label}
          </option>
        ))}
      </select>
      <ChevronDown className="w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
};

// ─── Modal de Detalhes do Card ───────────────────────────────────────────────
const ChecklistCardModal = ({ item, tipo, semanas, onClose }) => {
  const [semanaAtual, setSemanaAtual] = useState(semanas[0]?.numero || 1);

  const semanadados = semanas.find((s) => s.numero === semanaAtual);
  const isEquipamento = tipo === "equipamento";
  const items = semanadados
    ? isEquipamento
      ? semanadados.equipamentos
      : semanadados.carrinhos
    : [];
  const itemAtual = items.find((i) =>
    isEquipamento
      ? i.tipoEquipamento === item.tipo
      : i.tipoCarrinho === item.tipo,
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-96 overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900">{item.tipoLabel}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        <div className="mb-4">
          <SemanaSelect
            semanas={semanas}
            semanaAtual={semanaAtual}
            onMudar={setSemanaAtual}
          />
        </div>

        {itemAtual ? (
          <div className="space-y-3 text-sm">
            <div>
              <label className="text-gray-600">Status:</label>
              <p className="font-semibold">
                {isEquipamento
                  ? itemAtual.quantidadeQuebrada > 0
                    ? "Com problemas"
                    : "Operacional"
                  : itemAtual.quebrados > 0
                    ? "Com quebrados"
                    : "Tudo OK"}
              </p>
            </div>

            {isEquipamento ? (
              <>
                <div>
                  <label className="text-gray-600">Quantidade:</label>
                  <p className="font-semibold">{itemAtual.quantidade}</p>
                </div>
                <div>
                  <label className="text-gray-600">Defeituosos:</label>
                  <p className="font-semibold text-red-600">
                    {itemAtual.quantidadeQuebrada || 0}
                  </p>
                </div>
                {itemAtual.numeroSerie && (
                  <div>
                    <label className="text-gray-600">Série:</label>
                    <p className="font-semibold">{itemAtual.numeroSerie}</p>
                  </div>
                )}
              </>
            ) : (
              <>
                <div>
                  <label className="text-gray-600">Total:</label>
                  <p className="font-semibold">{itemAtual.total}</p>
                </div>
                <div>
                  <label className="text-gray-600">Quebrados:</label>
                  <p className="font-semibold text-red-600">
                    {itemAtual.quebrados || 0}
                  </p>
                </div>
              </>
            )}

            {itemAtual.numeroChamado && (
              <div>
                <label className="text-gray-600">Chamado:</label>
                <p className="font-semibold">{itemAtual.numeroChamado}</p>
              </div>
            )}

            {itemAtual.descricaoProblema && (
              <div>
                <label className="text-gray-600">Descrição:</label>
                <p className="font-semibold text-gray-700">
                  {itemAtual.descricaoProblema}
                </p>
              </div>
            )}

            {itemAtual.valor && (
              <div>
                <label className="text-gray-600">Valor:</label>
                <p className="font-semibold">R$ {itemAtual.valor.toFixed(2)}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500 text-center">
            Sem dados para esta semana
          </p>
        )}

        <button
          onClick={onClose}
          className="w-full mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Fechar
        </button>
      </div>
    </div>
  );
};

// ─── Visualização de Loja Consolidada ────────────────────────────────────────
const ChecklistLojaConsolidado = ({ loja, mes, ano, semanas, onVoltar }) => {
  const [semanaAtual, setSemanaAtual] = useState(semanas[0]?.numero || 1);
  const [cardSelecionado, setCardSelecionado] = useState(null);

  const semanadados = semanas.find((s) => s.numero === semanaAtual);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={onVoltar}
            className="text-blue-600 hover:text-blue-800 text-sm mb-2 flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
          <h2 className="text-2xl font-bold text-gray-900">{loja.nome}</h2>
          <p className="text-gray-600">Unidade: {loja.unidade}</p>
        </div>

        {semanas.length > 0 && (
          <SemanaSelect
            semanas={semanas}
            semanaAtual={semanaAtual}
            onMudar={setSemanaAtual}
          />
        )}
      </div>

      {semanadados ? (
        <div className="space-y-6">
          {semanadados.equipamentos && semanadados.equipamentos.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Equipamentos
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {semanadados.equipamentos.map((equip) => (
                  <ChecklistCard
                    key={equip.tipoEquipamento}
                    item={equip}
                    tipo="equipamento"
                    onClick={() =>
                      setCardSelecionado({ ...equip, tipo: "equipamento" })
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {semanadados.carrinhos && semanadados.carrinhos.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Carrinhos
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {semanadados.carrinhos.map((carrinho) => (
                  <ChecklistCard
                    key={carrinho.tipoCarrinho}
                    item={carrinho}
                    tipo="carrinho"
                    onClick={() =>
                      setCardSelecionado({ ...carrinho, tipo: "carrinho" })
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {(!semanadados.equipamentos ||
            semanadados.equipamentos.length === 0) &&
            (!semanadados.carrinhos || semanadados.carrinhos.length === 0) && (
              <div className="text-center py-12 text-gray-500">
                Sem dados para esta semana
              </div>
            )}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">Carregando...</div>
      )}

      {cardSelecionado && (
        <ChecklistCardModal
          item={cardSelecionado}
          tipo={cardSelecionado.tipo}
          semanas={semanas}
          onClose={() => setCardSelecionado(null)}
        />
      )}
    </div>
  );
};

// ─── Modal de Lojas da Regional ──────────────────────────────────────────────
const RegionalChecklistDrilldown = ({
  regional,
  mes,
  ano,
  onClose,
  onSelecionarLoja,
}) => {
  const { data: lojaDetalhes, isLoading } = useQuery({
    queryKey: ["checklist-consolidado-loja", mes, ano, regional?.nome],
    enabled: !!regional,
    queryFn: async () => {
      const promises = regional.lojas.map((loja) =>
        checklistService.consolidadoLoja({ mes, ano, unidade: loja.unidade }),
      );
      const resultados = await Promise.all(promises);
      return resultados.reduce((acc, res, idx) => {
        acc[regional.lojas[idx].unidade] = res.data;
        return acc;
      }, {});
    },
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Lojas - {regional?.nome}
        </h3>

        {isLoading ? (
          <p className="text-center text-gray-500 py-8">Carregando lojas...</p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {regional?.lojas?.map((loja) => (
              <button
                key={loja.unidade}
                onClick={() =>
                  onSelecionarLoja(
                    loja,
                    lojaDetalhes?.[loja.unidade]?.semanas || [],
                  )
                }
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left"
              >
                <h4 className="font-semibold text-gray-900">{loja.nome}</h4>
                <p className="text-sm text-gray-500">Unidade: {loja.unidade}</p>
              </button>
            ))}
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full mt-6 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
        >
          Fechar
        </button>
      </div>
    </div>
  );
};

// ─── View: Gerente/Diretor → Lista de Coordenadores ────────────────────────
const CoordenadorList = ({ mes, ano, onSelecionarCoordenador, onVoltar }) => {
  const { usuario } = useAuth();

  const { data: coordenadores, isLoading } = useQuery({
    queryKey: ["usuarios-coordenadores", usuario?.regiao],
    queryFn: () =>
      usuariosService
        .listar({
          role: "COORDENADOR",
          ...(usuario?.regiao ? { regiao: usuario.regiao } : {}),
        })
        .then((res) => res.data),
  });

  return (
    <div className="p-6">
      <button
        onClick={onVoltar}
        className="text-blue-600 hover:text-blue-800 text-sm mb-4 flex items-center gap-1"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>

      <h2 className="text-2xl font-bold text-gray-900 mb-6">Coordenadores</h2>

      {isLoading ? (
        <p className="text-center text-gray-500 py-8">Carregando...</p>
      ) : coordenadores?.length > 0 ? (
        <div className="grid grid-cols-3 gap-4">
          {coordenadores.map((coord) => (
            <button
              key={coord.id}
              onClick={() => onSelecionarCoordenador(coord)}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left"
            >
              <h3 className="font-semibold text-gray-900">{coord.nome}</h3>
              <p className="text-sm text-gray-500">
                Regional: {coord.regiao || "N/A"}
              </p>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          Sem coordenadores para exibir
        </div>
      )}
    </div>
  );
};

// ─── View: Coordenador → Lista de Regionais/Lojas ────────────────────────────
const RegionalList = ({
  mes,
  ano,
  coordenadorSelecionado,
  onVoltar,
  onSelecionarRegional,
}) => {
  const { usuario } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: [
      "checklist-consolidado-regional",
      mes,
      ano,
      coordenadorSelecionado?.regiao,
    ],
    queryFn: () =>
      checklistService
        .consolidadoRegional({
          mes,
          ano,
          regiao: coordenadorSelecionado?.regiao,
        })
        .then((res) => res.data),
  });

  return (
    <div className="p-6">
      <button
        onClick={onVoltar}
        className="text-blue-600 hover:text-blue-800 text-sm mb-4 flex items-center gap-1"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>

      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Regional: {coordenadorSelecionado?.regiao}
      </h2>
      <p className="text-gray-600 mb-6">
        Coordenador: {coordenadorSelecionado?.nome}
      </p>

      {isLoading ? (
        <p className="text-center text-gray-500 py-8">Carregando lojas...</p>
      ) : data?.lojas && data.lojas.length > 0 ? (
        <div className="grid grid-cols-3 gap-4">
          {data.lojas.map((loja) => (
            <button
              key={loja.unidade}
              onClick={() => onSelecionarRegional(loja, data.lojas)}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left"
            >
              <h3 className="font-semibold text-gray-900">{loja.nome}</h3>
              <p className="text-sm text-gray-500">Unidade: {loja.unidade}</p>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          Sem lojas para exibir
        </div>
      )}
    </div>
  );
};

// ─── View: Diretor → Lista de Gerentes ──────────────────────────────────────
const GerenteList = ({ mes, ano, onSelecionarGerente }) => {
  const { data: gerentes, isLoading } = useQuery({
    queryKey: ["usuarios-gerentes"],
    queryFn: () =>
      usuariosService.listar({ role: "GERENTE" }).then((res) => res.data),
  });

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Gerentes</h2>

      {isLoading ? (
        <p className="text-center text-gray-500 py-8">Carregando...</p>
      ) : gerentes?.length > 0 ? (
        <div className="grid grid-cols-3 gap-4">
          {gerentes.map((gerente) => (
            <button
              key={gerente.id}
              onClick={() => onSelecionarGerente(gerente)}
              className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition text-left"
            >
              <h3 className="font-semibold text-gray-900">{gerente.nome}</h3>
              <p className="text-sm text-gray-500">
                Regionais: {gerente.regionaisSupervisao?.join(", ") || "N/A"}
              </p>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          Sem gerentes para exibir
        </div>
      )}
    </div>
  );
};

// ─── Página Principal ────────────────────────────────────────────────────────
export default function ChecklistConsolidadoPage() {
  const { usuario } = useAuth();
  const agora = new Date();
  const [mes, setMes] = useState(agora.getMonth() + 1);
  const [ano, setAno] = useState(agora.getFullYear());

  const [etapa, setEtapa] = useState("inicio"); // 'inicio', 'gerentes', 'coordenadores', 'regionais', 'lojas'
  const [gerenteSelecionado, setGerenteSelecionado] = useState(null);
  const [coordenadorSelecionado, setCoordenadorSelecionado] = useState(null);
  const [lojaSelecionada, setLojaSelecionada] = useState(null);
  const [semanas, setSemanas] = useState([]);

  if (
    !["ADMINISTRADOR", "DIRETOR", "GERENTE", "COORDENADOR", "GESTOR"].includes(
      usuario?.role,
    )
  ) {
    return <div className="p-6 text-center text-red-600">Acesso negado</div>;
  }

  // Roteamento por role
  const ehDiretor =
    usuario?.role === "ADMINISTRADOR" || usuario?.role === "DIRETOR";
  const ehGerente = usuario?.role === "GERENTE";
  const ehCoordenador = usuario?.role === "COORDENADOR";

  const handleIniciar = () => {
    if (ehDiretor) {
      setEtapa("gerentes");
    } else if (ehGerente) {
      setEtapa("coordenadores");
    } else if (ehCoordenador) {
      setEtapa("regionais");
    }
  };

  const handleSelecionarGerente = (gerente) => {
    setGerenteSelecionado(gerente);
    setEtapa("coordenadores");
  };

  const handleSelecionarCoordenador = (coordenador) => {
    setCoordenadorSelecionado(coordenador);
    setEtapa("regionais");
  };

  const handleSelecionarRegional = (loja, todasAsLojas) => {
    setLojaSelecionada(loja);
    const semanas_array = Object.keys(loja.consolidado)
      .sort()
      .map((key, idx) => ({
        numero: idx + 1,
        label: `Semana ${idx + 1}`,
      }));
    setSemanas(semanas_array);
    setEtapa("lojas");
  };

  const handleVoltar = () => {
    if (etapa === "gerentes") {
      setEtapa("inicio");
    } else if (etapa === "coordenadores") {
      if (ehDiretor) {
        setEtapa("gerentes");
      } else if (ehGerente) {
        setEtapa("inicio");
      }
    } else if (etapa === "regionais") {
      if (ehDiretor || ehGerente) {
        setEtapa("coordenadores");
      } else if (ehCoordenador) {
        setEtapa("inicio");
      }
    } else if (etapa === "lojas") {
      if (ehDiretor || ehGerente) {
        setEtapa("regionais");
      } else if (ehCoordenador) {
        setEtapa("inicio");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-gray-900">
          Checklists Consolidados
        </h1>
        <div className="flex gap-4">
          <select
            value={mes}
            onChange={(e) => setMes(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                Mês {i + 1}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={ano}
            onChange={(e) => setAno(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-24"
            placeholder="Ano"
          />
        </div>
      </div>

      {/* Conteúdo */}
      {etapa === "inicio" && (
        <div className="p-6 text-center">
          <button
            onClick={handleIniciar}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Visualizar Consolidado
          </button>
        </div>
      )}

      {etapa === "gerentes" && (
        <GerenteList
          mes={mes}
          ano={ano}
          onSelecionarGerente={handleSelecionarGerente}
        />
      )}

      {etapa === "coordenadores" && (
        <CoordenadorList
          mes={mes}
          ano={ano}
          onSelecionarCoordenador={handleSelecionarCoordenador}
          onVoltar={handleVoltar}
        />
      )}

      {etapa === "regionais" && coordenadorSelecionado && (
        <RegionalList
          mes={mes}
          ano={ano}
          coordenadorSelecionado={coordenadorSelecionado}
          onVoltar={handleVoltar}
          onSelecionarRegional={handleSelecionarRegional}
        />
      )}

      {etapa === "lojas" && lojaSelecionada && (
        <ChecklistLojaConsolidado
          loja={lojaSelecionada}
          mes={mes}
          ano={ano}
          semanas={semanas}
          onVoltar={handleVoltar}
        />
      )}
    </div>
  );
}
