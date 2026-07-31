// =====================
// Masterlist
// =====================

const masterlistPage = document.getElementById("masterlistPage");

const MASTERLIST_TASKS_KEY = "masterlistTasks";
const CUSTOM_CATEGORIES_KEY = "masterlistCustomCategories";

const defaultMasterlistCategories = [
  { id: "body", label: "🚿 Body" },
  { id: "apartment", label: "🏠 Apartment" },
  { id: "administrative", label: "🖥️ Administrative" },
  { id: "phone", label: "📱 TBD on Phone" },
  { id: "errands", label: "🚗 Errands" },
  { id: "under-two", label: "⚡ Under 2 Minutes" },
  { id: "misc", label: "📦 Misc" }
];

let activeMasterlistFilter = "all";
let showingArchivedTasks = false;

// ----- Storage -----

function getMasterlistTasks() {
  try {
    return JSON.parse(
      localStorage.getItem(MASTERLIST_TASKS_KEY) || "[]"
    );
  } catch (error) {
    console.error("Could not load Masterlist tasks:", error);
    return [];
  }
}

function saveMasterlistTasks(tasks) {
  localStorage.setItem(
    MASTERLIST_TASKS_KEY,
    JSON.stringify(tasks)
  );
}

function getCustomMasterlistCategories() {
  try {
    return JSON.parse(
      localStorage.getItem(CUSTOM_CATEGORIES_KEY) || "[]"
    );
  } catch (error) {
    console.error("Could not load custom categories:", error);
    return [];
  }
}

function saveCustomMasterlistCategories(categories) {
  localStorage.setItem(
    CUSTOM_CATEGORIES_KEY,
    JSON.stringify(categories)
  );
}

function getAllMasterlistCategories() {
  return [
    ...defaultMasterlistCategories,
    ...getCustomMasterlistCategories()
  ];
}

// Keep this name because Today uses it.
function getCategoryLabel(categoryId) {
  const category = getAllMasterlistCategories().find(
    item => item.id === categoryId
  );

  return category ? category.label : categoryId;
}

// ----- Dates -----

function getTodayString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDueDate(dueDate) {
  if (!dueDate) return "";

  if (dueDate === getTodayString()) {
    return "Due today";
  }

  const date = new Date(`${dueDate}T12:00:00`);

  return `Due ${date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year:
      date.getFullYear() !== new Date().getFullYear()
        ? "numeric"
        : undefined
  })}`;
}

// ----- Escaping -----

function escapeMasterlistHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ----- Page shell -----

function renderMasterlistPage() {
  if (!masterlistPage) return;

  masterlistPage.innerHTML = `
    <section class="masterlist-page">

      <header class="masterlist-header">

        <div>
          <h2>✅ Masterlist</h2>

          <p id="masterlistSummary"></p>
        </div>

        <button
          id="toggleTaskFormBtn"
          class="masterlist-plus-btn"
          type="button"
          aria-label="Add a task"
        >
          ＋
        </button>

      </header>

      <section
        id="masterlistTaskFormPanel"
        class="masterlist-form-panel hidden"
      ></section>

      <section class="masterlist-toolbar">

        <div
          id="masterlistFilters"
          class="masterlist-filters"
        ></div>

        <button
          id="toggleArchivedBtn"
          class="masterlist-archive-view-btn"
          type="button"
        >
          View Archive
        </button>

      </section>

      <div id="masterlistTasks"></div>

    </section>
  `;

  renderMasterlistFilters();
  renderMasterlistTasks();
  attachMasterlistPageEvents();
}

function attachMasterlistPageEvents() {
  document
    .getElementById("toggleTaskFormBtn")
    ?.addEventListener("click", toggleMasterlistTaskForm);

  document
    .getElementById("toggleArchivedBtn")
    ?.addEventListener("click", () => {
      showingArchivedTasks = !showingArchivedTasks;
      renderMasterlistTasks();
    });
}

// ----- Task form -----

function toggleMasterlistTaskForm() {
  const panel = document.getElementById(
    "masterlistTaskFormPanel"
  );

  const plusButton = document.getElementById(
    "toggleTaskFormBtn"
  );

  if (!panel || !plusButton) return;

  const isHidden = panel.classList.contains("hidden");

  if (isHidden) {
    renderMasterlistTaskForm();
    panel.classList.remove("hidden");
    plusButton.textContent = "×";

    document
      .getElementById("newTaskInput")
      ?.focus();
  } else {
    panel.classList.add("hidden");
    panel.innerHTML = "";
    plusButton.textContent = "＋";
  }
}

