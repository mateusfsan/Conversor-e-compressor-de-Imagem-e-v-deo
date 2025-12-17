/**
 * Middleware de validação de arquivos
 * Valida tipo, tamanho e quantidade
 */

const { UPLOAD, ERROS } = require('../config/constantes');
const logger = require('../utils/logger');

/**
 * Validar múltiplos arquivos
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
function validarArquivos(req, res, next) {
  if (!req.files || req.files.length === 0) {
    logger.aviso('Upload sem arquivos', {
      ip: req.ip,
      user_agent: req.get('user-agent'),
    });

    return res.status(400).json({
      sucesso: false,
      mensagem: ERROS.SEM_ARQUIVO,
    });
  }

  // Validar quantidade
  if (req.files.length > UPLOAD.MAX_FILES) {
    logger.aviso('Quantidade de arquivos excedida', {
      quantidade: req.files.length,
      máximo: UPLOAD.MAX_FILES,
    });

    return res.status(400).json({
      sucesso: false,
      mensagem: `Máximo de ${UPLOAD.MAX_FILES} arquivos permitidos.`,
    });
  }

  // Validar cada arquivo
  for (const arquivo of req.files) {
    if (!UPLOAD.MIME_TYPES.includes(arquivo.mimetype)) {
      logger.aviso('Tipo MIME inválido', {
        arquivo: arquivo.originalname,
        mimetype: arquivo.mimetype,
      });

      return res.status(400).json({
        sucesso: false,
        mensagem: ERROS.TIPO_INVALIDO,
      });
    }

    if (arquivo.size > UPLOAD.MAX_FILE_SIZE) {
      logger.aviso('Arquivo muito grande', {
        arquivo: arquivo.originalname,
        tamanho: arquivo.size,
        máximo: UPLOAD.MAX_FILE_SIZE,
      });

      return res.status(413).json({
        sucesso: false,
        mensagem: ERROS.ARQUIVO_GRANDE,
      });
    }
  }

  next();
}

module.exports = validarArquivos;
