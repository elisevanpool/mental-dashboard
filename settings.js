// =====================
// Settings & Notifications
// =====================

const MYBRAIN_SETTINGS_KEY = "mybrainSettings";

const defaultMyBrainSettings = {
  notificationsEnabled: false,

  medicationReminder: {
    enabled: false,
    time: "09:00"
  },

  journalReminder: {
    enabled: false,
    time: "20:00"
  },

  bedtimeReminder: {
    enabled: false,
    time: "22:30"
  },

  taskReminder: {
    enabled: false,
    time: "10:00"
  },

  quietHours: {
    enabled: false,
    start: "22:00",
    end: "08:00"
  },

  lastReminderDates: {}
};

// =========================================================
// STORAGE
// =========================================================

function cloneDefaultSettings() {
  return JSON.parse(
    JSON.stringify(defaultMyBrainSettings)
  );
}

function getMyBrainSettings() {
  try {
    const savedSettings = JSON.parse(
      localStorage.getItem(
        MYBRAIN_SETTINGS_KEY
      ) || "{}"
    );

    return {
      ...defaultMyBrainSettings,
      ...savedSettings,

      medicationReminder: {
        ...defaultMyBrainSettings
          .medicationReminder,
        ...(savedSettings
          .medicationReminder || {})
      },

      journalReminder: {
        ...defaultMyBrainSettings
          .journalReminder,
        ...(savedSettings
          .journalReminder || {})
      },

      bedtimeReminder: {
        ...defaultMyBrainSettings
          .bedtimeReminder,
        ...(savedSettings
          .bedtimeReminder || {})
      },

      taskReminder: {
        ...defaultMyBrainSettings
          .taskReminder,
        ...(savedSettings
          .taskReminder || {})
      },

      quietHours: {
        ...defaultMyBrainSettings
          .quietHours,
        ...(savedSettings.quietHours || {})
      },

      lastReminderDates: {
        ...(savedSettings
          .lastReminderDates || {})
      }
    };
  } catch (error) {
    console.error(
      "Could not load MyBrain settings:",
      error
    );

    return cloneDefaultSettings();
  }
}

function saveMyBrainSettings(settings) {
  localStorage.setItem(
    MYBRAIN_SETTINGS_KEY,
    JSON.stringify(settings)
  );
}

// =========================================================
// NOTIFICATION SUPPORT
// =========================================================

function getNotificationPermission() {
  if (!("Notification" in window)) {
    return "unsupported";
  }

  return Notification.permission;
}

function getNotificationSupportStatus() {
  if (!("Notification" in window)) {
    return {
      supported: false,
      permission: "unsupported",
      label: "Not supported in this browser"
    };
  }

  const labels = {
    default: "Permission not requested",
    granted: "Notifications allowed",
    denied: "Notifications blocked"
  };

  return {
    supported: true,
    permission: Notification.permission,
    label:
      labels[Notification.permission] ||
      Notification.permission
  };
}

async function requestMyBrainNotificationPermission() {
  const status =
    getNotificationSupportStatus();

  if (!status.supported) {
    return {
      success: false,
      message: status.label
    };
  }

  try {
    const permission =
      await Notification.requestPermission();

    const settings =
      getMyBrainSettings();

    settings.notificationsEnabled =
      permission === "granted";

    saveMyBrainSettings(settings);

    return {
      success: permission === "granted",

      message:
        permission === "granted"
          ? "Notifications enabled ✓"
          : permission === "denied"
            ? "Notifications were blocked."
            : "Notification permission was not granted."
    };
  } catch (error) {
    console.error(
      "Could not request notification permission:",
      error
    );

    return {
      success: false,
      message:
        "Could not request notification permission."
    };
  }
}

function waitForServiceWorker(
  timeoutMilliseconds = 2500
) {
  if (!("serviceWorker" in navigator)) {
    return Promise.reject(
      new Error(
        "Service workers are unavailable."
      )
    );
  }

  return Promise.race([
    navigator.serviceWorker.ready,

    new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(
          new Error(
            "Service worker was not ready."
          )
        );
      }, timeoutMilliseconds);
    })
  ]);
}

