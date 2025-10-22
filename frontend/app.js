/* === MOF-LabAssist Lite — app.js (enhanced) ==================================
 * Features:
 * - Auto-detect Render backend API with localStorage override
 * - Language toggle (AR/EN) for placeholders and UI copy
 * - Smooth tab transitions
 * - Loading spinner & robust error handling
 * - Compatible with the original HTML element IDs
 * ========================================================================= */

// 1) --- API base selection (EDIT HERE if you want a default) -----------------
 // ✅ Backend API (Render)
 const RENDER_API = "https://mof-labassist-ai.onrender.com/api";
 const cached = localStorage.getItem("API");
 const API = cached
   ? cached
   : (location.hostname.endsWith("onrender.com") ? RENDER_API : "http://localhost:8000/api");
 console.log("🌐 Using API:", API);

 async function checkConnection() {
   try {
     const res = await fetch(`${API}/health`);
     if (res.ok) {
       console.log("🔗 Connected successfully to Render backend");
       document.getElementById("connection-status").innerText = "🔗 Connected to backend";
       document.getElementById("connection-status").style.color = "limegreen";
     } else {
       throw new Error("Failed health check");
     }
   } catch (e) {
     console.error("❌ Backend not reachable", e);
     document.getElementById("connection-status").innerText = "❌ Disconnected";
     document.getElementById("connection-status").style.color = "red";
   }
 }
 checkConnection();

// 2) --- Language state --------------------------------------------------------
const Lang = {
  current: localStorage.getItem("LANG") || "en",
  set(l) {
    this.current = l;
    localStorage.setItem("LANG", l);
    applyLang();
  },
  toggle() {
    this.set(this.current === "en" ? "ar" : "en");
  }
};

const L = {
  en: {
    chatPlaceholder: "e.g., best MOFs for CO2?",
    forwardTitle: "Forward: Application → MOF",
    inverseTitle: "Inverse: MOF → Applications",
    appPlaceholder: "application (e.g., CO2_capture, H2_storage)",
    selMin: "Min selectivity (optional)",
    upMin: "Min uptake mmol/g (optional)",
    tK: "T (K)",
    pBar: "P (bar)",
    humidity: "Humidity %",
    mofName: "MOF name (e.g., HKUST-1)",
    cifUrl: "CIF URL (optional)",
    btnSend: "Send",
    btnSearch: "Search",
    btnPredict: "Predict",
    loading: "Loading…",
    apiError: "Error contacting API",
  },
  ar: {
    chatPlaceholder: "مثال: افضل MOFs لالتقاط CO2؟",
    forwardTitle: "تطبيق → مادة (Forward)",
    inverseTitle: "مادة → تطبيقات (Inverse)",
    appPlaceholder: "التطبيق (مثال: CO2_capture, H2_storage)",
    selMin: "أدنى انتقائية (اختياري)",
    upMin: "أدنى التقاط mmol/g (اختياري)",
    tK: "درجة الحرارة (كلفن)",
    pBar: "الضغط (بار)",
    humidity: "الرطوبة %",
    mofName: "اسم المادة (مثال: HKUST-1)",
    cifUrl: "رابط CIF (اختياري)",
    btnSend: "إرسال",
    btnSearch: "بحث",
    btnPredict: "تنبؤ",
    loading: "جاري التحميل…",
    apiError: "تعذّر الاتصال بالـ API",
  }
};

// 3) --- Helpers ---------------------------------------------------------------
function qs(id) { return document.getElementById(id); }
function numOrNull(v){ const x = Number(v); return Number.isFinite(x) ? x : null; }

function setText(el, text) { if (el) el.textContent = text; }
function setPlaceholder(el, text) { if (el) el.placeholder = text; }

function fadeSwitch(showId) {
  const sections = ["chat","forward","inverse"];
  sections.forEach(id => {
    const el = qs(id);
    if (!el) return;
    if (id === showId) {
      el.style.display = "block";
      el.style.opacity = "0";
      requestAnimationFrame(() => {
        el.style.transition = "opacity 200ms ease";
        el.style.opacity = "1";
      });
    } else {
      el.style.opacity = "0";
      setTimeout(() => { el.style.display = "none"; }, 180);
    }
  });
}

function spinner(text) {
  // Simple inline spinner markup
  return `⏳ ${text || (Lang.current === "ar" ? L.ar.loading : L.en.loading)}`;
}

function showError(targetEl, message) {
  const msg = message || (Lang.current === "ar" ? L.ar.apiError : L.en.apiError);
  if (targetEl) targetEl.textContent = `❌ ${msg}`;
}

