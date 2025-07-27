/**
 * RPGlitch UI Utilities
 * DOM manipulation and UI management functions
 */

// CONSTANTS import removed - not used in this file

/**
 * UI Manager Class
 * Handles all DOM manipulation and UI state management
 */
export class UIManager {
    constructor() {
        this.ui = {};
        this.mouseoverAnimationState = {
            enabled: true,
            disabledElements: new Set()
        };
    }

    /**
     * Query DOM element by ID with optional error handling
     * @param {string} id - Element ID
     * @param {boolean} required - Whether element is required
     * @returns {HTMLElement|null}
     */
    query(id, required = false) {
        const el = document.getElementById(id);
        if (!el && required) {
            console.error(`[UI Critical] Element with ID '${id}' not found.`);
        } else if (!el) {
            console.warn(`[UI] Optional element with ID '${id}' not found.`);
        }
        return el;
    }

    /**
     * Retrieves and caches all key UI elements from the DOM
     */
    getUIElements() {
        this.getTopBarElements();
        this.getChinElements();
        this.getCoreUIContainers();
        this.getFormScreens();
        this.getProfileScreens();
        this.getPremadeSelectionScreens();
        this.getMiscScreens();
        this.getStoryboardElements();
        this.getChatInterfaceElements();

        if (!this.ui.main) {
            console.error("[App Critical] #main container not found after UI element query!");
        }
    }

    getTopBarElements() {
        this.ui.topBar = this.query('top-bar', true);
        if (!this.ui.topBar) return;

        this.ui.topBarLeft = this.query('top-bar-left', false);
        if (this.ui.topBarLeft) {
            this.ui.topBarNotificationArea = this.query('top-bar-notification-area', false);
        }

        this.ui.topBarRight = this.query('top-bar-right', false);
        if (this.ui.topBarRight) {
            this.ui.topBarUserCharacterInfo = this.query('top-bar-user-character-info', false);
            if (this.ui.topBarUserCharacterInfo) {
                this.ui.topBarUserCharacterPic = this.query('top-bar-user-character-pic', false);
                this.ui.topBarUserCharacterNameText = this.query('top-bar-user-character-name-text', false);
            }
            this.ui.topBarAiCharacterInfo = this.query('top-bar-ai-character-info', false);
            if (this.ui.topBarAiCharacterInfo) {
                this.ui.topBarAiCharacterPic = this.query('top-bar-ai-character-pic', false);
                this.ui.topBarAiCharacterNameText = this.query('top-bar-ai-character-name-text', false);
            }
            this.ui.menuButton = this.query('menu-button', false);
        }
    }

    getChinElements() {
        this.ui.storyboardChin = this.query('storyboard-chin');
        this.ui.characterWorkshopChin = this.query('character-workshop-chin');
        this.ui.worldBuilderChin = this.query('world-builder-chin');
        this.ui.optionsChin = this.query('options-chin');
    }

    getCoreUIContainers() {
        this.ui.main = this.query('main', true);
        this.ui.storyboardScreen = this.query('storyboard-screen', true);
        this.ui.chatInterfaceScreen = this.query('chat-interface-screen', true);
    }

    getFormScreens() {
        this.ui.characterFormScreen = this.query('character-form-screen', true);
        this.ui.worldFormScreen = this.query('world-form-screen', true);
    }

