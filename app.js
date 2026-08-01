// =====================
// Mental Dashboard App
// =====================

// ----- Trackers -----
const trackers = [
  { id: "mood", name: "Mood", emoji: "😊" },
  { id: "energy", name: "Energy", emoji: "⚡" },
  { id: "anxiety", name: "Anxiety", emoji: "😰" },
  { id: "ocd", name: "OCD", emoji: "🧠" },
  { id: "focus", name: "Focus", emoji: "🎯" }
];

// ----- Elements -----
const sliders = document.getElementById("sliders");
const logPage = document.getElementById("logPage");
const historyPage = document.getElementById("historyPage");
const historyList = document.getElementById("historyList");
const notes = document.getElementById("notes");
const saved = document.getElementById("saved");

// ----- Sliders -----
function buildSliders() {
  if (!sliders) return;

  sliders.innerHTML = "";

  trackers.forEach(tracker => {
    sliders.innerHTML += `
      <div class="card">
        <div class="tracker-header">
          <span class="tracker-title">
            ${tracker.emoji} ${tracker.name}
          </span>

          <span
            class="tracker-value"
            id="${tracker.id}Value"
          >
            50
          </span>
        </div>

        <div
          class="small"
          id="${tracker.id}Label"
        >
          50/100
        </div>

        <input
          id="${tracker.id}"
          type="range"
          min="0"
          max="100"
          value="50"
        >
      </div>
    `;
  });

  trackers.forEach(tracker => {
    const input = document.getElementById(tracker.id);

    if (!input) return;

    input.addEventListener("input", () => {
      updateSlider(tracker.id);
    });

    updateSlider(tracker.id);
  });
}

function updateSlider(id) {
  const input = document.getElementById(id);
  const valueElement = document.getElementById(`${id}Value`);
  const labelElement = document.getElementById(`${id}Label`);

  if (!input || !valueElement || !labelElement) return;

  const value = Number(input.value);

  valueElement.textContent = value;

  if (id === "mood") {
    const [label, emoji] = moodLabel(value);
    labelElement.textContent = `${emoji} ${label}`;
  } else {
    labelElement.textContent = `${value}/100`;
  }
}

// ----- Save Entry -----
function saveEntry() {
  const moodInput = document.getElementById("mood");

  if (!moodInput) return;

  const mood = Number(moodInput.value);
  const [label, emoji] = moodLabel(mood);

  const entry = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    mood,
    moodLabel: label,
    moodEmoji: emoji,
    energy: Number(
      document.getElementById("energy")?.value || 0
    ),
    anxiety: Number(
      document.getElementById("anxiety")?.value || 0
    ),
    ocd: Number(
      document.getElementById("ocd")?.value || 0
    ),
    focus: Number(
      document.getElementById("focus")?.value || 0
    ),
    notes: notes?.value.trim() || ""
  };

  const entries = getEntries();

  entries.unshift(entry);
  saveEntries(entries);

  if (notes) {
    notes.value = "";
  }

  if (saved) {
    saved.style.opacity = "1";

    setTimeout(() => {
      saved.style.opacity = "0";
    }, 1200);
  }

  renderHistory();
  updateSummary();
  drawMoodChart();

  if (typeof renderCalendar === "function") {
    renderCalendar();
  }
}

// ----- Chart -----
function drawMoodChart() {
  const canvas = document.getElementById("moodChart");

  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  if (!ctx) return;

  const entries = getEntries()
    .slice(0, 10)
    .reverse();

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (entries.length === 0) {
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = "#94a3b8";

    ctx.fillText(
      "Log some moods to see your trend.",
      canvas.width / 2,
      canvas.height / 2
    );

    return;
  }

  const padding = 14;
  const chartWidth = canvas.width - padding * 2;
  const chartHeight = canvas.height - padding * 2;

  ctx.strokeStyle = "#64748b";
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, canvas.height - padding);
  ctx.lineTo(canvas.width - padding, canvas.height - padding);
  ctx.stroke();

  ctx.strokeStyle = "#3b82f6";
  ctx.lineWidth = 2;

  ctx.beginPath();

  entries.forEach((entry, index) => {
    const x =
      entries.length === 1
        ? canvas.width / 2
        : padding +
          (index / (entries.length - 1)) * chartWidth;

    const y =
      canvas.height -
      padding -
      (Number(entry.mood) / 100) * chartHeight;

    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  ctx.stroke();

  ctx.fillStyle = "#3b82f6";

  entries.forEach((entry, index) => {
    const x =
      entries.length === 1
        ? canvas.width / 2
        : padding +
          (index / (entries.length - 1)) * chartWidth;

    const y =
      canvas.height -
      padding -
      (Number(entry.mood) / 100) * chartHeight;

    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  });
}

// ----- Navigation -----
function showLog() {
  logPage?.classList.remove("hidden");
  historyPage?.classList.add("hidden");

  updateSummary();
  drawMoodChart();
}

function showHistory() {
  logPage?.classList.add("hidden");
  historyPage?.classList.remove("hidden");

  renderHistory();
  updateSummary();
}

// ----- Start App -----
document
  .getElementById("logBtn")
  ?.addEventListener("click", showLog);

document
  .getElementById("historyBtn")
  ?.addEventListener("click", showHistory);

document
  .getElementById("saveBtn")
  ?.addEventListener("click", saveEntry);

buildSliders();
renderHistory();
updateSummary();
showLog();

// ----- Offline app updates -----

function registerMyBrainServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  let isRefreshing = false;

  navigator.serviceWorker.addEventListener(
    "controllerchange",
    () => {
      if (isRefreshing) return;

      isRefreshing = true;
      window.location.reload();
    }
  );

  navigator.serviceWorker.register(
    "./sw.js?v=7",
    {
      updateViaCache: "none"
    }
  ).then(registration => {
    registration.update();
  }).catch(error => {
    console.error(
      "Could not register service worker:",
      error
    );
  });
}

registerMyBrainServiceWorker();
