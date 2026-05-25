/* ============================================
   STICKER STUDIO — script.js
   State · Upload · API · Animations
   ============================================ */

// ============================================
// STATE
// All UI data lives here — single source of truth
// ============================================
const state = {
  selectedFile: null,       // The File object from file input / drag-drop
  borderColor: "white",     // Currently selected border color string
  borderSize: 10,           // Border size integer (px)
  shadow: true,             // Shadow toggle boolean
  isLoading: false,         // Whether API call is in progress
  resultUrl: null,          // Object URL for the returned sticker blob
};

// ============================================
// INIT — run once DOM is ready
// ============================================
document.addEventListener("DOMContentLoaded", () => {
  spawnFloaties();
  syncToggleUI();
});

// ============================================
// THEME SWITCHER
// ============================================
function switchTheme(theme, btn) {
  const body = document.getElementById("app-body");
  body.classList.remove(
    "theme-pink", "theme-purple", "theme-sky",
    "theme-sunset", "theme-matcha"
  );
  body.classList.add(theme);
  document.querySelectorAll(".dot").forEach(d => d.classList.remove("active"));
  btn.classList.add("active");
}

// ============================================
// FLOATING BACKGROUND EMOJIS
// ============================================
const FLOATIE_EMOJIS = ["💖", "⭐", "✨", "🌸", "💫", "🌙", "🌟", "💝", "🫧", "🎀", "☁️", "🌈"];

function spawnFloaties() {
  const container = document.getElementById("bgFloaties");
  const COUNT = 22;

  for (let i = 0; i < COUNT; i++) {
    const el = document.createElement("span");
    el.className = "floatie";
    el.textContent = FLOATIE_EMOJIS[Math.floor(Math.random() * FLOATIE_EMOJIS.length)];
    el.style.left = `${Math.random() * 100}vw`;
    el.style.top = `${Math.random() * 100}vh`;
    const duration = 12 + Math.random() * 16;
    el.style.animationDuration = `${duration}s`;
    el.style.animationDelay = `-${Math.random() * duration}s`;
    el.style.fontSize = `${0.9 + Math.random() * 1.2}rem`;
    container.appendChild(el);
  }
}

// ============================================
// DRAG & DROP HANDLERS
// ============================================
function handleDragOver(e) {
  e.preventDefault();
  e.stopPropagation();
  document.getElementById("uploadZone").classList.add("drag-over");
}

function handleDragLeave(e) {
  e.preventDefault();
  document.getElementById("uploadZone").classList.remove("drag-over");
}

function handleDrop(e) {
  e.preventDefault();
  e.stopPropagation();
  document.getElementById("uploadZone").classList.remove("drag-over");

  const file = e.dataTransfer?.files?.[0];
  if (file && file.type.startsWith("image/")) {
    setFile(file);
  } else {
    showToast("Please drop an image file! 🖼️");
  }
}

// ============================================
// FILE INPUT HANDLER
// ============================================
function handleFileSelect(e) {
  const file = e.target.files?.[0];
  if (file) setFile(file);
}

// ============================================
// SET FILE
// ============================================
function setFile(file) {
  state.selectedFile = file;

  const previewBox = document.getElementById("previewBox");
  const previewImg = document.getElementById("previewImg");
  const uploadZone = document.getElementById("uploadZone");

  const objectUrl = URL.createObjectURL(file);
  previewImg.src = objectUrl;

  previewBox.style.display = "block";
  uploadZone.style.borderColor = "var(--accent-1)";

  document.querySelector(".upload-title").textContent = "✓ photo ready!";
  document.querySelector(".upload-sub").textContent   = "click to change ♡";

  hideResult();
  hideError();
}

// ============================================
// CLEAR IMAGE
// ============================================
function clearImage() {
  state.selectedFile = null;

  document.getElementById("previewBox").style.display = "none";
  document.getElementById("previewImg").src = "";
  document.getElementById("fileInput").value = "";

  document.querySelector(".upload-title").textContent = "drop your photo here~";
  document.querySelector(".upload-sub").textContent   = "or click to choose ♡";
  document.getElementById("uploadZone").style.borderColor = "";
}

