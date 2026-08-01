// =====================
// Customization
// =====================

const TRACKER_CUSTOMIZATION_KEY =
  "trackerCustomizations";

// =========================================================
// STORAGE
// =========================================================

function getTrackerCustomizations() {
  try {
    return JSON.parse(
      localStorage.getItem(
        TRACKER_CUSTOMIZATION_KEY
      ) || "{}"
    );
  } catch (error) {
    console.error(
      "Could not load tracker customizations:",
      error
    );

    return {};
  }
}

function saveTrackerCustomizations(
  customizations
) {
  localStorage.setItem(
    TRACKER_CUSTOMIZATION_KEY,
    JSON.stringify(customizations)
  );
}

function getTrackerCustomization(
  trackerId
) {
  const customizations =
    getTrackerCustomizations();

  return customizations[trackerId] || {};
}

// =========================================================
// CUSTOMIZED TRACKER DATA
// =========================================================

function getCustomizedTracker(tracker) {
  const customization =
    getTrackerCustomization(
      tracker.id
    );

  return {
    ...tracker,

    name:
      customization.name ||
      tracker.name,

    icon:
      customization.icon ||
      tracker.icon,

    hidden:
      customization.hidden === true
  };
}

function getVisibleCustomizedTrackers() {
  return getAllTrackers()
    .map(getCustomizedTracker)
    .filter(tracker => {
      return !tracker.hidden;
    });
}

// =========================================================
// CUSTOMIZATION HUB
// =========================================================

function renderCustomizationHub() {
  const trackers = getAllTrackers()
    .map(getCustomizedTracker);

  openSubpage(`
    <section class="subpage">

      <header class="subpage-header">

        <button
          id="customizationBackBtn"
          class="subpage-back-btn"
          type="button"
        >
          ← Back
        </button>

        <h2>🎨 Customize</h2>

      </header>

      <p class="subpage-description">
        Change MyBrain’s theme and personalize
        your tracker names, emojis, labels,
        and visibility.
      </p>

      <button
        id="openThemePickerBtn"
        class="customization-save-btn"
        type="button"
      >
        🌈 Choose App Theme
      </button>

      <section class="customization-section">

        <div class="customization-section-header">

          <h3>🧠 Trackers</h3>

          <span>
            ${trackers.length}
          </span>

        </div>

        <div class="customization-tracker-list">

          ${
            trackers.length === 0
              ? `
                <p class="empty-state">
                  No trackers are available.
                </p>
              `
              : trackers
                  .map(tracker => `
                    <button
                      class="customization-tracker-card"
                      type="button"
                      data-customize-tracker="${tracker.id}"
                    >

                      <span class="customization-tracker-icon">
                        ${escapeTrackerHtml(
                          tracker.icon
                        )}
                      </span>

                      <span class="customization-tracker-info">

                        <strong>
                          ${escapeTrackerHtml(
                            tracker.name
                          )}
                        </strong>

                        <small>
                          ${getTrackerTypeLabel(
                            tracker.type
                          )}
                        </small>

                      </span>

                      <span class="customization-tracker-status">
                        ${
                          tracker.hidden
                            ? "Hidden"
                            : "Visible"
                        }
                      </span>

                    </button>
                  `)
                  .join("")
          }

        </div>

      </section>

    </section>
  `);

  document
    .getElementById(
      "customizationBackBtn"
    )
    ?.addEventListener(
      "click",
      () => closeSubpage("morePage")
    );

  document
    .getElementById(
      "openThemePickerBtn"
    )
    ?.addEventListener(
      "click",
      () => {
        if (
          typeof renderThemePicker ===
          "function"
        ) {
          renderThemePicker();
          return;
        }

        alert(
          "The theme picker has not loaded yet."
        );
      }
    );

  document
    .querySelectorAll(
      "[data-customize-tracker]"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        event => {
          const trackerId =
            event.currentTarget.dataset
              .customizeTracker;

          renderTrackerCustomizationEditor(
            trackerId
          );
        }
      );
    });
}

// =========================================================
// TRACKER CUSTOMIZATION EDITOR
// =========================================================

