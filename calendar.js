// =====================
// Calendar
// =====================

const calendarPage =
  document.getElementById("calendarPage");

let calendarDate = new Date();
let selectedCalendarDate = null;

// ----- Page shell -----

calendarPage.innerHTML = `
  <section class="page-card calendar-card">

    <div class="calendar-header">

      <button
        id="previousMonthBtn"
        type="button"
        aria-label="Previous month"
      >
        ←
      </button>

      <h2 id="calendarMonthTitle"></h2>

      <button
        id="nextMonthBtn"
        type="button"
        aria-label="Next month"
      >
        →
      </button>

    </div>

    <div class="calendar-weekdays">
      <span>Sun</span>
      <span>Mon</span>
      <span>Tue</span>
      <span>Wed</span>
      <span>Thu</span>
      <span>Fri</span>
      <span>Sat</span>
    </div>

    <div
      id="calendarGrid"
      class="calendar-grid"
    ></div>

    <section
      id="calendarDayDetails"
      class="calendar-day-details"
    >
      <p class="empty-state">
        Tap a day to see its details.
      </p>
    </section>

  </section>
`;

// ----- General helpers -----

function escapeCalendarHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getCalendarDateString(
  year,
  month,
  day
) {
  const monthString =
    String(month + 1).padStart(2, "0");

  const dayString =
    String(day).padStart(2, "0");

  return `${year}-${monthString}-${dayString}`;
}

function getDateStringFromTimestamp(timestamp) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return getCalendarDateString(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
}

function formatCalendarTime(timestamp) {
  if (!timestamp) {
    return "All day";
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "All day";
  }

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });
}

function getCalendarTrackerMetadata() {
  if (typeof getAllTrackers === "function") {
    return getAllTrackers();
  }

  return [
    {
      id: "loneliness",
      name: "Loneliness",
      icon: "🥺",
      type: "scale"
    },
    {
      id: "social-battery",
      name: "Social Battery",
      icon: "🥱",
      type: "scale"
    },
    {
      id: "medication",
      name: "Medication",
      icon: "💊",
      type: "habit"
    },
    {
      id: "sleep",
      name: "Sleep",
      icon: "😴",
      type: "number"
    }
  ];
}

function getCalendarTrackerById(trackerId) {
  return getCalendarTrackerMetadata().find(
    tracker => tracker.id === trackerId
  ) || {
    id: trackerId,
    name: trackerId,
    icon: "🧠",
    type: "tracker"
  };
}

// =========================================================
// MOOD CHECK-INS
// =========================================================

function getEntriesForDate(dateString) {
  if (typeof getEntries !== "function") {
    return [];
  }

  return getEntries().filter(entry => {
    return (
      getDateStringFromTimestamp(
        entry.timestamp
      ) === dateString
    );
  });
}

function getMoodCalendarEvents(dateString) {
  return getEntriesForDate(dateString)
    .map(entry => {
      return {
        type: "mood",
        timestamp: entry.timestamp,
        sortTime: new Date(entry.timestamp).getTime(),

        html: `
          <article class="calendar-timeline-event">

            <div class="calendar-event-time">
              ${formatCalendarTime(entry.timestamp)}
            </div>

            <div class="calendar-event-content">

              <div class="calendar-entry-title">
                ${escapeCalendarHtml(
                  entry.moodEmoji || "😊"
                )}
                ${escapeCalendarHtml(
                  entry.moodLabel || "Mood check-in"
                )}
              </div>

              <div class="calendar-entry-stats">
                <span>
                  😊 Mood: ${entry.mood ?? "—"}
                </span>

                <span>
                  ⚡ Energy: ${entry.energy ?? "—"}
                </span>

                <span>
                  😰 Anxiety: ${entry.anxiety ?? "—"}
                </span>

                <span>
                  🧠 OCD: ${entry.ocd ?? "—"}
                </span>

                <span>
                  🎯 Focus: ${entry.focus ?? "—"}
                </span>
              </div>

              ${
                entry.notes
                  ? `
                    <p class="calendar-entry-notes">
                      📝 ${escapeCalendarHtml(
                        entry.notes
                      )}
                    </p>
                  `
                  : ""
              }

            </div>

          </article>
        `
      };
    });
}

// =========================================================
// SCALE TRACKER CHECK-INS
// =========================================================

