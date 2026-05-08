const { format } = require('date-fns');
const logger = require('./logger');

module.exports = {

  /**
   * Verificar se uma variavel está vazia. Testa undefined, Array vazio, String em brancos e Objetc vazio. Retorna "true" se vazio.
   * * Pode ser passado qualquer tipo de variavel.
   */
  estaVazio: (valor) => {
    return ((valor === undefined) ||
      (Array.isArray(valor) && valor.length === 0) ||
      (typeof valor === 'string' && !valor.trim()) ||
      (typeof valor === 'object' && Object.keys(valor).length === 0))
  },

  // Retornar a data e hora atual
  dataHoraAtual: () => {
    return new Date();
  },

  // Retornar a data e hora atual formatada padrão americano.
  dataHoraAtualFormatada: () => {
    return format(new Date(), 'yyyy-MM-dd HH:mm:ss');
  },

  /**
   * Converte a data padrão brasil dd/mm/aaaa para americano aaaa-mm-dd.
   * * Informe a data no padrão brasileiro.
   */
  converteData: (data) => {
    if (!data) return data;

    data = data.slice(0, 10);
    if (data.includes('/'))
      data = data.split('/').reverse().join('-');

    return data;
  },

  /**
   * Formatar retorno de Erro.
   * * Informar no primeiro parâmetro o objeto com erro, ou então pode ser passado no segundo uma mensagem padrão
   */
  trataErro: (erro, msg) => {

    if (module.exports.estaVazio(msg)) {
      msg = 'Erro:';
    }

    let erroMensagem = msg;
    erroMensagem += ` - ${erro?.message || erro || "Erro não tratado!"}`;

    logger.error(erroMensagem, { stack: erro?.stack });

    if (process.env.DEBUG === 'S') {
      console.log(format(new Date(), 'yyyy-MM-dd HH:mm:ss') + ' : ' + erroMensagem);
      console.log(erroMensagem);
      console.trace();
    }
    return erroMensagem;
  },

  /**
   * Retorna a URL base do frontend baseada no ambiente
   * Em desenvolvimento: primeira URL da lista ORIGEM
   * Em produção: segunda URL da lista ORIGEM
   */
  obterUrlFrontend: () => {
    const origens = process.env.ORIGEM ? process.env.ORIGEM.split(',') : [];
    // Detecta produção se NODE_ENV for 'production' ou se estiver rodando em Vercel
    const isProducao = process.env.NODE_ENV === 'production' ||
                      process.env.VERCEL === '1' ||
                      process.env.VERCEL_ENV === 'production';
    return origens[isProducao ? 1 : 0] || origens[0] || 'http://localhost:5500/client';
  }

}
