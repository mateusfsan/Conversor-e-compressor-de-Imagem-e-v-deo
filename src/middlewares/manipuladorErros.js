/**
 * Middleware de tratamento centralizado de erros
 * Deve ser o último middleware registrado no app
 */
module.exports = (err, req, res, next) => {
  console.error("Erro:", err.message);

  // determinar código de status HTTP
  let status = 500;
  let mensagem = "Erro interno do servidor";

  if (err.status) {
    status = err.status;
  } else if (err.statusCode) {
    status = err.statusCode;
  } else if (err.code === "LIMIT_FILE_SIZE") {
    status = 413;
    mensagem = "Arquivo muito grande. Tamanho máximo: 20 MB";
  } else if (err.code === "LIMIT_PART_COUNT") {
    status = 400;
    mensagem = "Muitos arquivos enviados";
  } else if (err.message.includes("Apenas arquivos de imagem")) {
    status = 400;
    mensagem = err.message;
  }

  const resposta = {
    erro: true,
    mensagem: err.message || mensagem,
    codigo: status,
  };

  // incluir stack trace em desenvolvimento
  if (process.env.NODE_ENV !== "production") {
    resposta.stack = err.stack;
  }

  res.status(status).json(resposta);
};