function getScaleTrackerCalendarEvents(
  tracker,
  dateString
) {
  if (typeof getScaleEntriesForDate !== "function") {
    return [];
  }

  const entries = getScaleEntriesForDate(
    tracker.id,
    dateString
  );

  return entries.map(entry => {
    const definition =
      typeof getScaleDefinition === "function"
        ? getScaleDefinition(tracker)
        : null;

    const meaning =
      definition?.labels?.[entry.value] || "";

    return {
      type: "scale",
      timestamp: entry.timestamp,
      sortTime: new Date(entry.timestamp).getTime(),

      html: `
        <article class="calendar-timeline-event">

          <div class="calendar-event-time">
            ${formatCalendarTime(entry.timestamp)}
          </div>

          <div class="calendar-event-content">

            <div class="calendar-entry-title">
              ${escapeCalendarHtml(tracker.icon)}
              ${escapeCalendarHtml(tracker.name)}
            </div>

            <div class="calendar-tracker-value">
              ${entry.value} / 10
            </div>

            ${
              meaning
                ? `
                  <div class="calendar-event-subtitle">
                    ${escapeCalendarHtml(meaning)}
                  </div>
                `
                : ""
            }

          </div>

        </article>
      `
    };
  });
}

// =========================================================
// HABIT TRACKERS
// =========================================================

function getHabitCalendarEvents(dateString) {
  if (typeof getTrackerLogs !== "function") {
    return [];
  }

  const logs = getTrackerLogs();
  const trackers = getCalendarTrackerMetadata();

  return trackers
    .filter(tracker => tracker.type === "habit")
    .filter(tracker => {
      return logs[tracker.id]?.[dateString] === true;
    })
    .map(tracker => {
      return {
        type: "habit",
        timestamp: null,
        sortTime: Number.MAX_SAFE_INTEGER - 3,

        html: `
          <article class="calendar-timeline-event">

            <div class="calendar-event-time">
              All day
            </div>

            <div class="calendar-event-content">

              <div class="calendar-entry-title">
                ${escapeCalendarHtml(tracker.icon)}
                ${escapeCalendarHtml(tracker.name)}
              </div>

              <div class="calendar-completed-label">
                Completed ✓
              </div>

            </div>

          </article>
        `
      };
    });
}

// =========================================================
// NUMBER TRACKERS
// =========================================================

function getSleepCalendarEvents(dateString) {
  if (typeof getNumberTrackerEntries !== "function") {
    return [];
  }

  const entries = getNumberTrackerEntries("sleep");

  return entries
    .filter(entry => {
      return entry.dateString === dateString;
    })
    .map(entry => {
      return {
        type: "sleep",
        timestamp: entry.timestamp,
        sortTime: new Date(
          entry.timestamp
        ).getTime(),

        html: `
          <article class="calendar-timeline-event">

            <div class="calendar-event-time">
              ${formatCalendarTime(entry.timestamp)}
            </div>

            <div class="calendar-event-content">

              <div class="calendar-entry-title">
                😴 Sleep
              </div>

              <div class="calendar-tracker-value">
                ${entry.hoursSlept} h
              </div>

              <div class="calendar-event-subtitle">
                🛏️ ${escapeCalendarHtml(
                  entry.bedtime
                )}
                →
                ${escapeCalendarHtml(
                  entry.wakeTime
                )}
              </div>

              <div class="calendar-event-subtitle">
                ⭐ ${entry.quality}/10
              </div>

              ${
                entry.notes?.trim()
                  ? `
                    <p class="calendar-entry-notes">
                      📝 ${escapeCalendarHtml(
                        entry.notes
                      )}
                    </p>
                  `
                  : ""
              }

            </div>

          </article>
        `
      };
    });
}

// =========================================================
// MASTERLIST TASKS
// =========================================================

function getCalendarMasterlistTasks() {
  if (typeof getMasterlistTasks === "function") {
    return getMasterlistTasks();
  }

  try {
    return JSON.parse(
      localStorage.getItem("masterlistTasks") || "[]"
    );
  } catch (error) {
    console.error(
      "Could not load tasks for Calendar:",
      error
    );

    return [];
  }
}

function getCompletedTaskCalendarEvents(dateString) {
  return getCalendarMasterlistTasks()
    .filter(task => {
      return (
        task.completed &&
        task.completedAt &&
        getDateStringFromTimestamp(
          task.completedAt
        ) === dateString
      );
    })
    .map(task => {
      return {
        type: "completed-task",
        timestamp: task.completedAt,
        sortTime: new Date(
          task.completedAt
        ).getTime(),

        html: `
          <article class="calendar-timeline-event">

            <div class="calendar-event-time">
              ${formatCalendarTime(task.completedAt)}
            </div>

            <div class="calendar-event-content">

              <div class="calendar-entry-title">
                ✅ ${escapeCalendarHtml(task.text)}
              </div>

              <div class="calendar-event-subtitle">
                Task completed
              </div>

            </div>

          </article>
        `
      };
    });
}

