const journalPage = document.getElementById("journalPage");

const DAILY_NOTES_STORAGE_KEY = "dailyJournalNotes";

function getJournalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatJournalDate(dateString) {
  const date = new Date(`${dateString}T12:00:00`);

  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

function getDailyJournalNotes() {
  try {
    return JSON.parse(
      localStorage.getItem(DAILY_NOTES_STORAGE_KEY) || "{}"
    );
  } catch (error) {
    console.error("Could not load daily journal notes:", error);
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

function saveDailyJournalNote(dateString, text) {
  const notes = getDailyJournalNotes();
  const existingNote = notes[dateString];

  notes[dateString] = {
    date: dateString,
    text,
    createdAt:
      existingNote?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  saveDailyJournalNotes(notes);
}

function renderJournalLandingPage() {
  const todayString = getJournalDateString();
  const todayNote = getDailyJournalNote(todayString);
  const hasTodayNote = todayNote.text.trim().length > 0;

  journalPage.innerHTML = `
    <section class="journal-page">

      <header class="journal-page-header">
        <h2>📖 Journal</h2>

        <p>
          Write about today or create a separate entry
          for one of your notebooks.
        </p>
      </header>

      <div class="journal-choice-grid">

        <button
          id="openDailyNoteBtn"
          class="journal-choice-card"
          type="button"
        >
          <span class="journal-choice-icon">☀️</span>

          <span class="journal-choice-title">
            Today's Daily Note
          </span>

          <span class="journal-choice-description">
            ${
              hasTodayNote
                ? "Continue writing today's running note."
                : "Start today's running note."
            }
          </span>

          <span class="journal-choice-status">
            ${hasTodayNote ? "In progress" : "Not started"}
          </span>
        </button>

        <button
          id="newJournalEntryBtn"
          class="journal-choice-card"
          type="button"
        >
          <span class="journal-choice-icon">✨</span>

          <span class="journal-choice-title">
            New Journal Entry
          </span>

          <span class="journal-choice-description">
            Write a separate entry and store it in a notebook.
          </span>

          <span class="journal-choice-status">
            Notebooks coming next
          </span>
        </button>

      </div>

      <section class="journal-preview-card">

        <div class="journal-preview-header">
          <h3>Today's Note</h3>

          <span>
            ${formatJournalDate(todayString)}
          </span>
        </div>

        ${
          hasTodayNote
            ? `
              <p class="journal-preview-text">
                ${escapeJournalHtml(todayNote.text)}
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
                You have not written anything today yet.
              </p>
            `
        }

      </section>

    </section>
  `;

  document
    .getElementById("openDailyNoteBtn")
    .addEventListener("click", () => {
      renderDailyNoteEditor(todayString);
    });

  document
    .getElementById("newJournalEntryBtn")
    .addEventListener("click", () => {
      renderNewEntryPreview();
    });

  document
    .getElementById("continueDailyNoteBtn")
    ?.addEventListener("click", () => {
      renderDailyNoteEditor(todayString);
    });
}

function renderDailyNoteEditor(dateString) {
  const note = getDailyJournalNote(dateString);

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
            ${formatJournalDate(dateString)}
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
        >${escapeJournalHtml(note.text)}</textarea>

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

  const textarea = document.getElementById("dailyNoteText");
  const saveMessage = document.getElementById(
    "dailyNoteSaveMessage"
  );

  document
    .getElementById("dailyNoteBackBtn")
    .addEventListener("click", renderJournalLandingPage);

  document
    .getElementById("saveDailyNoteBtn")
    .addEventListener("click", () => {
      saveDailyJournalNote(
        dateString,
        textarea.value.trim()
      );

      saveMessage.textContent = "Saved ✓";

      setTimeout(() => {
        saveMessage.textContent = "";
      }, 1500);
    });

  document
    .querySelectorAll("[data-prompt]")
    .forEach(button => {
      button.addEventListener("click", event => {
        const prompt = event.currentTarget.dataset.prompt;
        const currentText = textarea.value.trim();

        textarea.value = currentText
          ? `${currentText}\n\n${prompt}\n`
          : `${prompt}\n`;

        textarea.focus();
        textarea.setSelectionRange(
          textarea.value.length,
          textarea.value.length
        );
      });
    });
}

function renderNewEntryPreview() {
  journalPage.innerHTML = `
    <section class="journal-page">

      <header class="journal-editor-header">

        <button
          id="newEntryBackBtn"
          class="journal-back-btn"
          type="button"
        >
          ← Back
        </button>

        <div>
          <h2>✨ New Journal Entry</h2>

          <p>
            Separate entries and notebooks are our next layer.
          </p>
        </div>

      </header>

      <section class="journal-coming-soon-card">

        <div class="journal-coming-soon-icon">📚</div>

        <h3>Notebook Entries</h3>

        <p>
          Soon, you will be able to give an entry a title,
          choose a notebook, add tags, and save it separately
          from your Daily Note.
        </p>

      </section>

    </section>
  `;

  document
    .getElementById("newEntryBackBtn")
    .addEventListener("click", renderJournalLandingPage);
}

function escapeJournalHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

renderJournalLandingPage();