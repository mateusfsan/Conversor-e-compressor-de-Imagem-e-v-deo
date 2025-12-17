/**
 * Variáveis de ambiente
 * Centraliza configuração do projeto
 */

require('dotenv').config();

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 3000,
  TMP_DIR: process.env.TMP_DIR || './tmp',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};
