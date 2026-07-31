// =====================
// Number Tracker Logging
// =====================

function getNumberEntries(trackerId) {
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

function saveNumberEntry(
  tracker,
  amount,
  timestamp = new Date()
) {
  const numericAmount = Number(amount);

  if (
    !Number.isFinite(numericAmount) ||
    numericAmount <= 0
  ) {
    return {
      success: false,
      message: "Enter an amount greater than zero."
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
    value: numericAmount,
    unit: tracker.unit || "units",
    timestamp: entryDate.toISOString(),
    dateString: getLocalDateString(entryDate)
  });

  saveTrackerLogs(logs);

  return {
    success: true,
    message: "Entry saved ✓"
  };
}

function deleteNumberEntry(
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

function getNumberEntriesForDate(
  trackerId,
  dateString
) {
  return getNumberEntries(trackerId).filter(entry => {
    return entry.dateString === dateString;
  });
}

function getTodayNumberEntries(trackerId) {
  return getNumberEntriesForDate(
    trackerId,
    getLocalDateString()
  );
}

function getNumberEntryTotal(entries) {
  return Math.round(
    entries.reduce((total, entry) => {
      return total + Number(entry.value);
    }, 0) * 100
  ) / 100;
}

function formatNumberAmount(value) {
  const numericValue = Number(value);

  if (Number.isInteger(numericValue)) {
    return numericValue;
  }

  return Math.round(numericValue * 100) / 100;
}

function formatNumberTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString(
    [],
    {
      hour: "numeric",
      minute: "2-digit"
    }
  );
}

function getNumberQuickAmounts(tracker) {
  const unit = String(
    tracker.unit || ""
  ).toLowerCase();

  if (
    unit.includes("minute") ||
    unit === "min"
  ) {
    return [15, 30];
  }

  if (
    unit.includes("hour") ||
    unit === "hr" ||
    unit === "hrs"
  ) {
    return [0.5, 1];
  }

  if (
    unit.includes("glass") ||
    unit.includes("cup") ||
    unit.includes("bottle")
  ) {
    return [1, 2];
  }

  if (
    unit.includes("ounce") ||
    unit === "oz"
  ) {
    return [8, 16];
  }

  return [1, 5];
}

function getNumberUnitLabel(
  tracker,
  amount
) {
  const unit = tracker.unit || "units";

  const singularUnits = {
    glasses: "glass",
    bottles: "bottle",
    cups: "cup",
    hours: "hour",
    minutes: "minute",
    ounces: "ounce"
  };

  if (Number(amount) === 1) {
    return singularUnits[unit] || unit;
  }

  return unit;
}

function renderNumberTrackerScreen(tracker) {
  /*
    Sleep has its own specialized screen.
  */
  if (tracker.id === "sleep") {
    renderSleepTrackerScreen(tracker);
    return;
  }

  const todayEntries =
    getTodayNumberEntries(tracker.id);

  const recentEntries =
    getNumberEntries(tracker.id).slice(0, 30);

  const todayTotal =
    getNumberEntryTotal(todayEntries);

  const quickAmounts =
    getNumberQuickAmounts(tracker);

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
          ${escapeTrackerHtml(tracker.icon)}
          ${escapeTrackerHtml(tracker.name)}
        </h2>

      </header>

      <section class="number-checkin-card">

        <div class="number-checkin-label">
          Quick Add
        </div>

        <div class="number-quick-grid">

          ${quickAmounts
            .map(amount => `
              <button
                class="number-quick-btn"
                type="button"
                data-quick-number="${amount}"
              >
                +${amount}
                ${escapeTrackerHtml(
                  getNumberUnitLabel(
                    tracker,
                    amount
                  )
                )}
              </button>
            `)
            .join("")}

        </div>

        <div class="number-divider">
          <span>or enter an amount</span>
        </div>

        <label class="number-custom-field">

          <span>
            Amount
          </span>

          <div class="number-input-row">

            <input
              id="customNumberAmount"
              type="number"
              min="0"
              step="any"
              inputmode="decimal"
              placeholder="0"
            >

            <span>
              ${escapeTrackerHtml(
                tracker.unit || "units"
              )}
            </span>

          </div>

        </label>

        <button
          id="saveCustomNumberBtn"
          class="save-number-entry-btn"
          type="button"
        >
          Save Entry
        </button>

        <p
          id="numberEntryMessage"
          class="number-entry-message"
        ></p>

      </section>

      <section class="number-today-section">

        <h3>Today</h3>

        <div class="number-summary-grid">

          <div class="number-summary-card">

            <span>Entries</span>

            <strong>
              ${todayEntries.length}
            </strong>

          </div>

          <div class="number-summary-card">

            <span>Total</span>

            <strong>
              ${formatNumberAmount(todayTotal)}
            </strong>

            <small>
              ${escapeTrackerHtml(
                tracker.unit || "units"
              )}
            </small>

          </div>

        </div>

        <div class="number-entry-list">

          ${
            todayEntries.length === 0
              ? `
                <p class="empty-state">
                  No entries recorded today.
                </p>
              `
              : todayEntries
                  .map(entry => `
                    <article class="number-entry-row">

                      <div>

                        <div class="number-entry-time">
                          ${formatNumberTime(
                            entry.timestamp
                          )}
                        </div>

                        <div class="number-entry-unit">
                          ${escapeTrackerHtml(
                            entry.unit ||
                            tracker.unit ||
                            "units"
                          )}
                        </div>

                      </div>

                      <strong>
                        ${formatNumberAmount(
                          entry.value
                        )}
                      </strong>

                      <button
                        class="delete-number-entry-btn"
                        type="button"
                        data-delete-number-entry="${entry.id}"
                        aria-label="Delete entry"
                      >
                        ×
                      </button>

                    </article>
                  `)
                  .join("")
          }

        </div>

      </section>

      <section class="number-recent-section">

        <h3>Recent Entries</h3>

        <div class="number-recent-list">

          ${
            recentEntries.length === 0
              ? `
                <p class="empty-state">
                  Your recent entries will appear here.
                </p>
              `
              : recentEntries
                  .map(entry => {
                    const date =
                      new Date(entry.timestamp);

                    return `
                      <article class="number-recent-row">

                        <div>

                          <div class="number-recent-date">
                            ${date.toLocaleDateString(
                              undefined,
                              {
                                weekday: "short",
                                month: "short",
                                day: "numeric"
                              }
                            )}
                          </div>

                          <div class="number-recent-time">
                            ${formatNumberTime(
                              entry.timestamp
                            )}
                          </div>

                        </div>

                        <strong>
                          ${formatNumberAmount(
                            entry.value
                          )}
                          ${escapeTrackerHtml(
                            entry.unit ||
                            tracker.unit ||
                            "units"
                          )}
                        </strong>

                      </article>
                    `;
                  })
                  .join("")
          }

        </div>

      </section>

    </section>
  `);

  attachNumberTrackerEvents(tracker);
}

function attachNumberTrackerEvents(tracker) {
  const amountInput =
    document.getElementById(
      "customNumberAmount"
    );

  const message =
    document.getElementById(
      "numberEntryMessage"
    );

  document
    .getElementById("numberTrackerBackBtn")
    ?.addEventListener(
      "click",
      renderTrackersHub
    );

  document
    .querySelectorAll("[data-quick-number]")
    .forEach(button => {
      button.addEventListener("click", event => {
        const amount = Number(
          event.currentTarget.dataset.quickNumber
        );

        const result = saveNumberEntry(
          tracker,
          amount
        );

        if (message) {
          message.textContent = result.message;
        }

        if (result.success) {
          setTimeout(() => {
            renderNumberTrackerScreen(tracker);
          }, 250);
        }
      });
    });

  document
    .getElementById("saveCustomNumberBtn")
    ?.addEventListener("click", () => {
      const result = saveNumberEntry(
        tracker,
        amountInput?.value
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
          renderNumberTrackerScreen(tracker);
        }, 250);
      }
    });

  amountInput?.addEventListener(
    "keydown",
    event => {
      if (event.key === "Enter") {
        document
          .getElementById(
            "saveCustomNumberBtn"
          )
          ?.click();
      }
    }
  );

  document
    .querySelectorAll(
      "[data-delete-number-entry]"
    )
    .forEach(button => {
      button.addEventListener("click", event => {
        const entryId = Number(
          event.currentTarget.dataset
            .deleteNumberEntry
        );

        deleteNumberEntry(
          tracker.id,
          entryId
        );

        renderNumberTrackerScreen(tracker);

        if (
          typeof renderCalendar ===
          "function"
        ) {
          renderCalendar();
        }
      });
    });
}