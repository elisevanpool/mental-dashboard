// =====================
// Today Page
// =====================

const mainPages = [
  "todayPage",
  "masterlistPage",
  "journalPage",
  "calendarPage",
  "morePage"
];

// ----- Masterlist data helpers -----

function getTodayMasterlistTasks() {
  if (typeof getMasterlistTasks === "function") {
    return getMasterlistTasks();
  }

  try {
    return JSON.parse(
      localStorage.getItem("masterlistTasks") || "[]"
    );
  } catch (error) {
    console.error("Could not load Masterlist tasks:", error);
    return [];
  }
}

function saveTodayMasterlistTasks(tasks) {
  if (typeof saveMasterlistTasks === "function") {
    saveMasterlistTasks(tasks);
    return;
  }

  localStorage.setItem(
    "masterlistTasks",
    JSON.stringify(tasks)
  );
}

function getTodayDateString() {
  if (typeof getTodayString === "function") {
    return getTodayString();
  }

  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getTodayCategoryLabel(categoryId) {
  if (typeof getCategoryLabel === "function") {
    return getCategoryLabel(categoryId);
  }

  const fallbackCategories = {
    body: "🚿 Body",
    apartment: "🏠 Apartment",
    administrative: "🖥️ Administrative",
    phone: "📱 TBD on Phone",
    errands: "🚗 Errands",
    "under-two": "⚡ Under 2 Minutes",
    misc: "📦 Misc"
  };

  return fallbackCategories[categoryId] || categoryId;
}

function formatTodayDueDate(dueDate) {
  if (!dueDate) return "";

  if (typeof formatDueDate === "function") {
    return formatDueDate(dueDate);
  }

  if (dueDate === getTodayDateString()) {
    return "Due today";
  }

  const date = new Date(`${dueDate}T12:00:00`);

  return `Due ${date.toLocaleDateString()}`;
}

// ----- Main navigation -----

function showMainPage(pageId) {
  document.getElementById("subpageContainer")?.classList.add("hidden");
  document.querySelector(".bottom-nav")?.classList.remove("hidden");

  mainPages.forEach(id => {
    document.getElementById(id)?.classList.add("hidden");
  });

  document.getElementById(pageId)?.classList.remove("hidden");

  document
    .querySelectorAll(".bottom-nav button")
    .forEach(button => {
      button.classList.remove("active");
    });

  if (pageId === "todayPage") {
    renderTodayPage();

    if (typeof updateSummary === "function") {
      updateSummary();
    }

    if (typeof drawMoodChart === "function") {
      drawMoodChart();
    }
  }

  if (
    pageId === "masterlistPage" &&
    typeof renderMasterlistTasks === "function"
  ) {
    renderMasterlistTasks();
  }

  if (
    pageId === "journalPage" &&
    typeof renderJournalLandingPage === "function"
  ) {
    renderJournalLandingPage();
  }

  if (
    pageId === "calendarPage" &&
    typeof renderCalendar === "function"
  ) {
    renderCalendar();
  }
}

// ----- Today history -----

const TODAY_HISTORY_KEY = "todayHistory";

function getTodayHistory() {
  try {
    return JSON.parse(
      localStorage.getItem(TODAY_HISTORY_KEY) || "[]"
    );
  } catch (error) {
    console.error(
      "Could not load Today history:",
      error
    );

    return [];
  }
}

function saveTodayHistory(history) {
  localStorage.setItem(
    TODAY_HISTORY_KEY,
    JSON.stringify(history)
  );
}

function addTodayHistoryEvent(
  taskId,
  action,
  timestamp = new Date().toISOString()
) {
  const history = getTodayHistory();

  history.push({
    id: Date.now(),
    taskId,
    action,
    timestamp
  });

  saveTodayHistory(history);
}

// ----- Today task IDs -----

function getTodayTaskIds() {
  try {
    return JSON.parse(
      localStorage.getItem("todayTaskIds") || "[]"
    );
  } catch (error) {
    console.error("Could not load Today tasks:", error);
    return [];
  }
}

function saveTodayTaskIds(taskIds) {
  localStorage.setItem(
    "todayTaskIds",
    JSON.stringify(taskIds)
  );
}

// ----- Task actions -----

function addTaskToToday(taskId) {
  const todayTaskIds = getTodayTaskIds();

  if (!todayTaskIds.includes(taskId)) {
    todayTaskIds.push(taskId);
  }

saveTodayTaskIds(todayTaskIds);

addTodayHistoryEvent(
  taskId,
  "added"
);

renderTodayPage();
}

function removeTaskFromToday(taskId) {
  const updatedIds = getTodayTaskIds().filter(
    id => id !== taskId
  );

saveTodayTaskIds(updatedIds);

addTodayHistoryEvent(
  taskId,
  "removed"
);

renderTodayPage();
}

function completeTodayTask(taskId) {
  const tasks = getTodayMasterlistTasks();

  const updatedTasks = tasks.map(task => {
    if (task.id !== taskId) {
      return task;
    }

    return {
      ...task,
      completed: true,
      completedAt: new Date().toISOString()
    };
  });

  saveTodayMasterlistTasks(updatedTasks);
  removeTaskFromToday(taskId);

  if (typeof renderMasterlistTasks === "function") {
    renderMasterlistTasks();
  }
}

// ----- Quick-add task from Today -----

function openTodayQuickAdd() {
  const existingForm =
    document.getElementById("todayQuickAddForm");

  if (existingForm) {
    existingForm.remove();
    return;
  }

  const todaySection =
    document.getElementById("todayTasksSection");

  const form = document.createElement("div");

  form.id = "todayQuickAddForm";
  form.className = "today-quick-add";

  form.innerHTML = `
    <input
      id="todayQuickTaskInput"
      type="text"
      autocapitalize="none"
      placeholder="What needs to be done today?"
    >

    <select id="todayQuickTaskCategory">
      <option value="body">🚿 Body</option>
      <option value="apartment">🏠 Apartment</option>
      <option value="administrative">
        🖥️ Administrative
      </option>
      <option value="phone">📱 TBD on Phone</option>
      <option value="errands">🚗 Errands</option>
      <option value="under-two">
        ⚡ Under 2 Minutes
      </option>
      <option value="misc" selected>📦 Misc</option>
    </select>

    <div class="today-quick-add-actions">
      <button
        id="cancelTodayQuickAddBtn"
        type="button"
      >
        Cancel
      </button>

      <button
        id="saveTodayQuickAddBtn"
        type="button"
      >
        Add to Today
      </button>
    </div>

    <p
      id="todayQuickAddMessage"
      class="task-form-message"
    ></p>
  `;

  todaySection
    .querySelector(".today-section-header")
    .after(form);

  const input =
    document.getElementById("todayQuickTaskInput");

  input.focus();

  document
    .getElementById("cancelTodayQuickAddBtn")
    .addEventListener("click", () => {
      form.remove();
    });

  document
    .getElementById("saveTodayQuickAddBtn")
    .addEventListener("click", saveTodayQuickTask);

  input.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      saveTodayQuickTask();
    }
  });
}

