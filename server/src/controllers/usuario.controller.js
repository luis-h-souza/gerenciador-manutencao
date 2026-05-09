const { resSucesso, resErroClient, resErroPermissao, resNaoEncontrado, resErroValidacao } = require('../utils/retornoHttp');
const usuarioService = require('../services/usuario.service');

const listar = async (req, res, next) => {
  try {
    const data = await usuarioService.listar(req.user, req.query);
    resSucesso(res, 'Operação realizada com sucesso', 200, data);
  } catch (err) {
    if (err.status) {
      if (err.status === 400) return resErroClient(res, err.error);
      if (err.status === 401 || err.status === 403) return resErroPermissao(res, err.error, err.status);
      if (err.status === 404) return resNaoEncontrado(res, err.error);
      if (err.status === 422) return resErroValidacao(res, err.error);
      return res.status(err.status).json({ sucesso: false, mensagem: err.error });
    }
    next(err);
  }
};

const buscarPorId = async (req, res, next) => {
  try {
    const data = await usuarioService.buscarPorId(req.user, req.params.id);
    resSucesso(res, 'Operação realizada com sucesso', 200, data);
  } catch (err) {
    if (err.status) {
      if (err.status === 400) return resErroClient(res, err.error);
      if (err.status === 401 || err.status === 403) return resErroPermissao(res, err.error, err.status);
      if (err.status === 404) return resNaoEncontrado(res, err.error);
      if (err.status === 422) return resErroValidacao(res, err.error);
      return res.status(err.status).json({ sucesso: false, mensagem: err.error });
    }
    next(err);
  }
};

const criar = async (req, res, next) => {
  try {
    const data = await usuarioService.criar(req.user, req.body);
    resSucesso(res, 'Operação realizada com sucesso', 201, data);
  } catch (err) {
    if (err.status) {
      if (err.status === 400) return resErroClient(res, err.error);
      if (err.status === 401 || err.status === 403) return resErroPermissao(res, err.error, err.status);
      if (err.status === 404) return resNaoEncontrado(res, err.error);
      if (err.status === 422) return resErroValidacao(res, err.error);
      return res.status(err.status).json({ sucesso: false, mensagem: err.error });
    }
    next(err);
  }
};

const atualizar = async (req, res, next) => {
  try {
    const data = await usuarioService.atualizar(req.user, req.params.id, req.body);
    resSucesso(res, 'Operação realizada com sucesso', 200, data);
  } catch (err) {
    if (err.status) {
      if (err.status === 400) return resErroClient(res, err.error);
      if (err.status === 401 || err.status === 403) return resErroPermissao(res, err.error, err.status);
      if (err.status === 404) return resNaoEncontrado(res, err.error);
      if (err.status === 422) return resErroValidacao(res, err.error);
      return res.status(err.status).json({ sucesso: false, mensagem: err.error });
    }
    next(err);
  }
};

const remover = async (req, res, next) => {
  try {
    await usuarioService.remover(req.user, req.params.id);
    resSucesso(res, 'Usuário desativado com sucesso');
  } catch (err) {
    if (err.status) {
      if (err.status === 400) return resErroClient(res, err.error);
      if (err.status === 401 || err.status === 403) return resErroPermissao(res, err.error, err.status);
      if (err.status === 404) return resNaoEncontrado(res, err.error);
      if (err.status === 422) return resErroValidacao(res, err.error);
      return res.status(err.status).json({ sucesso: false, mensagem: err.error });
    }
    next(err);
  }
};

module.exports = { listar, buscarPorId, criar, atualizar, remover };
