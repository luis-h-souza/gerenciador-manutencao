import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../contexts/AuthContext";
import { checklistService, usuariosService } from "../../services";
import { ChevronDown, Calendar, ChevronUp, Loader2, MapPin, Store, X, CheckCircle2, AlertCircle, TrendingUp, UserRound } from "lucide-react";

// ─── Componente Card de Checklist ────────────────────────────────────────────
const ChecklistCard = ({ item, tipo, onClick }) => {
  const isEquipamento = tipo === "equipamento";
  const defeito = isEquipamento ? item.defeito : item.quebrados;
  const total = item.total;
  const percentual = item.percentual || 0;

  const temProblema = percentual > 0;

  return (
    <div
      onClick={onClick}
      className="card hover-scale pointer"
      style={{
        padding: '20px',
        borderTop: `4px solid ${temProblema ? (percentual >= 50 ? 'var(--color-danger)' : 'var(--color-warning)') : 'var(--color-success)'}`
      }}
    >
      <div className="mb-4">
        <h4 style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '6px' }}>{item.tipoLabel}</h4>
        <div className="flex justify-between items-center">
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            {isEquipamento ? "Equipamento" : "Carrinho"}
          </p>
          <span className={`badge ${temProblema ? (percentual >= 50 ? 'badge-danger' : 'badge-warning') : 'badge-success'}`}>
            {percentual}% Taxa Quebra
          </span>
        </div>
      </div>

      <div className="flex gap-4">
        <div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{isEquipamento ? "Com defeito" : "Quebrados"}</p>
          <p style={{ fontSize: '1.25rem', fontWeight: 700, color: temProblema ? 'var(--color-danger)' : 'var(--color-text-primary)' }}>{defeito}</p>
        </div>
        <div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Total Loja</p>
          <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{total}</p>
        </div>
      </div>
    </div>
  );
};

