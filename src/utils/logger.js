/**
 * Sistema de logging estruturado
 * Substitui console.log por logging profissional
 */

const fs = require('fs');
const path = require('path');
const { LOG_LEVEL } = require('../config/variaveisAmbiente');

class Logger {
  constructor() {
    this.nivel = LOG_LEVEL;
    this.logDir = path.join(__dirname, '../../logs');
    this.garantirDiretorio();
  }

  garantirDiretorio() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  obterTimestamp() {
    return new Date().toISOString();
  }

  escreverLog(nivel, mensagem, dados = {}) {
    const log = {
      timestamp: this.obterTimestamp(),
      nivel,
      mensagem,
      ...dados,
    };

    const jsonString = JSON.stringify(log);
    console.log(jsonString);

    // Escrever em arquivo (apenas em produção)
    if (process.env.NODE_ENV === 'production') {
      const arquivo = path.join(this.logDir, `${nivel}.log`);
      fs.appendFileSync(arquivo, jsonString + '\n');
    }
  }

  erro(mensagem, dados = {}) {
    this.escreverLog('ERROR', mensagem, dados);
  }

  aviso(mensagem, dados = {}) {
    this.escreverLog('WARN', mensagem, dados);
  }

  info(mensagem, dados = {}) {
    this.escreverLog('INFO', mensagem, dados);
  }

  debug(mensagem, dados = {}) {
    if (this.nivel === 'debug') {
      this.escreverLog('DEBUG', mensagem, dados);
    }
  }
}

module.exports = new Logger();
