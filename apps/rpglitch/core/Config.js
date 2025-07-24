/**
 * RPGlitch Core Configuration
 * Centralized configuration and constants for the RPGlitch application
 */

export const CONFIG = {
  // Application Constants
  APP_NAME: 'RPGlitch',
  VERSION: '1.0.0',
  
  // Dependency Configuration
  DEPENDENCIES: {
    REQUIRED: [
      'window.App',
      'window.DOMPurify', 
      'window.PERCHANCE_PLUGIN_IMAGE_GENERATOR'
    ],
    MAX_CHECK_COUNT: 50,
    CHECK_INTERVAL: 100
  },

  // UI Constants
  UI: {
    SCREENS: {
      STORYBOARD: 'storyboard',
      CHARACTER_FORM: 'character-form',
      WORLD_FORM: 'world-form',
      CHARACTER_PROFILE: 'character-profile',
      WORLD_PROFILE: 'world-profile',
      STORY_PROFILE: 'story-profile',
      CHAT: 'chat',
      SETTINGS: 'settings',
      MEMORY_MANAGEMENT: 'memory-management',
      MEMORY_APPLICATION: 'memory-application'
    },
    
    ELEMENTS: {
      MAIN: 'main',
      TOP_BAR: 'top-bar',
      CHIN: 'chin',
      LOADING_MODAL: 'initial-page-loading-modal',
      EMERGENCY_EXPORT: 'emergencyExportCtn'
    }
  },

  // Database Configuration
  DATABASE: {
    NAME: 'RPGlitchDB',
    VERSION: 1,
    TABLES: {
      CHARACTERS: 'characters',
      WORLDS: 'worlds', 
      STORIES: 'stories',
      MESSAGES: 'messages',
      APP_STATE: 'appState'
    }
  },

  // Form Configuration
  FORMS: {
    CHARACTER: {
      ITEM_TYPE: 'character',
      SCREEN: 'character-form',
      PROFILE_SCREEN: 'character-profile',
      DB_TABLE: 'characters'
    },
    WORLD: {
      ITEM_TYPE: 'world', 
      SCREEN: 'world-form',
      PROFILE_SCREEN: 'world-profile',
      DB_TABLE: 'worlds'
    }
  },

  // Chat Configuration
  CHAT: {
    AI_TYPING_DELAY: 1000,
    MAX_RETRIES: 3,
    TIMEOUT: 30000
  },

  // Color Palettes
  COLOR_PALETTES: {
    DEFAULT: {
      name: 'Default',
      colors: {
        primary: '#007acc',
        secondary: '#6c757d',
        accent: '#28a745',
        background: '#ffffff',
        text: '#212529'
      }
    },
    DARK: {
      name: 'Dark',
      colors: {
        primary: '#17a2b8',
        secondary: '#6c757d', 
        accent: '#28a745',
        background: '#343a40',
        text: '#ffffff'
      }
    }
  },

  // Session Storage Keys
  SESSION_KEYS: {
    PENDING_FORM_STATE: 'pendingRPGlitchFormState',
    FORM_DATA: 'rpglitchFormData'
  },

  // Error Messages
  ERRORS: {
    DEPENDENCY_TIMEOUT: 'Dependency load timed out',
    APP_INIT_FAILED: 'App failed to initialize due to missing dependencies',
    ELEMENT_NOT_FOUND: 'Element not found',
    DATABASE_NOT_INITIALIZED: 'Database not initialized yet',
    FORM_SUBMISSION_FAILED: 'Form submission failed'
  }
};

export default CONFIG;