// ============================================
// BORDER COLOR SELECTION
// ============================================
function selectColor(color, btn) {
  state.borderColor = color;
  document.querySelectorAll(".pill").forEach(p => p.classList.remove("active"));
  btn.classList.add("active");
}

// ============================================
// SHADOW TOGGLE
// ============================================
function toggleShadow() {
  state.shadow = !state.shadow;
  syncToggleUI();
}

function syncToggleUI() {
  const track = document.getElementById("toggleTrack");
  const text  = document.getElementById("toggleText");

  if (state.shadow) {
    track.classList.add("on");
    text.textContent = "on ✓";
  } else {
    track.classList.remove("on");
    text.textContent = "off";
  }
}

// ============================================
// CREATE STICKER — main API call
// ============================================
async function createSticker() {
  if (!state.selectedFile) {
    showToast("please upload a photo first! 🖼️");
    shakeUploadZone();
    return;
  }

  state.borderSize = parseInt(document.getElementById("borderSize").value, 10);

  setLoading(true);
  hideResult();
  hideError();

  // ✅ Send shadow as "true"/"false" string — FastAPI reads it as str then converts
  const formData = new FormData();
  formData.append("image",        state.selectedFile);
  formData.append("border_color", state.borderColor);
  formData.append("border_size",  String(state.borderSize));
  formData.append("shadow",       state.shadow ? "true" : "false"); // ✅ explicit string

  try {
    const response = await fetch("https://kunjalsaharan25-sticker-studio-api.hf.space/create-sticker", {
      method: "POST",
      body: formData,
      // ✅ Do NOT set Content-Type — browser sets multipart boundary automatically
    });

    if (!response.ok) {
      let detail = `Server error ${response.status}`;
      try {
        const err = await response.json();
        detail = err.detail || detail;
      } catch {}
      throw new Error(detail);
    }

    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("image")) {
      // Backend returns image blob directly (StreamingResponse)
      const blob = await response.blob();
      const url  = URL.createObjectURL(blob);
      showResult(url);
    } else {
      // Backend returns JSON with saved_to URL
      const data = await response.json();
      // ✅ data.saved_to is already the full URL e.g. http://127.0.0.1:8000/outputs/sticker.png
      await showResultFromPath(data.saved_to);
    }

  } catch (err) {
    console.error("Sticker API error:", err);
    showError(err.message || "Connection failed — is the backend running? 🌸");
  } finally {
    setLoading(false);
  }
}

// ============================================
// SHOW RESULT — image blob (StreamingResponse backend)
// ============================================
function showResult(url) {
  const resultImg   = document.getElementById("resultImg");
  const downloadBtn = document.getElementById("downloadBtn");
  const resultState = document.getElementById("resultState");
  const emptyState  = document.getElementById("emptyState");

  state.resultUrl = url;

  resultImg.src         = url;
  downloadBtn.href      = url;
  downloadBtn.download  = "my-sticker.png";

  emptyState.style.display  = "none";
  resultState.style.display = "flex";

  fireConfetti();
}

// ============================================
// SHOW RESULT — JSON backend (file saved on server)
// ✅ FIX: savePath is already a full URL from backend
//         Added cache-buster so browser doesn't show stale image
// ============================================
async function showResultFromPath(savePath) {

  const resultState = document.getElementById("resultState");
  const emptyState = document.getElementById("emptyState");
  const resultImg = document.getElementById("resultImg");
  const downloadBtn = document.getElementById("downloadBtn");

  // Add cache buster
  const imageUrl = `${savePath}?t=${Date.now()}`;

  // Directly show image
  resultImg.src = imageUrl;

  // Download button
  downloadBtn.href = imageUrl;
  downloadBtn.download = "my-sticker.png";

  // Show result section
  emptyState.style.display = "none";
  resultState.style.display = "flex";

  fireConfetti();
}

// ============================================
// BUILD SUCCESS PLACEHOLDER
// Shown when the sticker image can't be fetched back
// ============================================
function buildSuccessPlaceholder() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <rect width="200" height="200" fill="#fff5f8" rx="20"/>
    <text x="100" y="90"  text-anchor="middle" font-size="48">Sticker Created!</text>
    <text x="100" y="130" text-anchor="middle" font-size="14" fill="#a06080" font-family="Nunito,sans-serif">Sticker saved!</text>
    <text x="100" y="150" text-anchor="middle" font-size="11" fill="#c09ab0" font-family="Nunito,sans-serif">check outputs/sticker.png</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

