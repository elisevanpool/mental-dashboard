// =====================
// MyBrain Insights
// =====================

const INSIGHTS_START_DATE_KEY =
  "mybrainInsightsStartDate";

const MIN_DAYS_FOR_PATTERN = 5;

// =========================================================
// GENERAL HELPERS
// =========================================================

function getInsightsStartTimestamp() {
  const storedValue =
    localStorage.getItem(
      INSIGHTS_START_DATE_KEY
    );

  return storedValue || null;
}

function setInsightsStartTimestamp(
  timestamp = new Date().toISOString()
) {
  localStorage.setItem(
    INSIGHTS_START_DATE_KEY,
    timestamp
  );
}

function clearInsightsStartTimestamp() {
  localStorage.removeItem(
    INSIGHTS_START_DATE_KEY
  );
}

function isAfterInsightsStart(timestamp) {
  const startTimestamp =
    getInsightsStartTimestamp();

  if (!startTimestamp) {
    return false;
  }

  if (!timestamp) {
    return false;
  }

  return (
    new Date(timestamp).getTime() >=
    new Date(startTimestamp).getTime()
  );
}

function formatInsightsStartDate() {
  const timestamp =
    getInsightsStartTimestamp();

  if (!timestamp) {
    return "";
  }

  return new Date(timestamp).toLocaleString(
    undefined,
    {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }
  );
}

function roundInsightValue(
  value,
  decimalPlaces = 1
) {
  const multiplier =
    10 ** decimalPlaces;

  return (
    Math.round(
      Number(value) * multiplier
    ) / multiplier
  );
}

function averageInsightValues(values) {
  const validValues = values
    .map(Number)
    .filter(Number.isFinite);

  if (validValues.length === 0) {
    return null;
  }

  return roundInsightValue(
    validValues.reduce(
      (sum, value) => sum + value,
      0
    ) / validValues.length
  );
}

function getInsightDateString(timestamp) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  if (
    typeof getLocalDateString ===
    "function"
  ) {
    return getLocalDateString(date);
  }

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getRecentInsightDates(
  numberOfDays = 7
) {
  const dates = [];

  for (
    let daysAgo = 0;
    daysAgo < numberOfDays;
    daysAgo += 1
  ) {
    const date = new Date();

    date.setHours(12, 0, 0, 0);
    date.setDate(
      date.getDate() - daysAgo
    );

    dates.push({
      dateString:
        getInsightDateString(date),

      label:
        daysAgo === 0
          ? "Today"
          : daysAgo === 1
            ? "Yesterday"
            : date.toLocaleDateString(
                undefined,
                {
                  weekday: "long"
                }
              )
    });
  }

  return dates;
}

function getInsightTrackerMetadata() {
  if (
    typeof getAllTrackers ===
    "function"
  ) {
    return getAllTrackers();
  }

  return [];
}

function getInsightTracker(trackerId) {
  return (
    getInsightTrackerMetadata().find(
      tracker =>
        tracker.id === trackerId
    ) || {
      id: trackerId,
      name: trackerId,
      icon: "🧠",
      type: "tracker"
    }
  );
}

// =========================================================
// MOOD DATA
// =========================================================

function getInsightMoodEntries() {
  if (
    typeof getEntries !== "function"
  ) {
    return [];
  }

  return getEntries().filter(entry => {
    return isAfterInsightsStart(
      entry.timestamp
    );
  });
}

function getMoodEntriesForInsightDate(
  dateString
) {
  return getInsightMoodEntries().filter(
    entry => {
      return (
        getInsightDateString(
          entry.timestamp
        ) === dateString
      );
    }
  );
}

function getMoodAverageForInsightDate(
  dateString
) {
  const entries =
    getMoodEntriesForInsightDate(
      dateString
    );

  return averageInsightValues(
    entries.map(entry => entry.mood)
  );
}

function getMoodSummary() {
  const entries =
    getInsightMoodEntries();

  return {
    count: entries.length,

    average: averageInsightValues(
      entries.map(entry => entry.mood)
    ),

    highest:
      entries.length > 0
        ? Math.max(
            ...entries.map(entry =>
              Number(entry.mood)
            )
          )
        : null,

    lowest:
      entries.length > 0
        ? Math.min(
            ...entries.map(entry =>
              Number(entry.mood)
            )
          )
        : null
  };
}

