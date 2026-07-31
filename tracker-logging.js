const TRACKER_LOGS_STORAGE_KEY = "trackerLogs";

function getTrackerLogs() {
  try {
    return JSON.parse(
      localStorage.getItem(TRACKER_LOGS_STORAGE_KEY) || "{}"
    );
  } catch (error) {
    console.error("Could not load tracker logs:", error);
    return {};
  }
}

function saveTrackerLogs(logs) {
  localStorage.setItem(
    TRACKER_LOGS_STORAGE_KEY,
    JSON.stringify(logs)
  );
}

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getTrackerLogDates(trackerId) {
  const logs = getTrackerLogs();
  const trackerLogs = logs[trackerId] || {};

  return Object.keys(trackerLogs).filter(dateString => {
    return trackerLogs[dateString] === true;
  });
}

function isHabitCompleteForDate(
  trackerId,
  dateString = getLocalDateString()
) {
  const logs = getTrackerLogs();

  return logs[trackerId]?.[dateString] === true;
}

function setHabitCompletion(
  trackerId,
  dateString,
  completed
) {
  const logs = getTrackerLogs();

  if (!logs[trackerId]) {
    logs[trackerId] = {};
  }

  if (completed) {
    logs[trackerId][dateString] = true;
  } else {
    delete logs[trackerId][dateString];
  }

  saveTrackerLogs(logs);
}

function toggleHabitForToday(trackerId) {
  const today = getLocalDateString();

  const currentlyComplete = isHabitCompleteForDate(
    trackerId,
    today
  );

  setHabitCompletion(
    trackerId,
    today,
    !currentlyComplete
  );

  return !currentlyComplete;
}

function getPreviousDateString(dateString, numberOfDays = 1) {
  const date = new Date(`${dateString}T12:00:00`);

  date.setDate(date.getDate() - numberOfDays);

  return getLocalDateString(date);
}

function getCurrentHabitStreak(trackerId) {
  let streak = 0;
  let dateString = getLocalDateString();

  /*
    A streak should not immediately disappear before
    today's habit has been completed.

    If today is incomplete, begin counting from yesterday.
  */
  if (!isHabitCompleteForDate(trackerId, dateString)) {
    dateString = getPreviousDateString(dateString);
  }

  while (isHabitCompleteForDate(trackerId, dateString)) {
    streak += 1;
    dateString = getPreviousDateString(dateString);
  }

  return streak;
}

