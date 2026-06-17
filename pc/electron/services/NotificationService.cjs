/**
 * Notification Service
 * Handles scheduled reminders for diary and habits
 * Runs in Electron main process
 *
 * 安全改进：添加IPC输入验证
 * 参考：Electron安全最佳实践
 */

const { Notification } = require('electron');

// ── Input Validation ──────────────────────────────────────────

/**
 * 验证reminder对象结构
 * @param {any} reminder - 待验证的对象
 * @returns {boolean} 是否有效
 */
function validateReminder(reminder) {
  if (!reminder || typeof reminder !== 'object') return false;
  if (typeof reminder.id !== 'string' || reminder.id.length === 0) return false;
  if (typeof reminder.title !== 'string' || reminder.title.length === 0 || reminder.title.length > 100) return false;
  if (typeof reminder.body !== 'string' || reminder.body.length > 500) return false;
  if (typeof reminder.time !== 'string' || !/^\d{2}:\d{2}$/.test(reminder.time)) return false;
  if (reminder.days && !Array.isArray(reminder.days)) return false;
  if (reminder.days && reminder.days.some(d => typeof d !== 'number' || d < 0 || d > 6)) return false;
  if (reminder.enabled !== undefined && typeof reminder.enabled !== 'boolean') return false;
  return true;
}

/**
 * 验证ID参数
 * @param {any} id - 待验证的ID
 * @returns {boolean} 是否有效
 */
function validateId(id) {
  return typeof id === 'string' && id.length > 0 && id.length <= 100;
}

// ── Reminder Storage (in-memory, persisted via renderer) ──────

let reminders = [];
let checkInterval = null;

function formatLocalDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

/**
 * Start the reminder check loop
 * Checks every minute if any reminders are due
 */
function startReminderCheck(mainWindow) {
  if (checkInterval) return;

  checkInterval = setInterval(() => {
    checkAndNotify(mainWindow);
  }, 60000); // Check every minute

  console.log('[NotificationService] Reminder check started');
}

/**
 * Stop the reminder check loop
 */
function stopReminderCheck() {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
    console.log('[NotificationService] Reminder check stopped');
  }
}

/**
 * Check if any reminders are due and send notifications
 */
function checkAndNotify(mainWindow) {
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const currentDay = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

  for (const reminder of reminders) {
    if (!reminder.enabled) continue;
    if (reminder.time !== currentTime) continue;

    // Check day filter
    if (reminder.days && reminder.days.length > 0 && !reminder.days.includes(currentDay)) {
      continue;
    }

    // Check if already notified today
    if (reminder.lastNotified === now.toISOString().slice(0, 10)) {
      continue;
    }

    // Send notification
    sendNotification(reminder.title, reminder.body);

    // Mark as notified
    reminder.lastNotified = formatLocalDate(now);

    // Notify renderer
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('notification:sent', {
        id: reminder.id,
        title: reminder.title,
        body: reminder.body,
        time: currentTime,
      });
    }
  }
}

/**
 * Send a system notification
 */
function sendNotification(title, body) {
  if (!Notification.isSupported()) return;

  const notification = new Notification({
    title,
    body,
    silent: false,
  });

  notification.show();
  console.log(`[NotificationService] Sent: ${title} - ${body}`);
}

/**
 * Set reminders (called from renderer)
 */
function setReminders(newReminders) {
  reminders = newReminders;
  console.log(`[NotificationService] Updated reminders: ${reminders.length} items`);
}

/**
 * Get current reminders
 */
function getReminders() {
  return reminders;
}

/**
 * Add a single reminder
 */
function addReminder(reminder) {
  const existing = reminders.find(r => r.id === reminder.id);
  if (existing) {
    Object.assign(existing, reminder);
  } else {
    reminders.push(reminder);
  }
  return reminders;
}

/**
 * Remove a reminder
 */
function removeReminder(id) {
  reminders = reminders.filter(r => r.id !== id);
  return reminders;
}

/**
 * Toggle a reminder
 */
function toggleReminder(id) {
  const reminder = reminders.find(r => r.id === id);
  if (reminder) {
    reminder.enabled = !reminder.enabled;
  }
  return reminders;
}

// ── IPC Handlers ──────────────────────────────────────────────

function registerHandlers(ipcMain, getMainWindow) {
  ipcMain.handle('notification:setReminders', async (_event, newReminders) => {
    try {
      // 验证输入：newReminders必须是数组，且每个元素都要验证
      if (!Array.isArray(newReminders)) {
        return { success: false, error: 'Invalid input: expected array' };
      }
      for (const reminder of newReminders) {
        if (!validateReminder(reminder)) {
          return { success: false, error: 'Invalid reminder object' };
        }
      }
      setReminders(newReminders);
      return { success: true, reminders };
    } catch (err) {
      console.error('[NotificationService] setReminders error:', err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('notification:getReminders', async () => {
    try {
      return reminders;
    } catch (err) {
      console.error('[NotificationService] getReminders error:', err);
      return [];
    }
  });

  ipcMain.handle('notification:addReminder', async (_event, reminder) => {
    try {
      // 验证输入
      if (!validateReminder(reminder)) {
        return { success: false, error: 'Invalid reminder object' };
      }
      return addReminder(reminder);
    } catch (err) {
      console.error('[NotificationService] addReminder error:', err);
      return reminders;
    }
  });

  ipcMain.handle('notification:removeReminder', async (_event, id) => {
    try {
      // 验证输入
      if (!validateId(id)) {
        return { success: false, error: 'Invalid ID' };
      }
      return removeReminder(id);
    } catch (err) {
      console.error('[NotificationService] removeReminder error:', err);
      return reminders;
    }
  });

  ipcMain.handle('notification:toggleReminder', async (_event, id) => {
    try {
      // 验证输入
      if (!validateId(id)) {
        return { success: false, error: 'Invalid ID' };
      }
      return toggleReminder(id);
    } catch (err) {
      console.error('[NotificationService] toggleReminder error:', err);
      return reminders;
    }
  });

  ipcMain.handle('notification:startCheck', async () => {
    try {
      const mainWindow = getMainWindow();
      startReminderCheck(mainWindow);
      return { success: true };
    } catch (err) {
      console.error('[NotificationService] startCheck error:', err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('notification:stopCheck', async () => {
    try {
      stopReminderCheck();
      return { success: true };
    } catch (err) {
      console.error('[NotificationService] stopCheck error:', err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('notification:test', async () => {
    try {
      sendNotification('知己提醒', '这是一条测试通知');
      return { success: true };
    } catch (err) {
      console.error('[NotificationService] test error:', err);
      return { success: false, error: err.message };
    }
  });
}

module.exports = {
  setReminders,
  getReminders,
  addReminder,
  removeReminder,
  toggleReminder,
  startReminderCheck,
  stopReminderCheck,
  sendNotification,
  registerHandlers,
};
