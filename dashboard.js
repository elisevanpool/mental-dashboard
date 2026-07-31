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