function getBestHabitStreak(trackerId) {
  const completedDates = getTrackerLogDates(trackerId)
    .sort();

  if (completedDates.length === 0) {
    return 0;
  }

  let bestStreak = 1;
  let currentStreak = 1;

  for (
    let index = 1;
    index < completedDates.length;
    index += 1
  ) {
    const previousDate = completedDates[index - 1];
    const currentDate = completedDates[index];

    const expectedDate = getPreviousDateString(
      currentDate,
      1
    );

    if (expectedDate === previousDate) {
      currentStreak += 1;
      bestStreak = Math.max(bestStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return bestStreak;
}

function getRecentHabitDays(trackerId, numberOfDays = 7) {
  const recentDays = [];

  for (
    let daysAgo = 0;
    daysAgo < numberOfDays;
    daysAgo += 1
  ) {
    const date = new Date();

    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - daysAgo);

    const dateString = getLocalDateString(date);

    recentDays.push({
      dateString,
      completed: isHabitCompleteForDate(
        trackerId,
        dateString
      ),
      label:
        daysAgo === 0
          ? "Today"
          : daysAgo === 1
            ? "Yesterday"
            : date.toLocaleDateString(undefined, {
                weekday: "long"
              })
    });
  }

  return recentDays;
}

function renderHabitTrackerScreen(tracker) {
  const completedToday = isHabitCompleteForDate(
    tracker.id
  );

  const currentStreak = getCurrentHabitStreak(
    tracker.id
  );

  const bestStreak = getBestHabitStreak(
    tracker.id
  );

  const recentDays = getRecentHabitDays(
    tracker.id,
    7
  );

  openSubpage(`
    <section class="subpage">

      <header class="subpage-header">
        <button
          id="habitTrackerBackBtn"
          class="subpage-back-btn"
          type="button"
        >
          ← Back
        </button>

        <h2>${tracker.icon} ${tracker.name}</h2>
      </header>

      <section class="habit-today-card">

        <div class="habit-today-label">
          Today
        </div>

        <div class="habit-today-status">
          ${
            completedToday
              ? "Completed ✓"
              : "Not completed yet"
          }
        </div>

        <button
          id="toggleHabitBtn"
          class="toggle-habit-btn ${
            completedToday ? "completed" : ""
          }"
          type="button"
        >
          ${
            completedToday
              ? "✓ Completed Today"
              : "Mark Complete for Today"
          }
        </button>

      </section>

      <section class="habit-stats-grid">

        <div class="habit-stat-card">
          <span class="habit-stat-icon">🔥</span>

          <span class="habit-stat-number">
            ${currentStreak}
          </span>

          <span class="habit-stat-label">
            Current streak
          </span>
        </div>

        <div class="habit-stat-card">
          <span class="habit-stat-icon">🏆</span>

          <span class="habit-stat-number">
            ${bestStreak}
          </span>

          <span class="habit-stat-label">
            Best streak
          </span>
        </div>

      </section>
<section class="scale-chart">

  <h3>Last 7 Days</h3>

  <div class="scale-chart-bars">

    ${recentDays
      .slice()
      .reverse()
      .map(day => {
        return `
          <div class="scale-bar-column">

            <div
              class="scale-bar"
              style="height: ${Math.max(
                day.value,
                4
              )}%"
            ></div>

            <span class="scale-bar-label">
              ${day.label.slice(0, 3)}
            </span>

          </div>
        `;
      })
      .join("")}

  </div>

</section>
      <section class="habit-history-section">

        <h3>Recent Days</h3>

        <div class="habit-history-list">

          ${recentDays
            .map(day => {
              const date = new Date(
                `${day.dateString}T12:00:00`
              );

              const formattedDate =
                date.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric"
                });

              return `
                <div class="habit-history-row">

                  <div>
                    <div class="habit-history-label">
                      ${day.label}
                    </div>

                    <div class="habit-history-date">
                      ${formattedDate}
                    </div>
                  </div>

                  <button
                    class="habit-history-toggle ${
                      day.completed ? "completed" : ""
                    }"
                    type="button"
                    data-habit-date="${day.dateString}"
                    aria-label="Toggle ${day.label}"
                  >
                    ${day.completed ? "✓" : "—"}
                  </button>

                </div>
              `;
            })
            .join("")}

        </div>

      </section>

    </section>
  `);

  document
    .getElementById("habitTrackerBackBtn")
    .addEventListener("click", renderTrackersHub);

  document
    .getElementById("toggleHabitBtn")
    .addEventListener("click", () => {
      toggleHabitForToday(tracker.id);
      renderHabitTrackerScreen(tracker);
    });

  document
    .querySelectorAll("[data-habit-date]")
    .forEach(button => {
      button.addEventListener("click", event => {
        const dateString =
          event.currentTarget.dataset.habitDate;

        const currentlyComplete =
          isHabitCompleteForDate(
            tracker.id,
            dateString
          );

        setHabitCompletion(
          tracker.id,
          dateString,
          !currentlyComplete
        );

        renderHabitTrackerScreen(tracker);
      });
    });
}

function getScaleValue(trackerId, dateString = getLocalDateString()) {
  const logs = getTrackerLogs();

  return logs[trackerId]?.[dateString] ?? 50;
}

function setScaleValue(
  trackerId,
  value,
  dateString = getLocalDateString()
) {
  const logs = getTrackerLogs();

  if (!logs[trackerId]) {
    logs[trackerId] = {};
  }

  logs[trackerId][dateString] = Number(value);

  saveTrackerLogs(logs);
}