function renderTrackerCustomizationEditor(
  trackerId
) {
  const originalTracker =
    getAllTrackers().find(
      tracker => {
        return tracker.id === trackerId;
      }
    );

  if (!originalTracker) {
    renderCustomizationHub();
    return;
  }

  const customization =
    getTrackerCustomization(
      trackerId
    );

  const customizedTracker =
    getCustomizedTracker(
      originalTracker
    );

  const definition =
    originalTracker.type === "scale" &&
    typeof getScaleDefinition === "function"
      ? getScaleDefinition(
          originalTracker
        )
      : null;

  openSubpage(`
    <section class="subpage">

      <header class="subpage-header">

        <button
          id="trackerCustomizationBackBtn"
          class="subpage-back-btn"
          type="button"
        >
          ← Back
        </button>

        <h2>
          ${escapeTrackerHtml(
            customizedTracker.icon
          )}
          ${escapeTrackerHtml(
            customizedTracker.name
          )}
        </h2>

      </header>

      <section class="customization-editor-card">

        <label class="customization-field">

          <span>Name</span>

          <input
            id="customTrackerDisplayName"
            type="text"
            maxlength="40"
            value="${escapeTrackerHtml(
              customizedTracker.name
            )}"
          >

        </label>

        <label class="customization-field">

          <span>Emoji</span>

          <input
            id="customTrackerDisplayIcon"
            type="text"
            maxlength="4"
            value="${escapeTrackerHtml(
              customizedTracker.icon
            )}"
          >

        </label>

        ${
          originalTracker.type === "scale"
            ? `
              <label class="customization-field">

                <span>Low-end label</span>

                <input
                  id="customTrackerLowLabel"
                  type="text"
                  maxlength="50"
                  value="${escapeTrackerHtml(
                    customization.lowLabel ||
                    definition?.lowLabel ||
                    "Low"
                  )}"
                >

              </label>

              <label class="customization-field">

                <span>High-end label</span>

                <input
                  id="customTrackerHighLabel"
                  type="text"
                  maxlength="50"
                  value="${escapeTrackerHtml(
                    customization.highLabel ||
                    definition?.highLabel ||
                    "High"
                  )}"
                >

              </label>
            `
            : ""
        }

        <label class="customization-toggle-row">

          <span>
            Show on tracker hub
          </span>

          <input
            id="customTrackerVisible"
            type="checkbox"
            ${
              customizedTracker.hidden
                ? ""
                : "checked"
            }
          >

        </label>

        <p
          id="trackerCustomizationMessage"
          class="customization-message"
        ></p>

        <button
          id="saveTrackerCustomizationBtn"
          class="customization-save-btn"
          type="button"
        >
          Save Changes
        </button>

        <button
          id="resetTrackerCustomizationBtn"
          class="customization-reset-btn"
          type="button"
        >
          Reset to Default
        </button>

      </section>

    </section>
  `);

  document
    .getElementById(
      "trackerCustomizationBackBtn"
    )
    ?.addEventListener(
      "click",
      renderCustomizationHub
    );

  document
    .getElementById(
      "saveTrackerCustomizationBtn"
    )
    ?.addEventListener(
      "click",
      () => {
        saveTrackerCustomization(
          originalTracker
        );
      }
    );

  document
    .getElementById(
      "resetTrackerCustomizationBtn"
    )
    ?.addEventListener(
      "click",
      () => {
        resetTrackerCustomization(
          trackerId
        );
      }
    );
}

// =========================================================
// SAVE / RESET
// =========================================================

function saveTrackerCustomization(
  originalTracker
) {
  const customizations =
    getTrackerCustomizations();

  const name =
    document
      .getElementById(
        "customTrackerDisplayName"
      )
      ?.value.trim();

  const icon =
    document
      .getElementById(
        "customTrackerDisplayIcon"
      )
      ?.value.trim();

  const visible =
    document.getElementById(
      "customTrackerVisible"
    )?.checked;

  const message =
    document.getElementById(
      "trackerCustomizationMessage"
    );

  if (!name || !icon) {
    if (message) {
      message.textContent =
        "Please enter a name and emoji.";
    }

    return;
  }

  const nextCustomization = {
    name,
    icon,
    hidden: !visible
  };

  if (
    originalTracker.type === "scale"
  ) {
    nextCustomization.lowLabel =
      document
        .getElementById(
          "customTrackerLowLabel"
        )
        ?.value.trim() ||
      "Low";

    nextCustomization.highLabel =
      document
        .getElementById(
          "customTrackerHighLabel"
        )
        ?.value.trim() ||
      "High";
  }

  customizations[originalTracker.id] =
    nextCustomization;

  saveTrackerCustomizations(
    customizations
  );

  if (message) {
    message.textContent =
      "Customization saved ✓";
  }

  /*
    Refresh tracker cards so renamed or hidden
    trackers update immediately.
  */
  if (
    typeof renderTrackersHub ===
    "function"
  ) {
    // The hub itself will re-render next time it opens.
  }

  setTimeout(
    renderCustomizationHub,
    350
  );
}

function resetTrackerCustomization(
  trackerId
) {
  const customizations =
    getTrackerCustomizations();

  delete customizations[trackerId];

  saveTrackerCustomizations(
    customizations
  );

  renderCustomizationHub();
}