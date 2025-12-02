require('dotenv').config();
const path = require('path');
const fs = require('fs');
const criarApp = require('./app');

const PORT = process.env.PORT || 3000;
const TMP = process.env.TMP_DIR || path.join(__dirname, '..', 'tmp');

// garante diretório temporário
try { fs.mkdirSync(TMP, { recursive: true }); } catch (e) {}

const app = criarApp();

app.listen(PORT, () => {
  console.log(`Servidor Express rodando em http://localhost:${PORT}`);
});

process.on('SIGINT', () => {
  console.log('\nEncerrando servidor...');
  // encerra o processo após um pequeno delay para permitir limpeza
  setTimeout(() => process.exit(0), 100);
});
