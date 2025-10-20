const API = (localStorage.getItem("API") || "http://localhost:8000/api");

// Translation dictionaries
const translations = {
  en: {
    logo: "⚗️ MOF-LabAssist",
    btnChat: "💬 Chat",
    btnForward: "⚗️ Forward",
    btnInverse: "🔁 Inverse",
    langToggle: "AR",
    placeholderChat: "مثال: best MOFs for CO2?",
    labelChat: "Chat",
    labelForward: "Forward",
    labelInverse: "Inverse",
    send: "Send",
    search: "Search",
    predict: "Predict"
  },
  ar: {
    logo: "⚗️ مساعد MOF-LabAssist",
    btnChat: "💬 دردشة",
    btnForward: "⚗️ تقديم",
    btnInverse: "🔁 عكسي",
    langToggle: "EN",
    placeholderChat: "مثال: أفضل MOFs لـ CO2؟",
    labelChat: "دردشة",
    labelForward: "تقديم",
    labelInverse: "عكسي",
    send: "إرسال",
    search: "ابحث",
    predict: "توقع"
  }
};

let currentLang = "en";

// Elements
const btnChat = document.getElementById("btnChat");
const btnForward = document.getElementById("btnForward");
const btnInverse = document.getElementById("btnInverse");
const langToggle = document.getElementById("langToggle");
const cards = { chat: document.getElementById("chat"), forward: document.getElementById("forward"), inverse: document.getElementById("inverse") };
const sendChatBtn = document.getElementById("sendChatBtn");
const runForwardBtn = document.getElementById("runForwardBtn");
const runInverseBtn = document.getElementById("runInverseBtn");

function updateLanguage() {
  const t = translations[currentLang];
  document.getElementById("logo").textContent = t.logo;
  btnChat.textContent = t.btnChat;
  btnForward.textContent = t.btnForward;
  btnInverse.textContent = t.btnInverse;
  langToggle.textContent = t.langToggle;
  document.querySelector("#chat input").placeholder = t.placeholderChat;
  document.querySelector(".label-chat").textContent = t.labelChat;
  document.querySelector(".label-forward").textContent = t.labelForward;
  document.querySelector(".label-inverse").textContent = t.labelInverse;
  sendChatBtn.textContent = t.send;
  runForwardBtn.textContent = t.search;
  runInverseBtn.textContent = t.predict;
}

function showTab(tab) {
  Object.keys(cards).forEach(key => {
    const card = cards[key];
    if (key === tab) {
      card.classList.add("active");
      card.style.opacity = 0;
      setTimeout(() => card.style.opacity = 1, 10);
    } else {
      card.classList.remove("active");
    }
  });
}

async function sendChat() {
  const input = document.getElementById("chatInput");
  const chatBox = document.getElementById("chatBox");
  const msg = input.value.trim();
  if (!msg) return;
  addMsg("you", msg);
  input.value = "";
  sendChatBtn.disabled = true;
  sendChatBtn.innerHTML = '<span class="spinner"></span>';
  try {
    const res = await fetch(`${API}/chat`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg, lang: currentLang })
    });
    const data = await res.json();
    addMsg("bot", data.reply);
  } catch (e) {
    addMsg("bot", "Error contacting API");
  } finally {
    sendChatBtn.disabled = false;
    sendChatBtn.textContent = translations[currentLang].send;
  }
}

async function runForward() {
  const out = document.getElementById("forwardOut");
  runForwardBtn.disabled = true;
  runForwardBtn.innerHTML = '<span class="spinner"></span>';
  const payload = {
    application: document.getElementById("appName").value || "CO2_capture",
    constraints: {
      selectivity_min: numOrNull(document.getElementById("selMin").value),
      uptake_min_mmol_g: numOrNull(document.getElementById("upMin").value),
      operating_conditions: {
        T_K: numOrNull(document.getElementById("T_K").value),
        P_bar: numOrNull(document.getElementById("P_bar").value),
        humidity_pct: numOrNull(document.getElementById("humidity").value)
      }
    },
    lang: currentLang
  };
  try {
    const res = await fetch(`${API}/forward`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    out.textContent = JSON.stringify(data, null, 2);
  } catch (e) {
    out.textContent = "Error contacting API";
  } finally {
    runForwardBtn.disabled = false;
    runForwardBtn.textContent = translations[currentLang].search;
  }
}

async function runInverse() {
  const out = document.getElementById("inverseOut");
  runInverseBtn.disabled = true;
  runInverseBtn.innerHTML = '<span class="spinner"></span>';
  const payload = {
    material: {
      name: document.getElementById("mofName").value || "UiO-66-NH2",
      cif_url: document.getElementById("cifUrl").value || null
    },
    lang: currentLang
  };
  try {
    const res = await fetch(`${API}/inverse`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    out.textContent = JSON.stringify(data, null, 2);
  } catch (e) {
    out.textContent = "Error contacting API";
  } finally {
    runInverseBtn.disabled = false;
    runInverseBtn.textContent = translations[currentLang].predict;
  }
}

function addMsg(role, text) {
  const box = document.getElementById("chatBox");
  const div = document.createElement("div");
  div.className = role === "you" ? "msg-you" : "msg-bot";
  div.textContent = `${role === "you" ? "you" : "bot"}: ${text}`;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

function numOrNull(v) {
  const x = Number(v);
  return Number.isFinite(x) ? x : null;
}

// Event bindings
btnChat.addEventListener("click", () => showTab("chat"));
btnForward.addEventListener("click", () => showTab("forward"));
btnInverse.addEventListener("click", () => showTab("inverse"));
langToggle.addEventListener("click", () => {
  currentLang = currentLang === "en" ? "ar" : "en";
  updateLanguage();
});

// Action buttons
sendChatBtn.addEventListener("click", sendChat);
runForwardBtn.addEventListener("click", runForward);
runInverseBtn.addEventListener("click", runInverse);

// Initialize
updateLanguage();