async function showMyBrainNotification(
  title,
  body,
  tag = "mybrain-notification"
) {
  if (
    !("Notification" in window) ||
    Notification.permission !== "granted"
  ) {
    return {
      success: false,
      message:
        "Notifications are not enabled."
    };
  }

  const notificationOptions = {
    body,
    icon: "./icon.svg",
    tag,
    data: {
      url: "./"
    }
  };

  /*
    Installed PWAs and mobile browsers generally
    display notifications through the service worker.
  */
  if ("serviceWorker" in navigator) {
    try {
      const registration =
        await waitForServiceWorker();

      await registration.showNotification(
        title,
        notificationOptions
      );

      return {
        success: true,
        message:
          "Notification sent through the service worker ✓"
      };
    } catch (error) {
      console.warn(
        "Service-worker notification unavailable:",
        error
      );
    }
  }

  /*
    Desktop fallback for the live Codespaces preview.
  */
  try {
    new Notification(
      title,
      notificationOptions
    );

    return {
      success: true,
      message:
        "Desktop notification sent ✓"
    };
  } catch (error) {
    console.error(
      "Could not display notification:",
      error
    );

    return {
      success: false,
      message:
        "Permission is allowed, but this preview could not display the notification."
    };
  }
}

// =========================================================
// REMINDER HELPERS
// =========================================================