// =========================================================
// SCALE TRACKER DATA
// =========================================================

function getInsightScaleEntries(
  trackerId
) {
  if (
    typeof getScaleEntries !==
    "function"
  ) {
    return [];
  }

  return getScaleEntries(
    trackerId
  ).filter(entry => {
    return isAfterInsightsStart(
      entry.timestamp
    );
  });
}

function getScaleEntriesForInsightDate(
  trackerId,
  dateString
) {
  return getInsightScaleEntries(
    trackerId
  ).filter(entry => {
    return (
      entry.dateString === dateString ||
      getInsightDateString(
        entry.timestamp
      ) === dateString
    );
  });
}

function getScaleDailyAverage(
  trackerId,
  dateString
) {
  const entries =
    getScaleEntriesForInsightDate(
      trackerId,
      dateString
    );

  return averageInsightValues(
    entries.map(entry => entry.value)
  );
}

function getScaleInsightSummary(
  trackerId
) {
  const entries =
    getInsightScaleEntries(
      trackerId
    );

  const recentDates =
    getRecentInsightDates(7);

  const dailyValues = recentDates
    .map(day => {
      const value =
        getScaleDailyAverage(
          trackerId,
          day.dateString
        );

      return {
        ...day,
        value
      };
    })
    .filter(day => day.value !== null);

  const highestDay =
    dailyValues.length > 0
      ? [...dailyValues].sort(
          (dayA, dayB) =>
            dayB.value - dayA.value
        )[0]
      : null;

  const lowestDay =
    dailyValues.length > 0
      ? [...dailyValues].sort(
          (dayA, dayB) =>
            dayA.value - dayB.value
        )[0]
      : null;

  return {
    count: entries.length,

    average: averageInsightValues(
      entries.map(entry => entry.value)
    ),

    highestDay,
    lowestDay,
    daysTracked:
      new Set(
        entries.map(entry =>
          entry.dateString ||
          getInsightDateString(
            entry.timestamp
          )
        )
      ).size
  };
}

// =========================================================
// SLEEP DATA
// =========================================================

function getInsightSleepEntries() {
  if (
    typeof getNumberTrackerEntries !==
    "function"
  ) {
    return [];
  }

  return getNumberTrackerEntries(
    "sleep"
  ).filter(entry => {
    return isAfterInsightsStart(
      entry.timestamp ||
      entry.wakeTimestamp
    );
  });
}

function getSleepSummary() {
  const entries =
    getInsightSleepEntries();

  return {
    count: entries.length,

    averageHours:
      averageInsightValues(
        entries.map(
          entry => entry.hoursSlept
        )
      ),

    averageQuality:
      averageInsightValues(
        entries.map(
          entry => entry.quality
        )
      ),

    longest:
      entries.length > 0
        ? Math.max(
            ...entries.map(entry =>
              Number(
                entry.hoursSlept
              )
            )
          )
        : null,

    shortest:
      entries.length > 0
        ? Math.min(
            ...entries.map(entry =>
              Number(
                entry.hoursSlept
              )
            )
          )
        : null
  };
}

function getSleepEntryForInsightDate(
  dateString
) {
  return getInsightSleepEntries().find(
    entry => {
      return (
        entry.dateString ===
        dateString
      );
    }
  ) || null;
}

// =========================================================
// HABIT DATA
// =========================================================

function getHabitInsightSummary(
  trackerId
) {
  const logs =
    typeof getTrackerLogs ===
    "function"
      ? getTrackerLogs()
      : {};

  const trackerLogs =
    logs[trackerId];

  if (
    !trackerLogs ||
    Array.isArray(trackerLogs) ||
    typeof trackerLogs !== "object"
  ) {
    return {
      totalCompletions: 0,
      currentStreak: 0,
      bestStreak: 0
    };
  }

  const startTimestamp =
    getInsightsStartTimestamp();

  const completionDates =
    Object.entries(trackerLogs)
      .filter(([, completed]) => {
        return completed === true;
      })
      .map(([dateString]) => {
        return dateString;
      })
      .filter(dateString => {
        if (!startTimestamp) {
          return false;
        }

        const date = new Date(
          `${dateString}T23:59:59`
        );

        return (
          date.getTime() >=
          new Date(
            startTimestamp
          ).getTime()
        );
      });

  return {
    totalCompletions:
      completionDates.length,

    currentStreak:
      typeof getCurrentHabitStreak ===
      "function"
        ? getCurrentHabitStreak(
            trackerId
          )
        : 0,

    bestStreak:
      typeof getBestHabitStreak ===
      "function"
        ? getBestHabitStreak(
            trackerId
          )
        : 0
  };
}

