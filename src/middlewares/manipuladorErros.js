module.exports = (err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  const resposta = { erro: err.message || 'Erro interno do servidor' };
  if (process.env.NODE_ENV !== 'production') {
    resposta.stack = err.stack;
  }
  res.status(status).json(resposta);
};
