// =====================
// Sleep Tracking
// =====================

const ACTIVE_SLEEP_SESSION_KEY = "activeSleepSession";

function getActiveSleepSession() {
  try {
    return JSON.parse(
      localStorage.getItem(ACTIVE_SLEEP_SESSION_KEY) ||
        "null"
    );
  } catch (error) {
    console.error(
      "Could not load active sleep session:",
      error
    );

    return null;
  }
}

function saveActiveSleepSession(session) {
  if (!session) {
    localStorage.removeItem(
      ACTIVE_SLEEP_SESSION_KEY
    );

    return;
  }

  localStorage.setItem(
    ACTIVE_SLEEP_SESSION_KEY,
    JSON.stringify(session)
  );
}

function formatSleepClockTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString(
    [],
    {
      hour: "numeric",
      minute: "2-digit"
    }
  );
}

function formatSleepDuration(totalMinutes) {
  const safeMinutes = Math.max(
    0,
    Math.round(totalMinutes)
  );

  const hours = Math.floor(
    safeMinutes / 60
  );

  const minutes = safeMinutes % 60;

  if (hours === 0) {
    return `${minutes} min`;
  }

  if (minutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${minutes} min`;
}

function calculateSleepDurationMinutes(
  bedtimeTimestamp,
  wakeTimestamp
) {
  const bedtime = new Date(
    bedtimeTimestamp
  );

  const wakeTime = new Date(
    wakeTimestamp
  );

  if (
    Number.isNaN(bedtime.getTime()) ||
    Number.isNaN(wakeTime.getTime())
  ) {
    return 0;
  }

  return Math.round(
    (wakeTime - bedtime) / 1000 / 60
  );
}

function beginSleepSession() {
  const existingSession =
    getActiveSleepSession();

  if (existingSession) {
    return {
      success: false,
      message:
        "A sleep session is already running."
    };
  }

  const session = {
    id: Date.now(),
    bedtimeTimestamp:
      new Date().toISOString()
  };

  saveActiveSleepSession(session);

  return {
    success: true,
    message: "Bedtime recorded 🌙"
  };
}

function cancelSleepSession() {
  saveActiveSleepSession(null);
}

function saveCompletedSleepSession({
  bedtimeTimestamp,
  wakeTimestamp,
  quality,
  notes
}) {
  const logs = getTrackerLogs();

  if (!Array.isArray(logs.sleep)) {
    logs.sleep = [];
  }

  const bedtimeDate =
    new Date(bedtimeTimestamp);

  const wakeDate =
    new Date(wakeTimestamp);

  const durationMinutes =
    calculateSleepDurationMinutes(
      bedtimeTimestamp,
      wakeTimestamp
    );

  const hoursSlept =
    Math.round(
      (durationMinutes / 60) * 10
    ) / 10;

  logs.sleep.push({
    id: Date.now(),

    bedtime:
      bedtimeDate.toTimeString().slice(0, 5),

    wakeTime:
      wakeDate.toTimeString().slice(0, 5),

    bedtimeTimestamp,
    wakeTimestamp,

    quality: Number(quality),
    notes: notes.trim(),

    durationMinutes,
    hoursSlept,

    timestamp: wakeTimestamp,

    /*
      The sleep entry belongs to the date on which
      the user woke up.
    */
    dateString:
      getLocalDateString(wakeDate)
  });

  saveTrackerLogs(logs);
  saveActiveSleepSession(null);
}

function deleteSleepEntry(entryId) {
  const logs = getTrackerLogs();

  const sleepEntries =
    Array.isArray(logs.sleep)
      ? logs.sleep
      : [];

  logs.sleep = sleepEntries.filter(
    entry => {
      return (
        Number(entry.id) !==
        Number(entryId)
      );
    }
  );

  saveTrackerLogs(logs);
}

function renderSleepTrackerScreen(tracker) {
  const activeSession =
    getActiveSleepSession();

  const recentSleep =
    getNumberTrackerEntries("sleep");

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

        <h2>😴 Sleep</h2>

      </header>

      ${
        activeSession
          ? renderActiveSleepSession(
              activeSession
            )
          : renderStartSleepCard()
      }

      <section class="sleep-manual-section">

        <button
          id="toggleManualSleepBtn"
          class="sleep-secondary-btn"
          type="button"
        >
          Enter Sleep Manually
        </button>

        <div
          id="manualSleepForm"
          class="sleep-manual-form hidden"
        >
          ${renderManualSleepForm()}
        </div>

      </section>

      <section class="scale-recent-section">

        <h3>Recent Sleep</h3>

        <div class="sleep-history-list">

          ${
            recentSleep.length === 0
              ? `
                <p class="empty-state">
                  No sleep logged yet.
                </p>
              `
              : recentSleep
                  .map(renderSleepHistoryEntry)
                  .join("")
          }

        </div>

      </section>

    </section>
  `);

  attachSleepScreenEvents(
    tracker,
    activeSession
  );
}

