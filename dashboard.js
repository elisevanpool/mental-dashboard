function updateSummary() {
  const entries = getEntries();

  const entryCount = document.getElementById("entryCount");
  const averageMood = document.getElementById("averageMood");
  const latestEntry = document.getElementById("latestEntry");

  if (!entryCount || !averageMood || !latestEntry) {
    return;
  }

  const today = new Date().toDateString();

  const todayEntries = entries.filter(entry => {
    return new Date(entry.timestamp).toDateString() === today;
  });

  entryCount.textContent =
    `${todayEntries.length} ${
      todayEntries.length === 1 ? "entry" : "entries"
    }`;

  if (todayEntries.length === 0) {
    averageMood.textContent = "Average mood: —";
    latestEntry.textContent = "Last check-in: —";
    return;
  }

  const average = Math.round(
    todayEntries.reduce((sum, entry) => {
      return sum + Number(entry.mood);
    }, 0) / todayEntries.length
  );

  averageMood.textContent = `Average mood: ${average}`;

  const newestEntry = todayEntries.reduce((latest, current) => {
    return new Date(current.timestamp) >
      new Date(latest.timestamp)
      ? current
      : latest;
  });

  latestEntry.textContent =
    `Last check-in: ${new Date(
      newestEntry.timestamp
    ).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit"
    })}`;
}

updateSummary();