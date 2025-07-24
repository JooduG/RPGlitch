/**
 * RPGlitch UI Management Module
 * Handles all UI-related operations, element queries, and screen management
 */

import { CONFIG } from '../core/Config.js';
import { sanitizeText } from '../core/Utils.js';

export class UIManager {
  constructor() {
    this.ui = {};
    this.currentMainView = null;
    this.focusBarState = {
      mode: 'storyboard',
      itemId: null,
      itemType: null
    };
  }

  /**
   * Initialize UI elements
   */
  initialize() {
    this._getUIElements();
    this._setupEventHandlers();
  }

  /**
   * Query for a DOM element by ID
   * @param {string} id - Element ID
   * @param {boolean} required - Whether element is required
   * @returns {HTMLElement|null} Found element or null
   */
  _query(id, required = false) {
    const el = document.getElementById(id);
    
    if (!el && required) {
      console.error(`[UI Critical] Element with ID '${id}' not found.`);
      return null;
    } else if (!el) {
      console.warn(`[UI] Optional element with ID '${id}' not found.`);
      return null;
    }
    
    return el;
  }

  /**
   * Get all UI elements
   */
  _getUIElements() {
    // Main containers
    this.ui.main = this._query('main', true);
    this.ui.initialPageLoadingModal = this._query('initial-page-loading-modal');
    this.ui.emergencyExportCtn = this._query('emergencyExportCtn');

    // Top bar elements
    this._getTopBarElements();
    
    // Chin elements
    this._getChinElements();
    
    // Core UI containers
    this._getCoreUIContainers();
    
    // Form screens
    this._getFormScreens();
    
    // Profile screens
    this._getProfileScreens();
    
    // Premade selection screens
    this._getPremadeSelectionScreens();
    
    // Misc screens
    this._getMiscScreens();
    
    // Storyboard elements
    this._getStoryboardElements();
    
    // Chat interface elements
    this._getChatInterfaceElements();

    if (!this.ui.main) {
      console.error("[App Critical] #main container not found after UI element query!");
    }
  }

  /**
   * Get top bar elements
   */
  _getTopBarElements() {
    this.ui.topBar = this._query('top-bar');
    this.ui.topBarLeft = this._query('top-bar-left');
    this.ui.topBarCenter = this._query('top-bar-center');
    this.ui.topBarNotificationArea = this._query('top-bar-notification-area');
    this.ui.topBarRight = this._query('top-bar-right');
    this.ui.topBarUserCharacterInfo = this._query('top-bar-user-character-info');
    this.ui.topBarUserCharacterPic = this._query('top-bar-user-character-pic');
    this.ui.topBarUserCharacterNameText = this._query('top-bar-user-character-name-text');
    this.ui.topBarAiCharacterInfo = this._query('top-bar-ai-character-info');
    this.ui.topBarAiCharacterPic = this._query('top-bar-ai-character-pic');
    this.ui.topBarAiCharacterNameText = this._query('top-bar-ai-character-name-text');

    // Profile top bars
    this._getProfileTopBarElements();
  }

