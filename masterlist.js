const masterlistPage = document.getElementById("masterlistPage");

const masterlistCategories = [
  { id: "body", label: "🚿 Body" },
  { id: "apartment", label: "🏠 Apartment" },
  { id: "administrative", label: "🖥️ Administrative" },
  { id: "phone", label: "📱 TBD on Phone" },
  { id: "errands", label: "🚗 Errands" },
  { id: "under-two", label: "⚡ Under 2 Minutes" },
  { id: "misc", label: "📦 Misc" }
];

masterlistPage.innerHTML = `
  <section class="page-card">
    <h2>✅ Masterlist</h2>

    <div class="task-form">

      <input
        id="newTaskInput"
        type="text"
        placeholder="Add a task..."
      >

      <div class="task-form-section">
        <div class="task-form-label">Categories</div>

        <div class="category-options">
          ${masterlistCategories
            .map(category => `
              <label class="category-option">
                <input
                  type="checkbox"
                  name="taskCategory"
                  value="${category.id}"
                >
                <span>${category.label}</span>
              </label>
            `)
            .join("")}
        </div>
      </div>

      <div class="task-form-section">
        <div class="task-form-label">Deadline</div>

        <div class="deadline-options">
          <button
            id="todayDeadlineBtn"
            type="button"
            class="deadline-choice"
          >
            Today
          </button>

          <input
            id="taskDueDate"
            type="date"
          >

          <button
            id="clearDeadlineBtn"
            type="button"
            class="deadline-choice secondary"
          >
            Clear
          </button>
        </div>
      </div>

      <div id="taskFormMessage" class="task-form-message"></div>

      <button id="addTaskBtn">
        Add Task
      </button>

    </div>

    <div id="masterlistTasks">
      <p class="empty-state">No tasks yet.</p>
    </div>
  </section>
`;

function getMasterlistTasks() {
  return JSON.parse(localStorage.getItem("masterlistTasks") || "[]");
}

function saveMasterlistTasks(tasks) {
  localStorage.setItem("masterlistTasks", JSON.stringify(tasks));
}

function getCategoryLabel(categoryId) {
  const category = masterlistCategories.find(
    item => item.id === categoryId
  );

  return category ? category.label : categoryId;
}

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

  const date = new Date(`${dueDate}T00:00:00`);

  return `Due ${date.toLocaleDateString()}`;
}

function sortMasterlistTasks(tasks) {
  return [...tasks].sort((taskA, taskB) => {
    if (taskA.completed !== taskB.completed) {
      return Number(taskA.completed) - Number(taskB.completed);
    }

    return Number(taskA.createdAt || taskA.id) -
      Number(taskB.createdAt || taskB.id);
  });
}

function renderMasterlistTasks() {
  const taskContainer = document.getElementById("masterlistTasks");

  const tasks = sortMasterlistTasks(
    getMasterlistTasks().filter(task => !task.archived)
  );

  if (tasks.length === 0) {
    taskContainer.innerHTML = `
      <p class="empty-state">No tasks yet.</p>
    `;
    return;
  }

  taskContainer.innerHTML = tasks
    .map(task => `
      <div class="masterlist-task ${task.completed ? "completed" : ""}">

        <label class="masterlist-task-main">

          <input
            class="masterlist-checkbox"
            type="checkbox"
            data-task-id="${task.id}"
            ${task.completed ? "checked" : ""}
          >

          <div class="masterlist-task-content">

            <div class="masterlist-task-text">
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

      </div>
    `)
    .join("");

  document
    .querySelectorAll(".masterlist-checkbox")
    .forEach(checkbox => {
      checkbox.addEventListener("change", event => {
        const taskId = Number(event.target.dataset.taskId);

        toggleMasterlistTask(taskId);
      });
    });
}

function getSelectedCategories() {
  return Array.from(
    document.querySelectorAll(
      'input[name="taskCategory"]:checked'
    )
  ).map(input => input.value);
}

function clearTaskForm() {
  document.getElementById("newTaskInput").value = "";
  document.getElementById("taskDueDate").value = "";

  document
    .querySelectorAll('input[name="taskCategory"]')
    .forEach(input => {
      input.checked = false;
    });

  document.getElementById("taskFormMessage").textContent = "";
}

function addMasterlistTask() {
  const taskInput = document.getElementById("newTaskInput");
  const taskText = taskInput.value.trim();
  const selectedCategories = getSelectedCategories();
  const dueDate = document.getElementById("taskDueDate").value;
  const message = document.getElementById("taskFormMessage");

  message.textContent = "";

  if (!taskText) {
    message.textContent = "Please enter a task.";
    return;
  }

  if (selectedCategories.length === 0) {
    message.textContent = "Please choose at least one category.";
    return;
  }

  const tasks = getMasterlistTasks();

  tasks.push({
    id: Date.now(),
    text: taskText,
    completed: false,
    archived: false,
    categories: selectedCategories,
    dueDate: dueDate || null,
    createdAt: new Date().toISOString(),
    completedAt: null
  });

  saveMasterlistTasks(tasks);
  clearTaskForm();
  renderMasterlistTasks();
}

function toggleMasterlistTask(taskId) {
  const tasks = getMasterlistTasks();

  const updatedTasks = tasks.map(task => {
    if (task.id !== taskId) {
      return task;
    }

    const isNowCompleted = !task.completed;

    return {
      ...task,
      completed: isNowCompleted,
      completedAt: isNowCompleted
        ? new Date().toISOString()
        : null
    };
  });

  saveMasterlistTasks(updatedTasks);
  renderMasterlistTasks();
}

document
  .getElementById("todayDeadlineBtn")
  .addEventListener("click", () => {
    document.getElementById("taskDueDate").value =
      getTodayString();
  });

document
  .getElementById("clearDeadlineBtn")
  .addEventListener("click", () => {
    document.getElementById("taskDueDate").value = "";
  });

document
  .getElementById("addTaskBtn")
  .addEventListener("click", addMasterlistTask);

document
  .getElementById("newTaskInput")
  .addEventListener("keydown", event => {
    if (event.key === "Enter") {
      addMasterlistTask();
    }
  });

renderMasterlistTasks();