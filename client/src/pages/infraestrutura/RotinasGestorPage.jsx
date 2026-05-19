// src/pages/infraestrutura/RotinasGestorPage.jsx
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { rotinasInfraService } from '../../services';
import { useAuth } from '../../contexts/AuthContext';
import {
  Activity, CheckCircle2, AlertTriangle, XCircle,
  Clock, CalendarDays, Loader2, Save, X, MapPin
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format, getISOWeek, getYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function RotinasGestorPage() {
  const { usuario } = useAuth();
  const queryClient = useQueryClient();
  
  const isGestor = usuario?.role === 'GESTOR';
  // O Gestor só vê a própria unidade. Coordenadores poderão usar um filtro no futuro.
  const unidadeBase = isGestor ? usuario.lojaId : null; // Precisamos da unidade e região
  // Como as rotas exigem unidade/regiao que talvez dependam do auth, o hook de lojas seria útil se for o Coordenador.
  // Para simplificar, vou buscar as pendências e a conformidade (que listam tudo que o usuário tem acesso).

  const dataAtual = new Date();
  const mesAtual = dataAtual.getMonth() + 1;
  const anoAtual = dataAtual.getFullYear();

  // Queries
  const { data: conformidadeData, isLoading: loadConformidade } = useQuery({
    queryKey: ['conformidade-incendio', mesAtual, anoAtual],
    queryFn: () => rotinasInfraService.conformidadeIncendio({ mes: mesAtual, ano: anoAtual }).then(res => res.data),
  });

  const { data: geradorData, isLoading: loadGerador } = useQuery({
    queryKey: ['pendencias-gerador'],
    queryFn: () => rotinasInfraService.pendenciasGerador().then(res => res.data),
  });

  // Flatten de dados para facilitar a visualização (pega a primeira loja, ideal para Gestor)
  // Se for coordenador, ideal seria ter um seletor de loja. Vou simplificar para a primeira se houver.
  const [selectedRegiao, setSelectedRegiao] = useState(null);
  const [selectedLoja, setSelectedLoja] = useState(null);

  const regionais = useMemo(() => {
    if (!conformidadeData?.length) return [];
    const regs = new Set();
    conformidadeData.forEach(l => {
      if (l.regiao) regs.add(l.regiao);
    });
    return Array.from(regs).sort();
  }, [conformidadeData]);

  const activeRegiao = selectedRegiao || regionais[0] || null;

  const lojasFiltradas = useMemo(() => {
    if (!conformidadeData?.length || !activeRegiao) return [];
    return conformidadeData.filter(l => l.regiao === activeRegiao);
  }, [conformidadeData, activeRegiao]);

  const activeLoja = selectedLoja || (lojasFiltradas[0]?.unidade) || null;

  const handleSelectRegiao = (reg) => {
    setSelectedRegiao(reg);
    const firstLojaOfReg = conformidadeData.find(l => l.regiao === reg);
    if (firstLojaOfReg) {
      setSelectedLoja(firstLojaOfReg.unidade);
    }
  };

  const lojaConformidade = useMemo(() => {
    if (!conformidadeData?.length) return null;
    return conformidadeData.find(l => l.unidade === activeLoja) || conformidadeData[0];
  }, [conformidadeData, activeLoja]);

  const lojaGerador = useMemo(() => {
    if (!geradorData?.length) return null;
    return geradorData.find(l => l.unidade === activeLoja) || geradorData[0];
  }, [geradorData, activeLoja]);

  const isLoading = loadConformidade || loadGerador;

  // Estado do formulário
  const [formularioAberto, setFormularioAberto] = useState(null); // { tipo, semana, mes, ano, unidade, regiao }

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const conformeValue = watch('conforme');

  const criarMutation = useMutation({
    mutationFn: (data) => rotinasInfraService.criar(data),
    onSuccess: () => {
      toast.success('Rotina registrada com sucesso!');
      setFormularioAberto(null);
      reset();
      queryClient.invalidateQueries(['conformidade-incendio']);
      queryClient.invalidateQueries(['pendencias-gerador']);
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Erro ao registrar rotina');
    }
  });

  const handleOpenForm = (tipo, semana, mes, ano, unidade, regiao) => {
    reset({ conforme: 'true', descricao: '' });
    setFormularioAberto({ tipo, semana, mes, ano, unidade, regiao });
  };

  const onSubmit = (data) => {
    criarMutation.mutate({
      ...formularioAberto,
      conforme: data.conforme === 'true',
      descricao: data.conforme === 'false' ? data.descricao : null,
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CONCLUIDO_NO_PRAZO':
        return <span className="badge badge-success"><CheckCircle2 size={12} /> Concluído</span>;
      case 'CONCLUIDO_COM_ATRASO':
        return <span className="badge badge-warning"><CheckCircle2 size={12} /> Atrasado</span>;
      case 'PENDENTE_ATUAL':
      case 'PENDENTE':
        return <span className="badge badge-neutral"><Clock size={12} /> Pendente</span>;
      case 'PENDENTE_ATRASADO':
        return <span className="badge badge-warning animate-pulse"><AlertTriangle size={12} /> Em Atraso</span>;
      case 'NAO_REALIZADO_VENCIDO':
        return <span className="badge badge-danger"><XCircle size={12} /> Vencido</span>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-[color:var(--color-text-muted)]" size={32} />
      </div>
    );
  }

  const canSelectLoja = conformidadeData?.length > 1;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[color:var(--color-text-primary)] flex items-center gap-3">
          <Activity className="text-[color:var(--color-brand-500)]" size={28} />
          Rotinas de Infraestrutura
        </h1>
        <p className="text-[color:var(--color-text-secondary)] mt-2">
          Controle de checklists operacionais periódicos.
        </p>
      </div>

      {regionais.length > 1 && (
        <div className="mb-4">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[color:var(--color-text-muted)] mb-2">Regionais</label>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {regionais.map(reg => (
              <button
                key={reg}
                onClick={() => handleSelectRegiao(reg)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeRegiao === reg
                    ? 'bg-[color:var(--color-brand-600)] text-white shadow-md'
                    : 'bg-[color:var(--color-surface-800)] border border-[color:var(--color-border)] text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-700)]'
                }`}
              >
                <MapPin size={14} />
                Regional {reg}
              </button>
            ))}
          </div>
        </div>
      )}

      {lojasFiltradas.length > 1 && (
        <div className="mb-6">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[color:var(--color-text-muted)] mb-2">Unidades (Lojas)</label>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {lojasFiltradas.map(l => (
              <button
                key={l.unidade}
                onClick={() => setSelectedLoja(l.unidade)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap cursor-pointer ${
                  activeLoja === l.unidade
                    ? 'bg-[color:var(--color-surface-600)] text-white border border-[color:var(--color-brand-500)] shadow-sm'
                    : 'bg-[color:var(--color-surface-800)] border border-[color:var(--color-border)] text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-700)]'
                }`}
              >
                Loja {l.unidade}
              </button>
            ))}
          </div>
        </div>
      )}

      {(!lojaConformidade || !lojaGerador) ? (
        <div className="bg-[color:var(--color-surface-800)] rounded-xl border border-[color:var(--color-border)] p-8 text-center">
          <p className="text-[color:var(--color-text-secondary)]">Nenhuma unidade disponível para visualização.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* COLUNA 1: GERADOR SEMANAL */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[color:var(--color-text-primary)] flex items-center gap-2">
              <Activity className="text-[color:var(--color-text-secondary)]" size={20} />
              Gerador Semanal
            </h2>
            
            <div className="space-y-3">
              {lojaGerador.historico?.slice(0, 4).map((hist, idx) => (
                <div key={`${hist.ano}-${hist.semana}`} className={`bg-[color:var(--color-surface-800)] rounded-xl border border-[color:var(--color-border)] p-4 shadow-sm relative overflow-hidden ${hist.status.includes('ATRASADO') ? 'border-l-4 border-l-[color:var(--color-warning)]' : 'border-l-4 border-l-[color:var(--color-success)]'}`}>
                  
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-[color:var(--color-text-primary)]">Semana {hist.semana} / {hist.ano}</h3>
                      {hist.preenchidoEm && (
                        <p className="text-sm text-[color:var(--color-text-muted)] mt-0.5">
                          Realizado em: {format(new Date(hist.preenchidoEm), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      )}
                    </div>
                    <div>{getStatusBadge(hist.status)}</div>
                  </div>

                  {(hist.status.includes('PENDENTE') || hist.status === 'NAO_REALIZADO_VENCIDO') && (
                    <div className="pt-3 border-t border-[color:var(--color-border)] flex justify-end">
                      <button
                        onClick={() => handleOpenForm('GERADOR_SEMANAL', hist.semana, mesAtual, hist.ano, lojaGerador.unidade, lojaGerador.regiao)}
                        className="text-sm font-medium text-[color:var(--color-brand-400)] hover:text-[color:var(--color-brand-500)] flex items-center gap-1.5 cursor-pointer"
                      >
                        Preencher Agora →
                      </button>
                    </div>
                  )}

                  {/* FORMULÁRIO INLINE */}
                  {formularioAberto?.tipo === 'GERADOR_SEMANAL' && formularioAberto.semana === hist.semana && (
                    <form onSubmit={handleSubmit(onSubmit)} className="mt-4 pt-4 border-t border-[color:var(--color-border)] bg-[color:var(--color-surface-700)]/40 -mx-4 -mb-4 px-4 pb-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-sm font-semibold text-[color:var(--color-text-primary)]">Registrar Checklist</h4>
                        <button type="button" onClick={() => setFormularioAberto(null)} className="text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-secondary)] cursor-pointer">
                          <X size={16} />
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-[color:var(--color-text-secondary)] mb-1">Status Operacional</label>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer text-sm text-[color:var(--color-text-primary)]">
                              <input type="radio" value="true" {...register('conforme')} className="w-4 h-4 text-[color:var(--color-brand-500)] border-[color:var(--color-border)] bg-[color:var(--color-surface-700)] focus:ring-[color:var(--color-brand-500)]" />
                              Operacional (OK)
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer text-sm text-[color:var(--color-danger)]">
                              <input type="radio" value="false" {...register('conforme')} className="w-4 h-4 text-[color:var(--color-danger)] border-[color:var(--color-border)] bg-[color:var(--color-surface-700)] focus:ring-[color:var(--color-danger)]" />
                              Apresentou Falha
                            </label>
                          </div>
                        </div>

                        {conformeValue === 'false' && (
                          <div>
                            <label className="block text-sm font-medium text-[color:var(--color-text-secondary)] mb-1">Descrição do Problema</label>
                            <textarea
                              {...register('descricao', { required: 'Descreva o problema' })}
                              rows={2}
                              className="w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-700)] px-3 py-2 text-sm text-[color:var(--color-text-primary)] focus:border-[color:var(--color-brand-500)] outline-none focus:ring-1 focus:ring-[color:var(--color-brand-500)]"
                              placeholder="Detalhes da falha observada..."
                            />
                            {errors.descricao && <span className="text-xs text-[color:var(--color-danger)] mt-1">{errors.descricao.message}</span>}
                          </div>
                        )}

                        <div className="flex justify-end">
                          <button
                            type="submit"
                            disabled={criarMutation.isPending}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[color:var(--color-brand-600)] text-white rounded-lg text-sm font-medium hover:bg-[color:var(--color-brand-500)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[color:var(--color-brand-500)] disabled:opacity-50 cursor-pointer"
                          >
                            {criarMutation.isPending ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                            Salvar Registro
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* COLUNA 2: COMBATE A INCÊNDIO */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[color:var(--color-text-primary)] flex items-center gap-2">
              <CalendarDays className="text-[color:var(--color-text-secondary)]" size={20} />
              Sistema de Incêndio (Mensal)
            </h2>

            <div className={`bg-[color:var(--color-surface-800)] rounded-xl border border-[color:var(--color-border)] p-4 shadow-sm relative overflow-hidden ${lojaConformidade.status.includes('VENCIDO') ? 'border-l-4 border-l-[color:var(--color-danger)]' : 'border-l-4 border-l-[color:var(--color-brand-500)]'}`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-[color:var(--color-text-primary)]">Checklist Visual — {format(new Date(), 'MMMM / yyyy', { locale: ptBR }).replace(/^\w/, (c) => c.toUpperCase())}</h3>
                  <p className="text-sm text-[color:var(--color-text-muted)] mt-0.5">Prazo limite: 20/{String(mesAtual).padStart(2, '0')}</p>
                </div>
                <div>{getStatusBadge(lojaConformidade.status)}</div>
              </div>

              {lojaConformidade.preenchidoEm && (
                <p className="text-sm text-[color:var(--color-text-secondary)] mb-3">
                  <CheckCircle2 size={16} className="inline mr-1 text-[color:var(--color-success)]" />
                  Realizado em {format(new Date(lojaConformidade.preenchidoEm), "dd/MM/yyyy")}
                </p>
              )}

              {(lojaConformidade.status.includes('PENDENTE') || lojaConformidade.status === 'NAO_REALIZADO_VENCIDO') && (
                <div className="pt-3 border-t border-[color:var(--color-border)] flex justify-end">
                  <button
                    onClick={() => handleOpenForm('INCENDIO_MENSAL_VISUAL', null, mesAtual, anoAtual, lojaConformidade.unidade, lojaConformidade.regiao)}
                    className="text-sm font-medium text-[color:var(--color-brand-400)] hover:text-[color:var(--color-brand-500)] flex items-center gap-1.5 cursor-pointer"
                  >
                    Preencher Agora →
                  </button>
                </div>
              )}

              {/* FORMULÁRIO INLINE INCÊNDIO */}
              {formularioAberto?.tipo === 'INCENDIO_MENSAL_VISUAL' && formularioAberto.mes === mesAtual && (
                <form onSubmit={handleSubmit(onSubmit)} className="mt-4 pt-4 border-t border-[color:var(--color-border)] bg-[color:var(--color-surface-700)]/40 -mx-4 -mb-4 px-4 pb-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-semibold text-[color:var(--color-text-primary)]">Registrar Checklist de Incêndio</h4>
                    <button type="button" onClick={() => setFormularioAberto(null)} className="text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-secondary)] cursor-pointer">
                      <X size={16} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[color:var(--color-text-secondary)] mb-1">Status de Conformidade</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer text-sm text-[color:var(--color-text-primary)]">
                          <input type="radio" value="true" {...register('conforme')} className="w-4 h-4 text-[color:var(--color-brand-500)] border-[color:var(--color-border)] bg-[color:var(--color-surface-700)] focus:ring-[color:var(--color-brand-500)]" />
                          Conforme (OK)
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-sm text-[color:var(--color-danger)]">
                          <input type="radio" value="false" {...register('conforme')} className="w-4 h-4 text-[color:var(--color-danger)] border-[color:var(--color-border)] bg-[color:var(--color-surface-700)] focus:ring-[color:var(--color-danger)]" />
                          Não Conforme
                        </label>
                      </div>
                    </div>

                    {conformeValue === 'false' && (
                      <div>
                        <label className="block text-sm font-medium text-[color:var(--color-text-secondary)] mb-1">Motivo da Não Conformidade</label>
                        <textarea
                          {...register('descricao', { required: 'Justifique a não conformidade' })}
                          rows={2}
                          className="w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-700)] px-3 py-2 text-sm text-[color:var(--color-text-primary)] focus:border-[color:var(--color-brand-500)] outline-none focus:ring-1 focus:ring-[color:var(--color-brand-500)]"
                          placeholder="Extintor descarregado, mangueira danificada, etc..."
                        />
                        {errors.descricao && <span className="text-xs text-[color:var(--color-danger)] mt-1">{errors.descricao.message}</span>}
                      </div>
                    )}

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={criarMutation.isPending}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[color:var(--color-brand-600)] text-white rounded-lg text-sm font-medium hover:bg-[color:var(--color-brand-500)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[color:var(--color-brand-500)] disabled:opacity-50 cursor-pointer"
                      >
                        {criarMutation.isPending ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                        Salvar Registro
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
