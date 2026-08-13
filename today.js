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

const LEGACY_CHECKLIST_PRESETS_KEY = "mybrainChecklistPresets";
const CUSTOM_CHECKLIST_PRESETS_KEY = "mybrainCustomChecklistPresets";
const CHECKLIST_PRESET_LIBRARY_KEY = "mybrainChecklistPresetLibraryV1";
const DAILY_CHECKLISTS_KEY = "mybrainDailyChecklists";
const COMPLETED_CHECKLISTS_KEY = "mybrainCompletedChecklists";

let checklistCompletionMessageTimer = null;
const completingChecklistIds = new Set();
let presetCreatorDraft = null;
let presetCreatorTrigger = null;
let presetCreatorSaving = false;
let presetLibraryTrigger = null;
let presetLibraryFilter = "all";

const defaultChecklistPresets = [
  { id: "leaving-the-house", name: "Leaving the House", emoji: "🚪", items: [
    { id: "leaving-keys", text: "Keys" },
    { id: "leaving-phone", text: "Phone" },
    { id: "leaving-wallet", text: "Wallet" },
    { id: "leaving-water", text: "Water bottle" },
    { id: "leaving-lock", text: "Lock the door" }
  ] },
  { id: "laundry-day", name: "Laundry Day", emoji: "🧺", items: [
    { id: "laundry-gather", text: "Gather laundry" },
    { id: "laundry-wash", text: "Start washer" },
    { id: "laundry-dry", text: "Move clothes to dryer" },
    { id: "laundry-fold", text: "Fold clothes" },
    { id: "laundry-away", text: "Put clothes away" }
  ] },
  { id: "work-morning", name: "Work Morning", emoji: "💼", items: [
    { id: "work-calendar", text: "Check calendar" },
    { id: "work-bag", text: "Pack work bag" },
    { id: "work-lunch", text: "Prepare lunch" },
    { id: "work-water", text: "Fill water bottle" },
    { id: "work-leave", text: "Leave on time" }
  ] }
];

