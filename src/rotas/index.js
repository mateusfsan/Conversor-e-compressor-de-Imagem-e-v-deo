const express = require('express');
const router = express.Router();
const imagemControlador = require('../controladores/imagemControlador');

// Rota de saúde
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

// Converter para WebP
router.post('/imagem/convert', imagemControlador.uploadMiddleware, imagemControlador.converterParaWebp);

// Comprimir imagem
router.post('/imagem/comprimir', imagemControlador.uploadMiddleware, imagemControlador.comprimirImagem);

// Baixar arquivo individual
router.get('/imagem/download/:cacheId/:index', imagemControlador.baixarArquivoProcessado);

// Baixar ZIP completo
router.get('/imagem/download-zip/:cacheId', imagemControlador.baixarZipCompleto);

module.exports = router;