// =========================================================
// TASK DATA
// =========================================================

function getInsightTasks() {
  if (
    typeof getMasterlistTasks !==
    "function"
  ) {
    return [];
  }

  return getMasterlistTasks();
}

function getTaskInsightSummary() {
  const tasks = getInsightTasks();

  const completedTasks =
    tasks.filter(task => {
      return (
        task.completedAt &&
        isAfterInsightsStart(
          task.completedAt
        )
      );
    });

  const createdTasks =
    tasks.filter(task => {
      return (
        task.createdAt &&
        isAfterInsightsStart(
          task.createdAt
        )
      );
    });

  return {
    created: createdTasks.length,
    completed:
      completedTasks.length,

    completionRate:
      createdTasks.length > 0
        ? Math.round(
            (
              completedTasks.length /
              createdTasks.length
            ) * 100
          )
        : null
  };
}

function getCompletedTaskCountForDate(
  dateString
) {
  return getInsightTasks().filter(
    task => {
      return (
        task.completedAt &&
        isAfterInsightsStart(
          task.completedAt
        ) &&
        getInsightDateString(
          task.completedAt
        ) === dateString
      );
    }
  ).length;
}

// =========================================================
// JOURNAL DATA
// =========================================================

function getJournalInsightSummary() {
  const standaloneEntries =
    typeof getJournalEntries ===
    "function"
      ? getJournalEntries().filter(
          entry => {
            return isAfterInsightsStart(
              entry.createdAt
            );
          }
        )
      : [];

  const dailyNotes =
    typeof getDailyJournalNotes ===
    "function"
      ? Object.values(
          getDailyJournalNotes()
        ).filter(note => {
          return (
            note?.text?.trim() &&
            isAfterInsightsStart(
              note.createdAt ||
              note.updatedAt
            )
          );
        })
      : [];

  return {
    standalone:
      standaloneEntries.length,

    dailyNotes:
      dailyNotes.length,

    total:
      standaloneEntries.length +
      dailyNotes.length
  };
}

// =========================================================
// SIMPLE PATTERN DETECTION
// =========================================================

function getPairedDailyValues(
  firstValueGetter,
  secondValueGetter,
  numberOfDays = 30
) {
  return getRecentInsightDates(
    numberOfDays
  )
    .map(day => {
      return {
        dateString:
          day.dateString,

        first:
          firstValueGetter(
            day.dateString
          ),

        second:
          secondValueGetter(
            day.dateString
          )
      };
    })
    .filter(pair => {
      return (
        Number.isFinite(
          Number(pair.first)
        ) &&
        Number.isFinite(
          Number(pair.second)
        )
      );
    });
}

function calculatePearsonCorrelation(
  pairs
) {
  if (
    pairs.length <
    MIN_DAYS_FOR_PATTERN
  ) {
    return null;
  }

  const firstValues =
    pairs.map(pair =>
      Number(pair.first)
    );

  const secondValues =
    pairs.map(pair =>
      Number(pair.second)
    );

  const firstAverage =
    averageInsightValues(
      firstValues
    );

  const secondAverage =
    averageInsightValues(
      secondValues
    );

  let numerator = 0;
  let firstSquaredTotal = 0;
  let secondSquaredTotal = 0;

  pairs.forEach(pair => {
    const firstDifference =
      Number(pair.first) -
      firstAverage;

    const secondDifference =
      Number(pair.second) -
      secondAverage;

    numerator +=
      firstDifference *
      secondDifference;

    firstSquaredTotal +=
      firstDifference ** 2;

    secondSquaredTotal +=
      secondDifference ** 2;
  });

  const denominator = Math.sqrt(
    firstSquaredTotal *
    secondSquaredTotal
  );

  if (denominator === 0) {
    return null;
  }

  return roundInsightValue(
    numerator / denominator,
    2
  );
}

