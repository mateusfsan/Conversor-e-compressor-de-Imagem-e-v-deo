const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const { SERVER, TIPOS_PROCESSAMENTO, ERROS, UPLOAD } = require('../config/constantes');
const ProcessadorImagens = require('../services/processadorImagens');
const CacheArquivos = require('../services/cache');
const logger = require('../utils/logger');
const validadorArquivos = require('../middlewares/validadorArquivos');

const TMP = SERVER.TMP_DIR;

// ==================== CONFIGURAÇÃO ====================

// Garantir diretório temporário
try {
  fs.mkdirSync(TMP, { recursive: true });
} catch (e) {
  logger.erro('Erro ao criar diretório temporário', {
    erro: e.message,
  });
}

const upload = multer({
  dest: TMP,
  limits: { fileSize: UPLOAD.MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error(ERROS.TIPO_INVALIDO));
    }
    cb(null, true);
  },
});

// ==================== EXPORTS ====================

exports.uploadMiddleware = [
  upload.array('arquivos', UPLOAD.MAX_FILES),
  validadorArquivos,
];

/**
 * Converter imagens para WebP
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
exports.converterParaWebp = async (req, res, next) => {
  try {
    await processarImagens(req, res, TIPOS_PROCESSAMENTO.CONVERTER);
  } catch (erro) {
    next(erro);
  }
};

/**
 * Comprimir imagens
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
exports.comprimirImagem = async (req, res, next) => {
  try {
    await processarImagens(req, res, TIPOS_PROCESSAMENTO.COMPRIMIR);
  } catch (erro) {
    next(erro);
  }
};

/**
 * Baixar arquivo individual processado do cache
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
exports.baixarArquivoProcessado = (req, res, next) => {
  try {
    const { cacheId, index } = req.params;

    const dados = CacheArquivos.obter(cacheId);
    if (!dados) {
      return res.status(404).json({
        sucesso: false,
        mensagem: ERROS.CACHE_EXPIRADO,
      });
    }

    const arquivo = dados.arquivos[index];
    if (!arquivo) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Arquivo não encontrado.',
      });
    }

    res.download(arquivo.caminhoSaida, arquivo.nomeProcessado, (erro) => {
      if (erro) {
        logger.erro('Erro ao fazer download', {
          arquivo: arquivo.nomeProcessado,
          erro: erro.message,
        });
      }
    });
  } catch (erro) {
    next(erro);
  }
};

/**
 * Baixar ZIP completo
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
exports.baixarZipCompleto = async (req, res, next) => {
  try {
    const { cacheId } = req.params;

    const dados = CacheArquivos.obter(cacheId);
    if (!dados) {
      return res.status(404).json({
        sucesso: false,
        mensagem: ERROS.CACHE_EXPIRADO,
      });
    }

    const caminhos = dados.arquivos.map((arq) => arq.caminhoSaida);
    const nomeZip = path.join(TMP, `${cacheId}.zip`);

    await ProcessadorImagens.criarZip(caminhos, nomeZip);

    res.download(nomeZip, `imagens-processadas-${cacheId}.zip`, (erro) => {
      if (erro) {
        logger.erro('Erro ao fazer download do ZIP', {
          cacheId,
          erro: erro.message,
        });
      }
      // Limpar ZIP após download
      fs.unlink(nomeZip, () => {});
    });
  } catch (erro) {
    next(erro);
  }
};

// ==================== FUNÇÕES PRIVADAS ====================

/**
 * Processar imagens (converter ou comprimir)
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {string} tipo - Tipo de processamento
 * @private
 */
async function processarImagens(req, res, tipo) {
  const cacheId = uuidv4();
  const arquivosProcessados = [];
  const erros = [];

  try {
    // Processar cada arquivo em paralelo
    const promessas = req.files.map((arquivo) =>
      processarArquivoIndividual(arquivo, tipo, cacheId)
        .then((resultado) => {
          arquivosProcessados.push(resultado);
        })
        .catch((erro) => {
          erros.push({
            arquivo: arquivo.originalname,
            erro: erro.message,
          });
        })
    );

    await Promise.all(promessas);

    if (arquivosProcessados.length === 0) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Nenhum arquivo foi processado com sucesso.',
        erros,
      });
    }

    // Calcular estatísticas
    const resultado = calcularEstatisticas(
      arquivosProcessados,
      cacheId,
      erros
    );

    // Armazenar no cache
    CacheArquivos.armazenar(cacheId, {
      ...resultado,
      timestamp: Date.now(),
    });

    logger.info(`${tipo} concluído`, {
      cacheId,
      total: arquivosProcessados.length,
      reducao: resultado.reducaoMedia,
    });

    res.json(resultado);
  } catch (erro) {
    logger.erro(`Erro ao processar imagens (${tipo})`, {
      erro: erro.message,
      cacheId,
    });

    res.status(500).json({
      sucesso: false,
      mensagem: ERROS.PROCESSAMENTO_FALHOU,
    });
  }
}

/**
 * Processar arquivo individual
 * @param {Object} arquivo - Arquivo do multer
 * @param {string} tipo - Tipo de processamento
 * @param {string} cacheId - ID do cache
 * @returns {Promise<Object>}
 * @private
 */
async function processarArquivoIndividual(arquivo, tipo, cacheId) {
  const entrada = arquivo.path;
  const extensao = path.extname(arquivo.originalname);
  const nomeSemExtensao = path.parse(arquivo.originalname).name;
  const nomeProcessado =
    tipo === TIPOS_PROCESSAMENTO.CONVERTER
      ? `${nomeSemExtensao}.webp`
      : arquivo.originalname;

  const saida = path.join(
    TMP,
    `${uuidv4()}${
      tipo === TIPOS_PROCESSAMENTO.CONVERTER ? '.webp' : extensao
    }`
  );

  try {
    let resultado;

    if (tipo === TIPOS_PROCESSAMENTO.CONVERTER) {
      resultado = await ProcessadorImagens.converterParaWebp(entrada, saida);
    } else {
      resultado = await ProcessadorImagens.comprimirImagem(entrada, saida);
    }

    // Limpar arquivo original
    fs.unlink(entrada, () => {});

    return {
      nomeOriginal: arquivo.originalname,
      nomeProcessado,
      caminhoSaida: saida,
      ...resultado,
    };
  } catch (erro) {
    // Limpar se existir
    fs.unlink(entrada, () => {});
    fs.unlink(saida, () => {});
    throw erro;
  }
}

/**
 * Calcular estatísticas de processamento
 * @param {Array} arquivos - Arquivos processados
 * @param {string} cacheId - ID do cache
 * @param {Array} erros - Erros encontrados
 * @returns {Object}
 * @private
 */
function calcularEstatisticas(arquivos, cacheId, erros) {
  const tamanhoOriginalTotal = arquivos.reduce(
    (acc, arq) => acc + arq.tamanhoOriginal,
    0
  );
  const tamanhoFinalTotal = arquivos.reduce(
    (acc, arq) => acc + arq.tamanhoFinal,
    0
  );
  const reducaoMedia =
    ((tamanhoOriginalTotal - tamanhoFinalTotal) /
      tamanhoOriginalTotal) *
    100;

  return {
    sucesso: true,
    cacheId,
    total: arquivos.length,
    tamanhoOriginalTotal,
    tamanhoFinalTotal,
    reducaoMedia: parseFloat(reducaoMedia.toFixed(2)),
    arquivos,
    erros: erros.length > 0 ? erros : undefined,
  };
}
