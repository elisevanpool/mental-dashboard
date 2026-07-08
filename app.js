const trackers = [
  { id: "mood", name: "Mood", emoji: "😊", value: 50 },
  { id: "energy", name: "Energy", emoji: "⚡", value: 50 },
  { id: "anxiety", name: "Anxiety", emoji: "😰", value: 50 },
  { id: "ocd", name: "OCD", emoji: "🧠", value: 50 },
  { id: "focus", name: "Focus", emoji: "🎯", value: 50 }
];

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

function buildSliders() {
  const sliders = document.getElementById("sliders");

  trackers.forEach((tracker) => {
    sliders.innerHTML += `
      <div class="card">
        <div class="row">
          <span>${tracker.emoji} ${tracker.name}</span>
          <span id="${tracker.id}Value">${tracker.value}</span>
        </div>

        <input 
          id="${tracker.id}" 
          type="range" 
          min="0" 
          max="100" 
          value="${tracker.value}"
        />

        <div class="label" id="${tracker.id}Label"></div>
      </div>
    `;
  });

  trackers.forEach((tracker) => {
    const slider = document.getElementById(tracker.id);
    slider.addEventListener("input", () => updateSlider(tracker.id));
    updateSlider(tracker.id);
  });
}

function updateSlider(id) {
  const slider = document.getElementById(id);
  const value = Number(slider.value);

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
  const [moodText, moodEmoji] = moodLabel(mood);

  const entry = {
    timestamp: new Date().toISOString(),
    mood,
    moodLabel: moodText,
    moodEmoji,
    energy: Number(document.getElementById("energy").value),
    anxiety: Number(document.getElementById("anxiety").value),
    ocd: Number(document.getElementById("ocd").value),
    focus: Number(document.getElementById("focus").value),
    notes: document.getElementById("notes").value
  };

  const entries = JSON.parse(localStorage.getItem("entries") || "[]");
  entries.unshift(entry);
  localStorage.setItem("entries", JSON.stringify(entries));
renderHistory();
  document.getElementById("notes").value = "";
  document.getElementById("savedMessage").style.opacity = 1;

  setTimeout(() => {
    document.getElementById("savedMessage").style.opacity = 0;
  }, 1400);
}

document.getElementById("saveBtn").addEventListener("click", saveEntry);
function renderHistory() {
  const historyList = document.getElementById("historyList");
  if (!historyList) return;

  const entries = JSON.parse(localStorage.getItem("entries") || "[]");

  if (entries.length === 0) {
    historyList.innerHTML = "<p>No entries yet.</p>";
    return;
  }

  historyList.innerHTML = entries.map(entry => `
    <div class="history-card">
      <div class="history-date">
        ${new Date(entry.timestamp).toLocaleString()}
      </div>

      <strong>${entry.moodEmoji} ${entry.moodLabel}</strong><br>

      😊 Mood: ${entry.mood}<br>
      ⚡ Energy: ${entry.energy}<br>
      😰 Anxiety: ${entry.anxiety}<br>
      🧠 OCD: ${entry.ocd}<br>
      🎯 Focus: ${entry.focus}

      ${entry.notes ? `<p>${entry.notes}</p>` : ""}
    </div>
  `).join("");
}

document.getElementById("historyTab").onclick = () => {
  document.getElementById("historyPage").classList.remove("hidden");
  renderHistory();
};

document.getElementById("dashboardTab").onclick = () => {
  document.getElementById("historyPage").classList.add("hidden");
};
buildSliders();