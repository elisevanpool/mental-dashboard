const mainPages = [
  "todayPage",
  "masterlistPage",
  "journalPage",
  "calendarPage",
  "morePage"
];

function showMainPage(pageId) {
  mainPages.forEach(id => {
    document.getElementById(id).classList.add("hidden");
  });

  document.getElementById(pageId).classList.remove("hidden");

  document.querySelectorAll(".bottom-nav button").forEach(button => {
    button.classList.remove("active");
  });

  if (pageId === "todayPage") {
    renderTodayPage();
  }

  if (pageId === "masterlistPage") {
    renderMasterlistTasks();
  }
}

document.getElementById("todayTab").addEventListener("click", () => {
  showMainPage("todayPage");
  document.getElementById("todayTab").classList.add("active");
});

document.getElementById("masterlistTab").addEventListener("click", () => {
  showMainPage("masterlistPage");
  document.getElementById("masterlistTab").classList.add("active");
});

document.getElementById("journalTab").addEventListener("click", () => {
  showMainPage("journalPage");
  document.getElementById("journalTab").classList.add("active");
});

document.getElementById("calendarTab").addEventListener("click", () => {
  showMainPage("calendarPage");
  document.getElementById("calendarTab").classList.add("active");
});

document.getElementById("moreTab").addEventListener("click", () => {
  showMainPage("morePage");
  document.getElementById("moreTab").classList.add("active");
});

function getTodayTaskIds() {
  return JSON.parse(
    localStorage.getItem("todayTaskIds") || "[]"
  );
}

function saveTodayTaskIds(taskIds) {
  localStorage.setItem(
    "todayTaskIds",
    JSON.stringify(taskIds)
  );
}

function addTaskToToday(taskId) {
  const todayTaskIds = getTodayTaskIds();

  if (!todayTaskIds.includes(taskId)) {
    todayTaskIds.push(taskId);
  }

  saveTodayTaskIds(todayTaskIds);
  renderTodayPage();
}

function removeTaskFromToday(taskId) {
  const updatedIds = getTodayTaskIds().filter(
    id => id !== taskId
  );

  saveTodayTaskIds(updatedIds);
  renderTodayPage();
}

function completeTodayTask(taskId) {
  const tasks = getMasterlistTasks();

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

  saveMasterlistTasks(updatedTasks);

  removeTaskFromToday(taskId);

  if (typeof renderMasterlistTasks === "function") {
    renderMasterlistTasks();
  }
}

function getSuggestedTasks(tasks, todayTaskIds) {
  const today = getTodayString();

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

function renderTodayTaskCard(task) {
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
            ${task.categories
              .map(category => `
                <span class="task-category">
                  ${getCategoryLabel(category)}
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

function renderTodayPage() {
  const logPage = document.getElementById("logPage");

  let todaySection = document.getElementById(
    "todayTasksSection"
  );

  if (!todaySection) {
    todaySection = document.createElement("section");
    todaySection.id = "todayTasksSection";
    todaySection.className = "page-card";

    logPage.prepend(todaySection);
  }

  const tasks = getMasterlistTasks().filter(
    task => !task.archived
  );

  const todayTaskIds = getTodayTaskIds();

  const selectedTasks = tasks.filter(task => {
    return (
      todayTaskIds.includes(task.id) &&
      !task.completed
    );
  });

  const validTodayTaskIds = selectedTasks.map(
    task => task.id
  );

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
                ${getCategoryLabel(categoryId)}
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
          .map(task => `
            <div class="suggested-task">

              <div>
                <div class="suggested-task-text">
                  ${task.text}
                </div>

                ${
                  task.dueDate
                    ? `
                      <div class="task-deadline">
                        ⏰ ${formatDueDate(task.dueDate)}
                      </div>
                    `
                    : `
                      <div class="suggested-task-category">
                        ${task.categories
                          .map(getCategoryLabel)
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
          `)
          .join("");

  todaySection.innerHTML = `
    <div class="today-section-header">
      <h2>☀️ Today's Tasks</h2>

      <span>
        ${selectedTasks.length}
      </span>
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

showMainPage("todayPage");
document
  .getElementById("todayTab")
  .classList.add("active");