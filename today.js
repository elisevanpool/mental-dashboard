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

    return presets.filter(preset => (
      preset &&
      typeof preset.id === "string" &&
      typeof preset.name === "string" &&
      Array.isArray(preset.items)
    ));
  } catch (error) {
    console.error(
      "Could not load checklist presets:",
      error
    );

    return defaultChecklistPresets;
  }
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
      <p>Add a reusable preset:</p>
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
        <div class="day-mode-picker">

  <button
    id="workDayBtn"
    type="button"
  >
    💼 Work day
  </button>

  <button
    id="offDayBtn"
    type="button"
  >
    🏡 Off day
  </button>

</div>

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
            <h3>🧠 trackers</h3>

            <p>
              Check in with yourself.
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

    </section>
  `;

  const trackerMount =
    document.getElementById(
      "todayTrackerMount"
    );

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

document
  .getElementById("moreTab")
  ?.addEventListener("click", () => {
    showMainPage("morePage");

    document
      .getElementById("moreTab")
      ?.classList.add("active");
  });

// ----- Start -----

showMainPage("todayPage");

document
  .getElementById("todayTab")
  ?.classList.add("active");