function renderStartSleepCard() {
  return `
    <section class="sleep-session-card">

      <div class="sleep-session-icon">
        🌙
      </div>

      <h3>Ready for bed?</h3>

      <p>
        Start a sleep session now.
        MyBrain will remember the exact time.
      </p>

      <button
        id="startSleepSessionBtn"
        class="sleep-primary-btn"
        type="button"
      >
        Going to Bed 🌙
      </button>

      <p
        id="sleepSessionMessage"
        class="sleep-session-message"
      ></p>

    </section>
  `;
}

function renderActiveSleepSession(session) {
  const bedtimeTime =
    formatSleepClockTime(
      session.bedtimeTimestamp
    );

  return `
    <section class="sleep-session-card active">

      <div class="sleep-session-icon">
        💤
      </div>

      <h3>Sleep session running</h3>

      <p>
        Bedtime recorded at
        <strong>${bedtimeTime}</strong>
      </p>

      <button
        id="wakeUpBtn"
        class="sleep-primary-btn awake"
        type="button"
      >
        I’m Awake ☀️
      </button>

      <button
        id="cancelSleepSessionBtn"
        class="sleep-text-btn"
        type="button"
      >
        Cancel this session
      </button>

    </section>
  `;
}

function renderWakeUpForm(session) {
  const wakeTimestamp =
    new Date().toISOString();

  const durationMinutes =
    calculateSleepDurationMinutes(
      session.bedtimeTimestamp,
      wakeTimestamp
    );

  openSubpage(`
    <section class="subpage">

      <header class="subpage-header">

        <button
          id="wakeFormBackBtn"
          class="subpage-back-btn"
          type="button"
        >
          ← Back
        </button>

        <h2>☀️ Good Morning</h2>

      </header>

      <section class="sleep-finish-card">

        <div class="sleep-duration-display">
          ${formatSleepDuration(
            durationMinutes
          )}
        </div>

        <p>
          ${formatSleepClockTime(
            session.bedtimeTimestamp
          )}
          →
          ${formatSleepClockTime(
            wakeTimestamp
          )}
        </p>

        <label class="sleep-form-field">

          <span>
            Sleep quality:
            <strong id="sleepQualityValue">
              5
            </strong>
            / 10
          </span>

          <input
            id="completedSleepQuality"
            type="range"
            min="1"
            max="10"
            step="1"
            value="5"
          >

        </label>

        <label class="sleep-form-field">

          <span>Notes</span>

          <textarea
            id="completedSleepNotes"
            placeholder="How did you sleep?"
          ></textarea>

        </label>

        <p
          id="finishSleepMessage"
          class="sleep-session-message"
        ></p>

        <button
          id="finishSleepBtn"
          class="sleep-primary-btn awake"
          type="button"
        >
          Save Sleep
        </button>

      </section>

    </section>
  `);

  const qualitySlider =
    document.getElementById(
      "completedSleepQuality"
    );

  const qualityValue =
    document.getElementById(
      "sleepQualityValue"
    );

  qualitySlider?.addEventListener(
    "input",
    () => {
      qualityValue.textContent =
        qualitySlider.value;
    }
  );

  document
    .getElementById("wakeFormBackBtn")
    ?.addEventListener("click", () => {
      renderSleepTrackerScreen({
        id: "sleep",
        name: "Sleep",
        icon: "😴",
        type: "number",
        unit: "hours"
      });
    });

  document
    .getElementById("finishSleepBtn")
    ?.addEventListener("click", () => {
      saveCompletedSleepSession({
        bedtimeTimestamp:
          session.bedtimeTimestamp,

        wakeTimestamp,

        quality:
          qualitySlider.value,

        notes:
          document
            .getElementById(
              "completedSleepNotes"
            )
            .value
      });

      renderSleepTrackerScreen({
        id: "sleep",
        name: "Sleep",
        icon: "😴",
        type: "number",
        unit: "hours"
      });

      if (
        typeof renderCalendar ===
        "function"
      ) {
        renderCalendar();
      }
    });
}

function renderManualSleepForm() {
  return `
    <label class="sleep-form-field">

      <span>Date you woke up</span>

      <input
        id="manualSleepDate"
        type="date"
        value="${getLocalDateString()}"
      >

    </label>

    <div class="sleep-time-grid">

      <label class="sleep-form-field">

        <span>Bedtime</span>

        <input
          id="manualSleepBedtime"
          type="time"
        >

      </label>

      <label class="sleep-form-field">

        <span>Wake time</span>

        <input
          id="manualSleepWakeTime"
          type="time"
        >

      </label>

    </div>

    <label class="sleep-form-field">

      <span>
        Quality:
        <strong id="manualSleepQualityValue">
          5
        </strong>
        / 10
      </span>

      <input
        id="manualSleepQuality"
        type="range"
        min="1"
        max="10"
        step="1"
        value="5"
      >

    </label>

    <label class="sleep-form-field">

      <span>Notes</span>

      <textarea
        id="manualSleepNotes"
        placeholder="Optional notes..."
      ></textarea>

    </label>

    <p
      id="manualSleepMessage"
      class="sleep-session-message"
    ></p>

    <button
      id="saveManualSleepBtn"
      class="sleep-primary-btn"
      type="button"
    >
      Save Manual Entry
    </button>
  `;
}