    getProfileScreens() {
        this.ui.characterProfileScreen = this.query('character-profile-screen', true);
        this.ui.worldProfileScreen = this.query('world-profile-screen', true);
        this.ui.storyProfileScreen = this.query('story-profile-screen', true);
        this.ui.storyProfileAiCharacterDisplayArea = this.query('story-profile-ai-character-display-area');
        this.ui.storyProfileUserCharacterDisplayArea = this.query('story-profile-user-character-display-area');
        this.ui.storyProfilechatFeed = this.query('story-profile-message-feed');
        this.ui.storyProfileActions = this.query('story-profile-actions');

        // Profile top bar elements
        this.ui.profileTopBar = this.query('profile-top-bar');
        this.ui.profileTopBarLeft = this.query('profile-top-bar-left');
        this.ui.profileTopBarCenter = this.query('profile-top-bar-center');
        this.ui.profileTopBarNotificationArea = this.query('profile-top-bar-notification-area');
        this.ui.profileTopBarRight = this.query('profile-top-bar-right');
        this.ui.profileTopBarUserCharacterInfo = this.query('profile-top-bar-user-character-info');
        this.ui.profileTopBarUserCharacterPic = this.query('profile-top-bar-user-character-pic');
        this.ui.profileTopBarUserCharacterNameText = this.query('profile-top-bar-user-character-name-text');
        this.ui.profileTopBarAiCharacterInfo = this.query('profile-top-bar-ai-character-info');
        this.ui.profileTopBarAiCharacterPic = this.query('profile-top-bar-ai-character-pic');
        this.ui.profileTopBarAiCharacterNameText = this.query('profile-top-bar-ai-character-name-text');
        this.ui.profileShuffleButton = this.query('profile-shuffle-button');
        this.ui.profileBeginStoryButton = this.query('profile-begin-story-button');

        // World profile top bar elements
        this.ui.worldProfileTopBar = this.query('world-profile-top-bar');
        this.ui.worldProfileTopBarLeft = this.query('world-profile-top-bar-left');
        this.ui.worldProfileTopBarCenter = this.query('world-profile-top-bar-center');
        this.ui.worldProfileTopBarNotificationArea = this.query('world-profile-top-bar-notification-area');
        this.ui.worldProfileTopBarRight = this.query('world-profile-top-bar-right');
        this.ui.worldProfileTopBarUserCharacterInfo = this.query('world-profile-top-bar-user-character-info');
        this.ui.worldProfileTopBarUserCharacterPic = this.query('world-profile-top-bar-user-character-pic');
        this.ui.worldProfileTopBarUserCharacterNameText = this.query('world-profile-top-bar-user-character-name-text');
        this.ui.worldProfileTopBarAiCharacterInfo = this.query('world-profile-top-bar-ai-character-info');
        this.ui.worldProfileTopBarAiCharacterPic = this.query('world-profile-top-bar-ai-character-pic');
        this.ui.worldProfileTopBarAiCharacterNameText = this.query('world-profile-top-bar-ai-character-name-text');
        this.ui.worldProfileShuffleButton = this.query('world-profile-shuffle-button');
        this.ui.worldProfileBeginStoryButton = this.query('world-profile-begin-story-button');

        // Story profile top bar elements
        this.ui.storyProfileTopBar = this.query('story-profile-top-bar');
        this.ui.storyProfileTopBarLeft = this.query('story-profile-top-bar-left');
        this.ui.storyProfileTopBarCenter = this.query('story-profile-top-bar-center');
        this.ui.storyProfileTopBarNotificationArea = this.query('story-profile-top-bar-notification-area');
        this.ui.storyProfileTopBarRight = this.query('story-profile-top-bar-right');
        this.ui.storyProfileTopBarUserCharacterInfo = this.query('story-profile-top-bar-user-character-info');
        this.ui.storyProfileTopBarUserCharacterPic = this.query('story-profile-top-bar-user-character-pic');
        this.ui.storyProfileTopBarUserCharacterNameText = this.query('story-profile-top-bar-user-character-name-text');
        this.ui.storyProfileTopBarAiCharacterInfo = this.query('story-profile-top-bar-ai-character-info');
        this.ui.storyProfileTopBarAiCharacterPic = this.query('story-profile-top-bar-ai-character-pic');
        this.ui.storyProfileTopBarAiCharacterNameText = this.query('story-profile-top-bar-ai-character-name-text');
        this.ui.storyProfileShuffleButton = this.query('story-profile-shuffle-button');
        this.ui.storyProfileBeginStoryButton = this.query('story-profile-begin-story-button');
    }

    getPremadeSelectionScreens() {
        this.ui.premadeCharacterSelectionScreen = this.query('premade-character-bank', true);
        this.ui.premadeCharacterOnlyList = this.query('premade-character-only-list');
        this.ui.premadeWorldSelectionScreen = this.query('premade-world-bank', true);
        this.ui.premadeWorldOnlyList = this.query('premade-world-only-list');
    }

