const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const multer = require('multer');

const TMP = process.env.TMP_DIR || path.join(__dirname, '..', '..', 'tmp');

// garantir que o diretório temporário existe
try { fs.mkdirSync(TMP, { recursive: true }); } catch (e) {}

// configurar multer para upload de arquivos
const upload = multer({
  dest: TMP,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (req, file, cb) => {
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!tiposPermitidos.includes(file.mimetype)) {
      return cb(new Error('Apenas arquivos de imagem são permitidos (JPEG, PNG, WebP, GIF)'));
    }
    cb(null, true);
  }
});

exports.uploadMiddleware = upload.single('arquivo');

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
 * Requer: arquivo (multipart/form-data)
 */
exports.converterParaWebp = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        erro: 'Arquivo não enviado',
        mensagem: 'Envie uma imagem usando o campo "arquivo"'
      });
    }

    const entrada = req.file.path;
    const nomeBase = path.parse(req.file.originalname).name;
    const nomeSaida = `${req.file.filename}-convertida.webp`;
    const saida = path.join(TMP, nomeSaida);

    // obter informações do arquivo original
    const statsOriginal = fs.statSync(entrada);
    const tamanhoOriginal = statsOriginal.size;

    // converter para WebP com qualidade otimizada
    await sharp(entrada)
      .webp({ quality: 80 })
      .toFile(saida);

    // obter tamanho do arquivo convertido
    const statsConvertido = fs.statSync(saida);
    const tamanhoConvertido = statsConvertido.size;

    // calcular percentual de redução
    const percentualReducao = ((1 - tamanhoConvertido / tamanhoOriginal) * 100).toFixed(2);

    // enviar arquivo e limpar
    const nomeDownload = `${nomeBase}.webp`;
    res.download(saida, nomeDownload, (err) => {
      limparArquivos(entrada, saida);
      if (err && err.code !== 'ERR_HTTP_HEADERS_SENT') {
        console.error('Erro ao enviar arquivo:', err.message);
      }
    });

    // log de sucesso
    console.log(`✓ Conversão WebP: ${nomeBase} (${(tamanhoOriginal / 1024 / 1024).toFixed(2)}MB → ${(tamanhoConvertido / 1024 / 1024).toFixed(2)}MB, redução: ${percentualReducao}%)`);

  } catch (err) {
    if (req.file) {
      limparArquivos(req.file.path);
    }
    next(err);
  }
};

/**
 * Comprimir imagem mantendo o mesmo formato
 * POST /api/imagem/comprimir
 * Requer: arquivo (multipart/form-data)
 */
exports.comprimirImagem = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        erro: 'Arquivo não enviado',
        mensagem: 'Envie uma imagem usando o campo "arquivo"'
      });
    }

    const entrada = req.file.path;
    const extensao = path.extname(req.file.originalname).toLowerCase();
    const nomeBase = path.parse(req.file.originalname).name;
    const nomeSaida = `${req.file.filename}-comprimida${extensao}`;
    const saida = path.join(TMP, nomeSaida);

    // obter informações do arquivo original
    const statsOriginal = fs.statSync(entrada);
    const tamanhoOriginal = statsOriginal.size;

    // aplicar compressão conforme o tipo de arquivo
    let pipeline = sharp(entrada);

    if (extensao === '.jpg' || extensao === '.jpeg') {
      // JPEG: reduzir qualidade progressivamente para obter melhor compressão
      await pipeline.jpeg({ quality: 65, progressive: true, mozjpeg: true }).toFile(saida);
    } else if (extensao === '.png') {
      // PNG: usar estratégia de compressão otimizada
      await pipeline
        .png({ compressionLevel: 9, adaptiveFiltering: true })
        .toFile(saida);
    } else if (extensao === '.webp') {
      // WebP: melhor qualidade vs tamanho
      await pipeline.webp({ quality: 70 }).toFile(saida);
    } else if (extensao === '.gif') {
      // GIF: manter como é (Sharp não otimiza bem GIF)
      await pipeline.gif().toFile(saida);
    } else {
      // fallback: converter para JPEG comprimido
      await pipeline.jpeg({ quality: 65, progressive: true, mozjpeg: true }).toFile(saida);
    }

    // obter tamanho do arquivo comprimido
    const statsComprimido = fs.statSync(saida);
    const tamanhoComprimido = statsComprimido.size;

    // calcular percentual de redução (pode ser negativo se aumentou)
    const diferenca = tamanhoOriginal - tamanhoComprimido;
    const percentualReducao = ((diferenca / tamanhoOriginal) * 100).toFixed(2);

    // enviar arquivo e limpar
    const nomeDownload = `${nomeBase}${extensao}`;
    res.download(saida, nomeDownload, (err) => {
      limparArquivos(entrada, saida);
      if (err && err.code !== 'ERR_HTTP_HEADERS_SENT') {
        console.error('Erro ao enviar arquivo:', err.message);
      }
    });

    // log de sucesso
    const direcao = percentualReducao >= 0 ? '↓' : '↑';
    console.log(`✓ Compressão: ${nomeBase}${extensao} (${(tamanhoOriginal / 1024 / 1024).toFixed(2)}MB → ${(tamanhoComprimido / 1024 / 1024).toFixed(2)}MB, ${direcao} ${Math.abs(percentualReducao)}%)`);

  } catch (err) {
    if (req.file) {
      limparArquivos(req.file.path);
    }
    next(err);
  }
};