function renderMasterlistTaskForm() {
  const panel = document.getElementById(
    "masterlistTaskFormPanel"
  );

  if (!panel) return;

  const categories = getAllMasterlistCategories();

  panel.innerHTML = `
    <div class="masterlist-task-form">

      <label class="masterlist-form-field">
        <span>Task</span>

        <input
          id="newTaskInput"
          type="text"
          placeholder="What needs to be done?"
        >
      </label>

      <div class="masterlist-form-section">

        <div class="masterlist-form-section-header">
          <span>Categories</span>

          <button
            id="openCategoryCreatorBtn"
            class="masterlist-small-btn"
            type="button"
          >
            ＋ New Category
          </button>
        </div>

        <div
          id="categoryOptions"
          class="category-options"
        >
          ${categories
            .map(category => `
              <label class="category-option">

                <input
                  type="checkbox"
                  name="taskCategory"
                  value="${category.id}"
                >

                <span>
                  ${escapeMasterlistHtml(category.label)}
                </span>

              </label>
            `)
            .join("")}
        </div>

        <div
          id="categoryCreator"
          class="category-creator hidden"
        >
          <input
            id="newCategoryEmoji"
            type="text"
            maxlength="4"
            placeholder="✨"
            aria-label="Category emoji"
          >

          <input
            id="newCategoryName"
            type="text"
            maxlength="30"
            placeholder="Category name"
          >

          <button
            id="saveCategoryBtn"
            type="button"
          >
            Add
          </button>
        </div>

        <p
          id="categoryCreatorMessage"
          class="task-form-message"
        ></p>

      </div>

      <div class="masterlist-form-section">

        <span class="masterlist-form-label">
          Deadline
        </span>

        <div class="deadline-options">

          <button
            id="todayDeadlineBtn"
            class="deadline-choice"
            type="button"
          >
            Today
          </button>

          <input
            id="taskDueDate"
            type="date"
          >

          <button
            id="clearDeadlineBtn"
            class="deadline-choice secondary"
            type="button"
          >
            Clear
          </button>

        </div>

      </div>

      <p
        id="taskFormMessage"
        class="task-form-message"
      ></p>

      <button
        id="addTaskBtn"
        class="masterlist-save-task-btn"
        type="button"
      >
        Add Task
      </button>

    </div>
  `;

  document
    .getElementById("openCategoryCreatorBtn")
    ?.addEventListener("click", () => {
      document
        .getElementById("categoryCreator")
        ?.classList.toggle("hidden");
    });

  document
    .getElementById("saveCategoryBtn")
    ?.addEventListener("click", addMasterlistCategory);

  document
    .getElementById("todayDeadlineBtn")
    ?.addEventListener("click", () => {
      const dateInput =
        document.getElementById("taskDueDate");

      if (dateInput) {
        dateInput.value = getTodayString();
      }
    });

  document
    .getElementById("clearDeadlineBtn")
    ?.addEventListener("click", () => {
      const dateInput =
        document.getElementById("taskDueDate");

      if (dateInput) {
        dateInput.value = "";
      }
    });

  document
    .getElementById("addTaskBtn")
    ?.addEventListener("click", addMasterlistTask);

  document
    .getElementById("newTaskInput")
    ?.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        addMasterlistTask();
      }
    });
}

function getSelectedCategories() {
  return Array.from(
    document.querySelectorAll(
      'input[name="taskCategory"]:checked'
    )
  ).map(input => input.value);
}

function addMasterlistTask() {
  const taskInput =
    document.getElementById("newTaskInput");

  const dateInput =
    document.getElementById("taskDueDate");

  const message =
    document.getElementById("taskFormMessage");

  const taskText = taskInput?.value.trim() || "";
  const selectedCategories = getSelectedCategories();
  const dueDate = dateInput?.value || null;

  if (message) {
    message.textContent = "";
  }

  if (!taskText) {
    if (message) {
      message.textContent = "Please enter a task.";
    }

    return;
  }

  if (selectedCategories.length === 0) {
    if (message) {
      message.textContent =
        "Please choose at least one category.";
    }

    return;
  }

  const tasks = getMasterlistTasks();

  tasks.push({
    id: Date.now(),
    text: taskText,
    completed: false,
    archived: false,
    categories: selectedCategories,
    dueDate,
    createdAt: new Date().toISOString(),
    completedAt: null,
    archivedAt: null
  });

  saveMasterlistTasks(tasks);

  renderMasterlistTasks();
  closeMasterlistTaskForm();

  if (typeof renderTodayPage === "function") {
    renderTodayPage();
  }
}