function describeCorrelation(
  correlation
) {
  if (correlation === null) {
    return null;
  }

  const strength =
    Math.abs(correlation);

  if (strength < 0.25) {
    return "No clear relationship yet";
  }

  if (strength < 0.5) {
    return correlation > 0
      ? "A possible positive relationship"
      : "A possible inverse relationship";
  }

  if (strength < 0.75) {
    return correlation > 0
      ? "A moderate positive relationship"
      : "A moderate inverse relationship";
  }

  return correlation > 0
    ? "A strong positive relationship"
    : "A strong inverse relationship";
}

function getPatternCards() {
  const patternDefinitions = [
    {
      icon: "😴",
      title:
        "Sleep and Mood",

      firstLabel:
        "sleep hours",

      secondLabel:
        "mood",

      pairs:
        getPairedDailyValues(
          dateString => {
            return (
              getSleepEntryForInsightDate(
                dateString
              )?.hoursSlept ?? null
            );
          },

          dateString => {
            return getMoodAverageForInsightDate(
              dateString
            );
          }
        )
    },

    {
      icon: "🥺",
      title:
        "Loneliness and Mood",

      firstLabel:
        "loneliness",

      secondLabel:
        "mood",

      pairs:
        getPairedDailyValues(
          dateString => {
            return getScaleDailyAverage(
              "loneliness",
              dateString
            );
          },

          dateString => {
            return getMoodAverageForInsightDate(
              dateString
            );
          }
        )
    },

    {
      icon: "🥱",
      title:
        "Social Battery and Mood",

      firstLabel:
        "social battery",

      secondLabel:
        "mood",

      pairs:
        getPairedDailyValues(
          dateString => {
            return getScaleDailyAverage(
              "social-battery",
              dateString
            );
          },

          dateString => {
            return getMoodAverageForInsightDate(
              dateString
            );
          }
        )
    },

    {
      icon: "✅",
      title:
        "Mood and Completed Tasks",

      firstLabel:
        "mood",

      secondLabel:
        "completed tasks",

      pairs:
        getPairedDailyValues(
          dateString => {
            return getMoodAverageForInsightDate(
              dateString
            );
          },

          dateString => {
            const taskCount =
              getCompletedTaskCountForDate(
                dateString
              );

            return taskCount > 0
              ? taskCount
              : null;
          }
        )
    }
  ];

  return patternDefinitions.map(
    pattern => {
      const correlation =
        calculatePearsonCorrelation(
          pattern.pairs
        );

      return {
        ...pattern,
        correlation,

        description:
          describeCorrelation(
            correlation
          )
      };
    }
  );
}

// =========================================================
// RENDER HELPERS
// =========================================================

function renderInsightMetric(
  label,
  value,
  suffix = ""
) {
  return `
    <div class="insight-metric">

      <span>${label}</span>

      <strong>
        ${
          value === null ||
          value === undefined
            ? "—"
            : `${value}${suffix}`
        }
      </strong>

    </div>
  `;
}

function renderScaleInsightCard(
  trackerId
) {
  const tracker =
    getInsightTracker(trackerId);

  const summary =
    getScaleInsightSummary(
      trackerId
    );

  return `
    <article class="insight-overview-card">

      <div class="insight-overview-header">

        <h3>
          ${tracker.icon}
          ${tracker.name}
        </h3>

        <span>
          ${summary.count}
          ${
            summary.count === 1
              ? "check-in"
              : "check-ins"
          }
        </span>

      </div>

      <div class="insight-metric-grid">

        ${renderInsightMetric(
          "Average",
          summary.average,
          summary.average !== null
            ? "/10"
            : ""
        )}

        ${renderInsightMetric(
          "Days tracked",
          summary.daysTracked
        )}

      </div>

      ${
        summary.highestDay
          ? `
            <p class="insight-card-note">
              Highest recent day:
              <strong>
                ${summary.highestDay.label}
                (${summary.highestDay.value})
              </strong>
            </p>
          `
          : `
            <p class="insight-card-note">
              Add check-ins to see
              recent highs and lows.
            </p>
          `
      }

    </article>
  `;
}

