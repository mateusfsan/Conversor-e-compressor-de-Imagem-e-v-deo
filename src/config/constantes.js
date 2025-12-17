/**
 * Constantes globais da aplicação
 * Centraliza todos os valores mágicos
 */

module.exports = {
  // Upload
  UPLOAD: {
    MAX_FILE_SIZE: 20 * 1024 * 1024, // 20 MB
    MAX_FILES: 50,
    MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
  },

  // Processamento
  PROCESSAMENTO: {
    QUALIDADE_WEBP: 80,
    QUALIDADE_JPEG: 65,
    COMPRESSION_PNG: 9,
    EFFORT_GIF: 3,
  },

  // Cache
  CACHE: {
    LIFETIME: 30 * 60 * 1000, // 30 minutos
    CLEANUP_INTERVAL: 5 * 60 * 1000, // 5 minutos
  },

  // Mensagens de erro
  ERROS: {
    ARQUIVO_INVALIDO: 'Por favor, selecione um arquivo de imagem válido.',
    ARQUIVO_GRANDE: 'Arquivo muito grande. Tamanho máximo: 20 MB',
    SEM_ARQUIVO: 'Nenhum arquivo selecionado.',
    TIPO_INVALIDO: 'Tipo de arquivo não suportado.',
    PROCESSAMENTO_FALHOU: 'Erro ao processar arquivo. Tente novamente.',
    CACHE_EXPIRADO: 'Sessão expirada. Processe os arquivos novamente.',
  },

  // Tipos de processamento
  TIPOS_PROCESSAMENTO: {
    CONVERTER: 'converter',
    COMPRIMIR: 'comprimir',
  },

  // API Endpoints
  ENDPOINTS: {
    CONVERTER: '/api/imagem/converter',
    COMPRIMIR: '/api/imagem/comprimir',
    DOWNLOAD: '/api/imagem/download/:cacheId/:index',
    DOWNLOAD_ZIP: '/api/imagem/download-zip/:cacheId',
  },

  // Server
  SERVER: {
    PORT: process.env.PORT || 3000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    TMP_DIR: process.env.TMP_DIR || './tmp',
  },

  // Logging
  LOG: {
    LEVELS: {
      ERROR: 'error',
      WARN: 'warn',
      INFO: 'info',
      DEBUG: 'debug',
    },
  },
};
