/**
 * Compressor de Imagens - Frontend Application
 * 
 * Responsabilidade: Gerenciar upload, processamento e download de imagens
 * Segue padrões: Single Responsibility Principle, DRY, SOLID
 * 
 * @class CompressorImagens
 */
class CompressorImagens {
  // ==================== CONSTANTES ====================
  static MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
  static ENDPOINTS = {
    CONVERT: '/api/imagem/convert',
    COMPRESS: '/api/imagem/comprimir'
  };
  static TIPOS = {
    CONVERT: 'convert',
    COMPRESS: 'compress'
  };
  static MENSAGENS = {
    ARQUIVO_INVALIDO: 'Por favor, selecione um arquivo de imagem válido.',
    ARQUIVO_GRANDE: 'Arquivo muito grande. Tamanho máximo: 20 MB',
    SEM_ARQUIVO: 'Nenhum arquivo selecionado.',
    ERRO_PADRAO: 'Erro ao processar arquivo'
  };

  // ==================== INICIALIZAÇÃO ====================
  constructor() {
    this.arquivosSelecionados = [];
    this.arquivosProcessados = null; // Objeto com dados do processamento
    this.tipoProcessamento = null;
    this.intervaloProgresso = null;

    this.init();
  }

  init() {
    this.cacheElementos();
    this.vincularEventos();
  }

  /**
   * Cache de elementos DOM para melhor performance
   * @private
   */
  cacheElementos() {
    // Upload e seleção
    this.dropZone = this.obterElemento('dropZone');
    this.fileInput = this.obterElemento('fileInput');

    // Botões de ação
    this.converterBtn = this.obterElemento('converterBtn');
    this.comprimirBtn = this.obterElemento('comprimirBtn');
    this.downloadBtn = this.obterElemento('downloadBtn');
    this.novoBtn = this.obterElemento('novoBtn');

    // Progress
    this.progressContainer = this.obterElemento('progressContainer');
    this.progressBar = this.obterElemento('progressBar');
    this.progressPercent = this.obterElemento('progressPercent');
    this.progressText = this.obterElemento('progressText');

    // Seções
    this.resultsSection = this.obterElemento('resultsSection');
    this.arquivosSelecionadosSection = this.obterElemento('arquivosSelecionadosSection');

    // Listas
    this.listaArquivosSelecionados = this.obterElemento('listaArquivosSelecionados');
    this.listaArquivosProcessados = this.obterElemento('listaArquivosProcessados');

    // Sidebar
    this.nomeArquivo = this.obterElemento('nomeArquivo');
    this.tamanhoOriginal = this.obterElemento('tamanhoOriginal');
    this.tamanhoFinal = this.obterElemento('tamanhoFinal');
    this.percentualReducao = this.obterElemento('percentualReducao');
    this.statusText = this.obterElemento('statusText');
  }

  /**
   * Obter elemento DOM com tratamento de erro
   * @param {string} id
   * @returns {HTMLElement}
   * @private
   */
  obterElemento(id) {
    const elemento = document.getElementById(id);
    if (!elemento) {
      console.warn(`Elemento com ID '${id}' não encontrado`);
    }
    return elemento;
  }

  /**
   * Vincular eventos aos elementos
   * @private
   */
  vincularEventos() {
    // Drop zone
    this.dropZone?.addEventListener('click', () => this.fileInput.click());
    this.dropZone?.addEventListener('dragover', (e) => this.handleDragOver(e));
    this.dropZone?.addEventListener('dragleave', (e) => this.handleDragLeave(e));
    this.dropZone?.addEventListener('drop', (e) => this.handleDrop(e));

    // File input
    this.fileInput?.addEventListener('change', (e) => this.handleFileSelect(e));

    // Botões de ação
    this.converterBtn?.addEventListener('click', () => this.processarArquivo(CompressorImagens.TIPOS.CONVERT));
    this.comprimirBtn?.addEventListener('click', () => this.processarArquivo(CompressorImagens.TIPOS.COMPRESS));
    this.downloadBtn?.addEventListener('click', () => this.downloadArquivo());
    this.novoBtn?.addEventListener('click', () => this.resetar());
  }

