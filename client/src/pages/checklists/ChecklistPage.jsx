// src/pages/checklists/ChecklistPage.jsx
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { usuariosService, checklistService } from '../../services';
import { 
  getWeek, getYear, setWeek, setYear, startOfWeek, format, 
  startOfMonth, endOfMonth 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Retorna o nome do mês correspondente à semana/ano
const mesDoChecklist = (semana, ano) => {
  const d = startOfWeek(setWeek(setYear(new Date(), ano), semana, { weekStartsOn: 1 }), { weekStartsOn: 1 });
  return format(d, 'MMMM', { locale: ptBR });
};
import { 
  Save, 
  ClipboardCheck, 
  ShoppingCart, 
  AlertTriangle, 
  CheckCircle, 
  ChevronDown, 
  ChevronUp, 
  Loader2,
  Users,
  Building2
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Constantes ──────────────────────────────────────────────────────────────

const EQUIPAMENTOS = [
  { key: 'EMPILHADEIRA_ELETRICA',  label: 'Empilhadeira Elétrica' },
  { key: 'EMPILHADEIRA_COMBUSTAO', label: 'Empilhadeira a Combustão' },
  { key: 'EMPILHADEIRA_PATOLADA',  label: 'Empilhadeira Patolada' },
  { key: 'MAQUINA_MOER_CARNE',     label: 'Máquina de Moer Carne' },
  { key: 'SERRA_FITA',             label: 'Serra Fita' },
  { key: 'EMBALADORA_VACUO',       label: 'Embaladora a Vácuo' },
  { key: 'FATIADORA',              label: 'Fatiadora' },
  { key: 'FATIADORA_GRANDE',       label: 'Fatiadora Grande (JetCut)' },
  { key: 'ELEVADOR',               label: 'Elevador' },
  { key: 'ILHASELF',               label: 'Ilhaself' },
  { key: 'ESCADA_ROLANTE',         label: 'Escada Rolante' },
];

const CARRINHOS = [
  { key: 'MARIA_GORDA',            label: 'Maria Gorda' },
  { key: 'SUPERCAR',               label: 'Supercar' },
  { key: 'DOIS_ANDARES',           label: 'Dois Andares' },
  { key: 'PRANCHA',                label: 'Prancha' },
  { key: 'PRANCHA_PERECIVEIS',     label: 'Prancha Perecíveis' },
  { key: 'CARRINHO_ABASTECIMENTO', label: 'Carrinho de Abastecimento' },
  { key: 'ESCADA',                 label: 'Escada' },
];

// ─── Componente de linha do equipamento ─────────────────────────────────────

function LinhaEquipamento({ equip, value, onChange, readOnly }) {
  const [expanded, setExpanded] = useState(!value.operacional);

  const set = (field, val) => onChange({ ...value, [field]: val });

  const bgColor = !value.operacional
    ? 'rgba(239,68,68,0.06)'
    : 'transparent';

  return (
    <div style={{ borderBottom: '1px solid var(--color-border)', background: bgColor, transition: 'background 0.2s' }}>
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Status principal */}
        <div className="flex items-center gap-2" style={{ minWidth: '200px' }}>
          {value.operacional
            ? <CheckCircle size={16} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
            : <AlertTriangle size={16} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />
          }
          <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
            {equip.label}
          </span>
        </div>

        {/* Toggle operacional */}
        {!readOnly && (
          <label className="flex items-center gap-2 cursor-pointer" style={{ marginLeft: 'auto' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
              {value.operacional ? 'Operacional' : 'Com Problema'}
            </span>
            <div
              onClick={() => { set('operacional', !value.operacional); setExpanded(value.operacional); }}
              style={{
                width: '44px', height: '24px', borderRadius: '12px', cursor: 'pointer',
                background: value.operacional ? 'var(--color-success)' : 'var(--color-danger)',
                position: 'relative', transition: 'background 0.2s',
              }}
            >
              <div style={{
                position: 'absolute', top: '3px',
                left: value.operacional ? '22px' : '3px',
                width: '18px', height: '18px', borderRadius: '50%',
                background: '#fff', transition: 'left 0.2s',
              }} />
            </div>
          </label>
        )}

        {readOnly && (
          <span className={`badge ${value.operacional ? 'badge-success' : 'badge-danger'}`} style={{ marginLeft: 'auto', fontSize: '0.75rem' }}>
            {value.operacional ? 'Operacional' : 'Com Problema'}
          </span>
        )}

        {!value.operacional && (
          <button
            onClick={() => setExpanded(!expanded)}
            style={{ color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
      </div>

      {/* Detalhes — só quando quebrado e expandido */}
      {!value.operacional && expanded && (
        <div className="grid gap-3 px-4 pb-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
          <div>
            <label className="label">Qtd. com problema</label>
            <input type="number" min="0" className="input" value={value.quantidadeQuebrada || ''} readOnly={readOnly}
              onChange={e => set('quantidadeQuebrada', e.target.value)} placeholder="0" />
          </div>
          <div>
            <label className="label">Nº Série</label>
            <input className="input" value={value.numeroSerie || ''} readOnly={readOnly}
              onChange={e => set('numeroSerie', e.target.value)} placeholder="SN-000" />
          </div>
          <div>
            <label className="label">Chamado Aberto</label>
            <input className="input" value={value.numeroChamado || ''} readOnly={readOnly}
              onChange={e => set('numeroChamado', e.target.value)} placeholder="CSA-0000" />
          </div>
          <div>
            <label className="label">Valor (R$)</label>
            <input type="number" step="0.01" className="input" value={value.valor || ''} readOnly={readOnly}
              onChange={e => set('valor', e.target.value)} placeholder="0,00" />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="label">Descrição do Problema</label>
            <textarea className="input" rows={2} value={value.descricaoProblema || ''} readOnly={readOnly}
              onChange={e => set('descricaoProblema', e.target.value)} placeholder="Descreva o problema..." style={{ resize: 'vertical' }} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Componente de linha do carrinho ────────────────────────────────────────

function LinhaCarrinho({ carrinho, value, onChange, readOnly }) {
  const set = (field, val) => onChange({ ...value, [field]: val });
  const temProblema = parseInt(value.quebrados) > 0;

  return (
    <div style={{ borderBottom: '1px solid var(--color-border)', background: temProblema ? 'rgba(239,68,68,0.06)' : 'transparent' }}>
      <div className="flex items-center gap-3 px-4 py-3 flex-wrap">
        <div className="flex items-center gap-2" style={{ minWidth: '200px' }}>
          {temProblema
            ? <AlertTriangle size={16} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />
            : <CheckCircle size={16} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
          }
          <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>
            {carrinho.label}
          </span>
        </div>

        <div className="flex items-center gap-4" style={{ marginLeft: 'auto', flexWrap: 'wrap', gap: '12px' }}>
          <div className="flex items-center gap-2">
            <label style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>Total:</label>
            <span style={{ fontWeight: 700, fontSize: '0.875rem', minWidth: '40px', textAlign: 'center' }}>{value.total || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <label style={{ fontSize: '0.8125rem', color: 'var(--color-danger)', whiteSpace: 'nowrap' }}>Quebrados:</label>
            <input type="number" min="0" className="input" style={{ width: '70px', borderColor: temProblema ? 'var(--color-danger)' : undefined }} value={value.quebrados || 0} readOnly={readOnly}
              onChange={e => set('quebrados', e.target.value)} />
          </div>
          {temProblema && (
            <input className="input" style={{ width: '160px' }} value={value.numeroChamado || ''} readOnly={readOnly}
              onChange={e => set('numeroChamado', e.target.value)} placeholder="Nº Chamado" />
          )}
        </div>
      </div>
      {temProblema && (
        <div className="px-4 pb-3">
          <textarea className="input" rows={1} style={{ resize: 'vertical' }} value={value.descricaoProblema || ''} readOnly={readOnly}
            onChange={e => set('descricaoProblema', e.target.value)} placeholder="Descrição do problema..." />
        </div>
      )}
    </div>
  );
}

// ─── Tab de Equipamentos ────────────────────────────────────────────────────

function TabEquipamentos({ semana, ano, usuario, canEdit }) {
  const qc = useQueryClient();

  // Agora usa usuario.unidade para identificar a loja
  const { data: checklistExistente, isLoading } = useQuery({
    queryKey: ['checklist-equip', semana, ano, usuario.unidade],
    queryFn: () => api.get('/checklists/equipamentos/semana', { params: { semana, ano, unidade: usuario.unidade } }).then(r => r.data),
    enabled: !!usuario.unidade
  });

  const defaultItens = () => EQUIPAMENTOS.map(e => ({
    tipoEquipamento: e.key, operacional: true, quantidade: 1,
    quantidadeQuebrada: 0, numeroSerie: '', numeroChamado: '', descricaoProblema: '', valor: '',
  }));

  const [itens, setItens] = useState(defaultItens());
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    if (checklistExistente?.itens?.length) {
      setItens(EQUIPAMENTOS.map(e => {
        const found = checklistExistente.itens.find(i => i.tipoEquipamento === e.key);
        return found || { tipoEquipamento: e.key, operacional: true, quantidade: 1, quantidadeQuebrada: 0 };
      }));
      setObservacoes(checklistExistente.observacoes || '');
    } else {
      setItens(defaultItens());
      setObservacoes('');
    }
  }, [checklistExistente]);

  const mutation = useMutation({
    mutationFn: () => api.post('/checklists/equipamentos', { semana, ano, itens, observacoes }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['checklist-equip'] }); toast.success('Checklist salvo!'); },
    onError: (e) => toast.error(e.response?.data?.error || 'Erro ao salvar'),
  });

  const setItem = (key, val) => setItens(prev => prev.map(i => i.tipoEquipamento === key ? val : i));
  const problemCount = itens.filter(i => !i.operacional).length;

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-brand-500)' }} /></div>;

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="card" style={{ padding: '12px 20px', flex: 1, minWidth: '160px', borderTop: '4px solid var(--color-danger)' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Equipamentos c/ Problema</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: problemCount > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>{problemCount}</p>
        </div>
        <div className="card" style={{ padding: '12px 20px', flex: 1, minWidth: '160px', borderTop: '4px solid var(--color-success)' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Operacionais</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-success)' }}>{itens.length - problemCount}</p>
        </div>
        {checklistExistente && (
          <div className="card" style={{ padding: '12px 20px', flex: 1, minWidth: '160px' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Último preenchimento</p>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {new Date(checklistExistente.criadoEm).toLocaleDateString('pt-BR')}
            </p>
          </div>
        )}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.875rem' }}>
          Equipamentos — Semana {semana} · {mesDoChecklist(semana, ano).charAt(0).toUpperCase() + mesDoChecklist(semana, ano).slice(1)}/{ano}
        </div>
        {itens.map(item => {
          const equip = EQUIPAMENTOS.find(e => e.key === item.tipoEquipamento);
          return (
            <LinhaEquipamento
              key={item.tipoEquipamento}
              equip={equip}
              value={item}
              onChange={(val) => setItem(item.tipoEquipamento, val)}
              readOnly={!canEdit}
            />
          );
        })}

        {canEdit && (
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--color-border)' }}>
            <label className="label">Observações Gerais</label>
            <textarea className="input" rows={2} style={{ resize: 'vertical' }} value={observacoes}
              onChange={e => setObservacoes(e.target.value)} placeholder="Observações adicionais..." />
          </div>
        )}
      </div>

      {canEdit && (
        <div className="flex justify-end">
          <button className="btn btn-primary" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Salvar Checklist
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Componente Setup de Frota ──────────────────────────────────────────────

function SetupFrota({ onSaved }) {
  const [itens, setItens] = useState(CARRINHOS.map(c => ({ tipoCarrinho: c.key, total: 0 })));
  const mutation = useMutation({
    mutationFn: (data) => checklistService.salvarFrota({ itens: data }),
    onSuccess: () => { toast.success('Frota inicial configurada!'); onSaved(); },
    onError: (e) => toast.error('Erro ao salvar frota'),
  });

  const update = (key, val) => setItens(prev => prev.map(i => i.tipoCarrinho === key ? { ...i, total: parseInt(val) || 0 } : i));

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="card" style={{ border: '2px dashed var(--color-brand-300)', background: 'var(--color-brand-50)', padding: '30px', textAlign: 'center' }}>
        <div className="flex justify-center mb-4">
          <div className="flex items-center justify-center w-16 h-16 rounded-full" style={{ background: 'var(--color-brand-100)', color: 'var(--color-brand-600)' }}>
            <ShoppingCart size={32} />
          </div>
        </div>
        <h2 style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>Configuração de Inventário</h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', maxWidth: '500px', margin: '8px auto' }}>
          Identificamos que sua loja ainda não possui uma frota de carrinhos cadastrada. Informe o total de ativos que a loja possui em estoque para prosseguir com o checklist.
        </p>

        <div className="grid gap-3 mt-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', textAlign: 'left' }}>
          {CARRINHOS.map(c => (
            <div key={c.key} className="card" style={{ padding: '12px 16px' }}>
              <label className="label" style={{ marginBottom: '8px' }}>{c.label}</label>
              <input type="number" min="0" className="input" placeholder="Total na loja" 
                value={itens.find(i => i.tipoCarrinho === c.key).total}
                onChange={e => update(c.key, e.target.value)} />
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-8">
          <button className="btn btn-primary" style={{ padding: '12px 40px' }} onClick={() => mutation.mutate(itens)} disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="animate-spin" /> : <Save size={18} />}
            Salvar Inventário da Loja
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tab de Carrinhos ────────────────────────────────────────────────────────

function TabCarrinhos({ semana, ano, usuario, canEdit }) {
  const qc = useQueryClient();

  const { data: frota = [], isLoading: loadingFrota } = useQuery({
    queryKey: ['frota-carrinho', usuario.unidade],
    queryFn: () => checklistService.buscarFrota({ unidade: usuario.unidade }).then(r => r.data),
    enabled: !!usuario.unidade
  });

  const { data: checklistExistente, isLoading: loadingChecklist } = useQuery({
    queryKey: ['checklist-carrinho', semana, ano, usuario.unidade],
    queryFn: () => checklistService.buscarCarrinhoSemana({ semana, ano, unidade: usuario.unidade }).then(r => r.data),
  });

  const hasFrota = frota && frota.length > 0 && frota.some(f => f.total > 0);

  const [itens, setItens] = useState([]);
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    if (loadingFrota || loadingChecklist) return;

    if (checklistExistente?.itens?.length) {
      setItens(CARRINHOS.map(c => {
        const found = checklistExistente.itens.find(i => i.tipoCarrinho === c.key);
        const f = frota.find(f => f.tipoCarrinho === c.key);
        return found || { tipoCarrinho: c.key, total: f?.total || 0, quebrados: 0 };
      }));
      setObservacoes(checklistExistente.observacoes || '');
    } else {
      setItens(CARRINHOS.map(c => {
        const f = frota.find(f => f.tipoCarrinho === c.key);
        return { tipoCarrinho: c.key, total: f?.total || 0, quebrados: 0, numeroChamado: '', descricaoProblema: '' };
      }));
      setObservacoes('');
    }
  }, [checklistExistente, frota, loadingFrota, loadingChecklist]);

  const mutation = useMutation({
    mutationFn: () => checklistService.salvarCarrinhos({ semana, ano, itens, observacoes }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['checklist-carrinho'] }); toast.success('Checklist salvo!'); },
    onError: (e) => toast.error(e.response?.data?.error || 'Erro ao salvar'),
  });

  const setItem = (key, val) => setItens(prev => prev.map(i => i.tipoCarrinho === key ? val : i));
  const totalQuebrados = itens.reduce((s, i) => s + (parseInt(i.quebrados) || 0), 0);
  const totalGeral = itens.reduce((s, i) => s + (parseInt(i.total) || 0), 0);

  if (loadingFrota || loadingChecklist) return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-brand-500)' }} /></div>;

  if (!hasFrota && canEdit) {
    return <SetupFrota onSaved={() => qc.invalidateQueries({ queryKey: ['frota-carrinho'] })} />;
  }

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="card" style={{ padding: '12px 20px', flex: 1, minWidth: '140px', borderTop: '4px solid var(--color-brand-400)' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Móveis de Loja (Total)</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{totalGeral}</p>
        </div>
        <div className="card" style={{ padding: '12px 20px', flex: 1, minWidth: '140px', borderTop: '4px solid var(--color-danger)' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Ativos Quebrados</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: totalQuebrados > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>{totalQuebrados}</p>
        </div>
        <div className="card" style={{ padding: '12px 20px', flex: 1, minWidth: '140px', borderTop: '4px solid var(--color-warning)' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Taxa de Quebra (%)</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-warning)' }}>
            {totalGeral > 0 ? ((totalQuebrados / totalGeral) * 100).toFixed(1) : 0}%
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="flex items-center justify-between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
          <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '0.875rem' }}>
            Carrinhos — Semana {semana} · {mesDoChecklist(semana, ano).charAt(0).toUpperCase() + mesDoChecklist(semana, ano).slice(1)}/{ano}
          </span>
          {canEdit && <button className="btn btn-ghost btn-xs" onClick={() => qc.setQueryData(['frota-carrinho', usuario.unidade], [])} style={{ fontSize: '0.7rem' }}>Redefinir Frota</button>}
        </div>
        {itens.map(item => {
          const carrinho = CARRINHOS.find(c => c.key === item.tipoCarrinho);
          return (
            <LinhaCarrinho
              key={item.tipoCarrinho}
              carrinho={carrinho}
              value={item}
              onChange={(val) => setItem(item.tipoCarrinho, val)}
              readOnly={!canEdit}
            />
          );
        })}

        {canEdit && (
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--color-border)' }}>
            <label className="label">Observações Gerais</label>
            <textarea className="input" rows={2} style={{ resize: 'vertical' }} value={observacoes}
              onChange={e => setObservacoes(e.target.value)} placeholder="Observações adicionais..." />
          </div>
        )}
      </div>

      {canEdit && (
        <div className="flex justify-end">
          <button className="btn btn-primary" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Salvar Checklist Semanal
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Página Principal ────────────────────────────────────────────────────────

// ─── Componentes de Visão Corporativa / Regional ───────────────────────────

function CoordenadorList({ onSelect }) {
  const { data: coordenadoresRes, isLoading } = useQuery({
    queryKey: ['usuario-coordenadores'],
    queryFn: () => usuariosService.listar({ role: 'COORDENADOR' }).then(r => r.data),
  });

  if (isLoading) return <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>{[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: '100px', borderRadius: '12px' }} />)}</div>;

  const coordenadores = coordenadoresRes?.data || [];

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <div>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>Coordenadores Regionais</h2>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Selecione um coordenador para visualizar os gestores da regional</p>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
        {coordenadores.map(c => (
          <div key={c.id} className="card hover-scale pointer" onClick={() => onSelect(c)} style={{ padding: '20px' }}>
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl" style={{ background: 'var(--color-brand-100)', color: 'var(--color-brand-600)' }}>
                <Users size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '4px' }}>{c.nome}</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Building2 size={12} /> Regional: <strong style={{ color: 'var(--color-brand-400)' }}>{c.regiao || 'N/A'}</strong>
                </p>
              </div>
              <ChevronDown size={18} className="rotate-270" style={{ color: 'var(--color-text-muted)' }} />
            </div>
          </div>
        ))}
        {coordenadores.length === 0 && (
          <div className="card text-center p-10 col-span-full" style={{ border: '1px dashed var(--color-border)' }}>
             <p style={{ color: 'var(--color-text-muted)' }}>Nenhum coordenador encontrado.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function GestorList({ onSelect, regiao, onBack }) {
  const { usuario: usuarioLogado } = useAuth();
  const { data: gestoresRes, isLoading } = useQuery({
    queryKey: ['usuario-gestores-regional', regiao],
    queryFn: () => usuariosService.listar({ role: 'GESTOR', regiao }).then(r => r.data),
  });

  if (isLoading) return <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>{[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: '100px', borderRadius: '12px' }} />)}</div>;

  const gestores = gestoresRes?.data || [];

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <div className="flex items-center gap-3">
        {onBack && (
          <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ padding: '8px' }}>
            <ChevronUp className="rotate-270" size={18} />
          </button>
        )}
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            {['ADMINISTRADOR', 'DIRETOR', 'GERENTE'].includes(usuarioLogado?.role) ? `Gestores da Regional: ${regiao || ''}` : 'Gestores da Regional'}
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Selecione um gestor para visualizar o quantitativo de reports</p>
        </div>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
        {gestores.map(g => (
          <div key={g.id} className="card hover-scale pointer" onClick={() => onSelect(g)} style={{ padding: '20px' }}>
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl" style={{ background: 'var(--color-brand-100)', color: 'var(--color-brand-600)' }}>
                <ClipboardCheck size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '4px' }}>{g.nome}</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Building2 size={12} /> {g.unidade || 'Loja Não Informada'}
                </p>
              </div>
              <ChevronDown size={18} className="rotate-270" style={{ color: 'var(--color-text-muted)' }} />
            </div>
          </div>
        ))}
        {gestores.length === 0 && (
          <div className="card text-center p-10 col-span-full" style={{ border: '1px dashed var(--color-border)' }}>
             <p style={{ color: 'var(--color-text-muted)' }}>Nenhum gestor encontrado para esta regional.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function GestorMonthlyView({ gestor, onSelectMonth, onBack }) {
  const agora = new Date();
  const [ano, setAno] = useState(agora.getFullYear());
  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center gap-3">
        {onBack && (
          <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ padding: '8px' }}>
            <ChevronUp className="rotate-270" size={18} />
          </button>
        )}
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Reports: {gestor?.nome || 'Gestor'}</h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Quantitativo Mensal por Competência</p>
        </div>
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
        {meses.map((mes, idx) => (
          <MonthCard 
            key={mes} 
            mesNome={mes} 
            mesIdx={idx + 1} 
            ano={ano} 
            gestorId={gestor?.id} 
            onClick={() => onSelectMonth(idx + 1, ano)} 
          />
        ))}
      </div>
    </div>
  );
}

function MonthCard({ mesNome, mesIdx, ano, gestorId, onClick }) {
  const { data: kpi, isLoading } = useQuery({
    queryKey: ['kpi-mensal-gestor', gestorId, mesIdx, ano],
    queryFn: () => checklistService.kpiMensal({ usuarioId: gestorId, mes: mesIdx, ano }).then(r => r.data),
    enabled: !!gestorId
  });

  const totalSemanas = kpi?.equipamentos?.semanasPrenchidas || 0;

  return (
    <div className="card hover-scale pointer" onClick={onClick} style={{ padding: '16px', background: totalSemanas > 0 ? undefined : 'rgba(0,0,0,0.02)' }}>
      <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text-primary)' }}>{mesNome}</p>
      {isLoading ? (
        <div className="skeleton mt-2" style={{ height: '20px', width: '60%' }} />
      ) : (
        <div className="mt-2">
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            {totalSemanas === 0 ? 'Sem reports' : `${totalSemanas} ${totalSemanas === 1 ? 'semana' : 'semanas'} preenchidas`}
          </p>
          <div className="flex gap-1 mt-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ height: '4px', flex: 1, borderRadius: '2px', background: i < totalSemanas ? 'var(--color-brand-400)' : 'var(--color-border)' }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function GestorWeeklyList({ gestor, mes, ano, onSelectReport, onBack }) {
  const { data: checklistsEquip = [], isLoading: l1 } = useQuery({
    queryKey: ['list-equip-gestor', gestor?.id, mes, ano],
    queryFn: () => checklistService.listarEquipamentos({ criadoPorId: gestor?.id, mes, ano }).then(r => r.data),
    enabled: !!gestor?.id
  });
  
  const inicioMes = startOfMonth(new Date(ano, mes - 1));
  const fimMes    = endOfMonth(new Date(ano, mes - 1));
  const semanaInicio = getWeek(inicioMes, { weekStartsOn: 1 });
  const semanaFim    = getWeek(fimMes,    { weekStartsOn: 1 });
  
  const semanasNoMes = Array.from({ length: semanaFim - semanaInicio + 1 }, (_, i) => semanaInicio + i);
  const semanaHoje = getWeek(new Date(), { weekStartsOn: 1 });

  if (l1) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button className="btn btn-ghost btn-sm" onClick={onBack} style={{ padding: '8px' }}>
          <ChevronUp className="rotate-270" size={18} />
        </button>
        <div>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Reports Semanais — {mes}/{ano}</h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Visualizando reports de: <strong>{gestor?.nome || '—'}</strong></p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {semanasNoMes.map((s, idx) => {
          const report = checklistsEquip.find(c => c.semana === s);
          const ehSemanaAtual = s === semanaHoje;

          return (
            <div key={s} className="card hover-scale pointer" 
              onClick={() => onSelectReport(s, ano)}
              style={{ 
                padding: '16px 20px',
                background: ehSemanaAtual ? 'rgba(0,0,0,0.06)' : undefined,
                border: ehSemanaAtual ? '1px solid var(--color-border)' : undefined,
                boxShadow: ehSemanaAtual ? 'inset 0 0 0 1px rgba(0,0,0,0.05)' : undefined
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div style={{ 
                    width: '32px', height: '32px', borderRadius: '50%', 
                    background: ehSemanaAtual ? 'var(--color-brand-400)' : 'var(--color-border)',
                    color: ehSemanaAtual ? '#fff' : 'var(--color-text-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.875rem', fontWeight: 700
                  }}>
                    {idx + 1}
                  </div>
                  <div>
                    <h4 style={{ fontWeight: 600, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      Semana {idx + 1}
                      {ehSemanaAtual && <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', background: 'var(--color-brand-100)', color: 'var(--color-brand-600)', textTransform: 'uppercase' }}>Atual</span>}
                    </h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      {report ? `Preenchido em ${new Date(report.criadoEm).toLocaleDateString()}` : 'Não preenchido'}
                    </p>
                  </div>
                </div>
                {report ? (
                  <span className="badge badge-success">Visualizar/Editar</span>
                ) : (
                  <span className="badge badge-neutral">Pendente</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Página Principal ────────────────────────────────────────────────────────

export default function ChecklistPage() {
  const { usuario } = useAuth();
  const agora = new Date();
  
  if (!usuario) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="animate-spin" size={32} style={{ color: 'var(--color-brand-500)' }} />
      </div>
    );
  }

  const [viewState, setViewState] = useState({ 
    mode: ['ADMINISTRADOR', 'DIRETOR', 'GERENTE'].includes(usuario?.role) ? 'COORDENADOR_LIST' : (usuario?.role === 'COORDENADOR' ? 'GESTOR_LIST' : 'MONTHS'), 
    gestor: usuario?.role === 'GESTOR' ? usuario : null, 
    regiaoSelecionada: usuario?.role === 'COORDENADOR' ? usuario.regiao : null,
    mes: agora.getMonth() + 1, 
    ano: agora.getFullYear(),
    week: null 
  });

  const [tab, setTab] = useState('equipamentos');
  const canEdit = usuario?.role === 'GESTOR';

  if (viewState.mode === 'COORDENADOR_LIST') {
    return <CoordenadorList onSelect={(c) => setViewState(p => ({ ...p, mode: 'GESTOR_LIST', regiaoSelecionada: c.regiao }))} />;
  }

  if (viewState.mode === 'GESTOR_LIST') {
    return (
      <GestorList 
        regiao={viewState.regiaoSelecionada}
        onBack={['ADMINISTRADOR', 'DIRETOR', 'GERENTE'].includes(usuario?.role) ? () => setViewState(p => ({ ...p, mode: 'COORDENADOR_LIST', regiaoSelecionada: null })) : null}
        onSelect={(g) => setViewState(p => ({ ...p, mode: 'MONTHS', gestor: g }))} 
      />
    );
  }

  if (viewState.mode === 'MONTHS') {
    return (
      <GestorMonthlyView 
        gestor={viewState.gestor} 
        onBack={() => setViewState(p => ({ ...p, mode: 'GESTOR_LIST', gestor: null }))}
        onSelectMonth={(m, a) => setViewState(p => ({ ...p, mode: 'WEEKS', mes: m, ano: a }))} 
      />
    );
  }

  if (viewState.mode === 'WEEKS') {
    return (
      <GestorWeeklyList 
        gestor={viewState.gestor} 
        mes={viewState.mes} 
        ano={viewState.ano} 
        onBack={() => setViewState(p => ({ ...p, mode: 'MONTHS' }))}
        onSelectReport={(s, a) => setViewState(p => ({ ...p, mode: 'FORM', week: s, ano: a }))} 
      />
    );
  }

  if (viewState.mode === 'FORM') {
    return (
      <div className="flex flex-col gap-5 animate-fade-in">
         <div className="flex items-center gap-3">
          <button className="btn btn-ghost btn-sm" onClick={() => setViewState(p => ({ ...p, mode: 'WEEKS' }))} style={{ padding: '8px' }}>
            <ChevronUp className="rotate-270" size={18} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
               {canEdit ? 'Preencher Checklist' : 'Report de Manutenção'} — Semana {viewState.week}
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              Competência: <strong style={{ color: 'var(--color-brand-400)' }}>{mesDoChecklist(viewState.week, viewState.ano)} de {viewState.ano}</strong>
            </p>
          </div>
        </div>

        <div className="flex gap-1" style={{ borderBottom: '2px solid var(--color-border)' }}>
          {[
            { key: 'equipamentos', icon: ClipboardCheck, label: 'Equipamentos' },
            { key: 'carrinhos',    icon: ShoppingCart,   label: 'Carrinhos de Loja' },
          ].map(({ key, icon: Icon, label }) => (
            <button key={key} onClick={() => setTab(key)} className="flex items-center gap-2"
              style={{
                padding: '10px 20px', fontWeight: tab === key ? 700 : 500, fontSize: '0.875rem',
                color: tab === key ? 'var(--color-brand-400)' : 'var(--color-text-secondary)',
                borderBottom: tab === key ? '2px solid var(--color-brand-500)' : '2px solid transparent',
                marginBottom: '-2px', background: 'none', border: 'none', cursor: 'pointer',
              }}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        {tab === 'equipamentos' && <TabEquipamentos semana={viewState.week} ano={viewState.ano} usuario={viewState.gestor} canEdit={canEdit} />}
        {tab === 'carrinhos' && <TabCarrinhos semana={viewState.week} ano={viewState.ano} usuario={viewState.gestor} canEdit={canEdit} />}
      </div>
    );
  }

  return null;
}
