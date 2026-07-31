const morePage = document.getElementById("morePage");

morePage.innerHTML = `
  <section class="page-card more-page-content">

    <h2>☰ More</h2>

    <div class="more-dashboard">

      <button
        id="trackersCard"
        class="more-dashboard-card"
        type="button"
      >
        <span class="more-dashboard-icon">
          🧠
        </span>

        <span class="more-dashboard-title">
          Trackers
        </span>

        <span class="more-dashboard-subtitle">
          Habits, feelings, sleep, and more
        </span>
      </button>

      <button
        id="insightsCard"
        class="more-dashboard-card"
        type="button"
      >
        <span class="more-dashboard-icon">
          📊
        </span>

        <span class="more-dashboard-title">
          Insights
        </span>

        <span class="more-dashboard-subtitle">
          Patterns and correlations
        </span>
      </button>

      <button
        id="achievementsCard"
        class="more-dashboard-card"
        type="button"
      >
        <span class="more-dashboard-icon">
          🏆
        </span>

        <span class="more-dashboard-title">
          Achievements
        </span>

        <span class="more-dashboard-subtitle">
          Streaks and milestones
        </span>
      </button>

      <button
        id="customizeCard"
        class="more-dashboard-card"
        type="button"
      >
        <span class="more-dashboard-icon">
          🎨
        </span>

        <span class="more-dashboard-title">
          Customize
        </span>

        <span class="more-dashboard-subtitle">
          Themes, emojis, labels, and layouts
        </span>
      </button>

      <button
        id="settingsCard"
        class="more-dashboard-card settings-card"
        type="button"
      >
        <span class="more-dashboard-icon">
          ⚙️
        </span>

        <span class="more-dashboard-title">
          Settings
        </span>

        <span class="more-dashboard-subtitle">
          Notifications and preferences
        </span>
      </button>

    </div>

  </section>
`;

document
  .getElementById("trackersCard")
  ?.addEventListener(
    "click",
    renderTrackersHub
  );

document
  .getElementById("insightsCard")
  ?.addEventListener(
    "click",
    renderInsightsPage
  );

document
  .getElementById("customizeCard")
  ?.addEventListener("click", () => {
    if (
      typeof renderCustomizationHub ===
      "function"
    ) {
      renderCustomizationHub();
      return;
    }

    alert(
      "Customization is being connected next!"
    );
  });

document
  .getElementById("achievementsCard")
  ?.addEventListener("click", () => {
    if (
      typeof renderAchievementsPage ===
      "function"
    ) {
      renderAchievementsPage();
      return;
    }

    alert(
      "Achievements are coming soon!"
    );
  });

document
  .getElementById("settingsCard")
  ?.addEventListener("click", () => {
    if (
      typeof renderSettingsPage ===
      "function"
    ) {
      renderSettingsPage();
      return;
    }

    alert(
      "Settings are being connected soon!"
    );
  });