function createStableId(prefix) {
  if (window.crypto?.randomUUID) return `${prefix}-${window.crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeChecklistPreset(preset) {
  if (!preset || typeof preset.id !== "string" ||
      typeof preset.name !== "string" || !Array.isArray(preset.items)) return null;

  const name = preset.name.trim();
  const items = preset.items.map(item => {
    const text = typeof item === "string" ? item.trim() :
      typeof item?.text === "string" ? item.text.trim() :
      typeof item?.name === "string" ? item.name.trim() : "";
    if (!text) return null;
    return {
      id: typeof item?.id === "string" && item.id ? item.id : createStableId("preset-item"),
      text
    };
  }).filter(Boolean);

  if (!name || !items.length) return null;
  return { id: preset.id, name, emoji: typeof preset.emoji === "string" ? preset.emoji.trim() : "", items };
}

function getCustomChecklistPresets() {
  try {
    const current = JSON.parse(localStorage.getItem(CUSTOM_CHECKLIST_PRESETS_KEY) || "null");
    if (Array.isArray(current)) return current.map(normalizeChecklistPreset).filter(Boolean);

    // Safely import custom presets from the earlier combined format. The old key
    // remains untouched so migration can never destroy existing app data.
    const legacy = JSON.parse(localStorage.getItem(LEGACY_CHECKLIST_PRESETS_KEY) || "[]");
    const starterIds = new Set(defaultChecklistPresets.map(preset => preset.id));
    const migrated = Array.isArray(legacy)
      ? legacy.filter(preset => !starterIds.has(preset?.id)).map(normalizeChecklistPreset).filter(Boolean)
      : [];
    if (migrated.length) saveCustomChecklistPresets(migrated);
    return migrated;
  } catch (error) {
    console.error("Could not load custom checklist presets:", error);
    return [];
  }
}

function saveCustomChecklistPresets(presets) {
  localStorage.setItem(CUSTOM_CHECKLIST_PRESETS_KEY, JSON.stringify(presets));
}

function getPresetLibraryState() {
  const fallback = { version: 1, order: [], favorites: [], hiddenStarterIds: [], starterOverrides: {} };
  try {
    const saved = JSON.parse(localStorage.getItem(CHECKLIST_PRESET_LIBRARY_KEY) || "null");
    if (!saved || typeof saved !== "object") return fallback;
    return {
      ...fallback, ...saved,
      order: Array.isArray(saved.order) ? [...new Set(saved.order.filter(id => typeof id === "string"))] : [],
      favorites: Array.isArray(saved.favorites) ? [...new Set(saved.favorites.filter(id => typeof id === "string"))] : [],
      hiddenStarterIds: Array.isArray(saved.hiddenStarterIds) ? [...new Set(saved.hiddenStarterIds.filter(id => typeof id === "string"))] : [],
      starterOverrides: saved.starterOverrides && typeof saved.starterOverrides === "object" ? saved.starterOverrides : {}
    };
  } catch (error) {
    console.error("Could not load preset library settings:", error);
    return fallback;
  }
}

function savePresetLibraryState(state) {
  localStorage.setItem(CHECKLIST_PRESET_LIBRARY_KEY, JSON.stringify({ ...state, version: 1 }));
}

function getPresetLibraryEntries({ includeHidden = false } = {}) {
  const state = getPresetLibraryState();
  const starterIds = new Set(defaultChecklistPresets.map(preset => preset.id));
  const entries = [
    ...defaultChecklistPresets.map(original => normalizeChecklistPreset(state.starterOverrides[original.id]) || original),
    ...getCustomChecklistPresets()
  ].map(preset => ({ ...preset, kind: starterIds.has(preset.id) ? "starter" : "custom", favorite: state.favorites.includes(preset.id), hidden: state.hiddenStarterIds.includes(preset.id) }));
  const position = new Map(state.order.map((id, index) => [id, index]));
  return entries.filter(preset => includeHidden || !preset.hidden).sort((a, b) => {
    if (a.favorite !== b.favorite) return a.favorite ? -1 : 1;
    return (position.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (position.get(b.id) ?? Number.MAX_SAFE_INTEGER);
  });
}

function getChecklistPresets() {
  return getPresetLibraryEntries();
}

function closePresetCreator() {
  const returnToLibrary = presetCreatorDraft?.returnToLibrary;
  document.getElementById("presetCreatorOverlay")?.remove();
  presetCreatorDraft = null;
  presetCreatorSaving = false;
  const trigger = presetCreatorTrigger;
  presetCreatorTrigger = null;
  if (returnToLibrary) openPresetLibrary();
  else (trigger?.isConnected ? trigger : document.getElementById("createChecklistPresetBtn"))?.focus();
}

function syncPresetCreatorDraft(overlay) {
  presetCreatorDraft.name = overlay.querySelector("#presetNameInput").value;
  presetCreatorDraft.emoji = overlay.querySelector("#presetEmojiInput").value;
  overlay.querySelectorAll("[data-preset-item-id]").forEach(input => {
    const item = presetCreatorDraft.items.find(entry => entry.id === input.dataset.presetItemId);
    if (item) item.text = input.value;
  });
}

function renderPresetCreator(focusItemId = null) {
  const overlay = document.getElementById("presetCreatorOverlay");
  if (!overlay || !presetCreatorDraft) return;
  const draft = presetCreatorDraft;
  overlay.innerHTML = `
    <section class="preset-manager preset-creator" role="dialog" aria-modal="true"
      aria-labelledby="presetCreatorTitle" aria-describedby="presetCreatorHint">
      <div class="preset-manager-heading">
        <div><p class="preset-manager-kicker">Reusable checklists</p>
          <h3 id="presetCreatorTitle">${draft.mode === "create" ? "Create" : "Edit"} Preset</h3></div>
        <button class="preset-icon-btn" id="closePresetCreatorBtn" type="button"
          aria-label="Close preset creator">✕</button>
      </div>
      <p id="presetCreatorHint" class="preset-creator-hint">Build a checklist you can add to Today whenever you need it.</p>
      <form id="presetCreatorForm" novalidate>
        <div class="preset-basics">
          <label for="presetEmojiInput">Icon or emoji
            <input id="presetEmojiInput" maxlength="12" value="${escapeTodayHtml(draft.emoji)}" placeholder="📋">
          </label>
          <label for="presetNameInput">Preset name <span aria-hidden="true">*</span>
            <input id="presetNameInput" maxlength="80" value="${escapeTodayHtml(draft.name)}"
              autocomplete="off" aria-describedby="presetNameError" required placeholder="e.g. Gym bag">
            <span class="preset-field-error" id="presetNameError"></span>
          </label>
        </div>
        <div class="preset-items-heading"><strong>Checklist items</strong>
          <button id="addPresetItemBtn" type="button">＋ Add Item</button></div>
        <div class="preset-editor-items">
          ${draft.items.map((item, index) => `<div class="preset-editor-item">
            <label class="sr-only" for="presetItem${index}">Checklist item ${index + 1}</label>
            <input class="preset-item-input" id="presetItem${index}" data-preset-item-id="${escapeTodayHtml(item.id)}"
              maxlength="120" value="${escapeTodayHtml(item.text)}" placeholder="Item ${index + 1}">
            <div class="preset-item-actions">
              <button type="button" data-move-up="${index}" aria-label="Move item ${index + 1} up" ${index === 0 ? "disabled" : ""}>↑</button>
              <button type="button" data-move-down="${index}" aria-label="Move item ${index + 1} down" ${index === draft.items.length - 1 ? "disabled" : ""}>↓</button>
              <button class="preset-delete-btn" type="button" data-remove-item="${index}" aria-label="Remove item ${index + 1}">⌫</button>
            </div>
          </div>`).join("")}
        </div>
        <p class="preset-form-error" id="presetItemsError" role="alert"></p>
        <div class="preset-editor-footer">
          <button id="cancelPresetCreatorBtn" type="button">Cancel</button>
          <button class="preset-primary-btn" id="savePresetBtn" type="submit">Save Preset</button>
        </div>
      </form>
    </section>`;

  const syncAndRender = (callback, nextFocus = null) => {
    syncPresetCreatorDraft(overlay);
    callback();
    renderPresetCreator(nextFocus);
  };
  overlay.querySelector("#closePresetCreatorBtn").addEventListener("click", closePresetCreator);
  overlay.querySelector("#cancelPresetCreatorBtn").addEventListener("click", closePresetCreator);
  overlay.querySelector("#addPresetItemBtn").addEventListener("click", () => {
    const item = { id: createStableId("preset-item"), text: "" };
    syncAndRender(() => draft.items.push(item), item.id);
  });
  overlay.querySelectorAll("[data-remove-item]").forEach(button => button.addEventListener("click", () =>
    syncAndRender(() => draft.items.splice(Number(button.dataset.removeItem), 1))));
  const move = (button, offset) => syncAndRender(() => {
    const index = Number(button.dataset.moveUp ?? button.dataset.moveDown);
    const [item] = draft.items.splice(index, 1);
    draft.items.splice(index + offset, 0, item);
  });
  overlay.querySelectorAll("[data-move-up]").forEach(button => button.addEventListener("click", () => move(button, -1)));
  overlay.querySelectorAll("[data-move-down]").forEach(button => button.addEventListener("click", () => move(button, 1)));
  overlay.querySelector("#presetCreatorForm").addEventListener("submit", event => {
    event.preventDefault();
    if (presetCreatorSaving) return;
    syncPresetCreatorDraft(overlay);
    const name = draft.name.trim();
    const items = draft.items.map(item => ({ ...item, text: item.text.trim() })).filter(item => item.text);
    const nameError = overlay.querySelector("#presetNameError");
    const itemsError = overlay.querySelector("#presetItemsError");
    nameError.textContent = name ? "" : "Please give your preset a name.";
    itemsError.textContent = items.length ? "" : "Add at least one checklist item.";
    if (!name || !items.length) {
      (name ? overlay.querySelector(".preset-item-input") : overlay.querySelector("#presetNameInput"))?.focus();
      return;
    }
    presetCreatorSaving = true;
    const saveButton = overlay.querySelector("#savePresetBtn");
    saveButton.disabled = true;
    try {
      const savedPreset = { id: draft.id, name, emoji: draft.emoji.trim() || "📋", items };
      if (draft.kind === "starter") {
        const state = getPresetLibraryState();
        state.starterOverrides[draft.id] = savedPreset;
        savePresetLibraryState(state);
      } else {
        const custom = getCustomChecklistPresets();
        const existingIndex = custom.findIndex(preset => preset.id === draft.id);
        if (existingIndex >= 0) custom[existingIndex] = savedPreset;
        else custom.push(savedPreset);
        saveCustomChecklistPresets(custom);
      }
      renderTodayChecklists();
      closePresetCreator();
    } catch (error) {
      console.error("Could not save checklist preset:", error);
      itemsError.textContent = "We couldn’t save this preset. Please check your device storage and try again.";
      presetCreatorSaving = false;
      saveButton.disabled = false;
    }
  });
  if (focusItemId) overlay.querySelector(`[data-preset-item-id="${CSS.escape(focusItemId)}"]`)?.focus();
}

function openPresetCreator(event) {
  presetCreatorTrigger = event?.currentTarget || document.getElementById("createChecklistPresetBtn");
  const returnToLibrary = Boolean(document.getElementById("presetLibraryOverlay"));
  document.getElementById("presetLibraryOverlay")?.remove();
  presetCreatorDraft = { id: createStableId("preset"), mode: "create", kind: "custom", returnToLibrary, name: "", emoji: "📋", items: [
    { id: createStableId("preset-item"), text: "" }
  ] };
  const overlay = document.createElement("div");
  overlay.id = "presetCreatorOverlay";
  overlay.className = "preset-manager-overlay";
  overlay.addEventListener("click", event => { if (event.target === overlay) closePresetCreator(); });
  overlay.addEventListener("keydown", event => {
    if (event.key === "Escape") closePresetCreator();
    if (event.key !== "Tab") return;
    const controls = [...overlay.querySelectorAll("button:not(:disabled), input:not(:disabled)")];
    if (!controls.length) return;
    if (event.shiftKey && document.activeElement === controls[0]) { event.preventDefault(); controls.at(-1).focus(); }
    else if (!event.shiftKey && document.activeElement === controls.at(-1)) { event.preventDefault(); controls[0].focus(); }
  });
  document.body.appendChild(overlay);
  renderPresetCreator();
  overlay.querySelector("#presetNameInput").focus();
}

function openPresetEditor(preset, { duplicate = false } = {}) {
  document.getElementById("presetLibraryOverlay")?.remove();
  const sourceName = duplicate ? `${preset.name} Copy` : preset.name;
  presetCreatorDraft = {
    id: duplicate ? createStableId("preset") : preset.id,
    mode: duplicate ? "create" : "edit",
    kind: duplicate ? "custom" : preset.kind,
    returnToLibrary: true,
    name: sourceName,
    emoji: preset.emoji,
    items: preset.items.map(item => ({ id: duplicate ? createStableId("preset-item") : item.id, text: item.text }))
  };
  const overlay = document.createElement("div");
  overlay.id = "presetCreatorOverlay";
  overlay.className = "preset-manager-overlay";
  overlay.addEventListener("keydown", trapPresetDialogFocus);
  document.body.appendChild(overlay);
  renderPresetCreator();
  overlay.querySelector("#presetNameInput")?.focus();
}

function trapPresetDialogFocus(event) {
  const overlay = event.currentTarget;
  if (event.key === "Escape") {
    if (overlay.id === "presetCreatorOverlay") closePresetCreator(); else closePresetLibrary();
    return;
  }
  if (event.key !== "Tab") return;
  const controls = [...overlay.querySelectorAll("button:not(:disabled), input:not(:disabled)")];
  if (!controls.length) return;
  if (event.shiftKey && document.activeElement === controls[0]) { event.preventDefault(); controls.at(-1).focus(); }
  else if (!event.shiftKey && document.activeElement === controls.at(-1)) { event.preventDefault(); controls[0].focus(); }
}

function closePresetLibrary() {
  document.getElementById("presetLibraryOverlay")?.remove();
  (presetLibraryTrigger?.isConnected ? presetLibraryTrigger : document.getElementById("manageChecklistPresetsBtn"))?.focus();
}

function mutatePresetState(callback) {
  const state = getPresetLibraryState();
  callback(state);
  savePresetLibraryState(state);
  renderPresetLibrary();
  renderTodayChecklists();
}

function renderPresetLibrary() {
  const overlay = document.getElementById("presetLibraryOverlay");
  if (!overlay) return;
  const keepSearchFocus = document.activeElement === overlay.querySelector("#presetLibrarySearch");
  const query = overlay.querySelector("#presetLibrarySearch")?.value || "";
  const normalizedQuery = query.trim().toLowerCase();
  const all = getPresetLibraryEntries({ includeHidden: true });
  const shown = all.filter(preset => !preset.hidden &&
    (presetLibraryFilter === "all" || presetLibraryFilter === "favorites" && preset.favorite || presetLibraryFilter === preset.kind) &&
    (!normalizedQuery || preset.name.toLowerCase().includes(normalizedQuery) || preset.items.some(item => item.text.toLowerCase().includes(normalizedQuery))));
  const hidden = all.filter(preset => preset.kind === "starter" && preset.hidden);
  overlay.innerHTML = `<section class="preset-manager preset-library" role="dialog" aria-modal="true" aria-labelledby="presetLibraryTitle">
    <div class="preset-manager-heading"><div><p class="preset-manager-kicker">Reusable checklists</p><h3 id="presetLibraryTitle">Preset Library</h3></div><button class="preset-icon-btn" data-close-library type="button" aria-label="Close preset library">✕</button></div>
    <button class="preset-primary-btn" id="newPresetBtn" type="button">＋ Create Preset</button>
    <label class="preset-search"><span class="sr-only">Search presets</span><input id="presetLibrarySearch" type="search" placeholder="Search names or checklist items" value="${escapeTodayHtml(query)}"></label>
    <div class="preset-filters" role="group" aria-label="Filter presets">${["all", "favorites", "starter", "custom"].map(filter => `<button type="button" data-filter="${filter}" class="${presetLibraryFilter === filter ? "active" : ""}" aria-pressed="${presetLibraryFilter === filter}">${filter[0].toUpperCase() + filter.slice(1)}</button>`).join("")}</div>
    <div class="preset-manager-list">${shown.length ? shown.map((preset, index) => `<article class="preset-manager-card">
      <div class="preset-manager-card-name"><span aria-hidden="true">${escapeTodayHtml(preset.emoji || "📋")}</span><div><strong>${escapeTodayHtml(preset.name)}</strong><small>${preset.items.length} ${preset.items.length === 1 ? "item" : "items"} · ${preset.kind === "starter" ? "Starter" : "Custom"}</small></div><button class="preset-favorite-btn ${preset.favorite ? "active" : ""}" data-favorite="${escapeTodayHtml(preset.id)}" type="button" aria-label="${preset.favorite ? "Remove" : "Add"} ${escapeTodayHtml(preset.name)} ${preset.favorite ? "from" : "to"} favorites" aria-pressed="${preset.favorite}">★</button></div>
      <div class="preset-manager-actions"><button data-edit="${escapeTodayHtml(preset.id)}" type="button">Edit</button><button data-duplicate="${escapeTodayHtml(preset.id)}" type="button">Duplicate</button><button data-remove="${escapeTodayHtml(preset.id)}" type="button" class="preset-delete-btn">${preset.kind === "starter" ? "Hide" : "Delete"}</button><button data-order-up="${escapeTodayHtml(preset.id)}" type="button" aria-label="Move ${escapeTodayHtml(preset.name)} up" ${index === 0 ? "disabled" : ""}>↑ Up</button><button data-order-down="${escapeTodayHtml(preset.id)}" type="button" aria-label="Move ${escapeTodayHtml(preset.name)} down" ${index === shown.length - 1 ? "disabled" : ""}>↓ Down</button></div>
    </article>`).join("") : `<div class="preset-library-empty"><span>⌕</span><strong>No presets found</strong><p>Try another search or filter.</p></div>`}</div>
    ${hidden.length ? `<section class="hidden-starters"><h4>Hidden starter presets</h4>${hidden.map(p => `<button type="button" data-restore="${escapeTodayHtml(p.id)}">Restore ${escapeTodayHtml(p.emoji)} ${escapeTodayHtml(p.name)}</button>`).join("")}</section>` : ""}
    <div id="presetConfirmRegion"></div></section>`;
  overlay.querySelector("#presetLibrarySearch").addEventListener("input", renderPresetLibrary);
  overlay.querySelector("#presetLibrarySearch").setSelectionRange(query.length, query.length);
  if (keepSearchFocus) overlay.querySelector("#presetLibrarySearch").focus();
  overlay.querySelectorAll("[data-close-library]").forEach(button => button.addEventListener("click", closePresetLibrary));
  overlay.querySelector("#newPresetBtn").addEventListener("click", openPresetCreator);
  overlay.querySelectorAll("[data-filter]").forEach(button => button.addEventListener("click", () => { presetLibraryFilter = button.dataset.filter; renderPresetLibrary(); }));
  const find = id => all.find(preset => preset.id === id);
  overlay.querySelectorAll("[data-edit]").forEach(button => button.addEventListener("click", () => openPresetEditor(find(button.dataset.edit))));
  overlay.querySelectorAll("[data-duplicate]").forEach(button => button.addEventListener("click", () => openPresetEditor(find(button.dataset.duplicate), { duplicate: true })));
  overlay.querySelectorAll("[data-favorite]").forEach(button => button.addEventListener("click", () => mutatePresetState(state => { state.favorites = state.favorites.includes(button.dataset.favorite) ? state.favorites.filter(id => id !== button.dataset.favorite) : [...state.favorites, button.dataset.favorite]; })));
  overlay.querySelectorAll("[data-restore]").forEach(button => button.addEventListener("click", () => mutatePresetState(state => { state.hiddenStarterIds = state.hiddenStarterIds.filter(id => id !== button.dataset.restore); })));
  overlay.querySelectorAll("[data-remove]").forEach(button => button.addEventListener("click", () => showPresetDeleteConfirmation(find(button.dataset.remove))));
  const reorder = (id, offset) => mutatePresetState(state => { const visible = getPresetLibraryEntries().map(p => p.id); const current = visible.indexOf(id); const target = current + offset; if (target < 0 || target >= visible.length) return; [visible[current], visible[target]] = [visible[target], visible[current]]; state.order = [...visible, ...state.order.filter(entry => !visible.includes(entry))]; });
  overlay.querySelectorAll("[data-order-up]").forEach(button => button.addEventListener("click", () => reorder(button.dataset.orderUp, -1)));
  overlay.querySelectorAll("[data-order-down]").forEach(button => button.addEventListener("click", () => reorder(button.dataset.orderDown, 1)));
}

function showPresetDeleteConfirmation(preset) {
  const region = document.getElementById("presetConfirmRegion");
  region.innerHTML = `<div class="preset-confirm-backdrop"><section class="preset-confirm" role="alertdialog" aria-modal="true" aria-labelledby="presetConfirmTitle"><h4 id="presetConfirmTitle">${preset.kind === "starter" ? "Hide" : "Delete"} ${escapeTodayHtml(preset.name)}?</h4><p>Your Today checklists and Calendar history will stay safe.</p><div><button data-cancel-confirm type="button">Cancel</button><button class="preset-delete-btn" data-confirm-remove type="button">${preset.kind === "starter" ? "Hide preset" : "Delete preset"}</button></div></section></div>`;
  region.querySelector("[data-cancel-confirm]").addEventListener("click", () => { region.innerHTML = ""; });
  region.querySelector("[data-confirm-remove]").addEventListener("click", () => {
    if (preset.kind === "starter") mutatePresetState(state => { state.hiddenStarterIds.push(preset.id); });
    else { saveCustomChecklistPresets(getCustomChecklistPresets().filter(item => item.id !== preset.id)); mutatePresetState(state => { state.favorites = state.favorites.filter(id => id !== preset.id); state.order = state.order.filter(id => id !== preset.id); }); }
  });
  region.querySelector("[data-cancel-confirm]").focus();
}

function openPresetLibrary(event) {
  presetLibraryTrigger = event?.currentTarget || presetLibraryTrigger;
  if (document.getElementById("presetLibraryOverlay")) return;
  const overlay = document.createElement("div");
  overlay.id = "presetLibraryOverlay";
  overlay.className = "preset-manager-overlay";
  overlay.addEventListener("keydown", trapPresetDialogFocus);
  document.body.appendChild(overlay);
  renderPresetLibrary();
  overlay.querySelector("#presetLibrarySearch")?.focus();
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
    items: preset.items.map(item => ({
      id: createStableId("checklist-item"),
      text: item.text,
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
  if (completingChecklistIds.has(instanceId)) return;

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
    completingChecklistIds.add(instanceId);
    const archived = archiveCompletedChecklist(checklist);

    // Persist both the calendar record and Today removal before animation. If
    // the app closes during the celebration, the completed history is safe.
    saveTodayChecklists(
      todayChecklists.filter(item => item.id !== instanceId)
    );

    celebrateCompletedChecklist(
      instanceId,
      checklist.name,
      archived
    );

    return;
  }

  saveTodayChecklists(todayChecklists);
  renderTodayChecklists();
}

function celebrateCompletedChecklist(
  instanceId,
  checklistName,
  archived
) {
  const card = document.querySelector(
    `.today-checklist-card[data-checklist-id="${CSS.escape(instanceId)}"]`
  );
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (!card) {
    completingChecklistIds.delete(instanceId);
    renderTodayChecklists();
    if (archived) showChecklistCompletionMessage(checklistName);
    return;
  }

  card.querySelectorAll("input, button").forEach(control => {
    control.disabled = true;
  });
  card.querySelectorAll(".today-checklist-item")
    .forEach(item => item.classList.add("completed"));

  const progress = card.querySelector(".checklist-progress-track");
  const progressFill = progress?.querySelector("span");
  const count = card.querySelector(".today-checklist-heading p");
  const itemCount = card.querySelectorAll(
    ".today-checklist-item"
  ).length;

  if (progress) progress.setAttribute("aria-valuenow", "100");
  if (progressFill) progressFill.style.width = "100%";
  if (count) count.textContent = `${itemCount} of ${itemCount} complete`;

  if (!reducedMotion) {
    const burst = document.createElement("div");
    burst.className = "checklist-sparkle-burst";
    burst.setAttribute("aria-hidden", "true");
    const burstWidth = Math.min(card.offsetWidth * 0.52, 190);
    const burstHeight = Math.min(card.offsetHeight * 0.72, 105);
    const particles = [
      [-1, -0.28, "star"], [-0.82, -0.72, "sparkle"],
      [-0.55, -0.96, "star"], [-0.22, -0.72, "dot"],
      [0.12, -1, "sparkle"], [0.48, -0.82, "star"],
      [0.82, -0.55, "dot"], [1, -0.12, "star"],
      [0.9, 0.42, "sparkle"], [0.65, 0.82, "star"],
      [0.28, 1, "dot"], [-0.08, 0.8, "sparkle"],
      [-0.42, 0.92, "star"], [-0.72, 0.65, "dot"],
      [-0.96, 0.28, "sparkle"], [0.45, -0.28, "star"]
    ];

    burst.innerHTML = particles.map(([x, y, shape], index) => {
      const symbol = shape === "star" ? "✦" : shape === "sparkle" ? "✧" : "";
      const delay = (index % 9) * 22;

      return `<i class="particle-${shape}" style="--spark-x:${Math.round(x * burstWidth)}px;--spark-y:${Math.round(y * burstHeight)}px;--spark-delay:${delay}ms">${symbol}</i>`;
    }).join("");
    card.appendChild(burst);
    card.classList.add("is-celebrating");
  } else {
    card.classList.add("is-complete-reduced");
  }

  const celebrationTime = reducedMotion ? 500 : 850;
  window.setTimeout(() => {
    card.style.maxHeight = `${card.scrollHeight}px`;
    card.offsetHeight;
    card.classList.add("is-dismissing");

    window.setTimeout(() => {
      completingChecklistIds.delete(instanceId);
      renderTodayChecklists();
      if (archived) showChecklistCompletionMessage(checklistName);
    }, reducedMotion ? 220 : 350);
  }, celebrationTime);
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
    <article class="today-checklist-card" data-checklist-id="${escapeTodayHtml(checklist.id)}">
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
        <div class="checklist-preset-controls"><button id="manageChecklistPresetsBtn" type="button">Manage Presets</button><button id="createChecklistPresetBtn" type="button">＋ Create Preset</button></div>
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

  mount.querySelector("#createChecklistPresetBtn")
    .addEventListener("click", openPresetCreator);
  mount.querySelector("#manageChecklistPresetsBtn")
    .addEventListener("click", openPresetLibrary);

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
    if (action === "checklist") {
      showMainPage("todayPage");
      renderTodayChecklists();
      document.getElementById("createChecklistPresetBtn")?.click();
    }
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