function getDueTaskCalendarEvents(dateString) {
  return getCalendarMasterlistTasks()
    .filter(task => {
      return (
        !task.archived &&
        task.dueDate === dateString
      );
    })
    .map(task => {
      const completedOnThisDate =
        task.completedAt &&
        getDateStringFromTimestamp(
          task.completedAt
        ) === dateString;

      /*
        Avoid showing the exact same task twice if it was
        due and completed on the selected date.
      */
      if (completedOnThisDate) {
        return null;
      }

      return {
        type: "due-task",
        timestamp: null,
        sortTime: Number.MAX_SAFE_INTEGER - 2,

        html: `
          <article class="calendar-timeline-event">

            <div class="calendar-event-time">
              Due
            </div>

            <div class="calendar-event-content">

              <div class="calendar-entry-title">
                ${
                  task.completed ? "☑️" : "⏰"
                }
                ${escapeCalendarHtml(task.text)}
              </div>

              <div class="calendar-event-subtitle">
                ${
                  task.completed
                    ? "Completed"
                    : "Task deadline"
                }
              </div>

            </div>

          </article>
        `
      };
    })
    .filter(Boolean);
}

// =========================================================
// DAILY JOURNAL NOTE
// =========================================================

function getDailyNoteCalendarEvents(dateString) {
  if (typeof getDailyJournalNote !== "function") {
    return [];
  }

  const note = getDailyJournalNote(dateString);

  if (!note?.text?.trim()) {
    return [];
  }

  const timestamp =
    note.updatedAt ||
    note.createdAt ||
    null;

  return [
    {
      type: "journal",
      timestamp,
      sortTime: timestamp
        ? new Date(timestamp).getTime()
        : Number.MAX_SAFE_INTEGER - 1,

      html: `
        <article class="calendar-timeline-event">

          <div class="calendar-event-time">
            ${
              timestamp
                ? formatCalendarTime(timestamp)
                : "Daily"
            }
          </div>

          <div class="calendar-event-content">

            <div class="calendar-entry-title">
              📖 Daily Note
            </div>

            <p class="calendar-entry-notes">
              ${escapeCalendarHtml(note.text)}
            </p>

          </div>

        </article>
      `
    }
  ];
}

// =========================================================
// TODAY ASSIGNMENT HISTORY
// =========================================================

function getTodayAssignmentHistory() {
  try {
    return JSON.parse(
      localStorage.getItem("todayHistory") || "[]"
    );
  } catch (error) {
    console.error(
      "Could not load Today history for Calendar:",
      error
    );

    return [];
  }
}

function getTodayAssignmentCalendarEvents(dateString) {
  const history = getTodayAssignmentHistory();
  const tasks = getCalendarMasterlistTasks();

  return history
    .filter(event => {
      return (
        getDateStringFromTimestamp(event.timestamp) ===
        dateString
      );
    })
    .map(event => {
      const task = tasks.find(task => {
        return Number(task.id) === Number(event.taskId);
      });

      const taskName =
        task?.text || "Deleted or archived task";

      const actionDetails = {
        added: {
          icon: "☀️",
          title: "Added to Today"
        },

        removed: {
          icon: "↩️",
          title: "Removed from Today"
        },

        "created-for-today": {
          icon: "➕",
          title: "Created for Today"
        }
      };

      const details =
        actionDetails[event.action] || {
          icon: "☀️",
          title: "Today task updated"
        };

      return {
        type: "today-assignment",
        timestamp: event.timestamp,

        sortTime: new Date(
          event.timestamp
        ).getTime(),

        html: `
          <article class="calendar-timeline-event">

            <div class="calendar-event-time">
              ${formatCalendarTime(event.timestamp)}
            </div>

            <div class="calendar-event-content">

              <div class="calendar-entry-title">
                ${details.icon}
                ${details.title}
              </div>

              <div class="calendar-event-subtitle">
                ${escapeCalendarHtml(taskName)}
              </div>

            </div>

          </article>
        `
      };
    });
}

// =========================================================
// COMBINED DAY TIMELINE
// =========================================================

function getCalendarEventsForDate(dateString) {
  const trackerEvents =
    getCalendarTrackerMetadata()
      .filter(tracker => tracker.type === "scale")
      .flatMap(tracker => {
        return getScaleTrackerCalendarEvents(
          tracker,
          dateString
        );
      });

return [
  ...getMoodCalendarEvents(dateString),
  ...trackerEvents,
  ...getHabitCalendarEvents(dateString),
  ...getSleepCalendarEvents(dateString),
  ...getTodayAssignmentCalendarEvents(dateString),
  ...getCompletedTaskCalendarEvents(dateString),
  ...getDueTaskCalendarEvents(dateString),
  ...getDailyNoteCalendarEvents(dateString)
]

  .sort((eventA, eventB) => {
    return eventA.sortTime - eventB.sortTime;
  });
}

