const express = require('express');
const router = express.Router();

const imagemControlador = require('../controladores/imagemControlador');

/**
 * Rota de saúde da API
 */
router.get('/', (req, res) => {
  res.json({
    ok: true,
    mensagem: 'API de Compressor de Imagens ativa',
    versao: '1.0.0',
    endpoints: {
      saudeapi: 'GET /api',
      converterwebp: 'POST /api/imagem/convert',
      comprimirImagem: 'POST /api/imagem/comprimir'
    }
  });
});

/**
 * Converter imagem para WebP
 * POST /api/imagem/convert
 * Body: multipart/form-data com campo "arquivo"
 */
router.post('/imagem/convert', imagemControlador.uploadMiddleware, imagemControlador.converterParaWebp);

/**
 * Comprimir imagem mantendo o formato original
 * POST /api/imagem/comprimir
 * Body: multipart/form-data com campo "arquivo"
 */
router.post('/imagem/comprimir', imagemControlador.uploadMiddleware, imagemControlador.comprimirImagem);

module.exports = router;
