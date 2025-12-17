exports.saudar = (req, res, next) => {
  try {
    const nome = req.query.nome ? String(req.query.nome) : "Visitante";
    return res.json({ mensagem: `Olá, ${nome}! Bem-vindo ao servidor.` });
  } catch (err) {
    return next(err);
  }
};
