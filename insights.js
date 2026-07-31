function getLastNDates(numberOfDays) {
  const dates = [];

  for (let i = 0; i < numberOfDays; i++) {
    const date = new Date();

    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - i);

    dates.push({
      label: date.toLocaleDateString(undefined, {
        weekday: "long"
      }),

      dateString: getLocalDateString(date)
    });
  }

  return dates;
}

function getWeeklyAverage(trackerId) {
  const days = getLastNDates(7);

  let total = 0;

  days.forEach(day => {
    total += Number(
      getScaleValue(
        trackerId,
        day.dateString
      )
    );
  });

  return Math.round(total / days.length);
}

function getHighestDay(trackerId) {
  const days = getLastNDates(7);

  let highest = days[0];

  days.forEach(day => {
    const value = Number(
      getScaleValue(
        trackerId,
        day.dateString
      )
    );

    const highestValue = Number(
      getScaleValue(
        trackerId,
        highest.dateString
      )
    );

    if (value > highestValue) {
      highest = day;
    }
  });

  return {
    day: highest.label,
    value: getScaleValue(
      trackerId,
      highest.dateString
    )
  };
}

function getLowestDay(trackerId) {
  const days = getLastNDates(7);

  let lowest = days[0];

  days.forEach(day => {
    const value = Number(
      getScaleValue(
        trackerId,
        day.dateString
      )
    );

    const lowestValue = Number(
      getScaleValue(
        trackerId,
        lowest.dateString
      )
    );

    if (value < lowestValue) {
      lowest = day;
    }
  });

  return {
    day: lowest.label,
    value: getScaleValue(
      trackerId,
      lowest.dateString
    )
  };
}

function getScaleInsight(trackerId) {
  return {
    average: getWeeklyAverage(trackerId),
    high: getHighestDay(trackerId),
    low: getLowestDay(trackerId)
  };
}

function getHabitInsight(trackerId) {
  return {
    currentStreak: getCurrentHabitStreak(trackerId),
    bestStreak: getBestHabitStreak(trackerId)
  };
}

function getNumberAverage(trackerId) {
  const days = getLastNDates(7);

  let total = 0;

  days.forEach(day => {
    total += Number(
      getScaleValue(
        trackerId,
        day.dateString
      )
    );
  });

  return Math.round(total * 10) / 10;
}

function renderInsightsPage() {
  const loneliness = getScaleInsight("loneliness");
  const socialBattery = getScaleInsight("social-battery");
  const medication = getHabitInsight("medication");
  const sleep = getNumberAverage("sleep");

  openSubpage(`
    <section class="subpage">

      <header class="subpage-header">

        <button
          id="insightsBackBtn"
          class="subpage-back-btn"
          type="button"
        >
          ← Back
        </button>

        <h2>📊 Insights</h2>

      </header>

      <div class="insights-grid">

        <div class="insight-card">

          <h3>🥺 Loneliness</h3>

          <p>
            Average:
            <strong>${loneliness.average}</strong>
          </p>

          <p>
            Highest:
            <strong>
              ${loneliness.high.day}
              (${loneliness.high.value})
            </strong>
          </p>

          <p>
            Lowest:
            <strong>
              ${loneliness.low.day}
              (${loneliness.low.value})
            </strong>
          </p>

        </div>

        <div class="insight-card">

          <h3>🥱 Social Battery</h3>

          <p>
            Average:
            <strong>${socialBattery.average}</strong>
          </p>

          <p>
            Highest:
            <strong>
              ${socialBattery.high.day}
              (${socialBattery.high.value})
            </strong>
          </p>

          <p>
            Lowest:
            <strong>
              ${socialBattery.low.day}
              (${socialBattery.low.value})
            </strong>
          </p>

        </div>

        <div class="insight-card">

          <h3>💊 Medication</h3>

          <p>
            Current streak:
            <strong>${medication.currentStreak}</strong>
          </p>

          <p>
            Best streak:
            <strong>${medication.bestStreak}</strong>
          </p>

        </div>

        <div class="insight-card">

          <h3>😴 Sleep</h3>

          <p>
            Average:
            <strong>${sleep} hrs</strong>
          </p>

          <p>
            Last 7 days
          </p>

        </div>

      </div>

    </section>
  `);

  document
    .getElementById("insightsBackBtn")
    .addEventListener("click", () => {
      closeSubpage("morePage");
    });
}