    getMiscScreens() {
        this.ui.memoryApplicationScreen = this.query('memory-application-screen');
        this.ui.initialPageLoadingModal = this.query('initial-page-loading-modal', true);
        this.ui.emergencyExportCtn = this.query('emergency-export-ctn');
        if (this.ui.emergencyExportCtn) this.hideEl(this.ui.emergencyExportCtn);
    }

    getStoryboardElements() {
        this.ui.storyboardTitleArea = this.query('storyboard-title-area', false);
        this.ui.storyboardTitle = this.query('storyboard-title', false);
        this.ui.storyboardScrollableContent = this.query('storyboard-scrollable-content', false);
        this.ui.storyboardColumns = this.query('storyboard-columns', false);
        this.ui.storyboardAiCharacterSelect = this.query('storyboard-ai-character-select', true);
        this.ui.storyboardAiCharacterCard = this.query('storyboard-ai-character-card', true);
        this.ui.storyboardUserCharacterSelect = this.query('storyboard-user-character-select', true);
        this.ui.storyboardUserCharacterCard = this.query('storyboard-user-character-card', true);
        this.ui.storyboardWorldSelect = this.query('storyboard-world-select', true);
        this.ui.storyboardWorldCard = this.query('storyboard-world-card', true);
        this.ui.openingPromptTextarea = this.query('opening-prompt-textarea', false);
        this.ui.advancedStoryOptionsToggleButton = this.query('advanced-story-options-toggle-button', false);
        this.ui.advancedStoryOptionsContentArea = this.query('advanced-story-options-content-area', false);
        this.ui.customStoryJsTextarea = this.query('custom-story-js-textarea', false);
        this.ui.beginStoryButton = this.query('begin-story-button', false);
        this.ui.shuffleStoryElementsButton = this.query('shuffle-button', false);
    }

    getChatInterfaceElements() {
        this.ui.chatScreenLayoutContainer = this.query('chat-screen-layout-container', true);
        if (!this.ui.chatScreenLayoutContainer) return;

        this.ui.userCharacterDisplayArea = this.query('user-character-display-area', false);
        this.ui.aiCharacterDisplayArea = this.query('ai-character-display-area', false);
        this.ui.builtInChatInterfaceWrapper = this.query('built-in-chat-interface-wrapper', false);
        this.ui.chatFeed = this.query('chat-feed', false);
        this.ui.messageInput = this.query('message-input', false);
        this.ui.sendButton = this.query('send-button', false);
        this.ui.inputWrapper = this.query('input-wrapper', false);
        this.ui.storyConcludedNotice = this.query('story-concluded-notice', false);
        this.ui.noMessagesNotice = this.query('no-messages-notice', false);
        this.ui.statusNotifier = this.query('status-notifier', false);
        this.ui.typingIndicatorText = this.query('typing-indicator-text', false);
        this.ui.concludeStoryChatButton = this.query('conclude-story-chat-button', false);
    }

    /**
     * Shows a DOM element by removing the 'hidden' class and setting visibility
     * @param {HTMLElement|string} el - The element or its ID
     * @returns {HTMLElement|null}
     */
    showEl(el) {
        if (typeof el === 'string') el = document.getElementById(el);
        if (!el) return null;
        el.classList.remove('hidden');
        el.style.visibility = '';
        el.style.display = '';
        return el;
    }

    /**
     * Hides a DOM element by adding the 'hidden' class and setting visibility
     * @param {HTMLElement|string} el - The element or its ID
     * @returns {HTMLElement|null}
     */
    hideEl(el) {
        if (typeof el === 'string') el = document.getElementById(el);
        if (el) {
            el.classList.add('hidden');
            el.style.display = 'none';
        }
        return el;
    }

    /**
     * Sanitizes HTML to prevent XSS
     * @param {string} text - The text to sanitize
     * @returns {string} The sanitized HTML
     */
    sanitizeHtml(text) {
        const textToSanitize = String(text === undefined || text === null ? "" : text);
        if (window.DOMPurify && typeof window.DOMPurify.sanitize === 'function') {
            return window.DOMPurify.sanitize(textToSanitize);
        }
        console.warn("DOMPurify is not available. Text will not be fully sanitized. This is a potential security risk.");
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
        return textToSanitize.replace(/[&<>"']/g, function(m) { return map[m]; });
    }

    // Mouseover animation management methods
    disableMouseoverAnimation(element) {
        if (element) {
            element.setAttribute('disabled', 'true');
            this.mouseoverAnimationState.disabledElements.add(element);
        }
    }

    enableMouseoverAnimation(element) {
        if (element) {
            element.removeAttribute('disabled');
            this.mouseoverAnimationState.disabledElements.delete(element);
        }
    }

    disableMouseoverAnimationForSelector(selector) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => this.disableMouseoverAnimation(el));
    }

