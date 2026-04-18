import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { 
  Plus, X, Loader2, Pencil, Trash2, Search, MapPin, 
  ChevronRight, BarChart3, TrendingUp, AlertTriangle, Building2,
  ArrowLeft
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie
} from 'recharts';
import { chamadosService, dashboardService } from '../../services';
import { useAuth } from '../../contexts/AuthContext';

const SEGMENTOS = ['ELETRICA','EMPILHADEIRA','REFRIGERACAO','SERRALHERIA','CIVIL','EQUIPAMENTOS','GERADOR','ELEVADOR','PCI','ALUGUEL','DIVERSOS'];
const STATUSES = ['CHAMADO_ABERTO','AGUARDANDO_APROVACAO','AGUARDANDO_OM_ENTREGA','FINALIZADO','ALUGUEL_OUTROS'];
const STATUS_LABEL = { CHAMADO_ABERTO:'Aberto', AGUARDANDO_APROVACAO:'Ag. Aprovação', AGUARDANDO_OM_ENTREGA:'Ag. OM/Entrega', FINALIZADO:'Finalizado', ALUGUEL_OUTROS:'Aluguel/Outros' };
const STATUS_BADGE = { CHAMADO_ABERTO:'badge-info', AGUARDANDO_APROVACAO:'badge-warning', AGUARDANDO_OM_ENTREGA:'badge-warning', FINALIZADO:'badge-success', ALUGUEL_OUTROS:'badge-neutral' };
const fmt = (v) => v ? new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v) : '—';
const CORES = ['#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#14b8a6'];

const TooltipCustom = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--color-surface-700)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '10px 14px', fontSize: '0.8125rem' }}>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '4px' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontWeight: 600 }}>
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  );
};

