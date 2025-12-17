const express = require("express");
const router = express.Router();
const imagemControlador = require("../controladores/imagemControlador");
const videosRoutes = require("./videos");
// Rotas de vídeo (upload/compressão)
videosRoutes(router);

/**
 * Rota de saúde da API
 */
router.get("/", (req, res) => {
  res.json({
    ok: true,
    mensagem: "API de Compressor de Imagens ativa",
    versao: "1.0.0",
    endpoints: {
      saudapi: "GET /api",
      converter: "POST /api/imagem/converter",
      comprimir: "POST /api/imagem/comprimir",
    },
  });
});

/**
 * Converter imagem para WebP
 * POST /api/imagem/converter
 * Body: multipart/form-data com campo "arquivos"
 */
router.post(
  "/imagem/converter",
  imagemControlador.uploadMiddleware,
  imagemControlador.converterParaWebp
);

// Rota legada (compatibilidade com frontend antigo)
router.post(
  "/imagem/convert",
  imagemControlador.uploadMiddleware,
  imagemControlador.converterParaWebp
);

/**
 * Comprimir imagem mantendo o formato original
 * POST /api/imagem/comprimir
 * Body: multipart/form-data com campo "arquivos"
 */
router.post(
  "/imagem/comprimir",
  imagemControlador.uploadMiddleware,
  imagemControlador.comprimirImagem
);

/**
 * Baixar arquivo individual processado
 * GET /api/imagem/download/:cacheId/:index
 */
router.get(
  "/imagem/download/:cacheId/:index",
  imagemControlador.baixarArquivoProcessado
);

/**
 * Baixar ZIP com todos os arquivos processados
 * GET /api/imagem/download-zip/:cacheId
 */
router.get(
  "/imagem/download-zip/:cacheId",
  imagemControlador.baixarZipCompleto
);

module.exports = router;
