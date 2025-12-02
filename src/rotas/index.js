const express = require('express');
const saudacaoControlador = require('../controladores/saudacaoControlador');

const router = express.Router();

router.get('/', (req, res) => {
  return res.json({ ok: true, mensagem: 'Servidor Express ativo' });
});

router.get('/saudacao', saudacaoControlador.saudar);

module.exports = router;