function closeMasterlistTaskForm() {
  const panel = document.getElementById(
    "masterlistTaskFormPanel"
  );

  const plusButton = document.getElementById(
    "toggleTaskFormBtn"
  );

  panel?.classList.add("hidden");

  if (panel) {
    panel.innerHTML = "";
  }

  if (plusButton) {
    plusButton.textContent = "＋";
  }
}

// ----- Custom categories -----

function createCategoryId(name) {
  const cleanName = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return `${cleanName || "category"}-${Date.now()}`;
}

function addMasterlistCategory() {
  const emojiInput =
    document.getElementById("newCategoryEmoji");

  const nameInput =
    document.getElementById("newCategoryName");

  const message =
    document.getElementById("categoryCreatorMessage");

  const emoji = emojiInput?.value.trim() || "✨";
  const name = nameInput?.value.trim() || "";

  if (message) {
    message.textContent = "";
  }

  if (!name) {
    if (message) {
      message.textContent =
        "Please enter a category name.";
    }

    return;
  }

  const allCategories = getAllMasterlistCategories();

  const categoryExists = allCategories.some(category => {
    const categoryName = category.label
      .replace(/^\S+\s*/, "")
      .trim()
      .toLowerCase();

    return categoryName === name.toLowerCase();
  });

  if (categoryExists) {
    if (message) {
      message.textContent =
        "That category already exists.";
    }

    return;
  }

  const customCategories =
    getCustomMasterlistCategories();

  const newCategory = {
    id: createCategoryId(name),
    label: `${emoji} ${name}`
  };

  customCategories.push(newCategory);
  saveCustomMasterlistCategories(customCategories);

  renderMasterlistTaskForm();
  renderMasterlistFilters();

  setTimeout(() => {
    const newCategoryCheckbox = document.querySelector(
      `input[name="taskCategory"][value="${newCategory.id}"]`
    );

    if (newCategoryCheckbox) {
      newCategoryCheckbox.checked = true;
    }
  }, 0);
}

// ----- Filters -----

function renderMasterlistFilters() {
  const filterContainer =
    document.getElementById("masterlistFilters");

  if (!filterContainer) return;

  const categories = getAllMasterlistCategories();

  filterContainer.innerHTML = `
    <button
      class="masterlist-filter-btn ${
        activeMasterlistFilter === "all"
          ? "active"
          : ""
      }"
      type="button"
      data-filter="all"
    >
      All
    </button>

    ${categories
      .map(category => `
        <button
          class="masterlist-filter-btn ${
            activeMasterlistFilter === category.id
              ? "active"
              : ""
          }"
          type="button"
          data-filter="${category.id}"
        >
          ${escapeMasterlistHtml(category.label)}
        </button>
      `)
      .join("")}
  `;

  filterContainer
    .querySelectorAll("[data-filter]")
    .forEach(button => {
      button.addEventListener("click", event => {
        activeMasterlistFilter =
          event.currentTarget.dataset.filter;

        renderMasterlistFilters();
        renderMasterlistTasks();
      });
    });
}

function taskMatchesActiveFilter(task) {
  if (activeMasterlistFilter === "all") {
    return true;
  }

  return Array.isArray(task.categories) &&
    task.categories.includes(activeMasterlistFilter);
}

// ----- Sorting -----

function sortIncompleteTasks(tasks) {
  return [...tasks].sort((taskA, taskB) => {
    if (taskA.dueDate && !taskB.dueDate) {
      return -1;
    }

    if (!taskA.dueDate && taskB.dueDate) {
      return 1;
    }

    if (taskA.dueDate && taskB.dueDate) {
      const dueComparison =
        taskA.dueDate.localeCompare(taskB.dueDate);

      if (dueComparison !== 0) {
        return dueComparison;
      }
    }

    return new Date(taskA.createdAt || taskA.id) -
      new Date(taskB.createdAt || taskB.id);
  });
}