function saveTodayQuickTask() {
  const input =
    document.getElementById("todayQuickTaskInput");

  const categorySelect =
    document.getElementById("todayQuickTaskCategory");

  const message =
    document.getElementById("todayQuickAddMessage");

  const taskText = input?.value.trim();

  if (!taskText) {
    if (message) {
      message.textContent = "Please enter a task.";
    }

    return;
  }

  const taskId = Date.now();
  const tasks = getTodayMasterlistTasks();

  tasks.push({
    id: taskId,
    text: taskText,
    completed: false,
    archived: false,
    categories: [
      categorySelect?.value || "misc"
    ],
    dueDate: getTodayDateString(),
    createdAt: new Date().toISOString(),
    completedAt: null
  });

  saveTodayMasterlistTasks(tasks);

  const todayTaskIds = getTodayTaskIds();
  todayTaskIds.push(taskId);
saveTodayTaskIds(todayTaskIds);

addTodayHistoryEvent(
  taskId,
  "created-for-today"
);

renderTodayPage();

  if (typeof renderMasterlistTasks === "function") {
    renderMasterlistTasks();
  }
}

// ----- Suggestions -----

function getSuggestedTasks(tasks, todayTaskIds) {
  const today = getTodayDateString();

  const availableTasks = tasks.filter(task => {
    return (
      !task.completed &&
      !task.archived &&
      !todayTaskIds.includes(task.id)
    );
  });

  const deadlineTasks = availableTasks.filter(task => {
    return task.dueDate && task.dueDate <= today;
  });

  const otherTasks = availableTasks.filter(task => {
    return !deadlineTasks.some(
      deadlineTask => deadlineTask.id === task.id
    );
  });

  const randomTasks = [...otherTasks]
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  return [...deadlineTasks, ...randomTasks];
}

function groupTasksByCategory(tasks) {
  const groups = {};

  tasks.forEach(task => {
    const primaryCategory =
      task.categories?.[0] || "misc";

    if (!groups[primaryCategory]) {
      groups[primaryCategory] = [];
    }

    groups[primaryCategory].push(task);
  });

  return groups;
}

// ----- Task cards -----

function renderTodayTaskCard(task) {
  const categories =
    Array.isArray(task.categories) &&
    task.categories.length > 0
      ? task.categories
      : ["misc"];

  return `
    <div class="today-task-card">

      <label class="today-task-main">

        <input
          class="today-task-checkbox"
          type="checkbox"
          data-task-id="${task.id}"
        >

        <div class="today-task-content">

          <div class="today-task-text">
            ${task.text}
          </div>

          <div class="task-category-list">
            ${categories
              .map(category => `
                <span class="task-category">
                  ${getTodayCategoryLabel(category)}
                </span>
              `)
              .join("")}
          </div>

          ${
            task.dueDate
              ? `
                <div class="task-deadline">
                  ⏰ ${formatTodayDueDate(task.dueDate)}
                </div>
              `
              : ""
          }

        </div>

      </label>

      <button
        class="remove-today-btn"
        data-task-id="${task.id}"
        type="button"
      >
        Remove
      </button>

    </div>
  `;
}

const DAY_MODE_KEY = "mybrainDayModes";

function getDayMode() {
  const allModes = JSON.parse(
    localStorage.getItem(
      DAY_MODE_KEY
    ) || "{}"
  );

  return (
    allModes[
      getTodayDateString()
    ] || "work"
  );
}

function saveDayMode(
  mode
) {
  const allModes = JSON.parse(
    localStorage.getItem(
      DAY_MODE_KEY
    ) || "{}"
  );

  allModes[
    getTodayDateString()
  ] = mode;

  localStorage.setItem(
    DAY_MODE_KEY,
    JSON.stringify(allModes)
  );

  renderTodayPage();
}

function getMorningRoutineName() {
  return getDayMode() === "work"
    ? "workMorning"
    : "offMorning";
}

function getEveningRoutineName() {
  return getDayMode() === "work"
    ? "workEvening"
    : "offEvening";
}

// ----- Routines -----

const ROUTINES_KEY = "mybrainRoutines";

const ROUTINE_COMPLETIONS_KEY =
  "mybrainRoutineCompletions";

function getRoutineCompletions() {
  try {
    return JSON.parse(
      localStorage.getItem(
        ROUTINE_COMPLETIONS_KEY
      ) || "{}"
    );
  } catch (error) {
    console.error(
      "Could not load routine completions:",
      error
    );

    return {};
  }
}

function saveRoutineCompletions(
  completions
) {
  localStorage.setItem(
    ROUTINE_COMPLETIONS_KEY,
    JSON.stringify(completions)
  );
}

function getRoutineCompletionKey(
  routineName,
  index
) {
  return `${routineName}:${index}`;
}

function isRoutineItemComplete(
  routineName,
  index
) {
  const completions =
    getRoutineCompletions();

  const today =
    getTodayDateString();

  const todayCompletions =
    completions[today] || {};

  return (
    todayCompletions[
      getRoutineCompletionKey(
        routineName,
        index
      )
    ] === true
  );
}

function setRoutineItemComplete(
  routineName,
  index,
  completed
) {
  const completions =
    getRoutineCompletions();

  const today =
    getTodayDateString();

  if (!completions[today]) {
    completions[today] = {};
  }

  const completionKey =
    getRoutineCompletionKey(
      routineName,
      index
    );

  if (completed) {
    completions[today][
      completionKey
    ] = true;
  } else {
    delete completions[today][
      completionKey
    ];
  }

  saveRoutineCompletions(
    completions
  );
}


const defaultRoutines = {
  workMorning: [
    "Take meds",
    "Brush teeth",
    "Get dressed"
  ],

  offMorning: [
    "Take meds",
    "Make coffee"
  ],

  workEvening: [
    "Journal",
    "Charge phone"
  ],

  offEvening: [
    "Journal",
    "Plan tomorrow"
  ]
};

function getRoutines() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(
        ROUTINES_KEY
      ) || "{}"
    );

    return {
      ...defaultRoutines,
      ...saved
    };
  } catch (error) {
    console.error(
      "Could not load routines:",
      error
    );

    return structuredClone(
      defaultRoutines
    );
  }
}

function saveRoutines(routines) {
  localStorage.setItem(
    ROUTINES_KEY,
    JSON.stringify(routines)
  );
}

function escapeTodayHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderRoutineItems(
  routineName
) {
  const routines =
    getRoutines();

  const items = Array.isArray(
    routines[routineName]
  )
    ? routines[routineName]
    : [];

  return items
    .map(
      (item, index) => `
        <div
          class="routine-item ${
            isRoutineItemComplete(
              routineName,
              index
            )
              ? "completed"
              : ""
          }"
        >

          <label>

            <input
              class="routine-item-checkbox"
              type="checkbox"
              data-routine="${routineName}"
              data-index="${index}"
              ${
                isRoutineItemComplete(
                  routineName,
                  index
                )
                  ? "checked"
                  : ""
              }
            >

            <span class="routine-item-text">
              ${escapeTodayHtml(item)}
            </span>

          </label>

          <button
            class="delete-routine-item-btn"
            data-routine="${routineName}"
            data-index="${index}"
            type="button"
          >
            ✕
          </button>

        </div>
      `
    )
    .join("");
}

