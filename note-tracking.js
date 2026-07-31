// =====================
// Note Tracker Logging
// =====================

function getNoteEntries(trackerId) {
  const logs = getTrackerLogs();
  const trackerEntries = logs[trackerId];

  if (!Array.isArray(trackerEntries)) {
    return [];
  }

  return [...trackerEntries].sort((entryA, entryB) => {
    return (
      new Date(entryB.timestamp) -
      new Date(entryA.timestamp)
    );
  });
}

function saveNoteEntry(
  tracker,
  title,
  text,
  timestamp = new Date()
) {
  const cleanTitle = String(title || "").trim();
  const cleanText = String(text || "").trim();

  if (!cleanText) {
    return {
      success: false,
      message: "Please write a note first."
    };
  }

  const logs = getTrackerLogs();

  if (!Array.isArray(logs[tracker.id])) {
    logs[tracker.id] = [];
  }

  const entryDate =
    timestamp instanceof Date
      ? timestamp
      : new Date(timestamp);

  logs[tracker.id].push({
    id: Date.now(),
    title: cleanTitle,
    text: cleanText,
    timestamp: entryDate.toISOString(),
    dateString: getLocalDateString(entryDate)
  });

  saveTrackerLogs(logs);

  return {
    success: true,
    message: "Note saved ✓"
  };
}

function deleteNoteEntry(
  trackerId,
  entryId
) {
  const logs = getTrackerLogs();

  const entries = Array.isArray(logs[trackerId])
    ? logs[trackerId]
    : [];

  logs[trackerId] = entries.filter(entry => {
    return Number(entry.id) !== Number(entryId);
  });

  saveTrackerLogs(logs);
}

function getNoteEntriesForDate(
  trackerId,
  dateString
) {
  return getNoteEntries(trackerId).filter(entry => {
    return entry.dateString === dateString;
  });
}

function getTodayNoteEntries(trackerId) {
  return getNoteEntriesForDate(
    trackerId,
    getLocalDateString()
  );
}

function formatNoteTrackerTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString(
    [],
    {
      hour: "numeric",
      minute: "2-digit"
    }
  );
}

function renderNoteTrackerScreen(tracker) {
  const todayEntries =
    getTodayNoteEntries(tracker.id);

  const recentEntries =
    getNoteEntries(tracker.id).slice(0, 30);

  openSubpage(`
    <section class="subpage">

      <header class="subpage-header">

        <button
          id="noteTrackerBackBtn"
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

      <section class="note-checkin-card">

        <label class="note-tracker-field">

          <span>Title (optional)</span>

          <input
            id="noteTrackerTitle"
            type="text"
            maxlength="80"
            placeholder="Optional title"
          >

        </label>

        <label class="note-tracker-field">

          <span>Note</span>

          <textarea
            id="noteTrackerText"
            placeholder="Write your note..."
          ></textarea>

        </label>

        <button
          id="saveNoteTrackerEntryBtn"
          class="save-note-entry-btn"
          type="button"
        >
          Save Note
        </button>

        <p
          id="noteTrackerMessage"
          class="note-tracker-message"
        ></p>

      </section>

      <section class="note-today-section">

        <h3>Today</h3>

        <div class="note-entry-list">

          ${
            todayEntries.length === 0
              ? `
                <p class="empty-state">
                  No notes recorded today.
                </p>
              `
              : todayEntries
                  .map(entry => `
                    <article class="note-entry-card">

                      <div class="note-entry-header">

                        <div>

                          ${
                            entry.title
                              ? `
                                <div class="note-entry-title">
                                  ${escapeTrackerHtml(
                                    entry.title
                                  )}
                                </div>
                              `
                              : ""
                          }

                          <div class="note-entry-time">
                            ${formatNoteTrackerTime(
                              entry.timestamp
                            )}
                          </div>

                        </div>

                        <button
                          class="delete-note-entry-btn"
                          type="button"
                          data-delete-note-entry="${entry.id}"
                          aria-label="Delete note"
                        >
                          ×
                        </button>

                      </div>

                      <p class="note-entry-text">
                        ${escapeTrackerHtml(
                          entry.text
                        )}
                      </p>

                    </article>
                  `)
                  .join("")
          }

        </div>

      </section>

      <section class="note-recent-section">

        <h3>Recent Notes</h3>

        <div class="note-recent-list">

          ${
            recentEntries.length === 0
              ? `
                <p class="empty-state">
                  Your recent notes will appear here.
                </p>
              `
              : recentEntries
                  .map(entry => {
                    const date =
                      new Date(entry.timestamp);

                    return `
                      <article class="note-recent-card">

                        <div class="note-recent-header">

                          <div>

                            ${
                              entry.title
                                ? `
                                  <div class="note-entry-title">
                                    ${escapeTrackerHtml(
                                      entry.title
                                    )}
                                  </div>
                                `
                                : ""
                            }

                            <div class="note-recent-date">
                              ${date.toLocaleDateString(
                                undefined,
                                {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric"
                                }
                              )}
                            </div>

                            <div class="note-entry-time">
                              ${formatNoteTrackerTime(
                                entry.timestamp
                              )}
                            </div>

                          </div>

                        </div>

                        <p class="note-entry-text">
                          ${escapeTrackerHtml(
                            entry.text
                          )}
                        </p>

                      </article>
                    `;
                  })
                  .join("")
          }

        </div>

      </section>

    </section>
  `);

  attachNoteTrackerEvents(tracker);
}

function attachNoteTrackerEvents(tracker) {
  const titleInput =
    document.getElementById(
      "noteTrackerTitle"
    );

  const textInput =
    document.getElementById(
      "noteTrackerText"
    );

  const message =
    document.getElementById(
      "noteTrackerMessage"
    );

  document
    .getElementById("noteTrackerBackBtn")
    ?.addEventListener(
      "click",
      renderTrackersHub
    );

  document
    .getElementById(
      "saveNoteTrackerEntryBtn"
    )
    ?.addEventListener("click", () => {
      const result = saveNoteEntry(
        tracker,
        titleInput?.value,
        textInput?.value
      );

      if (message) {
        message.textContent = result.message;
        message.classList.toggle(
          "error",
          !result.success
        );
      }

      if (result.success) {
        setTimeout(() => {
          renderNoteTrackerScreen(tracker);
        }, 250);
      }
    });

  document
    .querySelectorAll(
      "[data-delete-note-entry]"
    )
    .forEach(button => {
      button.addEventListener("click", event => {
        const entryId = Number(
          event.currentTarget.dataset
            .deleteNoteEntry
        );

        deleteNoteEntry(
          tracker.id,
          entryId
        );

        renderNoteTrackerScreen(tracker);

        if (
          typeof renderCalendar ===
          "function"
        ) {
          renderCalendar();
        }
      });
    });
}