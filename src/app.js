const express = require('express');
const rotas = require('./rotas');
const logger = require('./middlewares/logger');
const manipuladorErros = require('./middlewares/manipuladorErros');

function criarApp() {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(logger);

  app.use('/api', rotas);

  app.use((req, res) => {
    res.status(404).json({ erro: 'Recurso não encontrado' });
  });

  app.use(manipuladorErros);

  return app;
}

module.exports = criarApp;