// ─── Seletor de Semana ───────────────────────────────────────────────────────
const SemanaSelect = ({ semanas, semanaAtual, onMudar }) => {
  return (
    <div className="relative inline-flex items-center">
      <Calendar size={16} style={{ position: 'absolute', left: '12px', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
      <select
        value={semanaAtual}
        onChange={(e) => onMudar(parseInt(e.target.value))}
        className="input"
        style={{ paddingLeft: '36px', paddingRight: '36px', minWidth: '160px', appearance: 'none', cursor: 'pointer' }}
      >
        {semanas.map((sem) => (
          <option key={sem.numero} value={sem.numero}>
            {sem.label}
          </option>
        ))}
      </select>
      <ChevronDown size={16} style={{ position: 'absolute', right: '12px', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
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
    <div className="fixed inset-0 flex items-center justify-center z-50 animate-fade-in" style={{ background: 'rgba(0,0,0,0.6)', padding: '20px' }}>
      <div className="card w-full max-w-md animate-slide-up" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="flex justify-between items-center" style={{ padding: '20px', borderBottom: '1px solid var(--color-border)' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{item.tipoLabel}</h3>
          <button onClick={onClose} className="btn-ghost btn-sm" style={{ padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          <div className="mb-6">
            <label className="label">Semana do Checklist</label>
            <SemanaSelect semanas={semanas} semanaAtual={semanaAtual} onMudar={setSemanaAtual} />
          </div>

          {itemAtual ? (
            <div className="flex flex-col gap-4">
              <div className="p-4 rounded-lg" style={{ background: 'var(--color-surface-800)', border: '1px solid var(--color-border)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>Status Geral</span>
                  <span className={`badge ${(isEquipamento ? itemAtual.quantidadeQuebrada > 0 : itemAtual.quebrados > 0) ? 'badge-danger' : 'badge-success'}`}>
                    {isEquipamento ? (itemAtual.quantidadeQuebrada > 0 ? "Com Problema" : "Operacional") : (itemAtual.quebrados > 0 ? "Com Quebrados" : "Tudo OK")}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  {isEquipamento ? (
                    <>
                      <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Quantidade</p>
                        <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{itemAtual.quantidade}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Com Problema</p>
                        <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-danger)' }}>{itemAtual.quantidadeQuebrada || 0}</p>
                      </div>
                      {itemAtual.numeroSerie && (
                        <div className="col-span-2">
                          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Série</p>
                          <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>{itemAtual.numeroSerie}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Total</p>
                        <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{itemAtual.total}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Quebrados</p>
                        <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-danger)' }}>{itemAtual.quebrados || 0}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {(itemAtual.numeroChamado || itemAtual.descricaoProblema || itemAtual.valor) && (
                <div className="p-4 rounded-lg" style={{ background: 'var(--color-surface-800)', border: '1px solid var(--color-border)' }}>
                  {itemAtual.numeroChamado && (
                    <div className="mb-3">
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Chamado Aberto</p>
                      <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-brand-500)' }}>#{itemAtual.numeroChamado}</p>
                    </div>
                  )}
                  {itemAtual.descricaoProblema && (
                    <div className="mb-3">
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Descrição do Problema</p>
                      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{itemAtual.descricaoProblema}</p>
                    </div>
                  )}
                  {itemAtual.valor > 0 && (
                    <div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Custo Estimado / Reparo</p>
                      <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-warning)' }}>R$ {itemAtual.valor.toFixed(2)}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10" style={{ border: '1px dashed var(--color-border)', borderRadius: '8px' }}>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Sem dados preenchidos para esta semana</p>
            </div>
          )}
        </div>

        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface-800)' }}>
          <button onClick={onClose} className="btn btn-neutral w-full justify-center">
            Fechar Detalhes
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Modal de Lojas Agrupadas ────────────────────────────────────────────────
const LojasStatusModal = ({ isOpen, onClose, tipo, lojas }) => {
  if (!isOpen) return null;

  const filtradas = lojas.filter(loja => {
    const temDados = Object.keys(loja.consolidado || {}).length > 0;
    return tipo === 'preenchidas' ? temDados : !temDados;
  });

  const agrupadas = new Map();
  filtradas.forEach(loja => {
    const regiao = loja.regiao || 'Sem Regional';
    if (!agrupadas.has(regiao)) agrupadas.set(regiao, []);
    agrupadas.get(regiao).push(loja);
  });

  const sortedRegioes = Array.from(agrupadas.keys()).sort();

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 animate-fade-in" style={{ background: 'rgba(0,0,0,0.6)', padding: '20px' }}>
      <div className="card w-full max-w-lg animate-slide-up" style={{ padding: 0, overflow: 'hidden', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div className="flex justify-between items-center" style={{ padding: '20px', borderBottom: '1px solid var(--color-border)' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {tipo === 'preenchidas' ? 'Lojas com Preenchimento' : 'Lojas Pendentes'}
          </h3>
          <button onClick={onClose} className="btn-ghost btn-sm" style={{ padding: '4px' }}>
            <X size={20} />
          </button>
        </div>
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {sortedRegioes.length === 0 ? (
             <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '20px' }}>Nenhuma loja encontrada.</p>
          ) : (
             sortedRegioes.map((regiao, idx) => (
               <div key={regiao} style={{ marginBottom: idx === sortedRegioes.length - 1 ? 0 : '24px' }}>
                 <h4 style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '12px', borderBottom: '2px solid var(--color-border)', paddingBottom: '4px' }}>Regional {regiao}</h4>
                 <ul className="flex flex-col gap-2">
                   {agrupadas.get(regiao).sort((a,b)=>a.nome.localeCompare(b.nome)).map(loja => (
                      <li key={loja.unidade} className="flex items-center gap-2" style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                         <Store size={14} style={{ color: 'var(--color-text-muted)' }} /> 
                         <strong>{loja.nome}</strong> {loja.numero && <span style={{ color: 'var(--color-text-muted)' }}>(Und: {loja.numero})</span>}
                      </li>
                   ))}
                 </ul>
               </div>
             ))
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Visualização de Loja Consolidada ────────────────────────────────────────
const ChecklistLojaConsolidado = ({ loja, semanas, onVoltar }) => {
  const [semanaAtual, setSemanaAtual] = useState(semanas[0]?.numero || 1);
  const [cardSelecionado, setCardSelecionado] = useState(null);

  useEffect(() => {
    if (semanas.length > 0 && !semanas.find(s => s.numero === semanaAtual)) {
      setSemanaAtual(semanas[0].numero);
    }
  }, [semanas, semanaAtual]);

  const semanadados = semanas.find((s) => s.numero === semanaAtual);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <button className="btn btn-ghost btn-sm" onClick={onVoltar} style={{ padding: '8px' }}>
            <ChevronUp className="rotate-270" size={18} />
          </button>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{loja.nome}</h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              {loja.numero ? `Unidade ${loja.numero}` : 'Loja sem número cadastrado'}
            </p>
          </div>
        </div>

        {semanas.length > 0 && (
          <SemanaSelect semanas={semanas} semanaAtual={semanaAtual} onMudar={setSemanaAtual} />
        )}
      </div>

      {semanas.length === 0 ? (
        <div className="card text-center p-12" style={{ border: '1px dashed var(--color-border)' }}>
          <p style={{ color: 'var(--color-text-muted)' }}>Nenhum checklist preenchido para esta loja no período selecionado.</p>
        </div>
      ) : semanadados ? (
        <div className="flex flex-col gap-8">
          {semanadados.equipamentos && semanadados.equipamentos.length > 0 && (
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '16px' }}>
                Indicadores de Equipamentos
              </h3>
              <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                {semanadados.equipamentos.map((equip) => (
                  <ChecklistCard
                    key={equip.tipoEquipamento}
                    item={equip}
                    tipo="equipamento"
                    onClick={() => setCardSelecionado({ ...equip, tipo: "equipamento" })}
                  />
                ))}
              </div>
            </div>
          )}

          {semanadados.carrinhos && semanadados.carrinhos.length > 0 && (
            <div style={{ paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '16px' }}>
                Indicadores de Carrinhos
              </h3>
              <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                {semanadados.carrinhos.map((carrinho) => (
                  <ChecklistCard
                    key={carrinho.tipoCarrinho}
                    item={carrinho}
                    tipo="carrinho"
                    onClick={() => setCardSelecionado({ ...carrinho, tipo: "carrinho" })}
                  />
                ))}
              </div>
            </div>
          )}

          {(!semanadados.equipamentos || semanadados.equipamentos.length === 0) &&
            (!semanadados.carrinhos || semanadados.carrinhos.length === 0) && (
              <div className="card text-center p-12" style={{ border: '1px dashed var(--color-border)' }}>
                <p style={{ color: 'var(--color-text-muted)' }}>Nenhum dado reportado nesta semana.</p>
              </div>
            )}
        </div>
      ) : (
        <div className="flex justify-center p-12">
          <Loader2 className="animate-spin" style={{ color: 'var(--color-brand-500)' }} size={32} />
        </div>
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

// ─── Página Principal ────────────────────────────────────────────────────────
export default function ChecklistConsolidadoPage() {
  const { usuario } = useAuth();
  const agora = new Date();
  const [mes, setMes] = useState(agora.getMonth() + 1);
  const [ano, setAno] = useState(agora.getFullYear());

  const getInitialEtapa = (role) => {
    if (["ADMINISTRADOR", "DIRETOR"].includes(role)) return "gerentes";
    if (role === "GERENTE") return "coordenadores";
    if (role === "COORDENADOR") return "regionais";
    if (role === "GESTOR") return "lojas";
    return "regionais";
  };
  const [etapa, setEtapa] = useState(() => getInitialEtapa(usuario?.role));

  const [gerenteSelecionado, setGerenteSelecionado] = useState(null);
  const [coordenadorSelecionado, setCoordenadorSelecionado] = useState(null);
  const [regionalSelecionada, setRegionalSelecionada] = useState(null);
  const [lojasDaRegional, setLojasDaRegional] = useState([]);
  const [lojaSelecionada, setLojaSelecionada] = useState(null);
  const [semanas, setSemanas] = useState([]);
  
  const [modalLojasAberto, setModalLojasAberto] = useState(false);
  const [tipoModalLojas, setTipoModalLojas] = useState("pendentes"); // 'pendentes' ou 'preenchidas'

  if (!["ADMINISTRADOR", "DIRETOR", "GERENTE", "COORDENADOR", "GESTOR"].includes(usuario?.role)) {
    return <div className="flex justify-center py-20"><div className="badge badge-danger">Acesso negado</div></div>;
  }

  // Faz a consulta já agrupada com base no acesso do usuário no backend
  const { data, isLoading } = useQuery({
    queryKey: ["checklist-consolidado-regional-all", mes, ano],
    queryFn: () => checklistService.consolidadoRegional({ mes, ano }).then((res) => res.data),
  });

  // Agrupa as lojas por regional
  const regionaisAgrupadas = useMemo(() => {
    if (!data?.lojas) return new Map();
    const mapa = new Map();
    data.lojas.forEach(loja => {
      const regiao = loja.regiao || 'Sem Regional';
      if (!mapa.has(regiao)) {
        mapa.set(regiao, []);
      }
      mapa.get(regiao).push(loja);
    });
    
    const sortedMapa = new Map([...mapa.entries()].sort());
    return sortedMapa;
  }, [data?.lojas]);

  const splitRegions = (r) => (r ? r.split(',').map(s => s.trim().toUpperCase()).filter(Boolean) : []);
  const hasOverlap = (r1, r2) => {
    const arr1 = splitRegions(r1);
    const arr2 = splitRegions(r2);
    return arr1.some(r => arr2.includes(r));
  };

  const { data: gerentesData, isLoading: loadingGerentes } = useQuery({
    queryKey: ["gerentes"],
    queryFn: () => usuariosService.listar({ role: "GERENTE", limit: 100, ativo: true }).then(r => r.data?.data || []),
    enabled: ["ADMINISTRADOR", "DIRETOR"].includes(usuario?.role),
  });

  const { data: coordenadoresData, isLoading: loadingCoordenadores } = useQuery({
    queryKey: ["coordenadores"],
    queryFn: () => usuariosService.listar({ role: "COORDENADOR", limit: 100, ativo: true }).then(r => r.data?.data || []),
    enabled: ["ADMINISTRADOR", "DIRETOR", "GERENTE"].includes(usuario?.role),
  });

  const coordenadoresFiltrados = useMemo(() => {
    if (!coordenadoresData) return [];
    if (usuario?.role === "GERENTE") return coordenadoresData.filter(c => hasOverlap(c.regiao, usuario.regiao));
    if (gerenteSelecionado) return coordenadoresData.filter(c => hasOverlap(c.regiao, gerenteSelecionado.regiao));
    return coordenadoresData;
  }, [coordenadoresData, usuario, gerenteSelecionado]);

  const regioesDoContexto = useMemo(() => {
    if (coordenadorSelecionado) return splitRegions(coordenadorSelecionado.regiao);
    if (usuario?.role === "COORDENADOR") return splitRegions(usuario.regiao);
    return null; 
  }, [coordenadorSelecionado, usuario]);

  const regionaisAgrupadasFiltradas = useMemo(() => {
    if (!regioesDoContexto) return regionaisAgrupadas;
    const filtered = new Map();
    for (const [regiao, lojas] of regionaisAgrupadas.entries()) {
      if (regioesDoContexto.includes(regiao.toUpperCase())) {
        filtered.set(regiao, lojas);
      }
    }
    return filtered;
  }, [regionaisAgrupadas, regioesDoContexto]);

  const lojasVisiveis = useMemo(() => {
    return Array.from(regionaisAgrupadasFiltradas.values()).flat();
  }, [regionaisAgrupadasFiltradas]);

  const stats = useMemo(() => {
    let totalLojas = 0;
    let lojasComPreenchimento = 0;
    
    for (const lojas of regionaisAgrupadasFiltradas.values()) {
      totalLojas += lojas.length;
      lojas.forEach(loja => {
        const semanasPreenchidas = Object.keys(loja.consolidado || {}).length;
        if (semanasPreenchidas > 0) lojasComPreenchimento++;
      });
    }

    const inadimplentes = totalLojas - lojasComPreenchimento;
    const taxaAdesao = totalLojas > 0 ? Math.round((lojasComPreenchimento / totalLojas) * 100) : 0;

    return { totalLojas, lojasComPreenchimento, inadimplentes, taxaAdesao };
  }, [regionaisAgrupadasFiltradas]);

  const handleSelecionarRegional = (regiao, lojas) => {
    setRegionalSelecionada(regiao);
    // Ordenar lojas pelo nome
    const lojasOrdenadas = [...lojas].sort((a, b) => a.nome.localeCompare(b.nome));
    setLojasDaRegional(lojasOrdenadas);
    setEtapa("lojas");
  };

  const getWeekOfYear = (d) => {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay()||7));
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
    return Math.ceil((((date - yearStart) / 86400000) + 1)/7);
  };

  const handleSelecionarLoja = (loja) => {
    setLojaSelecionada(loja);
    
    // Descobrir qual a semana 1 do mês selecionado
    const semanaInicioSelecionado = getWeekOfYear(new Date(ano, mes - 1, 1));
    
    // Converte os dados do consolidado da loja em um array de semanas
    const semanas_array = Object.entries(loja.consolidado || {})
      .map(([key, consolidadoData]) => {
        const num = parseInt(key.replace("semana", ""), 10);
        const semanaDoMes = num - semanaInicioSelecionado + 1;
        return {
          numero: num,
          label: `Semana ${Math.max(1, semanaDoMes)}`,
          equipamentos: consolidadoData.equipamentos || [],
          carrinhos: consolidadoData.carrinhos || []
        };
      })
      .sort((a, b) => a.numero - b.numero);

    setSemanas(semanas_array);
    setEtapa("checklist");
  };

  const handleVoltar = () => {
    if (etapa === "checklist") setEtapa("lojas");
    else if (etapa === "lojas") setEtapa("regionais");
    else if (etapa === "regionais") {
      if (["ADMINISTRADOR", "DIRETOR", "GERENTE"].includes(usuario?.role)) {
        setEtapa("coordenadores");
        setCoordenadorSelecionado(null);
      }
    }
    else if (etapa === "coordenadores") {
      if (["ADMINISTRADOR", "DIRETOR"].includes(usuario?.role)) {
        setEtapa("gerentes");
        setGerenteSelecionado(null);
      }
    }
  };

  const hoje = new Date();
  const semanaAtualAno = getWeekOfYear(hoje);
  const semanaInicioAtual = getWeekOfYear(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
  const semanaAtualMes = Math.max(1, semanaAtualAno - semanaInicioAtual + 1);

  const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  return (
    <div className="flex flex-col w-full">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6 px-6 pt-6">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Checklists Consolidados</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            Visão gerencial consolidada por regional e lojas &bull; <strong>Semana Atual do Mês: {semanaAtualMes}</strong> 
            <br></br><strong>Equipamentos</strong> - quinta-feira | <strong>Carrinhos</strong> - terça-feira
          </p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <select className="input" style={{ paddingLeft: '12px', paddingRight: '36px', minWidth: '120px', appearance: 'none' }} value={mes} onChange={(e) => setMes(parseInt(e.target.value))}>
              {Array.from({ length: 12 }, (_, i) => (<option key={i + 1} value={i + 1}>{MESES[i]}</option>))}
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }} />
          </div>
          <input type="number" className="input" style={{ width: '100px' }} value={ano} onChange={(e) => setAno(parseInt(e.target.value))} placeholder="Ano" />
        </div>
      </div>

      <div className="px-6 pb-6">
        {/* ─── Etapa 0: Lista de Gerentes ─── */}
        {etapa === "gerentes" && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Gerentes Regionais</h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Selecione um gerente para visualizar seus coordenadores</p>
            </div>
            {loadingGerentes ? (
              <div className="flex justify-center p-12"><Loader2 className="animate-spin" style={{ color: 'var(--color-brand-500)' }} size={32} /></div>
            ) : gerentesData?.length > 0 ? (
              <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                {gerentesData.map((gerente) => (
                  <div key={gerente.id} className="card hover-scale pointer" onClick={() => { setGerenteSelecionado(gerente); setEtapa("coordenadores"); }} style={{ padding: '20px' }}>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl" style={{ background: 'var(--color-brand-100)', color: 'var(--color-brand-600)' }}>
                        <UserRound size={24} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '4px' }}>{gerente.nome}</h3>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          <strong style={{ color: 'var(--color-brand-400)' }}>{splitRegions(gerente.regiao).length}</strong> regionais atreladas
                        </p>
                      </div>
                      <ChevronDown size={18} className="rotate-270" style={{ color: 'var(--color-text-muted)' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card text-center p-12" style={{ border: '1px dashed var(--color-border)' }}>
                <p style={{ color: 'var(--color-text-muted)' }}>Nenhum gerente encontrado.</p>
              </div>
            )}
          </div>
        )}

        {/* ─── Etapa 0.5: Lista de Coordenadores ─── */}
        {etapa === "coordenadores" && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <div className="flex items-center gap-3">
              {["ADMINISTRADOR", "DIRETOR"].includes(usuario?.role) && (
                <button className="btn btn-ghost btn-sm" onClick={handleVoltar} style={{ padding: '8px' }}>
                  <ChevronUp className="rotate-270" size={18} />
                </button>
              )}
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Coordenadores</h2>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{gerenteSelecionado ? `Equipe de ${gerenteSelecionado.nome}` : 'Selecione um coordenador'}</p>
              </div>
            </div>
            {loadingCoordenadores ? (
              <div className="flex justify-center p-12"><Loader2 className="animate-spin" style={{ color: 'var(--color-brand-500)' }} size={32} /></div>
            ) : coordenadoresFiltrados.length > 0 ? (
              <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                {coordenadoresFiltrados.map((coordenador) => (
                  <div key={coordenador.id} className="card hover-scale pointer" onClick={() => { setCoordenadorSelecionado(coordenador); setEtapa("regionais"); }} style={{ padding: '20px' }}>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl" style={{ background: 'var(--color-surface-600)', color: 'var(--color-text-primary)' }}>
                        <UserRound size={24} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '4px' }}>{coordenador.nome}</h3>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          <strong style={{ color: 'var(--color-brand-400)' }}>{splitRegions(coordenador.regiao).length}</strong> regionais
                        </p>
                      </div>
                      <ChevronDown size={18} className="rotate-270" style={{ color: 'var(--color-text-muted)' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card text-center p-12" style={{ border: '1px dashed var(--color-border)' }}>
                <p style={{ color: 'var(--color-text-muted)' }}>Nenhum coordenador encontrado para este escopo.</p>
              </div>
            )}
          </div>
        )}

        {/* ─── Etapa 1: Lista de Regionais ─── */}
        {etapa === "regionais" && (
          <div className="flex flex-col gap-8 animate-fade-in">
            {stats && (
              <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                <div className="card" style={{ padding: '20px', borderLeft: '4px solid var(--color-brand-500)' }}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg" style={{ background: 'var(--color-brand-100)', color: 'var(--color-brand-600)' }}>
                      <TrendingUp size={20} />
                    </div>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Adesão no Mês</h3>
                  </div>
                  <div className="flex items-end gap-2">
                    <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>{stats.taxaAdesao}%</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '6px' }}>das lojas reportaram dados</span>
                  </div>
                </div>

                <div className="card hover-scale pointer" onClick={() => { setTipoModalLojas('preenchidas'); setModalLojasAberto(true); }} style={{ padding: '20px', borderLeft: '4px solid var(--color-success)' }}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-green-100 text-green-600">
                      <CheckCircle2 size={20} />
                    </div>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Com Preenchimento</h3>
                  </div>
                  <div className="flex items-end gap-2">
                    <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>{stats.lojasComPreenchimento}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '6px' }}>/ {stats.totalLojas} lojas ativas</span>
                  </div>
                </div>

                <div className="card hover-scale pointer" onClick={() => { setTipoModalLojas('pendentes'); setModalLojasAberto(true); }} style={{ padding: '20px', borderLeft: '4px solid var(--color-danger)' }}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-red-100 text-red-600">
                      <AlertCircle size={20} />
                    </div>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Lojas Pendentes</h3>
                  </div>
                  <div className="flex items-end gap-2">
                    <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-danger)' }}>{stats.inadimplentes}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '6px' }}>sem checkings no mês</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-3">
                {["ADMINISTRADOR", "DIRETOR", "GERENTE"].includes(usuario?.role) && (
                  <button className="btn btn-ghost btn-sm" onClick={handleVoltar} style={{ padding: '8px' }}>
                    <ChevronUp className="rotate-270" size={18} />
                  </button>
                )}
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Regionais {coordenadorSelecionado ? `de ${coordenadorSelecionado.nome}` : ''}</h2>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Selecione a regional para visualizar as lojas</p>
                </div>
              </div>

            {isLoading ? (
              <div className="flex justify-center p-12"><Loader2 className="animate-spin" style={{ color: 'var(--color-brand-500)' }} size={32} /></div>
            ) : regionaisAgrupadasFiltradas.size > 0 ? (
              <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                {Array.from(regionaisAgrupadasFiltradas.entries()).map(([regiao, lojas]) => (
                  <div key={regiao} className="card hover-scale pointer" onClick={() => handleSelecionarRegional(regiao, lojas)} style={{ padding: '20px' }}>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl" style={{ background: 'var(--color-brand-100)', color: 'var(--color-brand-600)' }}>
                        <MapPin size={24} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '4px' }}>Regional {regiao}</h3>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          <strong style={{ color: 'var(--color-brand-400)' }}>{lojas.length}</strong> {lojas.length === 1 ? 'loja' : 'lojas'}
                        </p>
                      </div>
                      <ChevronDown size={18} className="rotate-270" style={{ color: 'var(--color-text-muted)' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card text-center p-12" style={{ border: '1px dashed var(--color-border)' }}>
                <p style={{ color: 'var(--color-text-muted)' }}>Nenhuma regional com lojas ativas no seu perfil.</p>
              </div>
              )}
            </div>
          </div>
        )}

        {/* ─── Etapa 2: Lista de Lojas da Regional ─── */}
        {etapa === "lojas" && regionalSelecionada && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <div className="flex items-center gap-3">
              <button className="btn btn-ghost btn-sm" onClick={handleVoltar} style={{ padding: '8px' }}>
                <ChevronUp className="rotate-270" size={18} />
              </button>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Lojas - Regional {regionalSelecionada}</h2>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Selecione a loja para visualizar os checklists consolidados</p>
              </div>
            </div>

            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
              {lojasDaRegional.map((loja) => {
                const totalChecklists = Object.keys(loja.consolidado || {}).length;
                return (
                  <div key={loja.unidade} className="card hover-scale pointer" onClick={() => handleSelecionarLoja(loja)} style={{ padding: '20px' }}>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl" style={{ background: 'var(--color-brand-100)', color: 'var(--color-brand-600)' }}>
                        <Store size={24} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '4px' }}>{loja.nome}</h3>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          Unidade: <strong style={{ color: 'var(--color-text-secondary)' }}>{loja.numero || loja.unidade}</strong>
                        </p>
                        {totalChecklists > 0 && (
                           <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800">
                             {totalChecklists} {totalChecklists === 1 ? 'semana com dados' : 'semanas com dados'}
                           </div>
                        )}
                      </div>
                      <ChevronDown size={18} className="rotate-270" style={{ color: 'var(--color-text-muted)' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── Etapa 3: Checklist Consolidado da Loja ─── */}
        {etapa === "checklist" && lojaSelecionada && (
          <ChecklistLojaConsolidado 
            key={lojaSelecionada.unidade} 
            loja={lojaSelecionada} 
            semanas={semanas} 
            onVoltar={handleVoltar} 
          />
        )}
      </div>

      <LojasStatusModal 
        isOpen={modalLojasAberto} 
        onClose={() => setModalLojasAberto(false)} 
        tipo={tipoModalLojas} 
        lojas={lojasVisiveis} 
      />
    </div>
  );
}
