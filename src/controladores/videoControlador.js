const ffmpegPath = require("ffmpeg-static");
const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const fs = require("fs");

// POST /videos/comprimir
// Espera um arquivo de vídeo em req.file
exports.comprimirVideo = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ erro: "Nenhum arquivo enviado." });
  }

  const inputPath = req.file.path;
  const baseName = path.basename(inputPath, path.extname(inputPath));
  const outputPath = path.join(
    path.dirname(inputPath),
    baseName + "_otimizado.mp4"
  );

  ffmpeg(inputPath)
    .setFfmpegPath(ffmpegPath)
    .videoCodec("libx264")
    .outputOptions([
      "-preset slow",
      "-crf 28",
      "-g 120",
      "-pix_fmt yuv420p",
      "-profile:v high",
      "-level 4.1",
      "-movflags +faststart",
    ])
    .audioCodec("aac")
    .audioBitrate("96k")
    .on("end", () => {
      // Remove o arquivo original após compressão
      fs.unlink(inputPath, () => {
        res.download(outputPath, baseName + "_otimizado.mp4", (err) => {
          if (err) {
            res.status(500).json({ erro: "Erro ao enviar vídeo comprimido." });
          }
          // Remove o arquivo comprimido após download
          fs.unlink(outputPath, () => {});
        });
      });
    })
    .on("error", (err) => {
      fs.unlink(inputPath, () => {});
      res.status(500).json({ erro: "Erro na compressão: " + err.message });
    })
    .save(outputPath);
};
