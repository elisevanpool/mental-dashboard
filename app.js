const trackers = [
  { id: "mood", name: "Mood", emoji: "😊" },
  { id: "energy", name: "Energy", emoji: "⚡" },
  { id: "anxiety", name: "Anxiety", emoji: "😰" },
  { id: "ocd", name: "OCD", emoji: "🧠" },
  { id: "focus", name: "Focus", emoji: "🎯" }
];

const sliders = document.getElementById("sliders");
const logPage = document.getElementById("logPage");
const historyPage = document.getElementById("historyPage");
const historyList = document.getElementById("historyList");
const notes = document.getElementById("notes");
const saved = document.getElementById("saved");

function moodLabel(value) {
  if (value <= 10) return ["Crisis", "😭"];
  if (value <= 20) return ["Panic", "😰"];
  if (value <= 35) return ["Distressed", "😟"];
  if (value <= 45) return ["Low", "🙁"];
  if (value <= 55) return ["Baseline", "😐"];
  if (value <= 70) return ["Calm", "🙂"];
  if (value <= 85) return ["Happy", "😄"];
  return ["Amazing", "🤩"];
}

function getEntries() {
  return JSON.parse(localStorage.getItem("entries") || "[]");
}

function saveEntries(entries) {
  localStorage.setItem("entries", JSON.stringify(entries));
}

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
  setTimeout(() => saved.style.opacity = "0", 1200);

  renderHistory();
}

function renderHistory() {
  const entries = getEntries();

  if (entries.length === 0) {
    historyList.innerHTML = "<p>No entries yet.</p>";
    return;
  }

  historyList.innerHTML = entries.map(entry => `
    <div class="history-card">
      <div class="history-date">${new Date(entry.timestamp).toLocaleString()}</div>
      <h3>${entry.moodEmoji} ${entry.moodLabel}</h3>
      <p>😊 Mood: ${entry.mood}</p>
      <p>⚡ Energy: ${entry.energy}</p>
      <p>😰 Anxiety: ${entry.anxiety}</p>
      <p>🧠 OCD: ${entry.ocd}</p>
      <p>🎯 Focus: ${entry.focus}</p>
      ${entry.notes ? `<p>📝 ${entry.notes}</p>` : ""}
      <button class="delete-btn" onclick="deleteEntry(${entry.id})">Delete</button>
    </div>
  `).join("");
}

function deleteEntry(id) {
  const entries = getEntries().filter(entry => entry.id !== id);
  saveEntries(entries);
  renderHistory();
}

function showLog() {
  logPage.classList.remove("hidden");
  historyPage.classList.add("hidden");
}

function showHistory() {
  logPage.classList.add("hidden");
  historyPage.classList.remove("hidden");
  renderHistory();
}

document.getElementById("logBtn").addEventListener("click", showLog);
document.getElementById("historyBtn").addEventListener("click", showHistory);
document.getElementById("saveBtn").addEventListener("click", saveEntry);

buildSliders();
renderHistory();
showLog();