// 4) --- Apply language to UI --------------------------------------------------
function applyLang() {
  const t = L[Lang.current];

  // Titles (if you added IDs in HTML you can set them here; fallback no-op)
  // setText(qs("titleForward"), t.forwardTitle);
  // setText(qs("titleInverse"), t.inverseTitle);

  // Placeholders
  setPlaceholder(qs("chatInput"), t.chatPlaceholder);
  setPlaceholder(qs("appName"), t.appPlaceholder);
  setPlaceholder(qs("selMin"), t.selMin);
  setPlaceholder(qs("upMin"), t.upMin);
  setPlaceholder(qs("T_K"), t.tK);
  setPlaceholder(qs("P_bar"), t.pBar);
  setPlaceholder(qs("humidity"), t.humidity);
  setPlaceholder(qs("mofName"), t.mofName);
  setPlaceholder(qs("cifUrl"), t.cifUrl);

  // Buttons (only if you have separate IDs for action buttons; fallback: find by context)
  // If buttons in HTML don't have IDs, this is optional and safe to ignore.
  // Example:
  // setText(qs("btnSend"), t.btnSend);
  // setText(qs("btnSearch"), t.btnSearch);
  // setText(qs("btnPredict"), t.btnPredict);

  // Document dir for proper RTL/LTR
  if (Lang.current === "ar") {
    document.documentElement.setAttribute("lang","ar");
    document.documentElement.setAttribute("dir","rtl");
  } else {
    document.documentElement.setAttribute("lang","en");
    document.documentElement.setAttribute("dir","ltr");
  }
}

// Optional: hook to a language toggle button if present
document.addEventListener("click", (e) => {
  const t = e.target;
  if (!t) return;
  if (t.id === "langToggle") {
    e.preventDefault();
    Lang.toggle();
  }
});

// 5) --- Tabs API (kept compatible with original HTML buttons) -----------------
function showTab(id){ fadeSwitch(id); }
window.showTab = showTab; // keep global for inline onclick in HTML

// 6) --- Chat ------------------------------------------------------------------
function addMsg(role, text){
  const box = qs("chatBox");
  if (!box) return;
  const line = document.createElement("div");
  line.textContent = `${role}: ${text}`;
  box.appendChild(line);
  box.scrollTop = box.scrollHeight;
}

async function sendChat(){
  const input = qs("chatInput");
  if (!input) return;
  const msg = input.value.trim();
  if(!msg) return;

  addMsg("you", msg);
  input.value = "";

  // temporary spinner message
  addMsg("bot", spinner());

  try{
    const r = await fetch(`${API}/chat`, {
      method:"POST", headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ message: msg, lang: Lang.current })
    });
    const data = await r.json();
    // replace last spinner line with actual text
    const box = qs("chatBox");
    if (box && box.lastChild) box.removeChild(box.lastChild);
    addMsg("bot", data?.reply ?? "…");
  }catch(e){
    console.error("Chat API error:", e);
    const box = qs("chatBox");
    if (box && box.lastChild) box.removeChild(box.lastChild);
    addMsg("bot", Lang.current === "ar" ? L.ar.apiError : L.en.apiError);
  }
}
window.sendChat = sendChat; // for inline onclick

// 7) --- Forward (Application → MOF) ------------------------------------------
async function runForward(){
  const out = qs("forwardOut");
  if (out) out.textContent = spinner();

  const payload = {
    application: (qs("appName")?.value || "CO2_capture"),
    constraints: {
      selectivity_min: numOrNull(qs("selMin")?.value),
      uptake_min_mmol_g: numOrNull(qs("upMin")?.value),
      operating_conditions: {
        T_K: numOrNull(qs("T_K")?.value),
        P_bar: numOrNull(qs("P_bar")?.value),
        humidity_pct: numOrNull(qs("humidity")?.value),
      }
    },
    lang: Lang.current
  };

  try{
    const r = await fetch(`${API}/forward`, {
      method:"POST", headers:{ "Content-Type":"application/json" },
      body: JSON.stringify(payload)
    });
    const data = await r.json();
    if (out) out.textContent = JSON.stringify(data, null, 2);
  }catch(e){
    console.error("Forward API error:", e);
    showError(out);
  }
}
window.runForward = runForward;

// 8) --- Inverse (MOF → Applications) -----------------------------------------
async function runInverse(){
  const out = qs("inverseOut");
  if (out) out.textContent = spinner();

  const payload = { material: {
    name: (qs("mofName")?.value || "UiO-66-NH2"),
    cif_url: (qs("cifUrl")?.value || null)
  }, lang: Lang.current };

  try{
    const r = await fetch(`${API}/inverse`, {
      method:"POST", headers:{ "Content-Type":"application/json" },
      body: JSON.stringify(payload)
    });
    const data = await r.json();
    if (out) out.textContent = JSON.stringify(data, null, 2);
  }catch(e){
    console.error("Inverse API error:", e);
    showError(out);
  }
}
window.runInverse = runInverse;

// 9) --- Global error visibility (debug) ---------------------------------------
window.addEventListener("unhandledrejection", e => {
  console.error("Promise error:", e.reason);
});
window.addEventListener("error", e => {
  console.error("JS error:", e.message);
});

// 10) --- Init -----------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  applyLang();
  // Default: show Chat tab
  fadeSwitch("chat");
});
