const express = require('express');
const path = require('path');
const rotas = require('./rotas');
const logger = require('./middlewares/logger');
const manipuladorErros = require('./middlewares/manipuladorErros');

function criarApp() {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(logger);

  // servir arquivos estáticos (HTML, CSS, JS)
  app.use(express.static(path.join(__dirname, '..', 'public')));

  // rota raiz - redirecionar para página HTML
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
  });

  app.use('/api', rotas);

  app.use((req, res) => {
    res.status(404).json({ erro: 'Recurso não encontrado' });
  });

  app.use(manipuladorErros);

  return app;
}

module.exports = criarApp;

module.exports = criarApp;
