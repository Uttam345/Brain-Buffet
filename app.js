// Brain Buffet - Productivity Restaurant JavaScript

class BrainBuffet {
  constructor() {
    this.currentSection = 'welcome';
    
    this.timer = {
      minutes: 25,
      seconds: 0,
      isRunning: false,
      interval: null,
      currentSession: 1,
      sessionType: 'focus' // 'focus', 'shortBreak', 'longBreak'
    };

    this.water = {
      consumed: 0,
      goal: 2000,
      reminderInterval: 60,
      lastReminder: Date.now()
    };

    this.tasks = {
      appetizers: [],
      mainCourse: [],
      desserts: []
    };

    this.settings = {
      focusDuration: 25,
      shortBreak: 5,
      longBreak: 30,
      waterGoal: 2000,
      notificationsEnabled: true
    };

    this.completedTasks = 0;

    this.init();
  }
  init() {
    this.loadData();
    this.setupEventListeners();
    this.setupNavigation();
    this.loadSampleTasks();
    this.updateAllDisplays();
    
    // Initialize with welcome screen
    this.showSection('welcome');
  }

  loadData() {
    try {
      // Try Chrome storage API first, then fallback to localStorage
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.sync.get(['brainBuffetData'], (result) => {
          if (result.brainBuffetData) {
            this.loadFromData(result.brainBuffetData);
          }
        });
      } else {
        const savedData = localStorage.getItem('brainBuffetData');
        if (savedData) {
          this.loadFromData(JSON.parse(savedData));
        }
      }
    } catch (error) {
      console.log('No saved data found, using defaults');
    }
  }

  loadFromData(data) {
    this.timer = { ...this.timer, ...data.timer };
    this.water = { ...this.water, ...data.water };
    this.tasks = { ...this.tasks, ...data.tasks };
    this.settings = { ...this.settings, ...data.settings };
    this.completedTasks = data.completedTasks || 0;
    this.updateAllDisplays();
  }

  saveData() {
    try {
      const data = {
        timer: this.timer,
        water: this.water,
        tasks: this.tasks,
        settings: this.settings,
        completedTasks: this.completedTasks,
        lastSaved: Date.now()
      };
      
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.sync.set({ brainBuffetData: data });
      } else {
        localStorage.setItem('brainBuffetData', JSON.stringify(data));
      }
    } catch (error) {
      console.log('Could not save data:', error);
    }
  }

  setupNavigation() {
    // Dining option navigation
    const diningOptions = document.querySelectorAll('.dining-option');
    diningOptions.forEach(option => {
      option.addEventListener('click', () => {
        const section = option.dataset.section;
        this.showSection(section);
      });
    });

    // Back buttons
    const backButtons = document.querySelectorAll('.back-btn');
    backButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.showSection('welcome');
      });
    });

    // Navigation tabs
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const section = btn.dataset.section;
        this.showSection(section);
      });
    });
  }

  setupEventListeners() {
    // Timer controls
    const timerControls = document.querySelectorAll('.timer-control');
    timerControls.forEach(control => {
      control.addEventListener('click', () => {
        const action = control.dataset.action;
        this.handleTimerAction(action);
      });
    });

    // Water tracking
    const waterButtons = document.querySelectorAll('.water-btn');
    waterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const amount = parseInt(btn.dataset.amount);
        this.addWater(amount);
      });
    });

    // Task inputs with Enter key support
    ['appetizer', 'main-course', 'dessert'].forEach(course => {
      const input = document.getElementById(`${course}-input`);
      const btn = document.querySelector(`[data-course="${course === 'main-course' ? 'mainCourse' : course}s"]`);
      
      if (input && btn) {
        input.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            btn.click();
          }
        });
      }
    });

    // Task management buttons
    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-course]')) {
        const section = e.target.dataset.course;
        this.addTask(section);
      }
      
      if (e.target.matches('.delete-task')) {
        const section = e.target.dataset.section;
        const id = parseInt(e.target.dataset.id);
        this.deleteTask(section, id);
      }
      
      if (e.target.matches('.task-checkbox')) {
        const section = e.target.dataset.section;
        const id = parseInt(e.target.dataset.id);
        this.toggleTask(section, id);
      }
    });

    // Kitchen tools
    document.addEventListener('click', (e) => {
      if (e.target.id === 'clear-appetizers') {
        this.clearSection('appetizers');
      } else if (e.target.id === 'clear-main-course') {
        this.clearSection('mainCourse');
      } else if (e.target.id === 'clear-desserts') {
        this.clearSection('desserts');
      } else if (e.target.id === 'reset-all-menu') {
        this.resetAllTasks();
      }
    });    // Water modal
    const waterModal = document.getElementById('water-modal');
    const customWaterBtn = document.getElementById('custom-water');
    const addCustomWaterBtn = document.getElementById('add-custom-water');
    const waterInput = document.getElementById('custom-water-amount');
    const closeWaterModal = document.getElementById('close-water-modal');

    if (customWaterBtn) {
      customWaterBtn.addEventListener('click', () => this.showWaterModal());
    }

    if (addCustomWaterBtn) {
      addCustomWaterBtn.addEventListener('click', () => this.addCustomWater());
    }

    if (closeWaterModal) {
      closeWaterModal.addEventListener('click', () => this.hideWaterModal());
    }

    if (waterInput) {
      waterInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.addCustomWater();
        }
      });
    }

    if (waterModal) {
      waterModal.addEventListener('click', (e) => {
        if (e.target === waterModal) {
          this.hideWaterModal();
        }
      });
    }

    // Settings modal
    const settingsModal = document.getElementById('settings-modal');
    const settingsBtn = document.getElementById('settings-btn');
    const saveSettingsBtn = document.getElementById('save-settings');

    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => this.showSettingsModal());
    }

    if (saveSettingsBtn) {
      saveSettingsBtn.addEventListener('click', () => this.saveSettings());
    }

    if (settingsModal) {
      settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
          this.hideSettingsModal();
        }
      });
    }
  }
  showSection(section) {
    // Hide welcome screen
    const welcomeScreen = document.getElementById('welcome-screen');
    if (welcomeScreen) {
      welcomeScreen.classList.add('hidden');
    }

    // Hide all section screens
    const sections = document.querySelectorAll('.section-screen');
    sections.forEach(s => s.classList.add('hidden'));

    // Show target section or welcome screen
    if (section === 'welcome') {
      if (welcomeScreen) {
        welcomeScreen.classList.remove('hidden');
      }
    } else {
      const targetSection = document.getElementById(`${section}-section`);
      if (targetSection) {
        targetSection.classList.remove('hidden');
      }
    }

    // Update navigation
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => btn.classList.remove('active'));
    
    const activeNavBtn = document.querySelector(`[data-section="${section}"]`);
    if (activeNavBtn) {
      activeNavBtn.classList.add('active');
    }

    this.currentSection = section;
    
    // Update displays when switching sections
    if (section === 'productivity') {
      this.updateTimerDisplay();
      this.updateWaterDisplay();
    }
  }

  loadSampleTasks() {
    if (this.tasks.appetizers.length === 0) {
      this.tasks.appetizers = [
        { id: 1, text: "Check and respond to emails", completed: false },
        { id: 2, text: "Review today's schedule", completed: false }
      ];
    }
    
    if (this.tasks.mainCourse.length === 0) {
      this.tasks.mainCourse = [
        { id: 3, text: "Work on main project presentation", completed: false },
        { id: 4, text: "Attend team meeting", completed: false }
      ];
    }
    
    if (this.tasks.desserts.length === 0) {
      this.tasks.desserts = [
        { id: 5, text: "Plan weekend activities", completed: false },
        { id: 6, text: "Read a chapter of favorite book", completed: false }
      ];
    }
  }

  // Timer Methods
  handleTimerAction(action) {
    switch (action) {
      case 'start':
        this.startTimer();
        break;
      case 'pause':
        this.pauseTimer();
        break;
      case 'reset':
        this.resetTimer();
        break;
      case 'skip':
        this.skipSession();
        break;
    }
  }

  startTimer() {
    if (!this.timer.isRunning) {
      this.timer.isRunning = true;
      this.timer.interval = setInterval(() => {
        this.tick();
      }, 1000);
      this.updateTimerControls();
    }
  }

  pauseTimer() {
    if (this.timer.isRunning) {
      this.timer.isRunning = false;
      clearInterval(this.timer.interval);
      this.updateTimerControls();
    }
  }

  resetTimer() {
    this.timer.isRunning = false;
    clearInterval(this.timer.interval);
    this.timer.minutes = this.getSessionDuration();
    this.timer.seconds = 0;
    this.updateTimerDisplay();
    this.updateTimerControls();
  }

  skipSession() {
    this.timer.isRunning = false;
    clearInterval(this.timer.interval);
    this.nextSession();
  }

  tick() {
    if (this.timer.seconds > 0) {
      this.timer.seconds--;
    } else if (this.timer.minutes > 0) {
      this.timer.minutes--;
      this.timer.seconds = 59;
    } else {
      // Session complete
      this.sessionComplete();
    }
    this.updateTimerDisplay();
  }

  sessionComplete() {
    this.timer.isRunning = false;
    clearInterval(this.timer.interval);
    
    // Show notification
    const sessionType = this.timer.sessionType;
    if (sessionType === 'focus') {
      this.showNotification('Focus Session Complete!', 'Great work! Time for a break.');
    } else {
      this.showNotification('Break Complete!', 'Ready to focus again?');
    }
    
    this.nextSession();
  }

  nextSession() {
    if (this.timer.sessionType === 'focus') {
      this.timer.currentSession++;
      
      // Every 4th session is a long break
      if (this.timer.currentSession % 4 === 0) {
        this.timer.sessionType = 'longBreak';
      } else {
        this.timer.sessionType = 'shortBreak';
      }
    } else {
      this.timer.sessionType = 'focus';
    }
    
    this.timer.minutes = this.getSessionDuration();
    this.timer.seconds = 0;
    this.updateTimerDisplay();
    this.updateSessionType();
    this.updateTimerControls();
  }

  getSessionDuration() {
    switch (this.timer.sessionType) {
      case 'focus':
        return this.settings.focusDuration;
      case 'shortBreak':
        return this.settings.shortBreak;
      case 'longBreak':
        return this.settings.longBreak;
      default:
        return 25;
    }
  }

  updateTimerDisplay() {
    const minutesEl = document.getElementById('timer-minutes');
    const secondsEl = document.getElementById('timer-seconds');
    
    if (minutesEl) {
      minutesEl.textContent = this.timer.minutes.toString().padStart(2, '0');
    }
    if (secondsEl) {
      secondsEl.textContent = this.timer.seconds.toString().padStart(2, '0');
    }
  }

  updateTimerControls() {
    const startBtn = document.querySelector('[data-action="start"]');
    const pauseBtn = document.querySelector('[data-action="pause"]');
    
    if (startBtn && pauseBtn) {
      if (this.timer.isRunning) {
        startBtn.style.display = 'none';
        pauseBtn.style.display = 'inline-block';
      } else {
        startBtn.style.display = 'inline-block';
        pauseBtn.style.display = 'none';
      }
    }
  }

  updateSessionType() {
    const sessionTypeEl = document.getElementById('session-type');
    const sessionTypeText = {
      'focus': 'Focus Time',
      'shortBreak': 'Short Break',
      'longBreak': 'Long Break'
    };
    if (sessionTypeEl) sessionTypeEl.textContent = sessionTypeText[this.timer.sessionType];
  }

  updateSessionStatus(status) {
    const statusEl = document.getElementById('session-status');
    if (statusEl) statusEl.textContent = status;
  }

  // Task Management Methods with Enhanced Button Feedback
  addTask(section) {
    let input;
    if (section === 'appetizers') {
      input = document.getElementById('appetizer-input');
    } else if (section === 'mainCourse') {
      input = document.getElementById('main-course-input');
    } else if (section === 'desserts') {
      input = document.getElementById('dessert-input');
    }
    
    if (!input) return;
    
    const text = input.value.trim();
    
    if (text) {
      const task = {
        id: Date.now(),
        text: text,
        completed: false
      };
      
      this.tasks[section].push(task);
      input.value = '';
      this.updateTaskDisplay(section);
      this.updateProgressPlates();
      this.saveData();
      
      // Enhanced button feedback
      this.showButtonSuccess(section);
      this.showNotification('Dish Added! 🍽️', `"${text}" has been added to your ${this.getSectionDisplayName(section)}`);
    }
  }

  // Enhanced button feedback system
  showButtonSuccess(section) {
    const btn = document.querySelector(`[data-course="${section}"]`);
    if (btn) {
      // Add success state
      btn.classList.add('success');
      
      // Change button text temporarily if it has the proper structure
      const btnText = btn.querySelector('.btn-text');
      const btnIcon = btn.querySelector('.btn-icon');
      
      if (btnText && btnIcon) {
        const originalText = btnText.textContent;
        btnText.textContent = 'Added!';
        btnIcon.textContent = '✓';
        
        // Reset after animation
        setTimeout(() => {
          btn.classList.remove('success');
          btnText.textContent = originalText;
          btnIcon.textContent = '+';
        }, 1000);
      } else {
        // Fallback for simpler button structure
        setTimeout(() => {
          btn.classList.remove('success');
        }, 1000);
      }
    }
  }

  getSectionDisplayName(section) {
    const names = {
      'appetizers': 'Appetizers',
      'mainCourse': 'Main Course',
      'desserts': 'Desserts'
    };
    return names[section] || section;
  }

  toggleTask(section, id) {
    const task = this.tasks[section].find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      this.updateTaskDisplay(section);
      this.updateProgressPlates();
      this.saveData();
    }
  }

  deleteTask(section, id) {
    this.tasks[section] = this.tasks[section].filter(t => t.id !== id);
    this.updateTaskDisplay(section);
    this.updateProgressPlates();
    this.saveData();
  }

  clearSection(section) {
    if (confirm(`Are you sure you want to clear all ${this.getSectionDisplayName(section)}?`)) {
      this.tasks[section] = [];
      this.updateTaskDisplay(section);
      this.updateProgressPlates();
      this.saveData();
      
      // Show tool button feedback
      const buttonId = `clear-${section === 'mainCourse' ? 'main-course' : section}`;
      this.showToolButtonSuccess(buttonId, 'Cleared!');
      this.showNotification('Section Cleared! 🧹', `${this.getSectionDisplayName(section)} has been cleared`);
    }
  }

  resetAllTasks() {
    if (confirm('Are you sure you want to reset all tasks? This cannot be undone.')) {
      this.tasks = {
        appetizers: [],
        mainCourse: [],
        desserts: []
      };
      this.updateAllTaskDisplays();
      this.updateProgressPlates();
      this.saveData();
      
      // Show tool button feedback
      this.showToolButtonSuccess('reset-all-menu', 'Reset Complete!');
      this.showNotification('All Tasks Reset! 🔥', 'Your menu has been completely cleared');
    }
  }

  // Enhanced tool button feedback
  showToolButtonSuccess(buttonId, message) {
    const btn = document.getElementById(buttonId);
    if (btn) {
      const originalText = btn.textContent;
      
      // Add success state
      btn.classList.add('success');
      btn.textContent = message;
      
      // Reset after animation
      setTimeout(() => {
        btn.classList.remove('success');
        btn.textContent = originalText;
      }, 1500);
    }
  }

  countCompletedTasks() {
    this.completedTasks = 0;
    Object.values(this.tasks).forEach(category => {
      this.completedTasks += category.filter(task => task.completed).length;
    });
  }

  updateTaskDisplay(section) {
    let listId;
    if (section === 'appetizers') listId = 'appetizers-list';
    else if (section === 'mainCourse') listId = 'main-course-list';
    else if (section === 'desserts') listId = 'desserts-list';
    
    const list = document.getElementById(listId);
    if (!list) return;
    
    list.innerHTML = '';
    
    this.tasks[section].forEach(task => {
      const li = document.createElement('li');
      li.className = `task-item ${task.completed ? 'completed' : ''}`;
      li.innerHTML = `
        <input type="checkbox" class="task-checkbox" 
               data-section="${section}" data-id="${task.id}" 
               ${task.completed ? 'checked' : ''}>
        <span class="task-text">${task.text}</span>
        <button class="delete-task" data-section="${section}" data-id="${task.id}">
          ×
        </button>
      `;
      list.appendChild(li);
    });
  }

  updateAllTaskDisplays() {
    ['appetizers', 'mainCourse', 'desserts'].forEach(section => {
      this.updateTaskDisplay(section);
    });
  }

  updateProgressPlates() {
    this.countCompletedTasks();
    
    const progressText = document.getElementById('progress-text');
    if (progressText) {
      const totalTasks = Object.values(this.tasks).reduce((total, category) => total + category.length, 0);
      progressText.textContent = `${this.completedTasks}/${totalTasks} dishes completed`;
    }
    
    // Update individual section progress
    ['appetizers', 'mainCourse', 'desserts'].forEach(section => {
      const completed = this.tasks[section].filter(task => task.completed).length;
      const total = this.tasks[section].length;
      
      const progressEl = document.querySelector(`[data-section="${section}"] .section-progress`);
      if (progressEl) {
        progressEl.textContent = `${completed}/${total}`;
      }
    });
  }

  // Water tracking methods
  addWater(amount) {
    this.water.consumed += amount;
    this.updateWaterDisplay();
    this.saveData();
    
    if (this.water.consumed >= this.water.goal) {
      this.showNotification('Hydration Goal Reached!', 'Great job staying hydrated today!');
    }
  }

  resetWater() {
    this.water.consumed = 0;
    this.updateWaterDisplay();
    this.saveData();
  }
  updateWaterDisplay() {
    const waterCurrent = document.getElementById('water-current');
    const waterGoal = document.getElementById('water-goal');
    const waterFill = document.getElementById('water-fill');
    
    if (waterCurrent) waterCurrent.textContent = this.water.consumed;
    if (waterGoal) waterGoal.textContent = this.water.goal;
    
    const percent = Math.min(100, (this.water.consumed / this.water.goal) * 100);
    
    // Update the water glass fill animation
    if (waterFill) {
      waterFill.style.height = `${percent}%`;
      waterFill.style.background = `linear-gradient(to top, 
        rgba(54, 162, 235, 0.8) 0%, 
        rgba(54, 162, 235, 0.6) 50%, 
        rgba(54, 162, 235, 0.4) 100%)`;
    }
  }
  showWaterModal() {
    const modal = document.getElementById('water-modal');
    if (modal) {
      modal.classList.remove('hidden');
      const customWaterInput = document.getElementById('custom-water-amount');
      if (customWaterInput) customWaterInput.focus();
    }
  }

  hideWaterModal() {
    const modal = document.getElementById('water-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  addCustomWater() {
    const input = document.getElementById('custom-water-amount');
    const amount = parseInt(input.value);
    
    if (amount && amount > 0) {
      this.addWater(amount);
      input.value = '100'; // Reset to default
      this.hideWaterModal();
    }
  }

  // Settings methods
  showSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
      modal.classList.remove('hidden');
      
      // Populate current settings
      const focusInput = document.getElementById('focus-duration');
      const shortBreakInput = document.getElementById('short-break');
      const longBreakInput = document.getElementById('long-break');
      const waterGoalInput = document.getElementById('water-goal-setting');
      const notificationsInput = document.getElementById('notifications-enabled');
      
      if (focusInput) focusInput.value = this.settings.focusDuration;
      if (shortBreakInput) shortBreakInput.value = this.settings.shortBreak;
      if (longBreakInput) longBreakInput.value = this.settings.longBreak;
      if (waterGoalInput) waterGoalInput.value = this.settings.waterGoal;
      if (notificationsInput) notificationsInput.checked = this.settings.notificationsEnabled;
    }
  }

  hideSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  saveSettings() {
    const focusInput = document.getElementById('focus-duration');
    const shortBreakInput = document.getElementById('short-break');
    const longBreakInput = document.getElementById('long-break');
    const waterGoalInput = document.getElementById('water-goal-setting');
    const notificationsInput = document.getElementById('notifications-enabled');
    
    if (focusInput) this.settings.focusDuration = parseInt(focusInput.value) || 25;
    if (shortBreakInput) this.settings.shortBreak = parseInt(shortBreakInput.value) || 5;
    if (longBreakInput) this.settings.longBreak = parseInt(longBreakInput.value) || 30;
    if (waterGoalInput) {
      this.settings.waterGoal = parseInt(waterGoalInput.value) || 2000;
      this.water.goal = this.settings.waterGoal;
    }
    if (notificationsInput) this.settings.notificationsEnabled = notificationsInput.checked;
    
    this.saveData();
    this.hideSettingsModal();
    this.showNotification('Settings Saved', 'Your preferences have been updated.');
  }

  // Notification system
  showNotification(title, message) {
    if (this.settings.notificationsEnabled) {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body: message,
          icon: 'logo.png'
        });
      } else {
        // Fallback for development
        console.log(`${title}: ${message}`);
      }
    }
  }

  // Update all displays
  updateAllDisplays() {
    this.updateTimerDisplay();
    this.updateAllTaskDisplays();
    this.countCompletedTasks();
    this.updateProgressPlates();
    this.updateWaterDisplay();
  }
}

// Initialize the app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new BrainBuffet();
  
  // Request notification permission on load
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
});
