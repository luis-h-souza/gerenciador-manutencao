const splitRegions = (value) => {
  if (!value) return [];

  return [...new Set(
    String(value)
      .split(/\s*\/\s*|\s*,\s*|\s*;\s*/)
      .map((item) => item.trim())
      .filter(Boolean)
  )];
};

const getRegionFilterFromList = (regions) => {
  if (!regions.length) return { regiao: '__SEM_REGIAO__' };
  if (regions.length === 1) return { regiao: regions[0] };
  return { regiao: { in: regions } };
};

const getUserRegions = (user) => splitRegions(user?.regiao);

const canAccessRegion = (user, regiao) => {
  if (!regiao) return false;
  if (['ADMINISTRADOR', 'DIRETOR', 'SUPERVISOR'].includes(user?.role)) return true;
  return getUserRegions(user).includes(regiao);
};

const getAccessFilter = (user) => {
  if (!user) return { regiao: '__LOGOUT__' };

  if (['ADMINISTRADOR', 'DIRETOR', 'SUPERVISOR'].includes(user.role)) return {};

  if (['GERENTE', 'COORDENADOR', 'TECNICO'].includes(user.role)) {
    return getRegionFilterFromList(getUserRegions(user));
  }

  if (user.role === 'GESTOR') {
    const unidade = user.loja?.nome;
    return unidade ? { unidade } : { unidade: '__SEM_UNIDADE__' };
  }

  return { regiao: '__ACESSO_NEGADO__' };
};

const getCreationContext = (user) => {
  const regions = getUserRegions(user);

  return {
    regiao: user.loja?.regiao || regions[0] || null,
    unidade: user.loja?.nome || null,
    criadoPorId: user.id,
  };
};

module.exports = {
  splitRegions,
  getUserRegions,
  canAccessRegion,
  getAccessFilter,
  getCreationContext,
};
