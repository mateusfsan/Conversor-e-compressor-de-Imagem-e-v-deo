const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const multer = require('multer');
const archiver = require('archiver');

const TMP = process.env.TMP_DIR || path.join(__dirname, '..', '..', 'tmp');

// garantir que o diretório temporário existe
try { fs.mkdirSync(TMP, { recursive: true }); } catch (e) {}

// configurar multer para upload de múltiplos arquivos
const upload = multer({
  dest: TMP,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB por arquivo
  fileFilter: (req, file, cb) => {
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!tiposPermitidos.includes(file.mimetype)) {
      return cb(new Error('Apenas arquivos de imagem são permitidos (JPEG, PNG, WebP, GIF)'));
    }
    cb(null, true);
  }
});

exports.uploadMiddleware = upload.array('arquivos', 50); // máx 50 arquivos

/**
 * Função auxiliar para limpar arquivos temporários
 * @param {string[]} caminhos - Array de caminhos de arquivo
 */
function limparArquivos(...caminhos) {
  caminhos.forEach(caminho => {
    if (!caminho) return;
    fs.unlink(caminho, (err) => {
      if (err && err.code !== 'ENOENT') {
        console.error(`Erro ao limpar arquivo ${caminho}:`, err.message);
      }
    });
  });
}

/**
 * Converter imagem para WebP - Retorna JSON com metadados
 * POST /api/imagem/convert
 * Requer: arquivos (multipart/form-data)
 */