function saveManualSleepEntry() {
  const dateString =
    document.getElementById(
      "manualSleepDate"
    ).value;

  const bedtime =
    document.getElementById(
      "manualSleepBedtime"
    ).value;

  const wakeTime =
    document.getElementById(
      "manualSleepWakeTime"
    ).value;

  const quality =
    document.getElementById(
      "manualSleepQuality"
    ).value;

  const notes =
    document.getElementById(
      "manualSleepNotes"
    ).value;

  const message =
    document.getElementById(
      "manualSleepMessage"
    );

  if (!dateString || !bedtime || !wakeTime) {
    message.textContent =
      "Please choose a date, bedtime, and wake time.";

    return;
  }

  const wakeDate =
    new Date(
      `${dateString}T${wakeTime}:00`
    );

  let bedtimeDate =
    new Date(
      `${dateString}T${bedtime}:00`
    );

  /*
    Bedtime is normally the evening before the
    selected wake-up date.
  */
  if (bedtimeDate >= wakeDate) {
    bedtimeDate.setDate(
      bedtimeDate.getDate() - 1
    );
  }

  saveCompletedSleepSession({
    bedtimeTimestamp:
      bedtimeDate.toISOString(),

    wakeTimestamp:
      wakeDate.toISOString(),

    quality,
    notes
  });

  renderSleepTrackerScreen({
    id: "sleep",
    name: "Sleep",
    icon: "😴",
    type: "number",
    unit: "hours"
  });

  if (
    typeof renderCalendar === "function"
  ) {
    renderCalendar();
  }
}

function renderSleepHistoryEntry(entry) {
  const entryDate =
    new Date(entry.timestamp);

  const durationText =
    entry.durationMinutes
      ? formatSleepDuration(
          entry.durationMinutes
        )
      : `${entry.hoursSlept} hr`;

  return `
    <article class="sleep-history-entry">

      <div>

        <div class="sleep-history-date">
          ${entryDate.toLocaleDateString(
            undefined,
            {
              weekday: "short",
              month: "short",
              day: "numeric"
            }
          )}
        </div>

        <div class="sleep-history-times">
          ${formatSleepClockTime(
            entry.bedtimeTimestamp ||
              `${entry.dateString}T${entry.bedtime}`
          )}
          →
          ${formatSleepClockTime(
            entry.wakeTimestamp ||
              `${entry.dateString}T${entry.wakeTime}`
          )}
        </div>

        <div class="sleep-history-quality">
          ⭐ ${entry.quality}/10
        </div>

        ${
          entry.notes?.trim()
            ? `
              <p class="sleep-history-notes">
                ${escapeTrackerHtml(
                  entry.notes
                )}
              </p>
            `
            : ""
        }

      </div>

      <div class="sleep-history-actions">

        <strong>${durationText}</strong>

        <button
          class="delete-sleep-entry-btn"
          type="button"
          data-delete-sleep-entry="${entry.id}"
          aria-label="Delete sleep entry"
        >
          ×
        </button>

      </div>

    </article>
  `;
}

function attachSleepScreenEvents(
  tracker,
  activeSession
) {
  document
    .getElementById("sleepBackBtn")
    ?.addEventListener(
      "click",
      renderTrackersHub
    );

  document
    .getElementById(
      "startSleepSessionBtn"
    )
    ?.addEventListener("click", () => {
      beginSleepSession();
      renderSleepTrackerScreen(tracker);
    });

  document
    .getElementById("wakeUpBtn")
    ?.addEventListener("click", () => {
      renderWakeUpForm(activeSession);
    });

  document
    .getElementById(
      "cancelSleepSessionBtn"
    )
    ?.addEventListener("click", () => {
      cancelSleepSession();
      renderSleepTrackerScreen(tracker);
    });

  document
    .getElementById(
      "toggleManualSleepBtn"
    )
    ?.addEventListener("click", () => {
      document
        .getElementById(
          "manualSleepForm"
        )
        ?.classList.toggle("hidden");
    });

  const manualQuality =
    document.getElementById(
      "manualSleepQuality"
    );

  manualQuality?.addEventListener(
    "input",
    () => {
      document.getElementById(
        "manualSleepQualityValue"
      ).textContent =
        manualQuality.value;
    }
  );

  document
    .getElementById(
      "saveManualSleepBtn"
    )
    ?.addEventListener(
      "click",
      saveManualSleepEntry
    );

  document
    .querySelectorAll(
      "[data-delete-sleep-entry]"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        event => {
          const entryId = Number(
            event.currentTarget.dataset
              .deleteSleepEntry
          );

          deleteSleepEntry(entryId);
          renderSleepTrackerScreen(tracker);

          if (
            typeof renderCalendar ===
            "function"
          ) {
            renderCalendar();
          }
        }
      );
    });
}