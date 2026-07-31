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

// ----- Helpers -----






// ----- Sliders -----
function buildSliders() {
  sliders.innerHTML = "";

  trackers.forEach(tracker => {
    sliders.innerHTML += `
      <div class="card">
  <div class="tracker-header">
    <span class="tracker-title">
      ${tracker.emoji} ${tracker.name}
    </span>

    <span class="tracker-value" id="${tracker.id}Value">
      50
    </span>
  </div>

  <div class="small" id="${tracker.id}Label">
    50/100
  </div>

  <input id="${tracker.id}" type="range" min="0" max="100" value="50">
</div>
    `;
  });

  trackers.forEach(tracker => {
    const input = document.getElementById(tracker.id);
    input.addEventListener("input", () => updateSlider(tracker.id));
    updateSlider(tracker.id);
  });
}

function updateSlider(id) {
  const value = Number(document.getElementById(id).value);
  document.getElementById(`${id}Value`).textContent = value;

  if (id === "mood") {
    const [label, emoji] = moodLabel(value);
    document.getElementById(`${id}Label`).textContent = `${emoji} ${label}`;
  } else {
    document.getElementById(`${id}Label`).textContent = `${value}/100`;
  }
}

// ----- Save Entry -----
function saveEntry() {
  const mood = Number(document.getElementById("mood").value);
  const [label, emoji] = moodLabel(mood);

  const entry = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    mood,
    moodLabel: label,
    moodEmoji: emoji,
    energy: Number(document.getElementById("energy").value),
    anxiety: Number(document.getElementById("anxiety").value),
    ocd: Number(document.getElementById("ocd").value),
    focus: Number(document.getElementById("focus").value),
    notes: notes.value.trim()
  };

  const entries = getEntries();
  entries.unshift(entry);
  saveEntries(entries);

  notes.value = "";
  saved.style.opacity = "1";

  setTimeout(() => {
    saved.style.opacity = "0";
  }, 1200);

  renderHistory();
  updateSummary();
}
// ----- Chart -----
function drawMoodChart() {
  const canvas = document.getElementById("moodChart");

  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const entries = getEntries().slice(0, 10).reverse();

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (entries.length === 0) {
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
      "Log some moods to see your trend.",
      canvas.width / 2,
      canvas.height / 2
    );
    return;
  }

  const padding = 35;
  const chartWidth = canvas.width - padding * 2;
  const chartHeight = canvas.height - padding * 2;

  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, canvas.height - padding);
  ctx.lineTo(canvas.width - padding, canvas.height - padding);
  ctx.stroke();

  ctx.beginPath();

  entries.forEach((entry, index) => {
    const x =
      entries.length === 1
        ? canvas.width / 2
        : padding + (index / (entries.length - 1)) * chartWidth;

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

  entries.forEach((entry, index) => {
    const x =
      entries.length === 1
        ? canvas.width / 2
        : padding + (index / (entries.length - 1)) * chartWidth;

    const y =
      canvas.height -
      padding -
      (Number(entry.mood) / 100) * chartHeight;

    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
}
// ----- History -----

function updateSummary() {
  entryCount.textContent = `${entries.length} ${entries.length === 1 ? "entry" : "entries"}`;

  if (entries.length === 0) {
    averageMood.textContent = "Average mood: —";
    latestEntry.textContent = "Last check-in: —";
    return;
  }

  const average = Math.round(
    entries.reduce((sum, entry) => sum + Number(entry.mood), 0) / entries.length
  );

  averageMood.textContent = `Average mood: ${average}/10`;

  const newestEntry = entries[entries.length - 1];
  latestEntry.textContent = `Last check-in: ${newestEntry.date}`;
}

// ----- Navigation -----



function showLog() {
  logPage.classList.remove("hidden");
  historyPage.classList.add("hidden");
  drawMoodChart();
}

function showHistory() {
  logPage.classList.add("hidden");
  historyPage.classList.remove("hidden");
renderHistory();
updateSummary();
drawMoodChart();
}

// ----- Start App -----
document.getElementById("logBtn").addEventListener("click", showLog);
document.getElementById("historyBtn").addEventListener("click", showHistory);
document.getElementById("saveBtn").addEventListener("click", saveEntry);

buildSliders();
renderHistory();
updateSummary();
showLog();