/**
 * Compressor de Imagens - Frontend JavaScript
 * Lógica de upload, processamento e download
 */

class CompressorImagens {
  constructor() {
    this.arquivoSelecionado = null;
    this.tipoProcessamento = null;
    this.nomeArquivoProcessado = null;

    this.init();
  }

  init() {
    // Elementos DOM
    this.dropZone = document.getElementById('dropZone');
    this.fileInput = document.getElementById('fileInput');
    this.converterBtn = document.getElementById('converterBtn');
    this.comprimirBtn = document.getElementById('comprimirBtn');
    this.downloadBtn = document.getElementById('downloadBtn');
    this.novoBtn = document.getElementById('novoBtn');
    this.progressContainer = document.getElementById('progressContainer');
    this.progressBar = document.getElementById('progressBar');
    this.progressPercent = document.getElementById('progressPercent');
    this.progressText = document.getElementById('progressText');
    this.resultsSection = document.getElementById('resultsSection');
    this.nomeArquivo = document.getElementById('nomeArquivo');
    this.tamanhoOriginal = document.getElementById('tamanhoOriginal');
    this.tamanhoFinal = document.getElementById('tamanhoFinal');
    this.percentualReducao = document.getElementById('percentualReducao');
    this.statusText = document.getElementById('statusText');

    // Event listeners - Drop Zone
    this.dropZone.addEventListener('click', () => this.fileInput.click());
    this.dropZone.addEventListener('dragover', (e) => this.handleDragOver(e));
    this.dropZone.addEventListener('dragleave', (e) => this.handleDragLeave(e));
    this.dropZone.addEventListener('drop', (e) => this.handleDrop(e));

    // Event listeners - File Input
    this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

    // Event listeners - Action Buttons
    this.converterBtn.addEventListener('click', () => this.processarArquivo('convert'));
    this.comprimirBtn.addEventListener('click', () => this.processarArquivo('compress'));
    this.downloadBtn.addEventListener('click', () => this.downloadArquivo());
    this.novoBtn.addEventListener('click', () => this.resetar());
  }

