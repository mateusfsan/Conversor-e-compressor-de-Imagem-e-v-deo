/**
 * Serviço de processamento de imagens
 * Responsável pela lógica de conversão e compressão
 * Princípio: Single Responsibility
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const archiver = require('archiver');
const { PROCESSAMENTO } = require('../config/constantes');
const logger = require('../utils/logger');

class ProcessadorImagens {
  /**
   * Converter imagem para WebP
   * @param {string} caminhoEntrada
   * @param {string} caminhoSaida
   * @returns {Promise<Object>}
   */
  static async converterParaWebp(caminhoEntrada, caminhoSaida) {
    try {
      await sharp(caminhoEntrada)
        .webp({ quality: PROCESSAMENTO.QUALIDADE_WEBP })
        .toFile(caminhoSaida);

      return this.calcularResultado(
        caminhoEntrada,
        caminhoSaida,
        'converter'
      );
    } catch (erro) {
      logger.erro('Erro ao converter para WebP', {
        arquivo: caminhoEntrada,
        erro: erro.message,
      });
      throw erro;
    }
  }

  /**
   * Comprimir imagem mantendo formato
   * @param {string} caminhoEntrada
   * @param {string} caminhoSaida
   * @returns {Promise<Object>}
   */
  static async comprimirImagem(caminhoEntrada, caminhoSaida) {
    try {
      const extensao = path.extname(caminhoEntrada).toLowerCase();

      const pipeline = sharp(caminhoEntrada);

      switch (extensao) {
        case '.jpg':
        case '.jpeg':
          await pipeline
            .jpeg({
              quality: PROCESSAMENTO.QUALIDADE_JPEG,
              mozjpeg: true,
            })
            .toFile(caminhoSaida);
          break;

        case '.png':
          await pipeline
            .png({
              compressionLevel: PROCESSAMENTO.COMPRESSION_PNG,
              adaptiveFiltering: true,
            })
            .toFile(caminhoSaida);
          break;

        case '.webp':
          await pipeline
            .webp({ quality: 70 })
            .toFile(caminhoSaida);
          break;

        case '.gif':
          await pipeline
            .gif({ effort: PROCESSAMENTO.EFFORT_GIF })
            .toFile(caminhoSaida);
          break;

        default:
          await pipeline
            .jpeg({
              quality: PROCESSAMENTO.QUALIDADE_JPEG,
              mozjpeg: true,
            })
            .toFile(caminhoSaida);
      }

      return this.calcularResultado(
        caminhoEntrada,
        caminhoSaida,
        'comprimir'
      );
    } catch (erro) {
      logger.erro('Erro ao comprimir imagem', {
        arquivo: caminhoEntrada,
        erro: erro.message,
      });
      throw erro;
    }
  }

  /**
   * Calcular resultado do processamento
   * @param {string} caminhoEntrada
   * @param {string} caminhoSaida
   * @param {string} tipo
   * @returns {Object}
   * @private
   */
  static calcularResultado(caminhoEntrada, caminhoSaida, tipo) {
    const tamanhoOriginal = fs.statSync(caminhoEntrada).size;
    const tamanhoFinal = fs.statSync(caminhoSaida).size;
    const reducao =
      ((tamanhoOriginal - tamanhoFinal) / tamanhoOriginal) * 100;

    return {
      tamanhoOriginal,
      tamanhoFinal,
      reducao: reducao.toFixed(2),
      economia: (tamanhoOriginal - tamanhoFinal).toFixed(0),
    };
  }

  /**
   * Criar ZIP com múltiplos arquivos
   * @param {string[]} caminhos
   * @param {string} caminhoSaida
   * @returns {Promise<void>}
   */
  static async criarZip(caminhos, caminhoSaida) {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(caminhoSaida);
      const archive = archiver('zip', { zlib: { level: 9 } });

      archive.pipe(output);

      caminhos.forEach((caminho) => {
        const nome = path.basename(caminho);
        archive.file(caminho, { name: nome });
      });

      archive.finalize();

      output.on('close', () => {
        logger.info('ZIP criado com sucesso', {
          arquivos: caminhos.length,
          tamanho: archive.pointer(),
        });
        resolve();
      });

      archive.on('error', (erro) => {
        logger.erro('Erro ao criar ZIP', { erro: erro.message });
        reject(erro);
      });
    });
  }
}

module.exports = ProcessadorImagens;
