const getAccessFilter = (user) => {
  if (!user) return { regiao: '__LOGOUT__' };

  if (['ADMINISTRADOR', 'DIRETOR'].includes(user.role)) return {};

  if (['GERENTE', 'COORDENADOR'].includes(user.role)) {
    return user.regiao ? { regiao: user.regiao } : { regiao: '__SEM_REGIAO__' };
  }

  if (user.role === 'GESTOR') {
    const unidade = user.loja?.nome;
    return unidade ? { unidade } : { unidade: '__SEM_UNIDADE__' };
  }

  if (user.role === 'TECNICO') {
    return user.regiao ? { regiao: user.regiao } : { regiao: '__SEM_REGIAO__' };
  }

  return { regiao: '__ACESSO_NEGADO__' };
};

const getCreationContext = (user) => ({
  regiao: user.regiao || null,
  unidade: user.loja?.nome || null,
  criadoPorId: user.id,
});

module.exports = { getAccessFilter, getCreationContext };