function renderPatternCard(pattern) {
  const enoughData =
    pattern.pairs.length >=
    MIN_DAYS_FOR_PATTERN;

  return `
    <article class="pattern-card">

      <div class="pattern-card-header">

        <h3>
          ${pattern.icon}
          ${pattern.title}
        </h3>

        <span>
          ${pattern.pairs.length}
          paired
          ${
            pattern.pairs.length === 1
              ? "day"
              : "days"
          }
        </span>

      </div>

      ${
        enoughData &&
        pattern.description
          ? `
            <p class="pattern-result">
              ${pattern.description}
            </p>

            <p class="pattern-disclaimer">
              This is an observed association,
              not proof that one thing caused
              the other.
            </p>
          `
          : `
            <p class="pattern-empty">
              Track both
              ${pattern.firstLabel}
              and
              ${pattern.secondLabel}
              on at least
              ${MIN_DAYS_FOR_PATTERN}
              overlapping days.
            </p>
          `
      }

    </article>
  `;
}

// =========================================================
// MAIN PAGE
// =========================================================

function renderInsightsPage() {
  const startTimestamp =
    getInsightsStartTimestamp();

  if (!startTimestamp) {
    renderInsightsSetupPage();
    return;
  }

  const mood =
    getMoodSummary();

  const sleep =
    getSleepSummary();

  const medication =
    getHabitInsightSummary(
      "medication"
    );

  const tasks =
    getTaskInsightSummary();

  const journal =
    getJournalInsightSummary();

  const patterns =
    getPatternCards();

  openSubpage(`
    <section class="subpage">

      <header class="subpage-header">

        <button
          id="insightsBackBtn"
          class="subpage-back-btn"
          type="button"
        >
          ← Back
        </button>

        <h2>📊 Insights</h2>

      </header>

      <section class="insights-start-banner">

        <div>

          <strong>
            Real-data period
          </strong>

          <span>
            Starting
            ${formatInsightsStartDate()}
          </span>

        </div>

        <button
          id="changeInsightsStartBtn"
          type="button"
        >
          Reset
        </button>

      </section>

      <section class="insights-overview-section">

        <h3>Overview</h3>

        <div class="insights-overview-grid">

          <article class="insight-overview-card">

            <div class="insight-overview-header">

              <h3>😊 Mood</h3>

              <span>
                ${mood.count}
                ${
                  mood.count === 1
                    ? "entry"
                    : "entries"
                }
              </span>

            </div>

            <div class="insight-metric-grid">

              ${renderInsightMetric(
                "Average",
                mood.average
              )}

              ${renderInsightMetric(
                "Highest",
                mood.highest
              )}

              ${renderInsightMetric(
                "Lowest",
                mood.lowest
              )}

            </div>

          </article>

          ${renderScaleInsightCard(
            "loneliness"
          )}

          ${renderScaleInsightCard(
            "social-battery"
          )}

          <article class="insight-overview-card">

            <div class="insight-overview-header">

              <h3>😴 Sleep</h3>

              <span>
                ${sleep.count}
                ${
                  sleep.count === 1
                    ? "entry"
                    : "entries"
                }
              </span>

            </div>

            <div class="insight-metric-grid">

              ${renderInsightMetric(
                "Average",
                sleep.averageHours,
                sleep.averageHours !== null
                  ? " hr"
                  : ""
              )}

              ${renderInsightMetric(
                "Quality",
                sleep.averageQuality,
                sleep.averageQuality !== null
                  ? "/10"
                  : ""
              )}

            </div>

          </article>

          <article class="insight-overview-card">

            <div class="insight-overview-header">

              <h3>💊 Medication</h3>

              <span>
                ${
                  medication.totalCompletions
                }
                completions
              </span>

            </div>

            <div class="insight-metric-grid">

              ${renderInsightMetric(
                "Current streak",
                medication.currentStreak
              )}

              ${renderInsightMetric(
                "Best streak",
                medication.bestStreak
              )}

            </div>

          </article>

          <article class="insight-overview-card">

            <div class="insight-overview-header">

              <h3>✅ Tasks</h3>

              <span>
                Since start
              </span>

            </div>

            <div class="insight-metric-grid">

              ${renderInsightMetric(
                "Created",
                tasks.created
              )}

              ${renderInsightMetric(
                "Completed",
                tasks.completed
              )}

              ${renderInsightMetric(
                "Completion",
                tasks.completionRate,
                tasks.completionRate !== null
                  ? "%"
                  : ""
              )}

            </div>

          </article>

          <article class="insight-overview-card">

            <div class="insight-overview-header">

              <h3>📖 Journal</h3>

              <span>
                ${journal.total}
                ${
                  journal.total === 1
                    ? "entry"
                    : "entries"
                }
              </span>

            </div>

            <div class="insight-metric-grid">

              ${renderInsightMetric(
                "Daily notes",
                journal.dailyNotes
              )}

              ${renderInsightMetric(
                "Notebook entries",
                journal.standalone
              )}

            </div>

          </article>

        </div>

      </section>

      <section class="insights-pattern-section">

        <div class="insights-section-heading">

          <h3>Possible Patterns</h3>

          <p>
            Patterns only appear when
            enough overlapping days exist.
          </p>

        </div>

        <div class="pattern-card-list">

          ${patterns
            .map(renderPatternCard)
            .join("")}

        </div>

      </section>

    </section>
  `);

  document
    .getElementById(
      "insightsBackBtn"
    )
    ?.addEventListener(
      "click",
      () =>
        closeSubpage("morePage")
    );

  document
    .getElementById(
      "changeInsightsStartBtn"
    )
    ?.addEventListener(
      "click",
      renderInsightsResetPage
    );
}