function getReminderDateString(
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

function getMinutesFromTime(timeString) {
  const [hours, minutes] = String(
    timeString || "00:00"
  )
    .split(":")
    .map(Number);

  return hours * 60 + minutes;
}

function isInsideQuietHours(
  settings,
  now = new Date()
) {
  if (!settings.quietHours.enabled) {
    return false;
  }

  const currentMinutes =
    now.getHours() * 60 +
    now.getMinutes();

  const startMinutes =
    getMinutesFromTime(
      settings.quietHours.start
    );

  const endMinutes =
    getMinutesFromTime(
      settings.quietHours.end
    );

  if (startMinutes === endMinutes) {
    return false;
  }

  if (startMinutes < endMinutes) {
    return (
      currentMinutes >= startMinutes &&
      currentMinutes < endMinutes
    );
  }

  /*
    Quiet hours cross midnight.
  */
  return (
    currentMinutes >= startMinutes ||
    currentMinutes < endMinutes
  );
}

function reminderIsDue(
  reminder,
  reminderId,
  settings,
  now = new Date()
) {
  if (!reminder.enabled) {
    return false;
  }

  if (isInsideQuietHours(settings, now)) {
    return false;
  }

  const today =
    getReminderDateString(now);

  if (
    settings.lastReminderDates[
      reminderId
    ] === today
  ) {
    return false;
  }

  const currentMinutes =
    now.getHours() * 60 +
    now.getMinutes();

  const reminderMinutes =
    getMinutesFromTime(reminder.time);

  return currentMinutes >= reminderMinutes;
}

function markReminderSent(reminderId) {
  const settings =
    getMyBrainSettings();

  settings.lastReminderDates[
    reminderId
  ] = getReminderDateString();

  saveMyBrainSettings(settings);
}

async function checkMyBrainReminders() {
  if (
    !("Notification" in window) ||
    Notification.permission !== "granted"
  ) {
    return;
  }

  const settings =
    getMyBrainSettings();

  if (!settings.notificationsEnabled) {
    return;
  }

  const reminders = [
    {
      id: "medication",
      settings:
        settings.medicationReminder,
      title: "💊 Medication",
      body:
        "Time to check whether you’ve taken your medication."
    },

    {
      id: "journal",
      settings:
        settings.journalReminder,
      title: "📖 Journal",
      body:
        "Take a moment to write in MyBrain."
    },

    {
      id: "bedtime",
      settings:
        settings.bedtimeReminder,
      title: "🌙 Bedtime",
      body:
        "Ready to start your sleep session?"
    },

    {
      id: "tasks",
      settings:
        settings.taskReminder,
      title: "☀️ Today’s Tasks",
      body:
        "Open MyBrain and choose what belongs today."
    }
  ];

  for (const reminder of reminders) {
    if (
      reminderIsDue(
        reminder.settings,
        reminder.id,
        settings
      )
    ) {
      const result =
        await showMyBrainNotification(
          reminder.title,
          reminder.body,
          `mybrain-${reminder.id}`
        );

      if (result.success) {
        markReminderSent(
          reminder.id
        );
      }
    }
  }
}

// =========================================================
// SETTINGS PAGE
// =========================================================

function renderSettingsPage() {
  const settings =
    getMyBrainSettings();

  const status =
    getNotificationSupportStatus();

  openSubpage(`
    <section class="subpage">

      <header class="subpage-header">

        <button
          id="settingsBackBtn"
          class="subpage-back-btn"
          type="button"
        >
          ← Back
        </button>

        <h2>⚙️ Settings</h2>

      </header>

      <section class="settings-section-card">

        <div class="settings-section-heading">

          <div>
            <h3>🔔 Notifications</h3>

            <p id="notificationStatusText">
              ${status.label}
            </p>
          </div>

          <span
            class="notification-status-badge
              ${status.permission}"
          >
            ${status.permission}
          </span>

        </div>

        <button
          id="enableNotificationsBtn"
          class="settings-primary-btn"
          type="button"
          ${
            status.permission === "granted" ||
            !status.supported
              ? "disabled"
              : ""
          }
        >
          ${
            status.permission === "granted"
              ? "Notifications Enabled ✓"
              : "Enable Notifications"
          }
        </button>

        <button
          id="testNotificationBtn"
          class="settings-secondary-btn"
          type="button"
          ${
            status.permission === "granted"
              ? ""
              : "disabled"
          }
        >
          Send Test Notification
        </button>

        <p
          id="settingsNotificationMessage"
          class="settings-message"
        ></p>

        <p class="settings-explanation">
          These reminders are checked while MyBrain
          is open or reopened. Fully closed background
          reminders will require Web Push later.
        </p>

      </section>

      <section class="settings-section-card">

        <h3>⏰ Reminder Times</h3>

        ${renderReminderSetting(
          "medicationReminder",
          "💊 Medication",
          settings.medicationReminder
        )}

        ${renderReminderSetting(
          "journalReminder",
          "📖 Journal",
          settings.journalReminder
        )}

        ${renderReminderSetting(
          "bedtimeReminder",
          "🌙 Bedtime",
          settings.bedtimeReminder
        )}

        ${renderReminderSetting(
          "taskReminder",
          "☀️ Today’s Tasks",
          settings.taskReminder
        )}

      </section>

      <section class="settings-section-card">

        <h3>🤫 Quiet Hours</h3>

        <label class="settings-toggle-row">

          <div>
            <strong>Use quiet hours</strong>

            <small>
              Do not show reminders during this period.
            </small>
          </div>

          <input
            id="quietHoursEnabled"
            type="checkbox"
            ${
              settings.quietHours.enabled
                ? "checked"
                : ""
            }
          >

        </label>

        <div class="settings-time-grid">

          <label class="settings-time-field">

            <span>Start</span>

            <input
              id="quietHoursStart"
              type="time"
              value="${
                settings.quietHours.start
              }"
            >

          </label>

          <label class="settings-time-field">

            <span>End</span>

            <input
              id="quietHoursEnd"
              type="time"
              value="${
                settings.quietHours.end
              }"
            >

          </label>

        </div>

      </section>

      <button
        id="saveSettingsBtn"
        class="settings-save-btn"
        type="button"
      >
        Save Settings
      </button>

      <p
        id="settingsSaveMessage"
        class="settings-message"
      ></p>

    </section>
  `);

  attachSettingsPageEvents();
}

function renderReminderSetting(
  settingId,
  label,
  reminder
) {
  return `
    <div class="reminder-setting-row">

      <label class="settings-toggle-row">

        <div>

          <strong>${label}</strong>

          <small>
            One reminder each day
          </small>

        </div>

        <input
          id="${settingId}Enabled"
          type="checkbox"
          ${
            reminder.enabled
              ? "checked"
              : ""
          }
        >

      </label>

      <input
        id="${settingId}Time"
        class="reminder-time-input"
        type="time"
        value="${reminder.time}"
      >

    </div>
  `;
}

// =========================================================
// SETTINGS EVENTS
// =========================================================

function setSettingsMessage(
  elementId,
  text,
  isError = false
) {
  const element =
    document.getElementById(
      elementId
    );

  if (!element) {
    return;
  }

  element.textContent = text;
  element.classList.toggle(
    "error",
    isError
  );
}

function attachSettingsPageEvents() {
  document
    .getElementById("settingsBackBtn")
    ?.addEventListener(
      "click",
      () => closeSubpage("morePage")
    );

  document
    .getElementById(
      "enableNotificationsBtn"
    )
    ?.addEventListener(
      "click",
      async () => {
        setSettingsMessage(
          "settingsNotificationMessage",
          "Requesting permission..."
        );

        const result =
          await requestMyBrainNotificationPermission();

        setSettingsMessage(
          "settingsNotificationMessage",
          result.message,
          !result.success
        );

        setTimeout(
          renderSettingsPage,
          700
        );
      }
    );

  document
    .getElementById(
      "testNotificationBtn"
    )
    ?.addEventListener(
      "click",
      async () => {
        const button =
          document.getElementById(
            "testNotificationBtn"
          );

        if (button) {
          button.disabled = true;
          button.textContent =
            "Sending...";
        }

        setSettingsMessage(
          "settingsNotificationMessage",
          "Trying to send a notification..."
        );

        const result =
          await showMyBrainNotification(
            "🧠 MyBrain is working!",
            "Your notifications are connected.",
            "mybrain-test"
          );

        setSettingsMessage(
          "settingsNotificationMessage",
          result.message,
          !result.success
        );

        if (button) {
          button.disabled = false;
          button.textContent =
            "Send Test Notification";
        }
      }
    );

  document
    .getElementById(
      "saveSettingsBtn"
    )
    ?.addEventListener(
      "click",
      saveSettingsFromPage
    );
}

function saveSettingsFromPage() {
  const settings =
    getMyBrainSettings();

  const reminderNames = [
    "medicationReminder",
    "journalReminder",
    "bedtimeReminder",
    "taskReminder"
  ];

  reminderNames.forEach(
    settingName => {
      settings[settingName] = {
        enabled:
          document.getElementById(
            `${settingName}Enabled`
          )?.checked || false,

        time:
          document.getElementById(
            `${settingName}Time`
          )?.value ||
          defaultMyBrainSettings[
            settingName
          ].time
      };
    }
  );

  settings.quietHours = {
    enabled:
      document.getElementById(
        "quietHoursEnabled"
      )?.checked || false,

    start:
      document.getElementById(
        "quietHoursStart"
      )?.value || "22:00",

    end:
      document.getElementById(
        "quietHoursEnd"
      )?.value || "08:00"
  };

  settings.notificationsEnabled =
    getNotificationPermission() ===
    "granted";

  saveMyBrainSettings(settings);

  setSettingsMessage(
    "settingsSaveMessage",
    "Settings saved ✓"
  );

  checkMyBrainReminders();
}

// =========================================================
// START REMINDER CHECKER
// =========================================================

window.addEventListener(
  "focus",
  checkMyBrainReminders
);

document.addEventListener(
  "visibilitychange",
  () => {
    if (
      document.visibilityState ===
      "visible"
    ) {
      checkMyBrainReminders();
    }
  }
);

setTimeout(
  checkMyBrainReminders,
  1500
);

setInterval(
  checkMyBrainReminders,
  60000
);