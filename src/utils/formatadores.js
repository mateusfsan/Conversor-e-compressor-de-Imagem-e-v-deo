/**
 * Formatadores de dados
 * Funções para formatar dados para exibição
 */

class Formatadores {
  /**
   * Converter bytes para MB
   * @param {number} bytes
   * @returns {string}
   */
  static paraMB(bytes) {
    return (bytes / 1024 / 1024).toFixed(2);
  }

  /**
   * Converter bytes para KB
   * @param {number} bytes
   * @returns {string}
   */
  static paraKB(bytes) {
    return (bytes / 1024).toFixed(2);
  }

  /**
   * Formatar tamanho de arquivo de forma legível
   * @param {number} bytes
   * @returns {string}
   */
  static tamanhoLegivel(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return this.paraKB(bytes) + ' KB';
    return this.paraMB(bytes) + ' MB';
  }

  /**
   * Formatar percentual
   * @param {number} valor
   * @param {number} casasDecimais
   * @returns {string}
   */
  static percentual(valor, casasDecimais = 2) {
    return valor.toFixed(casasDecimais) + '%';
  }

  /**
   * Formatar data ISO para formato local
   * @param {string} dataISO
   * @returns {string}
   */
  static data(dataISO) {
    return new Date(dataISO).toLocaleString('pt-BR');
  }
}

module.exports = Formatadores;