  /**
   * Manipular drag over
   */
  handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    this.dropZone.classList.add('bg-blue-50');
  }

  /**
   * Manipular drag leave
   */
  handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    this.dropZone.classList.remove('bg-blue-50');
  }

  /**
   * Manipular drop
   */
  handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    this.dropZone.classList.remove('bg-blue-50');

    const arquivos = e.dataTransfer.files;
    if (arquivos.length > 0) {
      this.selecionarArquivo(arquivos[0]);
    }
  }

  /**
   * Manipular seleção de arquivo via input
   */
  handleFileSelect(e) {
    if (e.target.files.length > 0) {
      this.selecionarArquivo(e.target.files[0]);
    }
  }

  /**
   * Selecionar arquivo
   */
  selecionarArquivo(arquivo) {
    // Validar tipo
    if (!arquivo.type.startsWith('image/')) {
      this.mostrarErro('Por favor, selecione um arquivo de imagem válido.');
      return;
    }

    // Validar tamanho (20 MB)
    if (arquivo.size > 20 * 1024 * 1024) {
      this.mostrarErro('Arquivo muito grande. Tamanho máximo: 20 MB');
      return;
    }

    this.arquivoSelecionado = arquivo;

    // Atualizar UI
    const tamanhoMB = (arquivo.size / 1024 / 1024).toFixed(2);
    this.nomeArquivo.textContent = arquivo.name;
    this.tamanhoOriginal.textContent = `${tamanhoMB} MB`;
    this.statusText.textContent = '✓ Arquivo selecionado e pronto para processar';

    // Habilitar botões
    this.converterBtn.disabled = false;
    this.comprimirBtn.disabled = false;

    // Limpar resultados anteriores
    this.resultsSection.classList.add('hidden');
  }

  /**
   * Processar arquivo
   */
  async processarArquivo(tipo) {
    if (!this.arquivoSelecionado) {
      this.mostrarErro('Nenhum arquivo selecionado.');
      return;
    }

    this.tipoProcessamento = tipo;
    const endpoint = tipo === 'convert' ? '/api/imagem/convert' : '/api/imagem/comprimir';
    const nomeTipo = tipo === 'convert' ? 'Conversão para WebP' : 'Compressão';

    // Desabilitar botões
    this.converterBtn.disabled = true;
    this.comprimirBtn.disabled = true;

    // Mostrar progress bar
    this.progressContainer.classList.remove('hidden');
    this.progressText.textContent = `${nomeTipo} em andamento...`;
    this.statusText.textContent = `🔄 ${nomeTipo} em andamento...`;
    this.progressBar.style.width = '0%';
    this.progressPercent.textContent = '0%';

    try {
      // Simular progresso
      const intervaloProgresso = setInterval(() => {
        const progresso = parseInt(this.progressBar.style.width);
        if (progresso < 90) {
          const novoProgresso = progresso + Math.random() * 30;
          this.progressBar.style.width = Math.min(novoProgresso, 90) + '%';
          this.progressPercent.textContent = Math.floor(Math.min(novoProgresso, 90)) + '%';
        }
      }, 300);

      // Criar FormData
      const formData = new FormData();
      formData.append('arquivo', this.arquivoSelecionado);

      // Fazer request
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData
      });

      clearInterval(intervaloProgresso);

      if (!response.ok) {
        const erro = await response.json();
        throw new Error(erro.mensagem || 'Erro ao processar arquivo');
      }

      // Completar progresso
      this.progressBar.style.width = '100%';
      this.progressPercent.textContent = '100%';
      this.progressText.textContent = `${nomeTipo} concluída com sucesso!`;

      // Obter blob
      const blob = await response.blob();
      this.nomeArquivoProcessado = this.gerarNomeArquivo(tipo);

      // Calcular tamanho
      const tamanhoFinalMB = (blob.size / 1024 / 1024).toFixed(2);
      const tamanhoOriginalMB = (this.arquivoSelecionado.size / 1024 / 1024).toFixed(2);
      // Cálculo correto: diferença / original
      const diferenca = this.arquivoSelecionado.size - blob.size;
      const percentualReducao = ((diferenca / this.arquivoSelecionado.size) * 100).toFixed(2);
      const direcao = percentualReducao >= 0 ? '↓' : '↑';

      // Armazenar blob para download
      this.blobProcessado = blob;

      // Atualizar UI
      this.tamanhoFinal.textContent = `${tamanhoFinalMB} MB`;
      this.percentualReducao.textContent = `${direcao} ${Math.abs(percentualReducao)}%`;
      this.statusText.textContent = `✅ ${nomeTipo} concluída!`;

      // Mostrar resultado
      document.getElementById('resultsTamanhoOriginal').textContent = `${tamanhoOriginalMB} MB`;
      document.getElementById('resultsTamanhoFinal').textContent = `${tamanhoFinalMB} MB`;
      document.getElementById('resultsReducao').textContent = `${direcao} ${Math.abs(percentualReducao)}% de redução`;
      this.resultsSection.classList.remove('hidden');

      // Scroll para resultados
      setTimeout(() => {
        this.resultsSection.scrollIntoView({ behavior: 'smooth' });
      }, 500);

    } catch (erro) {
      this.mostrarErro(`Erro ao processar: ${erro.message}`);
      this.statusText.textContent = `❌ Erro ao processar arquivo`;
    } finally {
      this.progressContainer.classList.add('hidden');
      this.converterBtn.disabled = false;
      this.comprimirBtn.disabled = false;
    }
  }

  /**
   * Gerar nome do arquivo processado
   */
  gerarNomeArquivo(tipo) {
    const extensao = tipo === 'convert' ? '.webp' : this.arquivoSelecionado.name.split('.').pop();
    const nomeSemExtensao = this.arquivoSelecionado.name.split('.')[0];
    return `${nomeSemExtensao}-processado.${extensao}`;
  }

  /**
   * Download do arquivo
   */
  downloadArquivo() {
    if (!this.blobProcessado) {
      this.mostrarErro('Nenhum arquivo para baixar.');
      return;
    }

    const url = URL.createObjectURL(this.blobProcessado);
    const link = document.createElement('a');
    link.href = url;
    link.download = this.nomeArquivoProcessado;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Resetar para estado inicial
   */
  resetar() {
    this.arquivoSelecionado = null;
    this.tipoProcessamento = null;
    this.blobProcessado = null;
    this.nomeArquivoProcessado = null;

    // Limpar UI
    this.nomeArquivo.textContent = '-';
    this.tamanhoOriginal.textContent = '-';
    this.tamanhoFinal.textContent = '-';
    this.percentualReducao.textContent = '-';
    this.statusText.textContent = 'Aguardando arquivo...';
    this.fileInput.value = '';
    this.progressContainer.classList.add('hidden');
    this.resultsSection.classList.add('hidden');

    // Desabilitar botões
    this.converterBtn.disabled = true;
    this.comprimirBtn.disabled = true;
  }

  /**
   * Mostrar erro
   */
  mostrarErro(mensagem) {
    alert(`❌ Erro: ${mensagem}`);
    this.statusText.textContent = `❌ ${mensagem}`;
  }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  new CompressorImagens();
});
