document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("formVideo");
  const input = document.getElementById("videoInput");
  const btn = document.getElementById("comprimirVideoBtn");
  const progressContainer = document.getElementById("videoProgressContainer");
  const progressBar = document.getElementById("videoProgressBar");
  const progressText = document.getElementById("videoProgressText");
  const progressPercent = document.getElementById("videoProgressPercent");
  const status = document.getElementById("videoStatus");
  const result = document.getElementById("videoResult");
  const nomeOriginal = document.getElementById("videoNomeOriginal");
  const tamanhoOriginal = document.getElementById("videoTamanhoOriginal");
  const tamanhoFinal = document.getElementById("videoTamanhoFinal");
  const reducao = document.getElementById("videoReducao");
  const downloadBtn = document.getElementById("videoDownloadBtn");

  input.addEventListener("change", function () {
    btn.disabled = !input.files.length;
    result.classList.add("hidden");
    status.textContent = "";
    progressContainer.classList.add("hidden");
    progressBar.style.width = "0%";
    progressPercent.textContent = "0%";
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!input.files.length) return;
    const file = input.files[0];
    btn.disabled = true;
    status.textContent = "";
    result.classList.add("hidden");
    progressContainer.classList.remove("hidden");
    progressText.textContent = "Enviando vídeo...";
    progressBar.style.width = "0%";
    progressPercent.textContent = "0%";

    const formData = new FormData();
    formData.append("video", file);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/videos/comprimir");
    xhr.responseType = "blob";

    xhr.upload.onprogress = function (e) {
      if (e.lengthComputable) {
        const percent = (e.loaded / e.total) * 100;
        progressBar.style.width = percent + "%";
        progressPercent.textContent = percent.toFixed(1) + "%";
        progressText.textContent = "Enviando vídeo...";
      }
    };

    xhr.onload = function () {
      btn.disabled = false;
      progressBar.style.width = "100%";
      progressPercent.textContent = "100%";
      progressText.textContent = "Processando...";
      if (xhr.status === 200) {
        // Tenta obter tamanho do arquivo comprimido
        const blob = xhr.response;
        const url = URL.createObjectURL(blob);
        nomeOriginal.textContent = file.name;
        tamanhoOriginal.textContent =
          (file.size / 1024 / 1024).toFixed(2) + " MB";
        tamanhoFinal.textContent = (blob.size / 1024 / 1024).toFixed(2) + " MB";
        const reducaoPercent = 100 - (blob.size / file.size) * 100;
        reducao.textContent =
          reducaoPercent > 0 ? reducaoPercent.toFixed(1) + "%" : "0%";
        downloadBtn.href = url;
        downloadBtn.download = file.name.replace(/\.[^.]+$/, "_otimizado.mp4");
        result.classList.remove("hidden");
        status.textContent = "";
        progressText.textContent = "Concluído!";
      } else {
        result.classList.add("hidden");
        status.textContent =
          "Erro ao comprimir vídeo: " +
          (xhr.statusText || "Falha desconhecida");
        progressText.textContent = "Erro";
      }
      progressContainer.classList.add("hidden");
    };

    xhr.onerror = function () {
      btn.disabled = false;
      result.classList.add("hidden");
      status.textContent = "Erro de conexão ao enviar vídeo.";
      progressText.textContent = "Erro";
      progressContainer.classList.add("hidden");
    };

    xhr.send(formData);
  });
});