exports.converterParaWebp = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        erro: 'Nenhum arquivo enviado',
        mensagem: 'Envie pelo menos uma imagem'
      });
    }

    const processados = [];
    const erros = [];

    // processar cada arquivo em paralelo
    await Promise.all(
      req.files.map(async (file) => {
        try {
          const entrada = file.path;
          const nomeBase = path.parse(file.originalname).name;
          const nomeSaida = `${file.filename}-convertida.webp`;
          const saida = path.join(TMP, nomeSaida);

          // obter tamanho original
          const statsOriginal = fs.statSync(entrada);
          const tamanhoOriginal = statsOriginal.size;

          // converter para WebP
          await sharp(entrada)
            .webp({ quality: 80 })
            .toFile(saida);

          // obter tamanho final
          const statsConvertido = fs.statSync(saida);
          const tamanhoConvertido = statsConvertido.size;
          const reducao = ((tamanhoOriginal - tamanhoConvertido) / tamanhoOriginal * 100).toFixed(2);

          processados.push({
            nomeOriginal: `${nomeBase}.webp`,
            caminho: saida,
            tamanhoOriginal,
            tamanhoFinal: tamanhoConvertido,
            reducao
          });

          // limpar arquivo original
          limparArquivos(entrada);

          console.log(`✓ Conversão WebP: ${nomeBase} (${reducao}% redução)`);
        } catch (err) {
          erros.push({
            arquivo: file.originalname,
            erro: err.message
          });
          limparArquivos(file.path);
        }
      })
    );

    // se nenhum arquivo foi processado
    if (processados.length === 0) {
      return res.status(400).json({
        erro: 'Falha ao processar alguns arquivos',
        total: req.files.length,
        sucesso: 0,
        detalhes: erros
      });
    }

    // ✅ NOVO: Armazenar arquivos em cache global
    const cacheId = `convert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    global.arquivosCache = global.arquivosCache || {};
    global.arquivosCache[cacheId] = {
      arquivos: processados,
      timestamp: Date.now()
    };

    // Limpar cache após 30 minutos
    setTimeout(() => {
      if (global.arquivosCache[cacheId]) {
        global.arquivosCache[cacheId].arquivos.forEach(a => limparArquivos(a.caminho));
        delete global.arquivosCache[cacheId];
        console.log(`[Cache] Limpou ${cacheId}`);
      }
    }, 30 * 60 * 1000);

    // Calcular totais
    const tamanhoOriginalTotal = processados.reduce((acc, a) => acc + a.tamanhoOriginal, 0);
    const tamanhoFinalTotal = processados.reduce((acc, a) => acc + a.tamanhoFinal, 0);
    const reducaoMedia = ((tamanhoOriginalTotal - tamanhoFinalTotal) / tamanhoOriginalTotal * 100).toFixed(2);

    // ✅ Retornar JSON com metadados
    return res.json({
      sucesso: true,
      cacheId,
      total: processados.length,
      tamanhoOriginalTotal,
      tamanhoFinalTotal,
      reducaoMedia: parseFloat(reducaoMedia),
      arquivos: processados.map(a => ({
        nomeProcessado: a.nomeOriginal,
        tamanhoOriginal: a.tamanhoOriginal,
        tamanhoFinal: a.tamanhoFinal,
        reducao: parseFloat(a.reducao)
      }))
    });

  } catch (err) {
    next(err);
  }
};

/**
 * Comprimir imagem mantendo o mesmo formato
 * POST /api/imagem/comprimir
 * Requer: arquivos (multipart/form-data)
 */
exports.comprimirImagem = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        erro: 'Nenhum arquivo enviado',
        mensagem: 'Envie pelo menos uma imagem'
      });
    }

    const processados = [];
    const erros = [];

    // processar cada arquivo em paralelo
    await Promise.all(
      req.files.map(async (file) => {
        try {
          const entrada = file.path;
          const extensao = path.extname(file.originalname).toLowerCase();
          const nomeBase = path.parse(file.originalname).name;
          const nomeSaida = `${file.filename}-comprimida${extensao}`;
          const saida = path.join(TMP, nomeSaida);

          // obter tamanho original
          const statsOriginal = fs.statSync(entrada);
          const tamanhoOriginal = statsOriginal.size;

          // aplicar compressão conforme o tipo de arquivo
          let pipeline = sharp(entrada);

          if (extensao === '.jpg' || extensao === '.jpeg') {
            await pipeline.jpeg({ quality: 65, progressive: true, mozjpeg: true }).toFile(saida);
          } else if (extensao === '.png') {
            await pipeline.png({ compressionLevel: 9, adaptiveFiltering: true }).toFile(saida);
          } else if (extensao === '.webp') {
            await pipeline.webp({ quality: 70 }).toFile(saida);
          } else if (extensao === '.gif') {
            await pipeline.gif({ effort: 3 }).toFile(saida);
          } else {
            await pipeline.jpeg({ quality: 65, progressive: true, mozjpeg: true }).toFile(saida);
          }

          // obter tamanho final
          const statsComprimido = fs.statSync(saida);
          const tamanhoComprimido = statsComprimido.size;
          const reducao = ((tamanhoOriginal - tamanhoComprimido) / tamanhoOriginal * 100).toFixed(2);

          processados.push({
            nomeOriginal: `${nomeBase}${extensao}`,
            caminho: saida,
            tamanhoOriginal,
            tamanhoFinal: tamanhoComprimido,
            reducao
          });

          // limpar arquivo original
          limparArquivos(entrada);

          const direcao = reducao >= 0 ? '↓' : '↑';
          console.log(`✓ Compressão: ${nomeBase}${extensao} (${direcao} ${Math.abs(reducao)}%)`);
        } catch (err) {
          erros.push({
            arquivo: file.originalname,
            erro: err.message
          });
          limparArquivos(file.path);
        }
      })
    );

    // se nenhum arquivo foi processado
    if (processados.length === 0) {
      return res.status(400).json({
        erro: 'Falha ao processar alguns arquivos',
        total: req.files.length,
        sucesso: 0,
        detalhes: erros
      });
    }

    // ✅ NOVO: Armazenar arquivos em cache global
    const cacheId = `compress-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    global.arquivosCache = global.arquivosCache || {};
    global.arquivosCache[cacheId] = {
      arquivos: processados,
      timestamp: Date.now()
    };

    // Limpar cache após 30 minutos
    setTimeout(() => {
      if (global.arquivosCache[cacheId]) {
        global.arquivosCache[cacheId].arquivos.forEach(a => limparArquivos(a.caminho));
        delete global.arquivosCache[cacheId];
        console.log(`[Cache] Limpou ${cacheId}`);
      }
    }, 30 * 60 * 1000);

    // Calcular totais
    const tamanhoOriginalTotal = processados.reduce((acc, a) => acc + a.tamanhoOriginal, 0);
    const tamanhoFinalTotal = processados.reduce((acc, a) => acc + a.tamanhoFinal, 0);
    const reducaoMedia = ((tamanhoOriginalTotal - tamanhoFinalTotal) / tamanhoOriginalTotal * 100).toFixed(2);

    // ✅ Retornar JSON com metadados
    return res.json({
      sucesso: true,
      cacheId,
      total: processados.length,
      tamanhoOriginalTotal,
      tamanhoFinalTotal,
      reducaoMedia: parseFloat(reducaoMedia),
      arquivos: processados.map(a => ({
        nomeProcessado: a.nomeOriginal,
        tamanhoOriginal: a.tamanhoOriginal,
        tamanhoFinal: a.tamanhoFinal,
        reducao: parseFloat(a.reducao)
      }))
    });

  } catch (err) {
    next(err);
  }
};

