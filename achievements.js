// =====================
// Achievements
// =====================

function getAchievementStats() {
  const moodEntries =
    typeof getEntries === "function"
      ? getEntries()
      : [];

  const journalEntries =
    typeof getJournalEntries === "function"
      ? getJournalEntries()
      : [];

  const dailyNotes =
    typeof getDailyJournalNotes === "function"
      ? getDailyJournalNotes()
      : {};

  const masterlistTasks =
    typeof getMasterlistTasks === "function"
      ? getMasterlistTasks()
      : [];

  const trackerLogs =
    typeof getTrackerLogs === "function"
      ? getTrackerLogs()
      : {};

  const sleepEntries =
    Array.isArray(trackerLogs.sleep)
      ? trackerLogs.sleep
      : [];

  const completedTasks =
    masterlistTasks.filter(task => {
      return task.completed;
    });

  const completedHabitDays =
    Object.entries(trackerLogs)
      .filter(([, value]) => {
        return (
          value &&
          !Array.isArray(value) &&
          typeof value === "object"
        );
      })
      .reduce((total, [, value]) => {
        return total + Object.values(value)
          .filter(item => item === true)
          .length;
      }, 0);

  const timestampedTrackerEntries =
    Object.entries(trackerLogs)
      .filter(([trackerId, value]) => {
        return (
          trackerId !== "sleep" &&
          Array.isArray(value)
        );
      })
      .reduce((total, [, entries]) => {
        return total + entries.length;
      }, 0);

  const dailyNoteCount =
    Object.values(dailyNotes)
      .filter(note => {
        return note?.text?.trim();
      })
      .length;

  return {
    moodCheckIns: moodEntries.length,
    journalEntries: journalEntries.length,
    dailyNotes: dailyNoteCount,
    totalJournalWriting:
      journalEntries.length +
      dailyNoteCount,
    completedTasks: completedTasks.length,
    sleepEntries: sleepEntries.length,
    trackerCheckIns:
      timestampedTrackerEntries,
    completedHabitDays
  };
}

function getAchievementDefinitions(stats) {
  return [
    {
      id: "first-check-in",
      icon: "🧠",
      title: "First Check-In",
      description:
        "Save your first mood check-in.",
      current: stats.moodCheckIns,
      target: 1
    },

    {
      id: "self-aware-10",
      icon: "🔍",
      title: "Getting to Know Myself",
      description:
        "Save 10 mood check-ins.",
      current: stats.moodCheckIns,
      target: 10
    },

    {
      id: "self-aware-50",
      icon: "📈",
      title: "Self-Aware",
      description:
        "Save 50 mood check-ins.",
      current: stats.moodCheckIns,
      target: 50
    },

    {
      id: "first-journal-entry",
      icon: "📖",
      title: "Dear Journal",
      description:
        "Save your first journal entry or Daily Note.",
      current:
        stats.totalJournalWriting,
      target: 1
    },

    {
      id: "writer-10",
      icon: "✍️",
      title: "Writer",
      description:
        "Save 10 journal entries or Daily Notes.",
      current:
        stats.totalJournalWriting,
      target: 10
    },

    {
      id: "writer-50",
      icon: "📚",
      title: "Storykeeper",
      description:
        "Save 50 journal entries or Daily Notes.",
      current:
        stats.totalJournalWriting,
      target: 50
    },

    {
      id: "first-task",
      icon: "✅",
      title: "Getting Things Done",
      description:
        "Complete your first task.",
      current: stats.completedTasks,
      target: 1
    },

    {
      id: "productive-25",
      icon: "🧹",
      title: "Productive",
      description:
        "Complete 25 tasks.",
      current: stats.completedTasks,
      target: 25
    },

    {
      id: "productive-100",
      icon: "🏆",
      title: "Task Master",
      description:
        "Complete 100 tasks.",
      current: stats.completedTasks,
      target: 100
    },

    {
      id: "first-sleep",
      icon: "🌙",
      title: "Good Night",
      description:
        "Log your first sleep entry.",
      current: stats.sleepEntries,
      target: 1
    },

    {
      id: "sleep-7",
      icon: "😴",
      title: "Sleep Tracker",
      description:
        "Log sleep 7 times.",
      current: stats.sleepEntries,
      target: 7
    },

    {
      id: "sleep-30",
      icon: "💤",
      title: "Dream Keeper",
      description:
        "Log sleep 30 times.",
      current: stats.sleepEntries,
      target: 30
    },

    {
      id: "tracker-10",
      icon: "📊",
      title: "Pattern Starter",
      description:
        "Save 10 timestamped tracker check-ins.",
      current: stats.trackerCheckIns,
      target: 10
    },

    {
      id: "tracker-100",
      icon: "🧪",
      title: "Personal Scientist",
      description:
        "Save 100 timestamped tracker check-ins.",
      current: stats.trackerCheckIns,
      target: 100
    },

    {
      id: "habit-7",
      icon: "🔥",
      title: "Building Momentum",
      description:
        "Complete habits on 7 tracked days.",
      current:
        stats.completedHabitDays,
      target: 7
    },

    {
      id: "habit-30",
      icon: "⭐",
      title: "Consistency",
      description:
        "Complete habits on 30 tracked days.",
      current:
        stats.completedHabitDays,
      target: 30
    }
  ];
}

function getAchievementProgress(
  current,
  target
) {
  if (target <= 0) {
    return 100;
  }

  return Math.min(
    100,
    Math.round(
      (current / target) * 100
    )
  );
}

function renderAchievementCard(
  achievement
) {
  const unlocked =
    achievement.current >=
    achievement.target;

  const progress =
    getAchievementProgress(
      achievement.current,
      achievement.target
    );

  return `
    <article
      class="achievement-card ${
        unlocked ? "unlocked" : "locked"
      }"
    >

      <div class="achievement-icon">
        ${achievement.icon}
      </div>

      <div class="achievement-content">

        <div class="achievement-header">

          <h3>
            ${achievement.title}
          </h3>

          <span class="achievement-status">
            ${
              unlocked
                ? "Unlocked ✓"
                : `${achievement.current}/${achievement.target}`
            }
          </span>

        </div>

        <p>
          ${achievement.description}
        </p>

        <div class="achievement-progress-track">

          <div
            class="achievement-progress-fill"
            style="width: ${progress}%"
          ></div>

        </div>

      </div>

    </article>
  `;
}

function renderAchievementsPage() {
  const stats = getAchievementStats();

  const achievements =
    getAchievementDefinitions(stats);

  const unlockedAchievements =
    achievements.filter(achievement => {
      return (
        achievement.current >=
        achievement.target
      );
    });

  openSubpage(`
    <section class="subpage">

      <header class="subpage-header">

        <button
          id="achievementsBackBtn"
          class="subpage-back-btn"
          type="button"
        >
          ← Back
        </button>

        <h2>🏆 Achievements</h2>

      </header>

      <section class="achievement-summary-card">

        <div>

          <span>Unlocked</span>

          <strong>
            ${unlockedAchievements.length}
          </strong>

        </div>

        <div>

          <span>Total</span>

          <strong>
            ${achievements.length}
          </strong>

        </div>

      </section>

      <div class="achievement-list">

        ${achievements
          .map(renderAchievementCard)
          .join("")}

      </div>

    </section>
  `);

  document
    .getElementById(
      "achievementsBackBtn"
    )
    ?.addEventListener(
      "click",
      () => closeSubpage("morePage")
    );
}