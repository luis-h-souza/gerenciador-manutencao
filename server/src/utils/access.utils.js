/**
 * Utilitário centralizado para controle de acesso baseado em Região/Unidade.
 * Define quais registros um usuário pode ver/manipular com base em seu Perfil.
 * 
 * Perfil ADMINISTRADOR / SUPERVISOR:
 *   - Vê tudo. Retorna filtro vazio {}.
 * 
 * Perfil COORDENADOR:
 *   - Vê apenas a sua Regional. Retorna { regiao: user.regiao }.
 * 
 * Perfil GESTOR:
 *   - Vê apenas a sua Unidade (Loja). Retorna { unidade: user.unidade }.
 * 
 * Perfil TECNICO:
 *   - Foco em tarefas atribuídas ou regional.
 */

const getAccessFilter = (user) => {
  if (!user) return { regiao: '__LOGOUT__' };
  
  // Nível Corporativo (Visão total do ecossistema)
  if (['ADMINISTRADOR', 'DIRETOR'].includes(user.role)) {
    return {};
  }

  // Nível Regional (Coordenador)
  if (user.role === 'COORDENADOR') {
    return user.regiao ? { regiao: user.regiao } : { regiao: '__SEM_REGIAO__' };
  }

  // Nível Unidade / Loja (Gestor)
  if (user.role === 'GESTOR') {
    return user.unidade ? { unidade: user.unidade } : { unidade: '__SEM_UNIDADE__' };
  }

  // Nível Operacional (Técnico)
  if (user.role === 'TECNICO') {
    // Para tarefas, geralmente filtramos por atribuidoParaId, 
    // mas para visualização geral usamos a região.
    return user.regiao ? { regiao: user.regiao } : { regiao: '__SEM_REGIAO__' };
  }

  return { regiao: '__ACESSO_NEGADO__' };
};

/**
 * Retorna os campos que devem ser injetados automaticamente na criação de registros.
 */
const getCreationContext = (user) => {
  return {
    regiao: user.regiao || null,
    unidade: user.unidade || null,
    criadoPorId: user.id
  };
};

module.exports = {
  getAccessFilter,
  getCreationContext
};
