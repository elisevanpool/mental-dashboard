const calendarPage = document.getElementById("calendarPage");

let calendarDate = new Date();

calendarPage.innerHTML = `
  <section class="page-card calendar-card">

    <div class="calendar-header">
      <button id="previousMonthBtn" type="button">
        ←
      </button>

      <h2 id="calendarMonthTitle"></h2>

      <button id="nextMonthBtn" type="button">
        →
      </button>
    </div>

    <div class="calendar-weekdays">
      <span>Sun</span>
      <span>Mon</span>
      <span>Tue</span>
      <span>Wed</span>
      <span>Thu</span>
      <span>Fri</span>
      <span>Sat</span>
    </div>

    <div id="calendarGrid" class="calendar-grid"></div>

    <section id="calendarDayDetails" class="calendar-day-details">
      <p class="empty-state">
        Tap a day to see its details.
      </p>
    </section>

  </section>
`;

function getCalendarDateString(year, month, day) {
  const monthString = String(month + 1).padStart(2, "0");
  const dayString = String(day).padStart(2, "0");

  return `${year}-${monthString}-${dayString}`;
}

function getEntriesForDate(dateString) {
  return getEntries().filter(entry => {
    const entryDate = new Date(entry.timestamp);

    const entryDateString = getCalendarDateString(
      entryDate.getFullYear(),
      entryDate.getMonth(),
      entryDate.getDate()
    );

    return entryDateString === dateString;
  });
}

function renderCalendarDayDetails(dateString) {
  const details = document.getElementById("calendarDayDetails");

  const date = new Date(`${dateString}T00:00:00`);
  const entries = getEntriesForDate(dateString);

  const title = date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });

  if (entries.length === 0) {
    details.innerHTML = `
      <h3>${title}</h3>

      <p class="empty-state">
        Nothing recorded for this day yet.
      </p>
    `;

    return;
  }

  details.innerHTML = `
    <h3>${title}</h3>

    ${entries
      .map(entry => `
        <div class="calendar-entry">

          <div class="calendar-entry-title">
            ${entry.moodEmoji} ${entry.moodLabel}
          </div>

          <div class="calendar-entry-stats">
            <span>😊 Mood: ${entry.mood}</span>
            <span>⚡ Energy: ${entry.energy}</span>
            <span>😰 Anxiety: ${entry.anxiety}</span>
            <span>🧠 OCD: ${entry.ocd}</span>
            <span>🎯 Focus: ${entry.focus}</span>
          </div>

          ${
            entry.notes
              ? `
                <p class="calendar-entry-notes">
                  📝 ${entry.notes}
                </p>
              `
              : ""
          }

        </div>
      `)
      .join("")}
  `;
}

function renderCalendar() {
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();

  const monthTitle = document.getElementById(
    "calendarMonthTitle"
  );

  const calendarGrid = document.getElementById(
    "calendarGrid"
  );

  monthTitle.textContent = calendarDate.toLocaleDateString(
    undefined,
    {
      month: "long",
      year: "numeric"
    }
  );

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startingWeekday = firstDayOfMonth.getDay();
  const numberOfDays = lastDayOfMonth.getDate();

  const today = new Date();

  let calendarHtml = "";

  for (let index = 0; index < startingWeekday; index += 1) {
    calendarHtml += `
      <div class="calendar-day empty"></div>
    `;
  }

  for (let day = 1; day <= numberOfDays; day += 1) {
    const dateString = getCalendarDateString(
      year,
      month,
      day
    );

    const entries = getEntriesForDate(dateString);

    const isToday =
      year === today.getFullYear() &&
      month === today.getMonth() &&
      day === today.getDate();

    const moodEmoji =
      entries.length > 0
        ? entries[entries.length - 1].moodEmoji
        : "";

    calendarHtml += `
      <button
        class="calendar-day ${isToday ? "today" : ""}"
        type="button"
        data-date="${dateString}"
      >
        <span class="calendar-day-number">
          ${day}
        </span>

        <span class="calendar-day-mood">
          ${moodEmoji}
        </span>
      </button>
    `;
  }

  calendarGrid.innerHTML = calendarHtml;

  document
    .querySelectorAll(".calendar-day[data-date]")
    .forEach(dayButton => {
      dayButton.addEventListener("click", event => {
        const selectedDate =
          event.currentTarget.dataset.date;

        document
          .querySelectorAll(".calendar-day")
          .forEach(button => {
            button.classList.remove("selected");
          });

        event.currentTarget.classList.add("selected");

        renderCalendarDayDetails(selectedDate);
      });
    });
}

document
  .getElementById("previousMonthBtn")
  .addEventListener("click", () => {
    calendarDate = new Date(
      calendarDate.getFullYear(),
      calendarDate.getMonth() - 1,
      1
    );

    renderCalendar();
  });

document
  .getElementById("nextMonthBtn")
  .addEventListener("click", () => {
    calendarDate = new Date(
      calendarDate.getFullYear(),
      calendarDate.getMonth() + 1,
      1
    );

    renderCalendar();
  });

renderCalendar();