function sortCompletedTasks(tasks) {
  return [...tasks].sort((taskA, taskB) => {
    return new Date(
      taskB.completedAt || taskB.createdAt || taskB.id
    ) - new Date(
      taskA.completedAt || taskA.createdAt || taskA.id
    );
  });
}

// ----- Task rendering -----

function renderMasterlistTasks() {
  const taskContainer =
    document.getElementById("masterlistTasks");

  const summary =
    document.getElementById("masterlistSummary");

  const archiveButton =
    document.getElementById("toggleArchivedBtn");

  if (!taskContainer) return;

  const allTasks = getMasterlistTasks();

  const activeTasks = allTasks.filter(task => {
    return !task.archived && taskMatchesActiveFilter(task);
  });

  const archivedTasks = allTasks.filter(task => {
    return task.archived && taskMatchesActiveFilter(task);
  });

  const incompleteTasks = sortIncompleteTasks(
    activeTasks.filter(task => !task.completed)
  );

  const completedTasks = sortCompletedTasks(
    activeTasks.filter(task => task.completed)
  );

  if (summary) {
    summary.textContent =
      `${incompleteTasks.length} unfinished · ` +
      `${completedTasks.length} completed`;
  }

  if (archiveButton) {
    archiveButton.textContent = showingArchivedTasks
      ? "Back to Tasks"
      : `Archive (${archivedTasks.length})`;
  }

  if (showingArchivedTasks) {
    renderArchivedMasterlistTasks(
      taskContainer,
      archivedTasks
    );

    return;
  }

  const incompleteHtml =
    incompleteTasks.length === 0
      ? `
        <p class="empty-state">
          No unfinished tasks in this view.
        </p>
      `
      : incompleteTasks
          .map(renderMasterlistTaskCard)
          .join("");

  const completedHtml =
    completedTasks.length === 0
      ? ""
      : `
        <section class="completed-tasks-section">

          <div class="completed-tasks-header">

            <h3>
              Completed (${completedTasks.length})
            </h3>

            <button
              id="archiveAllCompletedBtn"
              class="masterlist-small-btn"
              type="button"
            >
              Archive All
            </button>

          </div>

          ${completedTasks
            .map(renderMasterlistTaskCard)
            .join("")}

        </section>
      `;

  taskContainer.innerHTML = `
    <section class="unfinished-tasks-section">
      ${incompleteHtml}
    </section>

    ${completedHtml}
  `;

  attachMasterlistTaskEvents();

  document
    .getElementById("archiveAllCompletedBtn")
    ?.addEventListener(
      "click",
      archiveAllCompletedTasks
    );
}

function renderMasterlistTaskCard(task) {
  const categories =
    Array.isArray(task.categories) &&
    task.categories.length > 0
      ? task.categories
      : ["misc"];

  return `
    <div
      class="masterlist-task ${
        task.completed ? "completed" : ""
      }"
    >

      <label class="masterlist-task-main">

        <input
          class="masterlist-checkbox"
          type="checkbox"
          data-task-id="${task.id}"
          ${task.completed ? "checked" : ""}
        >

        <div class="masterlist-task-content">

          <div class="masterlist-task-text">
            ${escapeMasterlistHtml(task.text)}
          </div>

          <div class="task-category-list">

            ${categories
              .map(category => `
                <span class="task-category">
                  ${escapeMasterlistHtml(
                    getCategoryLabel(category)
                  )}
                </span>
              `)
              .join("")}

          </div>

          ${
            task.dueDate
              ? `
                <div class="task-deadline">
                  ⏰ ${formatDueDate(task.dueDate)}
                </div>
              `
              : ""
          }

        </div>

      </label>

      ${
        task.completed
          ? `
            <button
              class="archive-task-btn"
              type="button"
              data-archive-task-id="${task.id}"
            >
              Archive
            </button>
          `
          : ""
      }

    </div>
  `;
}

function attachMasterlistTaskEvents() {
  document
    .querySelectorAll(".masterlist-checkbox")
    .forEach(checkbox => {
      checkbox.addEventListener("change", event => {
        const taskId = Number(
          event.currentTarget.dataset.taskId
        );

        toggleMasterlistTask(taskId);
      });
    });

  document
    .querySelectorAll("[data-archive-task-id]")
    .forEach(button => {
      button.addEventListener("click", event => {
        const taskId = Number(
          event.currentTarget.dataset.archiveTaskId
        );

        archiveMasterlistTask(taskId);
      });
    });
}

