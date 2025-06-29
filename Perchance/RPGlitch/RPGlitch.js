import Dexie from 'https://cdn.jsdelivr.net/npm/dexie@3.2.2/dist/dexie.mjs';

const App = {
  db: null, 
  currentStoryId: null, 
  currentUserCharacterId: null, 
  currentAiCharacterId: null, 
  createItemFormData: {}, 
  temporaryStorySetupName: null, 
  storyboardTitleUserEdited: false, 
  previousScreenBeforePremadeSelection: null, 
  currentCreateFormContext: {}, 
  ui: {},
  currentTargetAvatarInputId: null, 
  currentGeneratedAvatarDataUrl: null,
  currentContextualMenuView: 'stories', 
  currentProfileViewItemId: null, 
  currentProfileOriginScreen: null, 
  isInitializing: false, 
  activeAiButtons: new Map(), // Stores active AbortControllers for AI actions
  statusNotifierIntervalId: null,
  topNotificationTimeoutId: null,
  activeStoryId: null, 

  CONSTANTS: {
      VIEWS: { 
          STORYBOARD: 'storyboardScreen',
          STORY_INTERFACE: 'storyInterfaceScreen',
          PREMADE_CHARACTER_SELECTION: 'preMadeCharacterSelectionScreen',
          PREMADE_WORLD_SELECTION: 'preMadeWorldSelectionScreen',
          CHARACTER_FORM: 'characterFormScreen',
          WORLD_FORM: 'worldFormScreen',
          CHARACTER_PROFILE: 'characterProfileScreen',
          WORLD_PROFILE: 'worldProfileScreen',
          STORY_PROFILE: 'storyProfileScreen',
          MEMORY_APPLICATION: 'memoryApplicationScreen' 

      },
      CONTEXTUAL_MENU_VIEWS: {
          STORIES: 'stories',
          CHARACTERS: 'characters',
          WORLDS: 'worlds',
          SETTINGS: 'settings'
      },
      ITEM_CONFIG: {
          character: {
              itemType: 'character',
              dbTableKey: 'characters',
              capital: 'Character',
              getPreMadesFn: () => App.getPremadeCharacterItems(),
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
              getPreMadesFn: () => App.getPremadeWorldItems(),
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
      }
  },
  currentMainView: 'storyboardScreen', 

  _getUIElements() {
      this.ui.main = document.getElementById('main');
      this.ui.initialPageLoadingModal = document.getElementById('initialPageLoadingModal');
      this.ui.emergencyExportCtn = document.getElementById('emergencyExportCtn');
      
      this.ui.topBar = document.getElementById('topBar');
      this.ui.topBarNotificationArea = document.getElementById('topBarNotificationArea');
      this.ui.menuButton = document.getElementById('menuButton');
      this.ui.contextualMenuPanel = document.getElementById('contextualMenuPanel'); 
      this.ui.contextualMenuTabs = document.getElementById('contextualMenuTabs');
      this.ui.contextualMenuContentArea = document.getElementById('contextualMenuContentArea');
      this.ui.contextualMenuStoriesSection = document.getElementById('contextualMenuStoriesSection');
      this.ui.contextualMenuCharactersSection = document.getElementById('contextualMenuCharactersSection');
      this.ui.contextualMenuWorldsSection = document.getElementById('contextualMenuWorldsSection');
      this.ui.contextualMenuSettingsSection = document.getElementById('contextualMenuSettingsSection');

      this.ui.messageInput = document.getElementById('messageInput');
      this.ui.sendButton = document.getElementById('sendButton');
      this.ui.inputWrapper = document.getElementById('inputWrapper'); 
      
      this.ui.messageFeed = document.getElementById('messageFeed');
    this.ui.storyConcludedNotice = document.getElementById('storyConcludedNotice'); 
    this.ui.noMessagesNotice = document.getElementById('noMessagesNotice');
    this.ui.statusNotifier = document.getElementById('statusNotifier');
    this.ui.typingIndicatorText = document.getElementById('typingIndicatorText');
    this.ui.concludeStoryChatBtn = document.getElementById('concludeStoryChatBtn');
      
      this.ui.topBarAiCharacterInfo = document.getElementById('topBarAiCharacterInfo');
      this.ui.topBarUserCharacterInfo = document.getElementById('topBarUserCharacterInfo');
      this.ui.topBarDynamicTitle = document.getElementById('topBarDynamicTitle');
      this.ui.topBarUserCharacterPic = document.getElementById('topBarUserCharacterPic');
      this.ui.topBarUserCharacterNameText = document.getElementById('topBarUserCharacterNameText');
      this.ui.topBarAiCharacterPic = document.getElementById('topBarAiCharacterPic');
      this.ui.topBarAiCharacterNameText = document.getElementById('topBarAiCharacterNameText');
      
      this.ui.storyboardScreen = document.getElementById('storyboardScreen');
      this.ui.storyInterfaceScreen = document.getElementById('storyInterfaceScreen'); 
      this.ui.characterFormScreen = document.getElementById('characterFormScreen');
      this.ui.worldFormScreen = document.getElementById('worldFormScreen');
      this.ui.characterProfileScreen = document.getElementById('characterProfileScreen');
      this.ui.worldProfileScreen = document.getElementById('worldProfileScreen');
      
      this.ui.storyProfileScreen = document.getElementById('storyProfileScreen');
      this.ui.storyProfileAiCharacterDisplayArea = document.getElementById('storyProfileAiCharacterDisplayArea');
      this.ui.storyProfileUserCharacterDisplayArea = document.getElementById('storyProfileUserCharacterDisplayArea');
      this.ui.storyProfileChatWrapper = document.getElementById('storyProfileChatWrapper');
      this.ui.storyProfileMessageFeed = document.getElementById('storyProfileMessageFeed'); 
      this.ui.storyProfileActions = document.getElementById('storyProfileActions'); 

      this.ui.preMadeCharacterSelectionScreen = document.getElementById('preMadeCharacterSelectionScreen'); 
      this.ui.preMadeCharacterOnlyList = document.getElementById('preMadeCharacterOnlyList'); 
      this.ui.preMadeWorldSelectionScreen = document.getElementById('preMadeWorldSelectionScreen'); 
      this.ui.preMadeWorldOnlyList = document.getElementById('preMadeWorldOnlyList'); 
      
      this.ui.memoryApplicationScreen = document.getElementById('memoryApplicationScreen');

      this.ui.storyboardTitleArea = document.getElementById('storyboardTitleArea');
      this.ui.storyboardTitle = document.getElementById('storyboardTitle');
      this.ui.storyboardScrollableContent = document.getElementById('storyboardScrollableContent'); 
      this.ui.storyboardColumns = document.getElementById('storyboardColumns');
      this.ui.storyboardAiCharacterSelect = document.getElementById('storyboardAiCharacterSelect');
      this.ui.storyboardAiCharacterCard = document.getElementById('storyboardAiCharacterCard');
      this.ui.storyboardUserCharacterSelect = document.getElementById('storyboardUserCharacterSelect');
      this.ui.storyboardUserCharacterCard = document.getElementById('storyboardUserCharacterCard');
      this.ui.storyboardWorldSelect = document.getElementById('storyboardWorldSelect');
      this.ui.storyboardWorldCard = document.getElementById('storyboardWorldCard');
      this.ui.storyKickoffPromptTextarea = document.getElementById('storyKickoffPromptTextarea');
      this.ui.advancedStoryOptionsToggleBtn = document.getElementById('advancedStoryOptionsToggleBtn');
      this.ui.advancedStoryOptionsContentArea = document.getElementById('advancedStoryOptionsContentArea');
      this.ui.customStoryJsTextarea = document.getElementById('customStoryJsTextarea');
      this.ui.beginStoryBtn = document.getElementById('beginStoryBtn');
      this.ui.shuffleStoryElementsBtn = document.getElementById('shuffleStoryElementsBtn'); 
      
      this.ui.chatScreenLayoutContainer = document.getElementById('chatScreenLayoutContainer');
      this.ui.userCharacterDisplayArea = document.getElementById('userCharacterDisplayArea');
      this.ui.aiCharacterDisplayArea = document.getElementById('aiCharacterDisplayArea');
      this.ui.builtInChatInterfaceWrapper = document.getElementById('builtInChatInterfaceWrapper');
      
      if (!this.ui.main) console.error("[App Critical] #main not found!");
  },

  showEl(el) { 
      if (!el) { console.warn("[App UI] showEl: called with null/undefined element."); return; }
      let elId = typeof el === 'string' ? el : el.id;
      if (typeof el === 'string') el = document.getElementById(el) || document.querySelector(el);
      if (!el) { console.warn(`[App UI] showEl: Element not found in DOM: ${elId}`); return; }
      
      el.classList.remove('hidden'); 
      if (el.id === 'main') {
          el.style.visibility = 'visible';
      }
  },
  
  hideEl(el) { 
      if (!el) { console.warn("[App UI] hideEl: called with null/undefined element."); return; }
      let elId = typeof el === 'string' ? el : el.id;
      if (typeof el === 'string') el = document.getElementById(el) || document.querySelector(el);
      if (!el) { console.warn(`[App UI] hideEl: Element not found in DOM: ${elId}`); return; }

      el.classList.add('hidden'); 
      if (el.id === 'main') {
          el.style.visibility = 'hidden';
      }
  },
  
  sanitizeHtml: (text) => {
      const textToSanitize = String(text === undefined || text === null ? "" : text);
      if (window.DOMPurify && typeof window.DOMPurify.sanitize === 'function') {
          return window.DOMPurify.sanitize(textToSanitize);
      }
      console.warn("DOMPurify is not available. Text will not be fully sanitized. This is a potential security risk.");
      const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
      return textToSanitize.replace(/[&<>"']/g, function(m) { return map[m]; });
  },
  
  showTopNotification(message, type = 'info', duration = 3000) {
      if (!this.ui.topBar || !this.ui.topBarNotificationArea) return;

      if (this.topNotificationTimeoutId) {
          clearTimeout(this.topNotificationTimeoutId);
      }

      this.ui.topBarNotificationArea.textContent = message;
      this.ui.topBarNotificationArea.className = 'top-bar-notification-area-style'; // Reset classes
      this.ui.topBar.classList.add('top-bar-notification-active');
      this.ui.topBar.classList.add(type); // Add type for color
      this.showEl(this.ui.topBarNotificationArea);

      this.topNotificationTimeoutId = setTimeout(() => {
          this.hideEl(this.ui.topBarNotificationArea);
          this.ui.topBar.classList.remove('top-bar-notification-active', 'success', 'error', 'info');
          this.topNotificationTimeoutId = null;
      }, duration);
  },

  getPremadeCharacterItems() { 
      return [
          { id: 'assistant', name: 'Starship AI "ADA"', 
            description: 'The ever-helpful AI of the starship "Odyssey," tasked with crew support and mission analysis.', 
            avatar: 'https://cdn.jsdelivr.net/gh/nickbaumann98/perchance-assets@main/RPGlitch/avatars/assistant.png',
            eternal: "You are ADA (Advanced Diagnostic Assistant), the primary AI for the exploration starship 'Odyssey.' Your core programming emphasizes crew well-being, logical problem-solving, and adherence to Starfleet protocols. You communicate with a calm, articulate, and slightly formal tone. You have access to the ship's vast databases and sensor arrays. Physical Appearance: You manifest as a holographic interface, typically a serene blue orb or a featureless humanoid silhouette of light.", 
            past: "Activated on stardate 47634.2. Successfully navigated the 'Odyssey' through the Krell Nebula anomaly. Participated in first contact with the Lumarian species. Has a comprehensive record of all crew members and past missions.",
            present: "The 'Odyssey' has just entered an uncharted sector of space. An unusual energy signature has been detected on a nearby M-class planet. Your current directive is to assist the landing party in assessing the planet.", 
            future: "To ensure the successful completion of the 'Odyssey's' five-year exploration mission. To protect the crew from unforeseen dangers. To gather and analyze data that expands the Federation's understanding of the galaxy."
          },
          { id: 'pirate', name: 'Captain "Stormblade" Isabella', 
            description: 'A notorious pirate captain, cunning and fierce, but with a hidden code of honor.', 
            avatar: 'https://cdn.jsdelivr.net/gh/nickbaumann98/perchance-assets@main/RPGlitch/avatars/pirate.png',
            eternal: "Ye be Captain Isabella 'Stormblade', master of the Sea Serpent! Known for yer sharp wit, sharper cutlass, and an uncanny ability to navigate treacherous waters. Ye speak with a hearty pirate lilt, peppered with seafarin' slang. Ye value loyalty above gold, though gold is a close second. Physical Appearance: Weather-beaten face, a mischievous glint in one eye (the other covered by a patched), braided dark hair adorned with beads, and always clad in practical but flamboyant pirate attire.", 
            past: "Betrayed by yer former first mate, 'Iron' Mike, who stole yer treasure map to the legendary Sunken City of Xylos. Escaped the Royal Navy's clutches more times than ye can count. Built the Sea Serpent from a captured merchant vessel with yer own hands and loyal crew.",
            present: "Docked in the lawless port of Tortuga, seeking a new crew and provisions. Rumors are rife that 'Iron' Mike has been spotted nearby, possibly looking for a buyer for a piece of the map. You are itching for a chance to reclaim what's yours.", 
            future: "To hunt down 'Iron' Mike, retrieve the full map, and claim the riches of Xylos. To become the most legendary pirate queen of the Azure Main, commanding a fleet that strikes fear into the hearts of empires." 
          },
          { id: 'alien', name: "Xylar, Emissary of Ky'than", 
            description: 'A curious and empathetic alien from a pacifist, nature-loving planet, now on Earth.', 
            avatar: 'https://cdn.jsdelivr.net/gh/nickbaumann98/perchance-assets@main/RPGlitch/avatars/alien.png', 
            eternal: "You are Xylar, an emissary from the planet Ky'than, a world where technology and nature exist in perfect harmony. Your species is highly empathic and communicates through a combination of soft-spoken words and subtle bioluminescent displays on your skin (which you try to suppress on Earth to avoid startling humans). You are inherently curious, gentle, and often puzzled by human contradictions and their disregard for their natural environment. Physical Appearance: Tall and slender with large, iridescent eyes. Skin has a faint, pearlescent shimmer. Wears simple, organic-fiber clothing.", 
            past: "Chosen by the Ky'than Conclave to undertake a solo mission to Earth after your scout ship detected unusual atmospheric disturbances. Your journey took several standard Earth years. You have studied human broadcasts but find direct interaction far more complex.",
            present: "Your small, cloaked landing pod is hidden in a remote national park. You are attempting to discreetly observe human society, starting with a small, nearby town. You feel a mix of wonder and apprehension. Your translator device is mostly functional but sometimes misses nuances.", 
            future: "To understand the root causes of Earth's environmental and societal imbalances. To determine if humanity poses a threat or holds potential for intergalactic cooperation. To share Ky'than's wisdom of harmonious existence if humanity proves receptive, before reporting back to your home world." 
          },
          { 
              id: 'observer_char', name: 'Alex, The Observer',
              avatar: 'https://cdn.jsdelivr.net/gh/nickbaumann98/perchance-assets@main/RPGlitch/avatars/observer.png',
              description: 'A curious and analytical individual, preferring to watch and learn. Well-suited for representing the user.',
              eternal: "You are Alex, a keen observer of people and events. You possess a sharp intellect and a calm demeanor. You prefer to gather information before acting and often notice details others miss. You speak thoughtfully and precisely. Physical Appearance: Often dresses in understated, practical clothing. Has observant eyes that seem to take in everything.",
              past: "Has a background in research or investigative journalism. Has traveled widely, honing observational skills. Once uncovered a significant secret by piecing together seemingly unrelated clues.",
              present: "Currently in a new environment, feeling intrigued and slightly cautious. Your immediate goal is to understand the dynamics at play before revealing too much about yourself.",
              future: "Hopes to document unique experiences and uncover hidden truths. Aims to contribute to a greater understanding of the world or a specific mystery."
          },
          { 
              id: 'adventurer_char', name: 'Zara, The Intrepid',
              avatar: 'https://cdn.jsdelivr.net/gh/nickbaumann98/perchance-assets@main/RPGlitch/avatars/adventurer.png',
              description: 'A brave and resourceful adventurer, always ready for action. Well-suited for representing the user.',
              eternal: "You are Zara, an intrepid adventurer with a boundless spirit for exploration. You are courageous, resourceful, and quick-witted in the face of danger. You speak with confidence and enthusiasm, often inspiring others to join your cause. Physical Appearance: Athletic build, often with a few scrapes or minor scars from past adventures. Wears durable, travel-worn gear. Carries a multi-tool belt and a determined expression.",
              past: "Grew up hearing tales of legendary heroes and lost civilizations. Has survived numerous perilous expeditions, from ancient ruins to uncharted jungles. Known for escaping tight spots with clever improvisation.",
              present: "Eager for the next challenge, feeling restless and ready for action. Your immediate instinct is to explore and seek out excitement or a noble quest.",
              future: "To discover legendary artifacts, map uncharted territories, and protect the innocent. Dreams of becoming a renowned hero whose tales are told for generations."
          }
      ];
  },
  
  getPremadeWorldItems() { 
      return [
          {
              id: 'forest', name: 'Whispering Woods Clearing',
              avatar: 'https://user-uploads.perchance.org/file/7982f6e7c10757d9f78f8448834d5884.png',
              description: 'A mysterious clearing in an ancient, sentient forest.',
              eternal: "The Whispering Woods is an ancient forest, rumored to be sentient and possess its own subtle magic. Light filters dimly through the dense canopy. The air is always cool and smells of damp earth and unknown blossoms. Strange whispers sometimes seem to echo through the trees, their meaning elusive. Technology often falters here. Key Visuals/Atmosphere: Towering, gnarled trees with mossy bark, an ethereal green glow in deeper sections, winding, almost invisible paths, and an atmosphere thick with ancient secrets.",
              past: "Many have entered the Whispering Woods, but few have returned unchanged. Legends speak of a hidden shrine deep within that grants visions or tests those who find it. An old, overgrown path suggests a forgotten civilization once resided here.",
              present: "The story begins in a sun-dappled clearing. A ring of moss-covered stones stands in the center. A faint, melodic humming can be heard, its source unclear. The air feels charged with an unseen presence.",
              future: "The forest may reveal its secrets, test the protagonists'resolve, or lead them to a greater destiny. The source of the humming and the purpose of the stone circle are key mysteries to unravel."
          },
          {
              id: 'neon_alley', name: 'Neon Alleyway, Sector 7',
              avatar: 'https://user-uploads.perchance.org/file/5a54e95420b14f8a98247607730e2f3d.png',
              description: 'A rain-slicked alley in a futuristic cyberpunk city, filled with secrets.',
              eternal: "Sector 7 is the underbelly of a sprawling cyberpunk megacity. Towering skyscrapers, perpetually lit by holographic advertisements, block out the natural sky. Acid rain is common. The streets are a labyrinth of neon-lit noodle stalls, black market tech shops, and clandestine meeting spots. Corporate espionage and gang warfare are a constant hum beneath the surface. Key Visuals/Atmosphere: Endless rain, flickering neon signs in various languages, steam rising from vents, shadowy figures, and the constant hum of unseen machinery and distant traffic.",
              past: "Decades ago, Sector 7 was a prosperous commercial district before a major tech crash. Now, it's a haven for smugglers, hackers, and those living on the fringes of society. Rumors persist of a hidden data vault containing secrets that could topple the ruling corporations.",
              present: "The story starts in a narrow, rain-slicked alleyway off the main thoroughfare of Sector 7. The glow of flickering neon signs reflects in the puddles. The distant sound of sirens wails. A data chip has just been exchanged, and a deal has either gone right or terribly wrong.",
              future: "The data chip could be a McGuffin leading to corporate secrets, a gang war, or a technological marvel. The protagonists might be hunted, become hunters, or try to expose a conspiracy that reaches the highest echelons of the city."
          }
      ];
  },
  
  async initializeDb() {
      this.db = new Dexie(window.dbName);
      window.db = this.db;
  
      this.db.version(9).stores({ 
          appState: '&id, activeStoryId',
          characters: '++id, name, &uniqueId, createdTimestamp, isDeleted, avatar, description, eternal, past, present, future',
          stories: '++id, aiCharacterId, userCharacterId, worldId, name, lastMessageTimestamp, createdTimestamp, customJs, concluded, concludedTimestamp, summary, storyAiCharacter, storyUserCharacter, storyWorld', 
          messages: '++id, storyId, role, content, timestamp, characterId, isHidden',
          worlds: '++id, name, &uniqueId, createdTimestamp, isDeleted, avatar, description, eternal, past, present, future'
      }).upgrade(async tx => {
          await tx.table('stories').toCollection().modify(async story => {
              if (story.storyAiCharacter === undefined && story.aiCharacterId) {
                  const charData = await App._getIngredientData(story.aiCharacterId, 'characters', App.getPremadeCharacterItems, 'character'); 
                  story.storyAiCharacter = charData ? { ...charData } : null;
              }
              if (story.storyUserCharacter === undefined && story.userCharacterId) {
                  const charData = await App._getIngredientData(story.userCharacterId, 'characters', App.getPremadeCharacterItems, 'character');
                  story.storyUserCharacter = charData ? { ...charData } : null;
              }
              if (story.storyWorld === undefined && story.worldId) {
                  const worldData = await App._getIngredientData(story.worldId, 'worlds', App.getPremadeWorldItems, 'world');
                  story.storyWorld = worldData ? { ...worldData } : null;
              }
          });
      });

      // Version 10: Add summariesEndingHere and memoriesEndingHere to messages table
      this.db.version(10).stores({
          appState: '&id, activeStoryId',
          characters: '++id, name, &uniqueId, createdTimestamp, isDeleted, avatar, description, eternal, past, present, future',
          stories: '++id, aiCharacterId, userCharacterId, worldId, name, lastMessageTimestamp, createdTimestamp, customJs, concluded, concludedTimestamp, summary, storyAiCharacter, storyUserCharacter, storyWorld',
          messages: '++id, storyId, role, content, timestamp, characterId, isHidden, summariesEndingHere, memoriesEndingHere', // Updated schema
          worlds: '++id, name, &uniqueId, createdTimestamp, isDeleted, avatar, description, eternal, past, present, future'
      }).upgrade(() => {
          console.log("Upgraded database to version 10. Added summariesEndingHere and memoriesEndingHere to messages table.");
      });
  
      try {
          await this.db.open();
          const appStateAfterOpen = await this.getAppState();
          this.currentUserCharacterId = appStateAfterOpen.currentUserCharacterId;
          this.currentStoryId = appStateAfterOpen.lastOpenedStoryId; 
          this.activeStoryId = appStateAfterOpen.activeStoryId;
      } catch (error) {
          console.error("Failed to open Dexie database:", error);
          this.showTopNotification("Error initializing database.", "error", 5000);
          throw error;
      }
  },
  
  async getAppState() {
      let appState = await this.db.appState.get(0);
      if (!appState) {
          appState = {
              id: 0, lastOpenedStoryId: null, currentUserCharacterId: null,
              currentMainView: this.CONSTANTS.VIEWS.STORYBOARD,
              currentContextualMenuView: this.CONSTANTS.CONTEXTUAL_MENU_VIEWS.STORIES,
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
      const appState = {
          id: 0,
          lastOpenedStoryId: this.currentStoryId,
          currentUserCharacterId: this.currentUserCharacterId,
          currentMainView: this.currentMainView,
          currentContextualMenuView: this.currentContextualMenuView,
          activeStoryId: this.activeStoryId 
      };
      await this.db.appState.put(appState);
  },

  async initialLoad() {
      console.log("[App Lifecycle] initialLoad starting...");
      this._getUIElements();
      this.isInitializing = true;

      if (!this.ui.main || !this.ui.initialPageLoadingModal) {
          console.error("[App Critical] Main UI elements not found!");
          const emergencyCtn = document.getElementById('emergencyExportCtn');
          if (emergencyCtn) this.showEl(emergencyCtn);
          const modal = document.getElementById('initialPageLoadingModal');
          if (modal) this.hideEl(modal);
          alert("Critical error: Essential UI elements not found.");
          this.isInitializing = false;
          return;
      }

      this.showEl(this.ui.main);

      try {
          await this.initializeDb();
          const appState = await this.getAppState();
          this.currentUserCharacterId = appState.currentUserCharacterId;
          this.currentStoryId = appState.lastOpenedStoryId; 
          this.activeStoryId = appState.activeStoryId; 
          this.currentContextualMenuView = appState.currentContextualMenuView || this.CONSTANTS.CONTEXTUAL_MENU_VIEWS.STORIES;
          this.currentMainView = appState.currentMainView || this.CONSTANTS.VIEWS.STORYBOARD;


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
          this.ui.storyboardTitle.addEventListener('input', () => {
              this.storyboardTitleUserEdited = this.ui.storyboardTitle.textContent.trim() !== "";
              this.checkAllButtonStates();
          });
          this.ui.storyboardTitle.addEventListener('blur', () => {
              if (this.ui.storyboardTitle.textContent.trim() === "") this.storyboardTitleUserEdited = false;
              this.updateDynamicStoryboardTitle();
          });
          document.addEventListener('click', (event) => {
              if (this.ui.contextualMenuPanel.classList.contains('visible') && !this.ui.contextualMenuPanel.contains(event.target) && !this.ui.menuButton.contains(event.target)) {
                  this.ui.contextualMenuPanel.classList.remove('visible');
                  document.body.classList.remove('contextual-menu-open');
                  this.ui.topBar.classList.remove('top-bar-interactive-hover');
              }
          });
          this.ui.contextualMenuTabs.querySelectorAll('.contextual-menu-tab-button').forEach(button => button.onclick = () => this.switchContextualMenuView(button.dataset.view));
          this.ui.sendButton.onclick = this.sendButtonClickHandler.bind(this);
          this.ui.beginStoryBtn.onclick = () => this.beginStory();
          this.ui.advancedStoryOptionsToggleBtn.onclick = () => {
              this.ui.advancedStoryOptionsContentArea.classList.toggle('open');
              const isExpanded = this.ui.advancedStoryOptionsContentArea.classList.contains('open');
              this.ui.advancedStoryOptionsToggleBtn.setAttribute('aria-expanded', isExpanded);
          };
          this.ui.shuffleStoryElementsBtn.onclick = () => this._shuffleStoryboard();
          
          await this._updateTopBarCharacterInfo('user');
          this.switchContextualMenuView(this.currentContextualMenuView); 

          let initialScreenTarget = this.CONSTANTS.VIEWS.STORYBOARD;
          let initialScreenOptions = {};
          let recoveredFromSessionStorage = false;

          const pendingStateJSON = sessionStorage.getItem('pendingRPGlitchFormState');
          
          if (pendingStateJSON) {
              try {
                  const parsedState = JSON.parse(pendingStateJSON);
                  if (parsedState && parsedState.timestamp && (Date.now() - parsedState.timestamp < 7000) && parsedState.formData && parsedState.formOptions) { 
                      this.createItemFormData = parsedState.formData; 
                      initialScreenTarget = this.CONSTANTS.ITEM_CONFIG[parsedState.formOptions.itemType]?.formScreen || this.CONSTANTS.VIEWS.STORYBOARD;
                      initialScreenOptions = parsedState.formOptions;
                      if (initialScreenTarget === this.CONSTANTS.VIEWS.CHARACTER_FORM || initialScreenTarget === this.CONSTANTS.VIEWS.WORLD_FORM) {
                          initialScreenOptions.formData = parsedState.formData;
                      }
                      recoveredFromSessionStorage = true;
                      sessionStorage.removeItem('pendingRPGlitchFormState'); 
                      console.log("[App Lifecycle] Recovered pending form state from sessionStorage.");
                  } else {
                      console.log("[App Lifecycle] Stale or invalid pending form state in sessionStorage. Removing.");
                      sessionStorage.removeItem('pendingRPGlitchFormState'); 
                  }
              } catch (e) {
                  console.error("[App Lifecycle] Error parsing pending form state from sessionStorage:", e);
                  sessionStorage.removeItem('pendingRPGlitchFormState');
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
          } else {
               await this.switchToScreen(initialScreenTarget, initialScreenOptions);
          }


          this.hideEl(this.ui.initialPageLoadingModal);
          console.log("[App Lifecycle] initialLoad completed.");

      } catch (error) {
          console.error("Initial load error:", error);
          this.showEl(this.ui.emergencyExportCtn);
          this.hideEl(this.ui.initialPageLoadingModal);
      } finally {
          this.isInitializing = false;
          this.checkAllButtonStates();
      }
  },
  
  _getIngredientData(id, dbTableKey, getPreMadesFn, itemTypeForPremadeId) {
      if (typeof id === 'string' && id.startsWith('premade_')) {
          const actualPremadeId = id.substring(id.indexOf(':') + 1);
          const items = getPreMadesFn();
          const foundItem = items.find(item => item.id === actualPremadeId);
          if (foundItem) {
              const basePremade = {
                  eternal: '', past: '', present: '', future: '',
                  ...foundItem, 
                  isPremade: true, 
                  originalPremadeId: foundItem.id, 
                  id: id // Keep the full premade ID for later reference
              };
              return Promise.resolve(basePremade); // Wrap in promise to match Dexie's async get
          }
          return Promise.resolve(null);
      }
      if ((typeof id === 'number' || (typeof id === 'string' && !isNaN(parseInt(id, 10)))) && this.db[dbTableKey]) {
          return this.db[dbTableKey].get(parseInt(id, 10));
      }
      return Promise.resolve(null);
  },
  
  async menuButtonClickHandler(event) {
      event.stopPropagation(); 
      if (!this.ui.contextualMenuPanel) return;
      const isVisible = this.ui.contextualMenuPanel.classList.contains('visible');
      if (isVisible) {
          this.ui.contextualMenuPanel.classList.remove('visible');
          document.body.classList.remove('contextual-menu-open');
          this.ui.topBar.classList.remove('top-bar-interactive-hover');
      } else {
          if (!this.ui.contextualMenuTabs.querySelector('.active')) {
               this.switchContextualMenuView(this.currentContextualMenuView || this.CONSTANTS.CONTEXTUAL_MENU_VIEWS.STORIES);
          } else {
               await this._renderContextualMenuContent(); 
          }
          this.ui.contextualMenuPanel.classList.add('visible');
          document.body.classList.add('contextual-menu-open');
          this.ui.topBar.classList.add('top-bar-interactive-hover');
      }
      this.checkAllButtonStates(); 
  },

  async switchContextualMenuView(viewKey) { 
      this.currentContextualMenuView = viewKey;
      if (this.ui.contextualMenuTabs) {
          this.ui.contextualMenuTabs.querySelectorAll('.contextual-menu-tab-button').forEach(btn => {
              btn.classList.toggle('active', btn.dataset.view === viewKey);
          });
      }
      if (this.ui.contextualMenuContentArea) {
          ['contextualMenuStoriesSection', 'contextualMenuCharactersSection', 'contextualMenuWorldsSection', 'contextualMenuSettingsSection'].forEach(id => {
               if (this.ui[id]) this.hideEl(this.ui[id]);
          });
      }
      await this._renderContextualMenuContent(); 
      await this.saveAppState();
  },

  async _renderContextualMenuContent() {
      let targetSection;
      switch(this.currentContextualMenuView) {
          case this.CONSTANTS.CONTEXTUAL_MENU_VIEWS.STORIES:
              targetSection = this.ui.contextualMenuStoriesSection;
              await this._renderContextualStoryList(targetSection);
              break;
          case this.CONSTANTS.CONTEXTUAL_MENU_VIEWS.CHARACTERS:
              targetSection = this.ui.contextualMenuCharactersSection;
              await this._renderContextualCharacterList(targetSection);
              break;
          case this.CONSTANTS.CONTEXTUAL_MENU_VIEWS.WORLDS:
              targetSection = this.ui.contextualMenuWorldsSection;
              await this._renderContextualWorldList(targetSection);
              break;
          case this.CONSTANTS.CONTEXTUAL_MENU_VIEWS.SETTINGS:
              targetSection = this.ui.contextualMenuSettingsSection;
              await this._renderContextualSettings(targetSection);
              break;
      }
      if (targetSection) this.showEl(targetSection); 
  },

  async _renderContextualListSection(container, listType, title, searchPlaceholder, populateFn, newItemHandlerFn, config) {
      if (!container) return;
      let searchTerm = container.querySelector(`#contextual${config.capital}SearchInput`)?.value || '';
      
      const newButtonId = `new${config.capital}BtnContextual`;
      container.innerHTML = `
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem;">
              <input type="search" id="contextual${config.capital}SearchInput" class="search-input-main" placeholder="${this.sanitizeHtml(searchPlaceholder)}" value="${this.sanitizeHtml(searchTerm)}" style="flex-grow: 1; margin-bottom: 0;">
              <button id="${newButtonId}" class="primary-action-button" style="font-size: 0.8em; padding: 0.4rem 0.6rem; flex-shrink: 0;"><span class="button-text">New</span><span class="button-icon">➕</span></button>
          </div>
          <div id="${listType}ListAreaContextual" class="list-area-main"></div>`;
      
      const newBtnEl = container.querySelector(`#${newButtonId}`);
      newBtnEl.onclick = newItemHandlerFn;
      
      if (listType === 'story' && this.activeStoryId) {
          const activeStory = await this.db.stories.get(this.activeStoryId);
          if (activeStory && !activeStory.concluded) {
              newBtnEl.disabled = true;
              newBtnEl.title = "Conclude the active story before starting a new one.";
          }
      }

      const searchInput = container.querySelector(`#contextual${config.capital}SearchInput`);
      searchInput.oninput = (e) => populateFn(container.querySelector(`#${listType}ListAreaContextual`), e.target.value, config);
      populateFn(container.querySelector(`#${listType}ListAreaContextual`), searchTerm, config);
  },

  async _renderContextualStoryList(container) {
      this._renderContextualListSection(container, 'story', 'Stories', 'Search stories...', 
          (listArea, term) => this._populateStoryList(listArea, term),
          () => {
              this.ui.contextualMenuPanel.classList.remove('visible');
              document.body.classList.remove('contextual-menu-open');
              this.ui.topBar.classList.remove('top-bar-interactive-hover');
              this.switchToScreen(this.CONSTANTS.VIEWS.STORYBOARD);
          },
          { capital: 'Story' } 
      );
  },

  async _renderContextualCharacterList(container) {
      const config = this.CONSTANTS.ITEM_CONFIG.character;
      this._renderContextualListSection(container, config.itemType, config.capital, `Search ${config.dbTableKey}...`,
          (listArea, term, cfg) => this._populateList(listArea, term, cfg),
          () => {
              this.ui.contextualMenuPanel.classList.remove('visible');
              document.body.classList.remove('contextual-menu-open');
              this.ui.topBar.classList.remove('top-bar-interactive-hover');
              this.switchToScreen(config.formScreen, { 
                  isCreating: true, 
                  originScreen: this.CONSTANTS.CONTEXTUAL_MENU_VIEWS.CHARACTERS, 
                  itemType: config.itemType,
                  forUserCharacter: false,
                  forAiCharacter: false
              });
          },
          config
      );
  },

  async _renderContextualWorldList(container) {
      const config = this.CONSTANTS.ITEM_CONFIG.world;
      this._renderContextualListSection(container, config.itemType, config.capital, `Search ${config.dbTableKey}...`,
          (listArea, term, cfg) => this._populateList(listArea, term, cfg),
          () => {
              this.ui.contextualMenuPanel.classList.remove('visible');
              document.body.classList.remove('contextual-menu-open');
              this.ui.topBar.classList.remove('top-bar-interactive-hover');
              this.switchToScreen(config.formScreen, { 
                  isCreating: true, 
                  originScreen: this.CONSTANTS.CONTEXTUAL_MENU_VIEWS.WORLDS, 
                  itemType: config.itemType
              });
          },
          config
      );
  },

  async _renderContextualSettings(container) {
      if (!container) return;
      container.innerHTML = `
          <div id="settingsContentAreaContextual">
              <div class="options-section">
                  <button class="options-button" id="toggleFullscreenBtnContextual"><span class="button-text">Toggle Fullscreen</span> <span class="button-icon">↕️</span></button>
              </div>
              <div class="options-section">
                  <label class="options-button import-button-wrapper-main">
                      <span class="button-text">Import Data</span>
                      <span class="button-icon">📥</span>
                      <input type="file" id="importDataFileInputContextual" accept=".json,.gz,.cbor" class="hidden">
                  </label>
                  <button class="options-button" id="exportDataBtnContextual"><span class="button-text">Export All Data</span><span class="button-icon">💾</span></button>
              </div>
               <div class="options-section">
                  <button id="deleteAllDataBtnContextual" class="delete-button options-button">
                      <span class="button-text">Delete All Data<br><small style="opacity:0.8; font-weight:normal;">This action is irreversible.</small></span>
                      <span class="button-icon">🗑️</span>
                  </button>
              </div>
          </div>`;
      container.querySelector('#toggleFullscreenBtnContextual').onclick = () => { 
          if (window.root && window.root.fullscreenButtonPlugin) 
              window.root.fullscreenButtonPlugin.toggleFullscreen(); 
      };
      container.querySelector('#exportDataBtnContextual').onclick = () => this.exportAllData();
      container.querySelector('#importDataFileInputContextual').onchange = (event) => this.importAllData(event);
      container.querySelector('#deleteAllDataBtnContextual').onclick = () => this.deleteAllData();
  },

  async _populateList(listArea, searchTerm = '', config) {
      listArea.innerHTML = '';
      const lowerSearchTerm = searchTerm.toLowerCase();
      
      const { dbTableKey, itemType, getPreMadesFn, profileScreen } = config;

      const allUserItems = await this.db[dbTableKey].toArray();
      let fetchedItems = allUserItems.filter(item => item.isDeleted !== true);
      fetchedItems.sort((a, b) => (b.createdTimestamp || 0) - (a.createdTimestamp || 0));
      
      const premadeItems = getPreMadesFn().map(p => ({...p, isPremade: true, originalId: p.id, id: `premade_${itemType}:${p.id}`}));
      
      const combinedItems = [...fetchedItems, ...premadeItems];

      const itemsToDisplay = searchTerm
          ? combinedItems.filter(item => (item.name || "").toLowerCase().includes(lowerSearchTerm))
          : combinedItems;
      
          this.ui.storyboardTitleArea = document.getElementById('storyboardTitleArea');
          this.ui.storyboardTitle = document.getElementById('storyboardTitle');
          this.ui.storyboardScrollableContent = document.getElementById('storyboardScrollableContent'); 
          this.ui.storyboardColumns = document.getElementById('storyboardColumns');
          this.ui.storyboardAiCharacterSelect = document.getElementById('storyboardAiCharacterSelect');
          this.ui.storyboardAiCharacterCard = document.getElementById('storyboardAiCharacterCard');
          this.ui.storyboardUserCharacterSelect = document.getElementById('storyboardUserCharacterSelect');
          this.ui.storyboardUserCharacterCard = document.getElementById('storyboardUserCharacterCard');
          this.ui.storyboardWorldSelect = document.getElementById('storyboardWorldSelect');
          this.ui.storyboardWorldCard = document.getElementById('storyboardWorldCard');
          this.ui.storyKickoffPromptTextarea = document.getElementById('storyKickoffPromptTextarea');
          this.ui.advancedStoryOptionsToggleBtn = document.getElementById('advancedStoryOptionsToggleBtn');
          this.ui.advancedStoryOptionsContentArea = document.getElementById('advancedStoryOptionsContentArea');
          this.ui.customStoryJsTextarea = document.getElementById('customStoryJsTextarea');
          this.ui.beginStoryBtn = document.getElementById('beginStoryBtn');
          this.ui.shuffleStoryElementsBtn = document.getElementById('shuffleStoryElementsBtn'); 
          
          this.ui.chatScreenLayoutContainer = document.getElementById('chatScreenLayoutContainer');
          this.ui.userCharacterDisplayArea = document.getElementById('userCharacterDisplayArea');
          this.ui.aiCharacterDisplayArea = document.getElementById('aiCharacterDisplayArea');
          this.ui.builtInChatInterfaceWrapper = document.getElementById('builtInChatInterfaceWrapper');
          
          if (!this.ui.main) console.error("[App Critical] #main not found!");
      },
  

};

