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
        <div class="row">
          <span>${tracker.emoji} ${tracker.name}</span>
          <span id="${tracker.id}Value">50</span>
        </div>

        <input id="${tracker.id}" type="range" min="0" max="100" value="50">

        <div class="small" id="${tracker.id}Label">50/100</div>
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

// ----- History -----




// ----- Summary -----
function updateSummary() {
  const entries = getEntries();

  const entryCount = document.getElementById("entryCount");
  const averageMood = document.getElementById("averageMood");
  const latestEntry = document.getElementById("latestEntry");

  if (!entryCount || !averageMood || !latestEntry) return;

  entryCount.textContent =
    `${entries.length} ${entries.length === 1 ? "entry" : "entries"}`;

  if (entries.length === 0) {
    averageMood.textContent = "Average mood: —";
    latestEntry.textContent = "Last check-in: —";
    return;
  }

  const average = Math.round(
    entries.reduce((sum, entry) => sum + Number(entry.mood), 0) / entries.length
  );

  averageMood.textContent = `Average mood: ${average}`;
  latestEntry.textContent =
    `Last check-in: ${new Date(entries[0].timestamp).toLocaleString()}`;
}

// ----- Navigation -----
function showLog() {
  logPage.classList.remove("hidden");
  historyPage.classList.add("hidden");
}

function showHistory() {
  logPage.classList.add("hidden");
  historyPage.classList.remove("hidden");
  renderHistory();
  updateSummary();
}

// ----- Start App -----
document.getElementById("logBtn").addEventListener("click", showLog);
document.getElementById("historyBtn").addEventListener("click", showHistory);
document.getElementById("saveBtn").addEventListener("click", saveEntry);

buildSliders();
renderHistory();
updateSummary();
showLog();