// =====================
// Tracker Logging
// =====================

const TRACKER_LOGS_STORAGE_KEY = "trackerLogs";

// ----- General storage -----

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

function getPreviousDateString(
  dateString,
  numberOfDays = 1
) {
  const date = new Date(`${dateString}T12:00:00`);

  date.setDate(date.getDate() - numberOfDays);

  return getLocalDateString(date);
}

function escapeTrackerHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// =========================================================
// HABIT TRACKERS
// =========================================================

function getTrackerLogDates(trackerId) {
  const logs = getTrackerLogs();
  const trackerLogs = logs[trackerId];

  if (
    !trackerLogs ||
    Array.isArray(trackerLogs) ||
    typeof trackerLogs !== "object"
  ) {
    return [];
  }

  return Object.keys(trackerLogs).filter(dateString => {
    return trackerLogs[dateString] === true;
  });
}

function isHabitCompleteForDate(
  trackerId,
  dateString = getLocalDateString()
) {
  const logs = getTrackerLogs();
  const trackerLogs = logs[trackerId];

  if (
    !trackerLogs ||
    Array.isArray(trackerLogs) ||
    typeof trackerLogs !== "object"
  ) {
    return false;
  }

  return trackerLogs[dateString] === true;
}

function setHabitCompletion(
  trackerId,
  dateString,
  completed
) {
  const logs = getTrackerLogs();

  if (
    !logs[trackerId] ||
    Array.isArray(logs[trackerId]) ||
    typeof logs[trackerId] !== "object"
  ) {
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

function getCurrentHabitStreak(trackerId) {
  let streak = 0;
  let dateString = getLocalDateString();

  /*
    Do not erase an active streak merely because today's
    habit has not been completed yet.
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

    const expectedPreviousDate = getPreviousDateString(
      currentDate
    );

    if (expectedPreviousDate === previousDate) {
      currentStreak += 1;
      bestStreak = Math.max(bestStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return bestStreak;
}

function getRecentHabitDays(
  trackerId,
  numberOfDays = 7
) {
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

        <h2>
          ${escapeTrackerHtml(tracker.icon)}
          ${escapeTrackerHtml(tracker.name)}
        </h2>

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

          <span class="habit-stat-icon">
            🔥
          </span>

          <span class="habit-stat-number">
            ${currentStreak}
          </span>

          <span class="habit-stat-label">
            Current streak
          </span>

        </div>

        <div class="habit-stat-card">

          <span class="habit-stat-icon">
            🏆
          </span>

          <span class="habit-stat-number">
            ${bestStreak}
          </span>

          <span class="habit-stat-label">
            Best streak
          </span>

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
                      day.completed
                        ? "completed"
                        : ""
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
    ?.addEventListener(
      "click",
      renderTrackersHub
    );

  document
    .getElementById("toggleHabitBtn")
    ?.addEventListener("click", () => {
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

// =========================================================
// SCALE TRACKERS
// =========================================================

/*
  New scale-data format:

  logs[trackerId] = [
    {
      id: 123,
      value: 7,
      timestamp: "2026-07-31T16:18:00.000Z",
      dateString: "2026-07-31"
    }
  ];

  Older versions stored one number per date. The migration
  below converts those values into timestamped entries.
*/

function migrateOldScaleLogs(trackerId) {
  const logs = getTrackerLogs();
  const trackerLogs = logs[trackerId];

  if (!trackerLogs) {
    return [];
  }

  if (Array.isArray(trackerLogs)) {
    return trackerLogs;
  }

  if (typeof trackerLogs !== "object") {
    return [];
  }

  const migratedEntries = [];

  Object.entries(trackerLogs).forEach(
    ([dateString, storedValue], index) => {
      if (
        typeof storedValue !== "number" &&
        typeof storedValue !== "string"
      ) {
        return;
      }

      const oldValue = Number(storedValue);

      if (Number.isNaN(oldValue)) {
        return;
      }

      /*
        Old values were on a 0–100 scale.
        Convert them to the new 1–10 scale.
      */
      const convertedValue = Math.min(
        10,
        Math.max(
          1,
          Math.round(oldValue / 10)
        )
      );

      migratedEntries.push({
        id: Date.now() + index,
        value: convertedValue,
        timestamp: `${dateString}T12:00:00.000Z`,
        dateString,
        migrated: true
      });
    }
  );

  logs[trackerId] = migratedEntries;
  saveTrackerLogs(logs);

  return migratedEntries;
}

function getScaleEntries(trackerId) {
  const logs = getTrackerLogs();
  let trackerLogs = logs[trackerId];

  if (
    trackerLogs &&
    !Array.isArray(trackerLogs)
  ) {
    trackerLogs = migrateOldScaleLogs(trackerId);
  }

  if (!Array.isArray(trackerLogs)) {
    return [];
  }

  return [...trackerLogs].sort((entryA, entryB) => {
    return (
      new Date(entryB.timestamp) -
      new Date(entryA.timestamp)
    );
  });
}

function saveScaleCheckIn(
  trackerId,
  value,
  timestamp = new Date()
) {
  const logs = getTrackerLogs();

  let trackerEntries = logs[trackerId];

  if (
    trackerEntries &&
    !Array.isArray(trackerEntries)
  ) {
    trackerEntries = migrateOldScaleLogs(trackerId);

    /*
      Migration saved a fresh copy, so reload it.
    */
    const migratedLogs = getTrackerLogs();
    trackerEntries = migratedLogs[trackerId];
  }

  if (!Array.isArray(trackerEntries)) {
    trackerEntries = [];
  }

  const safeValue = Math.min(
    10,
    Math.max(1, Number(value))
  );

  const timestampDate =
    timestamp instanceof Date
      ? timestamp
      : new Date(timestamp);

  trackerEntries.push({
    id: Date.now(),
    value: safeValue,
    timestamp: timestampDate.toISOString(),
    dateString: getLocalDateString(timestampDate)
  });

  logs[trackerId] = trackerEntries;
  saveTrackerLogs(logs);
}

function deleteScaleCheckIn(
  trackerId,
  checkInId
) {
  const logs = getTrackerLogs();

  const trackerEntries = getScaleEntries(
    trackerId
  );

  logs[trackerId] = trackerEntries.filter(entry => {
    return Number(entry.id) !== Number(checkInId);
  });

  saveTrackerLogs(logs);
}

function getScaleEntriesForDate(
  trackerId,
  dateString
) {
  return getScaleEntries(trackerId).filter(entry => {
    return entry.dateString === dateString;
  });
}

function getTodayScaleEntries(trackerId) {
  return getScaleEntriesForDate(
    trackerId,
    getLocalDateString()
  );
}

function getScaleAverage(entries) {
  if (!entries.length) {
    return null;
  }

  const total = entries.reduce((sum, entry) => {
    return sum + Number(entry.value);
  }, 0);

  return Math.round(
    (total / entries.length) * 10
  ) / 10;
}

function getScaleHighest(entries) {
  if (!entries.length) {
    return null;
  }

  return Math.max(
    ...entries.map(entry => Number(entry.value))
  );
}

/*
  Kept for compatibility with the existing Insights page.

  It returns the average value recorded on a date instead
  of pretending there can only be one value per day.
*/
function getScaleValue(
  trackerId,
  dateString = getLocalDateString()
) {
  const entries = getScaleEntriesForDate(
    trackerId,
    dateString
  );

  return getScaleAverage(entries);
}

function getScaleDefinition(tracker) {
  const definitions = {
    loneliness: {
      lowLabel: "Not lonely",
      highLabel: "Extremely lonely",
      labels: {
        1: "Not lonely",
        2: "Barely lonely",
        3: "A little lonely",
        4: "Somewhat lonely",
        5: "Moderately lonely",
        6: "Noticeably lonely",
        7: "Very lonely",
        8: "Intensely lonely",
        9: "Overwhelmingly lonely",
        10: "Extremely lonely"
      }
    },

    "social-battery": {
      lowLabel: "Completely empty",
      highLabel: "Completely full",
      labels: {
        1: "Completely empty",
        2: "Almost empty",
        3: "Very drained",
        4: "Drained",
        5: "Half full",
        6: "Some energy",
        7: "Socially available",
        8: "Energized",
        9: "Very energized",
        10: "Completely full"
      }
    },

    appetite: {
      lowLabel: "No appetite",
      highLabel: "Extremely hungry",
      labels: {
        1: "No appetite",
        2: "Almost none",
        3: "Very low",
        4: "Low",
        5: "Moderate",
        6: "Somewhat hungry",
        7: "Hungry",
        8: "Very hungry",
        9: "Extremely hungry",
        10: "Famished"
      }
    },

    "urge-to-text": {
      lowLabel: "No urge",
      highLabel: "Overwhelming urge",
      labels: {
        1: "No urge",
        2: "Barely noticeable",
        3: "Small urge",
        4: "Manageable urge",
        5: "Moderate urge",
        6: "Distracting urge",
        7: "Strong urge",
        8: "Very strong urge",
        9: "Intense urge",
        10: "Overwhelming urge"
      }
    }
  };

  return definitions[tracker.id] || {
    lowLabel: "Low",
    highLabel: "High",
    labels: {
      1: "Very low",
      2: "Low",
      3: "Somewhat low",
      4: "A little low",
      5: "Middle",
      6: "A little high",
      7: "Somewhat high",
      8: "High",
      9: "Very high",
      10: "Maximum"
    }
  };
}

function formatScaleCheckInTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString(
    [],
    {
      hour: "numeric",
      minute: "2-digit"
    }
  );
}

function renderScaleTrackerScreen(tracker) {
  const todayEntries = getTodayScaleEntries(
    tracker.id
  );

  const recentEntries = getScaleEntries(
    tracker.id
  ).slice(0, 30);

  const todayAverage = getScaleAverage(
    todayEntries
  );

  const todayHighest = getScaleHighest(
    todayEntries
  );

  const definition = getScaleDefinition(
    tracker
  );

  const startingValue =
    todayEntries.length > 0
      ? Number(todayEntries[0].value)
      : 5;

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

        <h2>
          ${escapeTrackerHtml(tracker.icon)}
          ${escapeTrackerHtml(tracker.name)}
        </h2>

      </header>

      <section class="scale-checkin-card">

        <div class="scale-checkin-heading">
          New Check-In
        </div>

        <div class="scale-current-display">

          <strong id="scaleValueLabel">
            ${startingValue}
          </strong>

          <span>/ 10</span>

        </div>

        <div
          id="scaleMeaningLabel"
          class="scale-meaning-label"
        >
          ${
            definition.labels[startingValue] ||
            ""
          }
        </div>

        <input
          id="scaleSlider"
          class="scale-slider"
          type="range"
          min="1"
          max="10"
          step="1"
          value="${startingValue}"
          list="scaleCheckpoints"
        >

        <datalist id="scaleCheckpoints">
          ${Array.from(
            { length: 10 },
            (_, index) => {
              const number = index + 1;

              return `
                <option value="${number}">
                  ${number}
                </option>
              `;
            }
          ).join("")}
        </datalist>

        <div class="scale-number-row">

          ${Array.from(
            { length: 10 },
            (_, index) => {
              return `
                <span>${index + 1}</span>
              `;
            }
          ).join("")}

        </div>

        <div class="scale-end-labels">

          <span>
            ${escapeTrackerHtml(
              definition.lowLabel
            )}
          </span>

          <span>
            ${escapeTrackerHtml(
              definition.highLabel
            )}
          </span>

        </div>

        <button
          id="saveScaleCheckInBtn"
          class="save-scale-checkin-btn"
          type="button"
        >
          Save Check-In
        </button>

        <p
          id="scaleCheckInMessage"
          class="scale-checkin-message"
        ></p>

      </section>

      <section class="scale-today-summary">

        <h3>Today</h3>

        <div class="scale-summary-grid">

          <div class="scale-summary-card">

            <span>Check-ins</span>

            <strong>
              ${todayEntries.length}
            </strong>

          </div>

          <div class="scale-summary-card">

            <span>Average</span>

            <strong>
              ${
                todayAverage === null
                  ? "—"
                  : todayAverage
              }
            </strong>

          </div>

          <div class="scale-summary-card">

            <span>Highest</span>

            <strong>
              ${
                todayHighest === null
                  ? "—"
                  : todayHighest
              }
            </strong>

          </div>

        </div>

        <div class="scale-checkin-list">

          ${
            todayEntries.length === 0
              ? `
                <p class="empty-state">
                  No check-ins recorded today yet.
                </p>
              `
              : todayEntries
                  .map(entry => `
                    <div class="scale-checkin-row">

                      <div>

                        <div class="scale-checkin-time">
                          ${formatScaleCheckInTime(
                            entry.timestamp
                          )}
                        </div>

                        <div class="scale-checkin-meaning">
                          ${escapeTrackerHtml(
                            definition.labels[
                              entry.value
                            ] || ""
                          )}
                        </div>

                      </div>

                      <div class="scale-checkin-value">
                        ${entry.value}
                      </div>

                      <button
                        class="delete-scale-checkin-btn"
                        type="button"
                        data-delete-scale-entry="${entry.id}"
                        aria-label="Delete check-in"
                      >
                        ×
                      </button>

                    </div>
                  `)
                  .join("")
          }

        </div>

      </section>

      <section class="scale-recent-section">

        <h3>Recent Check-Ins</h3>

        <div class="scale-recent-list">

          ${
            recentEntries.length === 0
              ? `
                <p class="empty-state">
                  Your recent entries will appear here.
                </p>
              `
              : recentEntries
                  .map(entry => {
                    const entryDate =
                      new Date(entry.timestamp);

                    return `
                      <div class="scale-recent-row">

                        <div>

                          <div class="scale-recent-date">
                            ${entryDate.toLocaleDateString(
                              undefined,
                              {
                                weekday: "short",
                                month: "short",
                                day: "numeric"
                              }
                            )}
                          </div>

                          <div class="scale-recent-time">
                            ${formatScaleCheckInTime(
                              entry.timestamp
                            )}
                          </div>

                        </div>

                        <strong>
                          ${entry.value} / 10
                        </strong>

                      </div>
                    `;
                  })
                  .join("")
          }

        </div>

      </section>

    </section>
  `);

  const slider =
    document.getElementById("scaleSlider");

  const valueLabel =
    document.getElementById("scaleValueLabel");

  const meaningLabel =
    document.getElementById("scaleMeaningLabel");

  const message =
    document.getElementById("scaleCheckInMessage");

  document
    .getElementById("scaleBackBtn")
    ?.addEventListener(
      "click",
      renderTrackersHub
    );

  slider?.addEventListener("input", () => {
    const value = Number(slider.value);

    if (valueLabel) {
      valueLabel.textContent = value;
    }

    if (meaningLabel) {
      meaningLabel.textContent =
        definition.labels[value] || "";
    }
  });

  document
    .getElementById("saveScaleCheckInBtn")
    ?.addEventListener("click", () => {
      const value = Number(slider.value);

      saveScaleCheckIn(
        tracker.id,
        value
      );

      if (message) {
        message.textContent = "Check-in saved ✓";
      }

      setTimeout(() => {
        renderScaleTrackerScreen(tracker);
      }, 350);
    });

  document
    .querySelectorAll(
      "[data-delete-scale-entry]"
    )
    .forEach(button => {
      button.addEventListener("click", event => {
        const checkInId = Number(
          event.currentTarget.dataset
            .deleteScaleEntry
        );

        deleteScaleCheckIn(
          tracker.id,
          checkInId
        );

        renderScaleTrackerScreen(tracker);
      });
    });
}

// =========================================================
// NUMBER TRACKERS
// =========================================================

function getNumberTrackerEntries(trackerId) {
  const logs = getTrackerLogs();

  const trackerLogs = logs[trackerId];

  if (!Array.isArray(trackerLogs)) {
    return [];
  }

  return [...trackerLogs].sort((a, b) => {
    return (
      new Date(b.timestamp) -
      new Date(a.timestamp)
    );
  });
}

function saveSleepEntry({
  bedtime,
  wakeTime,
  quality,
  notes
}) {
  const logs = getTrackerLogs();

  if (!Array.isArray(logs.sleep)) {
    logs.sleep = [];
  }

  const bedtimeDate = new Date();

  const [bedHour, bedMinute] =
    bedtime.split(":");

  bedtimeDate.setHours(
    Number(bedHour),
    Number(bedMinute),
    0,
    0
  );

  const wakeDate = new Date();

  const [wakeHour, wakeMinute] =
    wakeTime.split(":");

  wakeDate.setHours(
    Number(wakeHour),
    Number(wakeMinute),
    0,
    0
  );

  if (wakeDate <= bedtimeDate) {
    wakeDate.setDate(
      wakeDate.getDate() + 1
    );
  }

  const hoursSlept =
    Math.round(
      ((wakeDate - bedtimeDate) /
        1000 /
        60 /
        60) *
        10
    ) / 10;

  logs.sleep.push({
    id: Date.now(),
    bedtime,
    wakeTime,
    quality: Number(quality),
    notes,
    hoursSlept,
    timestamp: new Date().toISOString(),
    dateString: getLocalDateString()
  });

  saveTrackerLogs(logs);
}

function renderSleepTrackerScreen(tracker) {
  const recentSleep = getNumberTrackerEntries(
    "sleep"
  );

  openSubpage(`
    <section class="subpage">

      <header class="subpage-header">

        <button
          id="sleepBackBtn"
          class="subpage-back-btn"
          type="button"
        >
          ← Back
        </button>

        <h2>
          😴 Sleep
        </h2>

      </header>

      <section class="scale-checkin-card">

        <label>

          Bedtime

          <input
            id="sleepBedtime"
            type="time"
          >

        </label>

        <label>

          Wake time

          <input
            id="sleepWakeTime"
            type="time"
          >

        </label>

        <label>

          Sleep quality (1–10)

          <input
            id="sleepQuality"
            type="range"
            min="1"
            max="10"
            value="5"
          >

        </label>

        <textarea
          id="sleepNotes"
          placeholder="Notes..."
        ></textarea>

        <button
          id="saveSleepBtn"
          class="save-scale-checkin-btn"
          type="button"
        >
          Save Sleep
        </button>

      </section>

      <section class="scale-recent-section">

        <h3>Recent Sleep</h3>

        <div>

          ${
            recentSleep.length === 0
              ? `
                <p class="empty-state">
                  No sleep logged yet.
                </p>
              `
              : recentSleep
                  .map(entry => `
                    <div class="scale-recent-row">

                      <div>

                        <div>
                          ${entry.bedtime}
                          →
                          ${entry.wakeTime}
                        </div>

                        <div>
                          ⭐ ${entry.quality}/10
                        </div>

                      </div>

                      <strong>
                        ${entry.hoursSlept} h
                      </strong>

                    </div>
                  `)
                  .join("")
          }

        </div>

      </section>

    </section>
  `);

  document
    .getElementById("sleepBackBtn")
    ?.addEventListener(
      "click",
      renderTrackersHub
    );

  document
    .getElementById("saveSleepBtn")
    ?.addEventListener("click", () => {
      saveSleepEntry({
        bedtime:
          document.getElementById(
            "sleepBedtime"
          ).value,

        wakeTime:
          document.getElementById(
            "sleepWakeTime"
          ).value,

        quality:
          document.getElementById(
            "sleepQuality"
          ).value,

        notes:
          document.getElementById(
            "sleepNotes"
          ).value
      });

      renderSleepTrackerScreen(tracker);
    });
}

function renderNumberTrackerScreen(tracker) {
  openSubpage(`
    <section class="subpage">

      <header class="subpage-header">

        <button
          id="numberTrackerBackBtn"
          class="subpage-back-btn"
          type="button"
        >
          ← Back
        </button>

        <h2>
          ${tracker.icon}
          ${tracker.name}
        </h2>

      </header>

      <p class="subpage-description">

        Number trackers are coming next.

      </p>

    </section>
  `);

  document
    .getElementById(
      "numberTrackerBackBtn"
    )
    ?.addEventListener(
      "click",
      renderTrackersHub
    );
}