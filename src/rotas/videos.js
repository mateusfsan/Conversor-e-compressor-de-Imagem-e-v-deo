const multer = require("multer");
const path = require("path");
const videoControlador = require("../controladores/videoControlador");

// Configuração do multer para vídeos (20MB)
const uploadVideo = multer({
  dest: path.join(__dirname, "../../tmp"),
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("video/")) {
      return cb(new Error("Tipo de arquivo não suportado."));
    }
    cb(null, true);
  },
});

module.exports = (router) => {
  // ...rotas existentes...

  // Upload e compressão de vídeo
  router.post(
    "/videos/comprimir",
    uploadVideo.single("video"),
    videoControlador.comprimirVideo
  );
};
