# 🖼️ Image & Video Converter & Compressor

Aplicação web para **converter e compactar imagens (PNG/JPG → WEBP)** e **comprimir vídeos (MP4)** utilizando **Node.js, Express, Sharp e FFmpeg**.  
O objetivo do projeto é oferecer uma ferramenta rápida, simples e eficiente para otimização de arquivos multimídia, reduzindo significativamente o tamanho final sem perda perceptível de qualidade.

---

## 🚀 Funcionalidades

### 🖼️ Conversão de Imagens
- Converter PNG/JPG/JPEG para **WebP**
- Qualidade otimizada por padrão
- Redução significativa do tamanho do arquivo

### 🗜️ Compactação de Imagens
- Compacta imagens mantendo o mesmo formato
- Controle automático de compressão
- Exibição do tamanho original x tamanho otimizado

### 🎬 Compressão de Vídeos (MP4)
- Reduz drasticamente o tamanho do vídeo
- Uso de **FFmpeg** com configurações otimizadas:
  - `libx264`
  - `preset slow`
  - `crf 28` (valor ajustável)
  - `aac 96k`
- Exibição do tamanho original x final
- Processo seguro, com feedback de progresso

### 📤 Upload Avançado
- Suporte a múltiplos arquivos (imagem e vídeo)
- Drag & Drop integrado
- Validação automática de formato e tamanho máximo

### 📥 Download
- Download individual por arquivo convertido/comprimido
- Download em lote via arquivo **.zip**

### 🎨 Interface Moderna
- Interface simples e responsiva com **Tailwind CSS**
- Feedback visual de processamento

### 🧩 Backend Robusto
- API em Node.js com Express
- Upload via Multer
- Processamento de imagens com Sharp
- Compressão de vídeo com FFmpeg
- Limpeza automática de arquivos temporários
- Segurança com Helmet + Rate Limit

---

## 🧱 Tecnologias Utilizadas

### **Backend**
- Node.js  
- Express  
- Sharp (processamento de imagens)  
- Multer (upload de arquivos)  
- Archiver (compactação em ZIP)  
- Helmet  
- Morgan  
- Dotenv  
- Express-Rate-Limit  

### **Vídeo (FFmpeg)**
- **fluent-ffmpeg**  
- **ffmpeg-static**  
- Configurações otimizadas para reduzir tamanho mantendo boa qualidade

### **Frontend**
- HTML  
- Tailwind CSS  
- JavaScript (Vanilla)

---

## 📁 Estrutura do Projeto