    enableMouseoverAnimationForSelector(selector) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => this.enableMouseoverAnimation(el));
    }

    updateMouseoverAnimationState(storyboardSelected) {
        // For storyboard cards, add disabled attribute for hover effects when no item is selected
        if (!storyboardSelected.ai) {
            this.disableMouseoverAnimation(this.ui.storyboardAiCharacterCard);
            this.ui.storyboardAiCharacterCard?.setAttribute('disabled', 'true');
        } else {
            this.enableMouseoverAnimation(this.ui.storyboardAiCharacterCard);
            this.ui.storyboardAiCharacterCard?.removeAttribute('disabled');
        }

        if (!storyboardSelected.user) {
            this.disableMouseoverAnimation(this.ui.storyboardUserCharacterCard);
            this.ui.storyboardUserCharacterCard?.setAttribute('disabled', 'true');
        } else {
            this.enableMouseoverAnimation(this.ui.storyboardUserCharacterCard);
            this.ui.storyboardUserCharacterCard?.removeAttribute('disabled');
        }

        if (!storyboardSelected.world) {
            this.disableMouseoverAnimation(this.ui.storyboardWorldCard);
            this.ui.storyboardWorldCard?.setAttribute('disabled', 'true');
        } else {
            this.enableMouseoverAnimation(this.ui.storyboardWorldCard);
            this.ui.storyboardWorldCard?.removeAttribute('disabled');
        }

        // Disable animations for disabled buttons
        this.disableMouseoverAnimationForSelector('button[disabled]');
        this.disableMouseoverAnimationForSelector('input[disabled]');
        this.disableMouseoverAnimationForSelector('a[disabled]');

        // Enable animations for enabled buttons
        this.enableMouseoverAnimationForSelector('button:not([disabled])');
        this.enableMouseoverAnimationForSelector('input:not([disabled])');
        this.enableMouseoverAnimationForSelector('a:not([disabled])');
    }

    /**
     * Shows a notification in the top bar
     * @param {string} message - The notification message
     * @param {string} type - The notification type (success, error, info)
     * @param {number} duration - The duration of the notification in milliseconds
     */
    showTopNotification(message, type = 'info', duration = 3000) {
        // Determine which notification area to use based on the active screen
        let notificationArea = this.ui.topBarNotificationArea;
        
        if (document.getElementById('profile-top-bar') && 
            !document.getElementById('profile-top-bar').classList.contains('hidden')) {
            notificationArea = this.ui.profileTopBarNotificationArea;
        } else if (document.getElementById('world-profile-top-bar') && 
                   !document.getElementById('world-profile-top-bar').classList.contains('hidden')) {
            notificationArea = this.ui.worldProfileTopBarNotificationArea;
        } else if (document.getElementById('story-profile-top-bar') && 
                   !document.getElementById('story-profile-top-bar').classList.contains('hidden')) {
            notificationArea = this.ui.storyProfileTopBarNotificationArea;
        }

        if (!notificationArea) {
            console.warn('[UI] No notification area found for top notification');
            return;
        }

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `top-notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4caf50' : '#2196f3'};
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 10000;
            max-width: 300px;
            word-wrap: break-word;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;

        // Add to DOM
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);

        // Auto remove after duration
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }
}

// Export singleton instance
export const uiManager = new UIManager();

// Export individual functions for backward compatibility
export const showEl = (el) => uiManager.showEl(el);
export const hideEl = (el) => uiManager.hideEl(el);
export const sanitizeHtml = (text) => uiManager.sanitizeHtml(text);
export const showTopNotification = (message, type, duration) => uiManager.showTopNotification(message, type, duration);

export default uiManager; 