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
 * Converter imagem para WebP
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

    // se apenas 1 arquivo processado com sucesso, retornar direto
    if (processados.length === 1 && erros.length === 0) {
      const arquivo = processados[0];
      return res.download(arquivo.caminho, arquivo.nomeOriginal, (err) => {
        limparArquivos(arquivo.caminho);
        if (err && err.code !== 'ERR_HTTP_HEADERS_SENT') {
          console.error('Erro ao enviar arquivo:', err.message);
        }
      });
    }

    // se múltiplos arquivos, criar ZIP
    if (processados.length > 1) {
      const nomeZip = `imagens-convertidas-${Date.now()}.zip`;
      const caminhoZip = path.join(TMP, nomeZip);
      const output = fs.createWriteStream(caminhoZip);
      const archive = archiver('zip', { zlib: { level: 9 } });

      archive.pipe(output);

      processados.forEach(arquivo => {
        archive.file(arquivo.caminho, { name: arquivo.nomeOriginal });
      });

      await archive.finalize();

      return new Promise((resolve, reject) => {
        output.on('close', () => {
          res.download(caminhoZip, nomeZip, (err) => {
            processados.forEach(a => limparArquivos(a.caminho));
            limparArquivos(caminhoZip);
            if (err && err.code !== 'ERR_HTTP_HEADERS_SENT') {
              console.error('Erro ao enviar ZIP:', err.message);
            }
          });
          resolve();
        });

        output.on('error', reject);
        archive.on('error', reject);
      });
    }

    // se houver apenas erros
    if (erros.length > 0) {
      return res.status(400).json({
        erro: 'Falha ao processar alguns arquivos',
        total: req.files.length,
        sucesso: processados.length,
        detalhes: erros
      });
    }

    res.status(400).json({
      erro: 'Nenhum arquivo foi processado com sucesso'
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

    // se apenas 1 arquivo processado com sucesso, retornar direto
    if (processados.length === 1 && erros.length === 0) {
      const arquivo = processados[0];
      return res.download(arquivo.caminho, arquivo.nomeOriginal, (err) => {
        limparArquivos(arquivo.caminho);
        if (err && err.code !== 'ERR_HTTP_HEADERS_SENT') {
          console.error('Erro ao enviar arquivo:', err.message);
        }
      });
    }

    // se múltiplos arquivos, criar ZIP
    if (processados.length > 1) {
      const nomeZip = `imagens-comprimidas-${Date.now()}.zip`;
      const caminhoZip = path.join(TMP, nomeZip);
      const output = fs.createWriteStream(caminhoZip);
      const archive = archiver('zip', { zlib: { level: 9 } });

      archive.pipe(output);

      processados.forEach(arquivo => {
        archive.file(arquivo.caminho, { name: arquivo.nomeOriginal });
      });

      await archive.finalize();

      return new Promise((resolve, reject) => {
        output.on('close', () => {
          res.download(caminhoZip, nomeZip, (err) => {
            processados.forEach(a => limparArquivos(a.caminho));
            limparArquivos(caminhoZip);
            if (err && err.code !== 'ERR_HTTP_HEADERS_SENT') {
              console.error('Erro ao enviar ZIP:', err.message);
            }
          });
          resolve();
        });

        output.on('error', reject);
        archive.on('error', reject);
      });
    }

    // se houver apenas erros
    if (erros.length > 0) {
      return res.status(400).json({
        erro: 'Falha ao processar alguns arquivos',
        total: req.files.length,
        sucesso: processados.length,
        detalhes: erros
      });
    }

    res.status(400).json({
      erro: 'Nenhum arquivo foi processado com sucesso'
    });

  } catch (err) {
    next(err);
  }
};
