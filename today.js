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

// ----- Render Today -----

function renderTodayPage() {
  const logPage = document.getElementById("logPage");

  if (!logPage) return;

  let todaySection =
    document.getElementById("todayTasksSection");

  if (!todaySection) {
    todaySection = document.createElement("section");
    todaySection.id = "todayTasksSection";
    todaySection.className = "page-card";

    logPage.prepend(todaySection);
  }

  const tasks = getTodayMasterlistTasks().filter(
    task => !task.archived
  );

  const todayTaskIds = getTodayTaskIds();

  const selectedTasks = tasks.filter(task => {
    return (
      todayTaskIds.includes(task.id) &&
      !task.completed
    );
  });

  const validTodayTaskIds =
    selectedTasks.map(task => task.id);

  if (
    validTodayTaskIds.length !== todayTaskIds.length
  ) {
    saveTodayTaskIds(validTodayTaskIds);
  }

  const suggestedTasks = getSuggestedTasks(
    tasks,
    validTodayTaskIds
  );

  const groupedTasks =
    groupTasksByCategory(selectedTasks);

  const selectedTasksHtml =
    selectedTasks.length === 0
      ? `
        <p class="empty-state">
          Nothing selected for today yet.
        </p>
      `
      : Object.entries(groupedTasks)
          .map(([categoryId, categoryTasks]) => `
            <div class="today-category-group">

              <h3>
                ${getTodayCategoryLabel(categoryId)}
              </h3>

              ${categoryTasks
                .map(renderTodayTaskCard)
                .join("")}

            </div>
          `)
          .join("");

  const suggestedTasksHtml =
    suggestedTasks.length === 0
      ? `
        <p class="empty-state">
          No available suggestions right now.
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
                  <div class="suggested-task-text">
                    ${task.text}
                  </div>

                  ${
                    task.dueDate
                      ? `
                        <div class="task-deadline">
                          ⏰ ${formatTodayDueDate(
                            task.dueDate
                          )}
                        </div>
                      `
                      : `
                        <div class="suggested-task-category">
                          ${categories
                            .map(getTodayCategoryLabel)
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

      <h2>☀️ Today's Tasks</h2>

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

      <h3>✨ Suggestions</h3>

      <p class="today-suggestion-note">
        Due and overdue tasks appear first.
        You choose what belongs today.
      </p>

      ${suggestedTasksHtml}

    </div>
  `;

  document
    .getElementById("openTodayQuickAddBtn")
    ?.addEventListener("click", openTodayQuickAdd);

  document
    .querySelectorAll(".add-to-today-btn")
    .forEach(button => {
      button.addEventListener("click", event => {
        const taskId = Number(
          event.currentTarget.dataset.taskId
        );

        addTaskToToday(taskId);
      });
    });

  document
    .querySelectorAll(".remove-today-btn")
    .forEach(button => {
      button.addEventListener("click", event => {
        const taskId = Number(
          event.currentTarget.dataset.taskId
        );

        removeTaskFromToday(taskId);
      });
    });

  document
    .querySelectorAll(".today-task-checkbox")
    .forEach(checkbox => {
      checkbox.addEventListener("change", event => {
        const taskId = Number(
          event.currentTarget.dataset.taskId
        );

        completeTodayTask(taskId);
      });
    });
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