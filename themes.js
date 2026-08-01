// =====================
// Themes
// =====================

const APP_THEME_KEY = "mybrainTheme";

const appThemes = [
  {
    id: "midnight",
    name: "Midnight",
    icon: "🌙"
  },
  {
    id: "cotton-candy",
    name: "Cotton Candy",
    icon: "🌸"
  },
  {
    id: "forest",
    name: "Forest",
    icon: "🌿"
  },
  {
    id: "ocean",
    name: "Ocean",
    icon: "🌊"
  },
  {
    id: "sunset",
    name: "Sunset",
    icon: "🌅"
  },
  {
    id: "cozy-cafe",
    name: "Cozy Café",
    icon: "☕"
  },
  {
    id: "cottagecore",
    name: "Cottagecore",
    icon: "🍄"
  },
  {
    id: "dreamhouse",
    name: "Dreamhouse",
    icon: "💖"
  }
];

function getSavedTheme() {
  return (
    localStorage.getItem(APP_THEME_KEY) ||
    "midnight"
  );
}

function applyTheme(themeId) {
  const validTheme = appThemes.some(
    theme => theme.id === themeId
  );

  const nextTheme = validTheme
    ? themeId
    : "midnight";

  document.documentElement.dataset.theme =
    nextTheme;

  localStorage.setItem(
    APP_THEME_KEY,
    nextTheme
  );

  updateThemeColorMeta();
}

function updateThemeColorMeta() {
  const metaThemeColor =
    document.querySelector(
      'meta[name="theme-color"]'
    );

  if (!metaThemeColor) {
    return;
  }

  const backgroundColor =
    getComputedStyle(
      document.documentElement
    )
      .getPropertyValue("--theme-background")
      .trim();

  if (backgroundColor) {
    metaThemeColor.setAttribute(
      "content",
      backgroundColor
    );
  }
}

function renderThemePicker() {
  const currentTheme =
    getSavedTheme();

  openSubpage(`
    <section class="subpage">

      <header class="subpage-header">

        <button
          id="themePickerBackBtn"
          class="subpage-back-btn"
          type="button"
        >
          ← Back
        </button>

        <h2>🌈 Themes</h2>

      </header>

      <p class="subpage-description">
        Pick a full color palette for MyBrain.
        Your choice saves automatically.
      </p>

      <div class="theme-picker-grid">

        ${appThemes
          .map(theme => `
            <button
              class="theme-option-card ${
                currentTheme === theme.id
                  ? "selected"
                  : ""
              }"
              type="button"
              data-theme-choice="${theme.id}"
            >

              <span class="theme-option-icon">
                ${theme.icon}
              </span>

              <span class="theme-option-name">
                ${theme.name}
              </span>

              <span
                class="theme-preview-strip"
                data-theme-preview="${theme.id}"
              >
                <i></i>
                <i></i>
                <i></i>
              </span>

              <span class="theme-option-status">
                ${
                  currentTheme === theme.id
                    ? "Selected ✓"
                    : "Tap to apply"
                }
              </span>

            </button>
          `)
          .join("")}

      </div>

    </section>
  `);

  document
    .getElementById("themePickerBackBtn")
    ?.addEventListener(
      "click",
      renderCustomizationHub
    );

  document
    .querySelectorAll(
      "[data-theme-choice]"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        event => {
          const themeId =
            event.currentTarget.dataset
              .themeChoice;

          applyTheme(themeId);
          renderThemePicker();
        }
      );
    });
}

applyTheme(getSavedTheme());