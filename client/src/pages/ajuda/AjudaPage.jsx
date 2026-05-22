import { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { faqData, faqCategories } from '../../data/faqData';

export default function AjudaPage() {
  const [busca, setBusca] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState('todos');
  const [abertos, setAbertos] = useState({});

  const toggleArtigo = (id) => {
    setAbertos(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const artigos = useMemo(() => {
    return faqData.filter(item => {
      const matchCategoria = categoriaAtiva === 'todos' || item.category === categoriaAtiva;
      if (!matchCategoria) return false;
      if (!busca.trim()) return true;
      const termo = busca.toLowerCase();
      return (
        item.title.toLowerCase().includes(termo) ||
        item.description.toLowerCase().includes(termo) ||
        item.content.toLowerCase().includes(termo)
      );
    });
  }, [busca, categoriaAtiva]);

  const renderConteudo = (content) => {
    return content.split('\n').map((linha, i) => {
      if (linha.startsWith('**') && linha.endsWith('**') && linha.length > 4) {
        return (
          <p key={i} style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '4px', marginTop: '12px' }}>
            {linha.replace(/\*\*/g, '')}
          </p>
        );
      }
      if (linha.startsWith('- ')) {
        return (
          <li key={i} style={{ color: 'var(--color-text-secondary)', paddingLeft: '8px', marginBottom: '4px' }}>
            {formatarInline(linha.slice(2))}
          </li>
        );
      }
      if (linha.match(/^\d+\.\s/)) {
        return (
          <li key={i} style={{ color: 'var(--color-text-secondary)', paddingLeft: '8px', marginBottom: '4px', listStyleType: 'decimal' }}>
            {formatarInline(linha.replace(/^\d+\.\s/, ''))}
          </li>
        );
      }
      if (linha.startsWith('---')) {
        return <hr key={i} style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '12px 0' }} />;
      }
      if (linha.startsWith('`') && linha.endsWith('`')) {
        return (
          <code key={i} style={{
            display: 'block',
            background: 'var(--color-surface-900)',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '0.8125rem',
            color: 'var(--color-brand-400)',
            margin: '8px 0',
            fontFamily: 'monospace',
          }}>
            {linha.slice(1, -1)}
          </code>
        );
      }
      if (linha.startsWith('| ')) {
        return null;
      }
      if (linha.trim() === '') return <br key={i} />;
      return (
        <p key={i} style={{ color: 'var(--color-text-secondary)', marginBottom: '6px', lineHeight: 1.6 }}>
          {formatarInline(linha)}
        </p>
      );
    });
  };

  const formatarInline = (texto) => {
    const partes = texto.split(/(\*\*[^*]+\*\*)/g);
    return partes.map((parte, i) => {
      if (parte.startsWith('**') && parte.endsWith('**')) {
        return <strong key={i} style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{parte.slice(2, -2)}</strong>;
      }
      return parte;
    });
  };

  return (
    <div style={{ padding: '24px', maxWidth: '860px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div className="flex items-center gap-3" style={{ marginBottom: '6px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'var(--color-brand-600)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <HelpCircle size={20} color="#fff" />
          </div>
          <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Centro de Ajuda
          </h1>
        </div>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', paddingLeft: '48px' }}>
          Encontre respostas sobre as funcionalidades do sistema
        </p>
      </div>

      {/* Busca */}
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <Search
          size={16}
          style={{
            position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
            color: 'var(--color-text-muted)',
          }}
        />
        <input
          type="text"
          placeholder="Pesquisar artigos..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          style={{
            width: '100%',
            paddingLeft: '40px',
            paddingRight: '16px',
            paddingTop: '10px',
            paddingBottom: '10px',
            background: 'var(--color-surface-800)',
            border: '1px solid var(--color-border)',
            borderRadius: '10px',
            fontSize: '0.875rem',
            color: 'var(--color-text-primary)',
            outline: 'none',
          }}
        />
      </div>

      {/* Filtros de categoria */}
      <div className="flex flex-wrap gap-2" style={{ marginBottom: '24px' }}>
        {faqCategories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategoriaAtiva(cat.id)}
            style={{
              padding: '5px 14px',
              borderRadius: '20px',
              fontSize: '0.8125rem',
              fontWeight: categoriaAtiva === cat.id ? 600 : 400,
              cursor: 'pointer',
              border: categoriaAtiva === cat.id
                ? '1px solid var(--color-brand-500)'
                : '1px solid var(--color-border)',
              background: categoriaAtiva === cat.id
                ? 'var(--color-brand-600)'
                : 'var(--color-surface-800)',
              color: categoriaAtiva === cat.id
                ? '#fff'
                : 'var(--color-text-secondary)',
              transition: 'all 0.15s',
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Contador */}
      <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
        {artigos.length} {artigos.length === 1 ? 'artigo encontrado' : 'artigos encontrados'}
      </p>

      {/* Lista de artigos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {artigos.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '48px 24px',
            background: 'var(--color-surface-800)',
            borderRadius: '12px',
            border: '1px solid var(--color-border)',
          }}>
            <HelpCircle size={32} style={{ color: 'var(--color-text-muted)', margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              Nenhum artigo encontrado para "<strong>{busca}</strong>"
            </p>
            <button
              onClick={() => { setBusca(''); setCategoriaAtiva('todos'); }}
              style={{ marginTop: '12px', fontSize: '0.8125rem', color: 'var(--color-brand-400)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          artigos.map(artigo => (
            <div
              key={artigo.id}
              style={{
                background: 'var(--color-surface-800)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                overflow: 'hidden',
                transition: 'border-color 0.15s',
              }}
            >
              <button
                onClick={() => toggleArtigo(artigo.id)}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '12px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: 'var(--color-brand-600)',
                      color: '#fff',
                    }}>
                      {faqCategories.find(c => c.id === artigo.category)?.label || artigo.category}
                    </span>
                    <span style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {artigo.title}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                    {artigo.description}
                  </p>
                </div>
                <div style={{ color: 'var(--color-text-muted)', flexShrink: 0, marginTop: '2px' }}>
                  {abertos[artigo.id] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </button>

              {abertos[artigo.id] && (
                <div style={{
                  padding: '0 20px 20px',
                  borderTop: '1px solid var(--color-border)',
                  paddingTop: '16px',
                  marginLeft: '16px'
                }}>
                  <div style={{ fontSize: '0.875rem', lineHeight: 1.7 }}>
                    {renderConteudo(artigo.content)}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