/**
 * Baixar arquivo individual processado do cache
 * GET /api/imagem/download/:cacheId/:index
 */
exports.baixarArquivoProcessado = (req, res, next) => {
  try {
    const { cacheId, index } = req.params;

    // Validar parâmetros
    if (!cacheId || index === undefined) {
      return res.status(400).json({
        sucesso: false,
        erro: 'cacheId e index são obrigatórios'
      });
    }

    // Buscar no cache
    const cacheItem = global.arquivosCache?.[cacheId];
    if (!cacheItem) {
      return res.status(404).json({
        sucesso: false,
        erro: 'Cache expirado ou inválido. Processe as imagens novamente.'
      });
    }

    const arquivo = cacheItem.arquivos[parseInt(index)];
    if (!arquivo) {
      return res.status(404).json({
        sucesso: false,
        erro: 'Arquivo não encontrado no cache'
      });
    }

    // Enviar arquivo
    res.download(arquivo.caminho, arquivo.nomeOriginal, (err) => {
      if (err && err.code !== 'ERR_HTTP_HEADERS_SENT') {
        console.error(`Erro ao baixar: ${err.message}`);
      }
    });

  } catch (err) {
    next(err);
  }
};

/**
 * Baixar todos os arquivos processados em ZIP
 * GET /api/imagem/download-zip/:cacheId
 */
exports.baixarZipCompleto = (req, res, next) => {
  try {
    const { cacheId } = req.params;

    // Validar parâmetro
    if (!cacheId) {
      return res.status(400).json({
        sucesso: false,
        erro: 'cacheId é obrigatório'
      });
    }

    // Buscar no cache
    const cacheItem = global.arquivosCache?.[cacheId];
    if (!cacheItem) {
      return res.status(404).json({
        sucesso: false,
        erro: 'Cache expirado ou inválido. Processe as imagens novamente.'
      });
    }

    // Criar ZIP em memória
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });

    // Definir headers
    res.setHeader('Content-Disposition', `attachment; filename="imagens-${Date.now()}.zip"`);
    res.setHeader('Content-Type', 'application/zip');

    // Pipar arquivo para resposta
    archive.pipe(res);

    // Adicionar cada arquivo ao ZIP
    cacheItem.arquivos.forEach((arquivo) => {
      archive.file(arquivo.caminho, { name: arquivo.nomeOriginal });
    });

    // Finalizar ZIP
    archive.finalize();

    // Tratar erros
    archive.on('error', (err) => {
      console.error('Erro ao criar ZIP:', err);
      if (!res.headersSent) {
        res.status(500).json({
          sucesso: false,
          erro: 'Erro ao criar arquivo ZIP'
        });
      }
    });

  } catch (err) {
    next(err);
  }
};