function openRoutineItemForm(
  routineName,
  button
) {
  const existingForm =
    document.getElementById(
      "routineItemForm"
    );

  if (existingForm) {
    existingForm.remove();
  }

  const form =
    document.createElement("div");

  form.id = "routineItemForm";
  form.className =
    "routine-item-form";

  form.innerHTML = `
    <input
      id="newRoutineItemInput"
      type="text"
      placeholder="Add a routine item..."
      maxlength="100"
    >

    <div class="routine-item-form-actions">

      <button
        id="cancelRoutineItemBtn"
        type="button"
      >
        Cancel
      </button>

      <button
        id="saveRoutineItemBtn"
        type="button"
      >
        Add
      </button>

    </div>

    <p
      id="routineItemMessage"
      class="task-form-message"
    ></p>
  `;

  button.before(form);

  const input =
    document.getElementById(
      "newRoutineItemInput"
    );

  input?.focus();

  document
    .getElementById(
      "cancelRoutineItemBtn"
    )
    ?.addEventListener(
      "click",
      () => {
        form.remove();
      }
    );

  document
    .getElementById(
      "saveRoutineItemBtn"
    )
    ?.addEventListener(
      "click",
      () => {
        saveNewRoutineItem(
          routineName
        );
      }
    );

  input?.addEventListener(
    "keydown",
    event => {
      if (event.key === "Enter") {
        saveNewRoutineItem(
          routineName
        );
      }
    }
  );
}

function saveNewRoutineItem(
  routineName
) {
  const input =
    document.getElementById(
      "newRoutineItemInput"
    );

  const message =
    document.getElementById(
      "routineItemMessage"
    );

  const text =
    input?.value.trim();

  if (!text) {
    if (message) {
      message.textContent =
        "Please enter a routine item.";
    }

    return;
  }

  const routines =
    getRoutines();

  if (
    !Array.isArray(
      routines[routineName]
    )
  ) {
    routines[routineName] = [];
  }

  routines[routineName].push(
    text
  );

  saveRoutines(routines);
  refreshTodayRoutineSections();
}

function refreshTodayRoutineSections() {
  const morningContent =
    document.getElementById(
      "morningRoutineContent"
    );

  const eveningContent =
    document.getElementById(
      "eveningRoutineContent"
    );

  if (morningContent) {
    morningContent.innerHTML =
      renderRoutineItems(
        getMorningRoutineName()
      );
  }

  if (eveningContent) {
    eveningContent.innerHTML =
      renderRoutineItems(
        getEveningRoutineName()
      );
  }

  document
    .getElementById(
      "routineItemForm"
    )
    ?.remove();

  attachRoutineEvents();
}

function attachRoutineEvents() {
  attachRoutineDeleteEvents();
  attachRoutineCheckboxEvents();
}

function attachRoutineCheckboxEvents() {
  document
    .querySelectorAll(
      ".routine-item-checkbox"
    )
    .forEach(checkbox => {
      checkbox.addEventListener(
        "change",
        event => {
          const currentCheckbox =
            event.currentTarget;

          setRoutineItemComplete(
            currentCheckbox.dataset
              .routine,
            Number(
              currentCheckbox.dataset
                .index
            ),
            currentCheckbox.checked
          );

          currentCheckbox
            .closest(".routine-item")
            ?.classList.toggle(
              "completed",
              currentCheckbox.checked
            );
        }
      );
    });
}

function attachRoutineDeleteEvents() {
  document
    .querySelectorAll(
      ".delete-routine-item-btn"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        event => {
          removeRoutineItem(
            event.currentTarget.dataset
              .routine,
            Number(
              event.currentTarget.dataset
                .index
            )
          );
        }
      );
    });
}

function removeRoutineItem(
  routineName,
  index
) {
  const routines =
    getRoutines();

  if (
    !Array.isArray(
      routines[routineName]
    )
  ) {
    return;
  }

  routines[routineName].splice(
    index,
    1
  );

  saveRoutines(routines);
  refreshTodayRoutineSections();
}

// ----- Reusable checklist presets -----

const CHECKLIST_PRESETS_KEY =
  "mybrainChecklistPresets";

const DAILY_CHECKLISTS_KEY =
  "mybrainDailyChecklists";

const COMPLETED_CHECKLISTS_KEY =
  "mybrainCompletedChecklists";

let checklistCompletionMessageTimer = null;
let presetEditorDraft = null;
let activePresetItemEdit = null;
let presetItemOriginalText = "";

const defaultChecklistPresets = [
  {
    id: "leaving-the-house",
    name: "Leaving the House",
    emoji: "🚪",
    items: [
      "Keys",
      "Phone",
      "Wallet",
      "Water bottle",
      "Lock the door"
    ]
  },
  {
    id: "laundry-day",
    name: "Laundry Day",
    emoji: "🧺",
    items: [
      "Gather laundry",
      "Start washer",
      "Move clothes to dryer",
      "Fold clothes",
      "Put clothes away"
    ]
  },
  {
    id: "work-morning",
    name: "Work Morning",
    emoji: "💼",
    items: [
      "Check calendar",
      "Pack work bag",
      "Prepare lunch",
      "Fill water bottle",
      "Leave on time"
    ]
  }
];

function getChecklistPresets() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(
        CHECKLIST_PRESETS_KEY
      ) || "null"
    );

    const presets = Array.isArray(saved)
      ? saved
      : defaultChecklistPresets;

    return presets.reduce((validPresets, preset) => {
      if (
        !preset ||
        typeof preset.id !== "string" ||
        typeof preset.name !== "string" ||
        !Array.isArray(preset.items)
      ) {
        return validPresets;
      }

      const name = preset.name.trim();
      const items = preset.items.map(item => {
        if (typeof item === "string") return item.trim();

        // Earlier experimental builds stored item objects. Accepting them
        // here keeps those presets editable instead of losing their data.
        if (item && typeof item.text === "string") {
          return item.text.trim();
        }

        if (item && typeof item.name === "string") {
          return item.name.trim();
        }

        return "";
      }).filter(Boolean);

      if (!name || !items.length) return validPresets;

      validPresets.push({
        id: preset.id,
        name,
        emoji: typeof preset.emoji === "string"
          ? preset.emoji.trim()
          : "",
        items
      });

      return validPresets;
    }, []);
  } catch (error) {
    console.error(
      "Could not load checklist presets:",
      error
    );

    return defaultChecklistPresets;
  }
}

function saveChecklistPresets(presets) {
  localStorage.setItem(
    CHECKLIST_PRESETS_KEY,
    JSON.stringify(presets)
  );
}