function getRecentScaleDays(trackerId, numberOfDays = 7) {
  const days = [];

  for (let i = 0; i < numberOfDays; i++) {
    const date = new Date();

    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - i);

    const dateString = getLocalDateString(date);

    days.push({
      label:
        i === 0
          ? "Today"
          : i === 1
          ? "Yesterday"
          : date.toLocaleDateString(undefined, {
              weekday: "long"
            }),

      value: getScaleValue(trackerId, dateString)
    });
  }

  return days;
}

function renderScaleTrackerScreen(tracker) {
  const currentValue = getScaleValue(tracker.id);
  const recentDays = getRecentScaleDays(tracker.id);

  openSubpage(`
    <section class="subpage">

      <header class="subpage-header">
        <button
          id="scaleBackBtn"
          class="subpage-back-btn"
          type="button"
        >
          ← Back
        </button>

        <h2>${tracker.icon} ${tracker.name}</h2>
      </header>

      <section class="habit-today-card">

        <div class="habit-today-label">
          Today's rating
        </div>

        <div
          id="scaleValueLabel"
          class="scale-value-label"
        >
          ${currentValue}
        </div>

        <input
          id="scaleSlider"
          class="scale-slider"
          type="range"
          min="0"
          max="100"
          value="${currentValue}"
        >

        <p
          id="scaleSaveMessage"
          class="scale-save-message"
        >
          Saved automatically
        </p>

      </section>

      <section class="scale-chart">

        <h3>Last 7 Days</h3>

        <div class="scale-chart-bars">

          ${recentDays
            .slice()
            .reverse()
            .map(day => {
              const isToday = day.label === "Today";

              return `
                <div class="scale-bar-column">

                  <div
                    ${isToday ? 'id="todayScaleBar"' : ""}
                    class="scale-bar"
                    style="height: ${Math.max(
                      Number(day.value),
                      4
                    )}%"
                  ></div>

                  <span class="scale-bar-label">
                    ${day.label.slice(0, 3)}
                  </span>

                </div>
              `;
            })
            .join("")}

        </div>

      </section>

      <section class="habit-history-section">

        <h3>Recent Days</h3>

        <div class="habit-history-list">

          ${recentDays
            .map(day => {
              const isToday = day.label === "Today";

              return `
                <div class="habit-history-row">

                  <span>
                    ${day.label}
                  </span>

                  <strong
                    ${isToday ? 'id="todayScaleHistoryValue"' : ""}
                  >
                    ${day.value}
                  </strong>

                </div>
              `;
            })
            .join("")}

        </div>

      </section>

    </section>
  `);

  const backButton =
    document.getElementById("scaleBackBtn");

  const slider =
    document.getElementById("scaleSlider");

  const valueLabel =
    document.getElementById("scaleValueLabel");

  const todayBar =
    document.getElementById("todayScaleBar");

  const todayHistoryValue =
    document.getElementById("todayScaleHistoryValue");

  const saveMessage =
    document.getElementById("scaleSaveMessage");

  backButton.addEventListener("click", renderTrackersHub);

  slider.addEventListener("input", () => {
    const newValue = Number(slider.value);

    valueLabel.textContent = newValue;

    setScaleValue(
      tracker.id,
      newValue
    );

    if (todayBar) {
      todayBar.style.height =
        `${Math.max(newValue, 4)}%`;
    }

    if (todayHistoryValue) {
      todayHistoryValue.textContent = newValue;
    }

    if (saveMessage) {
      saveMessage.textContent = "Saved ✓";

      clearTimeout(
        renderScaleTrackerScreen.saveMessageTimer
      );

      renderScaleTrackerScreen.saveMessageTimer =
        setTimeout(() => {
          saveMessage.textContent =
            "Saved automatically";
        }, 1000);
    }
  });
}