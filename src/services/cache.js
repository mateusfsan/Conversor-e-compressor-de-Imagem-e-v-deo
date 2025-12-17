/**
 * Sistema de cache com expiração automática
 * Substitui o cache global problemático
 */

const { CACHE } = require('../config/constantes');
const logger = require('../utils/logger');

class CacheArquivos {
  constructor() {
    this.cache = new Map();
    this.timeouts = new Map();
    this.iniciarLimpezaAutomatica();
  }

  /**
   * Armazenar arquivos processados no cache
   * @param {string} cacheId
   * @param {Object} dados
   */
  armazenar(cacheId, dados) {
    this.cache.set(cacheId, dados);

    // Definir expiração
    const timeout = setTimeout(() => {
      this.remover(cacheId);
      logger.info('Cache expirado', { cacheId });
    }, CACHE.LIFETIME);

    this.timeouts.set(cacheId, timeout);

    logger.debug('Arquivo armazenado em cache', {
      cacheId,
      quantidade: dados.arquivos.length,
    });
  }

  /**
   * Obter arquivos do cache
   * @param {string} cacheId
   * @returns {Object|null}
   */
  obter(cacheId) {
    return this.cache.get(cacheId) || null;
  }

  /**
   * Remover cache específico
   * @param {string} cacheId
   */
  remover(cacheId) {
    if (this.timeouts.has(cacheId)) {
      clearTimeout(this.timeouts.get(cacheId));
      this.timeouts.delete(cacheId);
    }

    this.cache.delete(cacheId);
  }

  /**
   * Limpeza automática de cache expirado
   * @private
   */
  iniciarLimpezaAutomatica() {
    setInterval(() => {
      const agora = Date.now();
      let removidos = 0;

      this.cache.forEach((valor, chave) => {
        if (agora - valor.timestamp > CACHE.LIFETIME) {
          this.remover(chave);
          removidos++;
        }
      });

      if (removidos > 0) {
        logger.debug(
          `Limpeza automática: ${removidos} cache(s) removido(s)`
        );
      }
    }, CACHE.CLEANUP_INTERVAL);
  }

  /**
   * Limpar todo o cache (para testes)
   */
  limparTudo() {
    this.timeouts.forEach((timeout) => clearTimeout(timeout));
    this.cache.clear();
    this.timeouts.clear();
  }
}

module.exports = new CacheArquivos();