function createPresetId() {
  return `preset-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function closePresetManager() {
  document.getElementById("presetManagerOverlay")?.remove();
  presetEditorDraft = null;
  activePresetItemEdit = null;
}

function renderPresetManager() {
  let overlay = document.getElementById("presetManagerOverlay");

  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "presetManagerOverlay";
    overlay.className = "preset-manager-overlay";
    document.body.appendChild(overlay);
  }

  const presets = getChecklistPresets();

  if (presetEditorDraft) {
    renderPresetEditor(overlay);
    return;
  }

  overlay.innerHTML = `
    <section class="preset-manager" role="dialog" aria-modal="true"
      aria-labelledby="presetManagerTitle">
      <div class="preset-manager-heading">
        <div>
          <p class="preset-manager-kicker">Reusable checklists</p>
          <h3 id="presetManagerTitle">Manage Presets</h3>
        </div>
        <button class="preset-icon-btn" id="closePresetManagerBtn"
          type="button" aria-label="Close preset manager">✕</button>
      </div>
      <button class="preset-primary-btn" id="newPresetBtn" type="button">
        ＋ Create new preset
      </button>
      <div class="preset-manager-list">
        ${presets.length ? presets.map(preset => `
          <article class="preset-manager-card">
            <div class="preset-manager-card-name">
              <span>${escapeTodayHtml(preset.emoji || "📋")}</span>
              <div>
                <strong>${escapeTodayHtml(preset.name)}</strong>
                <small>${preset.items.length} item${preset.items.length === 1 ? "" : "s"}</small>
              </div>
            </div>
            <div class="preset-manager-actions">
              <button type="button" data-edit-preset="${escapeTodayHtml(preset.id)}">Edit</button>
              <button type="button" data-duplicate-preset="${escapeTodayHtml(preset.id)}">Duplicate</button>
              <button class="preset-delete-btn" type="button"
                data-delete-preset="${escapeTodayHtml(preset.id)}">Delete</button>
            </div>
          </article>
        `).join("") : `<p class="empty-state">No presets yet. Create one to get started.</p>`}
      </div>
    </section>`;

  overlay.querySelector("#closePresetManagerBtn")
    .addEventListener("click", closePresetManager);
  overlay.querySelector("#newPresetBtn").addEventListener("click", () => {
    presetEditorDraft = {
      id: createPresetId(),
      name: "",
      emoji: "📋",
      items: []
    };
    renderPresetManager();
  });
  overlay.querySelectorAll("[data-edit-preset]").forEach(button => {
    button.addEventListener("click", () => {
      const preset = presets.find(item => item.id === button.dataset.editPreset);
      if (!preset) return;
      presetEditorDraft = {
        ...preset,
        items: [...preset.items]
      };
      renderPresetManager();
    });
  });
  overlay.querySelectorAll("[data-duplicate-preset]").forEach(button => {
    button.addEventListener("click", () => {
      const preset = presets.find(item => item.id === button.dataset.duplicatePreset);
      if (!preset) return;
      presetEditorDraft = {
        id: createPresetId(),
        name: `${preset.name} Copy`,
        emoji: preset.emoji,
        items: [...preset.items]
      };
      renderPresetManager();
    });
  });
  overlay.querySelectorAll("[data-delete-preset]").forEach(button => {
    button.addEventListener("click", () => {
      const preset = presets.find(item => item.id === button.dataset.deletePreset);
      if (!preset || !window.confirm(`Delete “${preset.name}”? This cannot be undone.`)) return;
      saveChecklistPresets(presets.filter(item => item.id !== preset.id));
      renderTodayChecklists();
      renderPresetManager();
    });
  });

  overlay.querySelector("#newPresetBtn").focus();
}

function syncPresetEditorDraft(editor) {
  presetEditorDraft.name = editor.querySelector("#presetNameInput").value;
  presetEditorDraft.emoji = editor.querySelector("#presetEmojiInput").value;
  const activeInput = editor.querySelector(".preset-item-input");
  if (activeInput && activePresetItemEdit !== null) {
    presetEditorDraft.items[activePresetItemEdit] = activeInput.value;
  }
}

function renderPresetEditor(overlay, focusActiveItem = false) {
  const draft = presetEditorDraft;
  const presets = getChecklistPresets();
  const isExistingPreset = presets.some(preset => preset.id === draft.id);

  overlay.innerHTML = `
    <section class="preset-manager preset-editor" role="dialog" aria-modal="true"
      aria-labelledby="presetEditorTitle">
      <div class="preset-editor-header">
        <button class="preset-header-action" id="cancelPresetEditorBtn"
          type="button">Cancel</button>
        <h3 id="presetEditorTitle">Edit Preset</h3>
        <button class="preset-header-action preset-header-save" type="submit"
          form="presetEditorForm">Save</button>
      </div>
      <form id="presetEditorForm">
        <section class="preset-editor-section preset-basics" aria-labelledby="presetDetailsTitle">
          <h4 id="presetDetailsTitle">Preset details</h4>
          <label class="preset-emoji-field">Emoji
            <input id="presetEmojiInput" value="${escapeTodayHtml(draft.emoji)}"
              maxlength="12" inputmode="text" aria-label="Preset emoji">
          </label>
          <label class="preset-name-field">Preset name
            <input id="presetNameInput" value="${escapeTodayHtml(draft.name)}"
              maxlength="80" required placeholder="Preset name">
          </label>
        </section>
        <div class="preset-items-heading">
          <strong>Checklist items</strong>
          <button id="addPresetItemBtn" type="button">＋ Add new item</button>
        </div>
        <div class="preset-editor-items">
          ${draft.items.map((item, index) => `
            <div class="preset-editor-item${activePresetItemEdit === index ? " is-editing" : ""}">
              ${activePresetItemEdit === index ? `
                <input class="preset-item-input" value="${escapeTodayHtml(item)}"
                  maxlength="120" required placeholder="Checklist item"
                  aria-label="Checklist item ${index + 1}">
                <div class="preset-item-edit-actions">
                  <button class="preset-row-save" type="button" data-save-item="${index}">Save</button>
                  <button type="button" data-cancel-item="${index}">Cancel</button>
                </div>
              ` : `
                <span class="preset-item-text">${escapeTodayHtml(item)}</span>
                <div class="preset-item-actions">
                  <button type="button" data-move-up="${index}" title="Move up"
                    aria-label="Move item ${index + 1} up" ${index === 0 ? "disabled" : ""}>↑</button>
                  <button type="button" data-move-down="${index}" title="Move down"
                    aria-label="Move item ${index + 1} down" ${index === draft.items.length - 1 ? "disabled" : ""}>↓</button>
                  <button type="button" data-edit-item="${index}" title="Edit"
                    aria-label="Edit item ${index + 1}">✎</button>
                  <button class="preset-delete-btn" type="button" title="Delete"
                    aria-label="Delete item ${index + 1}" data-remove-item="${index}">⌫</button>
                </div>
              `}
              </div>
          `).join("")}
          ${draft.items.length ? "" : `<p class="preset-empty-items">No items yet. Add your first checklist item.</p>`}
        </div>
        <p class="preset-form-error" id="presetFormError" role="alert"></p>
        <section class="preset-editor-section preset-actions-section" aria-labelledby="presetActionsTitle">
          <h4 id="presetActionsTitle">Preset actions</h4>
          <div class="preset-actions-grid">
            <button id="duplicatePresetEditorBtn" type="button">⧉ <span>Duplicate</span></button>
            <button id="previewPresetBtn" type="button">◉ <span>Preview</span></button>
            <button class="preset-delete-btn" id="deletePresetEditorBtn" type="button"
              ${isExistingPreset ? "" : "disabled"}>⌫ <span>Delete preset</span></button>
          </div>
          <div class="preset-preview" id="presetPreview" hidden></div>
        </section>
        <p class="preset-editor-note">Changes to this preset won’t affect checklists already added to Today or previously completed records.</p>
      </form>
    </section>`;

  const editor = overlay.querySelector(".preset-editor");
  const goBack = () => {
    presetEditorDraft = null;
    activePresetItemEdit = null;
    renderPresetManager();
  };
  overlay.querySelector("#cancelPresetEditorBtn").addEventListener("click", goBack);
  overlay.querySelector("#addPresetItemBtn").addEventListener("click", () => {
    syncPresetEditorDraft(editor);
    if (activePresetItemEdit !== null && !draft.items[activePresetItemEdit].trim()) {
      overlay.querySelector(".preset-item-input")?.focus();
      return;
    }
    presetEditorDraft.items.push("");
    activePresetItemEdit = presetEditorDraft.items.length - 1;
    presetItemOriginalText = "";
    renderPresetEditor(overlay, true);
  });
  overlay.querySelectorAll("[data-remove-item]").forEach(button => {
    button.addEventListener("click", () => {
      syncPresetEditorDraft(editor);
      presetEditorDraft.items.splice(Number(button.dataset.removeItem), 1);
      activePresetItemEdit = null;
      renderPresetEditor(overlay);
    });
  });
  overlay.querySelectorAll("[data-edit-item]").forEach(button => {
    button.addEventListener("click", () => {
      syncPresetEditorDraft(editor);
      activePresetItemEdit = Number(button.dataset.editItem);
      presetItemOriginalText = draft.items[activePresetItemEdit];
      renderPresetEditor(overlay, true);
    });
  });
  const saveActiveItem = () => {
    const input = overlay.querySelector(".preset-item-input");
    const value = input?.value.trim() || "";
    if (!value) {
      overlay.querySelector("#presetFormError").textContent = "Checklist items cannot be empty.";
      input?.focus();
      return;
    }
    draft.items[activePresetItemEdit] = value;
    activePresetItemEdit = null;
    renderPresetEditor(overlay);
  };
  overlay.querySelector("[data-save-item]")?.addEventListener("click", saveActiveItem);
  overlay.querySelector("[data-cancel-item]")?.addEventListener("click", () => {
    if (presetItemOriginalText) draft.items[activePresetItemEdit] = presetItemOriginalText;
    else draft.items.splice(activePresetItemEdit, 1);
    activePresetItemEdit = null;
    renderPresetEditor(overlay);
  });
  overlay.querySelector(".preset-item-input")?.addEventListener("keydown", event => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    saveActiveItem();
  });
  const moveItem = (button, offset) => {
    syncPresetEditorDraft(editor);
    const index = Number(button.dataset.moveUp ?? button.dataset.moveDown);
    const [item] = presetEditorDraft.items.splice(index, 1);
    presetEditorDraft.items.splice(index + offset, 0, item);
    activePresetItemEdit = null;
    renderPresetEditor(overlay);
  };
  overlay.querySelectorAll("[data-move-up]").forEach(button => {
    button.addEventListener("click", () => moveItem(button, -1));
  });
  overlay.querySelectorAll("[data-move-down]").forEach(button => {
    button.addEventListener("click", () => moveItem(button, 1));
  });
  overlay.querySelector("#duplicatePresetEditorBtn").addEventListener("click", () => {
    syncPresetEditorDraft(editor);
    presetEditorDraft.id = createPresetId();
    presetEditorDraft.name = `${presetEditorDraft.name.trim() || "Untitled Preset"} Copy`;
    activePresetItemEdit = null;
    renderPresetEditor(overlay);
  });
  overlay.querySelector("#previewPresetBtn").addEventListener("click", () => {
    syncPresetEditorDraft(editor);
    const preview = overlay.querySelector("#presetPreview");
    preview.innerHTML = `<strong>${escapeTodayHtml(draft.emoji || "📋")} ${escapeTodayHtml(draft.name || "Untitled Preset")}</strong><ul>${draft.items.filter(item => item.trim()).map(item => `<li>○ ${escapeTodayHtml(item.trim())}</li>`).join("") || "<li>No checklist items yet</li>"}</ul>`;
    preview.hidden = !preview.hidden;
  });
  overlay.querySelector("#deletePresetEditorBtn").addEventListener("click", () => {
    if (!isExistingPreset || !window.confirm(`Delete “${draft.name}”? This cannot be undone.`)) return;
    saveChecklistPresets(presets.filter(preset => preset.id !== draft.id));
    goBack();
    renderTodayChecklists();
  });
  overlay.querySelector("#presetEditorForm").addEventListener("submit", event => {
    event.preventDefault();
    syncPresetEditorDraft(editor);
    const name = presetEditorDraft.name.trim();
    const items = presetEditorDraft.items.map(item => item.trim());
    const error = overlay.querySelector("#presetFormError");

    if (!name) {
      error.textContent = "Please enter a preset name.";
      overlay.querySelector("#presetNameInput").focus();
      return;
    }
    if (activePresetItemEdit !== null) {
      error.textContent = "Save or cancel the item you’re editing first.";
      overlay.querySelector(".preset-item-input")?.focus();
      return;
    }
    if (!items.length || items.some(item => !item)) {
      error.textContent = "Add at least one item and make sure no items are empty.";
      overlay.querySelector(".preset-item-input:invalid")?.focus();
      return;
    }

    const presets = getChecklistPresets();
    const savedPreset = {
      id: presetEditorDraft.id,
      name,
      emoji: presetEditorDraft.emoji.trim() || "📋",
      items
    };
    const existingIndex = presets.findIndex(item => item.id === savedPreset.id);
    if (existingIndex >= 0) presets[existingIndex] = savedPreset;
    else presets.push(savedPreset);
    saveChecklistPresets(presets);
    presetEditorDraft = null;
    activePresetItemEdit = null;
    renderTodayChecklists();
    renderPresetManager();
  });

  if (focusActiveItem) overlay.querySelector(".preset-item-input")?.focus();
}

function getAllDailyChecklists() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(
        DAILY_CHECKLISTS_KEY
      ) || "{}"
    );

    return saved && typeof saved === "object"
      ? saved
      : {};
  } catch (error) {
    console.error(
      "Could not load daily checklists:",
      error
    );

    return {};
  }
}

function saveAllDailyChecklists(checklists) {
  localStorage.setItem(
    DAILY_CHECKLISTS_KEY,
    JSON.stringify(checklists)
  );
}

function getCompletedChecklistRecords() {
  try {
    const saved = JSON.parse(
      localStorage.getItem(
        COMPLETED_CHECKLISTS_KEY
      ) || "[]"
    );

    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    console.error(
      "Could not load completed checklists:",
      error
    );

    return [];
  }
}

function archiveCompletedChecklist(checklist) {
  const records = getCompletedChecklistRecords();

  if (records.some(record => (
    record?.checklistInstanceId === checklist.id
  ))) {
    return false;
  }

  records.push({
    checklistInstanceId: checklist.id,
    presetId: checklist.presetId,
    name: checklist.name,
    emoji: checklist.emoji,
    completedAt: new Date().toISOString(),
    date: getTodayDateString(),
    items: checklist.items.map(item => ({
      id: item.id,
      name: item.text,
      completed: item.completed === true
    }))
  });

  localStorage.setItem(
    COMPLETED_CHECKLISTS_KEY,
    JSON.stringify(records)
  );

  return true;
}

function getTodayChecklists() {
  const checklists = getAllDailyChecklists();
  const todayChecklists =
    checklists[getTodayDateString()];

  if (!Array.isArray(todayChecklists)) {
    return [];
  }

  return todayChecklists.filter(checklist => (
    checklist &&
    typeof checklist.id === "string" &&
    typeof checklist.name === "string" &&
    Array.isArray(checklist.items)
  ));
}

function saveTodayChecklists(todayChecklists) {
  const checklists = getAllDailyChecklists();
  const today = getTodayDateString();

  if (todayChecklists.length > 0) {
    checklists[today] = todayChecklists;
  } else {
    delete checklists[today];
  }

  saveAllDailyChecklists(checklists);
}

function createChecklistInstanceId() {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

function addPresetToToday(presetId) {
  const preset = getChecklistPresets().find(
    item => item.id === presetId
  );

  if (!preset) return;

  const instanceId = createChecklistInstanceId();
  const todayChecklists = getTodayChecklists();

  todayChecklists.push({
    id: instanceId,
    presetId: preset.id,
    name: preset.name,
    emoji: preset.emoji,
    items: preset.items.map((text, index) => ({
      id: `${instanceId}-${index}`,
      text,
      completed: false
    }))
  });

  saveTodayChecklists(todayChecklists);
  renderTodayChecklists();
}

function removeChecklistFromToday(instanceId) {
  saveTodayChecklists(
    getTodayChecklists().filter(
      checklist => checklist.id !== instanceId
    )
  );

  renderTodayChecklists();
}

function setChecklistItemComplete(
  instanceId,
  itemId,
  completed
) {
  const todayChecklists = getTodayChecklists();
  const checklist = todayChecklists.find(
    item => item.id === instanceId
  );
  const checklistItem = checklist?.items.find(
    item => item.id === itemId
  );

  if (!checklistItem) return;

  checklistItem.completed = completed;

  const validItems = checklist.items.filter(
    item => item && typeof item.id === "string"
  );
  const isComplete = validItems.length > 0 &&
    validItems.every(item => item.completed === true);

  if (isComplete) {
    const archived = archiveCompletedChecklist(checklist);

    saveTodayChecklists(
      todayChecklists.filter(item => item.id !== instanceId)
    );
    renderTodayChecklists();

    if (archived) {
      showChecklistCompletionMessage(checklist.name);
    }

    return;
  }

  saveTodayChecklists(todayChecklists);
  renderTodayChecklists();
}

function showChecklistCompletionMessage(checklistName) {
  const status = document.getElementById(
    "checklistCompletionStatus"
  );

  if (!status) return;

  window.clearTimeout(checklistCompletionMessageTimer);
  status.textContent =
    `${checklistName} completed and saved to Calendar.`;
  status.classList.add("visible");

  checklistCompletionMessageTimer = window.setTimeout(() => {
    status.classList.remove("visible");
  }, 4000);
}

function renderChecklistCard(checklist) {
  const validItems = checklist.items.filter(
    item => item && typeof item.id === "string"
  );
  const completedCount = validItems.filter(
    item => item.completed === true
  ).length;
  const totalCount = validItems.length;
  const progress = totalCount
    ? Math.round((completedCount / totalCount) * 100)
    : 0;

  return `
    <article class="today-checklist-card">
      <div class="today-checklist-heading">
        <div>
          <h4>
            ${escapeTodayHtml(checklist.emoji)}
            ${escapeTodayHtml(checklist.name)}
          </h4>
          <p>${completedCount} of ${totalCount} complete</p>
        </div>
        <button
          class="remove-checklist-btn"
          data-checklist-id="${escapeTodayHtml(checklist.id)}"
          type="button"
          aria-label="Remove ${escapeTodayHtml(checklist.name)} from today"
        >
          Remove
        </button>
      </div>
      <div
        class="checklist-progress-track"
        role="progressbar"
        aria-label="${escapeTodayHtml(checklist.name)} progress"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow="${progress}"
      >
        <span style="width: ${progress}%"></span>
      </div>
      <div class="today-checklist-items">
        ${validItems.map(item => `
          <label class="today-checklist-item ${
            item.completed ? "completed" : ""
          }">
            <input
              class="today-checklist-checkbox"
              type="checkbox"
              data-checklist-id="${escapeTodayHtml(checklist.id)}"
              data-item-id="${escapeTodayHtml(item.id)}"
              ${item.completed ? "checked" : ""}
            >
            <span>${escapeTodayHtml(item.text)}</span>
          </label>
        `).join("")}
      </div>
    </article>
  `;
}

function renderTodayChecklists() {
  const mount = document.getElementById(
    "todayChecklistsContent"
  );

  if (!mount) return;

  const presets = getChecklistPresets();
  const todayChecklists = getTodayChecklists();
  const activePresetCounts = new Map();

  todayChecklists.forEach(checklist => {
    const count = activePresetCounts.get(
      checklist.presetId
    ) || 0;

    activePresetCounts.set(checklist.presetId, count + 1);
  });

  mount.innerHTML = `
    <div
      id="checklistCompletionStatus"
      class="checklist-completion-status"
      role="status"
      aria-live="polite"
    ></div>
    <div class="checklist-preset-picker">
      <div class="checklist-preset-picker-heading">
        <p>Add a reusable preset:</p>
        <button id="manageChecklistPresetsBtn" type="button">Manage Presets</button>
      </div>
      <div class="checklist-preset-buttons">
        ${presets.map(preset => `
          <button
            class="add-checklist-preset-btn"
            data-preset-id="${escapeTodayHtml(preset.id)}"
            type="button"
            aria-label="Add ${escapeTodayHtml(preset.name)} checklist to today"
          >
            <span>${escapeTodayHtml(preset.emoji)}</span>
            ${escapeTodayHtml(preset.name)}
            ${activePresetCounts.get(preset.id)
              ? `<small>${activePresetCounts.get(preset.id)} added</small>`
              : ""}
          </button>
        `).join("")}
      </div>
    </div>
    <div class="active-today-checklists">
      ${todayChecklists.length
        ? todayChecklists.map(renderChecklistCard).join("")
        : `<p class="empty-state">
            No checklists added for today.
          </p>`}
    </div>
  `;

  mount.querySelectorAll(
    ".add-checklist-preset-btn"
  ).forEach(button => {
    button.addEventListener("click", event => {
      addPresetToToday(
        event.currentTarget.dataset.presetId
      );
    });
  });

  mount.querySelector("#manageChecklistPresetsBtn")
    .addEventListener("click", renderPresetManager);

  mount.querySelectorAll(
    ".remove-checklist-btn"
  ).forEach(button => {
    button.addEventListener("click", event => {
      removeChecklistFromToday(
        event.currentTarget.dataset.checklistId
      );
    });
  });

  mount.querySelectorAll(
    ".today-checklist-checkbox"
  ).forEach(checkbox => {
    checkbox.addEventListener("change", event => {
      const current = event.currentTarget;

      setChecklistItemComplete(
        current.dataset.checklistId,
        current.dataset.itemId,
        current.checked
      );
    });
  });
}

// ----- New Today layout -----

function formatTodayHeadingDate(
  date = new Date()
) {
  return date.toLocaleDateString(
    undefined,
    {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    }
  );
}

function ensureTodayDashboardLayout() {
  const logPage =
    document.getElementById("logPage");

  if (!logPage) {
    return null;
  }

  const existingLayout =
    document.getElementById(
      "todayDashboardLayout"
    );

  if (existingLayout) {
    return existingLayout;
  }

  /*
    Preserve the existing check-in elements
    before rebuilding the page structure.
  */
  const summaryCard =
    logPage.querySelector(
      ".summary-card"
    );

  const sliders =
    document.getElementById("sliders");

  const notes =
    document.getElementById("notes");

  const saveButton =
    document.getElementById("saveBtn");

  const savedMessage =
    document.getElementById("saved");

  logPage.innerHTML = `
    <section
      id="todayDashboardLayout"
      class="today-dashboard-layout"
    >

      <header class="today-page-heading">

        <h2>today</h2>

        <p id="todayFullDate">
          ${formatTodayHeadingDate()}
        </p>


      </header>

      <section class="today-schedule-card">

        <div class="today-block-heading">

          <div>
            <h3>📅 today’s schedule</h3>

            <p>
              Shifts and appointments will
              appear here.
            </p>
          </div>

        </div>

        <div
          id="todayScheduleContent"
          class="today-schedule-content"
        >
          <p class="empty-state">
            Nothing scheduled for today yet.
          </p>
        </div>

      </section>

      <details
        id="morningRoutineSection"
        class="today-collapsible-section"
      >

        <summary>
          <span>
            🌅 morning routine
          </span>

          <span class="today-collapse-arrow">
            ›
          </span>
        </summary>

        <div class="today-collapsible-content">

        <div id="morningRoutineContent">
  ${renderRoutineItems(
    getMorningRoutineName()
  )}
</div>

<button
  id="addMorningRoutineBtn"
  class="today-add-btn"
  type="button"
>
  ＋ Add item
</button>

        </div>

      </details>

      <details
        id="todayChecklistsSection"
        class="today-collapsible-section"
        open
      >
        <summary>
          <span>📋 checklist presets</span>
          <span class="today-collapse-arrow">›</span>
        </summary>
        <div class="today-collapsible-content">
          <div id="todayChecklistsContent"></div>
        </div>
      </details>

      <section class="today-trackers-section">

        <div class="today-block-heading">

          <div>
            <h3>◇ daily directions</h3>

            <p>
              check in with yourself
            </p>
          </div>

        </div>

        <div id="todayTrackerMount"></div>

      </section>

      <details
        id="todayGoalsSection"
        class="today-collapsible-section"
      >

        <summary>

          <span>
            🎯 goals & tasks
          </span>

          <span class="today-collapse-arrow">
            ›
          </span>

        </summary>

        <div class="today-collapsible-content">

          <section
            id="todayTasksSection"
            class="page-card"
          ></section>

        </div>

      </details>

      <details
        id="eveningRoutineSection"
        class="today-collapsible-section"
      >

        <summary>

          <span>
            🌙 evening routine
          </span>

          <span class="today-collapse-arrow">
            ›
          </span>

        </summary>

        <div class="today-collapsible-content">

       <div id="eveningRoutineContent">
  ${renderRoutineItems(
    getEveningRoutineName()
  )}
</div>

<button
  id="addEveningRoutineBtn"
  class="today-add-btn"
  type="button"
>
  ＋ Add item
</button>

        </div>

      </details>

      <button id="todayJournalShortcut" class="today-journal-shortcut" type="button">
        <span>✎ daily note</span><small>open your journal</small>
      </button>

    </section>
  `;

  const trackerMount =
    document.getElementById(
      "todayTrackerMount"
    );
  // Phase 1 flow keeps check-in metrics immediately after the schedule;
  // existing routine and checklist data remains intact below it.
  const trackerSection = document.querySelector(".today-trackers-section");
  const scheduleSection = document.querySelector(".today-schedule-card");
  if (trackerSection && scheduleSection) scheduleSection.after(trackerSection);


  if (summaryCard) {
    const summaryTitle =
      summaryCard.querySelector(
        ".summary-header h2"
      );

    if (summaryTitle) {
      summaryTitle.textContent =
        "check-in summary";
    }

    trackerMount.appendChild(
      summaryCard
    );
  }

  if (sliders) {
    trackerMount.appendChild(sliders);
  }

  if (notes) {
    trackerMount.appendChild(notes);
  }

  if (saveButton) {
    trackerMount.appendChild(
      saveButton
    );
  }

  if (savedMessage) {
    trackerMount.appendChild(
      savedMessage
    );
  }

  return document.getElementById(
    "todayDashboardLayout"
  );
}

// ----- Render Today -----

function renderTodayPage() {
  const layout =
    ensureTodayDashboardLayout();

  if (!layout) {
    return;
  }

  const dateLabel =
    document.getElementById(
      "todayFullDate"
    );

  if (dateLabel) {
    dateLabel.textContent =
      formatTodayHeadingDate();
  }

  const todaySection =
    document.getElementById(
      "todayTasksSection"
    );

  if (!todaySection) {
    return;
  }

  renderTodayChecklists();

  const tasks =
    getTodayMasterlistTasks().filter(
      task => !task.archived
    );

  const todayTaskIds =
    getTodayTaskIds();

  const selectedTasks =
    tasks.filter(task => {
      return (
        todayTaskIds.includes(task.id) &&
        !task.completed
      );
    });

  const validTodayTaskIds =
    selectedTasks.map(
      task => task.id
    );

  if (
    validTodayTaskIds.length !==
    todayTaskIds.length
  ) {
    saveTodayTaskIds(
      validTodayTaskIds
    );
  }

  const suggestedTasks =
    getSuggestedTasks(
      tasks,
      validTodayTaskIds
    );

  const groupedTasks =
    groupTasksByCategory(
      selectedTasks
    );

  const selectedTasksHtml =
    selectedTasks.length === 0
      ? `
        <p class="empty-state">
          Nothing selected for today yet.
        </p>
      `
      : Object.entries(
          groupedTasks
        )
          .map(
            ([
              categoryId,
              categoryTasks
            ]) => `
              <div class="today-category-group">

                <h3>
                  ${getTodayCategoryLabel(
                    categoryId
                  )}
                </h3>

                ${categoryTasks
                  .map(
                    renderTodayTaskCard
                  )
                  .join("")}

              </div>
            `
          )
          .join("");

  const suggestedTasksHtml =
    suggestedTasks.length === 0
      ? `
        <p class="empty-state">
          No available suggestions
          right now.
        </p>
      `
      : suggestedTasks
          .map(task => {
            const categories =
              task.categories?.length
                ? task.categories
                : ["misc"];

            return `
              <div class="suggested-task">

                <div>

                  <div
                    class="suggested-task-text"
                  >
                    ${task.text}
                  </div>

                  ${
                    task.dueDate
                      ? `
                        <div
                          class="task-deadline"
                        >
                          ⏰
                          ${formatTodayDueDate(
                            task.dueDate
                          )}
                        </div>
                      `
                      : `
                        <div
                          class="suggested-task-category"
                        >
                          ${categories
                            .map(
                              getTodayCategoryLabel
                            )
                            .join(" • ")}
                        </div>
                      `
                  }

                </div>

                <button
                  class="add-to-today-btn"
                  data-task-id="${task.id}"
                  type="button"
                >
                  Add
                </button>

              </div>
            `;
          })
          .join("");

  todaySection.innerHTML = `
    <div class="today-section-header">

      <h3>today’s tasks</h3>

      <div class="today-header-actions">

        <span class="today-task-count">
          ${selectedTasks.length}
        </span>

        <button
          id="openTodayQuickAddBtn"
          class="today-add-btn"
          type="button"
          aria-label="Add a task for today"
        >
          ＋
        </button>

      </div>

    </div>

    <div id="selectedTodayTasks">
      ${selectedTasksHtml}
    </div>

    <div class="today-suggestions">

      <h3>✨ suggestions</h3>

      <p class="today-suggestion-note">
        Due and overdue tasks appear
        first. You choose what belongs
        today.
      </p>

      ${suggestedTasksHtml}

    </div>
  `;

  document
    .getElementById(
      "openTodayQuickAddBtn"
    )
    ?.addEventListener(
      "click",
      openTodayQuickAdd
    );

  document
    .querySelectorAll(
      ".add-to-today-btn"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        event => {
          const taskId = Number(
            event.currentTarget
              .dataset.taskId
          );

          addTaskToToday(taskId);
        }
      );
    });

  document
    .querySelectorAll(
      ".remove-today-btn"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        event => {
          const taskId = Number(
            event.currentTarget
              .dataset.taskId
          );

          removeTaskFromToday(
            taskId
          );
        }
      );
    });

  document
    .querySelectorAll(
      ".today-task-checkbox"
    )
    .forEach(checkbox => {
      checkbox.addEventListener(
        "change",
        event => {
          const taskId = Number(
            event.currentTarget
              .dataset.taskId
          );

          completeTodayTask(taskId);
        }
      );
    });

  const workButton =
    document.getElementById(
      "workDayBtn"
    );

  const offButton =
    document.getElementById(
      "offDayBtn"
    );

  workButton?.classList.toggle(
    "active",
    getDayMode() === "work"
  );

  offButton?.classList.toggle(
    "active",
    getDayMode() === "off"
  );

  workButton?.addEventListener(
    "click",
    () => {
      saveDayMode("work");
    }
  );

  offButton?.addEventListener(
    "click",
    () => {
      saveDayMode("off");
    }
  );

  document
    .getElementById(
      "addMorningRoutineBtn"
    )
    ?.addEventListener(
      "click",
      event => {
        openRoutineItemForm(
          getMorningRoutineName(),
          event.currentTarget
        );
      }
    );

  document
    .getElementById(
      "addEveningRoutineBtn"
    )
    ?.addEventListener(
      "click",
      event => {
        openRoutineItemForm(
          getEveningRoutineName(),
          event.currentTarget
        );
      }
    );

  attachRoutineEvents();
}



// ----- Navigation events -----

document
  .getElementById("todayTab")
  ?.addEventListener("click", () => {
    showMainPage("todayPage");

    document
      .getElementById("todayTab")
      ?.classList.add("active");
  });

document
  .getElementById("masterlistTab")
  ?.addEventListener("click", () => {
    showMainPage("masterlistPage");

    document
      .getElementById("masterlistTab")
      ?.classList.add("active");
  });

document
  .getElementById("journalTab")
  ?.addEventListener("click", () => {
    showMainPage("journalPage");

    document
      .getElementById("journalTab")
      ?.classList.add("active");
  });

document
  .getElementById("calendarTab")
  ?.addEventListener("click", () => {
    showMainPage("calendarPage");

    document
      .getElementById("calendarTab")
      ?.classList.add("active");
  });

const createMenu = document.getElementById("createMenu");
const createTab = document.getElementById("createTab");

function setCreateMenu(open) {
  createMenu?.classList.toggle("hidden", !open);
  createTab?.setAttribute("aria-expanded", String(open));
  document.body.classList.toggle("menu-open", open);
  if (open) document.getElementById("closeCreateMenu")?.focus();
}

createTab?.addEventListener("click", () => {
  setCreateMenu(createMenu?.classList.contains("hidden"));
});
document.getElementById("closeCreateMenu")?.addEventListener("click", () => setCreateMenu(false));
createMenu?.addEventListener("click", event => {
  if (event.target === createMenu) setCreateMenu(false);
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape") setCreateMenu(false);
});

document.querySelectorAll("[data-create-action]").forEach(button => {
  button.addEventListener("click", () => {
    const action = button.dataset.createAction;
    setCreateMenu(false);
    if (action === "task") { showMainPage("todayPage"); openTodayQuickAdd(); }
    if (action === "checklist") { showMainPage("todayPage"); renderPresetManager(); }
    if (action === "journal") { showMainPage("journalPage"); renderJournalLandingPage(); }
    if (action === "checkin") { showMainPage("todayPage"); document.querySelector(".today-trackers-section")?.scrollIntoView({ behavior: "smooth" }); }
    if (action === "insights") renderInsightsPage();
    if (action === "settings") renderSettingsPage();
    if (action === "themes") renderThemePicker();
  });
});

document.addEventListener("click", event => {
  if (event.target.closest("#todayJournalShortcut")) {
    showMainPage("journalPage");
    document.getElementById("journalTab")?.classList.add("active");
  }
});

// ----- Start -----

showMainPage("todayPage");

document
  .getElementById("todayTab")
  ?.classList.add("active");