// ============================================
// RESET RESULT
// ============================================
function resetResult() {
  document.getElementById("resultState").style.display = "none";
  document.getElementById("emptyState").style.display  = "flex";
  if (state.resultUrl) {
    URL.revokeObjectURL(state.resultUrl);
    state.resultUrl = null;
  }
}

// ============================================
// HIDE / SHOW HELPERS
// ============================================
function hideResult() {
  document.getElementById("resultState").style.display = "none";
  document.getElementById("emptyState").style.display  = "flex";
}

function showError(msg) {
  document.getElementById("errorMsg").textContent      = msg;
  document.getElementById("errorState").style.display  = "flex";
  document.getElementById("emptyState").style.display  = "none";
  document.getElementById("resultState").style.display = "none";
}

function hideError() {
  document.getElementById("errorState").style.display = "none";
}

// ============================================
// LOADING STATE
// ============================================
function setLoading(on) {
  state.isLoading = on;
  const createBtn  = document.getElementById("createBtn");
  const loadingBox = document.getElementById("loadingBox");

  if (on) {
    createBtn.style.display  = "none";
    loadingBox.style.display = "flex";
  } else {
    createBtn.style.display  = "flex";
    loadingBox.style.display = "none";
  }
}

// ============================================
// CONFETTI ANIMATION
// ============================================
function fireConfetti() {
  const container = document.getElementById("resultConfetti");
  const EMOJIS    = ["✨", "🌸", "⭐", "💖", "🎉", "🌟", "💫", "🎀"];
  const COUNT     = 14;

  container.innerHTML = "";

  for (let i = 0; i < COUNT; i++) {
    const el = document.createElement("span");
    el.className   = "confetti-piece";
    el.textContent = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    el.style.left           = `${10 + Math.random() * 80}%`;
    el.style.animationDelay = `${Math.random() * 0.6}s`;
    el.style.fontSize       = `${1 + Math.random() * 0.8}rem`;
    container.appendChild(el);
  }

  setTimeout(() => { container.innerHTML = ""; }, 2500);
}

// ============================================
// TOAST NOTIFICATION
// ============================================
function showToast(message) {
  const existing = document.getElementById("toastMsg");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "toastMsg";
  toast.textContent = message;

  Object.assign(toast.style, {
    position:     "fixed",
    bottom:       "2rem",
    left:         "50%",
    transform:    "translateX(-50%) translateY(20px)",
    background:   "var(--btn-from)",
    color:        "#fff",
    padding:      "0.7rem 1.5rem",
    borderRadius: "999px",
    fontFamily:   "var(--font-display)",
    fontWeight:   "700",
    fontSize:     "0.9rem",
    boxShadow:    "0 6px 24px rgba(0,0,0,0.15)",
    zIndex:       "9999",
    opacity:      "0",
    transition:   "all 0.4s cubic-bezier(0.34,1.56,0.64,1)",
  });

  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity   = "1";
    toast.style.transform = "translateX(-50%) translateY(0)";
  });

  setTimeout(() => {
    toast.style.opacity   = "0";
    toast.style.transform = "translateX(-50%) translateY(20px)";
    setTimeout(() => toast.remove(), 400);
  }, 2800);
}

// ============================================
// SHAKE UPLOAD ZONE
// ============================================
function shakeUploadZone() {
  const zone = document.getElementById("uploadZone");
  zone.style.animation = "none";
  requestAnimationFrame(() => {
    zone.style.animation = "shakeZone 0.5s ease";
  });
}

// Inject shake keyframe
const shakeStyle = document.createElement("style");
shakeStyle.textContent = `
  @keyframes shakeZone {
    0%,100% { transform: translateX(0); }
    20%      { transform: translateX(-8px); }
    40%      { transform: translateX(8px); }
    60%      { transform: translateX(-5px); }
    80%      { transform: translateX(5px); }
  }
`;
document.head.appendChild(shakeStyle);