// =========================================================
// SETUP / RESET
// =========================================================

function renderInsightsSetupPage() {
  openSubpage(`
    <section class="subpage">

      <header class="subpage-header">

        <button
          id="insightsSetupBackBtn"
          class="subpage-back-btn"
          type="button"
        >
          ← Back
        </button>

        <h2>📊 Insights</h2>

      </header>

      <section class="insights-setup-card">

        <div class="insights-setup-icon">
          🧪
        </div>

        <h3>
          Start with clean data
        </h3>

        <p>
          Your earlier entries were used
          while building and testing MyBrain.
          Insights can ignore all of them
          without deleting anything.
        </p>

        <p>
          When you press the button below,
          only data saved from that moment
          forward will count toward your
          statistics and possible patterns.
        </p>

        <button
          id="startRealInsightsBtn"
          class="insights-primary-btn"
          type="button"
        >
          Start Real Data Now
        </button>

      </section>

    </section>
  `);

  document
    .getElementById(
      "insightsSetupBackBtn"
    )
    ?.addEventListener(
      "click",
      () =>
        closeSubpage("morePage")
    );

  document
    .getElementById(
      "startRealInsightsBtn"
    )
    ?.addEventListener("click", () => {
      setInsightsStartTimestamp();
      renderInsightsPage();
    });
}

function renderInsightsResetPage() {
  openSubpage(`
    <section class="subpage">

      <header class="subpage-header">

        <button
          id="insightsResetBackBtn"
          class="subpage-back-btn"
          type="button"
        >
          ← Back
        </button>

        <h2>Reset Insights</h2>

      </header>

      <section class="insights-setup-card">

        <div class="insights-setup-icon">
          🔄
        </div>

        <h3>
          Choose a new starting point?
        </h3>

        <p>
          Your entries will stay saved.
          Only the date from which Insights
          begins counting will change.
        </p>

        <button
          id="confirmInsightsResetBtn"
          class="insights-primary-btn"
          type="button"
        >
          Start Again From Now
        </button>

        <button
          id="cancelInsightsResetBtn"
          class="insights-secondary-btn"
          type="button"
        >
          Cancel
        </button>

      </section>

    </section>
  `);

  document
    .getElementById(
      "insightsResetBackBtn"
    )
    ?.addEventListener(
      "click",
      renderInsightsPage
    );

  document
    .getElementById(
      "cancelInsightsResetBtn"
    )
    ?.addEventListener(
      "click",
      renderInsightsPage
    );

  document
    .getElementById(
      "confirmInsightsResetBtn"
    )
    ?.addEventListener("click", () => {
      setInsightsStartTimestamp();
      renderInsightsPage();
    });
}