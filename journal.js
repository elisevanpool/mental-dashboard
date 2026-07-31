// =====================
// Journal
// =====================

const journalPage =
  document.getElementById("journalPage");

const DAILY_NOTES_STORAGE_KEY =
  "dailyJournalNotes";

const JOURNAL_ENTRIES_STORAGE_KEY =
  "journalEntries";

const JOURNAL_NOTEBOOKS_STORAGE_KEY =
  "journalNotebooks";

const defaultJournalNotebooks = [
  {
    id: "inbox",
    name: "Inbox",
    icon: "📥",
    builtIn: true
  }
];

let editingJournalEntryId = null;

// =========================================================
// GENERAL HELPERS
// =========================================================

function getJournalDateString(
  date = new Date()
) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatJournalDate(dateString) {
  const date = new Date(
    `${dateString}T12:00:00`
  );

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

function formatJournalTimestamp(timestamp) {
  const date = new Date(timestamp);

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year:
      date.getFullYear() !==
      new Date().getFullYear()
        ? "numeric"
        : undefined,
    hour: "numeric",
    minute: "2-digit"
  });
}

function escapeJournalHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function createJournalId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}`;
}

// =========================================================
// DAILY NOTES
// =========================================================

function getDailyJournalNotes() {
  try {
    return JSON.parse(
      localStorage.getItem(
        DAILY_NOTES_STORAGE_KEY
      ) || "{}"
    );
  } catch (error) {
    console.error(
      "Could not load daily journal notes:",
      error
    );

    return {};
  }
}

function saveDailyJournalNotes(notes) {
  localStorage.setItem(
    DAILY_NOTES_STORAGE_KEY,
    JSON.stringify(notes)
  );
}

function getDailyJournalNote(dateString) {
  const notes = getDailyJournalNotes();

  return notes[dateString] || {
    date: dateString,
    text: "",
    createdAt: null,
    updatedAt: null
  };
}

function saveDailyJournalNote(
  dateString,
  text
) {
  const notes = getDailyJournalNotes();
  const existingNote = notes[dateString];

  notes[dateString] = {
    date: dateString,
    text,
    createdAt:
      existingNote?.createdAt ||
      new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  saveDailyJournalNotes(notes);
}

// =========================================================
// NOTEBOOKS
// =========================================================

function getCustomJournalNotebooks() {
  try {
    return JSON.parse(
      localStorage.getItem(
        JOURNAL_NOTEBOOKS_STORAGE_KEY
      ) || "[]"
    );
  } catch (error) {
    console.error(
      "Could not load journal notebooks:",
      error
    );

    return [];
  }
}

function saveCustomJournalNotebooks(
  notebooks
) {
  localStorage.setItem(
    JOURNAL_NOTEBOOKS_STORAGE_KEY,
    JSON.stringify(notebooks)
  );
}

function getAllJournalNotebooks() {
  return [
    ...defaultJournalNotebooks,
    ...getCustomJournalNotebooks()
  ];
}

function getJournalNotebook(
  notebookId
) {
  return (
    getAllJournalNotebooks().find(
      notebook =>
        notebook.id === notebookId
    ) || defaultJournalNotebooks[0]
  );
}

function journalNotebookExists(name) {
  return getAllJournalNotebooks().some(
    notebook =>
      notebook.name
        .trim()
        .toLowerCase() ===
      name.trim().toLowerCase()
  );
}

function createJournalNotebook(
  name,
  icon
) {
  const cleanName =
    String(name || "").trim();

  const cleanIcon =
    String(icon || "").trim() || "📓";

  if (!cleanName) {
    return {
      success: false,
      message:
        "Please enter a notebook name."
    };
  }

  if (journalNotebookExists(cleanName)) {
    return {
      success: false,
      message:
        "That notebook already exists."
    };
  }

  const notebooks =
    getCustomJournalNotebooks();

  const notebook = {
    id: createJournalId("notebook"),
    name: cleanName,
    icon: cleanIcon,
    builtIn: false,
    createdAt: new Date().toISOString()
  };

  notebooks.push(notebook);
  saveCustomJournalNotebooks(notebooks);

  return {
    success: true,
    message: "Notebook created ✓",
    notebook
  };
}

// =========================================================
// STANDALONE JOURNAL ENTRIES
// =========================================================

function getJournalEntries() {
  try {
    const entries = JSON.parse(
      localStorage.getItem(
        JOURNAL_ENTRIES_STORAGE_KEY
      ) || "[]"
    );

    return [...entries].sort(
      (entryA, entryB) =>
        new Date(entryB.updatedAt) -
        new Date(entryA.updatedAt)
    );
  } catch (error) {
    console.error(
      "Could not load journal entries:",
      error
    );

    return [];
  }
}

function saveJournalEntries(entries) {
  localStorage.setItem(
    JOURNAL_ENTRIES_STORAGE_KEY,
    JSON.stringify(entries)
  );
}

function getJournalEntry(entryId) {
  return getJournalEntries().find(
    entry => entry.id === entryId
  );
}

function saveStandaloneJournalEntry({
  entryId,
  title,
  text,
  notebookId,
  tags
}) {
  const cleanTitle =
    String(title || "").trim();

  const cleanText =
    String(text || "").trim();

  const cleanTags = Array.from(
    new Set(
      String(tags || "")
        .split(",")
        .map(tag => tag.trim())
        .filter(Boolean)
    )
  );

  if (!cleanText) {
    return {
      success: false,
      message:
        "Please write something before saving."
    };
  }

  const entries = getJournalEntries();
  const timestamp = new Date().toISOString();

  if (entryId) {
    const updatedEntries = entries.map(
      entry => {
        if (entry.id !== entryId) {
          return entry;
        }

        return {
          ...entry,
          title: cleanTitle,
          text: cleanText,
          notebookId:
            notebookId || "inbox",
          tags: cleanTags,
          updatedAt: timestamp
        };
      }
    );

    saveJournalEntries(updatedEntries);

    return {
      success: true,
      message: "Entry updated ✓"
    };
  }

  entries.push({
    id: createJournalId("entry"),
    title: cleanTitle,
    text: cleanText,
    notebookId:
      notebookId || "inbox",
    tags: cleanTags,
    createdAt: timestamp,
    updatedAt: timestamp
  });

  saveJournalEntries(entries);

  return {
    success: true,
    message: "Entry saved ✓"
  };
}

function deleteStandaloneJournalEntry(
  entryId
) {
  const entries = getJournalEntries();

  saveJournalEntries(
    entries.filter(
      entry => entry.id !== entryId
    )
  );
}

// =========================================================
// JOURNAL LANDING PAGE
// =========================================================

function renderJournalLandingPage() {
  editingJournalEntryId = null;

  const todayString =
    getJournalDateString();

  const todayNote =
    getDailyJournalNote(todayString);

  const hasTodayNote =
    todayNote.text.trim().length > 0;

  const notebooks =
    getAllJournalNotebooks();

  const entries =
    getJournalEntries();

  const recentEntries =
    entries.slice(0, 5);

  journalPage.innerHTML = `
    <section class="journal-page">

      <header class="journal-page-header">

        <h2>📖 Journal</h2>

        <p>
          Write in today’s note or create
          an entry for one of your notebooks.
        </p>

      </header>

      <div class="journal-choice-grid">

        <button
          id="openDailyNoteBtn"
          class="journal-choice-card"
          type="button"
        >

          <span class="journal-choice-icon">
            ☀️
          </span>

          <span class="journal-choice-title">
            Today’s Daily Note
          </span>

          <span class="journal-choice-description">
            ${
              hasTodayNote
                ? "Continue today’s running note."
                : "Start today’s running note."
            }
          </span>

          <span class="journal-choice-status">
            ${
              hasTodayNote
                ? "In progress"
                : "Not started"
            }
          </span>

        </button>

        <button
          id="newJournalEntryBtn"
          class="journal-choice-card"
          type="button"
        >

          <span class="journal-choice-icon">
            ✨
          </span>

          <span class="journal-choice-title">
            New Journal Entry
          </span>

          <span class="journal-choice-description">
            Create a separate entry and
            choose where it belongs.
          </span>

          <span class="journal-choice-status">
            ${entries.length}
            ${
              entries.length === 1
                ? "saved entry"
                : "saved entries"
            }
          </span>

        </button>

      </div>

      <section class="journal-notebooks-section">

        <div class="journal-section-header">

          <h3>Notebooks</h3>

          <button
            id="createNotebookBtn"
            class="journal-small-btn"
            type="button"
          >
            ＋ New
          </button>

        </div>

        <div
          id="notebookCreatorPanel"
          class="notebook-creator-panel hidden"
        ></div>

        <div class="journal-notebook-grid">

          ${notebooks
            .map(notebook => {
              const entryCount =
                entries.filter(
                  entry =>
                    entry.notebookId ===
                    notebook.id
                ).length;

              return `
                <button
                  class="journal-notebook-card"
                  type="button"
                  data-open-notebook="${notebook.id}"
                >

                  <span class="journal-notebook-icon">
                    ${escapeJournalHtml(
                      notebook.icon
                    )}
                  </span>

                  <span class="journal-notebook-name">
                    ${escapeJournalHtml(
                      notebook.name
                    )}
                  </span>

                  <span class="journal-notebook-count">
                    ${entryCount}
                    ${
                      entryCount === 1
                        ? "entry"
                        : "entries"
                    }
                  </span>

                </button>
              `;
            })
            .join("")}

        </div>

      </section>

      <section class="journal-recent-section">

        <div class="journal-section-header">
          <h3>Recent Entries</h3>
        </div>

        ${
          recentEntries.length === 0
            ? `
              <p class="empty-state">
                Your standalone journal
                entries will appear here.
              </p>
            `
            : `
              <div class="journal-entry-list">
                ${recentEntries
                  .map(
                    renderJournalEntryPreview
                  )
                  .join("")}
              </div>
            `
        }

      </section>

      <section class="journal-preview-card">

        <div class="journal-preview-header">

          <h3>Today’s Note</h3>

          <span>
            ${formatJournalDate(
              todayString
            )}
          </span>

        </div>

        ${
          hasTodayNote
            ? `
              <p class="journal-preview-text">
                ${escapeJournalHtml(
                  todayNote.text
                )}
              </p>

              <button
                id="continueDailyNoteBtn"
                class="journal-secondary-btn"
                type="button"
              >
                Continue Writing
              </button>
            `
            : `
              <p class="empty-state">
                You have not written
                anything today yet.
              </p>
            `
        }

      </section>

    </section>
  `;

  document
    .getElementById("openDailyNoteBtn")
    ?.addEventListener("click", () => {
      renderDailyNoteEditor(
        todayString
      );
    });

  document
    .getElementById("newJournalEntryBtn")
    ?.addEventListener(
      "click",
      () => renderJournalEntryEditor()
    );

  document
    .getElementById(
      "continueDailyNoteBtn"
    )
    ?.addEventListener("click", () => {
      renderDailyNoteEditor(
        todayString
      );
    });

  document
    .getElementById("createNotebookBtn")
    ?.addEventListener(
      "click",
      toggleNotebookCreator
    );

  document
    .querySelectorAll(
      "[data-open-notebook]"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        event => {
          renderNotebookPage(
            event.currentTarget.dataset
              .openNotebook
          );
        }
      );
    });

  attachJournalEntryPreviewEvents();
}

function renderJournalEntryPreview(entry) {
  const notebook = getJournalNotebook(
    entry.notebookId
  );

  return `
    <article
      class="journal-entry-preview"
      data-open-journal-entry="${entry.id}"
    >

      <div class="journal-entry-preview-header">

        <div>

          <div class="journal-entry-notebook">
            ${escapeJournalHtml(
              notebook.icon
            )}
            ${escapeJournalHtml(
              notebook.name
            )}
          </div>

          <h4>
            ${
              entry.title
                ? escapeJournalHtml(
                    entry.title
                  )
                : "Untitled entry"
            }
          </h4>

        </div>

        <span>
          ${formatJournalTimestamp(
            entry.updatedAt
          )}
        </span>

      </div>

      <p>
        ${escapeJournalHtml(
          entry.text
        )}
      </p>

      ${
        entry.tags?.length
          ? `
            <div class="journal-tag-list">

              ${entry.tags
                .map(
                  tag => `
                    <span class="journal-tag">
                      #${escapeJournalHtml(tag)}
                    </span>
                  `
                )
                .join("")}

            </div>
          `
          : ""
      }

    </article>
  `;
}

function attachJournalEntryPreviewEvents() {
  document
    .querySelectorAll(
      "[data-open-journal-entry]"
    )
    .forEach(card => {
      card.addEventListener(
        "click",
        event => {
          renderJournalEntryViewer(
            event.currentTarget.dataset
              .openJournalEntry
          );
        }
      );
    });
}

// =========================================================
// NOTEBOOK CREATOR
// =========================================================

function toggleNotebookCreator() {
  const panel = document.getElementById(
    "notebookCreatorPanel"
  );

  if (!panel) return;

  if (!panel.classList.contains("hidden")) {
    panel.classList.add("hidden");
    panel.innerHTML = "";
    return;
  }

  panel.innerHTML = `
    <div class="notebook-creator-fields">

      <input
        id="newNotebookIcon"
        type="text"
        maxlength="4"
        placeholder="📓"
        aria-label="Notebook icon"
      >

      <input
        id="newNotebookName"
        type="text"
        maxlength="40"
        placeholder="Notebook name"
      >

      <button
        id="saveNotebookBtn"
        type="button"
      >
        Add
      </button>

    </div>

    <p
      id="notebookCreatorMessage"
      class="journal-form-message"
    ></p>
  `;

  panel.classList.remove("hidden");

  document
    .getElementById("saveNotebookBtn")
    ?.addEventListener(
      "click",
      saveNotebookFromCreator
    );

  document
    .getElementById("newNotebookName")
    ?.focus();
}

function saveNotebookFromCreator() {
  const icon =
    document
      .getElementById("newNotebookIcon")
      ?.value.trim() || "📓";

  const name =
    document
      .getElementById("newNotebookName")
      ?.value.trim() || "";

  const message =
    document.getElementById(
      "notebookCreatorMessage"
    );

  const result =
    createJournalNotebook(
      name,
      icon
    );

  if (message) {
    message.textContent =
      result.message;

    message.classList.toggle(
      "error",
      !result.success
    );
  }

  if (result.success) {
    renderJournalLandingPage();
  }
}

// =========================================================
// DAILY NOTE EDITOR
// =========================================================

function renderDailyNoteEditor(
  dateString
) {
  const note =
    getDailyJournalNote(dateString);

  journalPage.innerHTML = `
    <section class="journal-page">

      <header class="journal-editor-header">

        <button
          id="dailyNoteBackBtn"
          class="journal-back-btn"
          type="button"
        >
          ← Back
        </button>

        <div>

          <h2>☀️ Daily Note</h2>

          <p>
            ${formatJournalDate(
              dateString
            )}
          </p>

        </div>

      </header>

      <section class="daily-note-card">

        <label for="dailyNoteText">
          What happened today?
        </label>

        <textarea
          id="dailyNoteText"
          class="daily-note-textarea"
          placeholder="Write as much or as little as you want..."
        >${escapeJournalHtml(
          note.text
        )}</textarea>

        <div class="daily-note-actions">

          <span
            id="dailyNoteSaveMessage"
            class="daily-note-save-message"
          ></span>

          <button
            id="saveDailyNoteBtn"
            class="journal-primary-btn"
            type="button"
          >
            Save Daily Note
          </button>

        </div>

      </section>

      <section class="journal-prompts-card">

        <h3>Reflection Prompts</h3>

        <button
          class="journal-prompt-btn"
          type="button"
          data-prompt="What felt hardest today?"
        >
          What felt hardest today?
        </button>

        <button
          class="journal-prompt-btn"
          type="button"
          data-prompt="What helped today?"
        >
          What helped today?
        </button>

        <button
          class="journal-prompt-btn"
          type="button"
          data-prompt="What do I want to remember about today?"
        >
          What do I want to remember?
        </button>

      </section>

    </section>
  `;

  const textarea =
    document.getElementById(
      "dailyNoteText"
    );

  const saveMessage =
    document.getElementById(
      "dailyNoteSaveMessage"
    );

  document
    .getElementById("dailyNoteBackBtn")
    ?.addEventListener(
      "click",
      renderJournalLandingPage
    );

  document
    .getElementById("saveDailyNoteBtn")
    ?.addEventListener("click", () => {
      saveDailyJournalNote(
        dateString,
        textarea.value.trim()
      );

      saveMessage.textContent =
        "Saved ✓";

      setTimeout(() => {
        saveMessage.textContent = "";
      }, 1500);

      if (
        typeof renderCalendar ===
        "function"
      ) {
        renderCalendar();
      }
    });

  document
    .querySelectorAll("[data-prompt]")
    .forEach(button => {
      button.addEventListener(
        "click",
        event => {
          const prompt =
            event.currentTarget.dataset
              .prompt;

          const currentText =
            textarea.value.trim();

          textarea.value =
            currentText
              ? `${currentText}\n\n${prompt}\n`
              : `${prompt}\n`;

          textarea.focus();

          textarea.setSelectionRange(
            textarea.value.length,
            textarea.value.length
          );
        }
      );
    });
}

// =========================================================
// STANDALONE ENTRY EDITOR
// =========================================================

function renderJournalEntryEditor(
  entryId = null,
  preferredNotebookId = "inbox"
) {
  editingJournalEntryId = entryId;

  const existingEntry =
    entryId
      ? getJournalEntry(entryId)
      : null;

  const notebooks =
    getAllJournalNotebooks();

  const selectedNotebookId =
    existingEntry?.notebookId ||
    preferredNotebookId ||
    "inbox";

  journalPage.innerHTML = `
    <section class="journal-page">

      <header class="journal-editor-header">

        <button
          id="journalEntryEditorBackBtn"
          class="journal-back-btn"
          type="button"
        >
          ← Back
        </button>

        <div>

          <h2>
            ${
              existingEntry
                ? "✏️ Edit Entry"
                : "✨ New Journal Entry"
            }
          </h2>

          <p>
            Save it separately from your
            Daily Note.
          </p>

        </div>

      </header>

      <section class="journal-entry-editor-card">

        <label class="journal-editor-field">

          <span>Title (optional)</span>

          <input
            id="standaloneJournalTitle"
            type="text"
            maxlength="100"
            placeholder="Optional title"
            value="${escapeJournalHtml(
              existingEntry?.title || ""
            )}"
          >

        </label>

        <label class="journal-editor-field">

          <span>Notebook</span>

          <select
            id="standaloneJournalNotebook"
          >

            ${notebooks
              .map(notebook => `
                <option
                  value="${notebook.id}"
                  ${
                    notebook.id ===
                    selectedNotebookId
                      ? "selected"
                      : ""
                  }
                >
                  ${escapeJournalHtml(
                    notebook.icon
                  )}
                  ${escapeJournalHtml(
                    notebook.name
                  )}
                </option>
              `)
              .join("")}

          </select>

        </label>

        <label class="journal-editor-field">

          <span>Entry</span>

          <textarea
            id="standaloneJournalText"
            placeholder="Write your entry..."
          >${escapeJournalHtml(
            existingEntry?.text || ""
          )}</textarea>

        </label>

        <label class="journal-editor-field">

          <span>
            Tags
            <small>
              Separate with commas
            </small>
          </span>

          <input
            id="standaloneJournalTags"
            type="text"
            placeholder="work, thoughts, sleep"
            value="${escapeJournalHtml(
              existingEntry?.tags?.join(
                ", "
              ) || ""
            )}"
          >

        </label>

        <p
          id="journalEntryEditorMessage"
          class="journal-form-message"
        ></p>

        <button
          id="saveStandaloneJournalBtn"
          class="journal-primary-btn"
          type="button"
        >
          ${
            existingEntry
              ? "Update Entry"
              : "Save Entry"
          }
        </button>

      </section>

    </section>
  `;

  document
    .getElementById(
      "journalEntryEditorBackBtn"
    )
    ?.addEventListener(
      "click",
      renderJournalLandingPage
    );

  document
    .getElementById(
      "saveStandaloneJournalBtn"
    )
    ?.addEventListener(
      "click",
      saveJournalEntryFromEditor
    );
}

function saveJournalEntryFromEditor() {
  const message =
    document.getElementById(
      "journalEntryEditorMessage"
    );

  const result =
    saveStandaloneJournalEntry({
      entryId:
        editingJournalEntryId,

      title:
        document
          .getElementById(
            "standaloneJournalTitle"
          )
          ?.value,

      notebookId:
        document
          .getElementById(
            "standaloneJournalNotebook"
          )
          ?.value,

      text:
        document
          .getElementById(
            "standaloneJournalText"
          )
          ?.value,

      tags:
        document
          .getElementById(
            "standaloneJournalTags"
          )
          ?.value
    });

  if (message) {
    message.textContent =
      result.message;

    message.classList.toggle(
      "error",
      !result.success
    );
  }

  if (result.success) {
    setTimeout(
      renderJournalLandingPage,
      350
    );
  }
}

// =========================================================
// ENTRY VIEWER
// =========================================================

function renderJournalEntryViewer(
  entryId
) {
  const entry =
    getJournalEntry(entryId);

  if (!entry) {
    renderJournalLandingPage();
    return;
  }

  const notebook =
    getJournalNotebook(
      entry.notebookId
    );

  journalPage.innerHTML = `
    <section class="journal-page">

      <header class="journal-editor-header">

        <button
          id="journalViewerBackBtn"
          class="journal-back-btn"
          type="button"
        >
          ← Back
        </button>

        <div>

          <h2>
            ${
              entry.title
                ? escapeJournalHtml(
                    entry.title
                  )
                : "Journal Entry"
            }
          </h2>

          <p>
            ${escapeJournalHtml(
              notebook.icon
            )}
            ${escapeJournalHtml(
              notebook.name
            )}
          </p>

        </div>

      </header>

      <article class="journal-entry-view-card">

        <div class="journal-entry-view-date">
          ${formatJournalTimestamp(
            entry.createdAt
          )}
        </div>

        <p class="journal-entry-view-text">
          ${escapeJournalHtml(
            entry.text
          )}
        </p>

        ${
          entry.tags?.length
            ? `
              <div class="journal-tag-list">

                ${entry.tags
                  .map(
                    tag => `
                      <span class="journal-tag">
                        #${escapeJournalHtml(
                          tag
                        )}
                      </span>
                    `
                  )
                  .join("")}

              </div>
            `
            : ""
        }

        <div class="journal-entry-actions">

          <button
            id="editJournalEntryBtn"
            class="journal-secondary-btn"
            type="button"
          >
            Edit
          </button>

          <button
            id="deleteJournalEntryBtn"
            class="journal-danger-btn"
            type="button"
          >
            Delete
          </button>

        </div>

      </article>

    </section>
  `;

  document
    .getElementById(
      "journalViewerBackBtn"
    )
    ?.addEventListener(
      "click",
      renderJournalLandingPage
    );

  document
    .getElementById(
      "editJournalEntryBtn"
    )
    ?.addEventListener("click", () => {
      renderJournalEntryEditor(
        entry.id
      );
    });

  document
    .getElementById(
      "deleteJournalEntryBtn"
    )
    ?.addEventListener("click", () => {
      const shouldDelete =
        window.confirm(
          "Delete this journal entry?"
        );

      if (!shouldDelete) return;

      deleteStandaloneJournalEntry(
        entry.id
      );

      renderJournalLandingPage();
    });
}

// =========================================================
// NOTEBOOK PAGE
// =========================================================

function renderNotebookPage(notebookId) {
  const notebook =
    getJournalNotebook(notebookId);

  const entries = getJournalEntries().filter(
    entry =>
      entry.notebookId === notebook.id
  );

  journalPage.innerHTML = `
    <section class="journal-page">

      <header class="journal-editor-header">

        <button
          id="notebookBackBtn"
          class="journal-back-btn"
          type="button"
        >
          ← Back
        </button>

        <div>

          <h2>
            ${escapeJournalHtml(
              notebook.icon
            )}
            ${escapeJournalHtml(
              notebook.name
            )}
          </h2>

          <p>
            ${entries.length}
            ${
              entries.length === 1
                ? "entry"
                : "entries"
            }
          </p>

        </div>

      </header>

      <button
        id="newNotebookEntryBtn"
        class="journal-primary-btn journal-full-btn"
        type="button"
      >
        ＋ New Entry
      </button>

      ${
        entries.length === 0
          ? `
            <p class="empty-state">
              This notebook is empty.
            </p>
          `
          : `
            <div class="journal-entry-list journal-notebook-entry-list">

              ${entries
                .map(
                  renderJournalEntryPreview
                )
                .join("")}

            </div>
          `
      }

    </section>
  `;

  document
    .getElementById("notebookBackBtn")
    ?.addEventListener(
      "click",
      renderJournalLandingPage
    );

  document
    .getElementById(
      "newNotebookEntryBtn"
    )
    ?.addEventListener("click", () => {
      renderJournalEntryEditor(
        null,
        notebook.id
      );
    });

  attachJournalEntryPreviewEvents();
}

// ----- Start -----

renderJournalLandingPage();