  /**
   * Get profile top bar elements
   */
  _getProfileTopBarElements() {
    // Character profile top bar
    this.ui.profileTopBar = this._query('profile-top-bar');
    this.ui.profileTopBarLeft = this._query('profile-top-bar-left');
    this.ui.profileTopBarCenter = this._query('profile-top-bar-center');
    this.ui.profileTopBarNotificationArea = this._query('profile-top-bar-notification-area');
    this.ui.profileTopBarRight = this._query('profile-top-bar-right');
    this.ui.profileTopBarUserCharacterInfo = this._query('profile-top-bar-user-character-info');
    this.ui.profileTopBarUserCharacterPic = this._query('profile-top-bar-user-character-pic');
    this.ui.profileTopBarUserCharacterNameText = this._query('profile-top-bar-user-character-name-text');
    this.ui.profileTopBarAiCharacterInfo = this._query('profile-top-bar-ai-character-info');
    this.ui.profileTopBarAiCharacterPic = this._query('profile-top-bar-ai-character-pic');
    this.ui.profileTopBarAiCharacterNameText = this._query('profile-top-bar-ai-character-name-text');

    // World profile top bar
    this.ui.worldProfileTopBar = this._query('world-profile-top-bar');
    this.ui.worldProfileTopBarLeft = this._query('world-profile-top-bar-left');
    this.ui.worldProfileTopBarCenter = this._query('world-profile-top-bar-center');
    this.ui.worldProfileTopBarNotificationArea = this._query('world-profile-top-bar-notification-area');
    this.ui.worldProfileTopBarRight = this._query('world-profile-top-bar-right');
    this.ui.worldProfileTopBarUserCharacterInfo = this._query('world-profile-top-bar-user-character-info');
    this.ui.worldProfileTopBarUserCharacterPic = this._query('world-profile-top-bar-user-character-pic');
    this.ui.worldProfileTopBarUserCharacterNameText = this._query('world-profile-top-bar-user-character-name-text');
    this.ui.worldProfileTopBarAiCharacterInfo = this._query('world-profile-top-bar-ai-character-info');
    this.ui.worldProfileTopBarAiCharacterPic = this._query('world-profile-top-bar-ai-character-pic');
    this.ui.worldProfileTopBarAiCharacterNameText = this._query('world-profile-top-bar-ai-character-name-text');

    // Story profile top bar
    this.ui.storyProfileTopBar = this._query('story-profile-top-bar');
    this.ui.storyProfileTopBarLeft = this._query('story-profile-top-bar-left');
    this.ui.storyProfileTopBarCenter = this._query('story-profile-top-bar-center');
    this.ui.storyProfileTopBarNotificationArea = this._query('story-profile-top-bar-notification-area');
    this.ui.storyProfileTopBarRight = this._query('story-profile-top-bar-right');
    this.ui.storyProfileTopBarUserCharacterInfo = this._query('story-profile-top-bar-user-character-info');
    this.ui.storyProfileTopBarUserCharacterPic = this._query('story-profile-top-bar-user-character-pic');
    this.ui.storyProfileTopBarUserCharacterNameText = this._query('story-profile-top-bar-user-character-name-text');
    this.ui.storyProfileTopBarAiCharacterInfo = this._query('story-profile-top-bar-ai-character-info');
    this.ui.storyProfileTopBarAiCharacterPic = this._query('story-profile-top-bar-ai-character-pic');
    this.ui.storyProfileTopBarAiCharacterNameText = this._query('story-profile-top-bar-ai-character-name-text');
  }

  /**
   * Get chin elements
   */
  _getChinElements() {
    this.ui.chin = this._query('chin');
  }

  /**
   * Get core UI containers
   */
  _getCoreUIContainers() {
    this.ui.storyboard = this._query('storyboard');
    this.ui.chat = this._query('chat');
  }

  /**
   * Get form screens
   */
  _getFormScreens() {
    this.ui.characterForm = this._query('character-form');
    this.ui.worldForm = this._query('world-form');
  }

  /**
   * Get profile screens
   */
  _getProfileScreens() {
    this.ui.characterProfile = this._query('character-profile');
    this.ui.worldProfile = this._query('world-profile');
    this.ui.storyProfile = this._query('story-profile');
  }

  /**
   * Get premade selection screens
   */
  _getPremadeSelectionScreens() {
    this.ui.characterSelection = this._query('character-selection');
    this.ui.worldSelection = this._query('world-selection');
  }

  /**
   * Get misc screens
   */
  _getMiscScreens() {
    this.ui.settings = this._query('settings');
    this.ui.memoryManagement = this._query('memory-management');
    this.ui.memoryApplication = this._query('memory-application');
  }

  /**
   * Get storyboard elements
   */
  _getStoryboardElements() {
    this.ui.storyboardTitle = this._query('storyboard-title');
    this.ui.storyboardAiCharacterSelect = this._query('storyboard-ai-character-select');
    this.ui.storyboardUserCharacterSelect = this._query('storyboard-user-character-select');
    this.ui.storyboardWorldSelect = this._query('storyboard-world-select');
    this.ui.storyboardAiCharacterCard = this._query('storyboard-ai-character-card');
    this.ui.storyboardUserCharacterCard = this._query('storyboard-user-character-card');
    this.ui.storyboardWorldCard = this._query('storyboard-world-card');
    this.ui.storyboardBeginButton = this._query('storyboard-begin-button');
    this.ui.storyboardShuffleButton = this._query('storyboard-shuffle-button');
  }