function ChamadoModal({ chamado, onClose }) {
  const qc = useQueryClient();
  const isEdit = !!chamado;
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: isEdit ? {
      ...chamado,
      dataAbertura: chamado.dataAbertura ? format(new Date(chamado.dataAbertura), 'yyyy-MM-dd') : '',
      valor: chamado.valor || '',
    } : { dataAbertura: format(new Date(), 'yyyy-MM-dd'), status: 'CHAMADO_ABERTO', mauUso: false },
  });

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? chamadosService.atualizar(chamado.id, data) : chamadosService.criar(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chamados'] });
      qc.invalidateQueries({ queryKey: ['dashboard-resumo'] });
      toast.success(isEdit ? 'Chamado atualizado!' : 'Chamado criado!');
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Erro ao salvar'),
  });

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content animate-fade-in" style={{ maxWidth: '640px' }}>
        <div className="flex items-center justify-between mb-5">
          <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>{isEdit ? 'Editar Chamado' : 'Novo Chamado'}</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: '4px' }}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="flex flex-col gap-4">
          <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div>
              <label className="label">Data de Abertura *</label>
              <input type="date" className="input" {...register('dataAbertura', { required: 'Obrigatório' })} />
              {errors.dataAbertura && <p className="field-error">{errors.dataAbertura.message}</p>}
            </div>
            <div>
              <label className="label">Número do Chamado (CSA) *</label>
              <input className="input" placeholder="CSA-00000" {...register('numeroChamado', { required: 'Obrigatório' })} />
            </div>
          </div>

          <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div>
              <label className="label">Segmento *</label>
              <select className="select" {...register('segmento', { required: 'Obrigatório' })}>
                <option value="">Selecione...</option>
                {SEGMENTOS.map(s => <option key={s} value={s}>{s.charAt(0)+s.slice(1).toLowerCase().replace('_',' ')}</option>)}
              </select>
              {errors.segmento && <p className="field-error">{errors.segmento.message}</p>}
            </div>
            <div>
              <label className="label">Empresa *</label>
              <input className="input" placeholder="Nome da empresa" {...register('empresa', { required: 'Obrigatório' })} />
            </div>
          </div>

          <div>
            <label className="label">Descrição *</label>
            <textarea className="input" rows={2} style={{ resize: 'vertical' }} {...register('descricao', { required: 'Obrigatório' })} />
          </div>

          <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            <div>
              <label className="label">Nº Orçamento</label>
              <input className="input" placeholder="ORC-000" {...register('numeroOrcamento')} />
            </div>
            <div>
              <label className="label">Valor (R$)</label>
              <input type="number" step="0.01" className="input" placeholder="0,00" {...register('valor')} />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="select" {...register('status')}>
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="mauUso" className="w-4 h-4 rounded" style={{ accentColor: 'var(--color-brand-500)' }} {...register('mauUso')} />
            <label htmlFor="mauUso" style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
              Mau uso
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : null}
              {isEdit ? 'Salvar' : 'Criar Chamado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CorporativoRegiaoDetalhe({ regiao, onBack }) {
  const { data: detalhe, isLoading } = useQuery({
    queryKey: ['dashboard-detalhe-regional', regiao],
    queryFn: () => dashboardService.detalheRegional(regiao).then(r => r.data),
  });

  if (isLoading) return <div className="skeleton" style={{ height: '400px', borderRadius: '12px' }} />;
  if (!detalhe) return <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Erro ao carregar dados da regional.</p>;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button className="btn btn-ghost btn-sm" onClick={onBack}><ArrowLeft size={18} /> Voltar</button>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Análise Consolidada: {regiao}</h2>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
        <div className="card text-center" style={{ padding: '20px' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total Gasto (Mês)</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-success)', marginTop: '8px' }}>{fmt(detalhe.financeiro?.totalGasto)}</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>{detalhe.financeiro?.totalChamados} chamados abertos</p>
        </div>
        <div className="card text-center" style={{ padding: '20px', border: '1px solid var(--color-danger-100)', background: 'var(--color-danger-50)' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-danger-600)', fontWeight: 600, textTransform: 'uppercase' }}>Registros de Mau Uso</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-danger-700)', marginTop: '8px' }}>{detalhe.financeiro?.mauUso?.quantidade ?? 0}</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-danger-600)', marginTop: '4px' }}>Prejuízo: {fmt(detalhe.financeiro?.mauUso?.valor)}</p>
        </div>
      </div>

      <div className="grid gap-6" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="card">
          <h3 className="flex items-center gap-2 mb-4" style={{ fontSize: '0.875rem', fontWeight: 600 }}>
            <BarChart3 size={16} /> Gastos por Segmento
          </h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={detalhe.segmentos} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="segmento" type="category" width={100} tick={{ fontSize: 11 }} />
                <Tooltip content={<TooltipCustom />} />
                <Bar dataKey="valor" fill="var(--color-brand-500)" radius={[0, 4, 4, 0]} name="Valor" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="flex items-center gap-2 mb-4" style={{ fontSize: '0.875rem', fontWeight: 600 }}>
            <Building2 size={16} /> Top 10 Empresas
          </h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={detalhe.empresas} 
                  dataKey="valor" 
                  nameKey="empresa" 
                  cx="50%" cy="50%" 
                  outerRadius={100} 
                  innerRadius={60}
                >
                  {detalhe.empresas?.map((_, i) => <Cell key={i} fill={CORES[i % CORES.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function CorporativoRegioes({ onSelect }) {
  const { data: regionalData = [], isLoading } = useQuery({
    queryKey: ['dashboard-regional'],
    queryFn: () => dashboardService.regional().then(r => r.data),
  });

  if (isLoading) return (
    <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
      {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: '120px', borderRadius: '12px' }} />)}
    </div>
  );

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Controle por Regional</h2>
      <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {regionalData.map(reg => (
          <div key={reg.regiao} className="card hover-scale" style={{ padding: '20px', cursor: 'pointer' }} onClick={() => onSelect(reg.regiao)}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--color-brand-100)', color: 'var(--color-brand-600)' }}>
                  <MapPin size={20} />
                </div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>{reg.regiao}</h3>
              </div>
              <ChevronRight size={20} style={{ color: 'var(--color-text-muted)' }} />
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Gasto Mensal:</span>
              <span style={{ fontSize: '0.925rem', fontWeight: 700, color: 'var(--color-success)' }}>{fmt(reg.gastosMes)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ChamadosPage() {
  const { usuario } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const regiaoSelecionada = searchParams.get('regiao');
  
  const qc = useQueryClient();
  const [modal, setModal] = useState(null);
  const [busca, setBusca] = useState('');
  const [filtros, setFiltros] = useState({ status: '', segmento: '' });
  const [periodo, setPeriodo] = useState(format(new Date(), 'yyyy-MM'));

  const [ano, mes] = periodo.split('-');

  const macroRoles = ['ADMINISTRADOR', 'DIRETOR', 'GERENTE', 'SUPERVISOR'];
  const isMacro = macroRoles.includes(usuario?.role);

  const { data, isLoading } = useQuery({
    queryKey: ['chamados', filtros, ano, mes, regiaoSelecionada],
    queryFn: () => chamadosService.listar({ ...filtros, ano, mes, regiao: regiaoSelecionada, limit: 100 }).then(r => r.data),
    enabled: !!(!isMacro || regiaoSelecionada)
  });

  if (isMacro && !regiaoSelecionada) {
    return <CorporativoRegioes onSelect={(r) => setSearchParams({ regiao: r })} />;
  }

  if (isMacro && regiaoSelecionada) {
    return <CorporativoRegiaoDetalhe regiao={regiaoSelecionada} onBack={() => setSearchParams({})} />;
  }

  const remover = useMutation({
    mutationFn: (id) => chamadosService.remover(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['chamados'] }); toast.success('Chamado removido'); },
    onError: () => toast.error('Erro ao remover'),
  });

  const chamados = (data?.data || []).filter(c =>
    busca === '' || c.empresa?.toLowerCase().includes(busca.toLowerCase()) || c.numeroChamado?.includes(busca)
  );

  const totalFiltrado = chamados.reduce((s, c) => s + parseFloat(c.valor || 0), 0);

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <input 
            type="month" 
            className="input" 
            style={{ width: 'auto', fontWeight: 600, color: 'var(--color-brand-600)' }} 
            value={periodo} 
            onChange={e => setPeriodo(e.target.value)} 
          />
          <div className="relative">
            <Search size={15} style={{ position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', color:'var(--color-text-muted)' }} />
            <input className="input" style={{ paddingLeft:'32px', width:'200px' }} placeholder="Empresa ou chamado..." value={busca} onChange={e => setBusca(e.target.value)} />
          </div>
          <select className="select" style={{ width:'auto' }} value={filtros.status} onChange={e => setFiltros(f=>({...f,status:e.target.value}))}>
            <option value="">Todos os status</option>
            {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
          <select className="select" style={{ width:'auto' }} value={filtros.segmento} onChange={e => setFiltros(f=>({...f,segmento:e.target.value}))}>
            <option value="">Todos os segmentos</option>
            {SEGMENTOS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <span className="badge badge-brand" style={{ fontSize: '0.8125rem' }}>Total: {fmt(totalFiltrado)}</span>
          <button className="btn btn-primary" onClick={() => setModal('novo')}><Plus size={16} /> Novo Chamado</button>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Chamado</th>
              <th>Segmento</th>
              <th>Empresa</th>
              <th>Descrição</th>
              <th>Orçamento</th>
              <th>Valor</th>
              <th>Status</th>
              <th>Mau Uso</th>
              <th style={{ width:'80px' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={10}><div className="flex justify-center py-8"><Loader2 size={22} className="animate-spin" style={{ color:'var(--color-brand-500)' }} /></div></td></tr>
            ) : chamados.length === 0 ? (
              <tr><td colSpan={10} style={{ textAlign:'center', color:'var(--color-text-muted)', padding:'2rem' }}>Nenhum chamado encontrado</td></tr>
            ) : chamados.map(c => (
              <tr key={c.id}>
                <td style={{ whiteSpace:'nowrap', fontSize:'0.8125rem' }}>{c.dataAbertura ? format(new Date(c.dataAbertura),'dd/MM/yy') : '—'}</td>
                <td style={{ fontWeight:600, fontSize:'0.8125rem', whiteSpace:'nowrap' }}>{c.numeroChamado}</td>
                <td><span className="badge badge-brand" style={{ fontSize:'0.7rem' }}>{c.segmento}</span></td>
                <td style={{ fontSize:'0.8125rem', maxWidth:'150px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.empresa}</td>
                <td style={{ fontSize:'0.8125rem', maxWidth:'200px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={c.descricao}>{c.descricao}</td>
                <td style={{ fontSize:'0.8125rem', color:'var(--color-text-secondary)' }}>{c.numeroOrcamento || '—'}</td>
                <td style={{ fontWeight:600, whiteSpace:'nowrap', color:'var(--color-success)' }}>{fmt(c.valor)}</td>
                <td><span className={`badge ${STATUS_BADGE[c.status]}`} style={{ fontSize:'0.7rem' }}>{STATUS_LABEL[c.status]}</span></td>
                <td>{c.mauUso ? <span className="badge badge-danger" style={{ fontSize:'0.7rem' }}>Sim</span> : <span style={{ color:'var(--color-text-muted)', fontSize:'0.8125rem' }}>Não</span>}</td>
                <td>
                  <div className="flex items-center gap-1">
                    <button className="btn btn-ghost btn-sm" onClick={() => setModal(c)} style={{ padding:'4px 6px' }}><Pencil size={14} /></button>
                    <button className="btn btn-ghost btn-sm" onClick={() => { if(confirm('Remover chamado?')) remover.mutate(c.id); }} style={{ padding:'4px 6px', color:'var(--color-danger)' }}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && <ChamadoModal chamado={modal === 'novo' ? null : modal} onClose={() => setModal(null)} />}
    </div>
  );
}
