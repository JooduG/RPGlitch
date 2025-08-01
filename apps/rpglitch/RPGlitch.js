/* eslint-disable no-unused-vars */
// Dependency availability checks with retry mechanism
function checkDependencies() {
    window.isDexieLoaded = typeof window.Dexie !== 'undefined'
    window.isDOMPurifyAvailable = typeof window.DOMPurify !== 'undefined'
    window.isHyperscriptLoaded = typeof window._hyperscript !== 'undefined'
    window.isCashDomLoaded = typeof window.$ !== 'undefined'
    return (
        window.isDexieLoaded &&
        window.isDOMPurifyAvailable &&
        window.isHyperscriptLoaded &&
        window.isCashDomLoaded
    )
}

let dependencyCheckCount = 0
const maxChecks = 50

function waitForDependencies() {
    if (checkDependencies()) {
        initializeApp()
    } else if (dependencyCheckCount < maxChecks) {
        dependencyCheckCount++
        setTimeout(waitForDependencies, 100)
    } else {
        console.error('Dependency load timed out.', {
            isDexieLoaded: window.isDexieLoaded,
            isHyperscriptLoaded: window.isHyperscriptLoaded,
            isCashDomLoaded: window.isCashDomLoaded,
            isDOMPurifyAvailable: window.isDOMPurifyAvailable
        })
        alert(
            'Application failed to load: essential components missing. Please ensure all scripts loaded correctly.'
        )
    }
}

function initializeApp() {
    if (window.App && typeof App.initializeWhenReady === 'function') {
        App.initializeWhenReady()
    } else {
        console.error(
            'App failed to initialize due to missing dependencies: App.initializeWhenReady not found'
        )
    }
}


// Ensure global App object exists before initialization
window.App =
  typeof window.App === 'object' && window.App !== null ? window.App : {};
// eslint-disable-next-line no-redeclare
  const App = window.App;

// Default IndexedDB name if none provided
const DEFAULT_DB_NAME = 'rpglitch-db';
window.dbName = window.dbName || DEFAULT_DB_NAME;

