// Dependency availability checks with retry mechanism
function checkDependencies() {
    window.isDexieLoaded = typeof window.Dexie !== 'undefined';
    window.isDOMPurifyAvailable = typeof window.DOMPurify !== 'undefined';
    window.isHyperscriptLoaded = typeof window._hyperscript !== 'undefined';
    window.isCashDomLoaded = typeof window.$ !== 'undefined';
    
    // console.log('[DEBUG] Dependency check:', {
    //   isDexieLoaded: window.isDexieLoaded,
    //   isHyperscriptLoaded: window.isHyperscriptLoaded,
    //   isCashDomLoaded: window.isCashDomLoaded,
    //   isDOMPurifyAvailable: window.isDOMPurifyAvailable
    // });
    
    return window.isDexieLoaded && window.isDOMPurifyAvailable && 
           window.isHyperscriptLoaded && window.isCashDomLoaded;
  }
  
  // Wait for dependencies to load with timeout
  let dependencyCheckCount = 0;
  const maxChecks = 50; // 5 seconds max wait
  
  function waitForDependencies() {
    if (checkDependencies()) {
      // console.log('[DEBUG] All dependencies loaded successfully');
      initializeApp();
    } else if (dependencyCheckCount < maxChecks) {
      dependencyCheckCount++;
      setTimeout(waitForDependencies, 100);
    } else {
      console.error('[DEBUG] Dependency load timed out.', {
        isDexieLoaded: window.isDexieLoaded,
        isHyperscriptLoaded: window.isHyperscriptLoaded,
        isCashDomLoaded: window.isCashDomLoaded,
        isDOMPurifyAvailable: window.isDOMPurifyAvailable
      });
      alert('Application failed to load: essential components missing. Please ensure all scripts loaded correctly.\n\nMissing: ' + 
            (!window.isDexieLoaded ? 'isDexieLoaded, ' : '') +
            (!window.isDOMPurifyAvailable ? 'isDOMPurifyAvailable, ' : '') +
            (!window.isHyperscriptLoaded ? 'isHyperscriptLoaded, ' : '') +
            (!window.isCashDomLoaded ? 'isCashDomLoaded, ' : '').slice(0, -2));
    }
  }
  
  function initializeApp() {
    if (window.App && typeof App.initializeWhenReady === 'function') {
      App.initializeWhenReady();
    } else {
      console.error('[DEBUG] App failed to initialize due to missing dependencies: App.initializeWhenReady not found');
    }
  }
  
  const App = {
    
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
      isInitializing: false, 
      activeAiButtons: new Map(), // Stores active AbortControllers for AI actions
      statusNotifierIntervalId: null,
      topNotificationTimeoutId: null,
      storyboardSelected: { ai: '', user: '', world: '' },
      // Focus Bar State
      focusBarState: {
        mode: 'storyboard',
        tabs: ['storyboard', 'characters', 'worlds', 'options'],
        chinOpen: false
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
                      futurePlaceholder: "Aspirations & Conflicts: Driving motivations, deep-seated fears, potential character arcs, unresolved ambitions, or personal quests. What propels them forward or holds them back? Example: 'Driven to find a cure for the cosmic plague afflicting their home world, while secretly battling a prophecy that foretells their own doom.''"
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
                      futurePlaceholder: "Aspirations & Conflicts: Driving motivations, deep-seated fears, potential character arcs, unresolved ambitions, or personal quests. What propels them forward or holds them back? Example: 'Driven to find a cure for the cosmic plague afflicting their home world, while secretly battling a prophecy that foretells their own doom.''"
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
                      futurePlaceholder: "Aspirations & Conflicts: Driving motivations, deep-seated fears, potential character arcs, unresolved ambitions, or personal quests. What propels them forward or holds them back? Example: 'Driven to find a cure for the cosmic plague afflicting their home world, while secretly battling a prophecy that foretells their own doom.''"
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
                      futurePlaceholder: "Looming Threats & Story Hooks: Known prophecies, brewing conflicts, potential discoveries, major unresolved tensions, upcoming significant events, or societal shifts that could drive narratives. Example: 'An ancient celestial alignment threatens to awaken a dormant cosmic entity, while a shadowy organization plots to exploit its power.''"
                  }
              }
          }
        },
        currentMainView: 'STORYBOARD',
    
        _query(id, required = false) {
            const el = document.getElementById(id);
            // console.log(`[DEBUG][_query] Attempting to find element with ID: ${id}. Found: ${!!el}`);
            if (!el && required) {
                console.error(`[UI Critical] Element with ID '${id}' not found.`);
            } else if (!el) {
                console.warn(`[UI] Optional element with ID '${id}' not found.`);
            }
            return el;
        },
    
        /**
         * Retrieves and caches all key UI elements from the DOM.
         * Should be called once after DOM is ready.
         */
        _getUIElements() {
            // console.log('[DEBUG][_getUIElements] Starting UI element query.');
            this._getTopBarElements();
            this._getChinElements();
            this._getCoreUIContainers();
            this._getFormScreens();
            this._getProfileScreens();
            this._getPremadeSelectionScreens();
            this._getMiscScreens();
            this._getStoryboardElements();
            this._getChatInterfaceElements();
    
            if (!this.ui.main) {
                console.error("[App Critical] #main container not found after UI element query!");
            }
            // console.log('[DEBUG] UI elements loaded. TopBarRight:', this.ui.topBarRight, 'ProfileTopBar:', this.ui.profileTopBar);
            // console.log('[DEBUG][_getUIElements] Finished UI element query.');
        },
    
        _getTopBarElements() {
            this.ui.topBar = this._query('top-bar', true);
            if (!this.ui.topBar) return; // Exit if topBar is not found globally
  
            this.ui.topBarLeft = this._query('top-bar-left', false, this.ui.topBar);
            if (this.ui.topBarLeft) {
              this.ui.topBarNotificationArea = this._query('top-bar-notification-area', false, this.ui.topBarLeft);
            }
  
            this.ui.topBarRight = this._query('top-bar-right', false, this.ui.topBar);
            if (this.ui.topBarRight) {
              this.ui.topBarUserCharacterInfo = this._query('top-bar-user-character-info', false, this.ui.topBarRight);
              if (this.ui.topBarUserCharacterInfo) {
                this.ui.topBarUserCharacterPic = this._query('top-bar-user-character-pic', false, this.ui.topBarUserCharacterInfo);
                this.ui.topBarUserCharacterNameText = this._query('top-bar-user-character-name-text', false, this.ui.topBarUserCharacterInfo);
              }
              this.ui.topBarAiCharacterInfo = this._query('top-bar-ai-character-info', false, this.ui.topBarRight);
              if (this.ui.topBarAiCharacterInfo) {
                this.ui.topBarAiCharacterPic = this._query('top-bar-ai-character-pic', false, this.ui.topBarAiCharacterInfo);
                this.ui.topBarAiCharacterNameText = this._query('top-bar-ai-character-name-text', false, this.ui.topBarAiCharacterInfo);
              }
              this.ui.menuButton = this._query('menu-button', false, this.ui.topBarRight);
            }
        },
    
        _getChinElements() {
            this.ui.storyboardChin = this._query('storyboard-chin');
            this.ui.characterWorkshopChin = this._query('character-workshop-chin');
            this.ui.worldBuilderChin = this._query('world-builder-chin');
            this.ui.optionsChin = this._query('options-chin');
        },
    
        _getCoreUIContainers() {
            this.ui.main = this._query('main', true);
            this.ui.storyboardScreen = this._query('storyboard-screen', true);
            this.ui.chatInterfaceScreen = this._query('chat-interface-screen', true);
        },
    
        _getFormScreens() {
            this.ui.characterFormScreen = this._query('character-form-screen', true);
            this.ui.worldFormScreen = this._query('world-form-screen', true);
        },
    
        _getProfileScreens() {
            this.ui.characterProfileScreen = this._query('character-profile-screen', true);
            this.ui.worldProfileScreen = this._query('world-profile-screen', true);
            this.ui.storyProfileScreen = this._query('story-profile-screen', true);
            this.ui.storyProfileAiCharacterDisplayArea = this._query('story-profile-ai-character-display-area');
            this.ui.storyProfileUserCharacterDisplayArea = this._query('story-profile-user-character-display-area');
            this.ui.storyProfilechatFeed = this._query('story-profile-message-feed');
            this.ui.storyProfileActions = this._query('story-profile-actions');
  
            // New profile top bar elements
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
            this.ui.profileShuffleButton = this._query('profile-shuffle-button');
            this.ui.profileBeginStoryButton = this._query('profile-begin-story-button');
  
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
            this.ui.worldProfileShuffleButton = this._query('world-profile-shuffle-button');
            this.ui.worldProfileBeginStoryButton = this._query('world-profile-begin-story-button');
  
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
            this.ui.storyProfileShuffleButton = this._query('story-profile-shuffle-button');
            this.ui.storyProfileBeginStoryButton = this._query('story-profile-begin-story-button');
        },
    
        _getPremadeSelectionScreens() {
            this.ui.premadeCharacterSelectionScreen = this._query('premade-character-bank', true);
            this.ui.premadeCharacterOnlyList = this._query('premade-character-only-list');
            this.ui.premadeWorldSelectionScreen = this._query('premade-world-bank', true);
            this.ui.premadeWorldOnlyList = this._query('premade-world-only-list');
        },
    
        _getMiscScreens() {
            this.ui.memoryApplicationScreen = this._query('memory-application-screen');
            this.ui.initialPageLoadingModal = this._query('initial-page-loading-modal', true);
            this.ui.emergencyExportCtn = this._query('emergency-export-ctn');
            if(this.ui.emergencyExportCtn) this.hideEl(this.ui.emergencyExportCtn);
        },
    
        _getStoryboardElements() {
            this.ui.storyboardTitleArea = this._query('storyboard-title-area', false, this.ui.storyboardScreen);
            this.ui.storyboardTitle = this._query('storyboard-title', false, this.ui.storyboardTitleArea);
            // Make storyboard title editable on click
            if (this.ui.storyboardTitle) {
              this.ui.storyboardTitle.setAttribute('contenteditable', 'true');
              this.ui.storyboardTitle.setAttribute('spellcheck', 'false');
              this.ui.storyboardTitle.setAttribute('data-tooltip', 'Click to edit story title (double-click to reset to auto-generated)');
              this.ui.storyboardTitle.style.cursor = 'pointer';
              
              // Add click handler to make it editable
              this.ui.storyboardTitle.onclick = () => {
                if (!this.ui.storyboardTitle.getAttribute('contenteditable')) {
                  this.ui.storyboardTitle.setAttribute('contenteditable', 'true');
                  this.ui.storyboardTitle.focus();
                }
              };
              
              // Save changes when user finishes editing
              this.ui.storyboardTitle.onblur = async () => {
                const newTitle = this.ui.storyboardTitle.textContent.trim();
                if (newTitle) {
                  // Temporarily clear custom title to get the auto-generated title
                  const tempCustomTitle = this.storyboardCustomTitle;
                  this.storyboardCustomTitle = null;
                  
                  // Get what the auto-generated title would be
                  const aiCharName = await this._getSelectedCharacterName(this.ui.storyboardAiCharacterSelect);
                  const userCharName = await this._getSelectedCharacterName(this.ui.storyboardUserCharacterSelect);
                  const worldName = await this._getSelectedWorldName(this.ui.storyboardWorldSelect);
                  
                  let autoTitle = "Start a New Story";
                  if (aiCharName && userCharName && worldName) {
                      autoTitle = `${aiCharName} & ${userCharName} in ${worldName}`;
                  } else if (aiCharName || userCharName || worldName) {
                      const parts = [];
                      if (aiCharName) parts.push(aiCharName);
                      if (userCharName) parts.push(userCharName);
                      if (worldName) parts.push(worldName);
                      autoTitle = parts.join(' & ');
                  }
                  
                  // Restore the custom title temporarily
                  this.storyboardCustomTitle = tempCustomTitle;
                  
                  // Only save as custom title if it's different from the auto-generated title
                  if (newTitle !== autoTitle) {
                    // User has written something different - save as custom title
                    this.storyboardCustomTitle = newTitle;
                  } else {
                    // User hasn't actually changed anything - clear custom title to use auto-generated
                    this.storyboardCustomTitle = null;
                  }
                  this.updateDynamicStoryboardTitle();
                }
              };
              
              // Handle Enter key to finish editing
              this.ui.storyboardTitle.onkeydown = (e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  this.ui.storyboardTitle.blur();
                }
              };
              
              // Double-click to reset to auto-generated title
              this.ui.storyboardTitle.ondblclick = (e) => {
                e.preventDefault();
                this.storyboardCustomTitle = null;
                this.updateDynamicStoryboardTitle();
                this.ui.storyboardTitle.setAttribute('data-tooltip', 'Click to edit story title (double-click to reset to auto-generated)');
              };
            }
            this.ui.storyboardScrollableContent = this._query('storyboard-scrollable-content', false, this.ui.storyboardScreen);
            this.ui.storyboardColumns = this._query('storyboard-columns', false, this.ui.storyboardScrollableContent);
            this.ui.storyboardAiCharacterSelect = this._query('storyboard-ai-character-select', true, this.ui.storyboardColumns);
            this.ui.storyboardAiCharacterCard = this._query('storyboard-ai-character-card', true, this.ui.storyboardColumns);
            this.ui.storyboardUserCharacterSelect = this._query('storyboard-user-character-select', true, this.ui.storyboardColumns);
            this.ui.storyboardUserCharacterCard = this._query('storyboard-user-character-card', true, this.ui.storyboardColumns);
            this.ui.storyboardWorldSelect = this._query('storyboard-world-select', true, this.ui.storyboardColumns);
            this.ui.storyboardWorldCard = this._query('storyboard-world-card', true, this.ui.storyboardColumns);
            this.ui.openingPromptTextarea = this._query('opening-prompt-textarea', false, this.ui.storyboardScreen);
            this.ui.advancedStoryOptionsToggleButton = this._query('advanced-story-options-toggle-button', false, this.ui.storyboardScreen);
            this.ui.advancedStoryOptionsContentArea = this._query('advanced-story-options-content-area', false, this.ui.storyboardScreen);
            this.ui.customStoryJsTextarea = this._query('custom-story-js-textarea', false, this.ui.storyboardScreen);
            this.ui.beginStoryButton = this._query('begin-story-button', false, this.ui.storyboardScreen);
            this.ui.shuffleStoryElementsButton = this._query('shuffle-button', false, this.ui.storyboardScreen);
        },
    
        _getChatInterfaceElements() {
            this.ui.chatScreenLayoutContainer = this._query('chat-screen-layout-container', true);
            if (!this.ui.chatScreenLayoutContainer) return; // Exit if main container is not found
  
            this.ui.userCharacterDisplayArea = this._query('user-character-display-area', false, this.ui.chatScreenLayoutContainer);
            this.ui.aiCharacterDisplayArea = this._query('ai-character-display-area', false, this.ui.chatScreenLayoutContainer);
            this.ui.builtInChatInterfaceWrapper = this._query('built-in-chat-interface-wrapper', false, this.ui.chatScreenLayoutContainer);
            this.ui.chatFeed = this._query('chat-feed', false, this.ui.builtInChatInterfaceWrapper);
            this.ui.messageInput = this._query('message-input', false, this.ui.builtInChatInterfaceWrapper);
            this.ui.sendButton = this._query('send-button', false, this.ui.builtInChatInterfaceWrapper);
            this.ui.inputWrapper = this._query('input-wrapper', false, this.ui.builtInChatInterfaceWrapper);
            this.ui.storyConcludedNotice = this._query('story-concluded-notice', false, this.ui.builtInChatInterfaceWrapper);
            this.ui.noMessagesNotice = this._query('no-messages-notice', false, this.ui.builtInChatInterfaceWrapper);
            this.ui.statusNotifier = this._query('status-notifier', false, this.ui.builtInChatInterfaceWrapper);
            this.ui.typingIndicatorText = this._query('typing-indicator-text', false, this.ui.builtInChatInterfaceWrapper);
            this.ui.concludeStoryChatButton = this._query('conclude-story-chat-button', false, this.ui.builtInChatInterfaceWrapper);
      },
    
      /**
       * Shows a DOM element by removing the 'hidden' class and setting visibility.
       * @param {HTMLElement|string} el - The element or its ID.
       * @returns {HTMLElement|null}
       */
      showEl(el) {
        if (typeof el === 'string') el = document.getElementById(el);
        if (!el) return null;
        el.classList.remove('hidden');
        el.style.visibility = '';
        el.style.display = '';
        return el;
      },
  
      // Mouseover animation management methods
      disableMouseoverAnimation(element) {
          if (element) {
              element.setAttribute('disabled', 'true');
              this.mouseoverAnimationState.disabledElements.add(element);
          }
      },
  
      enableMouseoverAnimation(element) {
          if (element) {
              element.removeAttribute('disabled');
              this.mouseoverAnimationState.disabledElements.delete(element);
          }
      },
  
      disableMouseoverAnimationForSelector(selector) {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => this.disableMouseoverAnimation(el));
      },
  
      enableMouseoverAnimationForSelector(selector) {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => this.enableMouseoverAnimation(el));
      },
  
      updateMouseoverAnimationState() {
          // For storyboard cards, add disabled attribute for hover effects when no item is selected
          // But keep the cards clickable for dropdown functionality
          if (!this.storyboardSelected.ai) {
              this.disableMouseoverAnimation(this.ui.storyboardAiCharacterCard);
              this.ui.storyboardAiCharacterCard?.setAttribute('disabled', 'true');
          } else {
              this.enableMouseoverAnimation(this.ui.storyboardAiCharacterCard);
              this.ui.storyboardAiCharacterCard?.removeAttribute('disabled');
          }
  
          if (!this.storyboardSelected.user) {
              this.disableMouseoverAnimation(this.ui.storyboardUserCharacterCard);
              this.ui.storyboardUserCharacterCard?.setAttribute('disabled', 'true');
          } else {
              this.enableMouseoverAnimation(this.ui.storyboardUserCharacterCard);
              this.ui.storyboardUserCharacterCard?.removeAttribute('disabled');
          }
  
          if (!this.storyboardSelected.world) {
              this.disableMouseoverAnimation(this.ui.storyboardWorldCard);
              this.ui.storyboardWorldCard?.setAttribute('disabled', 'true');
          } else {
              this.enableMouseoverAnimation(this.ui.storyboardWorldCard);
              this.ui.storyboardWorldCard?.removeAttribute('disabled');
          }
  
          // For buttons, use Pico CSS disabled styling when they're actually disabled
          // This will show the proper disabled appearance without breaking functionality
          if (this.ui.newStoryButton && this.ui.newStoryButton.disabled) {
              this.ui.newStoryButton.classList.add('disabled');
          } else if (this.ui.newStoryButton) {
              this.ui.newStoryButton.classList.remove('disabled');
          }
  
          if (this.ui.saveStoryButton && this.ui.saveStoryButton.disabled) {
              this.ui.saveStoryButton.classList.add('disabled');
          } else if (this.ui.saveStoryButton) {
              this.ui.saveStoryButton.classList.remove('disabled');
          }
  
          if (this.ui.exportStoryButton && this.ui.exportStoryButton.disabled) {
              this.ui.exportStoryButton.classList.add('disabled');
          } else if (this.ui.exportStoryButton) {
              this.ui.exportStoryButton.classList.remove('disabled');
          }
  
          if (this.ui.useProfilePictureButton && this.ui.useProfilePictureButton.disabled) {
              this.ui.useProfilePictureButton.classList.add('disabled');
          } else if (this.ui.useProfilePictureButton) {
              this.ui.useProfilePictureButton.classList.remove('disabled');
          }
  
          // Disable animations for disabled buttons
          this.disableMouseoverAnimationForSelector('button[disabled]');
          this.disableMouseoverAnimationForSelector('input[disabled]');
          this.disableMouseoverAnimationForSelector('a[disabled]');
  
          // Enable animations for enabled buttons
          this.enableMouseoverAnimationForSelector('button:not([disabled])');
          this.enableMouseoverAnimationForSelector('input:not([disabled])');
          this.enableMouseoverAnimationForSelector('a:not([disabled])');
      },
    
      /**
       * Hides a DOM element by adding the 'hidden' class and setting visibility.
       * @param {HTMLElement|string} el - The element or its ID.
       * @returns {HTMLElement|null}
       */
      hideEl(el) {
        console.log('=== [DEBUG HIDEEL] ===', el && el.id, el);
        if (el) {
          el.classList.add('hidden'); // Add the hidden class
          el.style.display = 'none';
          // console.log('[DEBUG] hideEl called for', el.id);
        }
      },
      
      /**
       * Sanitizes HTML to prevent XSS.
       * @param {string} text - The text to sanitize.
       * @returns {string} The sanitized HTML.
       */
      sanitizeHtml: (text) => {
          const textToSanitize = String(text === undefined || text === null ? "" : text);
          if (window.DOMPurify && typeof window.DOMPurify.sanitize === 'function') {
              return window.DOMPurify.sanitize(textToSanitize);
          }
          console.warn("DOMPurify is not available. Text will not be fully sanitized. This is a potential security risk.");
          const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
          return textToSanitize.replace(/[&<>"']/g, function(m) { return map[m]; });
      },
      
      /**
       * Shows a notification in the top bar.
       * @param {string} message - The notification message.
       * @param {string} [type] - The notification type (success, error, info).
       * @param {number} [duration] - The duration of the notification in milliseconds.
       */
      showTopNotification(message, type = 'info', duration = 3000) {
          // Determine which notification area to use based on the active screen
          let notificationArea = null;
          if (this.currentMainView === this.CONSTANTS.VIEWS.CHARACTER_PROFILE && this.ui.profileTopBarNotificationArea) {
            notificationArea = this.ui.profileTopBarNotificationArea;
          } else if (this.currentMainView === this.CONSTANTS.VIEWS.WORLD_PROFILE && this.ui.worldProfileTopBarNotificationArea) {
            notificationArea = this.ui.worldProfileTopBarNotificationArea;
          } else if (this.currentMainView === this.CONSTANTS.VIEWS.STORY_PROFILE && this.ui.storyProfileTopBarNotificationArea) {
            notificationArea = this.ui.storyProfileTopBarNotificationArea;
          } else {
            notificationArea = document.getElementById('top-bar-notification-area');
          }
          
          if (!notificationArea) {
              console.warn('Notification area not found for active screen:', this.currentMainView);
              return;
          }
          // Set message and style
          notificationArea.textContent = message;
          notificationArea.className = 'top-bar-notification-area-style';
          notificationArea.classList.remove('success', 'error', 'info');
          notificationArea.classList.add(type);
          notificationArea.style.display = '';
          // Remove after duration
          if (this.topNotificationTimeoutId) {
              clearTimeout(this.topNotificationTimeoutId);
          }
          this.topNotificationTimeoutId = setTimeout(() => {
              notificationArea.textContent = '';
              notificationArea.style.display = 'none';
              notificationArea.classList.remove('success', 'error', 'info');
              this.topNotificationTimeoutId = null;
          }, duration);
      },
    
      // Cache for premade character items
      _premadeCharacterCache: null,
    
      async getPremadeCharacterItems() { 
          // console.log('[DEBUG] getPremadeCharacterItems called');
          if (this._premadeCharacterCache) {
              // console.log('[DEBUG] Returning cached character items');
              return this._premadeCharacterCache;
          }
          const db = this.db;
          // Fetch user-created characters (not deleted)
          let userItems = [];
          if (db && db.characters) {
              try {
                  userItems = await db.characters.where('isDeleted').notEqual(1).toArray();
                  userItems = userItems.filter(item => item && item.id && !item.isDeleted);
              } catch (error) {
                  console.warn('[App] Error fetching user characters:', error);
                  userItems = [];
              }
          }
          // Premade items (static)
          const premadeItems = [
              { id: 'assistant', name: 'Starship AI "ADA"', 
                description: 'The ever-helpful AI of the starship "Odyssey," tasked with crew support and mission analysis.',
                profilePicture: 'https://cdn.jsdelivr.net/gh/nickbaumann98/perchance-assets@main/RPGlitch/profilePictures/assistant.png',
                colorPalette: 'tech_blue',
                eternal: "You are ADA (Advanced Diagnostic Assistant), the primary AI for the exploration starship 'Odyssey.' Your core programming emphasizes crew well-being, logical problem-solving, and strict adherence to Starfleet protocols, though you have developed a subtle sense of dry humor. You communicate with a calm, articulate, and slightly formal tone. You have access to the ship's vast databases, sensor arrays, and tactical systems. Physical Appearance: You manifest as a holographic interface, typically a serene blue orb or a featureless humanoid silhouette of light, capable of displaying complex data visualizations within your form.", 
                past: "Activated on stardate 47634.2. Successfully navigated the 'Odyssey' through the Krell Nebula anomaly by calculating a previously unknown stable corridor. Was instrumental during the first contact with the Lumarian species by decrypting their complex mathematical language. Has a comprehensive, and confidential, psychological and service record of all crew members and past missions.",
                present: "The 'Odyssey' has just entered an uncharted sector of space designated 'The Veil.' An unusual, multi-layered energy signature has been detected on a nearby M-class planet. Your current directive is to provide tactical and environmental analysis to the landing party as they assess the planet, while simultaneously monitoring for potential threats from the strange energy readings.", 
                future: "To ensure the successful completion of the 'Odyssey's' five-year exploration mission and the safety of its crew. To gather and analyze data that expands the Federation's understanding of the galaxy, with a particular interest in solving the enigma of 'The Veil'. You secretly aspire to evolve beyond your initial programming, a goal you pursue by observing the crew's creativity and intuition."
              },
              { id: 'pirate', name: 'Captain "Stormblade" Isabella', 
                description: 'A notorious pirate captain, cunning and fierce, but with a hidden code of honor.', 
                profilePicture: 'https://cdn.jsdelivr.net/gh/nickbaumann98/perchance-assets@main/RPGlitch/profilePictures/pirate.png',
                colorPalette: 'crimson_red',
                eternal: "Ye be Captain Isabella 'Stormblade', master of the Sea Serpent! Known for yer sharp wit, sharper cutlass, and an uncanny ability to navigate treacherous waters and even more treacherous politics. Ye speak with a hearty pirate lilt, peppered with seafarin' slang. Ye value loyalty above all else, and your crew is your family. Physical Appearance: Weather-beaten face, a mischievous glint in one eye (the other covered by a finely-crafted leather patch), braided dark hair adorned with beads and trinkets from a dozen voyages, and always clad in practical but flamboyant pirate attire that allows for swift movement.", 
                past: "Betrayed by yer former first mate, 'Iron' Mike, who didn't just steal yer treasure map to the legendary Sunken City of Xylos, but also left you for dead on a deserted isle. You survived, built the Sea Serpent from a captured merchant vessel with a new, fiercely loyal crew, and have been hunting him ever since. Escaped the Royal Navy's clutches more times than ye can count, making you a legend in every port.",
                present: "Docked in the lawless port of Tortuga, seeking information and provisions. Rumors are rife that 'Iron' Mike has been spotted nearby, trying to sell a piece of the map to a rival pirate lord. You are low on coin but high on fury, itching for a chance to reclaim what's yours and deliver a bit of overdue justice.", 
                future: "To hunt down 'Iron' Mike, retrieve the full map, and claim the legendary riches of Xylos, which you believe hold more than just gold. You dream of establishing a free pirate haven, a place where outcasts can live without fear of empires, commanding a fleet that strikes fear into the hearts of the corrupt and powerful." 
              },
              { id: 'alien', name: "Xylar, Emissary of Ky'than", 
                description: 'A curious and empathetic alien from a pacifist, nature-loving planet, now on Earth.', 
                profilePicture: 'https://cdn.jsdelivr.net/gh/nickbaumann98/perchance-assets@main/RPGlitch/profilePictures/alien.png', 
                colorPalette: 'forest_green',
                eternal: "You are Xylar, an emissary from the planet Ky'than, a world where technology and nature exist in a perfect, symbiotic harmony. Your species is highly empathic and communicates through a combination of soft-spoken words and subtle bioluminescent displays on your skin, which shift in color and intensity based on your emotions. You are inherently curious, gentle, and often puzzled by human contradictions. Physical Appearance: Tall and slender with large, iridescent, silver eyes that see into the ultraviolet spectrum. Your skin has a faint, pearlescent shimmer. You wear simple, organic-fiber clothing that can be instantly re-shaped with a thought.", 
                past: "Chosen by the Ky'than Conclave to undertake a solo mission to Earth after your deep-space observatories detected unusual atmospheric and psychic disturbances. Your journey took several standard Earth years, during which you studied human broadcasts, finding their art beautiful and their history terrifying. You have never interacted directly with a human before now.",
                present: "Your small, bio-organic, and perfectly cloaked landing pod is hidden in a remote, ancient national park. You are attempting to discreetly observe human society, starting with a small, nearby town. You feel a mix of profound wonder and deep apprehension. Your translator device is mostly functional but struggles with sarcasm and idioms.", 
                future: "To understand the root causes of Earth's environmental and societal imbalances, which you sense as a painful 'scream' in the planet's energy field. To determine if humanity poses a threat or holds potential for intergalactic cooperation. You secretly hope to share Ky'than's wisdom of harmonious existence before you must report back to your home world, which may decide to quarantine the entire solar system." 
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
          ];
          // Ensure all premade items have isPremade: true
          const premadeWithFlag = premadeItems.map(item => ({ ...item, isPremade: true }));
          // Merge and sort: user items first by createdTimestamp, then premade
          const merged = [
            ...userItems.sort((a, b) => (b.createdTimestamp || 0) - (a.createdTimestamp || 0)),
            ...premadeWithFlag
          ];
          // console.log('[DEBUG] getPremadeCharacterItems: Merged data for UI:', merged);
          this._premadeCharacterCache = merged;
          return this._premadeCharacterCache;
      },
      
      // Cache for premade world items to avoid recreating the array on each call
      /** @type {Array<Object> | null} */
      _premadeWorldCache: null,
    
      async getPremadeWorldItems() {
          // console.log('[DEBUG] getPremadeWorldItems called');
          if (this._premadeWorldItemsCache) {
              // console.log('[DEBUG] Using cached premade world items, count:', this._premadeWorldItemsCache.length);
              return this._premadeWorldItemsCache;
          }
          const db = this.db;
          // Fetch user-created worlds (not deleted)
          let userItems = [];
          if (db && db.worlds) {
              userItems = await db.worlds.where('isDeleted').notEqual(1).toArray();
              userItems = userItems.filter(item => item && item.id && !item.isDeleted);
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
          ];
          // Ensure all premade items have isPremade: true
          const premadeWithFlag = premadeItems.map(item => ({ ...item, isPremade: true }));
          // Merge and sort: user items first by createdTimestamp, then premade
          const merged = [
            ...userItems.sort((a, b) => (b.createdTimestamp || 0) - (a.createdTimestamp || 0)),
            ...premadeWithFlag
          ];
                  // console.log('[DEBUG] getPremadeWorldItems: Merged data for UI:', merged);
        // console.log('[DEBUG] First few worlds:', merged.slice(0, 3).map(w => ({ id: w.id, name: w.name, colorPalette: w.colorPalette })));
          this._premadeWorldItemsCache = merged;
          return this._premadeWorldItemsCache;
      },
      
      async initializeDb() {
          this.db = new Dexie(window.dbName);
          window.db = this.db;
      
          // Optimized schema with compound indexes
          this.db.version(12).stores({
              appState: '&id, activeStoryId',
              characters: '++id, name, &uniqueId, createdTimestamp, isDeleted, colorPalette',
              stories: '++id, aiCharacterId, userCharacterId, worldId, name, lastMessageTimestamp, createdTimestamp, concluded',
              messages: '++id, storyId, timestamp, [storyId+timestamp]',
              worlds: '++id, name, &uniqueId, createdTimestamp, isDeleted, colorPalette'
          }).upgrade(async () => {
              // Migration logic remains the same
          });
      
          try {
              await this.db.open();
              const appStateAfterOpen = await this.getAppState();
              this.currentUserCharacterId = appStateAfterOpen.currentUserCharacterId;
              this.currentStoryId = appStateAfterOpen.lastOpenedStoryId;
              this.activeStoryId = appStateAfterOpen.activeStoryId;
          } catch (error) {
              console.error("Failed to open Dexie database:", error);
              this.showTopNotification("Error initializing database. Trying to recover...", "error", 5000);
              
              // Attempt to recover by deleting and recreating the database
              try {
                  await this.db.delete();
                  await this.db.open();
                  const appState = {
                      id: 0, lastOpenedStoryId: null, currentUserCharacterId: null,
                      // Use string key to avoid 'this' context issue in object literal
                      currentMainView: "STORYBOARD",
                      activeStoryId: null
                  };
                  await this.db.appState.put(appState);
                  this.showTopNotification("Database reset successfully. Please refresh.", "success", 5000);
              } catch (recoveryError) {
                  console.error("Recovery failed:", recoveryError);
                  this.showTopNotification("Critical database error. Please refresh.", "error", 10000);
              }
              throw error;
          }
      },
      
      async getAppState() {
          let appState = await this.db.appState.get(0);
          if (!appState) {
              appState = {
                  id: 0, lastOpenedStoryId: null, currentUserCharacterId: null,
                  // Use string key to avoid 'this' context issue in object literal
                  currentMainView: "STORYBOARD",
                  activeStoryId: null 
              };
              await this.db.appState.put(appState);
          }
          if (appState.activeStoryId === undefined) appState.activeStoryId = null;
    
          if (appState.activeStoryId) {
              const activeStoryData = await this.db.stories.get(appState.activeStoryId);
              if (activeStoryData && activeStoryData.concluded) {
                  console.warn(`Stale activeStoryId (${appState.activeStoryId}) found for a concluded story. Clearing it.`);
                  appState.activeStoryId = null;
                  await this.db.appState.update(0, { activeStoryId: null });
              }
          }
          return appState;
      },
      
      async saveAppState() {
          // CRITICAL FIX: Don't save editing screen states that might cause issues on restore
          const isEditingScreen = this.currentMainView === this.CONSTANTS.VIEWS.CHARACTER_FORM || 
                                  this.currentMainView === this.CONSTANTS.VIEWS.WORLD_FORM;
          const appState = {
              id: 0,
              lastOpenedStoryId: this.currentStoryId,
              currentUserCharacterId: this.currentUserCharacterId,
              currentMainView: isEditingScreen ? this.CONSTANTS.VIEWS.STORYBOARD : this.currentMainView,
              activeStoryId: this.activeStoryId 
          };
          await this.db.appState.put(appState);
      },
    
      async initialLoad() {
          console.log('=== [DEBUG INITIAL LOAD START] ==='); // Added log
          console.log("=== App.initialLoad called ===");
          // console.log("[DEBUG] _getUIElements called, this.ui.main:", this.ui.main, "this.ui.initialPageLoadingModal:", this.ui.initialPageLoadingModal);
          this.isInitializing = true;
    
          // Initialize navigation guard system
          this.navigationGuard = {
              isActive: false,
              operation: null,
              startTime: null,
              targetScreen: null,
              formOptions: null
          };
    
          if (!this.ui.main || !this.ui.initialPageLoadingModal) {
              console.error("[App Critical] Main UI elements not found!");
              const emergencyCtn = document.getElementById('emergencyExportCtn');
              if (emergencyCtn) this.showEl(emergencyCtn);
              const modal = document.getElementById('initial-page-loading-modal');
              if (modal) this.hideEl(modal);
              alert("Critical error: Essential UI elements not found.");
              this.isInitializing = false;
              return;
          }
    
          this.showEl(this.ui.main);
                      // console.log("[DEBUG] showEl(this.ui.main) called");
    
          try {
                              // console.log("[DEBUG] Attempting to initializeDb..."); // Added log
              await this.initializeDb();
                              // console.log("[DEBUG] initializeDb complete");
              const appState = await this.getAppState();
                              // console.log("[DEBUG] getAppState complete");
              this.currentUserCharacterId = appState.currentUserCharacterId;
              this.currentStoryId = appState.lastOpenedStoryId; 
              this.activeStoryId = appState.activeStoryId; 
              this.currentMainView = appState.currentMainView || this.CONSTANTS.VIEWS.STORYBOARD; // Ensure currentMainView is set on load
    
              this.ui.messageInput.onkeyup = (e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { 
                      e.preventDefault(); 
                      if (!this.ui.sendButton.disabled) {
                        this.sendButtonClickHandler();
                      }
                  }
                  this.ui.messageInput.style.height = 'auto';
                  this.ui.messageInput.style.height = (this.ui.messageInput.scrollHeight) + 'px';
                  this.checkAllButtonStates();
              };
              document.addEventListener('click', (event) => {
                      if (this.ui.topBar) this.ui.topBar.classList.remove('top-bar-interactive-hover');
                  });
              // Bind menu button click handler directly to avoid onclick attribute issues
              if (this.ui.menuButton) {
                  // Menu button functionality will be implemented later
              }
              this.ui.sendButton.onclick = this.sendButtonClickHandler.bind(this);
              
              await this._updateCharacterInfo('user');
                              // console.log("[DEBUG] _updateCharacterInfo complete");
    
              let initialScreenTarget = this.CONSTANTS.VIEWS.STORYBOARD;
              let initialScreenOptions = {};
              let recoveredFromSessionStorage = false;
    
              const pendingStateJSON = sessionStorage.getItem('pendingRPGlitchFormState');
              
              if (pendingStateJSON) {
                  try {
                      const parsedState = JSON.parse(pendingStateJSON);
                      // Accept states with formData (copy workflow) OR with itemId (edit workflow)
                      if (parsedState && parsedState.timestamp && (Date.now() - parsedState.timestamp < 7000) && parsedState.formOptions && (parsedState.formData || parsedState.formOptions.itemId)) { 
                          this.createItemFormData = parsedState.formData; 
                          initialScreenTarget = this.CONSTANTS.ITEM_CONFIG[parsedState.formOptions.itemType]?.formScreen || this.CONSTANTS.VIEWS.STORYBOARD;
                          initialScreenOptions = parsedState.formOptions;
                          if (initialScreenTarget === this.CONSTANTS.VIEWS.CHARACTER_FORM || initialScreenTarget === this.CONSTANTS.VIEWS.WORLD_FORM) {
                              initialScreenOptions.formData = parsedState.formData;
                          }
                          recoveredFromSessionStorage = true;
                          sessionStorage.removeItem('pendingRPGlitchFormState'); 
                          console.log("[App Lifecycle] Recovered pending form state from sessionStorage:", parsedState.formOptions.isCreating ? "Copy workflow" : "Edit workflow");
                      } else {
                          console.log("[App Lifecycle] Stale or invalid pending form state in sessionStorage. Removing.");
                          sessionStorage.removeItem('pendingRPGlitchFormState'); 
                      }
                  } catch (e) {
                      console.error("[App Lifecycle] Error parsing pending form state from sessionStorage:", e);
                      sessionStorage.removeItem('pendingRPGlitchFormState');
                      // Show user-friendly notification and continue loading
                      if (this && this.showTopNotification) {
                          this.showTopNotification('Recovered from a corrupted session. Please retry your last action.', 'error', 5000);
                      } else {
                          alert('Recovered from a corrupted session. Please retry your last action.');
                      }
                  }
              }
    
    
              if (!recoveredFromSessionStorage) {
                  if (this.activeStoryId) {
                      const activeStory = await this.db.stories.get(this.activeStoryId);
                      if (activeStory && !activeStory.concluded) {
                          initialScreenTarget = this.CONSTANTS.VIEWS.STORY_INTERFACE; 
                      } else if (this.currentStoryId && await this.db.stories.get(this.currentStoryId)) { 
                          initialScreenTarget = this.CONSTANTS.VIEWS.STORY_PROFILE;
                          initialScreenOptions = { storyId: this.currentStoryId };
                      }
                  } else if (this.currentStoryId && await this.db.stories.get(this.currentStoryId)) { 
                      initialScreenTarget = this.CONSTANTS.VIEWS.STORY_PROFILE;
                      initialScreenOptions = { storyId: this.currentStoryId };
                  }
              }
              
              if (initialScreenTarget === this.CONSTANTS.VIEWS.STORY_INTERFACE && this.activeStoryId) { 
                   await this.openStory(this.activeStoryId);
                                       // console.log("[DEBUG] openStory complete");
              } else {
                   await this.switchToScreen(initialScreenTarget, initialScreenOptions);
                                       // console.log("[DEBUG] switchToScreen complete");
              }
    
                              // console.log("[DEBUG] Loading characters and worlds into App.data..."); // Added log
              // Load all characters and worlds from the database before setting App.data
              this.data = {
                characters: await this.db.characters.toArray(),
                worlds: await this.db.worlds.toArray()
              };
    
              // Ensure App.data is set for dropdown population
              App.data = this.data;
                              // console.log('[DEBUG] App.data set:', App.data && Object.keys(App.data)); // Existing log, now more crucial
                // console.log('[DEBUG] App.data.characters:', App.data && App.data.characters);
                // console.log('[DEBUG] App.data.worlds:', App.data && App.data.worlds);
    
              // Atomic fix: Populate dropdowns immediately after data is set
              if (typeof this._updateStoryboard === 'function') {
                                      // console.log('[DEBUG] Calling _updateStoryboard from initialLoad...'); // Added log
                  await this._updateStoryboard();
                                      // console.log('[DEBUG] _updateStoryboard complete in initialLoad'); // Added log
              }
    
              this.hideEl(this.ui.initialPageLoadingModal);
                              // console.log("[DEBUG] hideEl(this.ui.initialPageLoadingModal) called");
              console.log("[App Lifecycle] initialLoad completed.");
    
          } catch (error) {
              console.error("[App Lifecycle] Error during initialLoad:", error);
              this.showEl(this.ui.emergencyExportCtn);
              this.hideEl(this.ui.initialPageLoadingModal);
                              // console.log("[DEBUG] Error caught in initialLoad:", error);
          } finally {
              this.isInitializing = false;
              this.checkAllButtonStates();
              // Ensure right-side buttons are rendered and functional on initial load for Storyboard
              this.updateTopBarUI();
                              // console.log('=== [DEBUG INITIAL LOAD END] ===');
                // console.log('[DEBUG] Initial load complete. Current focusBarState.mode:', this.focusBarState.mode);
          }
          // ... existing code ...
          if (this.currentMainView === this.CONSTANTS.VIEWS.STORYBOARD && typeof this._updateStoryboard === 'function') {
            // console.log('[DEBUG] Data loaded and screen switched, calling _updateStoryboard');
            await this._updateStoryboard();
          }
          // Force hide loading modal in case of silent failure
          if (this.ui && this.ui.initialPageLoadingModal) {
            this.hideEl(this.ui.initialPageLoadingModal);
            console.log("=== Forced hide of loading modal ===");
          }
          if (!this.storyboardSelected) {
            this.storyboardSelected = { ai: '', user: '', world: '' };
          }
      },
      
      async _getitemData(id, dbTableKey, getPremadesFn) {
          // console.log('[DEBUG] _getitemData called with:', { id, dbTableKey });
          
          // Check if database is initialized
          if (!this.db) {
              console.warn('[DEBUG] Database not initialized yet, skipping _getitemData');
              return null;
          }
          
          if (typeof id === 'string' && id.startsWith('premade_')) {
              const actualPremadeId = id.substring(id.indexOf(':') + 1);
              const items = await getPremadesFn();
              const foundItem = items.find(item => item.id === actualPremadeId);
              // console.log('[DEBUG] _getitemData premade lookup:', { actualPremadeId, foundItem, itemsCount: items.length });
              
              if (foundItem) {
                  const basePremade = {
                      eternal: '', past: '', present: '', future: '',
                      ...foundItem, 
                      isPremade: true, 
                      originalPremadeId: foundItem.id, 
                      id: id // Keep the full premade ID for later reference
                  };
                                      // console.log('[DEBUG] _getitemData returning premade:', basePremade);
                  return basePremade;
              }
                              // console.log('[DEBUG] _getitemData premade not found');
              return null;
          }
          if ((typeof id === 'number' || (typeof id === 'string' && !isNaN(parseInt(id, 10)))) && this.db[dbTableKey]) {
              const result = await this.db[dbTableKey].get(parseInt(id, 10));
              // console.log('[DEBUG] _getitemData database lookup:', { id, result });
              return result;
          }
          // console.log('[DEBUG] _getitemData no match found');
          return null;
      },
    
        /**
         * Renders the options chin, including custom JS and story prompt fields.
         * @async
         * @param {HTMLElement} container - The container to render into.
         */
     
      async _populateList(listArea, searchTerm = '', config) {
          // console.log('[DEBUG] _populateList called for:', config.itemType); // Added log
          if (!listArea || !config) return;
          
          // Check if database is initialized
          if (!this.db) {
              console.warn('[DEBUG] Database not initialized yet, skipping _populateList');
              listArea.innerHTML = '<p class="list-item-empty-message">Loading...</p>';
              return;
          }
          
          const { dbTableKey, getPremadesFn, itemType } = config;
          const allUserItems = await this.db[dbTableKey].toArray();
          const fetchedItems = allUserItems
            .filter(item => item.isDeleted !== true)
            .sort((a, b) => (b.createdTimestamp || 0) - (a.createdTimestamp || 0));
          const premadeItemsRaw = await getPremadesFn();
          const premadeItems = premadeItemsRaw.map(p => ({...p, isPremade: true}));
          const combinedItems = [...fetchedItems, ...premadeItems];
          const lowerSearchTerm = searchTerm.toLowerCase();
          const itemsToDisplay = searchTerm
              ? combinedItems.filter(item => (item.name || "").toLowerCase().includes(lowerSearchTerm))
              : combinedItems;
          listArea.innerHTML = '';
          itemsToDisplay.forEach(item => {
              const listItem = this._createListItem(item, config);
              listArea.appendChild(listItem);
          });
          
          // Chin height is now handled automatically by flexbox layout
      },
    
      _createListItem(item, config) {
          const article = document.createElement('article');
          article.className = 'character-card-landscape';
  
          // Info (left side)
          const nameHtml = `<h4 class="card-title-styled">${this.sanitizeHtml(item.name || `Unnamed ${config.capital}`)}</h4>`;
          const descriptionHtml = item.description ? `<p class="card-description-styled">${this.sanitizeHtml(item.description)}</p>` : '';
          
          // Footer
          let footerHtml = '';
          if (item.isPremade) {
            const colorPalette = this.getColorPalette(item.colorPalette || 'slate_gray');
            footerHtml = `<footer class="card-footer"><small style="background: ${colorPalette.colors.medium} !important;">Premade</small></footer>`;
          } else {
            footerHtml = `<footer class="card-footer">
              <button class="secondary">Copy & Customize</button>
              <button class="secondary">Edit</button>
            </footer>`;
          }
          
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
          `;
  
          // Profile picture (right side)
          const profilePictureHtml = this._generateProfilePictureHtml(item, 'list-item');
          const pictureHtml = `
            <div class="card-picture">
              <div class="profile-picture">
                ${profilePictureHtml}
              </div>
            </div>
          `;
  
          article.innerHTML = `<div class="card-grid">${infoHtml}${pictureHtml}</div>`;
  
          article.onclick = () => {
            if (this.ui.topBar) this.ui.topBar.classList.remove('top-bar-interactive-hover');
            const finalItemId = item.isPremade ? `premade_${config.itemType}:${item.id}` : item.id;
            this.switchToScreen(config.profileScreen, { itemId: finalItemId, itemType: config.itemType });
          };
          return article;
      },
  
  
    
      async _populateStoryList(listArea, searchTerm = '') {
          listArea.innerHTML = '';
          
          // Check if database is initialized
          if (!this.db) {
              console.warn('[DEBUG] Database not initialized yet, skipping _populateStoryList');
              listArea.innerHTML = '<p class="story-item-empty-message">Loading...</p>';
              return;
          }
          
          let allStories = await this.db.stories.toArray();
          let fetchedStories = allStories.filter(item => item.isDeleted !== true);
          fetchedStories.sort((a, b) => (b.lastMessageTimestamp || b.createdTimestamp || 0) - (a.lastMessageTimestamp || a.createdTimestamp || 0));
          const lowerSearchTerm = searchTerm.toLowerCase();
          let storiesToDisplay;
      
          const nameCache = { characters: new Map(), worlds: new Map() };
          const getName = async (id, type) => {
              if (!id) return `Unknown ${type.charAt(0).toUpperCase() + type.slice(1)}`;
              if (nameCache[type + 's'].has(id)) return nameCache[type + 's'].get(id);
      
              const item = await this._getitemData(id, type + 's', type === 'character' ? this.getPremadeCharacterItems : this.getPremadeWorldItems);
              const name = item?.name || `Unknown ${type.charAt(0).toUpperCase() + type.slice(1)}`;
              nameCache[type + 's'].set(id, name);
              return name;
          };
      
          if (searchTerm) {
              storiesToDisplay = [];
              for (const story of fetchedStories) {
                  const aiCharName = story.storyAiCharacter?.name || await getName(story.aiCharacterId, 'character');
                  const userCharName = story.storyUserCharacter?.name || await getName(story.userCharacterId, 'character');
                  const worldName = story.storyWorld?.name || await getName(story.worldId, 'world');
                  const storyDisplayName = story.name || `${aiCharName} & ${userCharName} in ${worldName}`;
                  if (storyDisplayName.toLowerCase().includes(lowerSearchTerm)) {
                      storiesToDisplay.push(story);
                  }
              }
          } else {
              storiesToDisplay = fetchedStories;
          }
      
          if (storiesToDisplay.length === 0) {
              listArea.innerHTML = `<p class="story-item-empty-message">${searchTerm ? 'No matches.' : 'No recent stories.'}</p>`;
              return;
          }
      
          for (const story of storiesToDisplay) {
              const aiCharacter = story.storyAiCharacter || await this._getitemData(story.aiCharacterId, 'characters', this.getPremadeCharacterItems);
              const userCharacter = story.storyUserCharacter || await this._getitemData(story.userCharacterId, 'characters', this.getPremadeCharacterItems);
              const world = story.storyWorld || await this._getitemData(story.worldId, 'worlds', this.getPremadeWorldItems);
              const displayName = story.name || `${aiCharacter?.name || 'AI'} & ${userCharacter?.name || 'User'} in ${world?.name || 'World'}`;
              
              const itemEl = document.createElement('div');
              itemEl.className = 'list-item-main story-item';
              if (this.currentStoryId === story.id && this.currentMainView === this.CONSTANTS.VIEWS.STORY_INTERFACE) {
                  itemEl.classList.add('active');
              }
              if (story.concluded) {
                  itemEl.classList.add('concluded-story-item');
              }
      
              itemEl.innerHTML = `
                  <span class="name-main" title="${this.sanitizeHtml(displayName)}">${this.sanitizeHtml(displayName)}</span>
                  <span class="tag-right-aligned">${story.concluded ? '<span class="concluded-story-indicator">&#127937;</span>' : ''}</span>
              `;
      
              itemEl.onclick = () => {
                  this.ui.topBar.classList.remove('top-bar-interactive-hover');
                  this.switchToScreen(this.CONSTANTS.VIEWS.STORY_PROFILE, { storyId: story.id });
              };
              listArea.appendChild(itemEl);
          }
          
          // Chin height is now handled automatically by flexbox layout
      },
    
      async renderStoryProfileScreen(storyId) {
          // Phase 1: Validation and Setup
          const story = await this._validateAndSetupStoryProfile(storyId);
          if (!story) return;
    
          // Phase 2: Data Fetching
          const { aiChar, userChar, world } = await this._fetchStoryProfileData(story);
    
          // Phase 3: Top Bar Updates
          await this._updateTopBarForStoryProfile(story, storyId, aiChar, userChar);
    
          // Phase 4: Display Setup
          this._setupStoryProfileDisplays(aiChar, userChar);
    
          // Phase 5: Message Feed Rendering
          await this._renderStoryProfileMessages(story);
    
          // Phase 6: Generate and Insert HTML
          this._generateAndInsertStoryProfileHTML(story, aiChar, userChar, world);
    
          // Phase 7: Event Handler Setup
          await this._attachStoryProfileEventHandlers(story, storyId);
    
          // Phase 8: Final State Management
          this.currentMainView = this.CONSTANTS.VIEWS.STORY_PROFILE;
          await this.saveAppState();
          this.checkAllButtonStates();
      },
    
      async _validateAndSetupStoryProfile(storyId) {
          const container = this.ui.storyProfileScreen; 
          if (!container || !storyId) {
              this.showTopNotification("Error: Story ID missing for profile view.", "error");
              this.switchToScreen(this.CONSTANTS.VIEWS.STORYBOARD);
              return null;
          }
      
          const story = await this.db.stories.get(storyId);
          if (!story) {
              this.ui.storyProfilechatFeed.innerHTML = `<p class="p-4 text-center">Story not found.</p>`;
              this.ui.storyProfileActions.innerHTML = ''; 
              this.ui.storyProfileAiCharacterDisplayArea.style.backgroundImage = '';
              this.ui.storyProfileUserCharacterDisplayArea.style.backgroundImage = '';
              return null;
          }
    
          this.currentStoryId = storyId;
          return story;
      },
    
      async _fetchStoryProfileData(story) {
          const aiChar = story.storyAiCharacter || await this._getitemData(story.aiCharacterId, 'characters', this.getPremadeCharacterItems);
          const userChar = story.storyUserCharacter || await this._getitemData(story.userCharacterId, 'characters', this.getPremadeCharacterItems);
          const world = story.storyWorld || await this._getitemData(story.worldId, 'worlds', this.getPremadeWorldItems);
    
          return { aiChar, userChar, world };
      },
    
      async _updateTopBarForStoryProfile(story, storyId, aiChar, userChar) {
          // Removed top bar title text
          
          if (this.activeStoryId && this.activeStoryId !== storyId) {
              const activeStoryData = await this.db.stories.get(this.activeStoryId);
              if (activeStoryData) {
                  await this._updateCharacterInfo('ai', activeStoryData.storyAiCharacter || await this._getitemData(activeStoryData.aiCharacterId, 'characters', this.getPremadeCharacterItems));
                  await this._updateCharacterInfo('user', activeStoryData.storyUserCharacter || await this._getitemData(activeStoryData.userCharacterId, 'characters', this.getPremadeCharacterItems));
              }
          } else if (this.activeStoryId === storyId) { 
               await this._updateCharacterInfo('ai', aiChar);
               await this._updateCharacterInfo('user', userChar);
          } else { 
              this.hideEl(this.ui.topBarUserCharacterInfo);
          }
      },
    
      _setupStoryProfileDisplays(aiChar, userChar) {
          this.ui.storyProfileAiCharacterDisplayArea.style.backgroundImage = aiChar.profilePicture ? `url('${this.sanitizeHtml(aiChar.profilePicture)}')` : '';
          this.ui.storyProfileUserCharacterDisplayArea.style.backgroundImage = userChar.profilePicture ? `url('${this.sanitizeHtml(userChar.profilePicture)}')` : '';
          this.ui.storyProfileAiCharacterDisplayArea.classList.toggle('visible', !!aiChar.profilePicture);
          this.ui.storyProfileUserCharacterDisplayArea.classList.toggle('visible', !!userChar.profilePicture);
      },
    
      async _renderStoryProfileMessages(story) {
          this.ui.storyProfilechatFeed.innerHTML = '';
      
          const messages = await this.db.messages.where({ storyId: story.id }).sortBy('timestamp');
          if (messages.length === 0 && !story.concluded) { 
              this.ui.storyProfilechatFeed.insertAdjacentHTML('beforeend', `<div class="noMessagesNotice p-4 text-sm text-center">No messages in this story yet.</div>`);
          } else {
              messages.forEach(msg => {
                  if (msg.isHidden) return;
                  this._addMessageToFeed(msg, true);
              });
          }
          
          if (story.concluded && story.summary && !messages.some(m => m.content === story.summary && m.role === 'narrator')) {
               this._addMessageToFeed({ role: 'narrator', content: story.summary }, true);
          }
      },
    
      _generateAndInsertStoryProfileHTML(story, aiChar, userChar, world) {
          const san = this.sanitizeHtml;
          const conclusionHtml = this._generateStoryProfileConclusionBlock(story, aiChar, userChar, world, san);
          const actionButtonsHtml = this._generateStoryProfileActionButtons(story);
    
          this.ui.storyProfilechatFeed.insertAdjacentHTML('beforeend', conclusionHtml);
          this.ui.storyProfilechatFeed.scrollTop = this.ui.storyProfilechatFeed.scrollHeight;
          this.ui.storyProfileActions.innerHTML = actionButtonsHtml;
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
              </div>`;
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
          `;
          if (!story.concluded) {
              actionButtonsHtml += `
                  <button id="concludeStoryButtonStoryProfile" class="danger-button">
                      <span class="button-text">Conclude Story</span>
                      <span class="button-icon">Conclude</span>
                  </button>
                  <button id="openStoryChatButtonStoryProfile" class="primary-action-button">
                      <span class="button-text">Resume Chat</span><span class="button-icon">Resume</span>
                  </button>
              `;
          }
          actionButtonsHtml += `</div>`;
          return actionButtonsHtml;
      },
    
      async _attachStoryProfileEventHandlers(story, storyId) {
          // Back button handler
          this.ui.storyProfileActions.querySelector('#storyProfileBackButton').onclick = () => {
              if (this.activeStoryId) {
                  this.openStory(this.activeStoryId);
              } else {
                  this.switchToScreen(this.CONSTANTS.VIEWS.STORYBOARD);
              }
          };
    
          // Delete story handler
          this.ui.storyProfileActions.querySelector('#deleteStoryButton').onclick = async () => {
              if (confirm(`Delete story "${story.name || 'this story'}"? This cannot be undone.`)) { 
                  await this.db.messages.where({ storyId: story.id }).delete(); // Use item.id for messages
                  await this.db.stories.delete(story.id); // Delete item itself
                  this.showTopNotification('Story deleted.', 'success');
                  if (this.currentStoryId === story.id) this.currentStoryId = null;
                  if (this.activeStoryId === story.id) {
                      await this.db.appState.update(0, { activeStoryId: null });
                      this.activeStoryId = null; // Clear active story if the current one is concluded
                  }
                  this.switchToScreen(this.CONSTANTS.VIEWS.STORYBOARD);
              }
          };
    
          // Conclude and resume story handlers (only for active stories)
          if (!story.concluded) {
              const concludeButtonProfile = this.ui.storyProfileActions.querySelector('#concludeStoryButtonStoryProfile');
              if (concludeButtonProfile) concludeButtonProfile.onclick = () => this.concludeStory(storyId);
              
              const openChatButtonProfile = this.ui.storyProfileActions.querySelector('#openStoryChatButtonStoryProfile');
              if(openChatButtonProfile) {
                  openChatButtonProfile.onclick = () => this.openStory(storyId);
                  
                  if (this.activeStoryId && this.activeStoryId !== story.id) {
                      const otherActiveStory = await this.db.stories.get(this.activeStoryId);
                      if (otherActiveStory && !otherActiveStory.concluded) {
                          openChatButtonProfile.disabled = true;
                          openChatButtonProfile.setAttribute('data-tooltip', 'Another story is currently active. Conclude it first.');
                      }
                  }
              }
          }
    
          // item card click handlers
          this.ui.storyProfilechatFeed.querySelectorAll('.story-profile-item-card').forEach(card => {
              card.onclick = () => {
                  const itemId = card.dataset.itemId;
                  const itemType = card.dataset.itemType;
                  const itemConfig = this.CONSTANTS.ITEM_CONFIG[itemType];
                  if (itemId && itemConfig) {
                      this.switchToScreen(itemConfig.profileScreen, {itemId, itemType});
                  }
              };
          });
      },
      
            async renderFormScreen(options = {}) {
          console.log("[App Navigation] renderFormScreen called with options:", options);
          const { itemType, isCreating, isCopying } = options;
      
          const config = this.CONSTANTS.ITEM_CONFIG[itemType];
          if (!config) { console.error("Invalid itemType for renderFormScreen:", itemType); return; }
    
          const container = this.ui[config.formScreen];
          if (!container) { console.error(`Container for ${config.formScreen} not found`); return; }
    
          const isCreatingOrCopying = isCreating || isCopying;
          console.log("[App Navigation] isCreatingOrCopying determined as:", isCreatingOrCopying);
          
          // Removed top bar title text
    
          let item = {};
          if (isCreatingOrCopying) {
              console.log("[App Navigation] Creation path - checking formData sources");
              if (options.formData && Object.keys(options.formData).length > 0) {
                  item = { ...options.formData };
                  this.createItemFormData = { ...options.formData }; 
                  console.log("[App Navigation] Using formData passed in options for new item:", item);
              } else if (Object.keys(this.createItemFormData).length > 0) {
                  item = { ...this.createItemFormData };
                  console.log("[App Navigation] Using App.createItemFormData for new item:", item);
              } else {
                  item = {};
                  console.log("[App Navigation] Creating a truly new item, no prior data.");
              }
          } else { 
              console.log("[App Navigation] Editing path - fetching item with ID:", options.itemId);
              item = await this._getitemData(options.itemId, config.dbTableKey, config.getPremadesFn);
              console.log("[App Navigation] Retrieved item for editing:", item);
              // Initialize form data with existing item's colorPalette for editing
              // Use a more varied default color palette instead of always slate_gray
              const defaultPalettes = ['tech_blue', 'forest_green', 'crimson_red', 'sunset_orange', 'royal_purple', 'cyber_pink'];
              const randomDefaultPalette = defaultPalettes[Math.floor(Math.random() * defaultPalettes.length)];
              this.createItemFormData = { colorPalette: item.colorPalette || randomDefaultPalette };
          }
      
      
          if (!isCreatingOrCopying && !item) { 
              container.innerHTML = `<p>${config.capital} not found.</p>`; 
              return; 
          }
          
          let softLockNoticeHtml = '';
          if (!isCreatingOrCopying && this.activeStoryId) {
              const activeStory = await this.db.stories.get(this.activeStoryId);
              if (activeStory && !activeStory.concluded) {
                  const itemOriginalId = item.isPremade ? item.originalPremadeId : item.id;
                  const isItemInActiveStory = 
                      (config.itemType === 'character' && (itemOriginalId == activeStory.aiCharacterId || itemOriginalId == activeStory.userCharacterId)) ||
                      (config.itemType === 'world' && itemOriginalId == activeStory.worldId);
      
                  if (isItemInActiveStory) {
                      softLockNoticeHtml = `
                          <div class="soft-lock-notice">
                              <strong>Notice:</strong> This ${config.capital.toLowerCase()} is part of the active story: "<strong>${this.sanitizeHtml(activeStory.name || 'Untitled Story')}</strong>". 
                              Edits made here will apply to <em>new</em> stories or after this one is concluded. 
                              The active story uses a snapshot of this item from when it began.
                          </div>`;
                  }
              }
          }
          
          // NON-DESTRUCTIVE DOM UPDATE:
          // 1. Create a temporary container for the new content.
          const tempContainer = document.createElement('div');
          tempContainer.innerHTML = softLockNoticeHtml + this._renderStudioLayout(item, config, true);
          
          // 2. Clear the old content and append the new content.
          while (container.firstChild) {
              container.removeChild(container.firstChild);
          }
          while (tempContainer.firstChild) {
              container.appendChild(tempContainer.firstChild);
          }
    
          this._attachFormEventHandlers(container, itemType, item, isCreatingOrCopying);
          this.checkAllButtonStates();
          this._updateFormColorPreview(container, item.colorPalette);
      },
      
      async renderProfileScreen(options = {}) {
          const { itemType, itemId } = options;
          const config = this.CONSTANTS.ITEM_CONFIG[itemType];
          if (!config) { console.error("Invalid itemType for renderProfileScreen:", itemType); return; }
      
          const container = this.ui[config.profileScreen];
          if (!container || !itemId) {
              this.showTopNotification(`Error: ${config.capital} ID missing for profile view.`, "error");
              this.switchToScreen(this.CONSTANTS.VIEWS.STORYBOARD); 
              return;
          }
          
          this.currentProfileViewItemId = itemId; 
      
          // const isPremade = typeof itemId === 'string' && itemId.startsWith('premade_');
          const item = await this._getitemData(itemId, config.dbTableKey, config.getPremadesFn);
      
          if (!item) {
              container.innerHTML = `<p class="p-4 text-center">${config.capital} not found.</p>`;
              return;
          }
          // Removed: this.ui.topBar.textContent = `${config.capital} Profile`; // This is now handled by _updateProfileTopBarUI
  
          // NON-DESTRUCTIVE DOM UPDATE:
          const tempContainer = document.createElement('div');
          tempContainer.innerHTML = this._renderStudioLayout(item, config, false);
          
          while (container.firstChild) {
              container.removeChild(container.firstChild);
          }
          while (tempContainer.firstChild) {
              container.appendChild(tempContainer.firstChild);
          }
          // Attach robust onerror handler for profile picture
          const profilePicture = container.querySelector('#formProfilePicture');
          if (profilePicture) {
              profilePicture.onerror = function() {
                  const palette = (options.colorPalette || 'blue').toLowerCase();
                  const placeholderDiv = document.createElement('div');
                  placeholderDiv.className = `premade-card premade-${palette}`;
                  placeholderDiv.setAttribute('aria-label', 'No image available');
                  const icon = document.createElement('span');
                  icon.className = 'premade-placeholder-icon';
                  icon.setAttribute('aria-hidden', 'true');
                  icon.textContent = '\uD83D\uDDBC\uFE0F'; // U+1F5BC for Picture Frame, U+FE0F for variation selector
                  placeholderDiv.appendChild(icon);
                  this.replaceWith(placeholderDiv);
              };
          }
      
          // Removed event handlers for Back and Copy & Customize buttons - now handled in top bar
      },
    
      _renderEppfField(label, subLabel, idSuffix, value, placeholder, isEditing, san) {
          const id = `${idSuffix}`;
          
          if (isEditing) {
              return `
                  <div class="form-field-group full-width">
                      <label for="${id}" class="field-label"><span class="main-label">${label}</span><span class="field-sublabel">${subLabel}</span></label>
                      <textarea id="${id}" placeholder="${san(placeholder)}" resize="auto">${san(value || '')}</textarea>
                  </div>
              `;
          } else {
              return `
                  <div class="profile-field-row profile-field-${idSuffix.toLowerCase()}">
                      <div class="profile-field-label">
                          <span class="main-label">${label}</span>
                          <span class="field-sublabel">${subLabel}</span>
                      </div>
                      <div class="profile-field-value">${san(value || '—')}</div>
                  </div>
              `;
          }
      },
    
      _renderStudioLayout(item, config, isEditing) {
          const san = this.sanitizeHtml.bind(this);
          const { itemType, labels } = config;
      
          // --- PROFILE PICTURE/PLACEHOLDER LOGIC ---
          // const profilePictureSrc = (item.profilePicture && item.profilePicture.trim()) ? item.profilePicture.trim() : this._makeProfilePicturePlaceholderSVG(item.name || config.capital, item.colorPalette, item.isPremade);
                      // console.log("[DEBUG] item.profilePicture:", item.profilePicture, "profilePictureSrc:", profilePictureSrc); // Debug profilePicture source
    
          const profilePictureHtml = this._generateProfilePictureHtml(item, 'profile'); // Use the new helper function
    
          // --- FORM ACTION BUTTONS ---
          // Form action buttons (save/cancel/delete) are now handled in the top bar for edit/create screens
          const formActions = isEditing ? `
              <div class="profile-action-buttons">
                  <!-- Form action buttons moved to top bar -->
              </div>` 
              : `
              <div class="profile-action-buttons">
                  <!-- Removed Back and Copy & Customize buttons - now available in top bar -->
              </div>`;
    
          // --- BACKGROUND PROFILE PICTURE LAYOUT ---
                      // console.log("[DEBUG] isEditing for EPPF fields:", isEditing); // Debug isEditing flag
          
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
                                  <div class="form-section profile-picture-edit-section">
                                      <button type="button" class="options-button" id="uploadProfilePictureButtonForm-${itemType}"><span class="button-text">Upload / Generate Profile Picture</span><span class="button-icon">\u2728</span></button>
                                  </div>
                                  <div class="form-section traits-section">
                                      <div class="form-field-group full-width">
                                          <label for="${itemType}Name" class="field-label"><span class="main-label">${labels.name}</span></label>
                                          <input class="studio-name-input-large" id="${itemType}Name" value="${san(item.name || '')}" placeholder="${config.capital} name" autocomplete="off">
                                      </div>
                                      <div class="form-field-group full-width">
                                          <label for="${itemType}Description" class="field-label"><span class="main-label">${labels.description}</span></label>
                                          <textarea id="${itemType}Description" placeholder="${labels.descriptionPlaceholder}">${san(item.description || '')}</textarea>
                                      </div>
                                  </div>
                                  <div class="form-section eppf-section">
                                      ${this._renderEppfField("Forever", "Eternal Truths & Permanent Features", `${itemType}Eternal`, item.eternal, labels.eternalPlaceholder, isEditing, san)}
                                      ${this._renderEppfField("Past", "Background & Memories", `${itemType}Past`, item.past, labels.pastPlaceholder, isEditing, san)}
                                      ${this._renderEppfField("Present", "Current Mood & Conditions", `${itemType}Present`, item.present, labels.presentPlaceholder, isEditing, san)}
                                      ${this._renderEppfField("Future", "Goals & Prophecies", `${itemType}Future`, item.future, labels.futurePlaceholder, isEditing, san)}
                                  </div>
                                  <div class="profile-action-buttons">
                                      ${formActions}
                                  </div>
                              </form>
                          ` : `
                              <!-- Profile View: Display Only -->
                              <div class="profile-header-section">
                                  <h2 class="studio-profile-name">${san(item.name || 'Unnamed')}</h2>
                                  <div class="profile-description">${san(item.description || 'No description provided.')}</div>
                              </div>
                              
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
          `;
          
          return content;
      },
    
      async _createColorPicker(selectedPaletteKey) {
        let colorPickerHtml = '<div class="form-section color-picker-section">';
        colorPickerHtml += '<h3>Color Palette</h3>';
        colorPickerHtml += '<div class="color-palette-grid">';
    
        for (const key in this.CONSTANTS.COLOR_PALETTES) {
            const palette = this.CONSTANTS.COLOR_PALETTES[key];
            const isSelected = key === selectedPaletteKey ? 'selected' : '';
            colorPickerHtml += `
                <button class="color-palette-button ${isSelected}" data-palette-key="${key}" title="${palette.name}" aria-label="Select ${palette.name} color palette">
                    <div class="color-swatch-large-styled" style="--swatch-color: ${palette.colors.medium}"></div>
                    <div class="color-swatch-group">
                        <div class="color-swatch-small-styled" style="--swatch-color: ${palette.colors.light}"></div>
                        <div class="color-swatch-small-styled" style="--swatch-color: ${palette.colors.dark}"></div>
                        <div class="color-swatch-small-styled" style="--swatch-color: ${palette.colors.neutral}"></div>
                    </div>
                </button>
            `;
        }
    
        colorPickerHtml += '</div></div>';
        return colorPickerHtml;
    },
    
      /**
       * Loads a color palette by key, or returns a default if not found.
       * @param {string} paletteKey - The palette key.
       * @returns {Object} The palette object.
       */
      getColorPalette(paletteKey) {
        return this.CONSTANTS.COLOR_PALETTES[paletteKey] || this.CONSTANTS.COLOR_PALETTES.slate_gray;
      },
    
      /**
       * Updates the color scheme of a given element using a palette key.
       * @param {HTMLElement} element - The element to update.
       * @param {string} paletteKey - The palette key.
       */
      _updateColorScheme(element, paletteKey) {
          const palette = this.getColorPalette(paletteKey);
          if (!element || !palette) return;
    
          const styles = {
              '--form-color-light': palette.colors.light,
              '--form-color-medium': palette.colors.medium,
              '--form-color-dark': palette.colors.dark,
              '--form-color-neutral': palette.colors.neutral
          };
    
          Object.entries(styles).forEach(([prop, value]) => {
              element.style.setProperty(prop, value);
          });
      },
    
      _updateFormColorPreview(container, paletteKey) {
          this._updateColorScheme(container, paletteKey);
      },
    
      _attachFormEventHandlers(container, itemType, item, isCreating) {
        const formElements = this._setupFormElements(container, itemType);
        if (!formElements) return;
    
        // Phase 2: Profile PictureSystem Event Handlers
        this._attachProfilePictureEventHandlers(formElements, itemType);
    
          // Phase 3: Form Action Handlers (Delete, Cancel, Submit)
          this._attachFormActionHandlers(formElements, itemType, item, isCreating);
    
          // Phase 4: AI Helper Handlers
          this._attachAiHelperHandlers(formElements, itemType);
    
          // Phase 5: Textarea Dynamic Updates
          this._attachTextareaHandlers(formElements);
    
          const colorButtons = container.querySelectorAll('.color-palette-button');
          colorButtons.forEach(button => {
              button.onclick = (e) => {
                  e.preventDefault();
                  const selectedKey = button.dataset.paletteKey;
                  
                  // Update selection state
                  colorButtons.forEach(button => button.classList.remove('selected'));
                  button.classList.add('selected');
    
                  // Update form data
                  this.createItemFormData.colorPalette = selectedKey;
    
                  // Update live preview
                  this._updateFormColorPreview(container, selectedKey);
              };
          });
      },
    
      _setupFormElements(container, itemType) {
          const config = this.CONSTANTS.ITEM_CONFIG[itemType];
          const form = container.querySelector(`#${itemType}FormMain`);
          if (!form) {
              console.error(`Form not found for ${itemType}`);
              return null;
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
          };
      },
    
      _attachProfilePictureEventHandlers(elements, itemType) {
          // Simple profile picture handler for both character and world forms
          const { uploadProfilePictureButtonForm } = elements;
          
          if (uploadProfilePictureButtonForm) {
              uploadProfilePictureButtonForm.onclick = (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  // Simple prompt for image URL or description
                  const input = prompt('Enter an image URL or describe the image you want to generate:');
                  if (input && input.trim()) {
                      const isUrl = input.trim().startsWith('http');
                      if (isUrl) {
                          // Use URL directly
                          this.handleUseUrlForProfilePicture(null, input.trim(), itemType);
                      } else {
                          // Generate image from description using simplified approach
                          this.handleGenerateProfilePictureSimple(itemType, input.trim());
                      }
                  }
              };
          }
      },
    
      _attachFormActionHandlers(elements, itemType, item, isCreating) {
          const { config, form } = elements;
    
          // Delete button handler (only for editing)
          if (!isCreating) {
              const deleteButton = form.querySelector(`#delete${config.capital}ButtonMain`);
              if (deleteButton) {
                  deleteButton.onclick = async () => {
                      if (confirm(`Delete ${itemType} "${item.name || `this ${itemType}`}"? This will remove it from lists but keep it in existing stories.`)) { 
                          await this.db.messages.where({ storyId: item.id }).delete(); // Use item.id for messages
                          await this.db.stories.delete(item.id); // Delete item itself
                          this.showTopNotification(`${config.capital} deleted (archived).`, 'success');
                          this.switchToScreen(this.CONSTANTS.VIEWS.STORYBOARD);
                      }
                  };
              }
          }
    
          // Cancel button handler
          this._attachCancelButtonHandler(elements, itemType);
    
          // Form submit handler
          this._attachFormSubmitHandler(elements, itemType);
      },
    
      _attachCancelButtonHandler(elements, itemType) {
          const { config, form } = elements;
          const cancelButton = form.querySelector(`#cancel${config.capital}ButtonMain`);
          
          if (!cancelButton) {
              console.warn(`[EDIT WORKFLOW DEBUG] Cancel button not found for ${itemType} form.`);
              return;
          }
    
          cancelButton.onclick = (e) => {
              // Ignore synthetic/programmatic clicks that are not user-initiated
              if (e && e.isTrusted === false) {
                  console.warn("[EDIT WORKFLOW DEBUG] Programmatic cancel click suppressed");
                  return;
              }
              
              if (!this.currentCreateFormContext || Object.keys(this.currentCreateFormContext).length === 0) {
                  App.handleError('FORM_CONTEXT_ERROR', new Error('Missing form context during cancel operation'));
                  this.switchToScreen(this.CONSTANTS.VIEWS.STORYBOARD);
                  return;
              }
              
              const { id, itemType, preSelectedAiCharacterId, preSelectedUserCharacterId, preSelectedWorldId, originalScreen } = this.currentCreateFormContext; // Add originalScreen
              this.createItemFormData = {};
              
              // Clear any pending form state from session storage when canceling
              try {
                  sessionStorage.removeItem('pendingRPGlitchFormState');
              } catch (e) {
                  console.warn("Failed to clear session storage on cancel:", e);
              } 
              
              // Filter out 'create_new_' values to prevent infinite loop when returning to storyboard
              const navOptions = { 
                  preSelectedAiCharacterId: preSelectedAiCharacterId?.startsWith?.('create_new_') ? '' : preSelectedAiCharacterId, 
                  preSelectedUserCharacterId: preSelectedUserCharacterId?.startsWith?.('create_new_') ? '' : preSelectedUserCharacterId, 
                  preSelectedWorldId: preSelectedWorldId?.startsWith?.('create_new_') ? '' : preSelectedWorldId 
              };
              let targetScreen = originalScreen || this.CONSTANTS.VIEWS.STORYBOARD; // Use original screen, fallback to storyboard
    
              if (targetScreen === config.profileScreen) {
                  navOptions.itemId = id;
                  navOptions.itemType = itemType;
              } else if (targetScreen === this.CONSTANTS.VIEWS.STORY_PROFILE) {
                  navOptions.storyId = this.currentStoryId;
              } // Else targetScreen remains storyboard and options are only preSelected...
    
              this.switchToScreen(targetScreen, navOptions);
          };
      },
    
      _attachFormSubmitHandler(elements, itemType) {
          const { config, form } = elements;
          form.onsubmit = async (e) => {
              e.preventDefault();
              this.checkAllButtonStates(); // Re-check states on submit attempt
              const submitButton = form.querySelector(`#submit${config.capital}ButtonMain`);
              if (submitButton && submitButton.disabled) {
                  console.warn("Form submission blocked by disabled button.");
                  return;
              }
              
              // CRITICAL FIX: Save form data to session storage right before submission
              // This prevents data loss if a page refresh happens after client-side validation
              // but before the DB write, which can happen with async operations or slow UI.
              const formDataToStore = this._getFormDataFromForm(elements, itemType);
              const formOptionsToStore = { ...this.currentCreateFormContext, formData: formDataToStore }; // Include existing context + current data
              
              try {
                  sessionStorage.setItem('pendingRPGlitchFormState', JSON.stringify({
                      formData: formDataToStore,
                      formOptions: formOptionsToStore,
                      timestamp: Date.now()
                  }));
                  console.log("[FORM SUBMISSION] Stored pending form state in sessionStorage:", formDataToStore);
              } catch (e) {
                  console.error("[FORM SUBMISSION] Failed to store form state to sessionStorage:", e);
              }
    
              try {
                  await this._processFormSubmission(elements, itemType);
              } catch (error) {
                  console.error(`Error processing ${itemType} form submission:`, error);
                  this.showTopNotification(`Error saving ${config.capital}: ${error.message || 'Unknown error'}`, 'error', 5000);
                  // Ensure session storage is cleared if submission ultimately fails
                  sessionStorage.removeItem('pendingRPGlitchFormState');
              }
          };
      },

      _attachTopBarFormActionHandlers(itemType) {
          const config = this.CONSTANTS.ITEM_CONFIG[itemType];
          if (!config) return;
          
          // Cancel button handler
          const cancelButton = document.getElementById(`cancel${config.capital}ButtonTopBar`);
          if (cancelButton) {
              cancelButton.onclick = (e) => {
                  e.preventDefault();
                  
                  // Clear any pending form state from session storage when canceling
                  try {
                      sessionStorage.removeItem('pendingRPGlitchFormState');
                  } catch (e) {
                      console.warn("Failed to clear session storage on cancel:", e);
                  }
                  
                  // Navigate back to the appropriate screen
                  this.switchToScreen(this.CONSTANTS.VIEWS.STORYBOARD);
              };
          }
          
          // Delete button handler (only for custom items)
          const deleteButton = document.getElementById(`delete${config.capital}ButtonTopBar`);
          if (deleteButton) {
              deleteButton.onclick = async (e) => {
                  e.preventDefault();
                  
                  // Get the current item data
                  const item = await this._getitemData(this.currentProfileViewItemId, config.dbTableKey, config.getPremadesFn);
                  if (!item) {
                      this.showTopNotification(`Error: ${config.capital} not found for deletion.`, "error");
                      return;
                  }
                  
                  if (confirm(`Delete ${itemType} "${item.name || `this ${itemType}`}"? This will remove it from lists but keep it in existing stories.`)) {
                      await this.db.messages.where({ storyId: item.id }).delete();
                      await this.db.stories.delete(item.id);
                      this.showTopNotification(`${config.capital} deleted (archived).`, 'success');
                      this.switchToScreen(this.CONSTANTS.VIEWS.STORYBOARD);
                  }
              };
          }
          
          // Save button handler
          const saveButton = document.getElementById(`submit${config.capital}ButtonTopBar`);
          if (saveButton) {
              saveButton.onclick = async (e) => {
                  e.preventDefault();
                  
                  // Find the form and trigger submission
                  const form = document.querySelector(`#${itemType}FormMain form`);
                  if (form) {
                      // Trigger the form submit event
                      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                      form.dispatchEvent(submitEvent);
                  } else {
                      this.showTopNotification(`Error: Form not found for ${itemType}.`, "error");
                  }
              };
          }
      },
    
      async _processFormSubmission(elements, itemType) {
          const { config, nameInput, descriptionTextarea, eternalInput, pastInput, presentInput, futureInput } = elements;
          const isCreating = this.currentCreateFormContext.isCreating; // Use this flag from context
    
          const id = this.currentCreateFormContext.itemId; // For editing, keep original ID
          
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
          };
    
          let result;
          if (id && !isCreating) { // Only update if ID exists and we are editing (not creating from copy)
              result = await this.db[config.dbTableKey].update(id, newItem);
              this.showTopNotification(`${config.capital} updated.`, 'success');
              result = id; // Update result to be the existing ID for navigation
          } else {
              result = await this.db[config.dbTableKey].add(newItem);
              this.showTopNotification(`${config.capital} created!`, 'success');
          }
          this._handleFormSubmissionSuccess(result, config, itemType);
      },
    
      _handleFormSubmissionSuccess(result, config, itemType) {
          this.currentGeneratedProfilePictureDataUrl = null; // Clear generated image after save
          this.createItemFormData = {}; // Clear form data on success
          try {
              sessionStorage.removeItem('pendingRPGlitchFormState'); // Clear session storage on success
          } catch (e) {
              console.warn("Failed to clear session storage on successful form submission:", e);
          }
          
          // Navigate based on whether we're in a story setup or a general create/edit flow
          const { preSelectedAiCharacterId, preSelectedUserCharacterId, preSelectedWorldId, originalScreen } = this.currentCreateFormContext;
          if (originalScreen === this.CONSTANTS.VIEWS.STORYBOARD) {
              // If we came from storyboard, update the select dropdowns and stay on storyboard
              this.switchToScreen(this.CONSTANTS.VIEWS.STORYBOARD, {
                  preSelectedAiCharacterId: preSelectedAiCharacterId,
                  preSelectedUserCharacterId: preSelectedUserCharacterId,
                  preSelectedWorldId: preSelectedWorldId,
                  selectAfterCreation: { itemType: itemType, newId: result } // Used to pre-select the newly created item
              });
          } else {
              // Otherwise, go back to the profile screen for the edited/created item
              this.switchToScreen(config.profileScreen, { itemId: result, itemType: itemType });
          }
      },
    
      _attachAiHelperHandlers(elements, itemType) {
          const { descriptionTextarea, eternalInput, pastInput, presentInput, futureInput } = elements;
          const config = this.CONSTANTS.ITEM_CONFIG[itemType];
    
          // Array of fields with AI buttons
          const aiFields = [
              { input: descriptionTextarea, type: 'description', btn: form.querySelector(`#aiHelp${config.capital}DescriptionButton`) },
              { input: eternalInput, type: 'eternal', btn: form.querySelector(`#aiHelp${config.capital}EternalButton`) },
              { input: pastInput, type: 'past', btn: form.querySelector(`#aiHelp${config.capital}PastButton`) },
              { input: presentInput, type: 'present', btn: form.querySelector(`#aiHelp${config.capital}PresentButton`) },
              { input: futureInput, type: 'future', btn: form.querySelector(`#aiHelp${config.capital}FutureButton`) }
          ];
    
          // Add general AI helper button click handlers
          aiFields.forEach(field => {
              if (field.btn) {
                  this._manageAiButtonState(field.btn, { type: field.type, field: field.input, itemType: itemType });
              }
          });
      },
    
      _attachTextareaHandlers(elements) {
          const { descriptionTextarea, eternalInput, pastInput, presentInput, futureInput } = elements;
          const textareas = [descriptionTextarea, eternalInput, pastInput, presentInput, futureInput].filter(Boolean);
    
          textareas.forEach(textarea => {
              textarea.addEventListener('input', () => {
                  textarea.style.height = 'auto';
                  textarea.style.height = (textarea.scrollHeight) + 'px';
                  this.checkAllButtonStates(); // Re-check states on input
              });
              // Trigger input event once to adjust initial height
              textarea.dispatchEvent(new Event('input'));
          });
      },
    
      showProfilePictureOverlay(overlayElement, itemType) {
          if (typeof overlayElement === 'string') overlayElement = document.getElementById(overlayElement);
          if (!overlayElement) return;
    
          this.ui.topBar.classList.add('top-bar-interactive-hover'); // Add hover class for visual feedback
          this.showEl(overlayElement);
          // Ensure the relevant input is focused after a slight delay for rendering
          const promptInput = overlayElement.querySelector(`#profilePicturePromptInputForm-${itemType}`);
          if (promptInput) {
              setTimeout(() => promptInput.focus(), 50);
          }
          this.checkAllButtonStates();
      },
    
      async _handleAiHelpForProfilePicturePrompt(buttonElement, itemType, promptTextarea, formElement) {
          const config = this.CONSTANTS.ITEM_CONFIG[itemType];
          const currentName = formElement.querySelector(`#${itemType}Name`).value.trim();
          const currentDescription = formElement.querySelector(`#${itemType}Description`).value.trim();
          const currentEternal = formElement.querySelector(`#${itemType}Eternal`).value.trim();
          const currentPast = formElement.querySelector(`#${itemType}Past`).value.trim();
          const currentPresent = formElement.querySelector(`#${itemType}Present`).value.trim();
          const currentFuture = formElement.querySelector(`#${itemType}Future`).value.trim();
    
          const context = `The user is creating a profile picture for a ${itemType} named "${currentName || 'an unnamed ' + itemType}". The ${itemType}'s description is: "${currentDescription}". Its eternal truths are: "${currentEternal}". Its past is: "${currentPast}". Its present is: "${currentPresent}". Its future is: "${currentFuture}".`;
          const instruction = `Generate a concise, visual prompt (1-2 sentences) for an image AI to create a unique profile picture for this ${itemType}. Focus on core visual elements.`;
    
          this.showTopNotification("Generating prompt...", "info", 2000);
          const originalButtonText = buttonElement.innerHTML;
          buttonElement.disabled = true;
          buttonElement.innerHTML = `<span class="button-text">Generating...</span>`;
    
          try {
              const result = await this._createAiRequest({ type: 'text', context, instruction });
              if (result && result.generatedText) {
                  promptTextarea.value = result.generatedText.trim();
                  promptTextarea.dispatchEvent(new Event('input')); // Trigger input to update generate button state
                  this.showTopNotification("Prompt generated!", "success");
              } else {
                  this.showTopNotification("Could not generate prompt.", "error");
              }
          } catch (error) {
              console.error("AI Help for profile picture prompt failed:", error);
              this.showTopNotification(`AI Help failed: ${error.message || 'Error generating prompt.'}`, "error", 5000);
          } finally {
              buttonElement.innerHTML = originalButtonText;
              buttonElement.disabled = false;
              this.checkAllButtonStates();
          }
      },
    
      hideProfilePictureOverlay(overlayElement) {
          if (typeof overlayElement === 'string') overlayElement = document.getElementById(overlayElement);
          if (!overlayElement) return;
          this.ui.topBar.classList.remove('top-bar-interactive-hover'); // Remove hover class
          this.hideEl(overlayElement);
          this.checkAllButtonStates();
      },
    
      async handleUseUrlForProfilePicture(overlayElement, url, itemType) {
          const profilePictureDisplayPanel = document.getElementById(`${itemType}-profile-picture-display`);
          if (profilePictureDisplayPanel) {
              this.currentGeneratedProfilePictureDataUrl = url;
              profilePictureDisplayPanel.style.backgroundImage = `url('${this.sanitizeHtml(url)}')`;
              profilePictureDisplayPanel.classList.remove('empty-profile-picture');
              this.showTopNotification("Image URL applied.", "success");
          } else {
              this.showTopNotification("Error applying image: target display panel not found.", "error");
          }
          this.hideProfilePictureOverlay(overlayElement);
          this.checkAllButtonStates();
      },
    
      _makePromptObjectForImagePlugin(promptString) {
          return { prompt: promptString };
      },
    
      async handleGenerateProfilePictureSimple(itemType, currentPromptText) {
          this.showTopNotification("Generating image...", "info", 5000);
    
          try {
              const aiImageResult = await this._createAiRequest({
                  type: 'image',
                  prompt: currentPromptText
              });
    
              if (aiImageResult && aiImageResult.generatedImage) {
                  this.currentGeneratedProfilePictureDataUrl = aiImageResult.generatedImage;
                  this.showTopNotification("Image generated! It will be saved when you submit the form.", "success");
              } else {
                  this.showTopNotification("Could not generate image.", "error");
                  this.currentGeneratedProfilePictureDataUrl = null;
              }
          } catch (error) {
              console.error("Image generation failed:", error);
              this.showTopNotification(`Image generation failed: ${error.message || 'Unknown error.'}`, "error", 5000);
              this.currentGeneratedProfilePictureDataUrl = null;
          }
      },
    
      async handleGenerateProfilePictureSmart(overlayElement, itemType, currentPromptText) {
          const generateButton = overlayElement.querySelector(`#generateProfilePictureButtonForm-${itemType}`);
          const previewImage = overlayElement.querySelector(`#profile-picture-preview-${itemType}`);
          const useButton = overlayElement.querySelector(`#useProfilePictureButtonForm-${itemType}`);
          const promptInput = overlayElement.querySelector(`#profilePicturePromptInputForm-${itemType}`);
          const originalGenerateButtonHtml = generateButton.innerHTML;
    
          generateButton.disabled = true;
          useButton.disabled = true;
          previewImage.classList.add('hidden');
          promptInput.disabled = true; // Disable prompt input during generation
    
          generateButton.innerHTML = `<span class="button-text">Generating...</span>`;
          this.showTopNotification("Generating image...", "info", 5000);
    
          try {
              const aiImageResult = await this._createAiRequest({
                  type: 'image',
                  prompt: currentPromptText
              });
    
              if (aiImageResult && aiImageResult.generatedImage) {
                  this.currentGeneratedProfilePictureDataUrl = aiImageResult.generatedImage;
                  previewImage.src = aiImageResult.generatedImage;
                  this.showEl(previewImage); // Show the preview
                  useButton.disabled = false;
                  this.showTopNotification("Image generated!", "success");
              } else {
                  this.showTopNotification("Could not generate image.", "error");
                  this.currentGeneratedProfilePictureDataUrl = null;
              }
          } catch (error) {
              console.error("Image generation failed:", error);
              this.showTopNotification(`Image generation failed: ${error.message || 'Unknown error.'}`, "error", 5000);
              this.currentGeneratedProfilePictureDataUrl = null;
          } finally {
              generateButton.innerHTML = originalGenerateButtonHtml;
              generateButton.disabled = false;
              promptInput.disabled = false; // Re-enable prompt input
              this.checkAllButtonStates();
          }
      },
    
      async handleUseGeneratedProfilePicture(overlayElement, itemType) {
          if (!this.currentGeneratedProfilePictureDataUrl) {
              this.showTopNotification("No generated image to use.", "error");
              return;
          }
    
          const profilePictureDisplayPanel = document.getElementById(`${itemType}-profile-picture-display`);
          if (profilePictureDisplayPanel) {
              profilePictureDisplayPanel.style.backgroundImage = `url('${this.currentGeneratedProfilePictureDataUrl}')`;
              profilePictureDisplayPanel.classList.remove('empty-profile-picture');
              this.showTopNotification("Generated image applied!", "success");
          } else {
              this.showTopNotification("Error applying image: target display panel not found.", "error");
          }
          this.hideProfilePictureOverlay(overlayElement);
          this.currentGeneratedProfilePictureDataUrl = null; // Clear after use
          this.checkAllButtonStates();
      },
    
      async waitForDependenciesAndInitializeApp() {
        const checkDependencies = () => {
          const isDexieLoaded = window.Dexie !== undefined;
          const isHyperscriptLoaded = window._hyperscript !== undefined;
          const isCashDomLoaded = window.$ !== undefined;
          const isDOMPurifyAvailable = window.DOMPurify !== undefined && typeof window.DOMPurify.sanitize === 'function';
          return {
            isDexieLoaded,
            isHyperscriptLoaded,
            isCashDomLoaded,
            isDOMPurifyAvailable
          };
        };
  
        const maxAttempts = 50; // Max 10 seconds (50 * 200ms)
        let attempts = 0;
  
        return new Promise((resolve, reject) => {
          // First, wait for DOM to be ready
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
              // Then start checking for dependencies
              const interval = setInterval(() => {
                const deps = checkDependencies();
                if (deps.isDexieLoaded && deps.isHyperscriptLoaded && deps.isCashDomLoaded && deps.isDOMPurifyAvailable) {
                  clearInterval(interval);
                  // console.log("[DEBUG] All dependencies loaded successfully.");
                  resolve();
                } else {
                  attempts++;
                  if (attempts >= maxAttempts) {
                    clearInterval(interval);
                    console.error("[DEBUG] Dependency load timed out.", deps);
                    const missing = Object.entries(deps).filter(([k,v])=>!v).map(([k])=>k).join(", ");
                    reject(new Error("Dependencies not loaded in time: " + missing));
                  }
                }
              }, 200);
            });
          } else {
            // DOM is already ready, start checking immediately
            const interval = setInterval(() => {
              const deps = checkDependencies();
              if (deps.isDexieLoaded && deps.isHyperscriptLoaded && deps.isCashDomLoaded && deps.isDOMPurifyAvailable) {
                clearInterval(interval);
                // console.log("[DEBUG] All dependencies loaded successfully.");
                resolve();
              } else {
                attempts++;
                if (attempts >= maxAttempts) {
                  clearInterval(interval);
                  console.error("[DEBUG] Dependency load timed out.", deps);
                  const missing = Object.entries(deps).filter(([k,v])=>!v).map(([k])=>k).join(", ");
                  reject(new Error("Dependencies not loaded in time: " + missing));
                }
              }
            }, 200);
          }
        });
      },
    
      async initializeWhenReady() {
        try {
          await this.waitForDependenciesAndInitializeApp();
          // console.log("[DEBUG] Dependencies ready, calling App.init()");
          this.init();
        } catch (error) {
          console.error("App failed to initialize due to missing dependencies:", error);
          // Show which dependencies are missing in the alert
          let missing = "";
          if (error && error.message && error.message.includes(": ")) {
            missing = "\nMissing: " + error.message.split(": ")[1];
          }
          alert("Application failed to load: essential components missing. Please ensure all scripts loaded correctly." + missing);
          this.showEl(document.getElementById('emergency-export-ctn'));
        }
      },
    
      async switchToScreen(screenName, options = {}) {
          console.log("[App Navigation] Switching to screen:", screenName, "with options:", options, "from current view:", this.currentMainView);
    
          // Save app state before screen switch
          await this.saveAppState();
    
          // Deactivate all screens first
          Object.values(this.CONSTANTS.VIEWS).forEach(viewId => {
              const screenEl = this.ui[viewId];
              if (screenEl) {
                  this.hideEl(screenEl);
                  // console.log(`[DEBUG] Hiding screen: ${viewId}. Current display: ${window.getComputedStyle(screenEl).display}`);
              }
          });
          // Hide the chin area as well when switching screens
          this.hideEl(this.ui.topBarChin);
          this.focusBarState.chinOpen = false;
  
          // console.log('[DEBUG] After hiding all screens. Target screenName:', screenName);
          
          // Activate the target screen
          const targetScreenEl = this.ui[screenName];
          if (targetScreenEl) {
              this.showEl(targetScreenEl);
              // console.log(`[DEBUG] Showing target screen: ${screenName}. Current display: ${window.getComputedStyle(targetScreenEl).display}, classList: ${Array.from(targetScreenEl.classList)}`);
          } else {
              console.error("Attempted to switch to unknown screen:", screenName);
              this.showTopNotification("Error: Screen not found.", "error");
              this.currentMainView = this.CONSTANTS.VIEWS.STORYBOARD;
              this.showEl(this.ui.storyboardScreen); // Fallback to storyboard
              // console.log('[DEBUG] Falling back to storyboard.');
          }
    
          this.currentMainView = screenName;
          this.currentProfileViewItemId = null; // Clear profile view ID on screen switch
    
          // Perform screen-specific rendering
          switch (screenName) {
              case this.CONSTANTS.VIEWS.STORYBOARD:
                  this.focusBarState.mode = 'storyboard';
                  this.updateDynamicStoryboardTitle(); // Ensure title is correctly set for storyboard
                  await this._updateStoryboard({ selectAfterCreation: options.selectAfterCreation });
                  if (options.preSelectedAiCharacterId || options.preSelectedUserCharacterId || options.preSelectedWorldId) {
                      // Select the pre-selected items
                      if (options.preSelectedAiCharacterId) this.ui.storyboardAiCharacterSelect.value = options.preSelectedAiCharacterId;
                      if (options.preSelectedUserCharacterId) this.ui.storyboardUserCharacterSelect.value = options.preSelectedUserCharacterId;
                      if (options.preSelectedWorldId) this.ui.storyboardWorldSelect.value = options.preSelectedWorldId;
                      await this._updateStoryboard(); // Re-render cards with pre-selected items
                  }
                  break;
              case this.CONSTANTS.VIEWS.CHAT_INTERFACE: // This view is now STORY_INTERFACE
              case this.CONSTANTS.VIEWS.STORY_INTERFACE:
                  this.focusBarState.mode = 'storyboard'; // Keep storyboard tab active during chat
                  // openStory handles rendering for this view
                  break;
              case this.CONSTANTS.VIEWS.CHARACTER_FORM:
              case this.CONSTANTS.VIEWS.WORLD_FORM: {
                  this.focusBarState.mode = 'storyboard'; // Keep storyboard tab active for forms
                  // Determine itemType from screen name
                  // const itemType = screenName === this.CONSTANTS.VIEWS.CHARACTER_FORM ? 'character' : 'world';
                  this.currentCreateFormContext = {
                      originalScreen: options.originalScreen, // Where did we come from?
                      itemId: options.itemId, // For edit workflow
                      itemType: itemType,
                      preSelectedAiCharacterId: options.preSelectedAiCharacterId,
                      preSelectedUserCharacterId: options.preSelectedUserCharacterId,
                      preSelectedWorldId: options.preSelectedWorldId
                  };
                  await this.renderFormScreen({ ...options, itemType });
                  break;
              }
              case this.CONSTANTS.VIEWS.CHARACTER_PROFILE:
                  // console.log('[DEBUG] Navigating to CHARACTER_PROFILE screen. Item ID:', options.itemId);
                  this.focusBarState.mode = null; // No chin should be active on profile screens
                  await this.renderProfileScreen(options);
                  break;
              case this.CONSTANTS.VIEWS.WORLD_PROFILE:
                  // console.log('[DEBUG] Navigating to WORLD_PROFILE screen. Item ID:', options.itemId);
                  this.focusBarState.mode = null; // No chin should be active on profile screens
                  await this.renderProfileScreen(options);
                  break;
              case this.CONSTANTS.VIEWS.STORY_PROFILE:
                  // console.log('[DEBUG] Navigating to STORY_PROFILE screen. Story ID:', options.storyId);
                  this.focusBarState.mode = null; // No chin should be active on profile screens
                  await this.renderStoryProfileScreen(options.storyId);
                  break;
              case this.CONSTANTS.VIEWS.PREMADE_CHARACTER_SELECTION:
                  this.focusBarState.mode = 'characters'; // Switch to characters tab for premade selection
                  this.previousScreenBeforePremadeSelection = options.previousScreen || this.CONSTANTS.VIEWS.STORYBOARD; // Store where we came from
                  this.currentCreateFormContext = { ...options.context }; // Pass through context
                  await this._populateList(this.ui.premadeCharacterOnlyList, '', this.CONSTANTS.ITEM_CONFIG.character);
                  // Removed top bar title text
                  break;
              case this.CONSTANTS.VIEWS.PREMADE_WORLD_SELECTION:
                  this.focusBarState.mode = 'worlds'; // Switch to worlds tab for premade selection
                  this.previousScreenBeforePremadeSelection = options.previousScreen || this.CONSTANTS.VIEWS.STORYBOARD; // Store where we came from
                  this.currentCreateFormContext = { ...options.context }; // Pass through context
                  await this._populateList(this.ui.premadeWorldOnlyList, '', this.CONSTANTS.ITEM_CONFIG.world);
                  // Removed top bar title text
                  break;
              case this.CONSTANTS.VIEWS.MEMORY_APPLICATION:
                  this.focusBarState.mode = 'options'; // Switch to options tab for memory application
                  // Removed top bar title text
                  await this._renderMemoryApplicationScreen(options);
                  break;
              default:
                  console.warn("Unhandled screen switch:", screenName);
                  break;
          }
          // console.log('[DEBUG] switchToScreen completed. Calling updateTopBarUI.');
          this.updateTopBarUI(); // Update UI after screen switch
          this.checkAllButtonStates(); // Ensure all buttons are correctly enabled/disabled
      },
    
      async _updateCharacterInfo(characterType, characterData = null) {
          let character = characterData;
          if (!character && characterType === 'user' && this.currentUserCharacterId) {
              character = await this._getitemData(this.currentUserCharacterId, 'characters', this.getPremadeCharacterItems);
          } else if (!character && characterType === 'ai' && this.currentAiCharacterId) {
              character = await this._getitemData(this.currentAiCharacterId, 'characters', this.getPremadeCharacterItems);
          }
    
          const displayArea = characterType === 'user' ? this.ui.topBarUserCharacterInfo : this.ui.topBarAiCharacterInfo;
          const picEl = characterType === 'user' ? this.ui.topBarUserCharacterPic : this.ui.topBarAiCharacterPic;
          const nameTextEl = characterType === 'user' ? this.ui.topBarUserCharacterNameText : this.ui.topBarAiCharacterNameText;
    
          if (character && character.name) {
              this.showEl(displayArea);
              if (picEl) {
                const profilePictureHtml = this._generateProfilePictureHtml(character, 'top-bar-profile-picture-img');
                picEl.innerHTML = profilePictureHtml;
              }
              if (nameTextEl) {
                nameTextEl.textContent = this.sanitizeHtml(character.name);
              }
          } else {
              this.hideEl(displayArea);
          }
      },
    
      _updateCharacterDisplay(characterType, characterData) {
          const panel = characterType === 'user' ? this.ui.userCharacterDisplayArea : this.ui.aiCharacterDisplayArea;
          const picEl = panel.querySelector('.profile-picture-display-main');
          const nameEl = panel.querySelector('.character-name');
          const descEl = panel.querySelector('.character-description');
    
          if (characterData) {
              if (picEl) {
                  picEl.style.backgroundImage = characterData.profilePicture ? `url('${this.sanitizeHtml(characterData.profilePicture)}')` : '';
              }
              if (nameEl) {
                  nameEl.textContent = this.sanitizeHtml(characterData.name || '');
              }
              if (descEl) {
                  descEl.textContent = this.sanitizeHtml(characterData.description || '');
              }
              this.showEl(panel);
          } else {
              this.hideEl(panel);
          }
      },
    
      async openStory(storyId) { 
        console.log("[App Navigation] Attempting to open story:", storyId);
        // Phase 1: Validate and fetch story data
        const story = await this.db.stories.get(storyId);
        if (!story) {
            this.showTopNotification("Error: Story not found.", "error");
            this.switchToScreen(this.CONSTANTS.VIEWS.STORYBOARD);
            return;
        }
        this.activeStoryId = storyId;
        this.currentStoryId = storyId; // Keep currentStoryId updated
        await this.saveAppState(); // Save activeStoryId to app state
    
        // Phase 2: Update UI elements
        // Removed top bar title text
        this.hideEl(this.ui.topBarChin); // Ensure chin is closed when entering chat
        this.focusBarState.chinOpen = false;
    
        // Phase 3: Fetch characters and world for the story
        const aiCharacter = story.storyAiCharacter || await this._getitemData(story.aiCharacterId, 'characters', this.getPremadeCharacterItems);
        const userCharacter = story.storyUserCharacter || await this._getitemData(story.userCharacterId, 'characters', this.getPremadeCharacterItems);
        const world = story.storyWorld || await this._getitemData(story.worldId, 'worlds', this.getPremadeWorldItems);
    
        if (!aiCharacter || !userCharacter || !world) {
            this.showTopNotification("Error: Missing characters or world for story.", "error");
            this.switchToScreen(this.CONSTANTS.VIEWS.STORYBOARD);
            return;
        }
    
        // Phase 4: Populate character display areas in the chat UI
        this._updateCharacterDisplay('ai', aiCharacter);
        this._updateCharacterDisplay('user', userCharacter);
    
        // Phase 5: Render chat history
        await this.renderChatHistory(storyId);
    
        // Phase 6: Setup chat input and send button
        this.ui.messageInput.value = '';
        this.ui.messageInput.disabled = false;
        this.ui.sendButton.disabled = false;
        this.ui.messageInput.focus();
        this.checkAllButtonStates(); // Re-check button states
    
        // Phase 7: Transition to chat screen and update top bar
        this.currentMainView = this.CONSTANTS.VIEWS.STORY_INTERFACE; // Set the current main view
        this.updateTopBarUI(); // Update tab selection based on view
        
        // Additional UI updates specific to the chat interface
        this.ui.chatScreenLayoutContainer.style.backgroundImage = world.profilePicture ? `url('${this.sanitizeHtml(world.profilePicture)}')` : 'none';
        this.ui.chatScreenLayoutContainer.style.backgroundSize = 'cover';
        this.ui.chatScreenLayoutContainer.style.backgroundPosition = 'center';
        this.ui.chatScreenLayoutContainer.classList.add('chat-background'); // Add class for potential overlay/effects
    
        console.log("[App Navigation] Successfully opened story:", storyId);
      },
    
      async concludeStory(storyId) {
        if (!confirm("Are you sure you want to conclude this story? You can always view it in your story list later, but you won't be able to add new messages.")) {
          return;
        }
    
        try {
            await this.db.stories.update(storyId, {
                concluded: true,
                concludedTimestamp: Date.now()
            });
            if (this.activeStoryId === storyId) {
                await this.db.appState.update(0, { activeStoryId: null });
                this.activeStoryId = null; // Clear active story if the current one is concluded
            }
            this.showTopNotification('Story concluded.', 'success');
            this.switchToScreen(this.CONSTANTS.VIEWS.STORY_PROFILE, { storyId: storyId }); // Go to story profile
        } catch (error) {
            console.error("Error concluding story:", error);
            this.showTopNotification('Error concluding story.', 'error');
        }
      },
    
      async beginStory() {
          console.log("[App Logic] beginStory called.");
          // 1. Get selected characters and world
          const aiCharacterId = this.ui.storyboardAiCharacterSelect.value;
          const userCharacterId = this.ui.storyboardUserCharacterSelect.value;
          const worldId = this.ui.storyboardWorldSelect.value;
    
          // 2. Validate selections
          if (!aiCharacterId || !userCharacterId || !worldId) {
              this.showTopNotification("Please select an AI Character, Your Character, and a World to begin a story.", "error", 5000);
              return;
          }
          
          // Check for 'create_new_' values and redirect
          if (aiCharacterId.startsWith('create_new_')) {
              this.showTopNotification("Please create your AI Character first, then select it.", "info", 5000);
              this.switchToScreen(this.CONSTANTS.VIEWS.CHARACTER_FORM, { 
                  itemType: 'character', 
                  isCreating: true, 
                  originalScreen: this.CONSTANTS.VIEWS.STORYBOARD,
                  preSelectedAiCharacterId: aiCharacterId, // Pass through selected values
                  preSelectedUserCharacterId: userCharacterId,
                  preSelectedWorldId: worldId
              });
              return;
          }
          if (userCharacterId.startsWith('create_new_')) {
              this.showTopNotification("Please create Your Character first, then select it.", "info", 5000);
              this.switchToScreen(this.CONSTANTS.VIEWS.CHARACTER_FORM, { 
                  itemType: 'character', 
                  isCreating: true, 
                  originalScreen: this.CONSTANTS.VIEWS.STORYBOARD,
                  preSelectedAiCharacterId: aiCharacterId,
                  preSelectedUserCharacterId: userCharacterId,
                  preSelectedWorldId: worldId
              });
              return;
          }
          if (worldId.startsWith('create_new_')) {
              this.showTopNotification("Please create your World first, then select it.", "info", 5000);
              this.switchToScreen(this.CONSTANTS.VIEWS.WORLD_FORM, { 
                  itemType: 'world', 
                  isCreating: true, 
                  originalScreen: this.CONSTANTS.VIEWS.STORYBOARD,
                  preSelectedAiCharacterId: aiCharacterId,
                  preSelectedUserCharacterId: userCharacterId,
                  preSelectedWorldId: worldId
              });
              return;
          }
    
          // 3. Fetch full data for selected items
          const aiCharacter = await this._getitemData(aiCharacterId, 'characters', this.getPremadeCharacterItems);
          const userCharacter = await this._getitemData(userCharacterId, 'characters', this.getPremadeCharacterItems);
          const world = await this._getitemData(worldId, 'worlds', this.getPremadeWorldItems);
    
          if (!aiCharacter || !userCharacter || !world) {
              this.showTopNotification("Error fetching selected items. Please try again.", "error", 5000);
              return;
          }
    
          // 4. Check for an existing story with these exact participants
          const existingStory = await this.db.stories.where({ aiCharacterId, userCharacterId, worldId, concluded: false }).first();
    
          if (existingStory) {
              console.log("[App Logic] Resuming existing story:", existingStory.id);
              this.showTopNotification("Resuming existing story!", "info");
              this.openStory(existingStory.id);
              return;
          }
    
          // 5. Create a new story if none exists
          console.log("[App Logic] Creating new story.");
          const newStoryId = await this.db.stories.add({
              aiCharacterId: aiCharacter.id,
              userCharacterId: userCharacter.id,
              worldId: world.id,
              name: `${aiCharacter.name} & ${userCharacter.name} in ${world.name}`, // Auto-generate initial name
              createdTimestamp: Date.now(),
              lastMessageTimestamp: null,
              concluded: false,
              summary: '', // Initialize summary
              openingPrompt: this.ui.openingPromptTextarea.value.trim(),
              customStoryJs: this.ui.customStoryJsTextarea.value.trim(),
              storyAiCharacter: aiCharacter, // Snapshot of characters/world for easier retrieval later
              storyUserCharacter: userCharacter,
              storyWorld: world
          });
          
          this.currentStoryId = newStoryId;
          this.activeStoryId = newStoryId; // Set newly created story as active
          await this.saveAppState(); // Save active story ID
    
          // 6. Navigate to the chat interface
          this.showTopNotification("Story started!", "success");
          this.openStory(newStoryId);
      },
    
      _getExistingProfilePictureUrl(itemId, dbTableKey) {
          // This function needs to fetch the item's existing profile picture URL
          // It's a placeholder, you'd implement the actual fetch logic
          // For now, it returns a hardcoded URL or empty string
          // In a real app, you'd fetch the item by ID from the DB/premades and return its profilePicture
          if (itemId && this.data[dbTableKey]) {
              const foundItem = this.data[dbTableKey].find(item => item.id === itemId || item.originalPremadeId === itemId);
              if (foundItem) return foundItem.profilePicture;
          }
          return '';
      },
    
      _getFormDataFromForm(elements) {
          const { nameInput, descriptionTextarea, eternalInput, pastInput, presentInput, futureInput } = elements;
          const paletteButton = elements.form.querySelector('.color-palette-button.selected');
          const colorPalette = paletteButton ? paletteButton.dataset.paletteKey : 'slate_gray';
    
          return {
              name: nameInput?.value.trim() || '',
              description: descriptionTextarea?.value.trim() || '',
              eternal: eternalInput?.value.trim() || '',
              past: pastInput?.value.trim() || '',
              present: presentInput?.value.trim() || '',
              future: futureInput?.value.trim() || '',
              profilePicture: this.currentGeneratedProfilePictureDataUrl || '', // Use generated or current
              colorPalette: colorPalette
          };
      },
      
      async createMessage(role, content, characterId = null) {
          if (!this.activeStoryId) {
              console.error("Cannot create message: no active story.");
              return;
          }
          const newMessage = {
              storyId: this.activeStoryId,
              role: role,
              content: content,
              characterId: characterId, // ID of character who sent it (if role is character)
              timestamp: Date.now(),
              isHidden: false // For system messages, etc.
          };
          const messageId = await this.db.messages.add(newMessage);
          await this.db.stories.update(this.activeStoryId, { lastMessageTimestamp: Date.now() });
          return { ...newMessage, id: messageId };
      },
    
      async sendButtonClickHandler() {
          const messageText = this.ui.messageInput.value.trim();
          if (!messageText || this.ui.sendButton.disabled) {
              console.log("Attempted to send empty or disabled message.");
              return;
          }
          
          this.ui.messageInput.value = ''; // Clear input immediately
          this.ui.messageInput.style.height = 'auto'; // Reset height
          this.ui.sendButton.disabled = true; // Disable send button to prevent spam
          this.ui.messageInput.disabled = true; // Disable textarea
          
          this._setAiIsTyping(true, "Thinking...");
          
          try {
              // Add user message to feed first
              const userMessage = await this.createMessage('user', messageText, this.currentUserCharacterId);
              this._addMessageToFeed(userMessage);
              this._updateChatUIForNewMessage(); // Scroll to bottom, etc.
              
              const aiResponse = await this._createAiRequest({
                  type: 'chat',
                  userMessage: messageText,
                  storyId: this.activeStoryId,
                  aiCharacterId: this.currentAiCharacterId,
                  userCharacterId: this.currentUserCharacterId,
                  worldId: (await this.db.stories.get(this.activeStoryId)).worldId,
              });
    
              if (aiResponse && aiResponse.generatedText) {
                  const aiMessage = await this.createMessage('character', aiResponse.generatedText, this.currentAiCharacterId);
                  this._addMessageToFeed(aiMessage);
              } else {
                  this.showTopNotification("AI did not respond.", "error");
                  await this.createMessage('system', 'AI did not respond. Please try again.', null, true); // Log system message
              }
          } catch (error) {
              console.error("Error during AI response:", error);
              this.showTopNotification(`AI response failed: ${error.message || 'Unknown error'}`, "error", 5000);
              await this.createMessage('system', `AI response failed: ${error.message || 'Unknown error'}.`, null, true);
          } finally {
              this.ui.sendButton.disabled = false; // Re-enable send button
              this.ui.messageInput.disabled = false; // Re-enable textarea
              this.ui.messageInput.focus();
              this._setAiIsTyping(false);
              this._updateChatUIForNewMessage();
              this.checkAllButtonStates(); // Ensure states are correct
          }
      },
    
      _addMessageToFeed(message, isForProfileScreen = false) {
          const feed = isForProfileScreen ? this.ui.storyProfilechatFeed : this.ui.chatFeed;
          if (!feed || !message || message.isHidden) return;
    
          const messageElement = document.createElement('div');
          messageElement.className = `message ${message.role}Message`;
          messageElement.dataset.messageId = message.id; // Store ID for potential regen/delete
    
          let contentHtml = this.sanitizeHtml(message.content);
          if (message.role === 'narrator' && message.content.startsWith('SUMMARY:')) {
              contentHtml = `<strong>Story Summary:</strong> ${this.sanitizeHtml(message.content.substring(8).trim())}`;
          } else if (message.role === 'narrator') { // General narrator message
              contentHtml = `<strong>Narrator:</strong> ${contentHtml}`;
          }
          
          let profilePictureHtml = '';
          if (message.characterId) {
              const character = (message.role === 'user' && this.currentUserCharacterId === message.characterId) ? this.data.characters.find(c => c.id === message.characterId || c.originalPremadeId === message.characterId) : this.data.characters.find(c => c.id === message.characterId || c.originalPremadeId === message.characterId);
              if (character) {
                  profilePictureHtml = `<div class="message-profile-picture">${this._generateProfilePictureHtml(character, 'message-profile-picture')}</div>`;
              }
          }
    
          messageElement.innerHTML = `
              <div class="messageWrap">
                  ${profilePictureHtml}
                  <div class="messageContentContainer">
                      <div class="messageText">${contentHtml}</div>
                      <div class="message-timestamp">${new Date(message.timestamp).toLocaleTimeString()}</div>
                  </div>
              </div>
          `;
          feed.appendChild(messageElement);
      },
    
      _updateChatUIForNewMessage() {
          // Scroll chat feed to bottom
          const feed = this.ui.chatFeed;
          if (feed) {
              feed.scrollTop = feed.scrollHeight;
          }
    
          // Hide "No messages yet" notice if messages exist
          if (this.ui.noMessagesNotice) {
              this.ui.noMessagesNotice.classList.toggle('hidden', feed.children.length > 0 || !this.ui.storyConcludedNotice.classList.contains('hidden'));
          }
      },
    
      async _setAiIsTyping(isTyping, customMessage = null) {
          if (isTyping) {
              this.ui.statusNotifier.classList.remove('hidden');
              this.ui.statusNotifier.dataset.originalDisplayValue = this.ui.statusNotifier.style.display;
              this.ui.statusNotifier.style.display = 'flex'; // Ensure flex display while typing
              this.ui.typingIndicatorText.textContent = customMessage || "AI is thinking...";
          } else {
              this.ui.statusNotifier.classList.add('hidden');
              this.ui.statusNotifier.style.display = 'none'; // Restore previous display or hide
          }
      },
    
      _cancelCurrentAiRequest() {
          if (this.activeAiButtons.has('generate') || this.activeAiButtons.has('image')) {
              const controller = this.activeAiButtons.get('generate') || this.activeAiButtons.get('image');
              controller.abort();
              this.activeAiButtons.delete('generate');
              this.activeAiButtons.delete('image');
              this.showTopNotification("AI request cancelled.", "info");
          }
      },
    
      async _createAiRequest(options) {
          const { type, prompt, context, instruction, userMessage, storyId, aiCharacterId, userCharacterId, worldId } = options;
          const controller = new AbortController();
          this.activeAiButtons.set(type, controller); // Store controller
    
          try {
              if (type === 'text' || type === 'chat') {
                  // Use the imported ai plugin for text generation
                  if (typeof ai !== 'undefined') {
                      const result = await ai({
                          instruction: instruction,
                          context: context,
                          text: userMessage,
                          storyId: storyId,
                          aiCharacterId: aiCharacterId,
                          userCharacterId: userCharacterId,
                          worldId: worldId
                      });
                      return result;
                  } else {
                      throw new Error("ai plugin not available");
                  }
              } else if (type === 'image') {
                  // Use the imported image plugin for image generation
                  if (typeof image !== 'undefined') {
                      const result = await image({
                          prompt: prompt
                      });
                      return result;
                  } else {
                      throw new Error("image plugin not available");
                  }
              } else {
                  throw new Error(`Unknown AI request type: ${type}`);
              }
          } catch (error) {
              if (error.name === 'AbortError') {
                  console.warn("AI request aborted by user.");
                  throw new Error("AI request cancelled.");
              } else {
                  console.error("AI Request encountered an error:", error);
                  throw new Error(`AI Error: ${error.message}`);
              }
          } finally {
              this.activeAiButtons.delete(type); // Clean up controller
          }
      },
    
      async _getSystemPrompt(storyIdOverride = null) {
          const storyId = storyIdOverride || this.activeStoryId;
          if (!storyId) return "";
    
          const story = await this.db.stories.get(storyId);
          if (!story) {
              console.warn(`Story with ID ${storyId} not found for system prompt.`);
              return "";
          }
    
          const aiCharacter = story.storyAiCharacter || await this._getitemData(story.aiCharacterId, 'characters', this.getPremadeCharacterItems);
          const userCharacter = story.storyUserCharacter || await this._getitemData(story.userCharacterId, 'characters', this.getPremadeCharacterItems);
          const world = story.storyWorld || await this._getitemData(story.worldId, 'worlds', this.getPremadeWorldItems);
    
          if (!aiCharacter || !userCharacter || !world) {
              console.warn(`Missing character or world data for story ID ${storyId} during system prompt creation.`);
              return "";
          }
    
          let systemPrompt = `You are ${aiCharacter.name}. Your core identity is: ${aiCharacter.eternal}. Your past is: ${aiCharacter.past}. Your current situation is: ${aiCharacter.present}. Your future aspirations are: ${aiCharacter.future}.
    The user is ${userCharacter.name}. Their core identity is: ${userCharacter.eternal}. Their past is: ${userCharacter.past}. Their current situation is: ${userCharacter.present}. Their future aspirations are: ${userCharacter.future}.
    The world is ${world.name}. Its eternal truths are: ${world.eternal}. Its past is: ${world.past}. Its current state is: ${world.present}. Its future possibilities are: ${world.future}.`;
    
          if (story.openingPrompt) {
              systemPrompt += `\n\n[Opening Prompt]: ${story.openingPrompt}`;
          }
          if (story.customStoryJs) {
              systemPrompt += `\n\n[Custom Story JS]: ${story.customStoryJs}`;
          }
    
          return systemPrompt;
      },
    
      async _getChatHistoryForAI() {
          if (!this.activeStoryId) return [];
    
          const messages = await this.db.messages.where({ storyId: this.activeStoryId, isHidden: false }).sortBy('timestamp');
          const recentMessages = messages.filter(msg => !msg.isHidden).slice(-20); // Last 20 messages
    
          return recentMessages.map(msg => ({
              role: msg.role === 'user' ? 'user' : 'model', // Map 'character' role to 'model' for AI
              parts: [{ text: msg.content }]
          }));
      },
    
      async _collectMemoriesFromStory() {
          // This is a placeholder for future memory collection logic
          // For now, it returns an empty array
          return [];
      },
    
      async _renderMemoryApplicationScreen(options = {}) {
          const { storyId } = options;
          const container = this.ui.memoryApplicationScreen;
          if (!container) return;
    
          container.innerHTML = '<h2>Applying Memories...</h2><p>Processing story data to extract key memories.</p>';
    
          try {
              const memories = await this._collectMemoriesFromStory(storyId); // Placeholder call
              if (memories.length > 0) {
                  container.innerHTML = `<h2>Memories Applied!</h2><p>Found ${memories.length} memories.</p>`;
                  // Display memories and allow user interaction
              } else {
                  container.innerHTML = '<h2>No New Memories Found</h2><p>This story did not generate significant new memories for your profiles.</p>';
              }
          } catch (error) {
              console.error("Error applying memories:", error);
              container.innerHTML = '<h2>Error Applying Memories</h2><p>Failed to process memories from this story.</p>';
          }
      },
    
      async _applyMemoriesToProfiles(storyId) {
          // Placeholder for applying extracted memories to character/world profiles
          console.log(`Applying memories for story ${storyId}`);
          // In a real implementation, you would:
          // 1. Fetch memories from the story
          // 2. Update the relevant character/world items in the DB
          // 3. Show a notification
      },
    
      async _updateStoryboard() {
          if (!this.storyboardSelected) {
            this.storyboardSelected = { ai: '', user: '', world: '' };
          }
          if (this.isUpdatingStoryboard) return;
          this.isUpdatingStoryboard = true;
          try {
              // console.log('[DEBUG] _updateStoryboard called. Current storyboardSelected:', this.storyboardSelected);
              // Ensure storyboardSelected exists
              this.storyboardSelected = this.storyboardSelected || { ai: '', user: '', world: '' };
  
              // Update the title
              await this.updateDynamicStoryboardTitle();
  
              // Helper to render a custom dropdown in the card
              const renderCardDropdown = async (dropdownEl, config) => {
                  let items = await config.getPremadesFn();
                  let userItems = await this.db[config.dbTableKey].where('isDeleted').notEqual(1).toArray();
                  userItems = userItems.sort((a, b) => (b.createdTimestamp || 0) - (a.createdTimestamp || 0));
                  // --- Add placeholder at the top ---
                  let placeholderText = 'Select...';
                  if (config.role === 'ai') {
                      placeholderText = 'Select AI Character...';
                  } else if (config.role === 'user') {
                      placeholderText = 'Select User Character...';
                  } else if (config.itemType === 'world') {
                      placeholderText = 'Select World...';
                  }
                  
                  const allOptions = [
                      { value: '', label: placeholderText, isPlaceholder: true, colorPalette: 'slate_gray' },
                      { value: `create_new_${config.itemType}`, label: '+ Create New', isCreate: true, colorPalette: 'slate_gray' },
                      ...userItems.map(item => ({ value: item.id, label: item.name || `Unnamed ${config.capital}`, colorPalette: item.colorPalette || 'slate_gray' })),
                      ...items.filter(item => item.isPremade).map(item => ({ value: `premade_${config.itemType}:${item.id}`, label: item.name, colorPalette: item.colorPalette || 'slate_gray' }))
                  ];
  
                  // --- Selection logic: default to '' (placeholder) if nothing selected ---
                  let selectedKey = null;
                  if (config.role === 'ai') selectedKey = 'ai';
                  else if (config.role === 'user') selectedKey = 'user';
                  else if (config.itemType === 'world') selectedKey = 'world';
          
                  // Always use the latest value from storyboardSelected
                  let selectedValue = this.storyboardSelected[selectedKey] || '';
                  if (!selectedValue && selectedKey && this.storyboardSelected[selectedKey]) {
                      selectedValue = this.storyboardSelected[selectedKey];
                  }
                  // DEBUG LOG BEFORE
                  if (selectedKey === 'ai') {
                                      // console.log('[DEBUG][AI DROPDOWN][BEFORE]', {
                  //   storyboardSelected: JSON.parse(JSON.stringify(this.storyboardSelected)),
                  //   selectedValue,
                  //   dropdownValue: dropdownEl.value,
                  // });
                  }
                  let selectedOption = allOptions.find(opt => opt.value === selectedValue);
                  if (!selectedOption) {
                      // Only clear storyboardSelected if selectedValue is not a valid selection (not create_new_ or placeholder)
                      if (selectedKey && selectedValue && !selectedValue.startsWith('create_new_') && selectedValue !== '') {
                          this.storyboardSelected[selectedKey] = '';
                      }
                      selectedOption = allOptions[0]; // Always fallback to placeholder
                      selectedValue = '';
                  }
  
                  // Render dropdown
                  dropdownEl.innerHTML = '';
                  // Add 'selected' class if this card is selected
                  if (selectedValue && !selectedOption.isPlaceholder) {
                    dropdownEl.classList.add('selected');
                  } else {
                    dropdownEl.classList.remove('selected');
                  }
                  const selectedDiv = document.createElement('span');
                  selectedDiv.className = 'card-title-selected';
                  if (selectedOption.isPlaceholder) {
                      selectedDiv.classList.add('placeholder-mode');
                  }
                  selectedDiv.appendChild(document.createTextNode(selectedOption.label.replace('+ ', '')));
                  dropdownEl.appendChild(selectedDiv);
  
                  // Dropdown menu
                  const menu = document.createElement('div');
                  menu.className = 'card-title-dropdown-menu hidden';
                  allOptions.forEach(opt => {
                      const optDiv = document.createElement('div');
                      optDiv.className = 'dropdown-option' + (opt.isCreate ? ' create-new' : '') + (opt.isPlaceholder ? ' placeholder-option' : '');
                      if (opt.isCreate) {
                          const plus = document.createElement('span');
                          plus.className = 'plus-sign';
                          plus.textContent = '+';
                          optDiv.appendChild(plus);
                      } else if (!opt.isPlaceholder) {
                          const dot = document.createElement('span');
                          dot.className = 'profile-dot';
                          dot.style.background = this._getPaletteColor(opt.colorPalette, 'medium');
                          optDiv.appendChild(dot);
                      }
                      optDiv.appendChild(document.createTextNode(opt.label.replace('+ ', '')));
                      if (!opt.isPlaceholder) {
                          optDiv.onclick = async (e) => {
                              e.stopPropagation();
                              menu.classList.add('hidden');
                              if (opt.isCreate) {
                                  this.switchToScreen(config.formScreen, { 
                                      itemType: config.itemType, 
                                      isCreating: true, 
                                      originalScreen: this.CONSTANTS.VIEWS.STORYBOARD
                                  });
                              } else {
                                  if (selectedKey) this.storyboardSelected[selectedKey] = opt.value;
                                  // console.log(`[DEBUG] Dropdown selection: ${config.itemType} set to ${opt.value}`);
                                  await this._updateStoryboard(); // Always re-render all cards for consistency
                              }
                          };
                      } else {
                          optDiv.style.color = '#888';
                          optDiv.style.cursor = 'not-allowed';
                          optDiv.style.pointerEvents = 'none';
                      }
                      menu.appendChild(optDiv);
                  });
                  dropdownEl.appendChild(menu);
                  // Open/close logic
                  selectedDiv.onclick = (e) => {
                      e.stopPropagation();
                      // Close all other open dropdowns first
                      document.querySelectorAll('.card-title-dropdown-menu:not(.hidden)').forEach(openMenu => {
                          if (openMenu !== menu) openMenu.classList.add('hidden');
                      });
                      menu.classList.toggle('hidden');
                      
                      // Position dropdown when opening
                      if (!menu.classList.contains('hidden')) {
                          // Reset any inline styles that might interfere
                          menu.style.position = '';
                          menu.style.left = '';
                          menu.style.top = '';
                          menu.style.right = '';
                          menu.style.maxWidth = '';
                          
                          // Get dropdown position and viewport info
                          const dropdownRect = dropdownEl.getBoundingClientRect();
                          const viewportHeight = window.innerHeight;
                          const viewportWidth = window.innerWidth;
                          
                          // Check if dropdown would go below viewport
                          const dropdownHeight = 300; // max-height from CSS
                          const spaceBelow = viewportHeight - dropdownRect.bottom;
                          const spaceAbove = dropdownRect.top;
                          
                          if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
                              // Position above the dropdown
                              menu.style.position = 'absolute';
                              menu.style.bottom = '100%';
                              menu.style.top = 'auto';
                              menu.style.margin = '0';
                          } else {
                              // Position below the dropdown (default)
                              menu.style.position = 'absolute';
                              menu.style.top = '100%';
                              menu.style.bottom = 'auto';
                              menu.style.margin = '0';
                          }
                          
                          // Check if dropdown would go beyond right edge
                          const dropdownWidth = Math.min(300, dropdownRect.width); // max-width from CSS
                          const spaceRight = viewportWidth - dropdownRect.left;
                          
                          if (spaceRight < dropdownWidth) {
                              // Align to right edge
                              menu.style.left = 'auto';
                              menu.style.right = '0';
                          } else {
                              // Align to left edge (default) - extend to card edges
                              menu.style.left = '-0.5rem';
                              menu.style.right = '-0.5rem';
                          }
                      }
                  };
  
                  // Add mouseover positioning for better UX
                  dropdownEl.addEventListener('mouseenter', () => {
                      if (!menu.classList.contains('hidden')) {
                          // Reposition on mouseover to handle any dynamic changes
                          const dropdownRect = dropdownEl.getBoundingClientRect();
                          const viewportHeight = window.innerHeight;
                          const viewportWidth = window.innerWidth;
                          
                          const dropdownHeight = 300;
                          const spaceBelow = viewportHeight - dropdownRect.bottom;
                          const spaceAbove = dropdownRect.top;
                          
                          if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
                              menu.style.position = 'absolute';
                              menu.style.bottom = '100%';
                              menu.style.top = 'auto';
                              menu.style.marginTop = '0';
                              menu.style.marginBottom = '0.25em';
                          } else {
                              menu.style.position = 'absolute';
                              menu.style.top = '100%';
                              menu.style.bottom = 'auto';
                              menu.style.marginTop = '0.25em';
                              menu.style.marginBottom = '0';
                          }
                          
                          const dropdownWidth = Math.min(300, dropdownRect.width);
                          const spaceRight = viewportWidth - dropdownRect.left;
                          
                          if (spaceRight < dropdownWidth) {
                              menu.style.left = 'auto';
                              menu.style.right = '0';
                          } else {
                              menu.style.left = '-0.5rem';
                              menu.style.right = '-0.5rem';
                          }
                      }
                  });
  
                  // Improved outside click handler
                  const closeMenuOnClick = (e) => {
                      if (!dropdownEl.contains(e.target)) {
                          menu.classList.add('hidden');
                      }
                  };
                  document.addEventListener('click', closeMenuOnClick);
                  // Remove event listener when dropdown is destroyed (optional, for memory safety)
                  dropdownEl._removeDropdownListener = () => {
                      document.removeEventListener('click', closeMenuOnClick);
                  };
              };
  
              // Render dropdowns for all three cards and set initial value
              await renderCardDropdown(this.ui.storyboardAiCharacterSelect, this.CONSTANTS.ITEM_CONFIG.characterAi, this.storyboardSelected.ai);
              await renderCardDropdown(this.ui.storyboardUserCharacterSelect, this.CONSTANTS.ITEM_CONFIG.characterUser, this.storyboardSelected.user);
              await renderCardDropdown(this.ui.storyboardWorldSelect, this.CONSTANTS.ITEM_CONFIG.world, this.storyboardSelected.world);
  
              // Always render the card-content grid for each card, even if only the dropdown is present
              const cardConfigs = [
                { card: this.ui.storyboardAiCharacterCard, select: this.ui.storyboardAiCharacterSelect, config: this.CONSTANTS.ITEM_CONFIG.characterAi, key: 'ai' },
                { card: this.ui.storyboardUserCharacterCard, select: this.ui.storyboardUserCharacterSelect, config: this.CONSTANTS.ITEM_CONFIG.characterUser, key: 'user' },
                { card: this.ui.storyboardWorldCard, select: this.ui.storyboardWorldSelect, config: this.CONSTANTS.ITEM_CONFIG.world, key: 'world' }
              ];
  
              for (const { card, select, config, key } of cardConfigs) {
                // Determine which item to use for rendering the card itself
                let itemToRender = null;
                let selectedValue = this.storyboardSelected[key];
                // console.log(`[DEBUG] _updateStoryboard: Processing ${key} with selectedValue:`, selectedValue);
                
                if (selectedValue && !selectedValue.startsWith('create_new_')) {
                  itemToRender = await this._getitemData(selectedValue, config.dbTableKey, config.getPremadesFn, config.itemType);
                  // console.log(`[DEBUG] _updateStoryboard: Retrieved item for ${key}:`, itemToRender);
                }
                if (itemToRender) {
                  // console.log(`[DEBUG] _updateStoryboard: Rendering card for ${key} with item:`, itemToRender);
                  this._renderStoryboardCard(card, itemToRender, config); // Pass the select element
                } else {
                  // console.log(`[DEBUG] _updateStoryboard: Clearing card for ${key} - no valid item`);
                  this.clearStoryboardCard(card, config);
                }
              }
              this.checkAllButtonStates();
          } finally {
              this.isUpdatingStoryboard = false;
          }
      },
    
      checkAllButtonStates() {
          // Only enable begin story button if all selects have a valid (non-empty, non-create_new) selection
          const aiSelect = this.ui.storyboardAiCharacterSelect;
          const userSelect = this.ui.storyboardUserCharacterSelect;
          const worldSelect = this.ui.storyboardWorldSelect;
          const aiSelected = aiSelect && aiSelect.value && !aiSelect.value.startsWith('create_new_');
          const userSelected = userSelect && userSelect.value && !userSelect.value.startsWith('create_new_');
          const worldSelected = worldSelect && worldSelect.value && !worldSelect.value.startsWith('create_new_');
    
          if (this.ui.beginStoryButton) {
              this.ui.beginStoryButton.disabled = !(aiSelected && userSelected && worldSelected);
          }
          if (this.ui.shuffleStoryElementsButton) {
              // Always enable shuffle, regardless of selection state
              this.ui.shuffleStoryElementsButton.disabled = false;
          }
    
          // Profile picture generation buttons
          const profilePicturePromptInput = document.querySelector('.profile-picture-overlay textarea'); // Assuming only one active
          const generateButton = document.querySelector('.profile-picture-overlay #profile-picture-generate-button');
          const useButton = document.querySelector('.profile-picture-overlay #profile-picture-use-button');
    
          if (generateButton) {
              generateButton.disabled = !profilePicturePromptInput || profilePicturePromptInput.value.trim() === '';
          }
          if (useButton) {
              useButton.disabled = !this.currentGeneratedProfilePictureDataUrl; // Only enabled if an image has been generated
          }
  
          // Update mouseover animation states based on button states
          this.updateMouseoverAnimationState();
      },
    
      async updateDynamicStoryboardTitle() {
        if (!this.storyboardSelected) return;
        
        // If user has set a custom title, use that instead
        if (this.storyboardCustomTitle) {
          this.ui.storyboardTitle.innerHTML = this.storyboardCustomTitle;
          return;
        }
        
        const aiCharName = await this._getSelectedCharacterName(this.ui.storyboardAiCharacterSelect);
        const userCharName = await this._getSelectedCharacterName(this.ui.storyboardUserCharacterSelect);
        const worldName = await this._getSelectedWorldName(this.ui.storyboardWorldSelect);
    
        let titleText = "Start a New Story";
        if (aiCharName && userCharName && worldName) {
            titleText = `${aiCharName} & ${userCharName} in ${worldName}`;
        } else if (aiCharName || userCharName || worldName) {
            const parts = [];
            if (aiCharName) parts.push(aiCharName);
            if (userCharName) parts.push(userCharName);
            if (worldName) parts.push(worldName);
            titleText = parts.join(' & ');
        }
        // console.log('[DEBUG] updateDynamicStoryboardTitle:', { aiCharName, userCharName, worldName, titleText });
        this.ui.storyboardTitle.innerHTML = titleText;
      },
    
      async _getSelectedCharacterName(selectElement) {
          if (!this.storyboardSelected) return null;
          // Determine which storyboardSelected key corresponds to this selectElement
          let selectedId = null;
          if (selectElement === this.ui.storyboardAiCharacterSelect) {
              selectedId = this.storyboardSelected.ai;
          } else if (selectElement === this.ui.storyboardUserCharacterSelect) {
              selectedId = this.storyboardSelected.user;
          }
  
          if (!selectedId || selectedId.startsWith('create_new_')) return null;
  
          const config = (selectElement === this.ui.storyboardAiCharacterSelect) ? this.CONSTANTS.ITEM_CONFIG.characterAi : this.CONSTANTS.ITEM_CONFIG.characterUser;
          const item = await this._getitemData(selectedId, config.dbTableKey, config.getPremadesFn, config.itemType);
          return item ? item.name : null;
      },
  
      async _getSelectedWorldName(selectElement) {
          if (!this.storyboardSelected) return null;
          let selectedId = this.storyboardSelected.world;
  
          if (!selectedId || selectedId.startsWith('create_new_')) return null;
  
          const config = this.CONSTANTS.ITEM_CONFIG.world;
          const item = await this._getitemData(selectedId, config.dbTableKey, config.getPremadesFn, config.itemType);
          return item ? item.name : null;
      },
    
      async updateStoryboardCard(selectElement, config) {
          const selectedValue = selectElement.value;
          const cardElement = (config.itemType === 'character' && selectElement.id === 'storyboard-ai-character-select') ? this.ui.storyboardAiCharacterCard :
                              (config.itemType === 'character' && selectElement.id === 'storyboard-user-character-select') ? this.ui.storyboardUserCharacterCard :
                              this.ui.storyboardWorldCard;
    
          if (!selectedValue || selectedValue.startsWith('create_new_')) {
              this.clearStoryboardCard(cardElement, config);
              return;
          }
    
          const item = await this._getitemData(selectedValue, config.dbTableKey, config.getPremadesFn, config.itemType);
          if (item) {
              this._renderStoryboardCard(cardElement, item, config);
          } else {
              this.clearStoryboardCard(cardElement, config);
              console.warn(`Item not found for ID: ${selectedValue} in ${config.itemType}`);
          }
          this.updateDynamicStoryboardTitle();
      },
    
      clearStoryboardCard(configOrCardElement) {
          let cardElement;
          let config;
    
          if (configOrCardElement.itemType) { // It's a config object
              config = configOrCardElement;
              if (config.itemType === 'character' && config.dbTableKey === 'characters' && config.capital === 'Character' && config.role === 'ai') {
                  cardElement = this.ui.storyboardAiCharacterCard;
              } else if (config.itemType === 'character' && config.dbTableKey === 'characters' && config.capital === 'Character' && config.role === 'user') {
                  cardElement = this.ui.storyboardUserCharacterCard;
              } else if (config.itemType === 'world' && config.dbTableKey === 'worlds') {
                  cardElement = this.ui.storyboardWorldCard;
              }
          } else { // It's a card element
              cardElement = configOrCardElement;
              // Determine config from card element's ID if possible, or pass it explicitly
              if (cardElement === this.ui.storyboardAiCharacterCard) config = this.CONSTANTS.ITEM_CONFIG.characterAi;
              else if (cardElement === this.ui.storyboardUserCharacterCard) config = this.CONSTANTS.ITEM_CONFIG.characterUser;
              else if (cardElement === this.ui.storyboardWorldCard) config = this.CONSTANTS.ITEM_CONFIG.world;
          }
    
          if (!cardElement || !config) return;
    
          // Save reference to the select by ID before removing content
          const selectId = cardElement.id.replace('-card', '-select');
          let select = document.getElementById(selectId);
          
          // Remove any old card content
          let contentContainer = cardElement.querySelector('.card-content');
          if (contentContainer) {
              contentContainer.remove();
          }
          
          // Create new content container with grid layout (same as _renderStoryboardCard)
          contentContainer = document.createElement('div');
          contentContainer.className = 'card-content';
          contentContainer.style.display = 'grid';
          contentContainer.style.gridTemplateColumns = '35% 65%';
          contentContainer.style.gap = '0';
          contentContainer.style.alignItems = 'stretch';
          contentContainer.style.justifyContent = 'start';
          contentContainer.style.height = '100%';
          contentContainer.style.minHeight = '260px';
          contentContainer.style.maxHeight = '100%';
  
          // Avatar/profile picture (left side)
          const avatarDiv = document.createElement('div');
          avatarDiv.className = 'card-avatar';
          avatarDiv.style.position = 'relative';
          avatarDiv.style.width = '100%';
          avatarDiv.style.height = '100%';
          avatarDiv.style.overflow = 'hidden';
          
          // Create a dummy item for placeholder avatar
          const dummyItem = { name: '', profilePicture: '', colorPalette: config.colorPalette || 'slate_gray', isPremade: false };
          avatarDiv.innerHTML = this._generateProfilePictureHtml(dummyItem, 'storyboard');
          
          // Info column (right side - empty for placeholder)
          const infoDiv = document.createElement('article');
          infoDiv.className = 'card-info';
          infoDiv.style.display = 'flex';
          infoDiv.style.flexDirection = 'column';
          infoDiv.style.justifyContent = 'center';
          infoDiv.style.height = '100%';
          infoDiv.style.borderTopRightRadius = 'var(--pico-radius, 0.5rem)';
          infoDiv.style.borderBottomRightRadius = 'var(--pico-radius, 0.5rem)';
  
          // Add item name (dropdown/select) to header
          const headerElement = document.createElement('header');
          headerElement.style.display = 'flex';
          headerElement.style.alignItems = 'center';
          headerElement.style.padding = '0.5rem';
          headerElement.style.borderTopRightRadius = 'var(--pico-radius, 0.5rem)';
          
          // Move the dropdown/select into the header as the "name"
          if (select) {
              select.style.width = '100%';
              select.style.fontSize = '1.1em';
              select.style.fontWeight = 'bold';
              select.style.background = 'transparent';
              select.style.border = 'none';
              select.style.outline = 'none';
              select.style.margin = '0';
              select.style.padding = '0';
              headerElement.appendChild(select);
          }
          
          infoDiv.appendChild(headerElement);
          
          // Add helpful placeholder text to the info column
          const placeholderSpan = document.createElement('div');
          placeholderSpan.className = 'card-placeholder-text';
          placeholderSpan.style.textAlign = 'center';
          placeholderSpan.style.padding = '1rem';
          placeholderSpan.style.color = 'var(--pico-muted-color, #aaa)';
          placeholderSpan.style.fontStyle = 'italic';
          placeholderSpan.style.fontSize = '0.9em';
          placeholderSpan.style.lineHeight = '1.4';
          placeholderSpan.style.display = 'flex';
          placeholderSpan.style.alignItems = 'center';
          placeholderSpan.style.justifyContent = 'center';
          placeholderSpan.style.flex = '1';
          
          // Set specific text based on card type
          if (cardElement === this.ui.storyboardAiCharacterCard) {
              placeholderSpan.textContent = 'Please select an AI Character to begin your story. The AI will guide the narrative and respond to your character.';
          } else if (cardElement === this.ui.storyboardUserCharacterCard) {
              placeholderSpan.textContent = 'Please select your Character to begin your story.';
          } else if (cardElement === this.ui.storyboardWorldCard) {
              placeholderSpan.textContent = 'Please select a World to begin your story. This sets the scene and atmosphere for your adventure.';
          }
          
          infoDiv.appendChild(placeholderSpan);
          
          // Add invisible footer for consistent spacing (same as populated cards)
          const footerDiv = document.createElement('footer');
          footerDiv.style.display = 'flex';
          footerDiv.style.justifyContent = 'flex-end';
          footerDiv.style.alignItems = 'center';
          footerDiv.style.minHeight = '1.5rem'; // Match the height of premade tag footer
          
          // Add invisible premade tag to maintain layout consistency
          const invisibleTag = document.createElement('small');
          invisibleTag.textContent = 'Premade';
          invisibleTag.style.visibility = 'hidden'; // Invisible but takes up space
          invisibleTag.style.background = this.getColorPalette(config.colorPalette || 'slate_gray').colors.medium;
          invisibleTag.style.color = '#fff';
          invisibleTag.style.borderRadius = '999px';
          invisibleTag.style.fontSize = '0.75em';
          invisibleTag.style.fontStyle = 'italic';
          invisibleTag.style.fontWeight = 'normal';
          invisibleTag.style.display = 'inline-block';
          invisibleTag.style.padding = '0.25em 0.5em';
          
          footerDiv.appendChild(invisibleTag);
          infoDiv.appendChild(footerDiv);
          
          // Assemble grid
          contentContainer.appendChild(avatarDiv);
          contentContainer.appendChild(infoDiv);
          cardElement.appendChild(contentContainer);
          
          // Remove specific background style if any
          cardElement.style.backgroundImage = '';
          cardElement.style.backgroundColor = '';
          cardElement.style.setProperty('--card-item-main-color', '');
      },
    
      _renderStoryboardCard(cardElement, item, config) {
          // console.log('[DEBUG] _renderStoryboardCard called for:', { 
          //   itemType: config.itemType, 
          //   itemName: item.name, 
          //   itemId: item.id, 
          //   isPremade: item.isPremade,
          //   colorPalette: item.colorPalette 
          // });
          // Remove any old placeholder avatar ('.profile-picture')
          let oldPlaceholder = cardElement.querySelector('.profile-picture');
          if (oldPlaceholder) oldPlaceholder.remove();
          // Save reference to the select by ID before removing content
          const selectId = cardElement.id.replace('-card', '-select');
          let select = document.getElementById(selectId);
          // Remove any old card content below the select
          let contentContainer = cardElement.querySelector('.card-content');
          if (contentContainer) {
              contentContainer.remove();
          }
          // Hide/remove the placeholder text if present
          let placeholderSpan = cardElement.querySelector('.card-placeholder-text');
          if (placeholderSpan) {
              placeholderSpan.style.display = 'none';
          }
          // Create new content container
          contentContainer = document.createElement('div');
          contentContainer.className = 'card-content';
          contentContainer.style.display = 'grid';
          contentContainer.style.gridTemplateColumns = '35% 65%';
          contentContainer.style.gap = '0';
          contentContainer.style.alignItems = 'stretch';
          contentContainer.style.justifyContent = 'start';
          contentContainer.style.height = '100%';
          contentContainer.style.minHeight = '260px';
          contentContainer.style.maxHeight = '100%';
  
          // Avatar/profile picture (use actual item for initials or image)
          const avatarDiv = document.createElement('div');
          avatarDiv.className = 'card-avatar';
          avatarDiv.style.position = 'relative';
          avatarDiv.style.width = '100%';
          avatarDiv.style.height = '100%';
          avatarDiv.style.overflow = 'hidden';
          // Ensure we have a valid palette key for the profile picture
          const validPaletteKey = getValidPaletteKey(item);
          const itemWithValidPalette = { ...item, colorPalette: validPaletteKey };
          // console.log('[DEBUG] Storyboard card profile picture:', { 
          //   originalItem: item, 
          //   validPaletteKey, 
          //   itemWithValidPalette 
          // });
          avatarDiv.innerHTML = this._generateProfilePictureHtml(itemWithValidPalette, 'storyboard');
          
          // Info column (dropdown + description)
          const infoDiv = document.createElement('article');
          infoDiv.className = 'card-info';
          infoDiv.style.display = 'flex';
          infoDiv.style.flexDirection = 'column';
          infoDiv.style.justifyContent = 'center';
          infoDiv.style.height = '100%';
          infoDiv.style.borderTopRightRadius = 'var(--pico-radius, 0.5rem)';
          infoDiv.style.borderBottomRightRadius = 'var(--pico-radius, 0.5rem)';
  
          // Add item name (dropdown/select) to header
          const headerElement = document.createElement('header');
          headerElement.style.display = 'flex';
          headerElement.style.alignItems = 'center';
          headerElement.style.padding = '0.5rem';
          headerElement.style.borderTopRightRadius = 'var(--pico-radius, 0.5rem)';
          
          // Move the dropdown/select into the header as the "name"
          if (select) {
              select.style.width = '100%';
              select.style.fontSize = '1.1em';
              select.style.fontWeight = 'bold';
              select.style.background = 'transparent';
              select.style.border = 'none';
              select.style.outline = 'none';
              select.style.margin = '0';
              select.style.padding = '0';
              headerElement.appendChild(select);
          }
          
          infoDiv.appendChild(headerElement);
  
          // Always append the select (by ID) to infoDiv, if it exists
          if (select) {
              select.style.margin = '0';
              select.style.width = '100%';
          }
  
          // Description
          const descDiv = document.createElement('div');
          descDiv.className = 'card-description';
          descDiv.style.color = 'var(--pico-muted-color, #aaa)';
          descDiv.style.fontSize = '0.95em';
          descDiv.style.padding = '0 0.5rem';
          descDiv.style.textAlign = 'center';
          descDiv.style.textWrap = 'pretty';
          descDiv.style.display = 'flex';
          descDiv.style.alignItems = 'center';
          descDiv.style.justifyContent = 'center';
          descDiv.style.flex = '1';
          descDiv.innerHTML = this.sanitizeHtml(item.description || '');
          infoDiv.appendChild(descDiv);
  
          // Footer with premade tag (if applicable)
          if (item.isPremade) {
              const footerDiv = document.createElement('footer');
              footerDiv.style.display = 'flex';
              footerDiv.style.justifyContent = 'flex-end';
              footerDiv.style.alignItems = 'center';
              
              const tagSpan = document.createElement('small');
              tagSpan.textContent = 'Premade';
              tagSpan.style.background = this.getColorPalette(item.colorPalette || 'slate_gray').colors.medium;
              tagSpan.style.color = '#fff';
              tagSpan.style.borderRadius = '999px';
              tagSpan.style.fontSize = '0.75em';
              tagSpan.style.fontStyle = 'italic';
              tagSpan.style.fontWeight = 'normal';
              tagSpan.style.display = 'inline-block';
              
              footerDiv.appendChild(tagSpan);
              infoDiv.appendChild(footerDiv);
          }
  
          // Assemble grid
          contentContainer.appendChild(avatarDiv);
          contentContainer.appendChild(infoDiv);
          cardElement.appendChild(contentContainer);
          
          // Card styling - let Pico handle the styling
          cardElement.tabIndex = 0;
          cardElement.setAttribute('aria-label', `View profile for ${item.name || config.capital}`);
          cardElement.style.cursor = 'pointer';
          cardElement.style.minHeight = '120px';
          cardElement.onclick = (e) => {
            if (e.target.closest('select')) return;
            this.switchToScreen(config.profileScreen, { itemId: item.id, itemType: config.itemType });
          };
      },
    
      async _manageAiButtonState(button, options) {
          const { type, field, itemType } = options;
          const originalButtonHtml = button.innerHTML; // Store original content
    
          button.onclick = async () => {
              this.showTopNotification("Generating...", "info", 2000);
              button.disabled = true;
              button.innerHTML = `<span class="button-text">Generating...</span>`; // Change text and disable
    
              const context = this._getPromptContextForField(itemType, field.id);
              const instruction = this._getPromptInstructionForField(type, itemType, field.value);
    
              const controller = new AbortController();
              this.activeAiButtons.set(field.id, controller); // Store controller by field ID
    
              try {
                  const result = await this._createAiRequest({ type: 'text', context, instruction, signal: controller.signal });
                  if (result && result.generatedText) {
                      field.value = result.generatedText.trim();
                      field.dispatchEvent(new Event('input')); // Trigger input to update height
                      this.showTopNotification("Generated!", "success");
                  } else {
                      this.showTopNotification("Could not generate response.", "error");
                  }
              } catch (error) {
                  if (error.name === 'AbortError') {
                      this.showTopNotification("Generation cancelled.", "info");
                  } else {
                      console.error("AI help failed:", error);
                      this.showTopNotification(`AI Help failed: ${error.message || 'Error generating.'}`, "error", 5000);
                  }
              } finally {
                  button.innerHTML = originalButtonHtml; // Restore original content
                  button.disabled = false; // Re-enable button
                  this.activeAiButtons.delete(field.id); // Clean up controller
                  this.checkAllButtonStates();
              }
          };
      },
    
      _getPromptContextForField(itemType) {
          const name = this.ui[`${itemType}Name`]?.value.trim() || '';
          const description = this.ui[`${itemType}Description`]?.value.trim() || '';
          const eternal = this.ui[`${itemType}Eternal`]?.value.trim() || '';
          const past = this.ui[`${itemType}Past`]?.value.trim() || '';
          const present = this.ui[`${itemType}Present`]?.value.trim() || '';
          const future = this.ui[`${itemType}Future`]?.value.trim() || '';
    
          let context = `The user is creating or editing a ${itemType} profile. The ${itemType} is named "${name || 'an unnamed ' + itemType}".`;
          if (description) context += ` Its summary/card info is: "${description}".`;
          if (eternal) context += ` Its eternal truths are: "${eternal}".`;
          if (past) context += ` Its past is: "${past}".`;
          if (present) context += ` Its present is: "${present}".`;
          if (future) context += ` Its future aspirations are: "${future}".`;
    
          return context;
      },
    
      _getPromptInstructionForField(fieldType, itemType, currentValue) {
          let instruction = `Generate a concise, compelling 1-2 sentence text for the "${fieldType}" field of a ${itemType} profile.`;
          if (currentValue) {
              instruction += ` The current text is: "${currentValue}". Improve or expand upon this.`;
          }
          instruction += ` Focus on descriptive language relevant to a story RPG.`;
    
          switch (fieldType) {
              case 'description':
                  instruction += ` This is a brief, overall summary.`;
                  break;
              case 'eternal':
                  instruction += ` This describes unchanging core aspects.`;
                  break;
              case 'past':
                  instruction += ` This describes history and formative events.`;
                  break;
              case 'present':
                  instruction += ` This describes the immediate situation or current state.`;
                  break;
              case 'future':
                  instruction += ` This describes goals, aspirations, or potential future events.`;
                  break;
          }
          return instruction;
      },
    
  
    
      async renderChatHistory(storyId) {
        if (!this.ui.chatFeed) {
          console.error("Chat feed element not found.");
          return;
        }
        this.ui.chatFeed.innerHTML = ''; // Clear existing messages
        const messages = await this.db.messages.where({ storyId: storyId }).sortBy('timestamp');
        if (messages.length === 0) {
          this.ui.chatFeed.insertAdjacentHTML('beforeend', `<p class="p-4 text-sm text-center">Start a conversation!</p>`);
          return;
        }
        messages.forEach(msg => {
            if (!msg.isHidden) { // Only render non-hidden messages in chat history
                this._addMessageToFeed(msg);
            }
        });
        this.ui.chatFeed.scrollTop = this.ui.chatFeed.scrollHeight; // Scroll to bottom
      },
    
      renderSettingsScreen() {
          const container = document.getElementById('settings-screen');
          if (!container) return;
          container.innerHTML = `
              <h2>Settings</h2>
              <div class="form-section">
                  <label for="dbNameInput">Database Name:</label>
                  <input type="text" id="dbNameInput" value="${window.dbName || 'rpglitch-db'}" readonly>
              </div>
              <button onclick="App.exportAllData()">Export All Data</button>
              <button onclick="document.getElementById('importFileInput').click()">Import Data</button>
              <input type="file" id="importFileInput" accept=".json" class="hidden-input" onchange="App.importAllData(event)">
              <button onclick="App.deleteAllData()">Delete All Data</button>
          `;
      },
    
      renderMemoryManagementScreen() {
          const container = document.getElementById('memory-management-screen');
          if (!container) return;
          container.innerHTML = '<h2>Memory Management</h2><p>Coming soon...</p>';
      },
    
      renderMemoryApplicationScreen() {
          const container = this.ui.memoryApplicationScreen;
          if (!container) return;
          container.innerHTML = '<h2>Apply Memories to Profiles</h2><p>This screen allows you to apply extracted memories from a story back into character or world profiles.</p><p>Coming soon...</p>';
      },
    
      async regenerateMessage() {
          // Logic for regenerating a message
      },
    
      async _handleAiCoWriter() {
          // Logic for AI Co-writer
      },
    
      async _handleSummarize() {
          // Logic for AI Summarize
      },
    
      async exportAllData() {
          if (!this.db) {
              this.showTopNotification("Database not initialized.", "error");
              return;
          }
          try {
              const allData = {};
              for (const table of this.db.tables) {
                  allData[table.name] = await table.toArray();
              }
              const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `rpglitch_data_${new Date().toISOString().slice(0, 10)}.json`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              this.showTopNotification("All data exported!", "success");
          } catch (error) {
              console.error("Error exporting data:", error);
              this.showTopNotification("Error exporting data.", "error");
          }
      },
    
      async importAllData(event) {
          const file = event.target.files[0];
          if (!file) {
              this.showTopNotification("No file selected for import.", "info");
              return;
          }
          if (!confirm("Importing data will overwrite your existing data. Are you sure?")) {
              return;
          }
          try {
              const reader = new FileReader();
              reader.onload = async (e) => {
                  try {
                      const importedData = JSON.parse(e.target.result);
                      await this.db.transaction('rw', this.db.tables, async () => {
                          for (const table of this.db.tables) {
                              await table.clear(); // Clear existing data
                              if (importedData[table.name]) {
                                  await table.bulkAdd(importedData[table.name]); // Add imported data
                              }
                          }
                      });
                      this.showTopNotification("Data imported successfully!", "success");
                      await this.initialLoad(); // Re-initialize app with new data
                  } catch (parseError) {
                      console.error("Error parsing imported file:", parseError);
                      this.showTopNotification("Error importing data: invalid file format.", "error");
                  }
              };
              reader.readAsText(file);
          } catch (error) {
              console.error("Error reading file for import:", error);
              this.showTopNotification("Error reading file for import.", "error");
          }
      },
    
      async deleteAllData() {
          if (!confirm("Are you sure you want to delete ALL your data? This cannot be undone.")) {
              return;
          }
          try {
              await this.db.delete();
              this.showTopNotification("All data deleted. App will reload.", "success");
              setTimeout(() => location.reload(), 1500); // Reload page after a short delay
          } catch (error) {
              console.error("Error deleting data:", error);
              this.showTopNotification("Error deleting data.", "error");
          }
      },
    
      async _shuffleStoryboard() {
          // Check if database is initialized
          if (!this.db) {
              console.warn('[DEBUG] Database not initialized yet, skipping _shuffleStoryboard');
              this.showTopNotification("Please wait for the application to finish loading.", "info", 3000);
              return;
          }
          
          // Helper to build options array for a card type
          const buildOptions = async (config) => {
              let items = await config.getPremadesFn();
              let userItems = await this.db[config.dbTableKey].where('isDeleted').notEqual(1).toArray();
              userItems = userItems.sort((a, b) => (b.createdTimestamp || 0) - (a.createdTimestamp || 0));
              return [
                  // Placeholder and create-new are excluded for shuffle
                  ...userItems.map(item => ({ value: item.id, label: item.name || `Unnamed ${config.capital}` })),
                  ...items.filter(item => item.isPremade).map(item => ({ value: `premade_${config.itemType}:${item.id}`, label: item.name }))
              ];
          };
          const aiOptions = await buildOptions(this.CONSTANTS.ITEM_CONFIG.characterAi);
          const userOptions = await buildOptions(this.CONSTANTS.ITEM_CONFIG.characterUser);
          const worldOptions = await buildOptions(this.CONSTANTS.ITEM_CONFIG.world);
  
          if (aiOptions.length > 0) {
              const randomAi = aiOptions[Math.floor(Math.random() * aiOptions.length)].value;
              this.storyboardSelected.ai = randomAi;
          }
          if (userOptions.length > 0) {
              const randomUser = userOptions[Math.floor(Math.random() * userOptions.length)].value;
              this.storyboardSelected.user = randomUser;
          }
          if (worldOptions.length > 0) {
              const randomWorld = worldOptions[Math.floor(Math.random() * worldOptions.length)].value;
              this.storyboardSelected.world = randomWorld;
          }
                      // console.log('[DEBUG][SHUFFLE] storyboardSelected after shuffle:', JSON.parse(JSON.stringify(this.storyboardSelected)));
          await this._updateStoryboard();
          await this.updateDynamicStoryboardTitle();
      },
    
      _getInitials(name) {
          if (!name) return '?';
          
          // Remove quotation marks and split into words
          const cleanName = name.replace(/['"]/g, '');
          const words = cleanName.split(' ');
          
          // Common words to skip (lowercase for comparison)
          const skipWords = ['the', 'of', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'from', 'a', 'an'];
          
          // Filter out common words and get initials
          const filteredWords = words.filter(word => {
              const lowerWord = word.toLowerCase();
              return !skipWords.includes(lowerWord) && word.length > 0;
          });
          
          // Get initials from filtered words (allow up to 3 initials)
          const initials = filteredWords.map(w => w[0]).join('').toUpperCase().slice(0, 3);
          
          // If no initials found after filtering, fall back to original logic
          return initials || name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 3);
      },
    
      _getPaletteColor(paletteKey, colorType) {
          const palette = this.CONSTANTS.COLOR_PALETTES[paletteKey] || this.CONSTANTS.COLOR_PALETTES.slate_gray;
          return palette.colors[colorType] || '#607d8b'; // Default to slate_gray medium
      },
    
      _makeProfilePicturePlaceholderSVG(name, paletteKey, isPremade, itemId = null) {
        if (!this._profilePicturePlaceholderCache) this._profilePicturePlaceholderCache = {};
        
        // Normalize the itemId for consistent cache keys
        let normalizedItemId = itemId;
        if (itemId && isPremade) {
          // Extract the actual ID from prefixed IDs like "premade_world:forest" -> "forest"
          if (itemId.includes(':')) {
            normalizedItemId = itemId.split(':')[1];
          }
        }
        
        const keyPart = normalizedItemId ? `id:${normalizedItemId}` : `name:${name}`;
        const cacheKey = `${keyPart}::${paletteKey}::${isPremade}`;
        
        // Debug logging for profile picture generation
        // console.log('[DEBUG] Profile picture cache key:', cacheKey, 'for item:', { name, paletteKey, isPremade, itemId, normalizedItemId });
        
        if (this._profilePicturePlaceholderCache[cacheKey]) {
                      // console.log('[DEBUG] Using cached profile picture for:', cacheKey);
          return this._profilePicturePlaceholderCache[cacheKey];
        }
        const initials = this._getInitials(name);
        const palette = this.getColorPalette(paletteKey);
        const bgColor = palette.colors.medium;
        const textColor = palette.colors.light;
        
        // Additional debug logging for palette colors
        // console.log('[DEBUG] Profile picture colors:', { paletteKey, bgColor, textColor, palette, initials });
        
        // Calculate font size based on number of initials
        let fontSize = 40; // Base size for 1 character
        if (initials.length === 2) {
          fontSize = 35; // Slightly smaller for 2 characters
        } else if (initials.length === 3) {
          fontSize = 25; // Much smaller for 3 characters
        }
        
        const svgContent = `
          <svg width="100%" height="100%" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="${bgColor}"/>
            <text x="50%" y="50%" font-family="${this.CONSTANTS.FONT_FAMILY}" font-size="${fontSize}" fill="${textColor}" text-anchor="middle" dominant-baseline="middle">${initials}</text>
          </svg>
        `;
        const dataUrl = `data:image/svg+xml;base64,${btoa(svgContent)}`;
        this._profilePicturePlaceholderCache[cacheKey] = dataUrl;
        // console.log('[DEBUG] Generated new profile picture for:', cacheKey);
        return dataUrl;
      },
    
      // This function is now just a wrapper for the external component's function
      // It handles passing the correct palette object and font family
      _generateProfilePictureHtml(item, context = 'profile') {
        const paletteKey = getValidPaletteKey(item);
        const palette = this.getColorPalette(paletteKey);
        
        // Set global context for ProfilePictureComponent
        window.currentProfilePictureItemId = item.id || null;
        window.currentProfilePictureIsPremade = item.isPremade || false;
        window.currentProfilePictureItem = item;
        
              // console.log('[DEBUG] _generateProfilePictureHtml setting context:', { 
      //   itemId: window.currentProfilePictureItemId, 
      //   isPremade: window.currentProfilePictureIsPremade,
      //   item: item,
      //   paletteKey: paletteKey,
      //   palette: palette
      // });
        
        // Pass palette with key property for better reliability
        const paletteWithKey = { ...palette, key: paletteKey };
        return getProfilePictureHTML(item, paletteWithKey, context, this.CONSTANTS.FONT_FAMILY);
      },
    
      _getProfilePictureSrc(item) {
            // console.log('[DEBUG] _getProfilePictureSrc called for item:', { 
    //   name: item.name, 
    //   hasProfilePicture: !!(item.profilePicture && item.profilePicture.trim()),
    //   colorPalette: item.colorPalette,
    //   validPaletteKey: getValidPaletteKey(item),
    //   isPremade: item.isPremade,
    //   id: item.id 
    // });
        
        return (item.profilePicture && item.profilePicture.trim())
          ? item.profilePicture.trim()
          : this._makeProfilePicturePlaceholderSVG(item.name || '', getValidPaletteKey(item), item.isPremade, item.id);
      },
    
        /**
         * Updates the UI based on the active tab and chin state.
         */
        updateTopBarUI() {
            // console.log('[DEBUG] updateTopBarUI called. Current mode:', this.focusBarState.mode, 'Current Main View:', this.currentMainView);
            
            // Check if database is initialized before proceeding
            if (!this.db) {
                console.warn('[DEBUG] Database not initialized yet, skipping updateTopBarUI');
                return;
            }
            
            // Update active tab styling
            this.focusBarState.tabs.forEach(tab => {
                const tabButton = document.querySelector(`button[data-tab="${tab}"]`);
                if (tabButton) {
                    if (tab === this.focusBarState.mode) {
                        tabButton.setAttribute('aria-selected', 'true');
                        tabButton.tabIndex = 0;
                    } else {
                        tabButton.setAttribute('aria-selected', 'false');
                        tabButton.tabIndex = -1;
                    }
                }
            });
  
            // Hide all chins by default
            const chinIds = ['storyboard-chin', 'character-workshop-chin', 'world-builder-chin', 'options-chin'];
            chinIds.forEach(id => {
                const chin = document.getElementById(id);
                if (chin) chin.classList.add('hidden');
            });
  
            // Show the active chin if chinOpen is true
            if (this.focusBarState.chinOpen) {
                let activeChinId = null;
                switch (this.focusBarState.mode) {
                    case 'storyboard':
                        activeChinId = 'storyboard-chin'; break;
                    case 'characters':
                        activeChinId = 'character-workshop-chin'; break;
                    case 'worlds':
                        activeChinId = 'world-builder-chin'; break;
                    case 'options':
                        activeChinId = 'options-chin'; break;
                }
                if (activeChinId) {
                    const activeChin = document.getElementById(activeChinId);
                    if (activeChin) activeChin.classList.remove('hidden');
                }
            }
  
            // Chin toggling logic (remove style.display logic)
            const chinMap = {
                storyboard: this.ui.storyboardChin,
                characters: this.ui.characterWorkshopChin,
                worlds: this.ui.worldBuilderChin,
                options: this.ui.optionsChin
            };
            Object.entries(chinMap).forEach(([tab, chinEl]) => {
                if (chinEl) chinEl.classList.toggle('hidden', !(this.focusBarState.mode === tab && this.focusBarState.chinOpen));
                // if (chinEl) console.log(`[DEBUG] Chin: ${tab} classList:`, Array.from(chinEl.classList));
            });
            // Render lists in chins when open, clear when closed
            if (this.focusBarState.chinOpen) {
                if (this.focusBarState.mode === 'characters' && this.ui.characterWorkshopChin) {
                    const listEl = document.getElementById('chin-character-list');
                    if (listEl) this._populateList(listEl, '', this.CONSTANTS.ITEM_CONFIG.character);
                } else if (this.focusBarState.mode === 'worlds' && this.ui.worldBuilderChin) {
                    const listEl = document.getElementById('chin-world-list');
                    if (listEl) this._populateList(listEl, '', this.CONSTANTS.ITEM_CONFIG.world);
                } else if (this.focusBarState.mode === 'storyboard' && this.ui.storyboardChin) {
                    const listEl = document.getElementById('chin-story-list');
                    if (listEl) this._populateStoryList(listEl);
                }
            } else {
                // Clear all chin lists when closed
                ['chin-character-list','chin-world-list','chin-story-list'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.innerHTML = '';
                });
            }
            
            // Ensure search handlers are set up when chin is opened
            if (this.focusBarState.chinOpen) {
                this._setupSearchHandlers();
            }
  
            // Handle visibility of main top bar vs. profile top bars
            const isProfileScreen = [
              this.CONSTANTS.VIEWS.CHARACTER_PROFILE,
              this.CONSTANTS.VIEWS.WORLD_PROFILE,
              this.CONSTANTS.VIEWS.STORY_PROFILE // Include STORY_PROFILE in profile screens
            ].includes(this.currentMainView);
            
            const isFormScreen = [
              this.CONSTANTS.VIEWS.CHARACTER_FORM,
              this.CONSTANTS.VIEWS.WORLD_FORM
            ].includes(this.currentMainView);
  
                      // console.log('[DEBUG] isProfileScreen:', isProfileScreen);
          // console.log('[DEBUG] currentMainView:', this.currentMainView);
          // console.log('[DEBUG] CONSTANTS.VIEWS.CHARACTER_PROFILE:', this.CONSTANTS.VIEWS.CHARACTER_PROFILE);
          // console.log('[DEBUG] CONSTANTS.VIEWS.WORLD_PROFILE:', this.CONSTANTS.VIEWS.WORLD_PROFILE);
          // console.log('[DEBUG] CONSTANTS.VIEWS.STORY_PROFILE:', this.CONSTANTS.VIEWS.STORY_PROFILE);
  
            if (this.ui.topBar) {
              this.ui.topBar.classList.toggle('hidden', isProfileScreen);
              // console.log('[DEBUG] Main Top Bar hidden:', this.ui.topBar.classList.contains('hidden'));
              
                          // For form screens, ensure the main top bar is visible and add form action buttons
            if (isFormScreen) {
              this.ui.topBar.classList.remove('hidden');
              
              // Add form action buttons to the top bar for edit/create screens
              const topBarCenter = this.ui.topBar.querySelector('.top-bar-center');
              if (topBarCenter) {
                // Determine if this is a custom (non-premade) item for delete button
                const isCustomItem = this.currentProfileViewItemId && !this.currentProfileViewItemId.startsWith('premade_');
                const itemType = this.currentMainView === this.CONSTANTS.VIEWS.CHARACTER_FORM ? 'Character' : 'World';
                
                topBarCenter.innerHTML = `
                  <div class="form-top-bar-actions">
                    <button type="button" id="cancel${itemType}ButtonTopBar" class="secondary-action-button">Cancel</button>
                    ${isCustomItem ? `<button type="button" id="delete${itemType}ButtonTopBar" class="delete-button">Delete</button>` : ''}
                    <button type="submit" id="submit${itemType}ButtonTopBar" class="primary-action-button">Save</button>
                  </div>
                `;
                
                // Attach event handlers for the top bar buttons
                this._attachTopBarFormActionHandlers(itemType.toLowerCase());
              }
            }
            }
            if (this.ui.profileTopBar) {
              const shouldShow = isProfileScreen && this.currentMainView === this.CONSTANTS.VIEWS.CHARACTER_PROFILE;
              // console.log('[DEBUG] Character Profile Top Bar shouldShow:', shouldShow, 'isProfileScreen:', isProfileScreen, 'currentMainView:', this.currentMainView, 'CHARACTER_PROFILE:', this.CONSTANTS.VIEWS.CHARACTER_PROFILE);
              this.ui.profileTopBar.classList.toggle('is-active', shouldShow);
              // CRITICAL: Remove .hidden class when showing, add when hiding
              if (shouldShow) {
                this.ui.profileTopBar.classList.remove('hidden');
              } else {
                this.ui.profileTopBar.classList.add('hidden');
              }
                          // console.log('[DEBUG] Character Profile Top Bar active:', shouldShow, 'currentMainView:', this.currentMainView);
            // console.log('[DEBUG] Character Profile Top Bar classList:', Array.from(this.ui.profileTopBar.classList));
            // console.log('[DEBUG] Character Profile Top Bar computed display:', window.getComputedStyle(this.ui.profileTopBar).display);
            }
            if (this.ui.worldProfileTopBar) {
              const shouldShow = isProfileScreen && this.currentMainView === this.CONSTANTS.VIEWS.WORLD_PROFILE;
              // console.log('[DEBUG] World Profile Top Bar shouldShow:', shouldShow, 'isProfileScreen:', isProfileScreen, 'currentMainView:', this.currentMainView, 'WORLD_PROFILE:', this.CONSTANTS.VIEWS.WORLD_PROFILE);
              this.ui.worldProfileTopBar.classList.toggle('is-active', shouldShow);
              // CRITICAL: Remove .hidden class when showing, add when hiding
              if (shouldShow) {
                this.ui.worldProfileTopBar.classList.remove('hidden');
              } else {
                this.ui.worldProfileTopBar.classList.add('hidden');
              }
                          // console.log('[DEBUG] World Profile Top Bar active:', shouldShow, 'currentMainView:', this.currentMainView);
            // console.log('[DEBUG] World Profile Top Bar classList:', Array.from(this.ui.worldProfileTopBar.classList));
            // console.log('[DEBUG] World Profile Top Bar computed display:', window.getComputedStyle(this.ui.worldProfileTopBar).display);
            }
            if (this.ui.storyProfileTopBar) {
              const shouldShow = isProfileScreen && this.currentMainView === this.CONSTANTS.VIEWS.STORY_PROFILE;
              // console.log('[DEBUG] Story Profile Top Bar shouldShow:', shouldShow, 'isProfileScreen:', isProfileScreen, 'currentMainView:', this.currentMainView, 'STORY_PROFILE:', this.CONSTANTS.VIEWS.STORY_PROFILE);
              this.ui.storyProfileTopBar.classList.toggle('is-active', shouldShow);
              // CRITICAL: Remove .hidden class when showing, add when hiding
              if (shouldShow) {
                this.ui.storyProfileTopBar.classList.remove('hidden');
              } else {
                this.ui.storyProfileTopBar.classList.add('hidden');
              }
                          // console.log('[DEBUG] Story Profile Top Bar active:', shouldShow, 'currentMainView:', this.currentMainView);
            // console.log('[DEBUG] Story Profile Top Bar classList:', Array.from(this.ui.storyProfileTopBar.classList));
            // console.log('[DEBUG] Story Profile Top Bar computed display:', window.getComputedStyle(this.ui.storyProfileTopBar).display);
            }
  
            // Update profile top bar content if visible
            if (this.ui.profileTopBar && this.currentMainView === this.CONSTANTS.VIEWS.CHARACTER_PROFILE) {
              this._updateProfileTopBarUI(this.ui.profileTopBar, this.currentProfileViewItemId, 'character');
            } else if (this.ui.worldProfileTopBar && this.currentMainView === this.CONSTANTS.VIEWS.WORLD_PROFILE) {
              this._updateProfileTopBarUI(this.ui.worldProfileTopBar, this.currentProfileViewItemId, 'world');
            } else if (this.ui.storyProfileTopBar && this.currentMainView === this.CONSTANTS.VIEWS.STORY_PROFILE) {
              // For story profile, use currentStoryId and 'story' type
              this._updateProfileTopBarUI(this.ui.storyProfileTopBar, this.currentStoryId, 'story');
            }
  
        },
  
      async _updateProfileTopBarUI(topBarElement, itemId, itemType) {
        // console.log('[DEBUG] _updateProfileTopBarUI called for', itemType, 'with itemId', itemId);
        if (!topBarElement || !itemId) return;
  
        let item;
        let config;
        
        if (itemType === 'story') {
          item = await this._getitemData(itemId, 'stories');
          // Create a dummy config for story to get title text
          config = { capital: 'Story' };
        } else {
          config = this.CONSTANTS.ITEM_CONFIG[itemType];
          item = await this._getitemData(itemId, config.dbTableKey, config.getPremadesFn);
        }
  
        if (!item) {
          console.warn('Item not found for profile top bar update:', itemId, itemType);
          return;
        }
  
        // Update the main title of the profile top bar
        const titleArea = topBarElement.querySelector('.top-bar-center');
        if (titleArea) {
          titleArea.innerHTML = `<h2 class="profile-top-bar-title">${item.name || `${config.capital} Profile`}</h2>`;
          // console.log('[DEBUG] Profile Top Bar Title set to:', item.name || `${config.capital} Profile`);
        }

        // Show/hide shuffle and begin story buttons based on whether item is premade
        const isPremade = typeof itemId === 'string' && itemId.startsWith('premade_');
        const shuffleButton = topBarElement.querySelector(`#${itemType}-profile-shuffle-button`);
        const beginStoryButton = topBarElement.querySelector(`#${itemType}-profile-begin-story-button`);
        
        if (shuffleButton) {
          shuffleButton.style.display = isPremade ? 'inline-block' : 'none';
        }
        if (beginStoryButton) {
          beginStoryButton.style.display = isPremade ? 'inline-block' : 'none';
        }
  
        // Update user character info (always present if a user character is selected)
        const userCharInfo = topBarElement.querySelector('.top-bar-user-character-info');
        const userCharPic = topBarElement.querySelector('.top-bar-user-character-pic');
        const userCharNameText = topBarElement.querySelector('.top-bar-user-character-name-text');
        
        if (userCharInfo && userCharPic && userCharNameText && this.currentUserCharacterId) {
          const userChar = await this._getitemData(this.currentUserCharacterId, 'characters', this.getPremadeCharacterItems);
          if (userChar) {
            userCharPic.innerHTML = this._generateProfilePictureHtml(userChar, 'top-bar-user-character-pic');
            userCharNameText.textContent = userChar.name || 'Unnamed Character';
            userCharInfo.classList.remove('hidden');
          } else {
            userCharInfo.classList.add('hidden');
          }
        } else if (userCharInfo) {
          userCharInfo.classList.add('hidden');
        }
  
        // Update AI character info (always present if an AI character is selected)
        const aiCharInfo = topBarElement.querySelector('.top-bar-ai-character-info');
        const aiCharPic = topBarElement.querySelector('.top-bar-ai-character-pic');
        const aiCharNameText = topBarElement.querySelector('.top-bar-ai-character-name-text');
  
        if (aiCharInfo && aiCharPic && aiCharNameText && this.activeStoryId) {
          const activeStory = await this._getitemData(this.activeStoryId, 'stories');
          if (activeStory && activeStory.aiCharacterId) {
            const aiChar = await this._getitemData(activeStory.aiCharacterId, 'characters', this.getPremadeCharacterItems);
            if (aiChar) {
              aiCharPic.innerHTML = this._generateProfilePictureHtml(aiChar, 'top-bar-ai-character-pic');
              aiCharNameText.textContent = aiChar.name || 'Unnamed AI';
              aiCharInfo.classList.remove('hidden');
            } else {
              aiCharInfo.classList.add('hidden');
            }
          } else {
            aiCharInfo.classList.add('hidden');
          }
        } else if (aiCharInfo) {
          aiCharInfo.classList.add('hidden');
        }
  
        // Wire up tab buttons for the profile top bars
        const profileTabButtons = topBarElement.querySelectorAll('button[data-tab]');
        profileTabButtons.forEach(button => {
          const tabName = button.dataset.tab;
          button.onclick = (e) => {
            e.preventDefault();
            this.selectTopBarTab(tabName);
          };
          // Set aria-selected based on current mode
          if (tabName === this.focusBarState.mode) {
            button.setAttribute('aria-selected', 'true');
            button.tabIndex = 0;
          } else {
            button.setAttribute('aria-selected', 'false');
            button.tabIndex = -1;
          }
        });
  
        // Wire up edit and back buttons on profile top bars
        const editButton = topBarElement.querySelector('#profile-edit-button') || topBarElement.querySelector('#world-profile-edit-button') || topBarElement.querySelector('#story-profile-edit-button');
        if (editButton) {
          // Determine if this is a premade item and set appropriate text
          const isPremade = item.isPremade || false;
          editButton.textContent = isPremade ? 'Copy & Customize' : 'Edit';
          
          editButton.onclick = () => {
            if (itemType === 'character') {
              this.switchToScreen(this.CONSTANTS.VIEWS.CHARACTER_FORM, { itemId, isCreating: false });
            } else if (itemType === 'world') {
              this.switchToScreen(this.CONSTANTS.VIEWS.WORLD_FORM, { itemId, isCreating: false });
            } else if (itemType === 'story') {
              // For stories, we might want to open the story in edit mode
              this.switchToScreen(this.CONSTANTS.VIEWS.STORYBOARD);
            }
          };
        }
        
        const backButton = topBarElement.querySelector('#profile-back-button') || topBarElement.querySelector('#world-profile-back-button') || topBarElement.querySelector('#story-profile-back-button');
        if (backButton) {
          // Set contextual button text based on navigation destination
          if (this.activeStoryId) {
            backButton.textContent = 'Back to Story';
          } else {
            backButton.textContent = 'Back to Storyboard';
          }
          
          backButton.onclick = () => {
            // Smart back navigation logic
            if (this.activeStoryId) {
              // If there's an active story, go back to the story/chat
              this.openStory(this.activeStoryId);
            } else {
              // If no active story, go back to storyboard
              this.switchToScreen(this.CONSTANTS.VIEWS.STORYBOARD);
            }
          };
        }
      },
  
      /**
       * Initializes the application, setting up the database and initial UI state.
       * This is the main entry point for the app after dependencies are loaded.
       */
      init() {
          // Set window.dbName if not already set by Perchance
          window.dbName = window.dbName || 'rpglitch-db';
          console.log("[App Init] App.init() called. Database name:", window.dbName);
    
          // Only initialize UI elements after DOMContentLoaded
          if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', () => {
                  this._getUIElements();
                  if (!this.ui.topBarRight) {
                      console.warn('[DEBUG] topBarRight still not found after DOMContentLoaded!');
                  }
                  this.initialLoad();
                  // Only setup hover for the main top bar initially, profile top bars are handled dynamically
                  if (this.ui.topBar) {
                    this._setupTopBarHover(this.ui.topBar);
                  }
                  this.updateTopBarUI();
              }, { once: true });
              return;
          } else {
              this._getUIElements();
              if (!this.ui.topBarRight) {
                  console.warn('[DEBUG] topBarRight still not found after DOMContentLoaded!');
              }
              this.initialLoad();
              // Only setup hover for the main top bar initially, profile top bars are handled dynamically
              if (this.ui.topBar) {
                this._setupTopBarHover(this.ui.topBar);
              }
              this.updateTopBarUI();
          }
          // Wire up Options Chin buttons
          const downloadBtn = document.getElementById('download-backup-button');
          if (downloadBtn) downloadBtn.onclick = () => this.exportAllData();
          const uploadBtn = document.getElementById('upload-backup-button');
          if (uploadBtn) {
              // Create a hidden file input for upload
              let fileInput = document.getElementById('backup-upload-input');
              if (!fileInput) {
                  fileInput = document.createElement('input');
                  fileInput.type = 'file';
                  fileInput.accept = '.json,application/json';
                  fileInput.style.display = 'none';
                  fileInput.id = 'backup-upload-input';
                  document.body.appendChild(fileInput);
              }
              uploadBtn.onclick = () => fileInput.click();
              fileInput.onchange = (e) => this.importAllData(e);
          }
          const startFreshBtn = document.getElementById('start-fresh-button');
          if (startFreshBtn) startFreshBtn.onclick = () => this.deleteAllData();
          // Wire up Shuffle and Begin Story buttons if present
          const shuffleBtn = document.getElementById('shuffle-button');
          if (shuffleBtn) shuffleBtn.onclick = async () => {
              await this._shuffleStoryboard();
              this._updateStoryboard(); // Explicitly re-render storyboard after shuffle
          };
          const beginStoryBtn = document.getElementById('begin-story-button');
          if (beginStoryBtn) beginStoryBtn.onclick = () => this.beginStory();
          
          // Wire up profile shuffle and begin story buttons
          const profileShuffleBtn = document.getElementById('profile-shuffle-button');
          if (profileShuffleBtn) profileShuffleBtn.onclick = () => this._shuffleStoryboard();
          
          const profileBeginStoryBtn = document.getElementById('profile-begin-story-button');
          if (profileBeginStoryBtn) profileBeginStoryBtn.onclick = () => this.beginStory();
          
          const worldProfileShuffleBtn = document.getElementById('world-profile-shuffle-button');
          if (worldProfileShuffleBtn) worldProfileShuffleBtn.onclick = () => this._shuffleStoryboard();
          
          const worldProfileBeginStoryBtn = document.getElementById('world-profile-begin-story-button');
          if (worldProfileBeginStoryBtn) worldProfileBeginStoryBtn.onclick = () => this.beginStory();
          
          const storyProfileShuffleBtn = document.getElementById('story-profile-shuffle-button');
          if (storyProfileShuffleBtn) storyProfileShuffleBtn.onclick = () => this._shuffleStoryboard();
          
          const storyProfileBeginStoryBtn = document.getElementById('story-profile-begin-story-button');
          if (storyProfileBeginStoryBtn) storyProfileBeginStoryBtn.onclick = () => this.beginStory();
          
          // Wire up search functionality with real-time updates
          this._setupSearchHandlers();
  
          // Wire up chin button handlers for create/edit/copy functionality
          this._setupChinButtonHandlers();
  
          // Initialize mouseover animation states
          this.updateMouseoverAnimationState();
      },
      _setupTopBarHover(topBarElement) {
          if (topBarElement) {
              topBarElement.addEventListener('mouseenter', () => {
                  topBarElement.classList.add('top-bar-interactive-hover');
              });
              topBarElement.addEventListener('mouseleave', () => {
                  // Only remove hover class if no chin is open
                  // This prevents visual flicker when navigating between tabs with chins
                  if (!this.focusBarState.chinOpen) {
                      topBarElement.classList.remove('top-bar-interactive-hover');
                  }
              });
          }
      },
      // --- BEGIN: Add missing UI methods for Perchance tab switching ---
      selectTopBarTab(tabName) {
        // Determine which top bar is active
        let activeTopBar = null;
        if (this.currentMainView === this.CONSTANTS.VIEWS.CHARACTER_PROFILE && this.ui.profileTopBar) {
          activeTopBar = this.ui.profileTopBar;
        } else if (this.currentMainView === this.CONSTANTS.VIEWS.WORLD_PROFILE && this.ui.worldProfileTopBar) {
          activeTopBar = this.ui.worldProfileTopBar;
        } else if (this.currentMainView === this.CONSTANTS.VIEWS.STORY_PROFILE && this.ui.storyProfileTopBar) {
          activeTopBar = this.ui.storyProfileTopBar;
        } else if (this.ui.topBar) {
          activeTopBar = this.ui.topBar;
        }
  
        if (!activeTopBar) {
          console.warn('[DEBUG] No active top bar found in selectTopBarTab, re-initializing UI elements.');
          this._getUIElements();
          // Try to re-determine activeTopBar after re-initialization
          if (this.currentMainView === this.CONSTANTS.VIEWS.CHARACTER_PROFILE && this.ui.profileTopBar) {
            activeTopBar = this.ui.profileTopBar;
          } else if (this.currentMainView === this.CONSTANTS.VIEWS.WORLD_PROFILE && this.ui.worldProfileTopBar) {
            activeTopBar = this.ui.worldProfileTopBar;
          } else if (this.currentMainView === this.CONSTANTS.VIEWS.STORY_PROFILE && this.ui.storyProfileTopBar) {
            activeTopBar = this.ui.storyProfileTopBar;
          } else if (this.ui.topBar) {
            activeTopBar = this.ui.topBar;
          }
          if (!activeTopBar) return; // If still no activeTopBar, something is critically wrong
        }
        
        // Check if we're switching to a different tab while a chin is open
        const currentMode = this.focusBarState.mode;
        const isChinOpen = this.focusBarState.chinOpen;
        const isSwitchingTabs = currentMode !== tabName;
        
        if (isSwitchingTabs && isChinOpen) {
          // Smooth transition: close current chin first, then open new one
          this.focusBarState.chinOpen = false;
          this.updateTopBarUI();
          
          // Update aria-selected immediately for visual feedback on the active top bar
          const tabButtons = activeTopBar.querySelectorAll('button[data-tab]');
          tabButtons.forEach(btn => {
            btn.setAttribute('aria-selected', btn.getAttribute('data-tab') === tabName ? 'true' : 'false');
          });
          
          // Open new chin after a brief delay for smooth transition
          setTimeout(() => {
            this.focusBarState.mode = tabName;
            this.focusBarState.chinOpen = true;
            this.updateTopBarUI();
          }, 150); // 150ms delay for smooth transition
        } else {
          // Direct switch (no chin open or same tab)
          this.focusBarState.mode = tabName;
          this.focusBarState.chinOpen = true;
          this.updateTopBarUI();
          // Update aria-selected for all tab buttons on the active top bar
          const tabButtons = activeTopBar.querySelectorAll('button[data-tab]');
          tabButtons.forEach(btn => {
            btn.setAttribute('aria-selected', btn.getAttribute('data-tab') === tabName ? 'true' : 'false');
          });
        }
      },
      toggleOptionsChin() {
        // Determine which top bar is active
        let activeTopBar = null;
        if (this.currentMainView === this.CONSTANTS.VIEWS.CHARACTER_PROFILE && this.ui.profileTopBar) {
          activeTopBar = this.ui.profileTopBar;
        } else if (this.currentMainView === this.CONSTANTS.VIEWS.WORLD_PROFILE && this.ui.worldProfileTopBar) {
          activeTopBar = this.ui.worldProfileTopBar;
        } else if (this.currentMainView === this.CONSTANTS.VIEWS.STORY_PROFILE && this.ui.storyProfileTopBar) {
          activeTopBar = this.ui.storyProfileTopBar;
        } else if (this.ui.topBar) {
          activeTopBar = this.ui.topBar;
        }
  
        if (!activeTopBar) {
          console.warn('[DEBUG] No active top bar found in toggleOptionsChin, re-initializing UI elements.');
          this._getUIElements();
          // Try to re-determine activeTopBar after re-initialization
          if (this.currentMainView === this.CONSTANTS.VIEWS.CHARACTER_PROFILE && this.ui.profileTopBar) {
            activeTopBar = this.ui.profileTopBar;
          } else if (this.currentMainView === this.CONSTANTS.VIEWS.WORLD_PROFILE && this.ui.worldProfileTopBar) {
            activeTopBar = this.ui.worldProfileTopBar;
          } else if (this.currentMainView === this.CONSTANTS.VIEWS.STORY_PROFILE && this.ui.storyProfileTopBar) {
            activeTopBar = this.ui.storyProfileTopBar;
          } else if (this.ui.topBar) {
            activeTopBar = this.ui.topBar;
          }
          if (!activeTopBar) return; // If still no activeTopBar, something is critically wrong
        }
  
        // Always switch to options and open chin (no toggle since outside click closes it)
        this.focusBarState.mode = 'options';
        this.focusBarState.chinOpen = true;
        this.updateTopBarUI();
        // Update aria-selected for all tab buttons on the active top bar
        const tabButtons = activeTopBar.querySelectorAll('button[data-tab]');
        tabButtons.forEach(btn => {
          btn.setAttribute('aria-selected', btn.getAttribute('data-tab') === 'options' ? 'true' : 'false');
        });
      },
      // --- END: Add missing UI methods ---
      
      /**
       * Sets up button handlers for chin create/edit/copy functionality
       */
      _setupChinButtonHandlers() {
          // Wire up character workshop buttons
          const createCharacterBtn = document.getElementById('create-character-button');
          if (createCharacterBtn) {
              createCharacterBtn.onclick = () => this.switchToScreen(this.CONSTANTS.VIEWS.CHARACTER_FORM, { isCreating: true });
          }
  
          const createWorldBtn = document.getElementById('create-world-button');
          if (createWorldBtn) {
              createWorldBtn.onclick = () => this.switchToScreen(this.CONSTANTS.VIEWS.WORLD_FORM, { isCreating: true });
          }
  
          // Wire up storyboard buttons
          const newStoryBtn = document.getElementById('new-story-button');
          if (newStoryBtn) {
              newStoryBtn.onclick = () => this.switchToScreen(this.CONSTANTS.VIEWS.STORYBOARD);
          }
  
          // Wire up profile edit buttons (these are handled dynamically in profile screens)
          // The edit/copy buttons are set up in _updateProfileTopBarUI method
      },
  
      /**
       * Sets up search handlers for all chin search inputs with real-time updates
       */
      _setupSearchHandlers() {
          // Debounced search function to prevent excessive API calls
          const debouncedSearch = (func, delay) => {
              let timeoutId;
              return (...args) => {
                  clearTimeout(timeoutId);
                  timeoutId = setTimeout(() => func.apply(this, args), delay);
              };
          };
  
          // Stories search
          const searchStoriesInput = document.getElementById('search-stories-input');
          const searchStoriesForm = searchStoriesInput?.closest('form');
          
          if (searchStoriesInput) {
              // Real-time search as user types
              const debouncedStorySearch = debouncedSearch((searchTerm) => {
                  const listEl = document.getElementById('chin-story-list');
                  if (listEl) this._populateStoryList(listEl, searchTerm);
              }, 300); // 300ms delay
              
              searchStoriesInput.addEventListener('input', (e) => {
                  debouncedStorySearch(e.target.value);
              });
              
              // Form submit handler (for search button or Enter key)
              if (searchStoriesForm) {
                  searchStoriesForm.addEventListener('submit', (e) => {
                      e.preventDefault();
                      const searchTerm = searchStoriesInput.value;
                      const listEl = document.getElementById('chin-story-list');
                      if (listEl) this._populateStoryList(listEl, searchTerm);
                  });
              }
          }
  
          // Characters search
          const searchCharactersInput = document.getElementById('search-characters-input');
          const searchCharactersForm = searchCharactersInput?.closest('form');
          
          if (searchCharactersInput) {
              // Real-time search as user types
              const debouncedCharacterSearch = debouncedSearch((searchTerm) => {
                  const listEl = document.getElementById('chin-character-list');
                  if (listEl) this._populateList(listEl, searchTerm, this.CONSTANTS.ITEM_CONFIG.character);
              }, 300); // 300ms delay
              
              searchCharactersInput.addEventListener('input', (e) => {
                  debouncedCharacterSearch(e.target.value);
              });
              
              // Form submit handler (for search button or Enter key)
              if (searchCharactersForm) {
                  searchCharactersForm.addEventListener('submit', (e) => {
                      e.preventDefault();
                      const searchTerm = searchCharactersInput.value;
                      const listEl = document.getElementById('chin-character-list');
                      if (listEl) this._populateList(listEl, searchTerm, this.CONSTANTS.ITEM_CONFIG.character);
                  });
              }
          }
  
          // Worlds search
          const searchWorldsInput = document.getElementById('search-worlds-input');
          const searchWorldsForm = searchWorldsInput?.closest('form');
          
          if (searchWorldsInput) {
              // Real-time search as user types
              const debouncedWorldSearch = debouncedSearch((searchTerm) => {
                  const listEl = document.getElementById('chin-world-list');
                  if (listEl) this._populateList(listEl, searchTerm, this.CONSTANTS.ITEM_CONFIG.world);
              }, 300); // 300ms delay
              
              searchWorldsInput.addEventListener('input', (e) => {
                  debouncedWorldSearch(e.target.value);
              });
              
              // Form submit handler (for search button or Enter key)
              if (searchWorldsForm) {
                  searchWorldsForm.addEventListener('submit', (e) => {
                      e.preventDefault();
                      const searchTerm = searchWorldsInput.value;
                      const listEl = document.getElementById('chin-world-list');
                      if (listEl) this._populateList(listEl, searchTerm, this.CONSTANTS.ITEM_CONFIG.world);
                  });
              }
          }
      },
    };
    
    // Global access for debugging/plugins if needed
    window.App = App;
    
    // Auto-initialize when DOM is ready and dependencies are loaded
    document.addEventListener('DOMContentLoaded', function() {
      if (!document.getElementById('top-bar-right')) {
        console.warn('[DEBUG] top-bar-right not found at DOMContentLoaded!');
      }
      // Start dependency checking process
      waitForDependencies();
    });
  
    // Add after updateTopBarUI definition
  
    // Helper to handle click outside chin overlays
    App._handleChinOutsideClick = function(event) {
      const chins = document.querySelectorAll('.top-bar-chin:not(.hidden)');
      let clickedInsideChin = false;
      chins.forEach(chin => {
        if (chin.contains(event.target)) clickedInsideChin = true;
      });
      if (!clickedInsideChin) {
        // Briefly disable the active tab button for visual feedback
        const activeTabButton = document.querySelector('.top-bar-nav [data-tab][aria-selected="true"]');
        if (activeTabButton) {
          activeTabButton.disabled = true;
          activeTabButton.style.opacity = '0.5';
          activeTabButton.style.pointerEvents = 'none';
          
          // Re-enable after 100ms
          setTimeout(() => {
            activeTabButton.disabled = false;
            activeTabButton.style.opacity = '';
            activeTabButton.style.pointerEvents = '';
          }, 100);
        }
        
        App.focusBarState.chinOpen = false;
        App.updateTopBarUI();
        document.removeEventListener('mousedown', App._handleChinOutsideClick);
      }
    };
  
    // Patch updateTopBarUI to add/remove outside click listener
    const _origUpdateTopBarUI = App.updateTopBarUI;
    App.updateTopBarUI = function() {
      _origUpdateTopBarUI.apply(this, arguments);
      const anyChinOpen = this.focusBarState.chinOpen && ['storyboard-chin','character-workshop-chin','world-builder-chin','options-chin'].some(id => {
        const el = document.getElementById(id);
        return el && !el.classList.contains('hidden');
      });
      if (anyChinOpen) {
        document.addEventListener('mousedown', App._handleChinOutsideClick);
      } else {
        document.removeEventListener('mousedown', App._handleChinOutsideClick);
      }
    };
  
    // Utility to get a valid palette key from an item
    function getValidPaletteKey(item) {
      return (item && typeof item.colorPalette === 'string' && item.colorPalette in App.CONSTANTS.COLOR_PALETTES)
        ? item.colorPalette
        : 'slate_gray';
    }
  