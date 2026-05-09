// src/controllers/log.controller.js
const logService = require('../services/log.service');
const { resSucesso, resErroInterno } = require('../utils/retornoHttp');

class LogController {
  async listar(req, res, next) {
    try {
      // Somente ADMINISTRADOR pode ver logs (isso deve ser garantido pelo middleware de autorização)
      const logs = await logService.listar(req.query);
      return resSucesso(res, 'Logs carregados com sucesso', 200, logs);
    } catch (error) {
      return resErroInterno(res, error);
    }
  }
}

module.exports = new LogController();