// ----- Completion and archive actions -----

function toggleMasterlistTask(taskId) {
  const tasks = getMasterlistTasks();

  const updatedTasks = tasks.map(task => {
    if (task.id !== taskId) {
      return task;
    }

    const completed = !task.completed;

    return {
      ...task,
      completed,
      completedAt: completed
        ? new Date().toISOString()
        : null
    };
  });

  saveMasterlistTasks(updatedTasks);

  if (
    updatedTasks.find(task => task.id === taskId)
      ?.completed
  ) {
    const todayTaskIds =
      typeof getTodayTaskIds === "function"
        ? getTodayTaskIds()
        : JSON.parse(
            localStorage.getItem("todayTaskIds") || "[]"
          );

    const updatedTodayIds = todayTaskIds.filter(
      id => id !== taskId
    );

    localStorage.setItem(
      "todayTaskIds",
      JSON.stringify(updatedTodayIds)
    );
  }

  renderMasterlistTasks();

  if (typeof renderTodayPage === "function") {
    renderTodayPage();
  }
}

function archiveMasterlistTask(taskId) {
  const tasks = getMasterlistTasks();

  const updatedTasks = tasks.map(task => {
    if (task.id !== taskId) {
      return task;
    }

    return {
      ...task,
      archived: true,
      archivedAt: new Date().toISOString()
    };
  });

  saveMasterlistTasks(updatedTasks);
  renderMasterlistTasks();
}

function archiveAllCompletedTasks() {
  const tasks = getMasterlistTasks();
  const archivedAt = new Date().toISOString();

  const updatedTasks = tasks.map(task => {
    const belongsToCurrentFilter =
      activeMasterlistFilter === "all" ||
      task.categories?.includes(activeMasterlistFilter);

    if (
      task.completed &&
      !task.archived &&
      belongsToCurrentFilter
    ) {
      return {
        ...task,
        archived: true,
        archivedAt
      };
    }

    return task;
  });

  saveMasterlistTasks(updatedTasks);
  renderMasterlistTasks();
}

// ----- Archived tasks -----

function renderArchivedMasterlistTasks(
  taskContainer,
  archivedTasks
) {
  if (archivedTasks.length === 0) {
    taskContainer.innerHTML = `
      <section class="archived-tasks-section">

        <h3>Archive</h3>

        <p class="empty-state">
          No archived tasks in this view.
        </p>

      </section>
    `;

    return;
  }

  const sortedTasks = [...archivedTasks].sort(
    (taskA, taskB) => {
      return new Date(
        taskB.archivedAt || taskB.completedAt
      ) - new Date(
        taskA.archivedAt || taskA.completedAt
      );
    }
  );

  taskContainer.innerHTML = `
    <section class="archived-tasks-section">

      <h3>Archived Tasks</h3>

      ${sortedTasks
        .map(task => `
          <div class="archived-task-card">

            <div>

              <div class="masterlist-task-text">
                ${escapeMasterlistHtml(task.text)}
              </div>

              <div class="task-category-list">

                ${(task.categories || ["misc"])
                  .map(category => `
                    <span class="task-category">
                      ${escapeMasterlistHtml(
                        getCategoryLabel(category)
                      )}
                    </span>
                  `)
                  .join("")}

              </div>

            </div>

            <button
              class="restore-task-btn"
              type="button"
              data-restore-task-id="${task.id}"
            >
              Restore
            </button>

          </div>
        `)
        .join("")}

    </section>
  `;

  document
    .querySelectorAll("[data-restore-task-id]")
    .forEach(button => {
      button.addEventListener("click", event => {
        const taskId = Number(
          event.currentTarget.dataset.restoreTaskId
        );

        restoreMasterlistTask(taskId);
      });
    });
}

function restoreMasterlistTask(taskId) {
  const tasks = getMasterlistTasks();

  const updatedTasks = tasks.map(task => {
    if (task.id !== taskId) {
      return task;
    }

    return {
      ...task,
      archived: false,
      archivedAt: null
    };
  });

  saveMasterlistTasks(updatedTasks);
  renderMasterlistTasks();
}

// ----- Start -----

renderMasterlistPage();