function renderCalendarDayDetails(dateString) {
  selectedCalendarDate = dateString;

  const details = document.getElementById(
    "calendarDayDetails"
  );

  if (!details) {
    return;
  }

  const date = new Date(
    `${dateString}T12:00:00`
  );

  const events =
    getCalendarEventsForDate(dateString);

  const title = date.toLocaleDateString(
    undefined,
    {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    }
  );

  details.innerHTML = `
    <div class="calendar-details-header">

      <h3>${title}</h3>

      <span>
        ${events.length}
        ${events.length === 1 ? "item" : "items"}
      </span>

    </div>

    ${
      events.length === 0
        ? `
          <p class="empty-state">
            Nothing recorded for this day yet.
          </p>
        `
        : `
          <div class="calendar-timeline">
            ${events
              .map(event => event.html)
              .join("")}
          </div>
        `
    }
  `;
}

// =========================================================
// MONTH GRID
// =========================================================

function getCalendarDayMoodEmoji(dateString) {
  const entries = getEntriesForDate(dateString);

  if (entries.length === 0) {
    return "";
  }

  const newestEntry = [...entries].sort(
    (entryA, entryB) => {
      return (
        new Date(entryB.timestamp) -
        new Date(entryA.timestamp)
      );
    }
  )[0];

  return newestEntry.moodEmoji || "😊";
}

function getCalendarDayActivityCount(dateString) {
  return getCalendarEventsForDate(dateString).length;
}

function renderCalendar() {
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();

  const monthTitle = document.getElementById(
    "calendarMonthTitle"
  );

  const calendarGrid = document.getElementById(
    "calendarGrid"
  );

  if (!monthTitle || !calendarGrid) {
    return;
  }

  monthTitle.textContent =
    calendarDate.toLocaleDateString(
      undefined,
      {
        month: "long",
        year: "numeric"
      }
    );

  const firstDayOfMonth =
    new Date(year, month, 1);

  const lastDayOfMonth =
    new Date(year, month + 1, 0);

  const startingWeekday =
    firstDayOfMonth.getDay();

  const numberOfDays =
    lastDayOfMonth.getDate();

  const today = new Date();
  let calendarHtml = "";

  for (
    let index = 0;
    index < startingWeekday;
    index += 1
  ) {
    calendarHtml += `
      <div class="calendar-day empty"></div>
    `;
  }

  for (
    let day = 1;
    day <= numberOfDays;
    day += 1
  ) {
    const dateString = getCalendarDateString(
      year,
      month,
      day
    );

    const isToday =
      year === today.getFullYear() &&
      month === today.getMonth() &&
      day === today.getDate();

    const moodEmoji =
      getCalendarDayMoodEmoji(dateString);

    const activityCount =
      getCalendarDayActivityCount(dateString);

    calendarHtml += `
      <button
        class="
          calendar-day
          ${isToday ? "today" : ""}
          ${
            selectedCalendarDate === dateString
              ? "selected"
              : ""
          }
        "
        type="button"
        data-date="${dateString}"
      >

        <span class="calendar-day-number">
          ${day}
        </span>

        <span class="calendar-day-mood">
          ${moodEmoji}
        </span>

        ${
          activityCount > 0
            ? `
              <span class="calendar-activity-count">
                ${activityCount}
              </span>
            `
            : ""
        }

      </button>
    `;
  }

  calendarGrid.innerHTML = calendarHtml;

  document
    .querySelectorAll(
      ".calendar-day[data-date]"
    )
    .forEach(dayButton => {
      dayButton.addEventListener(
        "click",
        event => {
          const selectedDate =
            event.currentTarget.dataset.date;

          document
            .querySelectorAll(".calendar-day")
            .forEach(button => {
              button.classList.remove("selected");
            });

          event.currentTarget.classList.add(
            "selected"
          );

          renderCalendarDayDetails(
            selectedDate
          );
        }
      );
    });

  if (selectedCalendarDate) {
    renderCalendarDayDetails(
      selectedCalendarDate
    );
  }
}

// ----- Month controls -----

document
  .getElementById("previousMonthBtn")
  ?.addEventListener("click", () => {
    calendarDate = new Date(
      calendarDate.getFullYear(),
      calendarDate.getMonth() - 1,
      1
    );

    selectedCalendarDate = null;
    renderCalendar();

    document.getElementById(
      "calendarDayDetails"
    ).innerHTML = `
      <p class="empty-state">
        Tap a day to see its details.
      </p>
    `;
  });

document
  .getElementById("nextMonthBtn")
  ?.addEventListener("click", () => {
    calendarDate = new Date(
      calendarDate.getFullYear(),
      calendarDate.getMonth() + 1,
      1
    );

    selectedCalendarDate = null;
    renderCalendar();

    document.getElementById(
      "calendarDayDetails"
    ).innerHTML = `
      <p class="empty-state">
        Tap a day to see its details.
      </p>
    `;
  });

renderCalendar();