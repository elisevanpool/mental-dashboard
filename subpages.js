const subpageContainer = document.getElementById("subpageContainer");
const bottomNav = document.querySelector(".bottom-nav");

const mainPageIds = [
  "todayPage",
  "masterlistPage",
  "journalPage",
  "calendarPage",
  "morePage"
];

const TRACKERS_STORAGE_KEY = "customTrackers";

const defaultTrackers = [
  {
    id: "sleep",
    name: "Sleep",
    icon: "😴",
    type: "number",
    unit: "hours",
    builtIn: true
  },
  {
    id: "loneliness",
    name: "Loneliness",
    icon: "🥺",
    type: "scale",
    builtIn: true
  },
  {
    id: "social-battery",
    name: "Social Battery",
    icon: "🥱",
    type: "scale",
    builtIn: true
  },
  {
    id: "medication",
    name: "Medication",
    icon: "💊",
    type: "habit",
    builtIn: true
  }
];

const trackerTemplates = [
  {
    id: "template-water",
    name: "Water",
    icon: "💧",
    type: "number",
    unit: "glasses"
  },
  {
    id: "template-exercise",
    name: "Exercise",
    icon: "🏃",
    type: "habit"
  },
  {
    id: "template-brush-teeth",
    name: "Brushed Teeth",
    icon: "🦷",
    type: "habit"
  },
  {
    id: "template-shower",
    name: "Showered",
    icon: "🚿",
    type: "habit"
  },
  {
    id: "template-appetite",
    name: "Appetite",
    icon: "🍽️",
    type: "scale"
  },
  {
    id: "template-urge-to-text",
    name: "Urge to Text",
    icon: "📱",
    type: "scale"
  }
];

function hideMainPages() {
  mainPageIds.forEach(pageId => {
    document.getElementById(pageId)?.classList.add("hidden");
  });
}

