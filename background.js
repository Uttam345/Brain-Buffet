// Background script for Productivity Menu Extension

// Initialize extension on install
chrome.runtime.onInstalled.addListener(() => {
  console.log('Productivity Menu Extension installed');
  
  // Set up default alarms for water reminders
  chrome.alarms.create('waterReminder', {
    delayInMinutes: 60,
    periodInMinutes: 60
  });
  
  // Create context menu for quick task addition
  chrome.contextMenus.create({
    id: 'add-starter-task',
    title: 'Add to Starters (Productivity Menu)',
    contexts: ['selection']
  });
  
  chrome.contextMenus.create({
    id: 'add-main-task',
    title: 'Add to Main Course (Productivity Menu)',
    contexts: ['selection']
  });
  
  chrome.contextMenus.create({
    id: 'add-dessert-task',
    title: 'Add to Desserts (Productivity Menu)',
    contexts: ['selection']
  });
  
  chrome.contextMenus.create({
    id: 'add-smoke-task',
    title: 'Add to Smoke Break (Productivity Menu)',
    contexts: ['selection']
  });
});

// Handle alarm events (for water reminders and pomodoro notifications)
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'waterReminder') {
    // Check if notifications are enabled
    chrome.storage.sync.get(['settings'], (result) => {
      const settings = result.settings || { notificationsEnabled: true };
      
      if (settings.notificationsEnabled) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'logo.png',
          title: 'Hydration Time! 💧',
          message: 'Time for a refreshing drink! Stay hydrated for better productivity.'
        });
      }
    });
  } else if (alarm.name === 'pomodoroComplete') {
    chrome.storage.sync.get(['settings'], (result) => {
      const settings = result.settings || { notificationsEnabled: true };
      
      if (settings.notificationsEnabled) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'logo.png',
          title: 'Pomodoro Complete! 🍅',
          message: 'Great work! Time for a well-deserved break.'
        });
      }
    });
  } else if (alarm.name === 'breakComplete') {
    chrome.storage.sync.get(['settings'], (result) => {
      const settings = result.settings || { notificationsEnabled: true };
      
      if (settings.notificationsEnabled) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'logo.png',
          title: 'Break Time Over! ⏰',
          message: 'Ready to get back to work? Let\'s tackle the next task!'
        });
      }
    });
  }
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'setWaterReminder') {
    // Clear existing alarm and create new one
    chrome.alarms.clear('waterReminder', () => {
      chrome.alarms.create('waterReminder', {
        delayInMinutes: request.intervalMinutes,
        periodInMinutes: request.intervalMinutes
      });
    });
    sendResponse({ success: true });
  } else if (request.action === 'setPomodoroAlarm') {
    chrome.alarms.create('pomodoroComplete', {
      delayInMinutes: request.minutes
    });
    sendResponse({ success: true });
  } else if (request.action === 'setBreakAlarm') {
    chrome.alarms.create('breakComplete', {
      delayInMinutes: request.minutes
    });
    sendResponse({ success: true });
  } else if (request.action === 'clearAlarm') {
    chrome.alarms.clear(request.alarmName);
    sendResponse({ success: true });
  }
});

// Handle notification clicks
chrome.notifications.onClicked.addListener((notificationId) => {
  // Open extension popup when notification is clicked
  chrome.action.openPopup();
  chrome.notifications.clear(notificationId);
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.selectionText) {
    let section = '';
    switch (info.menuItemId) {
      case 'add-starter-task':
        section = 'starters';
        break;
      case 'add-main-task':
        section = 'mainCourse';
        break;
      case 'add-dessert-task':
        section = 'desserts';
        break;
      case 'add-smoke-task':
        section = 'smoke';
        break;
    }
    
    if (section) {
      // Get existing data and add new task
      chrome.storage.sync.get(['productivityMenuData'], (result) => {
        const data = result.productivityMenuData || {
          tasks: { starters: [], mainCourse: [], desserts: [], smoke: [] }
        };
        
        const newTask = {
          id: Date.now(),
          text: info.selectionText.trim(),
          completed: false
        };
        
        data.tasks[section].push(newTask);
        
        chrome.storage.sync.set({ productivityMenuData: data });
        
        // Show notification
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'logo.png',
          title: 'Task Added! 📝',
          message: `"${info.selectionText.trim()}" added to ${section === 'mainCourse' ? 'Main Course' : section.charAt(0).toUpperCase() + section.slice(1)}`
        });
      });
    }
  }
});

// Handle keyboard commands
chrome.commands.onCommand.addListener((command) => {
  if (command === 'quick_water') {
    // Quick add 250ml water
    chrome.storage.sync.get(['productivityMenuData'], (result) => {
      const data = result.productivityMenuData || {
        water: { consumed: 0, goal: 2000 }
      };
      
      data.water.consumed += 250;
      if (data.water.consumed > data.water.goal) {
        data.water.consumed = data.water.goal;
      }
      
      chrome.storage.sync.set({ productivityMenuData: data });
      
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'logo.png',
        title: 'Hydration Logged! 💧',
        message: `Added 250ml water. Total: ${data.water.consumed}ml / ${data.water.goal}ml`
      });
    });
  }
});

// Keep service worker alive
chrome.runtime.onStartup.addListener(() => {
  console.log('Productivity Menu Extension started');
});