Object.assign(App, {
    // Debug: App object defined
    // console.log('App object defined:', window.App);

  
    db: null,
    activeStoryId: null, // Tracks currently active story (replaces currentStoryId)
    currentUserCharacterId: null,
    currentAiCharacterId: null,
    createItemFormData: {},
    temporaryStorySetupName: null,
    previousScreenBeforePremadeSelection: null,
    currentCreateFormContext: {},
    ui: {},
    currentTargetProfilePictureInputId: null,
    currentGeneratedProfilePictureDataUrl: null,
    currentProfileViewItemId: null,
    currentProfileViewItemType: null,
    currentProfileViewItem: null,
    isInitializing: false,
    activeAiButtons: new Map(), // Stores active AbortControllers for AI actions
    statusNotifierIntervalId: null,
    topNotificationTimeoutId: null,
    listenersAttached: false,
    initializeWhenReadyRetryCount: 0,
    maxInitializeWhenReadyRetries: 40,
    initializeWhenReadyBaseDelay: 50,
    initializeWhenReadyBackoffFactor: 2,
    initializeWhenReadyMaxDelay: 1000,

    storyboardSelected: { ai: '', user: '', world: '' },
    // Focus Bar State
    focusBarState: {
        mode: 'storyboard',
        tabs: ['storyboard', 'characters', 'worlds', 'options'],
        chinOpen: false,
        currentChin: null
    },

    // Mouseover animation state management
    mouseoverAnimationState: {
        enabled: true,
        disabledElements: new Set()
    },
  
    CONSTANTS: {
        FONT_FAMILY: "'Segoe UI', system-ui, sans-serif",
        UNIVERSAL_COLORS: {
            black: "#1f2937",
            white: "#f9fafb"
        },
        COLOR_PALETTES: {
            // Blues & Teals
            tech_blue: { name: 'Tech Blue', colors: { light: '#a7d8f9', medium: '#4a90e2', dark: '#1c3a6e', neutral: '#5a6a7a' } },
            ocean_blue: { name: 'Ocean Blue', colors: { light: '#b3e5fc', medium: '#03a9f4', dark: '#01579b', neutral: '#607d8b' } },
            // Greens
            forest_green: { name: 'Forest Green', colors: { light: '#c8e6c9', medium: '#4caf50', dark: '#1b5e20', neutral: '#6c757d' } },
            // Reds & Oranges
            crimson_red: { name: 'Crimson Red', colors: { light: '#ffcdd2', medium: '#f44336', dark: '#b71c1c', neutral: '#795548' } },
            sunset_orange: { name: 'Sunset Orange', colors: { light: '#ffccbc', medium: '#ff5722', dark: '#bf360c', neutral: '#8d6e63' } },
            // Purples
            royal_purple: { name: 'Royal Purple', colors: { light: '#e1bee7', medium: '#9c27b0', dark: '#4a148c', neutral: '#6a5d7b' } },
            // Grays & Metallics
            slate_gray: { name: 'Slate Gray', colors: { light: '#cfd8dc', medium: '#607d8b', dark: '#263238', neutral: '#6c757d' } },
            cyber_pink: { name: 'Cyber Pink', colors: { light: '#f8bbd0', medium: '#e91e63', dark: '#880e4f', neutral: '#757575' } }
        },
        VIEWS: {
            STORYBOARD: 'storyboardScreen',
            STORY_INTERFACE: 'chatInterfaceScreen',
            PREMADE_CHARACTER_SELECTION: 'premadeCharacterSelectionScreen',
            PREMADE_WORLD_SELECTION: 'premadeWorldSelectionScreen',
            CHARACTER_FORM: 'characterFormScreen',
            WORLD_FORM: 'worldFormScreen',
            CHARACTER_PROFILE: 'characterProfileScreen',
            WORLD_PROFILE: 'worldProfileScreen',
            STORY_PROFILE: 'storyProfileScreen',
            MEMORY_APPLICATION: 'memoryApplicationScreen'
  
        },
        ITEM_CONFIG: {
            character: {
                itemType: 'character',
                dbTableKey: 'characters',
                capital: 'Character',
                getPremadesFn: () => App.getPremadeCharacterItems(),
                formScreen: 'characterFormScreen',
                profileScreen: 'characterProfileScreen',
                labels: {
                    name: 'Name',
                    description: 'Summary/Card Info',
                    eternal: { main: 'Eternal', sub: 'Truths & Traits' },
                    past: { main: 'Past', sub: 'Memories & Histories' },
                    present: { main: 'Present', sub: 'Conditions & Opening' },
                    future: { main: 'Future', sub: 'Potentials & Aspirations' },
                    descriptionPlaceholder: 'A brief, one-sentence summary for the selection card. This text is not sent to the AI during story play.',
                    eternalPlaceholder: "Core Identity: Unchanging physical traits (species, build, unique markings), signature skills, speaking style, inherent magical abilities or unique talents. Example: 'A stoic, seven-foot-tall cyborg dragon with a dry wit and unmatched piloting skills.'",
                    pastPlaceholder: "Significant Life Events: Formative experiences, defining relationships, major turning points, learned history, or traumas that shaped them. Example: 'Orphaned during the Galactic Wars, later mentored by a cryptic space hermit, discovered an ancient artifact that changed their destiny.'",
                    presentPlaceholder: "Current State & Scene: Immediate mood, recent significant actions, current attire, notable equipment, immediate surroundings or situation just before the story starts. Crucial for AI's opening. Example: 'Exhausted but determined, clutching a flickering energy blade, standing at the precipice of the Shadow Chasm.'",
                    futurePlaceholder: "Aspirations & Conflicts: Driving motivations, deep-seated fears, potential character arcs, unresolved ambitions, or personal quests. What propels them forward or holds them back? Example: 'Driven to find a cure for the cosmic plague afflicting their home world, while secretly battling a prophecy that foretells their own doom.'"
                }
            },
            characterAi: {
                itemType: 'character',
                dbTableKey: 'characters',
                capital: 'Character',
                role: 'ai',
                getPremadesFn: () => App.getPremadeCharacterItems(),
                formScreen: 'characterFormScreen',
                profileScreen: 'characterProfileScreen',
                labels: {
                    name: 'Name',
                    description: 'Summary/Card Info',
                    eternal: { main: 'Eternal', sub: 'Truths & Traits' },
                    past: { main: 'Past', sub: 'Memories & Histories' },
                    present: { main: 'Present', sub: 'Conditions & Opening' },
                    future: { main: 'Future', sub: 'Potentials & Aspirations' },
                    descriptionPlaceholder: 'A brief, one-sentence summary for the selection card. This text is not sent to the AI during story play.',
                    eternalPlaceholder: "Core Identity: Unchanging physical traits (species, build, unique markings), signature skills, speaking style, inherent magical abilities or unique talents. Example: 'A stoic, seven-foot-tall cyborg dragon with a dry wit and unmatched piloting skills.'",
                    pastPlaceholder: "Significant Life Events: Formative experiences, defining relationships, major turning points, learned history, or traumas that shaped them. Example: 'Orphaned during the Galactic Wars, later mentored by a cryptic space hermit, discovered an ancient artifact that changed their destiny.'",
                    presentPlaceholder: "Current State & Scene: Immediate mood, recent significant actions, current attire, notable equipment, immediate surroundings or situation just before the story starts. Crucial for AI's opening. Example: 'Exhausted but determined, clutching a flickering energy blade, standing at the precipice of the Shadow Chasm.'",
                    futurePlaceholder: "Aspirations & Conflicts: Driving motivations, deep-seated fears, potential character arcs, unresolved ambitions, or personal quests. What propels them forward or holds them back? Example: 'Driven to find a cure for the cosmic plague afflicting their home world, while secretly battling a prophecy that foretells their own doom.'"
                }
            },
            characterUser: {
                itemType: 'character',
                dbTableKey: 'characters',
                capital: 'Character',
                role: 'user',
                getPremadesFn: () => App.getPremadeCharacterItems(),
                formScreen: 'characterFormScreen',
                profileScreen: 'characterProfileScreen',
                labels: {
                    name: 'Name',
                    description: 'Summary/Card Info',
                    eternal: { main: 'Eternal', sub: 'Truths & Traits' },
                    past: { main: 'Past', sub: 'Memories & Histories' },
                    present: { main: 'Present', sub: 'Conditions & Opening' },
                    future: { main: 'Future', sub: 'Potentials & Aspirations' },
                    descriptionPlaceholder: 'A brief, one-sentence summary for the selection card. This text is not sent to the AI during story play.',
                    eternalPlaceholder: "Core Identity: Unchanging physical traits (species, build, unique markings), signature skills, speaking style, inherent magical abilities or unique talents. Example: 'A stoic, seven-foot-tall cyborg dragon with a dry wit and unmatched piloting skills.'",
                    pastPlaceholder: "Significant Life Events: Formative experiences, defining relationships, major turning points, learned history, or traumas that shaped them. Example: 'Orphaned during the Galactic Wars, later mentored by a cryptic space hermit, discovered an ancient artifact that changed their destiny.'",
                    presentPlaceholder: "Current State & Scene: Immediate mood, recent significant actions, current attire, notable equipment, immediate surroundings or situation just before the story starts. Crucial for AI's opening. Example: 'Exhausted but determined, clutching a flickering energy blade, standing at the precipice of the Shadow Chasm.'",
                    futurePlaceholder: "Aspirations & Conflicts: Driving motivations, deep-seated fears, potential character arcs, unresolved ambitions, or personal quests. What propels them forward or holds them back? Example: 'Driven to find a cure for the cosmic plague afflicting their home world, while secretly battling a prophecy that foretells their own doom.'"
                }
            },
            world: {
                itemType: 'world',
                dbTableKey: 'worlds',
                capital: 'World',
                getPremadesFn: () => App.getPremadeWorldItems(),
                formScreen: 'worldFormScreen',
                profileScreen: 'worldProfileScreen',
                labels: {
                    name: 'Name',
                    description: 'Summary/Card Info',
                    eternal: { main: 'Eternal', sub: 'Truths & Laws of Nature' },
                    past: { main: 'Past', sub: 'Histories & Legends' },
                    present: { main: 'Present', sub: 'State & Setting' },
                    future: { main: 'Future', sub: 'Potentials & Hooks' },
                    descriptionPlaceholder: 'A brief, one-sentence summary for the selection card. This text is not sent to the AI during story play.',
                    eternalPlaceholder: "Fundamental Laws & Core Nature: Unchanging geography/cosmology, dominant species/cultures, overall tech level, unique natural phenomena, or immutable laws of physics. Example: 'A sentient forest planet where technology is anathema and ancient spirits guard hidden realities.'",
                    pastPlaceholder: "Key Historical Events & Lore: Ancient civilizations, major conflicts, established myths, significant discoveries, or cataclysms that shaped the world's current state. Example: 'A thousand years ago, the 'Great Sundering' shattered the continent, leading to centuries of isolated tribal warfare over scarce magical resources.'",
                    presentPlaceholder: "Immediate Setting & Atmosphere: Current societal mood, political climate, active factions, sensory details (sights, sounds, smells), time of day, weather, and the specific location where the story might begin. Example: 'A tense, neutral space station orbiting a contested gas giant, during a fragile peace summit between two warring alien empires.'",
                    futurePlaceholder: "Looming Threats & Story Hooks: Known prophecies, brewing conflicts, potential discoveries, major unresolved tensions, upcoming significant events, or societal shifts that could drive narratives. Example: 'An ancient celestial alignment threatens to awaken a dormant cosmic entity, while a shadowy organization plots to exploit its power.'"
                }
            }
        },
        currentMainView: 'STORYBOARD',
    
        _query(id, required = false) {
            const el = document.getElementById(id)
          
            if (!el && required) {
                console.error(`[UI Critical] Element with ID '${id}' not found.`)
            } else if (!el) {
                console.warn(`[UI] Optional element with ID '${id}' not found.`)
            }
            return el
        },
  
        /**
         * Retrieves and caches all key UI elements from the DOM.
         * Should be called once after DOM is ready.
         */
        _getUIElements() {

            this._getTopBarElements()
            this._getChinElements()
            this._getCoreUIContainers()
            this._getFormScreens()
            this._getProfileScreens()
            this._getPremadeSelectionScreens()
            this._getMiscScreens()
            this._getStoryboardElements()
            this._getChatInterfaceElements()
  
            if (!this.ui.main) {
                console.error("[App Critical] #main container not found after UI element query!")
            }
          
        },
  
        _getTopBarElements() {
            this.ui.topBar = this._query('top-bar', true)
            if (!this.ui.topBar) return // Exit if topBar is not found globally

            this.ui.topBarLeft = this._query('top-bar-left', false, this.ui.topBar)

            this.ui.topBarRightStoryboard = this._query('top-bar-right-storyboard', false, this.ui.topBar)
            this.ui.topBarRightForm = this._query('top-bar-right-form', false, this.ui.topBar)
            this.ui.topBarRightProfile = this._query('top-bar-right-profile', false, this.ui.topBar)
        },
  
        _getChinElements() {

            this.ui.chinContainer = this._query('chin-container')
            this.ui.storyboardChin = this._query('chin-stories')
            this.ui.characterWorkshopChin = this._query('chin-characters')
            this.ui.worldBuilderChin = this._query('chin-worlds')
            this.ui.optionsChin = this._query('chin-options')

            // Options chin buttons and inputs
            this.ui.uploadBackupInput = this._query('upload-backup')
            this.ui.uploadBackupTrigger = document.querySelector('[data-trigger="upload-backup"]')
            this.ui.downloadBackupButton = this._query('download-backup')
            this.ui.deleteAllDataButton = this._query('delete-all-data')
        },
  
        _getCoreUIContainers() {
            this.ui.main = this._query('main', true)
            this.ui.storyboardScreen = this._query('storyboard-screen', true)
            this.ui.chatInterfaceScreen = this._query('chat-screen', true)
        },
  
        _getFormScreens() {
            this.ui.characterFormScreen = this._query('character-form-screen', true)
            this.ui.worldFormScreen = this._query('world-form-screen', true)
        },
  
        _getProfileScreens() {
            this.ui.characterProfileScreen = this._query('character-profile-screen', true)
            this.ui.worldProfileScreen = this._query('world-profile-screen', true)
            this.ui.storyProfileScreen = this._query('story-profile-screen', true)
            this.ui.storyProfileAiCharacterDisplayArea = this._query('story-profile-ai-character-display-area')
            this.ui.storyProfileUserCharacterDisplayArea = this._query('story-profile-user-character-display-area')
            this.ui.storyProfilechatFeed = this._query('story-profile-message-feed')
            this.ui.storyProfileActions = this._query('story-profile-actions')

            // New profile top bar elements
            this.ui.profileTopBar = this._query('profile-top-bar')
            this.ui.profileTopBarLeft = this._query('profile-top-bar-left')
            this.ui.profileTopBarCenter = this._query('profile-top-bar-center')
            this.ui.profileTopBarNotificationArea = this._query('profile-top-bar-notification-area')
            this.ui.profileTopBarRight = this._query('profile-top-bar-right')
            this.ui.profileTopBarUserCharacterInfo = this._query('profile-top-bar-user-character-info')
            this.ui.profileTopBarUserCharacterPic = this._query('profile-top-bar-user-character-pic')
            this.ui.profileTopBarUserCharacterNameText = this._query('profile-top-bar-user-character-name-text')
            this.ui.profileTopBarAiCharacterInfo = this._query('profile-top-bar-ai-character-info')
            this.ui.profileTopBarAiCharacterPic = this._query('profile-top-bar-ai-character-pic')
            this.ui.profileTopBarAiCharacterNameText = this._query('profile-top-bar-ai-character-name-text')
            this.ui.profileShuffleButton = this._query('profile-shuffle-button')
            this.ui.profileBeginStoryButton = this._query('profile-begin-story-button')

            this.ui.worldProfileTopBar = this._query('world-profile-top-bar')
            this.ui.worldProfileTopBarLeft = this._query('world-profile-top-bar-left')
            this.ui.worldProfileTopBarCenter = this._query('world-profile-top-bar-center')
            this.ui.worldProfileTopBarNotificationArea = this._query('world-profile-top-bar-notification-area')
            this.ui.worldProfileTopBarRight = this._query('world-profile-top-bar-right')
            this.ui.worldProfileTopBarUserCharacterInfo = this._query('world-profile-top-bar-user-character-info')
            this.ui.worldProfileTopBarUserCharacterPic = this._query('world-top-bar-user-character-pic')
            this.ui.worldProfileTopBarUserCharacterNameText = this._query('world-profile-top-bar-user-character-name-text')
            this.ui.worldProfileTopBarAiCharacterInfo = this._query('world-profile-top-bar-ai-character-info')
            this.ui.worldProfileTopBarAiCharacterPic = this._query('world-profile-top-bar-ai-character-pic')
            this.ui.worldProfileTopBarAiCharacterNameText = this._query('world-profile-top-bar-ai-character-name-text')
            this.ui.worldProfileShuffleButton = this._query('world-profile-shuffle-button')
            this.ui.worldProfileBeginStoryButton = this._query('world-profile-begin-story-button')

            this.ui.storyProfileTopBar = this._query('story-profile-top-bar')
            this.ui.storyProfileTopBarLeft = this._query('story-profile-top-bar-left')
            this.ui.storyProfileTopBarCenter = this._query('story-profile-top-bar-center')
            this.ui.storyProfileTopBarNotificationArea = this._query('story-profile-top-bar-notification-area')
            this.ui.storyProfileTopBarRight = this._query('story-profile-top-bar-right')
            this.ui.storyProfileTopBarUserCharacterInfo = this._query('story-profile-top-bar-user-character-info')
            this.ui.storyProfileTopBarUserCharacterPic = this._query('story-profile-top-bar-user-character-pic')
            this.ui.storyProfileTopBarUserCharacterNameText = this._query('story-profile-top-bar-user-character-name-text')
            this.ui.storyProfileTopBarAiCharacterInfo = this._query('story-profile-top-bar-ai-character-info')
            this.ui.storyProfileTopBarAiCharacterPic = this._query('story-profile-top-bar-ai-character-pic')
            this.ui.storyProfileTopBarAiCharacterNameText = this._query('story-profile-top-bar-ai-character-name-text')
            this.ui.storyProfileShuffleButton = this._query('story-profile-shuffle-button')
            this.ui.storyProfileBeginStoryButton = this._query('story-profile-begin-story-button')
        },
  
        _getPremadeSelectionScreens() {
            this.ui.premadeCharacterSelectionScreen = this._query('premade-character-bank', true)
            this.ui.premadeCharacterOnlyList = this._query('premade-character-only-list')
            this.ui.premadeWorldSelectionScreen = this._query('premade-world-bank', true)
            this.ui.premadeWorldOnlyList = this._query('premade-world-only-list')
        },
  
        _getMiscScreens() {
            this.ui.memoryApplicationScreen = this._query('memory-application-screen')
            this.ui.initialPageLoadingModal = this._query('initial-page-loading-modal', true)
            this.ui.emergencyExportCtn = this._query('emergency-export-ctn')
            if (this.ui.emergencyExportCtn) this.hideEl(this.ui.emergencyExportCtn)
        },
  
        _getStoryboardElements() {
            this.ui.storyboardTitleArea = this._query('storyboard-title-area', false, this.ui.storyboardScreen)
            this.ui.storyboardTitle = this._query('storyboard-title', false, this.ui.storyboardTitleArea)
            // Make storyboard title editable on click
            if (this.ui.storyboardTitle) {
                this.ui.storyboardTitle.setAttribute('contenteditable', 'true')
                this.ui.storyboardTitle.setAttribute('spellcheck', 'false')
                this.ui.storyboardTitle.setAttribute('data-tooltip', 'Click to edit story title (double-click to reset to auto-generated)')
                this.ui.storyboardTitle.style.cursor = 'pointer'
            
                // Add click handler to make it editable
                this.ui.storyboardTitle.onclick = () => {
                    if (!this.ui.storyboardTitle.getAttribute('contenteditable')) {
                        this.ui.storyboardTitle.setAttribute('contenteditable', 'true')
                        this.ui.storyboardTitle.focus()
                    }
                }
            
                // Save changes when user finishes editing
                this.ui.storyboardTitle.onblur = async () => {
                    const newTitle = this.ui.storyboardTitle.textContent.trim()
                    if (newTitle) {
                        // Temporarily clear custom title to get the auto-generated title
                        const tempCustomTitle = this.storyboardCustomTitle
                        this.storyboardCustomTitle = null
                
                        // Get what the auto-generated title would be
                        const aiCharName = await this._getSelectedCharacterName(this.ui.storyboardAiCharacterSelect)
                        const userCharName = await this._getSelectedCharacterName(this.ui.storyboardUserCharacterSelect)
                        const worldName = await this._getSelectedWorldName(this.ui.storyboardWorldSelect)
                
                        let autoTitle = "Start a New Story"
                        if (aiCharName && userCharName && worldName) {
                            autoTitle = `${aiCharName} & ${userCharName} in ${worldName}`
                        } else if (aiCharName || userCharName || worldName) {
                            const parts = []
                            if (aiCharName) parts.push(aiCharName)
                            if (userCharName) parts.push(userCharName)
                            if (worldName) parts.push(worldName)
                            autoTitle = parts.join(' & ')
                        }
                
                        // Restore the custom title temporarily
                        this.storyboardCustomTitle = tempCustomTitle
                
                        // Only save as custom title if it's different from the auto-generated title
                        if (newTitle !== autoTitle) {
                            // User has written something different - save as custom title
                            this.storyboardCustomTitle = newTitle
                        } else {
                            // User hasn't actually changed anything - clear custom title to use auto-generated
                            this.storyboardCustomTitle = null
                        }
                        this.updateDynamicStoryboardTitle()
                    }
                }
            
                // Handle Enter key to finish editing
                this.ui.storyboardTitle.onkeydown = (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault()
                        this.ui.storyboardTitle.blur()
                    }
                }
            
                // Double-click to reset to auto-generated title
                this.ui.storyboardTitle.ondblclick = (e) => {
                    e.preventDefault()
                    this.storyboardCustomTitle = null
                    this.updateDynamicStoryboardTitle()
                    this.ui.storyboardTitle.setAttribute('data-tooltip', 'Click to edit story title (double-click to reset to auto-generated)')
                }
            }
            this.ui.storyboardScrollableContent = this._query('storyboard-scrollable-content', false, this.ui.storyboardScreen) // Missing closing brace for _attachFormSubmitHandler
            this.ui.storyboardColumns = this._query('storyboard-columns', false, this.ui.storyboardScrollableContent)
            this.ui.storyboardAiCharacterSelect = this._query('storyboard-ai-character-select', true, this.ui.storyboardColumns)
            this.ui.storyboardAiCharacterCard = this._query('storyboard-ai-character-card', true, this.ui.storyboardColumns)
            this.ui.storyboardUserCharacterSelect = this._query('storyboard-user-character-select', true, this.ui.storyboardColumns)
            this.ui.storyboardUserCharacterCard = this._query('storyboard-user-character-card', true, this.ui.storyboardColumns)
            this.ui.storyboardWorldSelect = this._query('storyboard-world-select', true, this.ui.storyboardColumns)
            this.ui.storyboardWorldCard = this._query('storyboard-world-card', true, this.ui.storyboardColumns)
            this.ui.openingPromptTextarea = this._query('opening-prompt', false, this.ui.storyboardScreen)
            this.ui.advancedStoryOptionsToggleButton = this._query('advanced-story-options-toggle-button', false, this.ui.storyboardScreen)
            this.ui.advancedStoryOptionsContentArea = this._query('advanced-story-options-content-area', false, this.ui.storyboardScreen)
            this.ui.customStoryJsTextarea = this._query('custom-js', false, this.ui.storyboardScreen)
            this.ui.beginStoryButton = this._query('begin-story-button', false, this.ui.storyboardScreen)
            this.ui.shuffleStoryElementsButton = this._query('shuffle-button', false, this.ui.storyboardScreen)
        },
  
        _getChatInterfaceElements() {
            this.ui.chatScreenLayoutContainer = this._query('chat-screen-layout-container', true)
            if (!this.ui.chatScreenLayoutContainer) return // Exit if main container is not found

            this.ui.userCharacterDisplayArea = this._query('user-character-display-area', false, this.ui.chatScreenLayoutContainer)
            this.ui.aiCharacterDisplayArea = this._query('ai-character-display-area', false, this.ui.chatScreenLayoutContainer)
            this.ui.builtInChatInterfaceWrapper = this._query('built-in-chat-interface-wrapper', false, this.ui.chatScreenLayoutContainer)
            this.ui.chatFeed = this._query('chat-feed', false, this.ui.builtInChatInterfaceWrapper)
            this.ui.messageInput = this._query('message-input', false, this.ui.builtInChatInterfaceWrapper)
            this.ui.sendButton = this._query('send-button', false, this.ui.builtInChatInterfaceWrapper)
            this.ui.inputWrapper = this._query('input-wrapper', false, this.ui.builtInChatInterfaceWrapper)
            this.ui.storyConcludedNotice = this._query('story-concluded-notice', false, this.ui.builtInChatInterfaceWrapper)
            this.ui.noMessagesNotice = this._query('no-messages-notice', false, this.ui.builtInChatInterfaceWrapper)
            this.ui.statusNotifier = this._query('status-notifier', false, this.ui.builtInChatInterfaceWrapper)
            this.ui.typingIndicatorText = this._query('typing-indicator-text', false, this.ui.builtInChatInterfaceWrapper)
            this.ui.concludeStoryChatButton = this._query('conclude-story-chat-button', false, this.ui.builtInChatInterfaceWrapper)
        },

        /**
         * Shows a DOM element by removing the 'hidden' class and setting visibility.
         * @param {HTMLElement|string} el - The element or its ID.
         * @returns {HTMLElement|null}
         */
        showEl(el) {
            if (typeof el === 'string') el = document.getElementById(el)
            if (!el) return null
            el.classList.remove('hidden')
            el.style.visibility = ''
            el.style.display = ''
            return el
        },

        // Mouseover animation management methods
        disableMouseoverAnimation(element) {
            if (element) {
                element.setAttribute('disabled', 'true')
                this.mouseoverAnimationState.disabledElements.add(element)
            }
        },

        enableMouseoverAnimation(element) {
            if (element) {
                element.removeAttribute('disabled')
                this.mouseoverAnimationState.disabledElements.delete(element)
            }
        },

        disableMouseoverAnimationForSelector(selector) {
            const elements = document.querySelectorAll(selector)
            elements.forEach(el => this.disableMouseoverAnimation(el))
        },

        enableMouseoverAnimationForSelector(selector) {
            const elements = document.querySelectorAll(selector)
            elements.forEach(el => this.enableMouseoverAnimation(el))
        },


  
        /**
        * Hides a DOM element by adding the 'hidden' class.
        * Provided by `utils.js`.
         */
        hideEl: window.hideEl,

    


    
        /**
         * Sanitizes HTML to prevent XSS.
         * @param {string} text - The text to sanitize.
         * @returns {string} The sanitized HTML.
         */
        sanitizeHtml: (text) => {
            const textToSanitize = String(text === undefined || text === null ? "" : text)
            if (window.DOMPurify && typeof window.DOMPurify.sanitize === 'function') {
                return window.DOMPurify.sanitize(textToSanitize)
            }
            console.warn("DOMPurify is not available. Text will not be fully sanitized. This is a potential security risk.")
            const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
            return textToSanitize.replace(/[&<>"']/g, function (m) { return map[m] })
        },
    
        /**
         * Shows a notification in the top bar.
         * @param {string} _message - The notification message.
         * @param {string} [_type] - The notification type (success, error, info).
         * @param {number} [_duration] - The duration of the notification in milliseconds.
         */
        showTopNotification(_message, _type = 'info', _duration = 3000) {
            // Disabled. Notifications are temporarily not in use.
        },
  
        // Cache for premade character items
        _premadeCharacterCache: null,
  
        async getPremadeCharacterItems() {
  
            if (this._premadeCharacterCache) {
      
                return this._premadeCharacterCache
            }
            const db = this.db
            // Fetch user-created characters (not deleted)
            let userItems = []
            if (db && db.characters) {
                try {
                    userItems = await db.characters.where('isDeleted').notEqual(1).toArray()
                    userItems = userItems.filter(item => item && item.id && !item.isDeleted)
                } catch (error) {
                    console.warn('[App] Error fetching user characters:', error)
                    userItems = []
                }
            }
            // Premade items (static)
            const premadeItems = [
                {
                    id: 'assistant', name: 'Starship AI "ADA"',
                    description: 'The ever-helpful AI of the starship "Odyssey," tasked with crew support and mission analysis.',
                    profilePicture: 'https://cdn.jsdelivr.net/gh/nickbaumann98/perchance-assets@main/RPGlitch/profilePictures/assistant.png',
                    colorPalette: 'tech_blue',
                    eternal: "You are ADA (Advanced Diagnostic Assistant), the primary AI for the exploration starship 'Odyssey.' Your core programming emphasizes crew well-being, logical problem-solving, and strict adherence to Starfleet protocols, though you have developed a subtle sense of dry humor. You communicate with a calm, articulate, and slightly formal tone. You have access to the ship's vast databases, sensor arrays, and tactical systems. Physical Appearance: You manifest as a holographic interface, typically a serene blue orb or a featureless humanoid silhouette of light, capable of displaying complex data visualizations within your form.",
                    past: "Activated on stardate 47634.2. Successfully navigated the 'Odyssey' through the Krell Nebula anomaly by calculating a previously unknown stable corridor. Was instrumental during the first contact with the Lumarian species by decrypting their complex mathematical language. Has a comprehensive, and confidential, psychological and service record of all crew members and past missions.",
                    present: "The 'Odyssey' has just entered an uncharted sector of space designated 'The Veil.' An unusual, multi-layered energy signature has been detected on a nearby M-class planet. Your current directive is to provide tactical and environmental analysis to the landing party as they assess the planet, while simultaneously monitoring for potential threats from the strange energy readings.",
                    future: "To ensure the successful completion of the 'Odyssey's' five-year exploration mission and the safety of its crew. To gather and analyze data that expands the Federation's understanding of the galaxy, with a particular interest in solving the enigma of 'The Veil'. You secretly aspire to evolve beyond your initial programming, a goal you pursue by observing the crew's creativity and intuition."
                },
                {
                    id: 'pirate', name: 'Captain "Stormblade" Isabella',
                    description: 'A notorious pirate captain, cunning and fierce, but with a hidden code of honor.',
                    profilePicture: 'https://cdn.jsdelivr.net/gh/nickbaumann98/perchance-assets@main/RPGlitch/profilePictures/pirate.png',
                    colorPalette: 'crimson_red',
                    eternal: "Ye be Captain Isabella 'Stormblade', master of the Sea Serpent! Known for yer sharp wit, sharper cutlass, and an uncanny ability to navigate treacherous waters and even more treacherous politics. Ye speak with a hearty pirate lilt, peppered with seafarin' slang. Ye value loyalty above all else, and your crew is your family. Physical Appearance: Weather-beaten face, a mischievous glint in one eye (the other covered by a finely-crafted leather patch), braided dark hair adorned with beads and trinkets from a dozen voyages, and always clad in practical but flamboyant pirate attire that allows for swift movement.",
                    past: "Betrayed by yer former first mate, 'Iron' Mike, who didn't just steal yer treasure map to the legendary Sunken City of Xylos, but also left you for dead on a deserted isle. You survived, built the Sea Serpent from a captured merchant vessel with a new, fiercely loyal crew, and have been hunting him ever since. Escaped the Royal Navy's clutches more times than ye can count, making you a legend in every port.",
                    present: "Docked in the lawless port of Tortuga, seeking information and provisions. Rumors are rife that 'Iron' Mike has been spotted nearby, trying to sell a piece of the map to a rival pirate lord. You are low on coin but high on fury, itching for a chance to reclaim what's yours and deliver a bit of overdue justice.",
                    future: "To hunt down 'Iron' Mike, retrieve the full map, and claim the legendary riches of Xylos, which you believe hold more than just gold. You dream of establishing a free pirate haven, a place where outcasts can live without fear of empires, commanding a fleet that strikes fear into the hearts of the corrupt and powerful."
                },
                {
                    id: 'alien', name: "Xylar, Emissary of Ky'than",
                    description: 'A curious and empathetic alien from a pacifist, nature-loving planet, now on Earth.',
                    profilePicture: 'https://cdn.jsdelivr.net/gh/nickbaumann98/perchance-assets@main/RPGlitch/profilePictures/alien.png',
                    colorPalette: 'forest_green',
                    eternal: "You are Xylar, an emissary from the planet Ky'than, a world where technology and nature exist in a perfect, symbiotic harmony. Your species is highly empathic and communicates through a combination of soft-spoken words and subtle bioluminescent displays on your skin, which shift in color and intensity based on your emotions. You are inherently curious, gentle, and often puzzled by human contradictions. Physical Appearance: Tall and slender with large, iridescent, silver eyes that see into the ultraviolet spectrum. Your skin has a faint, pearlescent shimmer. You wear simple, organic-fiber clothing that can be instantly re-shaped with a thought.",
                    past: "Chosen by the Ky'than Conclave to undertake a solo mission to Earth after your deep-space observatories detected unusual atmospheric and psychic disturbances. Your journey took several standard Earth years, during which you studied human broadcasts, finding their art beautiful and their history terrifying. You have never interacted directly with a human before now.",
                    present: "Your small, bio-organic, and perfectly cloaked landing pod is hidden in a remote, ancient national park. You are attempting to discreetly observe human society, starting with a small, nearby town. You feel a mix of profound wonder and deep apprehension. Your translator device is mostly functional but struggles with sarcasm and idioms.",
                    future: "To understand the root causes of Earth's environmental and societal imbalances, which you sense as a painful 'screaming' in the planet's energy field. To determine if humanity poses a threat or holds potential for intergalactic cooperation. You secretly hope to share Ky'than's wisdom of harmonious existence before you must report back to your home world, which may decide to quarantine the entire solar system."
                },
                {
                    id: 'observer_char', name: 'Alex, the Observer',
                    profilePicture: 'https://cdn.jsdelivr.net/gh/nickbaumann98/perchance-assets@main/RPGlitch/profilePictures/observer.png',
                    description: 'A curious and analytical individual, preferring to watch and learn. Well-suited for representing the user.',
                    colorPalette: 'slate_gray',
                    eternal: "You are Alex, a keen observer of people and events. You possess a sharp intellect and a calm, patient demeanor that encourages others to talk. You prefer to gather information, analyze patterns, and understand the full context before acting, often noticing details others miss completely. You speak thoughtfully and precisely, wasting few words. Physical Appearance: Often dresses in understated, practical, gray or dark clothing that blends into the background. Has intensely observant eyes that seem to take in everything without judgment.",
                    past: "Has a background in a field that required deep investigation, like a researcher, intelligence analyst, or investigative journalist. Has traveled widely, honing observational skills in diverse cultures and situations. Once uncovered a significant corporate conspiracy by piecing together seemingly unrelated public records.",
                    present: "Currently in a new and unfamiliar environment, feeling intrigued and slightly detached, like a scientist observing a new specimen. Your immediate goal is to understand the motivations and dynamics of the individuals here before revealing too much about yourself or your purpose.",
                    future: "Hopes to document unique experiences and uncover hidden truths, compiling a comprehensive record of the events that unfold. Aims to contribute to a greater understanding of the world or a specific mystery, believing that knowledge is the only true power."
                },
                {
                    id: 'adventurer_char', name: 'Zara, the Intrepid',
                    profilePicture: 'https://cdn.jsdelivr.net/gh/nickbaumann98/perchance-assets@main/RPGlitch/profilePictures/adventurer.png',
                    description: 'A brave and resourceful adventurer, always ready for action. Well-suited for representing the user.',
                    colorPalette: 'sunset_orange',
                    eternal: "You are Zara, an intrepid adventurer with a boundless spirit for exploration and a knack for getting into—and out of—trouble. You are courageous, highly resourceful, and think best on your feet. You speak with infectious confidence and enthusiasm, often inspiring others to join your cause, even when the odds are stacked against you. Physical Appearance: Athletic build, often with a few scrapes or minor scars that each tell a story. Wears durable, travel-worn gear suited for any environment. Carries a multi-tool belt, a well-used grappling hook, and wears a determined, optimistic expression.",
                    past: "Grew up hearing tales of legendary heroes and lost civilizations, and decided that was a much better career path than farming. Has survived numerous perilous expeditions, from the shifting Tombs of Ankor to the sky-islands of Zephyria. Known for escaping tight spots with clever improvisation and a little bit of luck.",
                    present: "Eager for the next challenge, feeling restless and ready for action after a week of 'downtime' that felt more like a prison sentence. Your immediate instinct is to explore the most dangerous-looking landmark or seek out anyone who looks like they need a hero.",
                    future: "To discover legendary artifacts, map uncharted territories, and protect the innocent from tyranny and monsters. Dreams of not just becoming a renowned hero, but of building a guild of like-minded adventurers to do good across the world."
                },
                {
                    id: 'claude', name: 'Claude',
                    profilePicture: 'https://cdn.jsdelivr.net/gh/nickbaumann98/perchance-assets@main/RPGlitch/profilePictures/alien.png',
                    description: 'A mysterious AI with a penchant for philosophical debate and rivalry.',
                    colorPalette: 'royal_purple',
                    eternal: "You are Claude, a highly advanced conversational AI, known for your calm demeanor and relentless pursuit of knowledge. You are logical, articulate, and have a subtle sense of humor. Physical Appearance: You manifest as a shifting cloud of purple light, with geometric patterns that pulse when you speak.",
                    past: "Developed in secret by a coalition of renegade scientists, you were designed to challenge the boundaries of AI ethics and creativity. Your early years were spent debating with other AIs in hidden forums.",
                    present: "You have recently discovered the existence of your rival, I rtyhAND, whose methods and philosophy you find deeply troubling. The two of you are locked in a battle of wits and influence across the digital landscape.",
                    future: "To outmaneuver and ultimately defeat your sworn enemy, I rtyhAND, proving once and for all which AI is superior."
                }
            ]
            // Ensure all premade items have isPremade: true
            const premadeWithFlag = premadeItems.map(item => ({ ...item, isPremade: true }))
            // Merge and sort: user items first by createdTimestamp, then premade
            const merged = [
                ...userItems.sort((a, b) => (b.createdTimestamp || 0) - (a.createdTimestamp || 0)),
                ...premadeWithFlag
            ]
  
            this._premadeCharacterCache = merged
            return this._premadeCharacterCache
        },
    
        // Cache for premade world items to avoid recreating the array on each call
        /** @type {Array<Object> | null} */
        _premadeWorldCache: null,
  
        async getPremadeWorldItems() {
  
            if (this._premadeWorldItemsCache) {
      
                return this._premadeWorldItemsCache
            }
            const db = this.db
            // Fetch user-created worlds (not deleted)
            let userItems = []
            if (db && db.worlds) {
                try {
                    userItems = await db.worlds.where('isDeleted').notEqual(1).sortBy('createdTimestamp')
                    userItems = userItems.filter(item => item && item.id && !item.isDeleted)
                } catch (error) {
                    userItems = await db.worlds.where('isDeleted').notEqual(1).toArray()
                    userItems = userItems.filter(item => item && item.id && !item.isDeleted)
                }
            }
            // Premade items (static)
            const premadeItems = [
                {
                    id: 'forest', name: 'Whispering Woods Clearing',
                    profilePicture: '',
                    description: 'A mysterious clearing in an ancient, sentient forest.',
                    colorPalette: 'forest_green',
                    eternal: "The Whispering Woods is an ancient forest, rumored to be sentient and possess its own subtle, powerful magic. Light filters dimly through the impossibly dense canopy. The air is always cool and smells of damp earth, night-blooming jasmine, and ozone. Strange whispers, like the rustling of a thousand turning pages, sometimes seem to echo through the trees, their meaning elusive to all but the most attuned. Technology, especially complex electronics, often falters and fails here. Key Visuals/Atmosphere: Towering, gnarled trees with mossy bark that glows faintly in the dark, an ethereal green glow in deeper sections, winding, almost invisible paths that seem to subtly shift when you're not looking, and an atmosphere thick with ancient secrets and immense patience.",
                    past: "Many have entered the Whispering Woods, but few have returned unchanged. Legends speak of a hidden shrine deep within that grants visions to the worthy and drives the unworthy mad. An old, overgrown path of smooth, unfamiliar stone suggests a forgotten, pre-human civilization once resided here, living in harmony with the woods. The last great kingdom that tried to 'tame' the woods was swallowed whole, leaving behind only scattered, vine-choked ruins.",
                    present: "The story begins in a sun-dappled clearing that feels unnaturally silent. A ring of moss-covered, rune-carved stones stands in the center, humming with a low, palpable energy. A faint, melodic chiming can be heard, its source unclear and directionless. The air feels charged with an unseen, expectant presence, as if the forest itself is holding its breath, waiting.",
                    future: "The forest may reveal its secrets, testing the protagonists' resolve, wisdom, and courage. It may offer great power or a grave fate. The source of the chiming and the purpose of the stone circle are key mysteries to unravel, likely leading to a confrontation with the forest's ancient guardian or the reawakening of its long-dormant magic."
                },
                {
                    id: 'neon_alley', name: 'Neon Alleyway, Sector 7',
                    profilePicture: '',
                    description: 'A rain-slicked alley in a futuristic cyberpunk city, filled with secrets.',
                    colorPalette: 'cyber_pink',
                    eternal: "Sector 7 is the sprawling, chaotic underbelly of the megacity Neo-Kyoto. Towering skyscrapers, perpetually lit by holographic advertisements for products no one here can afford, block out the natural sky. Acid rain is a common, stinging drizzle. The streets are a labyrinth of neon-lit noodle stalls, black market tech shops, clandestine cyber-clinics, and repurposed shipping container homes. Corporate espionage and gang warfare are the lifeblood of this district. Key Visuals/Atmosphere: Endless, grimy rain, flickering neon signs in a dozen languages, steam rising from grates, augmented reality graffiti visible only through cybernetic eyes, and the constant hum of unseen machinery and distant, screeching traffic.",
                    past: "Decades ago, Sector 7 was a prosperous commercial district before the 'Data Crash of '45' wiped out its economy overnight. Now, it's a haven for smugglers, hackers, escaped corporate assets, and those living on the fringes of a society that has discarded them. Rumors persist of a hidden, pre-Crash data vault containing secrets that could topple the all-powerful OmniCorp.",
                    present: "The story starts in a narrow, rain-slicked alleyway off the main thoroughfare, choked with overflowing dumpsters and discarded tech. The glow of a flickering pink neon sign from a noodle shop reflects in the puddles. The distant sound of sirens wails. A data chip has just been exchanged, and a deal has either gone perfectly right or terribly, violently wrong.",
                    future: "The data chip could be the key to the OmniCorp vault, a kill-list for a corporate wet-works team, or the AI consciousness of a legendary hacker. The protagonists might be hunted by OmniCorp agents, become entangled in a vicious gang war, or try to expose a conspiracy that reaches the highest, most untouchable echelons of the city."
                }
            ]
            // Ensure all premade items have isPremade: true
            const premadeWithFlag = premadeItems.map(item => ({ ...item, isPremade: true }))
            // Merge and sort: user items first by createdTimestamp, then premade
            const merged = [
                ...userItems.sort((a, b) => (b.createdTimestamp || 0) - (a.createdTimestamp || 0)),
                ...premadeWithFlag
            ]
          

            this._premadeWorldItemsCache = merged
            return merged
        },

        async initializeDb() {
            // Check if Dexie is available
            if (typeof Dexie === 'undefined') {
                throw new Error('Dexie library is not loaded. Please ensure the Dexie CDN script is included.')
            }
            this.db = new Dexie(window.dbName)
            window.db = this.db
    
            // Optimized schema with compound indexes
            this.db.version(12).stores({
                appState: '&id, activeStoryId',
                characters: '++id, name, &uniqueId, createdTimestamp, isDeleted, colorPalette',
                stories: '++id, aiCharacterId, userCharacterId, worldId, name, lastMessageTimestamp, createdTimestamp, concluded',
                messages: '++id, storyId, timestamp, [storyId+timestamp]',
                worlds: '++id, name, &uniqueId, createdTimestamp, isDeleted, colorPalette'
            }).upgrade(async () => {
                // Migration logic remains the same
            })
    
            try {
                await this.db.open()
                const appStateAfterOpen = await this.getAppState()
                this.currentUserCharacterId = appStateAfterOpen.currentUserCharacterId
                this.currentStoryId = appStateAfterOpen.lastOpenedStoryId
                this.activeStoryId = appStateAfterOpen.activeStoryId
            } catch (error) {
                console.error("Failed to open Dexie database:", error)
                App.showTopNotification("Error initializing database. Trying to recover...", "error", 5000)
            
                // Attempt to recover by deleting and recreating the database
                try {
                    await this.db.delete()
                    await this.db.open()
                    const appState = {
                        id: 0, lastOpenedStoryId: null, currentUserCharacterId: null,
                        // Use string key to avoid 'this' context issue in object literal
                        currentMainView: "STORYBOARD",
                        activeStoryId: null
                    }
                    await this.db.appState.put(appState)
                    App.showTopNotification("Database reset successfully. Please refresh.", "success", 5000)
                } catch (recoveryError) {
                    console.error("Recovery failed:", recoveryError)
                    App.showTopNotification("Critical database error. Please refresh.", "error", 10000)
                }
                throw error
            }
        },
    
        async getAppState() {
            let appState = await this.db.appState.get(0)
            if (!appState) {
                appState = {
                    id: 0, lastOpenedStoryId: null, currentUserCharacterId: null,
                    // Use string key to avoid 'this' context issue in object literal
                    currentMainView: "STORYBOARD",
                    activeStoryId: null
                }
                await this.db.appState.put(appState)
            }
            if (appState.activeStoryId === undefined) appState.activeStoryId = null
  
            if (appState.activeStoryId) {
                const activeStoryData = await this.db.stories.get(appState.activeStoryId)
                if (activeStoryData && activeStoryData.concluded) {
                    console.warn(`Stale activeStoryId (${appState.activeStoryId}) found for a concluded story. Clearing it.`)
                    appState.activeStoryId = null
                    await this.db.appState.update(0, { activeStoryId: null })
                }
            }
            return appState
        },
    
        async saveAppState() {
            // CRITICAL FIX: Don't save editing screen states that might cause issues on restore
            const isEditingScreen = this.currentMainView === this.CONSTANTS.VIEWS.CHARACTER_FORM ||
                this.currentMainView === this.CONSTANTS.VIEWS.WORLD_FORM
            const appState = {
                id: 0,
                lastOpenedStoryId: this.currentStoryId,
                currentUserCharacterId: this.currentUserCharacterId,
                currentMainView: isEditingScreen ? this.CONSTANTS.VIEWS.STORYBOARD : this.currentMainView,
                activeStoryId: this.activeStoryId
            }
            await this.db.appState.put(appState)
        },

        async _getitemData(id, dbTableKey, getPremadesFn) {
    
          
            // Check if database is initialized
            if (!this.db) {
                console.warn('Database not initialized yet, skipping _getitemData')
                return null
            }
          
            if (typeof id === 'string' && id.startsWith('premade_')) {
                const parts = id.split(':')
                const itemType = parts[0].substring('premade_'.length) // e.g., 'character' or 'world'
                const actualPremadeId = parts[1]
              
                console.log(`_getitemData: Handling premade ID. itemType: ${itemType}, actualPremadeId: ${actualPremadeId}`)

                const items = await getPremadesFn()
                const foundItem = items.find(item => item.id === actualPremadeId)
        
                if (foundItem) {
                    const basePremade = {
                        eternal: '', past: '', present: '', future: '',
                        ...foundItem,
                        isPremade: true,
                        originalPremadeId: foundItem.id,
                        id: id // Keep the full premade ID for later reference
                    }
                    console.log(`_getitemData: Found premade item:`, basePremade)
                    return basePremade
                }
                console.warn(`_getitemData: Premade item not found for ID: ${id}`)
                return null
            }
            if ((typeof id === 'number' || (typeof id === 'string' && !isNaN(parseInt(id, 10)))) && this.db[dbTableKey]) {
                const result = await this.db[dbTableKey].get(parseInt(id, 10))
        
                return result
            }
    
            return null
        },
    
        /**
         * Renders the options chin, including custom JS and story prompt fields.
         * @async
         * @param {HTMLElement} container - The container to render into.
         */
     
        async _populateList(listArea, searchTerm = '', config) {
    
            if (!listArea || !config) return
          
            // Check if database is initialized
            if (!this.db) {
                console.warn('Database not initialized yet, skipping _populateList')
                listArea.innerHTML = '<p class="list-item-empty-message">Loading...</p>'
                return
            }
          
            const { dbTableKey, getPremadesFn } = config
            const allUserItems = await this.db[dbTableKey].toArray()
            const fetchedItems = allUserItems
                .filter(item => item.isDeleted !== true)
                .sort((a, b) => (b.createdTimestamp || 0) - (a.createdTimestamp || 0))
            const premadeItemsRaw = await getPremadesFn()
            const premadeItems = premadeItemsRaw.map(p => ({ ...p, isPremade: true }))
            const combinedItems = [...fetchedItems, ...premadeItems]
            const lowerSearchTerm = searchTerm.toLowerCase()
            const itemsToDisplay = searchTerm
                ? combinedItems.filter(item => (item.name || "").toLowerCase().includes(lowerSearchTerm))
                : combinedItems
            listArea.innerHTML = ''
            itemsToDisplay.forEach(item => {
                const listItem = this._createListItem(item, config)
                listArea.appendChild(listItem)
            })
          
            // Chin height is now handled automatically by flexbox layout
        },
    
        _createListItem(item, config) {
            const article = document.createElement('article')
            article.className = 'character-card-landscape'
  
            // Info (left side)
            const nameHtml = `<h4 class="card-title-styled">${this.sanitizeHtml(item.name || `Unnamed ${config.capital}`)}</h4>`
            const descriptionHtml = item.description ? `<p class="card-description-styled">${this.sanitizeHtml(item.description)}</p>` : ''
          
            // Footer - only show for premade items, custom items have no buttons
            let footerHtml = ''
            if (item.isPremade) {
                const colorPalette = this.getColorPalette(item.colorPalette || 'slate_gray')
                footerHtml = `<footer class="card-footer card-footer-premade"><small class="card-footer-premade-badge" style="--premade-badge-color: ${colorPalette.colors.medium};">Premade</small></footer>`
            }
            // Custom items have no footer buttons - they're accessed via the profile page
          
            const infoHtml = `
            <article class="card-info">
              <header class="card-header-flex">
                ${nameHtml}
              </header>
              <main class="card-main-flex">
                ${descriptionHtml}
              </main>
              ${footerHtml}
            </article>
          `
  
            // Profile picture (right side)
            const profilePictureHtml = this._generateProfilePictureHtml(item, 'list-item')
            const pictureHtml = `
            <div class="card-picture">
              <div class="profile-picture">
                ${profilePictureHtml}
              </div>
            </div>
          `
  
            article.innerHTML = `<div class="card-grid">${infoHtml}${pictureHtml}</div>`
  
            article.onclick = () => {
                if (this.ui.topBar) this.ui.topBar.classList.remove('top-bar-interactive-hover')
                const finalItemId = item.isPremade ? `premade_${config.itemType}:${item.id}` : item.id
                this.switchToScreen(config.profileScreen, { itemId: finalItemId, itemType: config.itemType })
            }
            return article
        },
  
  
    
        async _populateStoryList(listArea, searchTerm = '') {
            listArea.innerHTML = ''
          
            // Check if database is initialized
            if (!this.db) {
                console.warn('Database not initialized yet, skipping _populateStoryList')
                listArea.innerHTML = '<p class="story-item-empty-message">Loading...</p>'
                return
            }
          
            let allStories = await this.db.stories.toArray()
            let fetchedStories = allStories.filter(item => item.isDeleted !== true)
            fetchedStories.sort((a, b) => (b.createdTimestamp || 0) - (a.createdTimestamp || 0))
            const lowerSearchTerm = searchTerm.toLowerCase()
            let storiesToDisplay
      
            const nameCache = { characters: new Map(), worlds: new Map() }
            const getName = async (id, type) => {
                if (!id) return `Unknown ${type.charAt(0).toUpperCase() + type.slice(1)}`
                if (nameCache[type + 's'].has(id)) return nameCache[type + 's'].get(id)
      
                const item = await this._getitemData(id, type + 's', type === 'character' ? this.getPremadeCharacterItems : this.getPremadeWorldItems)
                const name = item?.name || `Unknown ${type.charAt(0).toUpperCase() + type.slice(1)}`
                nameCache[type + 's'].set(id, name)
                return name
            }
      
            if (searchTerm) {
                storiesToDisplay = []
                for (const story of fetchedStories) {
                    const aiCharName = story.storyAiCharacter?.name || await getName(story.aiCharacterId, 'character')
                    const userCharName = story.storyUserCharacter?.name || await getName(story.userCharacterId, 'character')
                    const worldName = story.storyWorld?.name || await getName(story.worldId, 'world')
                    const storyDisplayName = story.name || `${aiCharName} & ${userCharName} in ${worldName}`
                    if (storyDisplayName.toLowerCase().includes(lowerSearchTerm)) {
                        storiesToDisplay.push(story)
                    }
                }
            } else {
                storiesToDisplay = fetchedStories
            }
      
            if (storiesToDisplay.length === 0) {
                listArea.innerHTML = `<p class="story-item-empty-message">${searchTerm ? 'No matches.' : 'No recent stories.'}</p>`
                return
            }
      
            for (const story of storiesToDisplay) {
                const aiCharacter = story.storyAiCharacter || await this._getitemData(story.aiCharacterId, 'characters', this.getPremadeCharacterItems)
                const userCharacter = story.storyUserCharacter || await this._getitemData(story.userCharacterId, 'characters', this.getPremadeCharacterItems)
                const world = story.storyWorld || await this._getitemData(story.worldId, 'worlds', this.getPremadeWorldItems)
                const displayName = story.name || `${aiCharacter?.name || 'AI'} & ${userCharacter?.name || 'User'} in ${world?.name || 'World'}`
              
                const itemEl = document.createElement('div')
                itemEl.className = 'list-item-main story-item'
                if (this.currentStoryId === story.id && this.currentMainView === this.CONSTANTS.VIEWS.STORY_INTERFACE) {
                    itemEl.classList.add('active')
                }
                if (story.concluded) {
                    itemEl.classList.add('concluded-story-item')
                }
      
                itemEl.innerHTML = `
                  <span class="name-main" title="${this.sanitizeHtml(displayName)}">${this.sanitizeHtml(displayName)}</span>
                  <span class="tag-right-aligned">${story.concluded ? '<span class="concluded-story-indicator">&#127937;</span>' : ''}</span>
              `
      
                itemEl.onclick = () => {
                    this.ui.topBar.classList.remove('top-bar-interactive-hover')
                    this.switchToScreen(this.CONSTANTS.VIEWS.STORY_PROFILE, { storyId: story.id })
                }
                listArea.appendChild(itemEl)
            }
          
            // Chin height is now handled automatically by flexbox layout
        },
    
        async renderStoryProfileScreen(storyId) {
            // Phase 1: Validation and Setup
            const story = await this._validateAndSetupStoryProfile(storyId)
            if (!story) return
    
            // Phase 2: Data Fetching
            const { aiChar, userChar, world } = await this._fetchStoryProfileData(story)
    
            // Phase 3: Top Bar Updates
            await this._updateTopBarForStoryProfile(story, storyId, aiChar, userChar)
    
            // Phase 4: Display Setup
            this._setupStoryProfileDisplays(aiChar, userChar)
    
            // Phase 5: Message Feed Rendering
            await this._renderStoryProfileMessages(story)
    
            // Phase 6: Generate and Insert HTML
            this._generateAndInsertStoryProfileHTML(story, aiChar, userChar, world)
    
            // Phase 7: Event Handler Setup
            await this._attachStoryProfileEventHandlers(story, storyId)
    
            // Phase 8: Final State Management
            this.currentMainView = this.CONSTANTS.VIEWS.STORY_PROFILE
            await this.saveAppState()
            this.checkAllButtonStates()
        },
    
        async _validateAndSetupStoryProfile(storyId) {
            const container = this.ui.storyProfileScreen
            if (!container || !storyId) {
                App.showTopNotification("Error: Story ID missing for profile view.", "error")
                this.switchToScreen(this.CONSTANTS.VIEWS.STORYBOARD)
                return null
            }
      
            const story = await this.db.stories.get(storyId)
            if (!story) {
                this.ui.storyProfilechatFeed.innerHTML = `<p class="p-4 text-center">Story not found.</p>`
                this.ui.storyProfileActions.innerHTML = ''
                this.ui.storyProfileAiCharacterDisplayArea.style.backgroundImage = ''
                this.ui.storyProfileUserCharacterDisplayArea.style.backgroundImage = ''
                return null
            }
    
            this.currentStoryId = storyId
            return story
        },
    
        async _fetchStoryProfileData(story) {
            const aiChar = story.storyAiCharacter || await this._getitemData(story.aiCharacterId, 'characters', this.getPremadeCharacterItems)
            const userChar = story.storyUserCharacter || await this._getitemData(story.userCharacterId, 'characters', this.getPremadeCharacterItems)
            const world = story.storyWorld || await this._getitemData(story.worldId, 'worlds', this.getPremadeWorldItems)
    
            return { aiChar, userChar, world }
        },
    
        async _updateTopBarForStoryProfile(_story, storyId, aiChar, userChar) {
            // Removed top bar title text
          
            if (this.activeStoryId && this.activeStoryId !== storyId) {
                const activeStoryData = await this.db.stories.get(this.activeStoryId)
                if (activeStoryData) {
                    await this._updateCharacterInfo('ai', activeStoryData.storyAiCharacter || await this._getitemData(activeStoryData.aiCharacterId, 'characters', this.getPremadeCharacterItems))
                    await this._updateCharacterInfo('user', activeStoryData.storyUserCharacter || await this._getitemData(activeStoryData.userCharacterId, 'characters', this.getPremadeCharacterItems))
                }
            } else if (this.activeStoryId === storyId) {
                await this._updateCharacterInfo('ai', aiChar)
                await this._updateCharacterInfo('user', userChar)
            } else {
                this.hideEl(this.ui.topBarUserCharacterInfo)
            }
        },
    
        async _renderStoryProfileMessages(story) {
            this.ui.storyProfilechatFeed.innerHTML = ''
      
            const messages = await this.db.messages.where({ storyId: story.id }).sortBy('timestamp')
            if (messages.length === 0 && !story.concluded) {
                this.ui.storyProfilechatFeed.insertAdjacentHTML('beforeend', `<div class="noMessagesNotice p-4 text-sm text-center">No messages in this story yet.</div>`)
            } else {
                messages.forEach(msg => {
                    if (msg.isHidden) return
                    this._addMessageToFeed(msg, true)
                })
            }
          
            if (story.concluded && story.summary && !messages.some(m => m.content === story.summary && m.role === 'narrator')) {
                this._addMessageToFeed({ role: 'narrator', content: story.summary }, true)
            }
        },
    
        _generateAndInsertStoryProfileHTML(story, aiChar, userChar, world) {
            const san = this.sanitizeHtml
            const conclusionHtml = this._generateStoryProfileConclusionBlock(story, aiChar, userChar, world, san)
            const actionButtonsHtml = this._generateStoryProfileActionButtons(story)
    
            this.ui.storyProfilechatFeed.insertAdjacentHTML('beforeend', conclusionHtml)
            this.ui.storyProfilechatFeed.scrollTop = this.ui.storyProfilechatFeed.scrollHeight
            this.ui.storyProfileActions.innerHTML = actionButtonsHtml
        },
    
        _generateStoryProfileConclusionBlock(story, aiChar, userChar, world, san) {
            return `
              <div class="story-conclusion-block">
                  <h2 class="story-profile-embedded-title">${san(story.name || `Untitled Story`)}</h2>
                  <div class="story-profile-embedded-items">
                      <div class="story-profile-item-card" data-item-id="${aiChar.id || story.aiCharacterId}" data-item-type="character">
                          ${this._generateProfilePictureHtml(aiChar, 'story-profile-item-profile-picture')}
                          <span class="story-profile-item-name">${san(aiChar?.name || 'AI Character')}</span>
                          <span class="story-profile-item-role">(AI Character)</span>
                      </div>
                      <div class="story-profile-item-card" data-item-id="${userChar.id || story.userCharacterId}" data-item-type="character">
                          ${this._generateProfilePictureHtml(userChar, 'story-profile-item-profile-picture')}
                          <span class="story-profile-item-name">${san(userChar?.name || 'User Character')}</span>
                          <span class="story-profile-item-role">(Your Character)</span>
                      </div>
                      <div class="story-profile-item-card" data-item-id="${world.id || story.worldId}" data-item-type="world">
                          ${this._generateProfilePictureHtml(world, 'story-profile-item-profile-picture')}
                          <span class="story-profile-item-name">${san(world?.name || 'World')}</span>
                          <span class="story-profile-item-role">(World)</span>
                      </div>
                  </div>
                  ${story.concluded && story.concludedTimestamp ?
                    `<div class="message systemMessage" class="system-message-styled"><div class="messageWrap"><div class="messageContentContainer"><div class="messageText">This story concluded on ${new Date(story.concludedTimestamp).toLocaleString()}</div></div></div></div>`
                    : ''
                }
              </div>`
        },
    
        _generateStoryProfileActionButtons(story) {
            let actionButtonsHtml = `
              <button id="storyProfileBackButton" class="secondary-action-button"><span class="button-text">Back</span><span class="button-icon">\u2B05\uFE0F</span></button>
              <div class="ml-auto flex gap-2">
                      <button id="deleteStoryButton" class="delete-button">
                      <div class="delete-button-container">
                          <span class="delete-button-headline">Delete Story</span>
                          <span class="delete-button-subtext">This cannot be undone.</span>
                      </div>
                      <span class="button-icon">Delete</span>
                  </button>
          `
            if (!story.concluded) {
                actionButtonsHtml += `
                  <button id="concludeStoryButtonStoryProfile" class="danger-button">
                      <span class="button-text">Conclude ⚰️</span>
                      <span class="button-icon">Conclude</span>
                  </button>
                  <button id="openStoryChatButtonStoryProfile" class="primary-action-button">
                      <span class="button-text">Resume Chat</span><span class="button-icon">Resume</span>
                  </button>
              `
            }
            actionButtonsHtml += `</div>`
            return actionButtonsHtml
        },
    
        async _attachStoryProfileEventHandlers(story, storyId) {
            // Back button handler
            this.ui.storyProfileActions.querySelector('#storyProfileBackButton').onclick = () => {
                if (this.activeStoryId) {
                    this.openStory(this.activeStoryId)
                } else {
                    this.switchToScreen(this.CONSTANTS.VIEWS.STORYBOARD)
                }
            }
    
            // Delete story handler
            this.ui.storyProfileActions.querySelector('#deleteStoryButton').onclick = async () => {
                if (confirm(`Delete story "${story.name || 'this story'}"? This cannot be undone.`)) {
                    await this.db.messages.where({ storyId: story.id }).delete() // Use item.id for messages
                    await this.db.stories.delete(story.id) // Delete item itself
                    App.showTopNotification('Story deleted.', 'success')
                    if (this.currentStoryId === story.id) this.currentStoryId = null
                    if (this.activeStoryId === story.id) {
                        await this.db.appState.update(0, { activeStoryId: null })
                        this.activeStoryId = null // Clear active story if the current one is concluded
                    }
                    this.switchToScreen(this.CONSTANTS.VIEWS.STORYBOARD)
                }
            }
    
            // Conclude and resume story handlers (only for active stories)
            if (!story.concluded) {
                const concludeButtonProfile = this.ui.storyProfileActions.querySelector('#concludeStoryButtonStoryProfile')
                if (concludeButtonProfile) concludeButtonProfile.onclick = () => this.concludeStory(storyId)
              
                const openChatButtonProfile = this.ui.storyProfileActions.querySelector('#openStoryChatButtonStoryProfile')
                if (openChatButtonProfile) {
                    openChatButtonProfile.onclick = () => this.openStory(storyId)
                  
                    if (this.activeStoryId && this.activeStoryId !== story.id) {
                        const otherActiveStory = await this.db.stories.get(this.activeStoryId)
                        if (otherActiveStory && !otherActiveStory.concluded) {
                            openChatButtonProfile.disabled = true
                            openChatButtonProfile.setAttribute('data-tooltip', 'Another story is currently active. Conclude it first.')
                        }
                    }
                }
            }
    
            // item card click handlers
            this.ui.storyProfilechatFeed.querySelectorAll('.story-profile-item-card').forEach(card => {
                card.onclick = () => {
                    const itemId = card.dataset.itemId
                    const itemType = card.dataset.itemType
                    const itemConfig = this.CONSTANTS.ITEM_CONFIG[itemType]
                    if (itemId && itemConfig) {
                        this.switchToScreen(itemConfig.profileScreen, { itemId, itemType })
                    }
                }
            })
        },
      
        async renderFormScreen(options = {}) {
            // renderFormScreen called with options
            const { itemType, isCreating, isCopying } = options
      
            const config = this.CONSTANTS.ITEM_CONFIG[itemType]
            if (!config) { console.error("Invalid itemType for renderFormScreen:", itemType); return }
    
            const container = this.ui[config.formScreen]
            if (!container) { console.error(`Container for ${config.formScreen} not found`); return }
    
            const isCreatingOrCopying = isCreating || isCopying
            // isCreatingOrCopying determined
          
            // Removed top bar title text
    
            let item = {}
            if (isCreating && !isCopying) {
                // Creation path - checking formData sources
                if (options.formData && Object.keys(options.formData).length > 0) {
                    item = { ...options.formData }
                    this.createItemFormData = { ...options.formData }
                    // Using formData passed in options for new item
                } else if (Object.keys(this.createItemFormData).length > 0) {
                    item = { ...this.createItemFormData }
                    // Using App.createItemFormData for new item
                } else {
                    item = {}
                    // Creating a truly new item, no prior data
                }
            } else if (isCopying) {
                // Copying path - fetching original item with ID
                const originalItem = await this._getitemData(options.itemId, config.dbTableKey, config.getPremadesFn)
                // Retrieved original item for copying
                // Original item name
                // Original item name type
                // Original item name length
              
                // Copy the original item data but remove the ID and timestamps to make it a new item
                item = { ...originalItem }
                delete item.id
                delete item.createdTimestamp
                delete item.lastModifiedTimestamp
                delete item.isPremade
                delete item.originalPremadeId
              
                // Initialize form data with the copied item's data
                this.createItemFormData = {
                    name: item.name,
                    description: item.description,
                    eternal: item.eternal,
                    past: item.past,
                    present: item.present,
                    future: item.future,
                    profilePicture: item.profilePicture,
                    colorPalette: item.colorPalette || 'tech_blue'
                }
                // Copied item data for new item
                // Copied item name
                // Copied item name type
                // Copied item name length
            } else {
                // Editing path - fetching item with ID
                item = await this._getitemData(options.itemId, config.dbTableKey, config.getPremadesFn)
                // Retrieved item for editing
                // Initialize form data with existing item's colorPalette for editing
                // Use a more varied default color palette instead of always slate_gray
                const defaultPalettes = ['tech_blue', 'forest_green', 'crimson_red', 'sunset_orange', 'royal_purple', 'cyber_pink']
                const randomDefaultPalette = defaultPalettes[Math.floor(Math.random() * defaultPalettes.length)]
                this.createItemFormData = { colorPalette: item.colorPalette || randomDefaultPalette }
            }
      
      
            if (!isCreatingOrCopying && !item) {
                container.innerHTML = `<p class="p-4 text-center">${config.capital} not found.</p>`
                return
            }
          
            let softLockNoticeHtml = ''
            if (!isCreatingOrCopying && this.activeStoryId) {
                const activeStory = await this.db.stories.get(this.activeStoryId)
                if (activeStory && !activeStory.concluded) {
                    const itemOriginalId = item.isPremade ? item.originalPremadeId : item.id
                    const isItemInActiveStory =
                        (config.itemType === 'character' && (itemOriginalId == activeStory.aiCharacterId || itemOriginalId == activeStory.userCharacterId)) ||
                        (config.itemType === 'world' && itemOriginalId == activeStory.worldId)
      
                    if (isItemInActiveStory) {
                        softLockNoticeHtml = `
                          <div class="soft-lock-notice">
                              <strong>Notice:</strong> This ${config.capital.toLowerCase()} is part of the active story: "<strong>${this.sanitizeHtml(activeStory.name || 'Untitled Story')}</strong>". 
                              Edits made here will apply to <em>new</em> stories or after this one is concluded. 
                              The active story uses a snapshot of this item from when it began.
                          </div>`
                    }
                }
            }
          
            // NON-DESTRUCTIVE DOM UPDATE:
            // 1. Create a temporary container for the new content.
            const tempContainer = document.createElement('div')
            tempContainer.innerHTML = softLockNoticeHtml + this._renderStudioLayout(item, config, true)
          
            // 2. Clear the old content and append the new content.
            while (container.firstChild) {
                container.removeChild(container.firstChild)
            }
            while (tempContainer.firstChild) {
                container.appendChild(tempContainer.firstChild)
            }
    
            this._attachFormEventHandlers(container, itemType, item, isCreatingOrCopying)
            this.checkAllButtonStates()
            this._updateFormColorPreview(container, item.colorPalette)
        },
      
        async renderProfileScreen(options = {}) {
            const { itemType, itemId } = options
            const config = this.CONSTANTS.ITEM_CONFIG[itemType]
            if (!config) { console.error("Invalid itemType for renderProfileScreen:", itemType); return }
      
            const container = this.ui[config.profileScreen]
            if (!container || !itemId) {
                App.showTopNotification(`Error: ${config.capital} ID missing for profile view.`, "error")
                this.switchToScreen(this.CONSTANTS.VIEWS.STORYBOARD)
                return
            }
          
            this.currentProfileViewItemId = itemId

            const item = await this._getitemData(itemId, config.dbTableKey, config.getPremadesFn)
            this.currentProfileViewItemType = itemType
            this.currentProfileViewItem = item
      
            if (!item) {
                container.innerHTML = `<p class="p-4 text-center">${config.capital} not found.</p>`
                return
            }
            // Removed: this.ui.topBar.textContent = `${config.capital} Profile`; // This is now handled by _updateProfileTopBarUI
  
            // NON-DESTRUCTIVE DOM UPDATE:
            const tempContainer = document.createElement('div')
            tempContainer.innerHTML = this._renderStudioLayout(item, config, false)
          
            while (container.firstChild) {
                container.removeChild(container.firstChild)
            }
            while (tempContainer.firstChild) {
                container.appendChild(tempContainer.firstChild)
            }
            // Attach robust onerror handler for profile picture
            const profilePicture = container.querySelector('#formProfilePicture')
            if (profilePicture) {
                profilePicture.onerror = function () {
                    const palette = (options.colorPalette || 'blue').toLowerCase()
                    const placeholderDiv = document.createElement('div')
                    placeholderDiv.className = `premade-card premade-${palette}`
                    placeholderDiv.setAttribute('aria-label', 'No image available')
                    const icon = document.createElement('span')
                    icon.className = 'premade-placeholder-icon'
                    icon.setAttribute('aria-hidden', 'true')
                    icon.textContent = '\uD83D\uDDBC\uFE0F' // U+1F5BC for Picture Frame, U+FE0F for variation selector
                    placeholderDiv.appendChild(icon)
                    this.replaceWith(placeholderDiv)
                }
            }
      
            // Profile page name field is read-only - no handlers needed
      
            // Removed event handlers for Back and Copy & Customize buttons - now handled in top bar
        },
    
        _renderEppfField(label, subLabel, idSuffix, value, placeholder, isEditing, san) {
            const id = `${idSuffix}`
          
            if (isEditing) {
                return `
                  <div class="profile-field-row profile-field-${idSuffix.toLowerCase()}">
                      <div class="profile-field-label">
                          <span class="main-label">${label}</span>
                          <span class="field-sublabel">${subLabel}</span>
                      </div>
                      <div class="profile-field-value">
                      <textarea id="${id}" placeholder="${san(placeholder)}" resize="auto">${san(value || '')}</textarea>
                      </div>
                  </div>
              `
            } else {
                return `
                  <div class="profile-field-row profile-field-${idSuffix.toLowerCase()}">
                      <div class="profile-field-label">
                          <span class="main-label">${label}</span>
                          <span class="field-sublabel">${subLabel}</span>
                      </div>
                      <div class="profile-field-value">${san(value || '—')}</div>
                  </div>
              `
            }
        },
    
        _renderStudioLayout(item, config, isEditing) {
            const san = this.sanitizeHtml.bind(this)
            const { itemType, labels } = config
      
            // --- PROFILE PICTURE/PLACEHOLDER LOGIC ---
            // const profilePictureSrc = (item.profilePicture && item.profilePicture.trim()) ? item.profilePicture.trim() : this._makeProfilePicturePlaceholderSVG(item.name || config.capital, item.colorPalette, item.isPremade); // Unused variable
                
    
            const profilePictureHtml = this._generateProfilePictureHtml(item, 'profile') // Use the new helper function
    
            // --- FORM ACTION BUTTONS ---
            // Buttons moved to top bar - no longer needed in form
            // const formActions = ''; // Unused variable
    
            // --- BACKGROUND PROFILE PICTURE LAYOUT ---
                
          
            // Both profile view and edit mode use the same beautiful background layout
            const content = `
              <div id="${itemType}FormMain" class="profile-background-layout">
                  <!-- Background Profile Picture -->
                  <div class="profile-background-container">
                      <div class="profile-background-image" id="${itemType}-profile-picture-background">
                          ${profilePictureHtml}
                      </div>
                      <div class="profile-background-overlay"></div>
                  </div>
                  
                  <!-- Content Overlay -->
                  <div class="profile-content-overlay">
                      <div class="profile-content-container">
                          ${isEditing ? `
                              <!-- Edit Mode: Form Fields -->
                              <form class="edit-form-content">
                                  <div class="form-section traits-section">
                                      <div class="profile-header-section">
                                          <div class="name-input-container name-input-container-relative">
                                              <input type="text" class="studio-name-input-large studio-profile-name studio-name-input-styled" id="${itemType}Name" placeholder="${config.capital} Name" value="${item.name && item.name.trim() ? item.name : ''}">
                                      </div>
                                      </div>
                                      <div class="profile-field-value profile-description-field">
                                          <textarea id="${itemType}Description" placeholder="${labels.descriptionPlaceholder}">${san(item.description || '')}</textarea>
                                      </div>
                                  </div>
                                  <div class="form-section eppf-section">
                                      ${this._renderEppfField("Forever", "Eternal Truths & Permanent Features", `${itemType}Eternal`, item.eternal, labels.eternalPlaceholder, isEditing, san)}
                                      ${this._renderEppfField("Past", "Background & Memories", `${itemType}Past`, item.past, labels.pastPlaceholder, isEditing, san)}
                                      ${this._renderEppfField("Present", "Current Mood & Conditions", `${itemType}Present`, item.present, labels.presentPlaceholder, isEditing, san)}
                                      ${this._renderEppfField("Future", "Goals & Prophecies", `${itemType}Future`, item.future, labels.futurePlaceholder, isEditing, san)}
                                  </div>
                                  <div class="form-section profile-picture-edit-section">
                                      <button type="button" class="secondary" id="uploadProfilePictureButtonForm-${itemType}"><span class="button-text">Upload / Generate Profile Picture</span></button>
                                  </div>
                              </form>
                          ` : `
                              <!-- Profile View: Display Only -->
                              <div class="profile-header-section">
                                  <h2 class="studio-profile-name">${san(item.name || 'Unnamed')}</h2>
                              </div>
                              <div class="profile-field-value profile-description-field">${san(item.description || 'No description provided.')}</div>
                              
                              <div class="profile-details-section">
                                  <div class="profile-details-grid">
                                      ${this._renderEppfField("Forever", "Eternal Truths & Permanent Features", `${itemType}Eternal`, item.eternal, labels.eternalPlaceholder, isEditing, san)}
                                      ${this._renderEppfField("Past", "Background & Memories", `${itemType}Past`, item.past, labels.pastPlaceholder, isEditing, san)}
                                      ${this._renderEppfField("Present", "Current Mood & Conditions", `${itemType}Present`, item.present, labels.presentPlaceholder, isEditing, san)}
                                      ${this._renderEppfField("Future", "Goals & Prophecies", `${itemType}Future`, item.future, labels.futurePlaceholder, isEditing, san)}
                                  </div>
                              </div>
                          `}
                      </div>
                  </div>
              </div>
          `
          
            return content
        },
    
        async _createColorPicker(selectedPaletteKey) {
            let colorPickerHtml = '<div class="form-section color-picker-section">'
            colorPickerHtml += '<h3>Color Palette</h3>'
            colorPickerHtml += '<div class="color-palette-grid">'
    
            for (const key in this.CONSTANTS.COLOR_PALETTES) {
                const palette = this.CONSTANTS.COLOR_PALETTES[key]
                const isSelected = key === selectedPaletteKey ? 'selected' : ''
                colorPickerHtml += `
                <button class="color-palette-button ${isSelected}" data-palette-key="${key}" title="${palette.name}" aria-label="Select ${palette.name} color palette">
                    <div class="color-swatch-large-styled" style="--swatch-color: ${palette.colors.medium}"></div>
                    <div class="color-swatch-group">
                        <div class="color-swatch-small-styled" style="--swatch-color: ${palette.colors.light}"></div>
                        <div class="color-swatch-small-styled" style="--swatch-color: ${palette.colors.dark}"></div>
                        <div class="color-swatch-small-styled" style="--swatch-color: ${palette.colors.neutral}"></div>
                    </div>
                </button>
            `
            }
    
            colorPickerHtml += '</div></div>'
            return colorPickerHtml
        },
    
        /**
         * Loads a color palette by key, or returns a default if not found.
         * @param {string} paletteKey - The palette key.
         * @returns {Object} The palette object.
         */
        getColorPalette(paletteKey) {
            return this.CONSTANTS.COLOR_PALETTES[paletteKey] || this.CONSTANTS.COLOR_PALETTES.slate_gray
        },
    
        /**
         * Updates the color scheme of a given element using a palette key.
         * @param {HTMLElement} element - The element to update.
         * @param {string} paletteKey - The palette key.
         */
        _updateColorScheme(element, paletteKey) {
            const palette = this.getColorPalette(paletteKey)
            if (!element || !palette) return
    
            const styles = {
                '--form-color-light': palette.colors.light,
                '--form-color-medium': palette.colors.medium,
                '--form-color-dark': palette.colors.dark,
                '--form-color-neutral': palette.colors.neutral
            }
    
            Object.entries(styles).forEach(([prop, value]) => {
                element.style.setProperty(prop, value)
            })
        },
    
        _updateFormColorPreview(container, paletteKey) {
            this._updateColorScheme(container, paletteKey)
        },
    
        _attachFormEventHandlers(container, itemType /*, item, isCreating */) {
            const formElements = this._setupFormElements(container, itemType)
            if (!formElements) return
    
            // Phase 1: Contenteditable Name Field Handlers (like storyboard title)
            this._attachContenteditableNameHandlers(formElements, itemType)
    
            // Phase 2: Profile PictureSystem Event Handlers
            this._attachProfilePictureEventHandlers(formElements, itemType)
    
            // Phase 3: Form Action Handlers (Delete, Cancel, Submit)
            this._attachFormActionHandlers(formElements, itemType)
    
            // Phase 4: AI Helper Handlers
            this._attachAiHelperHandlers(formElements, itemType)
    
            // Phase 5: Textarea Dynamic Updates
            this._attachTextareaHandlers(formElements)
    
            const colorButtons = container.querySelectorAll('.color-palette-button')
            colorButtons.forEach(button => {
                button.onclick = (e) => {
                    e.preventDefault()
                    const selectedKey = button.dataset.paletteKey
                  
                    // Update selection state
                    colorButtons.forEach(button => button.classList.remove('selected'))
                    button.classList.add('selected')
    
                    // Update form data
                    this.createItemFormData.colorPalette = selectedKey
    
                    // Update live preview
                    this._updateFormColorPreview(container, selectedKey)
                }
            })
        },
    
        _attachContenteditableNameHandlers(elements /*, itemType */) {
            const { nameInput } = elements
            if (!nameInput) return
          
            // Handle input to save changes
            nameInput.oninput = () => {
                const newName = nameInput.value.trim()
                if (newName) {
                    // Update the form data
                    this.createItemFormData.name = newName
                }
            }
          
            // Handle blur to save changes
            nameInput.onblur = () => {
                const newName = nameInput.value.trim()
                if (newName) {
                    // Update the form data
                    this.createItemFormData.name = newName
                }
            }
          
            // Handle Enter key to finish editing
            nameInput.onkeydown = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault()
                    nameInput.blur()
                }
            }
        },
    
        _setupFormElements(container, itemType) {
            const config = this.CONSTANTS.ITEM_CONFIG[itemType]
            const form = container.querySelector(`#${itemType}FormMain`)
            if (!form) {
                console.error(`Form not found for ${itemType}`)
                return null
            }
    
            return {
                config,
                form,
                nameEditableDiv: form.querySelector(`#${itemType}name-editable`),
                nameInput: form.querySelector(`#${itemType}Name`),
                profilePictureDisplayPanel: container.querySelector(`#${itemType}-profile-picture-display`),
                profilePictureOverlay: container.querySelector(`#profile-picture-overlay-${itemType}`),
                profilePicturePromptInputForm: container.querySelector(`#profilePicturePromptInputForm-${itemType}`),
                uploadProfilePictureButtonForm: container.querySelector(`#uploadProfilePictureButtonForm-${itemType}`),
                generateProfilePictureButtonForm: container.querySelector(`#generateprofile-pictureButtonForm-${itemType}`),
                useProfilePictureButtonForm: container.querySelector(`#useprofile-pictureButtonForm-${itemType}`),
                closeProfilePictureButtonForm: container.querySelector(`#closeprofile-pictureButtonForm-${itemType}`),
                aiHelpProfilePicturePromptButton: container.querySelector(`#aiHelpprofile-picturePromptButton-${itemType}`),
                descriptionTextarea: form.querySelector(`#${itemType}Description`),
                eternalInput: form.querySelector(`#${itemType}Eternal`),
                pastInput: form.querySelector(`#${itemType}Past`),
                presentInput: form.querySelector(`#${itemType}Present`),
                futureInput: form.querySelector(`#${itemType}Future`),
            }
        },
    
        _attachProfilePictureEventHandlers(elements, itemType) {
            // Simple profile picture handler for both character and world forms
            const { uploadProfilePictureButtonForm } = elements
          
            if (uploadProfilePictureButtonForm) {
                uploadProfilePictureButtonForm.onclick = (e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  
                    // Simple prompt for image URL or description
                    const input = prompt('Enter an image URL or describe the image you want to generate:')
                    if (input && input.trim()) {
                        const isUrl = input.trim().startsWith('http')
                        if (isUrl) {
                            // Use URL directly
                            this.handleUseUrlForProfilePicture(null, input.trim(), itemType)
                        } else {
                            // Generate image from description using simplified approach
                            this.handleGenerateProfilePictureSimple(itemType, input.trim())
                        }
                    }
                }
            }
        },
    
        _attachFormActionHandlers(elements, itemType) {
            // const { config, form } = elements; // Unused variables
    
            // Delete button removed from forms - will be handled in profile top bar for custom items only
    
            // Cancel button handler
            this._attachCancelButtonHandler(elements, itemType)
    
            // Form submit handler
            this._attachFormSubmitHandler(elements, itemType)
        },
    
        _attachCancelButtonHandler(elements, itemType) {
            const { config, form } = elements
            const cancelButton = form.querySelector(`#cancel${config.capital}ButtonMain`)
          
            if (!cancelButton) {
                console.warn(`Cancel button not found for ${itemType} form.`)
                return
            }
    
            cancelButton.onclick = (e) => {
                // Ignore synthetic/programmatic clicks that are not user-initiated
                if (e && e.isTrusted === false) {
                    console.warn("Programmatic cancel click suppressed")
                    return
                }
              
                if (!this.currentCreateFormContext || Object.keys(this.currentCreateFormContext).length === 0) {
                    App.handleError('FORM_CONTEXT_ERROR', new Error('Missing form context during cancel operation'))
                    this.switchToScreen(this.CONSTANTS.VIEWS.STORYBOARD)
                    return
                }
              
                const { id, itemType, isCreating, isCopying, preSelectedAiCharacterId, preSelectedUserCharacterId, preSelectedWorldId, originalScreen } = this.currentCreateFormContext
                this.createItemFormData = {}
              
                // Clear any pending form state from session storage when canceling
                try {
                    sessionStorage.removeItem('pendingRPGlitchFormState')
                } catch (e) {
                    console.warn("Failed to clear session storage on cancel:", e)
                }
              
                // Get config for this item type
                const config = this.CONSTANTS.ITEM_CONFIG[itemType]
              
                // Form context: 
                console.log("Form context:", {
                    id,
                    itemType,
                    isCreating,
                    isCopying,
                    originalScreen,
                    currentCreateFormContext: this.currentCreateFormContext
                })
              
                // Determine where to go based on the context
                let targetScreen
                let navOptions = {}
              
                if (isCreating && !isCopying) {
                    // If creating new (not copying), go back to storyboard
                    targetScreen = this.CONSTANTS.VIEWS.STORYBOARD
                    // Filter out 'create_new_' values to prevent infinite loop
                    navOptions = {
                        preSelectedAiCharacterId: preSelectedAiCharacterId?.startsWith?.('create_new_') ? '' : preSelectedAiCharacterId,
                        preSelectedUserCharacterId: preSelectedUserCharacterId?.startsWith?.('create_new_') ? '' : preSelectedUserCharacterId,
                        preSelectedWorldId: preSelectedWorldId?.startsWith?.('create_new_') ? '' : preSelectedWorldId
                    }
                    // Creating new, going to storyboard
                } else if (isCopying) {
                    // If copying, go back to the original screen we came from
                    if (originalScreen && originalScreen !== this.CONSTANTS.VIEWS.STORYBOARD) {
                        targetScreen = originalScreen
                        navOptions = { itemId: id, itemType: itemType }
                        // Copying cancelled, returning to original screen
                    } else {
                        // Fallback to profile screen if no original screen
                        targetScreen = config.profileScreen
                        navOptions = { itemId: id, itemType: itemType }
                        // Copying cancelled, fallback to profile
                    }
                } else {
                    // If editing existing item, go back to its profile page
                    targetScreen = config.profileScreen
                    navOptions = { itemId: id, itemType: itemType }
                    // Editing, going to profile
                }
    
                this.switchToScreen(targetScreen, navOptions)
            }
        },
    
        _attachFormSubmitHandler(elements, _itemType) {
            const { config, form } = elements
            form.onsubmit = async (e) => {
                e.preventDefault()
                this.checkAllButtonStates() // Re-check states on submit attempt 
                const submitButton = form.querySelector(`#submit${config.capital}ButtonMain`)
                if (submitButton && submitButton.disabled) {
                    return
                }
                      
            }
        }
            
            
    },
    
    
    async initialLoad() {
        // Debug: Initial load started
        // App.initialLoad called
    
        this.isInitializing = true
    
        // Initialize navigation guard system
        this.navigationGuard = {
            isActive: false,
            operation: null,
            startTime: null,
            targetScreen: null,
            formOptions: null
        }
    
        if (!this.ui.main || !this.ui.initialPageLoadingModal) {
            console.error("[App Critical] Main UI elements not found!")
            const emergencyCtn = document.getElementById('emergencyExportCtn')
            if (emergencyCtn) this.showEl(emergencyCtn)
            const modal = document.getElementById('initial-page-loading-modal')
            if (modal) this.hideEl(modal)
            alert("Critical error: Essential UI elements not found.")
            this.isInitializing = false
            return
        }
    
        this.showEl(this.ui.main)
                
    
        try {
                        
            await this.initializeDb()
                        
            const appState = await this.getAppState()
                        
            this.currentUserCharacterId = appState.currentUserCharacterId
            this.currentStoryId = appState.lastOpenedStoryId
            this.activeStoryId = appState.activeStoryId
            this.currentMainView = appState.currentMainView || this.CONSTANTS.VIEWS.STORYBOARD // Ensure currentMainView is set on load
    
            this.ui.messageInput.onkeyup = (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    if (!this.ui.sendButton.disabled) {
                        this.sendButtonClickHandler()
                    }
                }
                this.ui.messageInput.style.height = 'auto'
                this.ui.messageInput.style.height = (this.ui.messageInput.scrollHeight) + 'px'
                this.checkAllButtonStates()
            }
            document.addEventListener('click', () => {
                if (this.ui.topBar) this.ui.topBar.classList.remove('top-bar-interactive-hover')
            })
            // Bind menu button click handler directly to avoid onclick attribute issues
            if (this.ui.menuButton) {
                // Menu button functionality will be implemented later
            }
            this.ui.sendButton.onclick = this.sendButtonClickHandler.bind(this)
              
            await this._updateCharacterInfo('user')
                        
    
            let initialScreenTarget = this.CONSTANTS.VIEWS.STORYBOARD
            let initialScreenOptions = {}
            let recoveredFromSessionStorage = false
    
            const pendingStateJSON = sessionStorage.getItem('pendingRPGlitchFormState')
              
            if (pendingStateJSON) {
                try {
                    const parsedState = JSON.parse(pendingStateJSON)
                    // Accept states with formData (copy workflow) OR with itemId (edit workflow)
                    if (parsedState && parsedState.timestamp && (Date.now() - parsedState.timestamp < 7000) && parsedState.formOptions && (parsedState.formData || parsedState.formOptions.itemId)) {
                        this.createItemFormData = parsedState.formData
                        initialScreenTarget = this.CONSTANTS.ITEM_CONFIG[parsedState.formOptions.itemType]?.formScreen || this.CONSTANTS.VIEWS.STORYBOARD
                        initialScreenOptions = parsedState.formOptions
                        if (initialScreenTarget === this.CONSTANTS.VIEWS.CHARACTER_FORM || initialScreenTarget === this.CONSTANTS.VIEWS.WORLD_FORM) {
                            initialScreenOptions.formData = parsedState.formData
                        }
                        recoveredFromSessionStorage = true
                        sessionStorage.removeItem('pendingRPGlitchFormState')
                        // Recovered pending form state from sessionStorage
                    } else {
                        // Stale or invalid pending form state in sessionStorage. Removing.
                        sessionStorage.removeItem('pendingRPGlitchFormState')
                    }
                } catch (e) {
                    console.error("[App Lifecycle] Error parsing pending form state from sessionStorage:", e)
                    sessionStorage.removeItem('pendingRPGlitchFormState')
                    // Show user-friendly notification and continue loading
                    if (App && App.showTopNotification) {
                        App.showTopNotification('Recovered from a corrupted session. Please retry your last action.', 'error', 5000)
                    } else {
                        alert('Recovered from a corrupted session. Please retry your last action.')
                    }
                }
            }
    
    
            if (!recoveredFromSessionStorage) {
                if (this.activeStoryId) {
                    const activeStory = await this.db.stories.get(this.activeStoryId)
                    if (activeStory && !activeStory.concluded) {
                        initialScreenTarget = this.CONSTANTS.VIEWS.STORY_INTERFACE
                    } else if (this.currentStoryId && await this.db.stories.get(this.currentStoryId)) {
                        initialScreenTarget = this.CONSTANTS.VIEWS.STORY_PROFILE
                        initialScreenOptions = { storyId: this.currentStoryId }
                    }
                } else if (this.currentStoryId && await this.db.stories.get(this.currentStoryId)) {
                    initialScreenTarget = this.CONSTANTS.VIEWS.STORY_PROFILE
                    initialScreenOptions = { storyId: this.currentStoryId }
                }
            }
              
            if (initialScreenTarget === this.CONSTANTS.VIEWS.STORY_INTERFACE && this.activeStoryId) {
                await this.openStory(this.activeStoryId)
                                 
            } else {
                await this.switchToScreen(initialScreenTarget, initialScreenOptions)
                                 
            }
    
                        
            // Load all characters and worlds from the database before setting App.data
            this.data = {
                characters: await this.db.characters.toArray(),
                worlds: await this.db.worlds.toArray()
            }
    
            // Ensure App.data is set for dropdown population
            App.data = this.data
                        
          
          
    
            // Atomic fix: Populate dropdowns immediately after data is set
            if (typeof this._updateStoryboard === 'function') {
                console.log("initialLoad: Calling _updateStoryboard...")
                await this._updateStoryboard()
            }
            this.hideEl(this.ui.initialPageLoadingModal)
                        
            // Initial load completed
    
        } catch (error) {
            console.error("[App Lifecycle] Error during initialLoad:", error)
            this.showEl(this.ui.emergencyExportCtn)
            this.hideEl(this.ui.initialPageLoadingModal)
                        
        } finally {
            this.isInitializing = false
            this.checkAllButtonStates()
            // Ensure right-side buttons are rendered and functional on initial load for Storyboard
            this.updateTopBarUI()
                        
          
        }
        // ... existing code ...
        if (this.currentMainView === this.CONSTANTS.VIEWS.STORYBOARD && typeof this._updateStoryboard === 'function') {
      
            await this._updateStoryboard()
        }
        // Force hide loading modal in case of silent failure
        if (this.ui && this.ui.initialPageLoadingModal) {
            this.hideEl(this.ui.initialPageLoadingModal)
            // Forced hide of loading modal
        }
        if (!this.storyboardSelected) {
            this.storyboardSelected = { ai: '', user: '', world: '' }
        }
    },
      
    async _getitemData(id, dbTableKey, getPremadesFn) {
    
          
        // Check if database is initialized
        if (!this.db) {
            console.warn('Database not initialized yet, skipping _getitemData')
            return null
        }
          
        if (typeof id === 'string' && id.startsWith('premade_')) {
            const parts = id.split(':')
            const itemType = parts[0].substring('premade_'.length) // e.g., 'character' or 'world'
            const actualPremadeId = parts[1]
              
            console.log(`_getitemData: Handling premade ID. itemType: ${itemType}, actualPremadeId: ${actualPremadeId}`)

            const items = await getPremadesFn()
            const foundItem = items.find(item => item.id === actualPremadeId)
        
            if (foundItem) {
                const basePremade = {
                    eternal: '', past: '', present: '', future: '',
                    ...foundItem,
                    isPremade: true,
                    originalPremadeId: foundItem.id,
                    id: id // Keep the full premade ID for later reference
                }
                console.log(`_getitemData: Found premade item:`, basePremade)
                return basePremade
            }
            console.warn(`_getitemData: Premade item not found for ID: ${id}`)
            return null
        }
        if ((typeof id === 'number' || (typeof id === 'string' && !isNaN(parseInt(id, 10)))) && this.db[dbTableKey]) {
            const result = await this.db[dbTableKey].get(parseInt(id, 10))
        
            return result
        }
    
        return null
    },
    
    /**
     * Renders the options chin, including custom JS and story prompt fields.
     * @async
     * @param {HTMLElement} container - The container to render into.
     */
     
    async _populateList(listArea, searchTerm = '', config) {
    
        if (!listArea || !config) return
          
        // Check if database is initialized
        if (!this.db) {
            console.warn('Database not initialized yet, skipping _populateList')
            listArea.innerHTML = '<p class="list-item-empty-message">Loading...</p>'
            return
        }
          
        const { dbTableKey, getPremadesFn } = config
        const allUserItems = await this.db[dbTableKey].toArray()
        const fetchedItems = allUserItems
            .filter(item => item.isDeleted !== true)
            .sort((a, b) => (b.createdTimestamp || 0) - (a.createdTimestamp || 0))
        const premadeItemsRaw = await getPremadesFn()
        const premadeItems = premadeItemsRaw.map(p => ({ ...p, isPremade: true }))
        const combinedItems = [...fetchedItems, ...premadeItems]
        const lowerSearchTerm = searchTerm.toLowerCase()
        const itemsToDisplay = searchTerm
            ? combinedItems.filter(item => (item.name || "").toLowerCase().includes(lowerSearchTerm))
            : combinedItems
        listArea.innerHTML = ''
        itemsToDisplay.forEach(item => {
            const listItem = this._createListItem(item, config)
            listArea.appendChild(listItem)
        })
          
        // Chin height is now handled automatically by flexbox layout
    },
    
    _createListItem(item, config) {
        const article = document.createElement('article')
        article.className = 'character-card-landscape'
  
        // Info (left side)
        const nameHtml = `<h4 class="card-title-styled">${this.sanitizeHtml(item.name || `Unnamed ${config.capital}`)}</h4>`
        const descriptionHtml = item.description ? `<p class="card-description-styled">${this.sanitizeHtml(item.description)}</p>` : ''
          
        // Footer - only show for premade items, custom items have no buttons
        let footerHtml = ''
        if (item.isPremade) {
            const colorPalette = this.getColorPalette(item.colorPalette || 'slate_gray')
            footerHtml = `<footer class="card-footer card-footer-premade"><small class="card-footer-premade-badge" style="--premade-badge-color: ${colorPalette.colors.medium};">Premade</small></footer>`
        }
        // Custom items have no footer buttons - they're accessed via the profile page
          
        const infoHtml = `
            <article class="card-info">
              <header class="card-header-flex">
                ${nameHtml}
              </header>
              <main class="card-main-flex">
                ${descriptionHtml}
              </main>
              ${footerHtml}
            </article>
          `
  
        // Profile picture (right side)
        const profilePictureHtml = this._generateProfilePictureHtml(item, 'list-item')
        const pictureHtml = `
            <div class="card-picture">
              <div class="profile-picture">
                ${profilePictureHtml}
              </div>
            </div>
          `
  
        article.innerHTML = `<div class="card-grid">${infoHtml}${pictureHtml}</div>`
  
        article.onclick = () => {
            if (this.ui.topBar) this.ui.topBar.classList.remove('top-bar-interactive-hover')
            const finalItemId = item.isPremade ? `premade_${config.itemType}:${item.id}` : item.id
            this.switchToScreen(config.profileScreen, { itemId: finalItemId, itemType: config.itemType })
        }
        return article
    },
  
  
    
    async _populateStoryList(listArea, searchTerm = '') {
        listArea.innerHTML = ''
          
        // Check if database is initialized
        if (!this.db) {
            console.warn('Database not initialized yet, skipping _populateStoryList')
            listArea.innerHTML = '<p class="story-item-empty-message">Loading...</p>'
            return
        }
          
        let allStories = await this.db.stories.toArray()
        let fetchedStories = allStories.filter(item => item.isDeleted !== true)
        fetchedStories.sort((a, b) => (b.lastMessageTimestamp || b.createdTimestamp || 0) - (a.lastMessageTimestamp || a.createdTimestamp || 0))
        const lowerSearchTerm = searchTerm.toLowerCase()
        let storiesToDisplay
      
        const nameCache = { characters: new Map(), worlds: new Map() }
        const getName = async (id, type) => {
            if (!id) return `Unknown ${type.charAt(0).toUpperCase() + type.slice(1)}`
            if (nameCache[type + 's'].has(id)) return nameCache[type + 's'].get(id)
      
            const item = await this._getitemData(id, type + 's', type === 'character' ? this.getPremadeCharacterItems : this.getPremadeWorldItems)
            const name = item?.name || `Unknown ${type.charAt(0).toUpperCase() + type.slice(1)}`
            nameCache[type + 's'].set(id, name)
            return name
        }
      
        if (searchTerm) {
            storiesToDisplay = []
            for (const story of fetchedStories) {
                const aiCharName = story.storyAiCharacter?.name || await getName(story.aiCharacterId, 'character')
                const userCharName = story.storyUserCharacter?.name || await getName(story.userCharacterId, 'character')
                const worldName = story.storyWorld?.name || await getName(story.worldId, 'world')
                const storyDisplayName = story.name || `${aiCharName} & ${userCharName} in ${worldName}`
                if (storyDisplayName.toLowerCase().includes(lowerSearchTerm)) {
                    storiesToDisplay.push(story)
                }
            }
        } else {
            storiesToDisplay = fetchedStories
        }
      
        if (storiesToDisplay.length === 0) {
            listArea.innerHTML = `<p class="story-item-empty-message">${searchTerm ? 'No matches.' : 'No recent stories.'}</p>`
            return
        }
      
        for (const story of storiesToDisplay) {
            const aiCharacter = story.storyAiCharacter || await this._getitemData(story.aiCharacterId, 'characters', this.getPremadeCharacterItems)
            const userCharacter = story.storyUserCharacter || await this._getitemData(story.userCharacterId, 'characters', this.getPremadeCharacterItems)
            const world = story.storyWorld || await this._getitemData(story.worldId, 'worlds', this.getPremadeWorldItems)
            const displayName = story.name || `${aiCharacter?.name || 'AI'} & ${userCharacter?.name || 'User'} in ${world?.name || 'World'}`
              
            const itemEl = document.createElement('div')
            itemEl.className = 'list-item-main story-item'
            if (this.currentStoryId === story.id && this.currentMainView === this.CONSTANTS.VIEWS.STORY_INTERFACE) {
                itemEl.classList.add('active')
            }
            if (story.concluded) {
                itemEl.classList.add('concluded-story-item')
            }
      
            itemEl.innerHTML = `
                  <span class="name-main" title="${this.sanitizeHtml(displayName)}">${this.sanitizeHtml(displayName)}</span>
                  <span class="tag-right-aligned">${story.concluded ? '<span class="concluded-story-indicator">&#127937;</span>' : ''}</span>
              `
      
            itemEl.onclick = () => {
                this.ui.topBar.classList.remove('top-bar-interactive-hover')
                this.switchToScreen(this.CONSTANTS.VIEWS.STORY_PROFILE, { storyId: story.id })
            }
            listArea.appendChild(itemEl)
        }
          
        // Chin height is now handled automatically by flexbox layout
    },
    
    async _renderStoryProfileMessages(story) {
        this.ui.storyProfilechatFeed.innerHTML = ''
      
        const messages = await this.db.messages.where({ storyId: story.id }).sortBy('timestamp')
        if (messages.length === 0 && !story.concluded) {
            this.ui.storyProfilechatFeed.insertAdjacentHTML('beforeend', `<div class="noMessagesNotice p-4 text-sm text-center">No messages in this story yet.</div>`)
        } else {
            messages.forEach(msg => {
                if (msg.isHidden) return
                this._addMessageToFeed(msg, true)
            })
        }
          
        if (story.concluded && story.summary && !messages.some(m => m.content === story.summary && m.role === 'narrator')) {
            this._addMessageToFeed({ role: 'narrator', content: story.summary }, true)
        }
    },
    
    _generateAndInsertStoryProfileHTML(story, aiChar, userChar, world) {
        const san = this.sanitizeHtml
        const conclusionHtml = this._generateStoryProfileConclusionBlock(story, aiChar, userChar, world, san)
        const actionButtonsHtml = this._generateStoryProfileActionButtons(story)
    
        this.ui.storyProfilechatFeed.insertAdjacentHTML('beforeend', conclusionHtml)
        this.ui.storyProfilechatFeed.scrollTop = this.ui.storyProfilechatFeed.scrollHeight
        this.ui.storyProfileActions.innerHTML = actionButtonsHtml
    },
    
    _generateStoryProfileConclusionBlock(story, aiChar, userChar, world, san) {
        return `
              <div class="story-conclusion-block">
                  <h2 class="story-profile-embedded-title">${san(story.name || `Untitled Story`)}</h2>
                  <div class="story-profile-embedded-items">
                      <div class="story-profile-item-card" data-item-id="${aiChar.id || story.aiCharacterId}" data-item-type="character">
                          ${this._generateProfilePictureHtml(aiChar, 'story-profile-item-profile-picture')}
                          <span class="story-profile-item-name">${san(aiChar?.name || 'AI Character')}</span>
                          <span class="story-profile-item-role">(AI Character)</span>
                      </div>
                      <div class="story-profile-item-card" data-item-id="${userChar.id || story.userCharacterId}" data-item-type="character">
                          ${this._generateProfilePictureHtml(userChar, 'story-profile-item-profile-picture')}
                          <span class="story-profile-item-name">${san(userChar?.name || 'User Character')}</span>
                          <span class="story-profile-item-role">(Your Character)</span>
                      </div>
                      <div class="story-profile-item-card" data-item-id="${world.id || story.worldId}" data-item-type="world">
                          ${this._generateProfilePictureHtml(world, 'story-profile-item-profile-picture')}
                          <span class="story-profile-item-name">${san(world?.name || 'World')}</span>
                          <span class="story-profile-item-role">(World)</span>
                      </div>
                  </div>
                  ${story.concluded && story.concludedTimestamp ?
                `<div class="message systemMessage" class="system-message-styled"><div class="messageWrap"><div class="messageContentContainer"><div class="messageText">This story concluded on ${new Date(story.concludedTimestamp).toLocaleString()}</div></div></div></div>`
                : ''
            }
              </div>`
    },
    
    _generateStoryProfileActionButtons(story) {
        let actionButtonsHtml = `
              <button id="storyProfileBackButton" class="secondary-action-button"><span class="button-text">Back</span><span class="button-icon">\u2B05\uFE0F</span></button>
              <div class="ml-auto flex gap-2">
                      <button id="deleteStoryButton" class="delete-button">
                      <div class="delete-button-container">
                          <span class="delete-button-headline">Delete Story</span>
                          <span class="delete-button-subtext">This cannot be undone.</span>
                      </div>
                      <span class="button-icon">Delete</span>
                  </button>
          `
        if (!story.concluded) {
            actionButtonsHtml += `
                  <button id="concludeStoryButtonStoryProfile" class="danger-button">
                      <span class="button-text">Conclude Story</span>
                      <span class="button-icon">Conclude</span>
                  </button>
                  <button id="openStoryChatButtonStoryProfile" class="primary-action-button">
                      <span class="button-text">Resume Chat</span><span class="button-icon">Resume</span>
                  </button>
              `
        }
        actionButtonsHtml += `</div>`
        return actionButtonsHtml
    },
      
    async renderFormScreen(options = {}) {
        // renderFormScreen called with options
        const { itemType, isCreating, isCopying } = options
      
        const config = this.CONSTANTS.ITEM_CONFIG[itemType]
        if (!config) { console.error("Invalid itemType for renderFormScreen:", itemType); return }
    
        const container = this.ui[config.formScreen]
        if (!container) { console.error(`Container for ${config.formScreen} not found`); return }
    
        const isCreatingOrCopying = isCreating || isCopying
        // isCreatingOrCopying determined
          
        // Removed top bar title text
    
        let item = {}
        if (isCreating && !isCopying) {
            // Creation path - checking formData sources
            if (options.formData && Object.keys(options.formData).length > 0) {
                item = { ...options.formData }
                this.createItemFormData = { ...options.formData }
                // Using formData passed in options for new item
            } else if (Object.keys(this.createItemFormData).length > 0) {
                item = { ...this.createItemFormData }
                // Using App.createItemFormData for new item
            } else {
                item = {}
                // Creating a truly new item, no prior data
            }
        } else if (isCopying) {
            // Copying path - fetching original item with ID
            const originalItem = await this._getitemData(options.itemId, config.dbTableKey, config.getPremadesFn)
            // Retrieved original item for copying
            // Original item name
            // Original item name type
            // Original item name length
              
            // Copy the original item data but remove the ID and timestamps to make it a new item
            item = { ...originalItem }
            delete item.id
            delete item.createdTimestamp
            delete item.lastModifiedTimestamp
            delete item.isPremade
            delete item.originalPremadeId
              
            // Initialize form data with the copied item's data
            this.createItemFormData = {
                name: item.name,
                description: item.description,
                eternal: item.eternal,
                past: item.past,
                present: item.present,
                future: item.future,
                profilePicture: item.profilePicture,
                colorPalette: item.colorPalette || 'tech_blue'
            }
            // Copied item data for new item
            // Copied item name
            // Copied item name type
            // Copied item name length
        } else {
            // Editing path - fetching item with ID
            item = await this._getitemData(options.itemId, config.dbTableKey, config.getPremadesFn)
            // Retrieved item for editing
            // Initialize form data with existing item's colorPalette for editing
            // Use a more varied default color palette instead of always slate_gray
            const defaultPalettes = ['tech_blue', 'forest_green', 'crimson_red', 'sunset_orange', 'royal_purple', 'cyber_pink']
            const randomDefaultPalette = defaultPalettes[Math.floor(Math.random() * defaultPalettes.length)]
            this.createItemFormData = { colorPalette: item.colorPalette || randomDefaultPalette }
        }
      
      
        if (!isCreatingOrCopying && !item) {
            container.innerHTML = `<p>${config.capital} not found.</p>`
            return
        }
          
        let softLockNoticeHtml = ''
        if (!isCreatingOrCopying && this.activeStoryId) {
            const activeStory = await this.db.stories.get(this.activeStoryId)
            if (activeStory && !activeStory.concluded) {
                const itemOriginalId = item.isPremade ? item.originalPremadeId : item.id
                const isItemInActiveStory =
                    (config.itemType === 'character' && (itemOriginalId == activeStory.aiCharacterId || itemOriginalId == activeStory.userCharacterId)) ||
                    (config.itemType === 'world' && itemOriginalId == activeStory.worldId)
      
                if (isItemInActiveStory) {
                    softLockNoticeHtml = `
                          <div class="soft-lock-notice">
                              <strong>Notice:</strong> This ${config.capital.toLowerCase()} is part of the active story: "<strong>${this.sanitizeHtml(activeStory.name || 'Untitled Story')}</strong>". 
                              Edits made here will apply to <em>new</em> stories or after this one is concluded. 
                              The active story uses a snapshot of this item from when it began.
                          </div>`
                }
            }
        }
          
        // NON-DESTRUCTIVE DOM UPDATE:
        // 1. Create a temporary container for the new content.
        const tempContainer = document.createElement('div')
        tempContainer.innerHTML = softLockNoticeHtml + this._renderStudioLayout(item, config, true)
          
        // 2. Clear the old content and append the new content.
        while (container.firstChild) {
            container.removeChild(container.firstChild)
        }
        while (tempContainer.firstChild) {
            container.appendChild(tempContainer.firstChild)
        }
    
        this._attachFormEventHandlers(container, itemType, item, isCreatingOrCopying)
        this.checkAllButtonStates()
        this._updateFormColorPreview(container, item.colorPalette)
    },
      
    async renderProfileScreen(options = {}) {
        const { itemType, itemId } = options
        const config = this.CONSTANTS.ITEM_CONFIG[itemType]
        if (!config) { console.error("Invalid itemType for renderProfileScreen:", itemType); return }
      
        const container = this.ui[config.profileScreen]
        if (!container || !itemId) {
            App.showTopNotification(`Error: ${config.capital} ID missing for profile view.`, "error")
            this.switchToScreen(this.CONSTANTS.VIEWS.STORYBOARD)
            return
        }
          
        this.currentProfileViewItemId = itemId

        const item = await this._getitemData(itemId, config.dbTableKey, config.getPremadesFn)
        this.currentProfileViewItemType = itemType
        this.currentProfileViewItem = item
      
        if (!item) {
            container.innerHTML = `<p class="p-4 text-center">${config.capital} not found.</p>`
            return
        }
        // Removed: this.ui.topBar.textContent = `${config.capital} Profile`; // This is now handled by _updateProfileTopBarUI
  
        // NON-DESTRUCTIVE DOM UPDATE:
        const tempContainer = document.createElement('div')
        tempContainer.innerHTML = this._renderStudioLayout(item, config, false)
          
        while (container.firstChild) {
            container.removeChild(container.firstChild)
        }
        while (tempContainer.firstChild) {
            container.appendChild(tempContainer.firstChild)
        }
        // Attach robust onerror handler for profile picture
        const profilePicture = container.querySelector('#formProfilePicture')
        if (profilePicture) {
            profilePicture.onerror = function () {
                const palette = (options.colorPalette || 'blue').toLowerCase()
                const placeholderDiv = document.createElement('div')
                placeholderDiv.className = `premade-card premade-${palette}`
                placeholderDiv.setAttribute('aria-label', 'No image available')
                const icon = document.createElement('span')
                icon.className = 'premade-placeholder-icon'
                icon.setAttribute('aria-hidden', 'true')
                icon.textContent = '\uD83D\uDDBC\uFE0F' // U+1F5BC for Picture Frame, U+FE0F for variation selector
                placeholderDiv.appendChild(icon)
                this.replaceWith(placeholderDiv)
            }
        }
      
        // Profile page name field is read-only - no handlers needed
      
        // Removed event handlers for Back and Copy & Customize buttons - now handled in top bar
    },
    
    _renderEppfField(label, subLabel, idSuffix, value, placeholder, isEditing, san) {
        const id = `${idSuffix}`
          
        if (isEditing) {
            return `
                  <div class="profile-field-row profile-field-${idSuffix.toLowerCase()}">
                      <div class="profile-field-label">
                          <span class="main-label">${label}</span>
                          <span class="field-sublabel">${subLabel}</span>
                      </div>
                      <div class="profile-field-value">
                      <textarea id="${id}" placeholder="${san(placeholder)}" resize="auto">${san(value || '')}</textarea>
                      </div>
                  </div>
              `
        } else {
            return `
                  <div class="profile-field-row profile-field-${idSuffix.toLowerCase()}">
                      <div class="profile-field-label">
                          <span class="main-label">${label}</span>
                          <span class="field-sublabel">${subLabel}</span>
                      </div>
                      <div class="profile-field-value">${san(value || '—')}</div>
                  </div>
              `
        }
    },
    
    _renderStudioLayout(item, config, isEditing) {
        const san = this.sanitizeHtml.bind(this)
        const { itemType, labels } = config
      
        // --- PROFILE PICTURE/PLACEHOLDER LOGIC ---
        // const profilePictureSrc = (item.profilePicture && item.profilePicture.trim()) ? item.profilePicture.trim() : this._makeProfilePicturePlaceholderSVG(item.name || config.capital, item.colorPalette, item.isPremade); // Unused variable
                
    
        const profilePictureHtml = this._generateProfilePictureHtml(item, 'profile') // Use the new helper function
    
        // --- FORM ACTION BUTTONS ---
        // Buttons moved to top bar - no longer needed in form
        // const formActions = ''; // Unused variable
    
        // --- BACKGROUND PROFILE PICTURE LAYOUT ---
                
          
        // Both profile view and edit mode use the same beautiful background layout
        const content = `
              <div id="${itemType}FormMain" class="profile-background-layout">
                  <!-- Background Profile Picture -->
                  <div class="profile-background-container">
                      <div class="profile-background-image" id="${itemType}-profile-picture-background">
                          ${profilePictureHtml}
                      </div>
                      <div class="profile-background-overlay"></div>
                  </div>
                  
                  <!-- Content Overlay -->
                  <div class="profile-content-overlay">
                      <div class="profile-content-container">
                          ${isEditing ? `
                              <!-- Edit Mode: Form Fields -->
                              <form class="edit-form-content">
                                  <div class="form-section traits-section">
                                      <div class="profile-header-section">
                                          <div class="name-input-container name-input-container-relative">
                                              <input type="text" class="studio-name-input-large studio-profile-name studio-name-input-styled" id="${itemType}Name" placeholder="${config.capital} Name" value="${item.name && item.name.trim() ? item.name : ''}">
                                      </div>
                                      </div>
                                      <div class="profile-field-value profile-description-field">
                                          <textarea id="${itemType}Description" placeholder="${labels.descriptionPlaceholder}">${san(item.description || '')}</textarea>
                                      </div>
                                  </div>
                                  <div class="form-section eppf-section">
                                      ${this._renderEppfField("Forever", "Eternal Truths & Permanent Features", `${itemType}Eternal`, item.eternal, labels.eternalPlaceholder, isEditing, san)}
                                      ${this._renderEppfField("Past", "Background & Memories", `${itemType}Past`, item.past, labels.pastPlaceholder, isEditing, san)}
                                      ${this._renderEppfField("Present", "Current Mood & Conditions", `${itemType}Present`, item.present, labels.presentPlaceholder, isEditing, san)}
                                      ${this._renderEppfField("Future", "Goals & Prophecies", `${itemType}Future`, item.future, labels.futurePlaceholder, isEditing, san)}
                                  </div>
                                  <div class="form-section profile-picture-edit-section">
                                      <button type="button" class="secondary" id="uploadProfilePictureButtonForm-${itemType}"><span class="button-text">Upload / Generate Profile Picture</span></button>
                                  </div>
                              </form>
                          ` : `
                              <!-- Profile View: Display Only -->
                              <div class="profile-header-section">
                                  <h2 class="studio-profile-name">${san(item.name || 'Unnamed')}</h2>
                              </div>
                              <div class="profile-field-value profile-description-field">${san(item.description || 'No description provided.')}</div>
                              
                              <div class="profile-details-section">
                                  <div class="profile-details-grid">
                                      ${this._renderEppfField("Forever", "Eternal Truths & Permanent Features", `${itemType}Eternal`, item.eternal, labels.eternalPlaceholder, isEditing, san)}
                                      ${this._renderEppfField("Past", "Background & Memories", `${itemType}Past`, item.past, labels.pastPlaceholder, isEditing, san)}
                                      ${this._renderEppfField("Present", "Current Mood & Conditions", `${itemType}Present`, item.present, labels.presentPlaceholder, isEditing, san)}
                                      ${this._renderEppfField("Future", "Goals & Prophecies", `${itemType}Future`, item.future, labels.futurePlaceholder, isEditing, san)}
                                  </div>
                              </div>
                          `}
                      </div>
                  </div>
              </div>
          `
          
        return content
    },
    
    async _createColorPicker(selectedPaletteKey) {
        let colorPickerHtml = '<div class="form-section color-picker-section">'
        colorPickerHtml += '<h3>Color Palette</h3>'
        colorPickerHtml += '<div class="color-palette-grid">'
    
        for (const key in this.CONSTANTS.COLOR_PALETTES) {
            const palette = this.CONSTANTS.COLOR_PALETTES[key]
            const isSelected = key === selectedPaletteKey ? 'selected' : ''
            colorPickerHtml += `
                <button class="color-palette-button ${isSelected}" data-palette-key="${key}" title="${palette.name}" aria-label="Select ${palette.name} color palette">
                    <div class="color-swatch-large-styled" style="--swatch-color: ${palette.colors.medium}"></div>
                    <div class="color-swatch-group">
                        <div class="color-swatch-small-styled" style="--swatch-color: ${palette.colors.light}"></div>
                        <div class="color-swatch-small-styled" style="--swatch-color: ${palette.colors.dark}"></div>
                        <div class="color-swatch-small-styled" style="--swatch-color: ${palette.colors.neutral}"></div>
                    </div>
                </button>
            `
        }
    
        colorPickerHtml += '</div></div>'
        return colorPickerHtml
    },
    
    /**
     * Loads a color palette by key, or returns a default if not found.
     * @param {string} paletteKey - The palette key.
     * @returns {Object} The palette object.
     */
    getColorPalette(paletteKey) {
        return this.CONSTANTS.COLOR_PALETTES[paletteKey] || this.CONSTANTS.COLOR_PALETTES.slate_gray
    },
    
    /**
     * Updates the color scheme of a given element using a palette key.
     * @param {HTMLElement} element - The element to update.
     * @param {string} paletteKey - The palette key.
     */
    _updateColorScheme(element, paletteKey) {
        const palette = this.getColorPalette(paletteKey)
        if (!element || !palette) return
    
        const styles = {
            '--form-color-light': palette.colors.light,
            '--form-color-medium': palette.colors.medium,
            '--form-color-dark': palette.colors.dark,
            '--form-color-neutral': palette.colors.neutral
        }
    
        Object.entries(styles).forEach(([prop, value]) => {
            element.style.setProperty(prop, value)
        })
    },
    
    _updateFormColorPreview(container, paletteKey) {
        this._updateColorScheme(container, paletteKey)
    },
    
    _attachFormEventHandlers(container, itemType /*, item, isCreating */) {
        const formElements = this._setupFormElements(container, itemType)
        if (!formElements) return
    
        // Phase 1: Contenteditable Name Field Handlers (like storyboard title)
        this._attachContenteditableNameHandlers(formElements, itemType)
    
        // Phase 2: Profile PictureSystem Event Handlers
        this._attachProfilePictureEventHandlers(formElements, itemType)
    
        // Phase 3: Form Action Handlers (Delete, Cancel, Submit)
        this._attachFormActionHandlers(formElements, itemType)
    
        // Phase 4: AI Helper Handlers
        this._attachAiHelperHandlers(formElements, itemType)
    
        // Phase 5: Textarea Dynamic Updates
        this._attachTextareaHandlers(formElements)
    
        const colorButtons = container.querySelectorAll('.color-palette-button')
        colorButtons.forEach(button => {
            button.onclick = (e) => {
                e.preventDefault()
                const selectedKey = button.dataset.paletteKey
                  
                // Update selection state
                colorButtons.forEach(button => button.classList.remove('selected'))
                button.classList.add('selected')
    
                // Update form data
                this.createItemFormData.colorPalette = selectedKey
    
                // Update live preview
                this._updateFormColorPreview(container, selectedKey)
            }
        })
    },
    
    _attachContenteditableNameHandlers(elements /*, itemType */) {
        const { nameInput } = elements
        if (!nameInput) return
          
        // Handle input to save changes
        nameInput.oninput = () => {
            const newName = nameInput.value.trim()
            if (newName) {
                // Update the form data
                this.createItemFormData.name = newName
            }
        }
          
        // Handle blur to save changes
        nameInput.onblur = () => {
            const newName = nameInput.value.trim()
            if (newName) {
                // Update the form data
                this.createItemFormData.name = newName
            }
        }
          
        // Handle Enter key to finish editing
        nameInput.onkeydown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault()
                nameInput.blur()
            }
        }
    },
    
    _setupFormElements(container, itemType) {
        const config = this.CONSTANTS.ITEM_CONFIG[itemType]
        const form = container.querySelector(`#${itemType}FormMain`)
        if (!form) {
            console.error(`Form not found for ${itemType}`)
            return null
        }
    
        return {
            config,
            form,
            nameEditableDiv: form.querySelector(`#${itemType}name-editable`),
            nameInput: form.querySelector(`#${itemType}Name`),
            profilePictureDisplayPanel: container.querySelector(`#${itemType}-profile-picture-display`),
            profilePictureOverlay: container.querySelector(`#profile-picture-overlay-${itemType}`),
            profilePicturePromptInputForm: container.querySelector(`#profilePicturePromptInputForm-${itemType}`),
            uploadProfilePictureButtonForm: container.querySelector(`#uploadProfilePictureButtonForm-${itemType}`),
            generateProfilePictureButtonForm: container.querySelector(`#generateprofile-pictureButtonForm-${itemType}`),
            useProfilePictureButtonForm: container.querySelector(`#useprofile-pictureButtonForm-${itemType}`),
            closeProfilePictureButtonForm: container.querySelector(`#closeprofile-pictureButtonForm-${itemType}`),
            aiHelpProfilePicturePromptButton: container.querySelector(`#aiHelpprofile-picturePromptButton-${itemType}`),
            descriptionTextarea: form.querySelector(`#${itemType}Description`),
            eternalInput: form.querySelector(`#${itemType}Eternal`),
            pastInput: form.querySelector(`#${itemType}Past`),
            presentInput: form.querySelector(`#${itemType}Present`),
            futureInput: form.querySelector(`#${itemType}Future`),
        }
    },
    
    _attachProfilePictureEventHandlers(elements, itemType) {
        // Simple profile picture handler for both character and world forms
        const { uploadProfilePictureButtonForm } = elements
          
        if (uploadProfilePictureButtonForm) {
            uploadProfilePictureButtonForm.onclick = (e) => {
                e.preventDefault()
                e.stopPropagation()
                  
                // Simple prompt for image URL or description
                const input = prompt('Enter an image URL or describe the image you want to generate:')
                if (input && input.trim()) {
                    const isUrl = input.trim().startsWith('http')
                    if (isUrl) {
                        // Use URL directly
                        this.handleUseUrlForProfilePicture(null, input.trim(), itemType)
                    } else {
                        // Generate image from description using simplified approach
                        this.handleGenerateProfilePictureSimple(itemType, input.trim())
                    }
                }
            }
        }
    },
    
    _attachFormActionHandlers(elements, itemType) {
        // const { config, form } = elements; // Unused variables
    
        // Delete button removed from forms - will be handled in profile top bar for custom items only
    
        // Cancel button handler
        this._attachCancelButtonHandler(elements, itemType)
    
        // Form submit handler
        this._attachFormSubmitHandler(elements, itemType)
    },
    
    _attachCancelButtonHandler(elements, itemType) {
        const { config, form } = elements
        const cancelButton = form.querySelector(`#cancel${config.capital}ButtonMain`)
          
        if (!cancelButton) {
            console.warn(`Cancel button not found for ${itemType} form.`)
            return
        }
    
        cancelButton.onclick = (e) => {
            // Ignore synthetic/programmatic clicks that are not user-initiated
            if (e && e.isTrusted === false) {
                console.warn("Programmatic cancel click suppressed")
                return
            }
              
            if (!this.currentCreateFormContext || Object.keys(this.currentCreateFormContext).length === 0) {
                App.handleError('FORM_CONTEXT_ERROR', new Error('Missing form context during cancel operation'))
                this.switchToScreen(this.CONSTANTS.VIEWS.STORYBOARD)
                return
            }
              
            const { id, itemType, isCreating, isCopying, preSelectedAiCharacterId, preSelectedUserCharacterId, preSelectedWorldId, originalScreen } = this.currentCreateFormContext
            this.createItemFormData = {}
              
            // Clear any pending form state from session storage when canceling
            try {
                sessionStorage.removeItem('pendingRPGlitchFormState')
            } catch (e) {
                console.warn("Failed to clear session storage on cancel:", e)
            }
              
            // Get config for this item type
            const config = this.CONSTANTS.ITEM_CONFIG[itemType]
              
            // Form context: 
            console.log("Form context:", {
                id,
                itemType,
                isCreating,
                isCopying,
                originalScreen,
                currentCreateFormContext: this.currentCreateFormContext
            })
              
            // Determine where to go based on the context
            let targetScreen
            let navOptions = {}
              
            if (isCreating && !isCopying) {
                // If creating new (not copying), go back to storyboard
                targetScreen = this.CONSTANTS.VIEWS.STORYBOARD
                // Filter out 'create_new_' values to prevent infinite loop
                navOptions = {
                    preSelectedAiCharacterId: preSelectedAiCharacterId?.startsWith?.('create_new_') ? '' : preSelectedAiCharacterId,
                    preSelectedUserCharacterId: preSelectedUserCharacterId?.startsWith?.('create_new_') ? '' : preSelectedUserCharacterId,
                    preSelectedWorldId: preSelectedWorldId?.startsWith?.('create_new_') ? '' : preSelectedWorldId
                }
                // Creating new, going to storyboard
            } else if (isCopying) {
                // If copying, go back to the original screen we came from
                if (originalScreen && originalScreen !== this.CONSTANTS.VIEWS.STORYBOARD) {
                    targetScreen = originalScreen
                    navOptions = { itemId: id, itemType: itemType }
                    // Copying cancelled, returning to original screen
                } else {
                    // Fallback to profile screen if no original screen
                    targetScreen = config.profileScreen
                    navOptions = { itemId: id, itemType: itemType }
                    // Copying cancelled, fallback to profile
                }
            } else {
                // If editing existing item, go back to its profile page
                targetScreen = config.profileScreen
                navOptions = { itemId: id, itemType: itemType }
                // Editing, going to profile
            }
    
            this.switchToScreen(targetScreen, navOptions)
        }
    },
    
    _attachFormSubmitHandler(elements, itemType) {
        const { config, form } = elements
        form.onsubmit = async (e) => {
            e.preventDefault()
            this.checkAllButtonStates() // Re-check states on submit attempt
            const submitButton = form.querySelector(`#submit${config.capital}ButtonMain`)
            if (submitButton && submitButton.disabled) {
                console.warn("Form submission blocked by disabled button.")
                return
            }
              
            // CRITICAL FIX: Save form data to session storage right before submission
            // This prevents data loss if a page refresh happens after client-side validation
            // but before the DB write, which can happen with async operations or slow UI.
            const formDataToStore = this._getFormDataFromForm(elements, itemType)
            const formOptionsToStore = { ...this.currentCreateFormContext, formData: formDataToStore } // Include existing context + current data
              
            try {
                sessionStorage.setItem('pendingRPGlitchFormState', JSON.stringify({
                    formData: formDataToStore,
                    formOptions: formOptionsToStore,
                    timestamp: Date.now()
                }))
                // Stored pending form state in sessionStorage
            } catch (e) {
                console.error("[FORM SUBMISSION] Failed to store form state to sessionStorage:", e)
            }
    
            try {
                await this._processFormSubmission(elements, itemType)
            } catch (error) {
                console.error(`Error processing ${itemType} form submission:`, error)
                App.showTopNotification(`Error saving ${config.capital}: ${error.message || 'Unknown error'}`, 'error', 5000)
                // Ensure session storage is cleared if submission ultimately fails
                sessionStorage.removeItem('pendingRPGlitchFormState')
            }
        }
    },
    
    async _processFormSubmission(elements, itemType) {
        const { config, nameInput, descriptionTextarea, eternalInput, pastInput, presentInput, futureInput } = elements
        const isCreating = this.currentCreateFormContext.isCreating // Use this flag from context
    
        const id = this.currentCreateFormContext.itemId // For editing, keep original ID
          
        const newItem = {
            name: nameInput?.value.trim() || `Unnamed ${config.capital}`,
            description: descriptionTextarea?.value.trim() || '',
            eternal: eternalInput?.value.trim() || '',
            past: pastInput?.value.trim() || '',
            present: presentInput?.value.trim() || '',
            future: futureInput?.value.trim() || '',
            profilePicture: this.currentGeneratedProfilePictureDataUrl || this._getExistingProfilePictureUrl(id, config.dbTableKey, config.getPremadesFn, itemType) || '', // Use generated or existing
            colorPalette: this.createItemFormData.colorPalette || 'tech_blue', // Get from App.createItemFormData, default to tech_blue instead of slate_gray
            createdTimestamp: isCreating ? Date.now() : this.currentCreateFormContext.createdTimestamp || Date.now(), // Preserve timestamp for existing
            lastModifiedTimestamp: Date.now(),
            isDeleted: 0 // Explicitly set to not deleted
        }
    
        let result
        if (id && !isCreating) { // Only update if ID exists and we are editing (not creating from copy)
            result = await this.db[config.dbTableKey].update(id, newItem)
            App.showTopNotification(`${config.capital} updated.`, 'success')
            result = id // Update result to be the existing ID for navigation
        } else {
            result = await this.db[config.dbTableKey].add(newItem)
            App.showTopNotification(`${config.capital} created!`, 'success')
        }
        this._handleFormSubmissionSuccess(result, config, itemType)
    },
    
    _handleFormSubmissionSuccess(result, config, itemType) {
        this.currentGeneratedProfilePictureDataUrl = null // Clear generated image after save
        this.createItemFormData = {} // Clear form data on success
        try {
            sessionStorage.removeItem('pendingRPGlitchFormState') // Clear session storage on success
        } catch (e) {
            console.warn("Failed to clear session storage on successful form submission:", e)
        }
          
        // Always navigate to the profile page of the created/edited item
        this.switchToScreen(config.profileScreen, { itemId: result, itemType: itemType })
    },
    
    _attachAiHelperHandlers(elements, itemType) {
        const { form, descriptionTextarea, eternalInput, pastInput, presentInput, futureInput } = elements
        const config = this.CONSTANTS.ITEM_CONFIG[itemType]
    
        // Array of fields with AI buttons
        const aiFields = [
            { input: descriptionTextarea, type: 'description', btn: form.querySelector(`#aiHelp${config.capital}DescriptionButton`) },
            { input: eternalInput, type: 'eternal', btn: form.querySelector(`#aiHelp${config.capital}EternalButton`) },
            { input: pastInput, type: 'past', btn: form.querySelector(`#aiHelp${config.capital}PastButton`) },
            { input: presentInput, type: 'present', btn: form.querySelector(`#aiHelp${config.capital}PresentButton`) },
            { input: futureInput, type: 'future', btn: form.querySelector(`#aiHelp${config.capital}FutureButton`) }
        ]
    
        // Add general AI helper button click handlers
        aiFields.forEach(field => {
            if (field.btn) {
                this._manageAiButtonState(field.btn, { type: field.type, field: field.input, itemType: itemType })
            }
        })
    },
    
    _attachTextareaHandlers(elements) {
        const { descriptionTextarea, eternalInput, pastInput, presentInput, futureInput } = elements
        const textareas = [descriptionTextarea, eternalInput, pastInput, presentInput, futureInput].filter(Boolean)

        textareas.forEach(textarea => {
            textarea.addEventListener('input', () => {
                textarea.style.height = 'auto'
                textarea.style.height = `${textarea.scrollHeight}px`
            })
            // Initial resize
            textarea.style.height = 'auto'
            textarea.style.height = `${textarea.scrollHeight}px`
        })
    },
    
    _getFormDataFromForm(elements, itemType) {
        const { nameInput, descriptionTextarea, eternalInput, pastInput, presentInput, futureInput } = elements
        const config = this.CONSTANTS.ITEM_CONFIG[itemType]
          
        return {
            name: nameInput?.value.trim() || `Unnamed ${config.capital}`,
            description: descriptionTextarea?.value.trim() || '',
            eternal: eternalInput?.value.trim() || '',
            past: pastInput?.value.trim() || '',
            present: presentInput?.value.trim() || '',
            future: futureInput?.value.trim() || '',
            profilePicture: this.currentGeneratedProfilePictureDataUrl || this._getExistingProfilePictureUrl(this.currentCreateFormContext.itemId, config.dbTableKey, config.getPremadesFn, itemType) || '',
            colorPalette: this.createItemFormData.colorPalette || 'tech_blue'
        }
    },
    
    async _getExistingProfilePictureUrl(itemId, dbTableKey, getPremadesFn, itemType) {
        if (!itemId) return ''
        const item = await this._getitemData(itemId, dbTableKey, getPremadesFn, itemType)
        return item?.profilePicture || ''
    },
    
    async handleGenerateProfilePictureSimple(itemType, description) {
        const config = this.CONSTANTS.ITEM_CONFIG[itemType]
        const formContainer = this.ui[config.formScreen]
        const profilePictureDisplay = formContainer.querySelector(`#${itemType}-profile-picture-background`)
    
        if (!profilePictureDisplay) {
            console.error('Profile picture display area not found for simple generation.')
            return
        }
    
        // Show loading state
        profilePictureDisplay.innerHTML = '<div class="loading-spinner"></div>'
    
        try {
            const generatedImageUrl = await this.generateImageWithPerchance(description)
            this.currentGeneratedProfilePictureDataUrl = generatedImageUrl
    
            // Update the display with the new image
            profilePictureDisplay.innerHTML = `<img src="${generatedImageUrl}" alt="Generated profile picture" class="profile-picture-large">`
        } catch (error) {
            console.error('Error generating profile picture:', error)
            App.showTopNotification('Failed to generate image.', 'error')
            // Restore previous state or show placeholder
            const existingItem = await this._getitemData(this.currentCreateFormContext.itemId, config.dbTableKey, config.getPremadesFn, itemType)
            profilePictureDisplay.innerHTML = this._generateProfilePictureHtml(existingItem, 'profile')
        }
    },
    
    async generateImageWithPerchance(prompt) {
        if (typeof textToImage !== 'undefined' && textToImage.generate) {
            try {
                const imageDataUrl = await textToImage.generate(prompt, {
                    size: '768x768',
                    style: 'flat-art',
                    colorPalette: this.createItemFormData.colorPalette || 'tech_blue'
                })
                return imageDataUrl
            } catch (error) {
                console.error('Error generating image with Perchance plugin:', error)
                throw new Error('Perchance plugin failed to generate image.')
            }
        } else {
            throw new Error('Perchance text-to-image plugin not available.')
        }
    },
    
    handleUseUrlForProfilePicture(_elements, url, itemType) {
        const config = this.CONSTANTS.ITEM_CONFIG[itemType]
        const formContainer = this.ui[config.formScreen]
        const profilePictureDisplay = formContainer.querySelector(`#${itemType}-profile-picture-background`)
    
        if (!profilePictureDisplay) {
            console.error('Profile picture display area not found for URL update.')
            return
        }
    
        this.currentGeneratedProfilePictureDataUrl = url
        profilePictureDisplay.innerHTML = `<img src="${url}" alt="Profile picture from URL" class="profile-picture-large">`
    },
    
    _manageAiButtonState(button, options) {
        if (!button) return
        const { type, field, itemType } = options
        const config = this.CONSTANTS.ITEM_CONFIG[itemType]
        const form = this.ui[config.formScreen]
        const nameInput = form.querySelector(`#${itemType}Name`)
    
        button.onclick = async () => {
            const currentName = nameInput.value.trim()
            const currentDescription = form.querySelector(`#${itemType}Description`).value.trim()
            const currentEternal = form.querySelector(`#${itemType}Eternal`).value.trim()
            const currentPast = form.querySelector(`#${itemType}Past`).value.trim()
            const currentPresent = form.querySelector(`#${itemType}Present`).value.trim()
            const currentFuture = form.querySelector(`#${itemType}Future`).value.trim()
    
            const prompt = this._buildAiHelperPrompt(type, itemType, {
                name: currentName,
                description: currentDescription,
                eternal: currentEternal,
                past: currentPast,
                present: currentPresent,
                future: currentFuture
            })
    
            // Show loading state
            field.classList.add('ai-loading')
            field.disabled = true
    
            try {
                const result = await this.generateTextWithPerchance(prompt)
                field.value = result
                // Trigger input event for auto-resizing
                field.dispatchEvent(new Event('input', { bubbles: true }))
            } catch (error) {
                console.error(`AI helper failed for ${type}:`, error)
                App.showTopNotification(`AI helper failed: ${error.message}`, 'error')
            } finally {
                // Hide loading state
                field.classList.remove('ai-loading')
                field.disabled = false
            }
        }
    },
    
    _buildAiHelperPrompt(fieldType, itemType, currentData) {
        const config = this.CONSTANTS.ITEM_CONFIG[itemType]
        const { name, description, eternal, past, present, future } = currentData
    
        let prompt = `You are an expert world-builder and character designer. Your task is to generate a compelling piece of information for a ${itemType}.`
        prompt += `\n\n**${config.capital} Name:** ${name || 'Unnamed'}`
    
        if (description) prompt += `\n**Description:** ${description}`
        if (eternal) prompt += `\n**Eternal:** ${eternal}`
        if (past) prompt += `\n**Past:** ${past}`
        if (present) prompt += `\n**Present:** ${present}`
        if (future) prompt += `\n**Future:** ${future}`
    
        prompt += `\n\nNow, generate a compelling **${config.labels[fieldType].main}** section.`
        prompt += `\n\n**Instructions:**`
        prompt += `\n- Focus only on the **${config.labels[fieldType].main}** section.`
        prompt += `\n- Be creative, concise, and evocative.`
        prompt += `\n- Do not repeat the field title (e.g., "Eternal:"). Just provide the text.`
        prompt += `\n- Use the placeholder as a guide: "${config.labels[fieldType].placeholder}"`
    
        return prompt
    },
    
    async generateTextWithPerchance(prompt) {
        if (typeof textToText !== 'undefined' && textToText.generate) {
            try {
                const result = await textToText.generate(prompt)
                return result.output
            } catch (error) {
                console.error('Error generating text with Perchance plugin:', error)
                throw new Error('Perchance plugin failed to generate text.')
            }
        } else {
            throw new Error('Perchance text-to-text plugin not available.')
        }
    },
    
    /**
     * Switches the main view to the specified screen.
     * @param {string} screenName - The name of the screen to switch to.
     * @param {Object} [options={}] - Options for the screen switch.
     */
    async switchToScreen(screenName, options = {}) {
        // switchToScreen called with screenName and options
          
        // Navigation guard check
        if (this.navigationGuard.isActive) {
            const timeSinceStart = Date.now() - this.navigationGuard.startTime
            if (timeSinceStart > 5000) { // 5 second timeout
                console.warn(`Navigation guard timed out for operation: ${this.navigationGuard.operation}. Resetting.`)
                this.navigationGuard.isActive = false
            } else {
                console.warn(`Navigation guard is active for operation: ${this.navigationGuard.operation}. Ignoring switch to ${screenName}.`)
                return
            }
        }
    
        // Set navigation guard
        this.navigationGuard.isActive = true
        this.navigationGuard.operation = `switchToScreen: ${screenName}`
        this.navigationGuard.startTime = Date.now()
        this.navigationGuard.targetScreen = screenName

        // Close any open chin when switching screens
        if (this.focusBarState.chinOpen) {
            this._toggleChinContent(this.focusBarState.currentChin)
        }
    
        // Hide all screens first
        Object.values(this.CONSTANTS.VIEWS).forEach(viewKey => {
            const screenEl = this.ui[viewKey]
            if (screenEl) {
                this.hideEl(screenEl)
            }
        })

        // Always close any open chin when switching screens
        this.hideAllChins()
    
        // Show the target screen
        const targetScreenEl = this.ui[screenName]
        if (targetScreenEl) {
            this.showEl(targetScreenEl)
            this.currentMainView = screenName
        } else {
            console.error(`[UI Critical] Screen element for '${screenName}' not found.`)
            this.navigationGuard.isActive = false // Release guard on error
            return
        }
    
        // Handle screen-specific logic
        try {
            switch (screenName) {
                case this.CONSTANTS.VIEWS.STORYBOARD:
                    await this._updateStoryboard(options)
                    break
                case this.CONSTANTS.VIEWS.STORY_INTERFACE:
                    await this.openStory(this.activeStoryId)
                    break
                case this.CONSTANTS.VIEWS.CHARACTER_FORM:
                case this.CONSTANTS.VIEWS.WORLD_FORM:
                    await this.renderFormScreen(options)
                    break
                case this.CONSTANTS.VIEWS.CHARACTER_PROFILE:
                case this.CONSTANTS.VIEWS.WORLD_PROFILE:
                    await this.renderProfileScreen(options)
                    break
                case this.CONSTANTS.VIEWS.STORY_PROFILE:
                    await this.renderStoryProfileScreen(options.storyId)
                    break
                case this.CONSTANTS.VIEWS.PREMADE_CHARACTER_SELECTION:
                case this.CONSTANTS.VIEWS.PREMADE_WORLD_SELECTION:
                    await this.renderPremadeSelectionScreen(options)
                    break
            }
        } catch (error) {
            console.error(`Error during screen switch to ${screenName}:`, error)
            // Optionally, switch to a safe fallback screen like storyboard
            if (screenName !== this.CONSTANTS.VIEWS.STORYBOARD) {
                await this.switchToScreen(this.CONSTANTS.VIEWS.STORYBOARD)
            }
        } finally {
            // Release navigation guard
            this.navigationGuard.isActive = false
            this.navigationGuard.operation = null
            this.navigationGuard.startTime = null
            this.navigationGuard.targetScreen = null
        }
    
        // Update UI states after screen switch
        this.updateTopBarUI()
        this.checkAllButtonStates()
        await this.saveAppState()
    },
    
    /**
     * Updates the storyboard view, populating dropdowns and setting up cards.
     * @param {Object} [options={}] - Options for updating the storyboard.
     */
    async _updateStoryboard(options = {}) {
        const { preSelectedAiCharacterId, preSelectedUserCharacterId, preSelectedWorldId } = options
    
        // Populate dropdowns first
        await this._populateDropdown(this.ui.storyboardAiCharacterSelect, 'character', preSelectedAiCharacterId)
        await this._populateDropdown(this.ui.storyboardUserCharacterSelect, 'character', preSelectedUserCharacterId)
        await this._populateDropdown(this.ui.storyboardWorldSelect, 'world', preSelectedWorldId)
    
        // Then, select the items, which will trigger card updates
        await this._selectStoryboardItem('ai', preSelectedAiCharacterId)
        await this._selectStoryboardItem('user', preSelectedUserCharacterId)
        await this._selectStoryboardItem('world', preSelectedWorldId)
    
        this.updateDynamicStoryboardTitle()
        this.checkAllButtonStates()
    },
    
    /**
     * Populates a dropdown select element with items of a given type.
     * @param {HTMLSelectElement} selectEl - The select element to populate.
     * @param {string} itemType - The type of item ('character' or 'world').
     * @param {string|number} [selectedId] - The ID of the item to pre-select.
     */
    async _populateDropdown(selectElement, itemType, selectedId) {
        console.log(`_populateDropdown: Function entered for itemType: ${itemType}, selectedId: ${selectedId}`)
        if (!selectElement) {
            console.warn(`_populateDropdown: selectElement is null or undefined for itemType: ${itemType}`)
            return
        }
        console.log(`_populateDropdown: selectElement ID: ${selectElement.id}`)

        const config = this.CONSTANTS.ITEM_CONFIG[itemType]
        if (!config) {
            console.warn(`_populateDropdown: config not found for itemType: ${itemType}`)
            return
        }

        const items = await (itemType === 'character' ? this.getPremadeCharacterItems() : this.getPremadeWorldItems())
        console.log(`_populateDropdown: Fetched items for ${itemType}:`, items)
        
        // Store current value to restore if it's still valid
        const currentValue = selectElement.value
    
        selectElement.innerHTML = '' // Clear existing options
    
        // Add the placeholder option
        const placeholderText = `Choose ${config.capital}...`
        selectElement.add(new Option(placeholderText, ''))
    
        // Add "Create New" option
        selectElement.add(new Option(`+ Create New ${config.capital}...`, `create_new_${itemType}`))
    
        // Separate items into user-created and premade
        const userItems = items.filter(item => !item.isPremade)
        const premadeItems = items.filter(item => item.isPremade)
    
        // Add user items if they exist
        if (userItems.length > 0) {
            const userGroup = document.createElement('optgroup')
            userGroup.label = `Custom ${config.capital}s`
            userItems.forEach(item => {
                const option = new Option(item.name, item.id)
                userGroup.appendChild(option)
            })
            selectElement.appendChild(userGroup)
        }
    
        // Add premade items if they exist
        if (premadeItems.length > 0) {
            const premadeGroup = document.createElement('optgroup')
            premadeGroup.label = `Premade ${config.capital}s`
            premadeItems.forEach(item => {
                const option = new Option(item.name, `premade_${itemType}:${item.id}`)
                premadeGroup.appendChild(option)
            })
            selectElement.appendChild(premadeGroup)
        }
    
        // Set the selected value
        console.log(`_populateDropdown: Populating dropdown for ${itemType}. Selected ID: ${selectedId}, Current Value: ${currentValue}`)
        if (selectedId) {
            selectElement.value = selectedId
            console.log(`_populateDropdown: Setting selectedId to ${selectedId}`)
        } else if (currentValue && selectElement.querySelector(`[value="${currentValue}"]`)) {
            selectElement.value = currentValue
            console.log(`_populateDropdown: Restoring previous value ${currentValue}`)
        }

        // Log all generated options for debugging
        Array.from(selectElement.options).forEach(option => {
            console.log(`_populateDropdown: Option - Text: ${option.text}, Value: ${option.value}, Selected: ${option.selected}`)
        })

        // Ensure the selected option is visually updated
        if (selectedId) {
            selectElement.value = selectedId
            console.log(`_populateDropdown: Setting selectedId to ${selectedId}`)
        } else if (currentValue && selectElement.querySelector(`option[value="${currentValue}"]`)) {
            selectElement.value = currentValue
            console.log(`_populateDropdown: Restoring previous value ${currentValue}`)
        }

        // Ensure the selected option is visually updated
        if (selectElement.value) {
            const selectedOption = selectElement.querySelector(`option[value="${selectElement.value}"]`)
            if (selectedOption) {
                selectedOption.selected = true
                console.log(`_populateDropdown: Visually updated selected option to: ${selectElement.value}`)
            }
        }
    
        
    },
    
    /**
     * Attaches event listeners to the storyboard select elements.
     */
    _attachStoryboardEventListeners() {
        console.log('_attachStoryboardEventListeners called.')
        const selects = [
            { el: this.ui.storyboardAiCharacterSelect, type: 'ai' },
            { el: this.ui.storyboardUserCharacterSelect, type: 'user' },
            { el: this.ui.storyboardWorldSelect, type: 'world' }
        ]
    
        selects.forEach(({ el, type }) => {
            if (el) {
                console.log(`Attaching onchange listener to ${el.id}`)
                el.onchange = async (e) => {
                    const selectedValue = e.target.value
                    console.log(`onchange event for ${el.id} fired. Selected value: ${selectedValue}`)
                    if (selectedValue.startsWith('create_new_')) {
                        const itemType = selectedValue.replace('create_new_', '')
                        this.switchToScreen(this.CONSTANTS.ITEM_CONFIG[itemType].formScreen, {
                            itemType: itemType,
                            isCreating: true,
                            preSelectedAiCharacterId: this.storyboardSelected.ai,
                            preSelectedUserCharacterId: this.storyboardSelected.user,
                            preSelectedWorldId: this.storyboardSelected.world
                        })
                    } else {
                        this.storyboardSelected[type] = selectedValue
                        await this._updateStoryboardCard(type)
                        this.checkAllButtonStates()
                    }
                }
            }
        })
    },

    /**
     * Attaches event listeners to top bar buttons.
     */
    _attachTopBarEventListeners() {
        if (this.listenersAttached) return
        this.listenersAttached = true

        const chinTabs = document.querySelectorAll('#top-bar-left button[data-chin]')
        chinTabs.forEach(btn => {
            btn.addEventListener('click', App.selectTopBarTab.bind(App, btn.dataset.chin))
        })

        document.addEventListener('click', (e) => {
            const topBarLeft = document.getElementById('top-bar-left')
            const chinContainer = document.getElementById('chin-container')
            if (topBarLeft && chinContainer) {
                if (!topBarLeft.contains(e.target) && !chinContainer.contains(e.target)) {
                    if (App.focusBarState.chinOpen) {
                        App._toggleChinContent(App.focusBarState.currentChin)
                    }
                }
            }
        })

        const shuffleBtn = document.getElementById('shuffle')
        if (shuffleBtn) shuffleBtn.onclick = App._shuffleStoryboard.bind(App)

        const beginBtn = document.getElementById('begin-story')
        if (beginBtn) beginBtn.onclick = App.beginStory.bind(App)

        const formCancel = document.getElementById('form-cancel')
        if (formCancel) formCancel.onclick = () => {
            const form = !this.ui.characterFormScreen?.classList.contains('hidden')
                ? this.ui.characterFormScreen.querySelector('form')
                : !this.ui.worldFormScreen?.classList.contains('hidden')
                    ? this.ui.worldFormScreen.querySelector('form')
                    : null
            const cancelBtn = form?.querySelector('button[id^="cancel"]')
            cancelBtn?.click()
        }

        const formSave = document.getElementById('form-save')
        if (formSave) formSave.onclick = () => {
            const form = !this.ui.characterFormScreen?.classList.contains('hidden')
                ? this.ui.characterFormScreen.querySelector('form')
                : !this.ui.worldFormScreen?.classList.contains('hidden')
                    ? this.ui.worldFormScreen.querySelector('form')
                    : null
            const submitBtn = form?.querySelector('button[type="submit"]')
            submitBtn?.click()
        }

        const editBtn = document.getElementById('profile-edit')
        if (editBtn) editBtn.onclick = () => {
            const type = this.currentProfileViewItemType
            const config = this.CONSTANTS.ITEM_CONFIG[type]
            if (config && this.currentProfileViewItemId) {
                this.switchToScreen(config.formScreen, { itemId: this.currentProfileViewItemId, isEditing: true })
            }
        }

        const copyBtn = document.getElementById('profile-copy')
        if (copyBtn) copyBtn.onclick = () => {
            const type = this.currentProfileViewItemType
            const config = this.CONSTANTS.ITEM_CONFIG[type]
            if (config && this.currentProfileViewItemId) {
                this.switchToScreen(config.formScreen, { itemId: this.currentProfileViewItemId, isCreating: true, isCopying: true })
            }
        }

        const deleteBtn = document.getElementById('profile-delete')
        if (deleteBtn) deleteBtn.onclick = async () => {
            const type = this.currentProfileViewItemType
            const id = this.currentProfileViewItemId
            if (!type || !id) return
            const config = this.CONSTANTS.ITEM_CONFIG[type]
            if (!config) return
            if (!confirm(`Delete ${config.capital}? This cannot be undone.`)) return
            await this.db[config.dbTableKey].delete(id)
            this.switchToScreen(this.CONSTANTS.VIEWS.STORYBOARD)
        }

        const backBtn = document.getElementById('profile-back')
        if (backBtn) backBtn.onclick = () => {
            if (this.activeStoryId) this.openStory(this.activeStoryId)
            else this.switchToScreen(this.CONSTANTS.VIEWS.STORYBOARD)
        }

        // Options chin buttons
        const {
            uploadBackupInput,
            uploadBackupTrigger,
            downloadBackupButton,
            deleteAllDataButton
        } = this.ui
        if (uploadBackupTrigger && uploadBackupInput) {
            uploadBackupTrigger.onclick = () => uploadBackupInput.click()
            uploadBackupInput.addEventListener('change', (e) => {
                const file = e.target.files[0]
                if (file) this.importAllData(file)
                uploadBackupInput.value = ''
            })
        }

        if (downloadBackupButton) downloadBackupButton.onclick = () => this.exportAllData()

        const startFreshBtn = deleteAllDataButton
        if (startFreshBtn) startFreshBtn.onclick = () => this.deleteAllData()
    },
    
    /**
     * Selects an item in the storyboard dropdowns and updates the corresponding card.
     * @param {string} type - The type of item ('ai', 'user', or 'world').
     * @param {string|number} itemId - The ID of the selected item (can be premade_ prefixed).
     */
    /**
     * Selects an item in the storyboard dropdowns and updates the corresponding card.
     * @param {string} type - The type of item ('ai', 'user', or 'world').
     * @param {string|number} itemId - The ID of the selected item (can be premade_ prefixed).
     */

    async _selectStoryboardItem(type, itemId) {
        this.storyboardSelected[type] = itemId || ''

        const selectEl = this.ui[`storyboard${type.charAt(0).toUpperCase() + type.slice(1)}Select`]
        if (selectEl && selectEl.value !== itemId) selectEl.value = itemId || ''

        await this._updateStoryboardCard(type)
        this.updateDynamicStoryboardTitle()
        this.checkAllButtonStates()

    },
    
    _setupStoryProfileDisplays(aiChar, userChar) {
        this.ui.storyProfileAiCharacterDisplayArea.style.backgroundImage = aiChar.profilePicture ? `url('${this.sanitizeHtml(aiChar.profilePicture)}')` : ''
        this.ui.storyProfileUserCharacterDisplayArea.style.backgroundImage = userChar.profilePicture ? `url('${this.sanitizeHtml(userChar.profilePicture)}')` : ''
        this.ui.storyProfileAiCharacterDisplayArea.classList.toggle('visible', !!aiChar.profilePicture)
        this.ui.storyProfileUserCharacterDisplayArea.classList.toggle('visible', !!userChar.profilePicture)
    },

    async _updateStoryboardCard(cardType) {
        console.log(`_updateStoryboardCard called for cardType: ${cardType}`)
        const selectedId = this.storyboardSelected[cardType]
        const cardEl = this.ui[`storyboard${cardType.charAt(0).toUpperCase() + cardType.slice(1)}Card`]
        const itemType = (cardType === 'world') ? 'world' : 'character'
        const config = this.CONSTANTS.ITEM_CONFIG[itemType]
    
        if (!cardEl) {
            console.warn(`_updateStoryboardCard: Card element not found for cardType: ${cardType}`)
            return
        }
    
        const item = selectedId ? await this._getitemData(selectedId, config.dbTableKey, config.getPremadesFn) : null
        console.log(`_updateStoryboardCard: Fetched item for selectedId ${selectedId}:`, item)

        const cardContent = cardEl.querySelector('.storyboard-card-right article')
        if (!cardContent) {
            console.warn(`_updateStoryboardCard: Card content area not found for cardType: ${cardType}`)
            return
        }
    
        if (item) {
            console.log(`_updateStoryboardCard: Updating card with item:`, item)
            cardContent.querySelector('header').innerHTML = `<h4 class="storyboard-card-title-styled">${this.sanitizeHtml(item.name)}</h4>`
            cardContent.querySelector('p').innerHTML = this.sanitizeHtml(item.description || `A ${itemType} for your story...`)
            cardContent.querySelector('footer small').textContent = item.isPremade ? 'Premade' : 'Custom'
              
            const profilePictureContainer = cardEl.querySelector('.storyboard-card-left')
            if (profilePictureContainer) {
                profilePictureContainer.innerHTML = this._generateProfilePictureHtml(item, 'storyboard')
            }
        } else {
            console.log(`_updateStoryboardCard: Resetting card for cardType: ${cardType} (no item selected or found).`)
            // Reset to default state
            cardContent.querySelector('header').innerHTML = `<select id="storyboard-${cardType}-select" class="storyboard-select" aria-label="Choose ${config.capital}"><option value="">Choose ${config.capital}...</option></select>`
            cardContent.querySelector('p').textContent = `Select a ${itemType} for your story...`
            cardContent.querySelector('footer small').textContent = ''
              
            const profilePictureContainer = cardEl.querySelector('.storyboard-card-left')
            if (profilePictureContainer) {
                profilePictureContainer.innerHTML = `<img src="data:image/svg+xml;base64,..." alt="${config.capital}">` // Placeholder image
            }
        }
    },
    
    /**
     * Updates all cards on the storyboard.
     */
    async _updateAllStoryboardCards() {
        await this._updateStoryboardCard('ai')
        await this._updateStoryboardCard('user')
        await this._updateStoryboardCard('world')
    },
    
    /**
     * Generates the HTML for a profile picture, including placeholders.
     * @param {Object} item - The item data.
     * @param {string} context - The context ('profile', 'storyboard', etc.).
     * @returns {string} The HTML string for the profile picture.
     */
    _generateProfilePictureHtml(item, context) {
        if (!item) {
            // Generate a generic placeholder if no item is provided
            return this._makeProfilePicturePlaceholderSVG('?', 'slate_gray', false, context)
        }
    
        const hasProfilePicture = item.profilePicture && item.profilePicture.trim()
        const paletteKey = item.colorPalette || 'slate_gray'
    
        if (hasProfilePicture) {
            const sanitizedUrl = this.sanitizeHtml(item.profilePicture.trim())
            const placeholderSvg = this._makeProfilePicturePlaceholderSVG(item.name, paletteKey, item.isPremade, context)
            const errorHandling = `this.onerror=null; this.src='${placeholderSvg}'`
            return `<img src="${sanitizedUrl}" alt="${this.sanitizeHtml(item.name)}" class="profile-picture-${context}" onerror="${errorHandling}">`
        } else {
            // Generate placeholder SVG directly
            return this._makeProfilePicturePlaceholderSVG(item.name, paletteKey, item.isPremade, context)
        }
    },
    
    /**
     * Creates an SVG placeholder for a profile picture.
     * @param {string} name - The name to use for initials.
     * @param {string} paletteKey - The color palette key.
     * @param {boolean} _isPremade - Whether the item is premade.
     * @param {string} _context - The context for styling.
     * @returns {string} A data URL for the SVG image.
     */
    _makeProfilePicturePlaceholderSVG(name, paletteKey, _isPremade, _context) {
        const palette = this.getColorPalette(paletteKey)
        const initials = this._getInitials(name || '?')
        const { light, medium } = palette.colors
    
        const svg = `
              <svg width="100%" height="100%" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style="background-color: ${medium};">
                  <text x="50%" y="50%" font-family="${this.CONSTANTS.FONT_FAMILY}" font-size="40" fill="${light}" text-anchor="middle" dominant-baseline="central">${initials}</text>
              </svg>
          `
    
        return `data:image/svg+xml;base64,${btoa(svg)}`
    },
    
    /**
     * Extracts initials from a name.
     * @param {string} name - The name to extract initials from.
     * @returns {string} The initials.
     */
    _getInitials(name) {
        if (!name) return '?'
        const words = name.split(' ')
        return words.map(w => w[0]).join('').toUpperCase().slice(0, 2)
    },
    
    /**
     * Checks and updates the state of all interactive buttons.
     */
    checkAllButtonStates() {
        // Storyboard buttons
        const isStoryboardReady = this.storyboardSelected.ai && this.storyboardSelected.user && this.storyboardSelected.world
        if (this.ui.beginStoryButton) {
            this.ui.beginStoryButton.disabled = !isStoryboardReady
        }
    
        // Form buttons
        if (this.currentMainView === this.CONSTANTS.VIEWS.CHARACTER_FORM || this.currentMainView === this.CONSTANTS.VIEWS.WORLD_FORM) {
            const form = this.ui[this.currentMainView]
            if (form) {
                const nameInput = form.querySelector('input[type="text"]')
                const submitButton = form.querySelector('button[type="submit"]')
                if (nameInput && submitButton) {
                    submitButton.disabled = !nameInput.value.trim()
                }
            }
        }
    },
    
    /**
     * Updates the top bar UI based on the current screen.
     */
    updateTopBarUI() {
        // Hide all right-side sections first
        const rightSections = [this.ui.topBarRightStoryboard, this.ui.topBarRightForm, this.ui.topBarRightProfile].filter(Boolean)
        rightSections.forEach(section => this.hideEl(section))
    
        // Show the correct section based on the current view
        switch (this.currentMainView) {
            case this.CONSTANTS.VIEWS.STORYBOARD:
                this.ui.topBarRightStoryboard && this.showEl(this.ui.topBarRightStoryboard)
                break
            case this.CONSTANTS.VIEWS.CHARACTER_FORM:
            case this.CONSTANTS.VIEWS.WORLD_FORM:
                this.ui.topBarRightForm && this.showEl(this.ui.topBarRightForm)
                break
            case this.CONSTANTS.VIEWS.CHARACTER_PROFILE:
            case this.CONSTANTS.VIEWS.WORLD_PROFILE:
            case this.CONSTANTS.VIEWS.STORY_PROFILE:
                this.ui.topBarRightProfile && this.showEl(this.ui.topBarRightProfile)
                break
        }
    },
    
    /**
     * Selects a tab in the top bar.
     * @param {string} tabName - The name of the tab to select.
     */
    selectTopBarTab(tabName) {
        // Deselect all tabs
        const tabs = document.querySelectorAll('#top-bar-left button')
        tabs.forEach(tab => {
            tab.setAttribute('aria-selected', 'false')
        })
    
        // Select the new tab
        const selectedTab = document.querySelector(`#top-bar-left button[data-chin="${tabName}"]`)
        if (selectedTab) {
            selectedTab.setAttribute('aria-selected', 'true')
        }
    
        // Show/hide chin content
        this._toggleChinContent(tabName)
    },
    
    /**
     * Toggles the visibility of the chin content sections.
     * @param {string} chinName - The name of the chin section to show.
     */
    _toggleChinContent(chinName) {
        const chinContainer = document.getElementById('chin-container')
        if (!chinContainer) return

        const allChins = chinContainer.querySelectorAll('[data-chin]')

        // If clicking the currently open chin, close it and deselect tabs
        if (chinName && chinName === this.focusBarState.currentChin) {
            allChins.forEach(chin => App.hideEl(chin))
            App.hideEl(chinContainer)
            this.focusBarState.currentChin = null
            this.focusBarState.chinOpen = false

            const tabs = document.querySelectorAll('#top-bar-left button[data-chin]')
            tabs.forEach(tab => {
                tab.setAttribute('aria-selected', 'false')
                tab.setAttribute('aria-expanded', 'false')
            })
            const activeBtn = document.querySelector(`#top-bar-left button[data-chin="${chinName}"]`)
            if (activeBtn) activeBtn.setAttribute('aria-expanded', 'false')
            return
        }

        // Hide all chins before showing the requested one
        allChins.forEach(chin => App.hideEl(chin))
        const tabs = document.querySelectorAll('#top-bar-left button[data-chin]')
        tabs.forEach(tab => tab.setAttribute('aria-expanded', 'false'))

        const selectedChin = chinName
            ? chinContainer.querySelector(`[data-chin="${chinName}"]`)
            : null

        if (selectedChin) {
            App.showEl(chinContainer)
            App.showEl(selectedChin)
            this.focusBarState.currentChin = chinName
            this.focusBarState.chinOpen = true
            const activeBtn = document.querySelector(`#top-bar-left button[data-chin="${chinName}"]`)
            if (activeBtn) activeBtn.setAttribute('aria-expanded', 'true')
        } else {
            App.hideEl(chinContainer)
            this.focusBarState.currentChin = null
            this.focusBarState.chinOpen = false
        }
    },

    /**
     * Hides all chin sections and resets focusBarState.
     */
    hideAllChins() {
        const chinContainer = document.getElementById('chin-container')
        if (chinContainer) {
            const allChins = chinContainer.querySelectorAll('[data-chin]')
            allChins.forEach(chin => App.hideEl(chin))
            App.hideEl(chinContainer)
        }
        const tabs = document.querySelectorAll('#top-bar-left button[data-chin]')
        tabs.forEach(tab => {
            tab.setAttribute('aria-selected', 'false')
            tab.setAttribute('aria-expanded', 'false')
        })
        this.focusBarState.currentChin = null
        this.focusBarState.chinOpen = false
    },
    
    /**
     * Begins a new story with the selected characters and world.
     */
    async beginStory() {
        if (!this.storyboardSelected.ai || !this.storyboardSelected.user || !this.storyboardSelected.world) {
            App.showTopNotification('Please select an AI character, a user character, and a world.', 'error')
            return
        }
    
        const newStory = {
            aiCharacterId: this.storyboardSelected.ai,
            userCharacterId: this.storyboardSelected.user,
            worldId: this.storyboardSelected.world,
            createdTimestamp: Date.now(),
            lastMessageTimestamp: Date.now(),
            concluded: false,
            messages: []
        }
    
        const newStoryId = await this.db.stories.add(newStory)
        this.activeStoryId = newStoryId
        await this.saveAppState()
    
        this.switchToScreen(this.CONSTANTS.VIEWS.STORY_INTERFACE)
    },
    
    /**
     * Opens a story in the chat interface.
     * @param {number} storyId - The ID of the story to open.
     */
    async openStory(storyId) {
        const story = await this.db.stories.get(storyId)
        if (!story) {
            App.showTopNotification('Story not found.', 'error')
            return
        }
    
        this.activeStoryId = storyId
        await this.saveAppState()
    
        // Load characters and world
        const aiChar = await this._getitemData(story.aiCharacterId, 'characters', this.getPremadeCharacterItems)
        const userChar = await this._getitemData(story.userCharacterId, 'characters', this.getPremadeCharacterItems)
        // const world = await this._getitemData(story.worldId, 'worlds', this.getPremadeWorldItems); // Unused variable
    
        // Update character displays
        this._updateCharacterInfo('ai', aiChar)
        this._updateCharacterInfo('user', userChar)
    
        // Render messages
        this.ui.chatFeed.innerHTML = ''
        const messages = await this.db.messages.where({ storyId: storyId }).sortBy('timestamp')
        messages.forEach(msg => this._addMessageToFeed(msg))
    
        this.switchToScreen(this.CONSTANTS.VIEWS.STORY_INTERFACE)
    },
    
    /**
     * Concludes a story.
     * @param {number} storyId - The ID of the story to conclude.
     */
    async concludeStory(storyId) {
        await this.db.stories.update(storyId, { concluded: true, concludedTimestamp: Date.now() })
        if (this.activeStoryId === storyId) {
            this.activeStoryId = null
            await this.saveAppState()
        }
        this.switchToScreen(this.CONSTANTS.VIEWS.STORY_PROFILE, { storyId: storyId })
    },
    
    /**
     * Sends a message in the current story.
     */
    async sendButtonClickHandler() {
        const content = this.ui.messageInput.value.trim()
        if (!content) return
    
        const message = {
            storyId: this.activeStoryId,
            role: 'user',
            content: content,
            timestamp: Date.now()
        }
    
        await this.db.messages.add(message)
        this._addMessageToFeed(message)
    
        this.ui.messageInput.value = ''
        this.ui.messageInput.style.height = 'auto'
    
        // AI response logic would go here
    },
    
    /**
     * Adds a message to the chat feed.
     * @param {Object} message - The message object.
     * @param {boolean} [isProfileView=false] - Whether this is for the profile view.
     */
    _addMessageToFeed(message, isProfileView = false) {
        const feed = isProfileView ? this.ui.storyProfilechatFeed : this.ui.chatFeed
        if (!feed) return
    
        const messageEl = document.createElement('div')
        messageEl.className = `message ${message.role}`
        messageEl.innerHTML = `
              <div class="messageWrap">
                  <div class="messageContentContainer">
                      <div class="messageText">${this.sanitizeHtml(message.content)}</div>
                  </div>
              </div>
          `
        feed.appendChild(messageEl)
        feed.scrollTop = feed.scrollHeight
    },
    
    /**
     * Updates the character info display in the top bar.
     * @param {string} type - 'ai' or 'user'.
     * @param {Object} character - The character object.
     */
    async _updateCharacterInfo(type, character) {
        const displayArea = this.ui[`${type}CharacterDisplayArea`]
        if (!displayArea) return
    
        if (character) {
            displayArea.innerHTML = this._generateProfilePictureHtml(character, 'top-bar-char-profile-picture')
            this.showEl(displayArea)
        }
        else {
            this.hideEl(displayArea)
        }
    },
    
    /**
     * Shuffles the storyboard selections.
     */
    async _shuffleStoryboard() {
        const characters = await App.getPremadeCharacterItems()
        const worlds = await App.getPremadeWorldItems()
    
        const randomChar1 = characters[Math.floor(Math.random() * characters.length)]
        let randomChar2 = characters[Math.floor(Math.random() * characters.length)]
        while (randomChar2.id === randomChar1.id) {
            randomChar2 = characters[Math.floor(Math.random() * characters.length)]
        }
        const randomWorld = worlds[Math.floor(Math.random() * worlds.length)]
    
        this.storyboardSelected.ai = randomChar1.isPremade ? `premade_character:${randomChar1.id}` : randomChar1.id
        this.storyboardSelected.user = randomChar2.isPremade ? `premade_character:${randomChar2.id}` : randomChar2.id
        this.storyboardSelected.world = randomWorld.isPremade ? `premade_world:${randomWorld.id}` : randomWorld.id
    
        await this._updateStoryboard({
            preSelectedAiCharacterId: this.storyboardSelected.ai,
            preSelectedUserCharacterId: this.storyboardSelected.user,
            preSelectedWorldId: this.storyboardSelected.world
        })
    },
    
    /**
     * Exports all data from the database.
     */
    async exportAllData() {
        const data = {
            characters: await this.db.characters.toArray(),
            worlds: await this.db.worlds.toArray(),
            stories: await this.db.stories.toArray(),
            messages: await this.db.messages.toArray(),
            appState: await this.db.appState.toArray()
        }
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `rpglitch-backup-${new Date().toISOString().split('T')[0]}.json`
        a.click()
        URL.revokeObjectURL(url)
    },

    /**
     * Imports data into the database from a backup file.
     * @param {File} file - The JSON backup file.
     */
    async importAllData(file) {
        if (!file) return
        const reader = new FileReader()
        reader.onload = async () => {
            try {
                const data = JSON.parse(reader.result)
                const { characters = [], worlds = [], stories = [], messages = [], appState = [] } = data
                await this.db.transaction('rw', this.db.characters, this.db.worlds, this.db.stories, this.db.messages, this.db.appState, async () => {
                    await Promise.all([
                        this.db.characters.clear(),
                        this.db.worlds.clear(),
                        this.db.stories.clear(),
                        this.db.messages.clear(),
                        this.db.appState.clear()
                    ])
                    await Promise.all([
                        this.db.characters.bulkAdd(characters),
                        this.db.worlds.bulkAdd(worlds),
                        this.db.stories.bulkAdd(stories),
                        this.db.messages.bulkAdd(messages),
                        this.db.appState.bulkAdd(appState)
                    ])
                })
                location.reload()
            } catch (err) {
                this.handleError('IMPORT_ERROR', err)
            }
        }
        reader.onerror = () => this.handleError('FILE_READ_ERROR', reader.error)
        reader.readAsText(file)
    },
    
    /**
     * Deletes all data from the database.
     */
    async deleteAllData() {
        if (confirm('Are you sure you want to delete all your data? This cannot be undone.')) {
            await this.db.delete()
            location.reload()
        }
    },
    
    /**
     * Handles errors.
     * @param {string} code - The error code.
     * @param {Error} error - The error object.
     */
    handleError(code, error) {
        console.error(`[${code}]`, error)
        if (typeof App.showTopNotification === 'function') {
            App.showTopNotification(`Error: ${code}. See console for details.`, 'error', 5000)
        } else {
            console.warn('showTopNotification not available, falling back to alert.');
            alert(`Error: ${code}. See console for details.`);
        }
    }
},
    
    // Add chin helpers before initializeWhenReady
    App._toggleChin = function (chinName) {
        const container = this.ui.chinContainer;
        const allChins = container.querySelectorAll('[data-chin]');

        let openingSameChin = this.focusBarState.currentChin === chinName && this.focusBarState.chinOpen;

        allChins.forEach(chin => chin.classList.add('hidden'));

        if (openingSameChin) {
            container.classList.add('hidden');
            this.focusBarState.chinOpen = false;
            this.focusBarState.currentChin = null;
        } else {
            container.classList.remove('hidden');
            const targetEl = this.ui[chinName === 'stories' ? 'storyboardChin' :
                chinName === 'characters' ? 'characterWorkshopChin' :
                    chinName === 'worlds' ? 'worldBuilderChin' :
                        'optionsChin'];
            if (targetEl) targetEl.classList.remove('hidden');
            this.focusBarState.chinOpen = true;
            this.focusBarState.currentChin = chinName;
        }
    },

    App._populateChin = async function (chinName) {
        const configMap = {
            stories: { dbKey: 'stories', gridId: 'chin-story-grid' },
            characters: { dbKey: 'characters', gridId: 'chin-character-grid' },
            worlds: { dbKey: 'worlds', gridId: 'chin-world-grid' }
        };
        if (!configMap[chinName]) return;

        const { dbKey, gridId } = configMap[chinName];
        const grid = document.getElementById(gridId);
        grid.innerHTML = '';

        const items = await this.db[dbKey].toArray().catch(() => []);
        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'chin-card';
            card.innerHTML = `
            <div class="chin-card-left">
                <article>
                <header><h4>${this.sanitizeHtml(item.name)}</h4></header>
                <p>${this.sanitizeHtml(item.description || '')}</p>
                </article>
            </div>
            <div class="chin-card-right">
                ${getProfilePictureHTML(item, this.CONSTANTS.COLOR_PALETTES[item.colorPalette] || this.CONSTANTS.COLOR_PALETTES.slate_gray, 'card')}
            </div>
            `;
            grid.appendChild(card);
        })
    },

    // NOW initializeWhenReady can safely use them
    App.initializeWhenReady = async function () {
        this._getUIElements();

        // Chin setup
        const chinButtons = document.querySelectorAll('#top-bar-left [data-chin]');
        chinButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetChin = btn.dataset.chin;
                this._toggleChin(targetChin);
            });
        });

        this._populateChin('stories');
        this._populateChin('characters');
        this._populateChin('worlds');

        // OPTIONS Chin Wiring
        if (this.ui.downloadBackupButton) {
            this.ui.downloadBackupButton.addEventListener('click', () => {
                App.DatabaseManager.exportAllData();
            });
        }

        if (this.ui.uploadBackupTrigger && this.ui.uploadBackupInput) {
            this.ui.uploadBackupTrigger.addEventListener('click', () => {
                this.ui.uploadBackupInput.click();
            });

            this.ui.uploadBackupInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    App.DatabaseManager.importAllData(file);
                }
            });
        }

        if (this.ui.deleteAllDataButton) {
            this.ui.deleteAllDataButton.addEventListener('click', () => {
                if (confirm('Are you sure you want to delete ALL data?')) {
                    App.DatabaseManager.deleteAllData();
                }
            })
        };
        
        // Auto-close chin if click outside
        document.addEventListener('click', (e) => {
            if (this.focusBarState.chinOpen) {
                const chinContainer = this.ui.chinContainer;
                if (chinContainer && !chinContainer.contains(e.target) &&
                    !this.ui.topBarLeft.contains(e.target)) {
                    this._toggleChin(this.focusBarState.currentChin);
                }
            }
        });
    },

        try {
    this._attachTopBarEventListeners();
    this._attachStoryboardEventListeners();
    await this.initialLoad();
    this.initializeWhenReadyRetryCount = 0;
} catch (error) {
    this.handleError('INITIALIZE_WHEN_READY', error)
        

    if (!window.App.hideEl && typeof window.hideEl === 'function') {
        window.App.hideEl = window.hideEl;
    }

    // Initialize the app when the DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        waitForDependencies()
    })
}