function openSubpage(content) {
  hideMainPages();

  subpageContainer.innerHTML = content;
  subpageContainer.classList.remove("hidden");

  if (bottomNav) {
    bottomNav.classList.add("hidden");
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function closeSubpage(returnPageId = "morePage") {
  subpageContainer.classList.add("hidden");
  subpageContainer.innerHTML = "";

  document.getElementById(returnPageId)?.classList.remove("hidden");

  if (bottomNav) {
    bottomNav.classList.remove("hidden");
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function getCustomTrackers() {
  try {
    return JSON.parse(
      localStorage.getItem(TRACKERS_STORAGE_KEY) || "[]"
    );
  } catch (error) {
    console.error("Could not load custom trackers:", error);
    return [];
  }
}

function saveCustomTrackers(trackers) {
  localStorage.setItem(
    TRACKERS_STORAGE_KEY,
    JSON.stringify(trackers)
  );
}

function getAllTrackers() {
  return [...defaultTrackers, ...getCustomTrackers()];
}

function getTrackerTypeLabel(type) {
  const labels = {
    habit: "Habit tracker",
    scale: "Scale tracker",
    number: "Number tracker",
    note: "Note tracker"
  };

  return labels[type] || "Tracker";
}

function createTrackerId(name) {
  const cleanName = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return `${cleanName || "tracker"}-${Date.now()}`;
}

function trackerAlreadyExists(name) {
  return getAllTrackers().some(tracker => {
    return tracker.name.toLowerCase() === name.toLowerCase();
  });
}

function addCustomTracker(tracker) {
  if (trackerAlreadyExists(tracker.name)) {
    return {
      success: false,
      message: `${tracker.name} is already in your trackers.`
    };
  }

  const customTrackers = getCustomTrackers();

  customTrackers.push({
    ...tracker,
    id: createTrackerId(tracker.name),
    builtIn: false,
    createdAt: new Date().toISOString()
  });

  saveCustomTrackers(customTrackers);

  return {
    success: true,
    message: `${tracker.name} was added.`
  };
}

function renderTrackerCards() {
  const trackers = getAllTrackers();

  if (trackers.length === 0) {
    return `
      <p class="empty-state">
        You have not added any trackers yet.
      </p>
    `;
  }

  return trackers
    .map(tracker => {
      return `
        <button
          class="tracker-dashboard-card"
          type="button"
          data-tracker-id="${tracker.id}"
        >
          <span class="tracker-dashboard-icon">
            ${tracker.icon}
          </span>

          <span class="tracker-dashboard-title">
            ${tracker.name}
          </span>

          <span class="tracker-dashboard-type">
            ${getTrackerTypeLabel(tracker.type)}
          </span>
        </button>
      `;
    })
    .join("");
}

function renderTrackersHub() {
  openSubpage(`
    <section class="subpage">

      <header class="subpage-header">
        <button
          id="trackersBackBtn"
          class="subpage-back-btn"
          type="button"
        >
          ← Back
        </button>

        <h2>🧠 Trackers</h2>
      </header>

      <button
        id="addTrackerBtn"
        class="add-tracker-btn"
        type="button"
      >
        ＋ Add Tracker
      </button>

      <p class="subpage-description">
        Track habits, feelings, symptoms, routines, and anything
        else you want to understand.
      </p>

      <div class="tracker-dashboard">
        ${renderTrackerCards()}
      </div>

    </section>
  `);

  document
    .getElementById("trackersBackBtn")
    .addEventListener("click", () => {
      closeSubpage("morePage");
    });

  document
    .getElementById("addTrackerBtn")
    .addEventListener("click", renderAddTrackerPage);

  document
    .querySelectorAll("[data-tracker-id]")
    .forEach(card => {
      card.addEventListener("click", event => {
        const trackerId =
          event.currentTarget.dataset.trackerId;

        renderTrackerDetails(trackerId);
      });
    });
}

function renderAddTrackerPage() {
  openSubpage(`
    <section class="subpage">

      <header class="subpage-header">
        <button
          id="addTrackerBackBtn"
          class="subpage-back-btn"
          type="button"
        >
          ← Back
        </button>

        <h2>＋ Add Tracker</h2>
      </header>

      <section class="tracker-builder-section">

        <h3>✨ Popular Templates</h3>

        <p class="subpage-description">
          Pick one to add it instantly.
        </p>

        <div class="tracker-template-grid">

          ${trackerTemplates
            .map(template => {
              return `
                <button
                  class="tracker-template-card"
                  type="button"
                  data-template-id="${template.id}"
                >
                  <span class="tracker-template-icon">
                    ${template.icon}
                  </span>

                  <span class="tracker-template-title">
                    ${template.name}
                  </span>

                  <span class="tracker-template-type">
                    ${getTrackerTypeLabel(template.type)}
                  </span>
                </button>
              `;
            })
            .join("")}

        </div>

      </section>

      <section class="tracker-builder-section custom-builder-preview">

        <h3>🛠️ Build Your Own</h3>

        <p class="subpage-description">
          Create a tracker with your own name, icon, and type.
        </p>

        <button
          id="buildCustomTrackerBtn"
          class="build-custom-tracker-btn"
          type="button"
        >
          Build a Custom Tracker
        </button>

      </section>

      <p
        id="trackerBuilderMessage"
        class="tracker-builder-message"
      ></p>

    </section>
  `);

  document
    .getElementById("addTrackerBackBtn")
    .addEventListener("click", renderTrackersHub);

  document
    .querySelectorAll("[data-template-id]")
    .forEach(button => {
      button.addEventListener("click", event => {
        const templateId =
          event.currentTarget.dataset.templateId;

        addTrackerFromTemplate(templateId);
      });
    });

  document
    .getElementById("buildCustomTrackerBtn")
    .addEventListener("click", renderCustomTrackerBuilder);
}

function addTrackerFromTemplate(templateId) {
  const template = trackerTemplates.find(item => {
    return item.id === templateId;
  });

  if (!template) {
    return;
  }

  const result = addCustomTracker({
    name: template.name,
    icon: template.icon,
    type: template.type,
    unit: template.unit || ""
  });

  const message =
    document.getElementById("trackerBuilderMessage");

  if (message) {
    message.textContent = result.message;
    message.classList.toggle(
      "success",
      result.success
    );
  }

  if (result.success) {
    setTimeout(renderTrackersHub, 500);
  }
}

function renderCustomTrackerBuilder() {
  openSubpage(`
    <section class="subpage">

      <header class="subpage-header">
        <button
          id="customBuilderBackBtn"
          class="subpage-back-btn"
          type="button"
        >
          ← Back
        </button>

        <h2>🛠️ Custom Tracker</h2>
      </header>

      <form id="customTrackerForm" class="custom-tracker-form">

        <label class="custom-tracker-field">
          <span>Tracker name</span>

          <input
            id="customTrackerName"
            type="text"
            maxlength="40"
            placeholder="Example: Made My Bed"
            required
          >
        </label>

        <label class="custom-tracker-field">
          <span>Icon</span>

          <input
            id="customTrackerIcon"
            type="text"
            maxlength="4"
            placeholder="✨"
            required
          >
        </label>

        <fieldset class="tracker-type-options">

          <legend>Tracker type</legend>

          <label class="tracker-type-option">
            <input
              type="radio"
              name="trackerType"
              value="habit"
              checked
            >

            <span>
              <strong>✅ Habit</strong>
              <small>Yes or no each day</small>
            </span>
          </label>

          <label class="tracker-type-option">
            <input
              type="radio"
              name="trackerType"
              value="scale"
            >

            <span>
              <strong>📈 Scale</strong>
              <small>Rate something from low to high</small>
            </span>
          </label>

          <label class="tracker-type-option">
            <input
              type="radio"
              name="trackerType"
              value="number"
            >

            <span>
              <strong>🔢 Number</strong>
              <small>Track hours, glasses, minutes, or amounts</small>
            </span>
          </label>

          <label class="tracker-type-option">
            <input
              type="radio"
              name="trackerType"
              value="note"
            >

            <span>
              <strong>📝 Notes</strong>
              <small>Write a short entry each day</small>
            </span>
          </label>

        </fieldset>

        <label
          id="customTrackerUnitField"
          class="custom-tracker-field hidden"
        >
          <span>Unit</span>

          <input
            id="customTrackerUnit"
            type="text"
            maxlength="20"
            placeholder="Example: hours"
          >
        </label>

        <p
          id="customTrackerMessage"
          class="tracker-builder-message"
        ></p>

        <button
          class="save-custom-tracker-btn"
          type="submit"
        >
          Save Tracker
        </button>

      </form>

    </section>
  `);

  document
    .getElementById("customBuilderBackBtn")
    .addEventListener("click", renderAddTrackerPage);

  document
    .querySelectorAll('input[name="trackerType"]')
    .forEach(input => {
      input.addEventListener(
        "change",
        updateCustomTrackerUnitField
      );
    });

  document
    .getElementById("customTrackerForm")
    .addEventListener("submit", saveCustomTracker);

  updateCustomTrackerUnitField();
}

function updateCustomTrackerUnitField() {
  const selectedType = document.querySelector(
    'input[name="trackerType"]:checked'
  )?.value;

  const unitField = document.getElementById(
    "customTrackerUnitField"
  );

  if (!unitField) {
    return;
  }

  unitField.classList.toggle(
    "hidden",
    selectedType !== "number"
  );
}

function saveCustomTracker(event) {
  event.preventDefault();

  const name = document
    .getElementById("customTrackerName")
    .value
    .trim();

  const icon = document
    .getElementById("customTrackerIcon")
    .value
    .trim();

  const type = document.querySelector(
    'input[name="trackerType"]:checked'
  )?.value;

  const unit = document
    .getElementById("customTrackerUnit")
    .value
    .trim();

  const message =
    document.getElementById("customTrackerMessage");

  if (!name || !icon || !type) {
    message.textContent =
      "Please enter a name, icon, and tracker type.";

    return;
  }

  if (type === "number" && !unit) {
    message.textContent =
      "Please enter a unit for this number tracker.";

    return;
  }

  const result = addCustomTracker({
    name,
    icon,
    type,
    unit
  });

  message.textContent = result.message;
  message.classList.toggle(
    "success",
    result.success
  );

  if (result.success) {
    setTimeout(renderTrackersHub, 500);
  }
}

function renderTrackerDetails(trackerId) {
  const tracker = getAllTrackers().find(item => {
    return item.id === trackerId;
  });

  if (!tracker) {
    renderTrackersHub();
    return;
  }

if (tracker.type === "habit") {
  renderHabitTrackerScreen(tracker);
  return;
}

if (tracker.type === "scale") {
  renderScaleTrackerScreen(tracker);
  return;
}

  openSubpage(`
    <section class="subpage">

      <header class="subpage-header">
        <button
          id="trackerDetailsBackBtn"
          class="subpage-back-btn"
          type="button"
        >
          ← Back
        </button>

        <h2>${tracker.icon} ${tracker.name}</h2>
      </header>

      <section class="tracker-detail-placeholder">

        <p class="subpage-description">
          ${getTrackerTypeLabel(tracker.type)}
        </p>

        <p>
          This tracker is ready for its logging screen.
        </p>

      </section>

    </section>
  `);

  document
    .getElementById("trackerDetailsBackBtn")
    .addEventListener("click", renderTrackersHub);
}