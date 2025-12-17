/**
 * Validadores de entrada
 * Funções para validar dados do usuário
 */

const { UPLOAD } = require('../config/constantes');

class Validadores {
  /**
   * Validar tipo MIME
   * @param {string} mimeType
   * @returns {boolean}
   */
  static tipoMimeValido(mimeType) {
    return UPLOAD.MIME_TYPES.includes(mimeType);
  }

  /**
   * Validar tamanho do arquivo
   * @param {number} tamanho
   * @returns {boolean}
   */
  static tamanhoValido(tamanho) {
    return tamanho <= UPLOAD.MAX_FILE_SIZE;
  }

  /**
   * Validar extensão
   * @param {string} nomeArquivo
   * @returns {boolean}
   */
  static extensaoValida(nomeArquivo) {
    const ext = nomeArquivo.substring(nomeArquivo.lastIndexOf('.')).toLowerCase();
    return UPLOAD.ALLOWED_EXTENSIONS.includes(ext);
  }

  /**
   * Validar arquivo completo
   * @param {Object} arquivo
   * @returns {Object} { valido: boolean, erro: string|null }
   */
  static validarArquivo(arquivo) {
    if (!this.tipoMimeValido(arquivo.mimetype)) {
      return {
        valido: false,
        erro: 'Tipo de arquivo não suportado',
      };
    }

    if (!this.tamanhoValido(arquivo.size)) {
      return {
        valido: false,
        erro: 'Arquivo muito grande (máx 20MB)',
      };
    }

    if (!this.extensaoValida(arquivo.originalname)) {
      return {
        valido: false,
        erro: 'Extensão de arquivo não permitida',
      };
    }

    return { valido: true, erro: null };
  }
}

module.exports = Validadores;