  /**
   * Get chat interface elements
   */
  _getChatInterfaceElements() {
    this.ui.chatMessages = this._query('chat-messages');
    this.ui.chatInput = this._query('chat-input');
    this.ui.chatSendButton = this._query('chat-send-button');
    this.ui.chatAiTypingIndicator = this._query('chat-ai-typing-indicator');
  }

  /**
   * Setup event handlers
   */
  _setupEventHandlers() {
    this._setupTopBarHover();
    this._setupChinButtonHandlers();
    this._setupSearchHandlers();
  }

  /**
   * Show an element
   * @param {HTMLElement} el - Element to show
   */
  showEl(el) {
    if (!el) return;
    
    if (el.style.display === 'none') {
      el.style.display = '';
    }
    
    if (el.classList.contains('hidden')) {
      el.classList.remove('hidden');
    }
  }

  /**
   * Hide an element
   * @param {HTMLElement} el - Element to hide
   */
  hideEl(el) {
    if (!el) return;
    
    if (el.style.display !== 'none') {
      el.style.display = 'none';
    }
    
    if (!el.classList.contains('hidden')) {
      el.classList.add('hidden');
    }
  }

  /**
   * Show top notification
   * @param {string} message - Notification message
   * @param {string} type - Notification type (info, success, warning, error)
   * @param {number} duration - Duration in milliseconds
   */
  showTopNotification(message, type = 'info', duration = 3000) {
    let notificationArea = null;
    
    // Find the appropriate notification area based on current view
    if (this.currentMainView === CONFIG.UI.SCREENS.CHARACTER_PROFILE) {
      notificationArea = this.ui.profileTopBarNotificationArea;
    } else if (this.currentMainView === CONFIG.UI.SCREENS.WORLD_PROFILE) {
      notificationArea = this.ui.worldProfileTopBarNotificationArea;
    } else if (this.currentMainView === CONFIG.UI.SCREENS.STORY_PROFILE) {
      notificationArea = this.ui.storyProfileTopBarNotificationArea;
    } else {
      notificationArea = this.ui.topBarNotificationArea;
    }

    if (!notificationArea) {
      console.warn('Notification area not found for active screen:', this.currentMainView);
      return;
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = sanitizeText(message);
    
    // Add to notification area
    notificationArea.appendChild(notification);
    
    // Auto-remove after duration
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, duration);
  }

  /**
   * Switch to a specific screen
   * @param {string} screenName - Screen to switch to
   * @param {Object} options - Additional options
   */
  async switchToScreen(screenName, options = {}) {
    // Hide all screens first
    const allScreens = [
      this.ui.storyboard,
      this.ui.characterForm,
      this.ui.worldForm,
      this.ui.characterProfile,
      this.ui.worldProfile,
      this.ui.storyProfile,
      this.ui.chat,
      this.ui.settings,
      this.ui.memoryManagement,
      this.ui.memoryApplication,
      this.ui.characterSelection,
      this.ui.worldSelection
    ];

    allScreens.forEach(screen => {
      if (screen) {
        this.hideEl(screen);
      }
    });

    // Show target screen
    const targetScreenEl = this._query(screenName);
    if (targetScreenEl) {
      this.showEl(targetScreenEl);
      this.currentMainView = screenName;
    } else {
      console.warn(`Target screen '${screenName}' not found, falling back to storyboard.`);
      this.showEl(this.ui.storyboard);
      this.currentMainView = CONFIG.UI.SCREENS.STORYBOARD;
    }

    // Update top bar UI
    await this.updateTopBarUI();
  }

  /**
   * Update top bar UI based on current state
   */
  async updateTopBarUI() {
    // Implementation will be added based on the original logic
    // This is a placeholder for now
  }

  /**
   * Setup top bar hover effects
   */
  _setupTopBarHover() {
    // Implementation will be added based on the original logic
  }

  /**
   * Setup chin button handlers
   */
  _setupChinButtonHandlers() {
    // Implementation will be added based on the original logic
  }

  /**
   * Setup search handlers
   */
  _setupSearchHandlers() {
    // Implementation will be added based on the original logic
  }
}

export default UIManager;