  // ==================== HANDLERS: DRAG & DROP ====================

  /**
   * Manipular evento dragover
   * @param {DragEvent} event
   * @private
   */
  handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    this.dropZone.classList.add('bg-blue-50');
  }

  /**
   * Manipular evento dragleave
   * @param {DragEvent} event
   * @private
   */
  handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    this.dropZone.classList.remove('bg-blue-50');
  }

  /**
   * Manipular evento drop
   * @param {DragEvent} event
   * @private
   */
  handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    this.dropZone.classList.remove('bg-blue-50');
    this.processarArquivosDoEvento(event.dataTransfer.files);
  }

  /**
   * Manipular evento change do input de arquivo
   * @param {Event} event
   * @private
   */
  handleFileSelect(event) {
    this.processarArquivosDoEvento(event.target.files);
  }

  /**
   * Processar arquivos de qualquer fonte (drop ou input)
   * @param {FileList} arquivos
   * @private
   */
  processarArquivosDoEvento(arquivos) {
    if (!arquivos || arquivos.length === 0) return;

    Array.from(arquivos).forEach(arquivo => this.selecionarArquivo(arquivo));
  }

  // ==================== SELEÇÃO E VALIDAÇÃO ====================

  /**
   * Selecionar arquivo
   * @param {File} arquivo
   * @private
   */
  selecionarArquivo(arquivo) {
    // Validar arquivo
    if (!this.validarArquivo(arquivo)) {
      return;
    }

    // Adicionar à lista
    this.arquivosSelecionados.push(arquivo);

    // Atualizar UI
    this.atualizarUISelecionados();
    this.mostrarSecaoSelecionados();
  }

  /**
   * Validar arquivo
   * @param {File} arquivo
   * @returns {boolean}
   * @private
   */
  validarArquivo(arquivo) {
    if (!arquivo.type.startsWith('image/')) {
      this.mostrarErro(CompressorImagens.MENSAGENS.ARQUIVO_INVALIDO);
      return false;
    }

    if (arquivo.size > CompressorImagens.MAX_FILE_SIZE) {
      this.mostrarErro(CompressorImagens.MENSAGENS.ARQUIVO_GRANDE);
      return false;
    }

    return true;
  }

  /**
   * Remover arquivo selecionado
   * @param {number} index
   */
  removerArquivoSelecionado(index) {
    this.arquivosSelecionados.splice(index, 1);

    if (this.arquivosSelecionados.length === 0) {
      this.limparSelecionados();
    } else {
      this.atualizarUISelecionados();
    }
  }

  /**
   * Atualizar UI de arquivos selecionados
   * @private
   */
  atualizarUISelecionados() {
    const quantidade = this.arquivosSelecionados.length;
    const tamanhoTotal = this.calcularTamanhoTotal(this.arquivosSelecionados);

    this.nomeArquivo.textContent = `${quantidade} arquivo(s) selecionado(s)`;
    this.tamanhoOriginal.textContent = `Total: ${this.formatarTamanhMB(tamanhoTotal)} MB`;
    this.statusText.textContent = `✓ ${quantidade} arquivo(s) selecionado(s) e prontos para processar`;

    this.atualizarListaArquivosSelecionados();
    this.habilitarBotoesAcao(true);
    this.resultsSection.classList.add('hidden');
  }

  /**
   * Mostrar seção de arquivos selecionados
   * @private
   */
  mostrarSecaoSelecionados() {
    this.arquivosSelecionadosSection.classList.remove('hidden');
  }

  /**
   * Limpar arquivos selecionados e resetar UI
   * @private
   */
  limparSelecionados() {
    this.arquivosSelecionadosSection.classList.add('hidden');
    this.habilitarBotoesAcao(false);
    this.nomeArquivo.textContent = '-';
    this.tamanhoOriginal.textContent = '-';
    this.statusText.textContent = 'Aguardando arquivo...';
    this.listaArquivosSelecionados.innerHTML = '';
  }

  /**
   * Atualizar visualização da lista de selecionados
   * @private
   */
  atualizarListaArquivosSelecionados() {
    this.listaArquivosSelecionados.innerHTML = '';

    this.arquivosSelecionados.forEach((arquivo, index) => {
      const itemHTML = this.criarItemArquivoSelecionado(arquivo, index);
      this.listaArquivosSelecionados.appendChild(itemHTML);
    });
  }

  /**
   * Criar elemento de item selecionado
   * @param {File} arquivo
   * @param {number} index
   * @returns {HTMLElement}
   * @private
   */
  criarItemArquivoSelecionado(arquivo, index) {
    const item = document.createElement('div');
    item.className = 'p-3 bg-blue-50 rounded-lg flex items-center justify-between hover:bg-blue-100 transition';

    const tamanhoMB = this.formatarTamanhMB(arquivo.size);

    item.innerHTML = `
      <div class="flex items-center gap-3 flex-1">
        <svg class="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4z"></path>
        </svg>
        <div class="flex-1">
          <p class="text-sm font-medium text-gray-800">${arquivo.name}</p>
          <p class="text-xs text-gray-600">${tamanhoMB} MB</p>
        </div>
      </div>
      <button class="text-red-500 hover:text-red-700 text-sm font-medium transition" aria-label="Remover arquivo">
        ✕
      </button>
    `;

    const btnRemover = item.querySelector('button');
    btnRemover.addEventListener('click', () => this.removerArquivoSelecionado(index));

    return item;
  }

  /**
   * Habilitar/desabilitar botões de ação
   * @param {boolean} habilitado
   * @private
   */
  habilitarBotoesAcao(habilitado) {
    this.converterBtn.disabled = !habilitado;
    this.comprimirBtn.disabled = !habilitado;
  }

  // ==================== PROCESSAMENTO ====================

  /**
   * Processar arquivo (converter ou comprimir)
   * @param {string} tipo - 'convert' ou 'compress'
   * @async
   */
  async processarArquivo(tipo) {
    if (this.arquivosSelecionados.length === 0) {
      this.mostrarErro(CompressorImagens.MENSAGENS.SEM_ARQUIVO);
      return;
    }

    this.tipoProcessamento = tipo;

    try {
      await this.executarProcessamento(tipo);
    } catch (erro) {
      this.tratarErroProcessamento(erro);
    }
  }

  /**
   * Executar processamento (lógica principal)
   * @param {string} tipo
   * @async
   * @private
   */
  async executarProcessamento(tipo) {
    const endpoint = tipo === CompressorImagens.TIPOS.CONVERT
      ? CompressorImagens.ENDPOINTS.CONVERT
      : CompressorImagens.ENDPOINTS.COMPRESS;

    const rótulo = this.obterRótuloTipo(tipo);
    const quantidade = this.arquivosSelecionados.length;

    // Desabilitar UI
    this.habilitarBotoesAcao(false);
    this.prepararProgress(rótulo, quantidade);

    // Simular progresso
    this.iniciarSimulacaoProgresso();

    try {
      const formData = this.criarFormData();
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData
      });

      this.finalizarSimulacaoProgresso();

      if (!response.ok) {
        const erro = await response.json();
        throw new Error(erro.mensagem || CompressorImagens.MENSAGENS.ERRO_PADRAO);
      }

      // ✅ Backend retorna JSON com metadados
      const resultado = await response.json();

      if (!resultado.sucesso) {
        throw new Error('Processamento falhou no backend');
      }

      // Armazenar resultado com cacheId
      this.arquivosProcessados = {
        cacheId: resultado.cacheId,
        tamanhoOriginal: resultado.tamanhoOriginalTotal,
        tamanhoFinal: resultado.tamanhoFinalTotal,
        reducao: resultado.reducaoMedia,
        quantidade: resultado.total,
        arquivos: resultado.arquivos
      };

      const direcao = resultado.reducaoMedia >= 0 ? '↓' : '↑';
      this.arquivosProcessados.direcao = direcao;

      const dados = {
        tamanhoOriginal: resultado.tamanhoOriginalTotal,
        tamanhoFinal: resultado.tamanhoFinalTotal,
        reducao: resultado.reducaoMedia,
        direcao,
        quantidade: resultado.total
      };

      this.exibirResultado(rótulo, resultado.total, dados);
    } finally {
      this.habilitarBotoesAcao(true);
      this.progressContainer.classList.add('hidden');
    }
  }

  /**
   * Preparar barra de progresso
   * @param {string} rótulo
   * @param {number} quantidade
   * @private
   */
  prepararProgress(rótulo, quantidade) {
    this.progressContainer.classList.remove('hidden');
    this.progressBar.style.width = '0%';
    this.progressPercent.textContent = '0%';
    this.progressText.textContent = `${rótulo} de ${quantidade} arquivo(s) em andamento...`;
    this.statusText.textContent = `🔄 ${rótulo} de ${quantidade} arquivo(s) em andamento...`;
  }

  /**
   * Iniciar simulação de progresso
   * @private
   */
  iniciarSimulacaoProgresso() {
    this.intervaloProgresso = setInterval(() => {
      const progresso = parseInt(this.progressBar.style.width) || 0;
      if (progresso < 90) {
        const novoProgresso = progresso + Math.random() * 30;
        const valor = Math.min(novoProgresso, 90);
        this.progressBar.style.width = `${valor}%`;
        this.progressPercent.textContent = `${Math.floor(valor)}%`;
      }
    }, 300);
  }

  /**
   * Finalizar simulação de progresso
   * @private
   */
  finalizarSimulacaoProgresso() {
    if (this.intervaloProgresso) {
      clearInterval(this.intervaloProgresso);
      this.intervaloProgresso = null;
    }
    this.progressBar.style.width = '100%';
    this.progressPercent.textContent = '100%';
  }

  /**
   * Criar FormData com múltiplos arquivos
   * @returns {FormData}
   * @private
   */
  criarFormData() {
    const formData = new FormData();
    this.arquivosSelecionados.forEach(arquivo => {
      formData.append('arquivos', arquivo);
    });
    return formData;
  }

  /**
   * Exibir resultado do processamento
   * @param {string} rótulo
   * @param {number} quantidade
   * @param {Object} dados
   * @private
   */
  exibirResultado(rótulo, quantidade, dados) {
    const { tamanhoOriginal, tamanhoFinal, reducao, direcao } = dados;

    // Atualizar sidebar
    this.tamanhoFinal.textContent = `${this.formatarTamanhMB(tamanhoFinal)} MB`;
    this.percentualReducao.textContent = `${direcao} ${Math.abs(reducao)}%`;
    this.statusText.textContent = `✅ ${rótulo} de ${quantidade} arquivo(s) concluída!`;

    // Atualizar resultados
    document.getElementById('resultsTamanhoOriginal').textContent = 
      `${this.formatarTamanhMB(tamanhoOriginal)} MB (${quantidade} arquivo(s))`;
    document.getElementById('resultsTamanhoFinal').textContent = 
      `${this.formatarTamanhMB(tamanhoFinal)} MB`;
    document.getElementById('resultsReducao').textContent = 
      `${direcao} ${Math.abs(reducao)}% de redução`;

    // Exibir lista
    this.renderizarListaResultados(quantidade);

    // Mostrar seção
    this.resultsSection.classList.remove('hidden');
    this.progressText.textContent = `${rótulo} de ${quantidade} arquivo(s) concluída com sucesso!`;

    // Scroll
    setTimeout(() => {
      this.resultsSection.scrollIntoView({ behavior: 'smooth' });
    }, 300);
  }

  /**
   * Tratar erro no processamento
   * @param {Error} erro
   * @private
   */
  tratarErroProcessamento(erro) {
    this.mostrarErro(`${erro.message}`);
    this.statusText.textContent = `❌ Erro ao processar arquivo`;
  }

  // ==================== RENDERIZAÇÃO E DOWNLOAD ====================

  /**
   * Renderizar lista de resultados
   * @param {number} quantidade
   * @private
   */
  renderizarListaResultados(quantidade) {
    this.listaArquivosProcessados.innerHTML = '';

    if (quantidade === 1) {
      this.renderizarResultadoUnicoArquivo();
    } else {
      this.renderizarResultadoMultiplosArquivos();
    }
  }

  /**
   * Renderizar resultado para único arquivo
   * @private
   */
  renderizarResultadoUnicoArquivo() {
    const arquivo = this.arquivosProcessados.arquivos[0];
    const tamanhoKB = this.formatarTamanhMB(arquivo.tamanhoFinal);

    const item = document.createElement('div');
    item.className = 'p-4 bg-green-50 rounded-lg flex items-center justify-between hover:bg-green-100 transition';
    item.innerHTML = `
      <div class="flex items-center gap-3 flex-1">
        <svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4z"></path>
        </svg>
        <div class="flex-1">
          <p class="text-sm font-medium text-gray-800">${arquivo.nomeProcessado}</p>
          <p class="text-xs text-gray-600">${tamanhoKB} MB (${this.arquivosProcessados.direcao} ${Math.abs(arquivo.reducao)}%)</p>
        </div>
      </div>
      <button class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
        Baixar
      </button>
    `;

    const btnBaixar = item.querySelector('button');
    btnBaixar.addEventListener('click', () => this.baixarArquivoIndividual(0));

    this.listaArquivosProcessados.appendChild(item);
  }

  /**
   * Renderizar resultado para múltiplos arquivos
   * @private
   */
  renderizarResultadoMultiplosArquivos() {
    const arquivo = this.arquivosProcessados;
    const quantidade = arquivo.quantidade;

    // Renderizar cada arquivo individualmente
    arquivo.arquivos.forEach((arq, index) => {
      const item = document.createElement('div');
      item.className = 'p-4 bg-green-50 rounded-lg flex items-center justify-between hover:bg-green-100 transition';
      item.innerHTML = `
        <div class="flex items-center gap-3 flex-1">
          <svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4z"></path>
          </svg>
          <div class="flex-1">
            <p class="text-sm font-medium text-gray-800">${arq.nomeProcessado}</p>
            <p class="text-xs text-gray-600">${this.formatarTamanhMB(arq.tamanhoFinal)} MB (${arquivo.direcao} ${Math.abs(arq.reducao)}%)</p>
          </div>
        </div>
        <button class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
          Baixar
        </button>
      `;

      const btnBaixar = item.querySelector('button');
      btnBaixar.addEventListener('click', () => this.baixarArquivoIndividual(index));

      this.listaArquivosProcessados.appendChild(item);
    });

    // Adicionar botão de download ZIP ao final
    const divZip = document.createElement('div');
    divZip.className = 'mt-4 pt-4 border-t border-gray-200';
    divZip.innerHTML = `
      <p class="text-sm text-gray-600 mb-3">Ou baixe todos em um arquivo ZIP:</p>
      <button class="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 5a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V5z"></path>
          <path d="M12 11a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2h-6a2 2 0 01-2-2v-6z"></path>
        </svg>
        Baixar ZIP (${quantidade} arquivo(s))
      </button>
    `;

    const btnZip = divZip.querySelector('button');
    btnZip.addEventListener('click', () => this.baixarZipCompleto());

    this.listaArquivosProcessados.appendChild(divZip);
  }

  /**
   * Baixar arquivo individual usando cacheId e índice
   * @param {number} index
   * @private
   */
  async baixarArquivoIndividual(index) {
    try {
      const { cacheId } = this.arquivosProcessados;
      const arquivo = this.arquivosProcessados.arquivos[index];
      
      const url = `/api/imagem/download/${cacheId}/${index}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Erro ao baixar arquivo: ${response.statusText}`);
      }

      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = arquivo.nomeProcessado;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log(`✓ Arquivo baixado: ${arquivo.nomeProcessado}`);
    } catch (erro) {
      console.error('Erro ao baixar arquivo individual:', erro);
      alert('Erro ao baixar arquivo. Tente novamente.');
    }
  }

  /**
   * Baixar todos os arquivos em ZIP
   * @private
   */
  async baixarZipCompleto() {
    try {
      const { cacheId, quantidade } = this.arquivosProcessados;
      
      const url = `/api/imagem/download-zip/${cacheId}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Erro ao baixar ZIP: ${response.statusText}`);
      }

      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `imagens-${this.tipoProcessamento}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log(`✓ ZIP baixado com ${quantidade} arquivo(s)`);
    } catch (erro) {
      console.error('Erro ao baixar ZIP:', erro);
      alert('Erro ao baixar arquivo ZIP. Tente novamente.');
    }
  }

  /**
   * Download do arquivo processado (compatibilidade com versão antiga)
   */
  downloadArquivo() {
    if (!this.arquivosProcessados?.blob) {
      // Nova versão: usar cacheId para downloads individuais
      const quantidade = this.arquivosProcessados?.quantidade;
      
      if (quantidade === 1) {
        this.baixarArquivoIndividual(0);
      } else {
        this.baixarZipCompleto();
      }
      return;
    }

    // Versão legada (mantida para compatibilidade)
    const url = URL.createObjectURL(this.arquivosProcessados.blob);
    const link = document.createElement('a');
    link.href = url;

    // Determinar nome do arquivo
    if (this.arquivosProcessados.quantidade === 1) {
      link.download = this.obterNomeProcessado(
        this.arquivosProcessados.nomeOriginal,
        this.tipoProcessamento
      );
    } else {
      const rótulo = this.tipoProcessamento === CompressorImagens.TIPOS.CONVERT
        ? 'convertidas'
        : 'comprimidas';
      link.download = `imagens-${rótulo}-${Date.now()}.zip`;
    }

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Resetar para estado inicial
   */
  resetar() {
    this.arquivosSelecionados = [];
    this.arquivosProcessados = null;
    this.tipoProcessamento = null;

    this.nomeArquivo.textContent = '-';
    this.tamanhoOriginal.textContent = '-';
    this.tamanhoFinal.textContent = '-';
    this.percentualReducao.textContent = '-';
    this.statusText.textContent = 'Aguardando arquivo...';
    this.fileInput.value = '';

    this.progressContainer.classList.add('hidden');
    this.resultsSection.classList.add('hidden');
    this.arquivosSelecionadosSection.classList.add('hidden');

    this.listaArquivosSelecionados.innerHTML = '';
    this.listaArquivosProcessados.innerHTML = '';

    this.habilitarBotoesAcao(false);
  }

  // ==================== UTILITÁRIOS ====================

  /**
   * Mostrar erro
   * @param {string} mensagem
   * @private
   */
  mostrarErro(mensagem) {
    alert(`❌ Erro: ${mensagem}`);
    this.statusText.textContent = `❌ ${mensagem}`;
  }

  /**
   * Calcular tamanho total de um array de arquivos
   * @param {File[]} arquivos
   * @returns {number}
   * @private
   */
  calcularTamanhoTotal(arquivos) {
    return arquivos.reduce((acc, f) => acc + f.size, 0);
  }

  /**
   * Formatar bytes para MB com 2 casas decimais
   * @param {number} bytes
   * @returns {string}
   * @private
   */
  formatarTamanhMB(bytes) {
    return (bytes / 1024 / 1024).toFixed(2);
  }

  /**
   * Obter rótulo de tipo de processamento
   * @param {string} tipo
   * @returns {string}
   * @private
   */
  obterRótuloTipo(tipo) {
    return tipo === CompressorImagens.TIPOS.CONVERT
      ? 'Conversão para WebP'
      : 'Compressão';
  }

  /**
   * Obter nome do arquivo processado
   * @param {string} nomeOriginal
   * @param {string} tipo
   * @returns {string}
   * @private
   */
  obterNomeProcessado(nomeOriginal, tipo) {
    if (tipo === CompressorImagens.TIPOS.CONVERT) {
      return nomeOriginal.replace(/\.[^.]+$/, '.webp');
    }
    return nomeOriginal;
  }
}

// ==================== INICIALIZAÇÃO GLOBAL ====================

/** @type {CompressorImagens} */
let compressor;

document.addEventListener('DOMContentLoaded', () => {
  compressor = new CompressorImagens();
});
