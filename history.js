function renderHistory() {
  const entries = getEntries();

  if (entries.length === 0) {
    historyList.innerHTML = "<p>No entries yet.</p>";
    return;
  }

  historyList.innerHTML = entries.map(entry => `
    <div class="history-card">
      <div class="history-date">
        ${new Date(entry.timestamp).toLocaleString()}
      </div>

      <h3>${entry.moodEmoji} ${entry.moodLabel}</h3>

      <p>😊 Mood: ${entry.mood}</p>
      <p>⚡ Energy: ${entry.energy}</p>
      <p>😰 Anxiety: ${entry.anxiety}</p>
      <p>🧠 OCD: ${entry.ocd}</p>
      <p>🎯 Focus: ${entry.focus}</p>

      ${entry.notes ? `<p>📝 ${entry.notes}</p>` : ""}

      <button class="delete-btn" onclick="deleteEntry(${entry.id})">
        Delete
      </button>
    </div>
  `).join("");
}

function deleteEntry(id) {
  const entries = getEntries().filter(entry => entry.id !== id);
  saveEntries(entries);
  renderHistory();
  updateSummary();
}