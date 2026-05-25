# 🎀 Sticker Studio

Cute aesthetic AI-powered sticker generator built with Python, FastAPI, HTML, CSS, and JavaScript.

Turn your photos into adorable stickers with customizable borders, shadows, pastel themes, and animated aesthetics ✨

---

## 🌐 Live Demo

💖 Try Sticker Studio Here:
https://stickerstudio.netlify.app/

---

## ✨ Features

* 🖼️ Drag & drop image upload
* 🤖 AI-powered background removal
* 🌈 Custom border colors
* 🌟 Adjustable border thickness
* 🌸 Shadow toggle effects
* 🎨 Multiple aesthetic themes
* ✨ Floating animated background objects
* 📥 Download generated stickers
* 💕 Cute pastel UI design

---

## 🛠️ Tech Stack

### Frontend

* HTML
* CSS
* JavaScript
* Netlify (Deployment)

### Backend

* Python
* FastAPI
* rembg
* Pillow
* Hugging Face Spaces (Deployment)

---

## 🚀 How It Works

1. User uploads an image
2. Backend removes the background using AI
3. Sticker effects are applied:

   * borders
   * shadows
   * styling
4. Final sticker is generated
5. User downloads the sticker

---

## 📂 Project Structure

```txt
sticker-studio/
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
│
├── outputs/
├── uploads/
├── main.py
├── .gitignore
└── README.md
```

---

## ⚡ Run Locally

### 1. Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/sticker-studio.git
cd sticker-studio
```

---

### 2. Create Virtual Environment

```bash
python -m venv venv
```

Activate virtual environment:

### Windows PowerShell

```bash
.\venv\Scripts\Activate.ps1
```

---

### 3. Install Dependencies

```bash
pip install fastapi uvicorn rembg pillow python-multipart onnxruntime
```

---

### 4. Run Backend

```bash
python -m uvicorn main:app --reload
```

Backend runs on:

```txt
http://127.0.0.1:8000
```

---

### 5. Run Frontend

```bash
cd frontend
python -m http.server 3000
```

Frontend runs on:

```txt
http://localhost:3000
```

---

## 💡 Future Improvements

* 🌟 Neon glow stickers
* 😂 Meme sticker mode
* 📱 WhatsApp sticker pack export
* 🎭 Animated stickers
* 🤖 AI caption generation
* 📲 Mobile optimization

---

## 📸 Preview

Cute dreamy sticker generation experience with animated pastel UI ✨

---

## 👨‍💻 Author

Built with 💖 by Kunjal Saharan
