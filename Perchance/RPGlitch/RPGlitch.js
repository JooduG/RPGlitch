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
          
          if (itemsToDisplay.length === 0) { 
              listArea.innerHTML = `<p class="p-4 opacity-70 text-sm text-center">${searchTerm ? 'No matches.' : `No ${dbTableKey} yet.`}</p>`; 
              return; 
          }
          
          itemsToDisplay.forEach(item => {
              const itemEl = document.createElement('div'); 
              itemEl.className = 'list-item-main';
              const avatarHtml = item.avatar ? `<img src="${this.sanitizeHtml(item.avatar)}" alt="" class="avatar-main avatar">` : `<div class="avatar-main avatar"></div>`;
              itemEl.innerHTML = `
                  ${avatarHtml}
                  <div class="item-details-main">
                      <span class="name-main" title="${this.sanitizeHtml(item.name || `Unnamed ${config.capital}`)}">${this.sanitizeHtml(item.name || `Unnamed ${config.capital}`)}</span>
                      ${item.isPremade ? '<span class="premade-tag">(Premade)</span>' : ''}
                  </div>`;
              
              itemEl.onclick = (e) => {
                  this.ui.contextualMenuPanel.classList.remove('visible'); 
                  document.body.classList.remove('contextual-menu-open');
                  this.ui.topBar.classList.remove('top-bar-interactive-hover');
                  this.switchToScreen(profileScreen, { itemId: item.id, itemType, originScreen: this.currentContextualMenuView });
              };
              listArea.appendChild(itemEl);
          });
      },
  
      async _populateStoryList(listArea, searchTerm = '') {
          listArea.innerHTML = '';
          let allStories = await this.db.stories.toArray();
          let fetchedStories = allStories.filter(item => item.isDeleted !== true);
          fetchedStories.sort((a, b) => (b.lastMessageTimestamp || b.createdTimestamp || 0) - (a.lastMessageTimestamp || a.createdTimestamp || 0));
          const lowerSearchTerm = searchTerm.toLowerCase();
          let storiesToDisplay;
      
          const nameCache = { characters: new Map(), worlds: new Map() };
          const getName = async (id, type) => {
              if (!id) return `Unknown ${type.charAt(0).toUpperCase() + type.slice(1)}`;
              if (nameCache[type + 's'].has(id)) return nameCache[type + 's'].get(id);
      
              const item = await this._getIngredientData(id, type + 's', type === 'character' ? this.getPremadeCharacterItems : this.getPremadeWorldItems, type);
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
              listArea.innerHTML = `<p class="p-4 opacity-70 text-sm text-center">${searchTerm ? 'No matches.' : 'No recent stories.'}</p>`;
              return;
          }
      
          for (const story of storiesToDisplay) {
              const aiCharacter = story.storyAiCharacter || await this._getIngredientData(story.aiCharacterId, 'characters', this.getPremadeCharacterItems, 'character');
              const userCharacter = story.storyUserCharacter || await this._getIngredientData(story.userCharacterId, 'characters', this.getPremadeCharacterItems, 'character');
              const world = story.storyWorld || await this._getIngredientData(story.worldId, 'worlds', this.getPremadeWorldItems, 'world');
              const displayName = story.name || `${aiCharacter?.name || 'AI'} & ${userCharacter?.name || 'User'} in ${world?.name || 'World'}`;
              
              let metaText;
              if (story.concluded && story.concludedTimestamp) {
                  metaText = `Concluded: ${new Date(story.concludedTimestamp).toLocaleString()}`;
              } else {
                  metaText = `Last played: ${new Date(story.lastMessageTimestamp || story.createdTimestamp).toLocaleString()}`;
              }
  
              const itemEl = document.createElement('div');
              itemEl.className = 'list-item-main story-item';
              if (this.currentStoryId === story.id && this.currentMainView === this.CONSTANTS.VIEWS.STORY_INTERFACE) {
                  itemEl.classList.add('active');
              }
              if (story.concluded) {
                  itemEl.classList.add('concluded-story-item');
              }
      
              itemEl.innerHTML = `
                  <div class="item-details-main" style="flex-direction: column; align-items: flex-start;">
                      <span class="name-main" title="${this.sanitizeHtml(displayName)}">
                          ${this.sanitizeHtml(displayName)}
                          ${story.concluded ? '<span class="concluded-story-indicator">🏁</span>' : ''}
                      </span>
                      <p class="story-meta">${this.sanitizeHtml(metaText)}</p>
                  </div>`;
      
              itemEl.onclick = (e) => {
                  this.ui.contextualMenuPanel.classList.remove('visible');
                  document.body.classList.remove('contextual-menu-open');
                  this.ui.topBar.classList.remove('top-bar-interactive-hover');
                  this.switchToScreen(this.CONSTANTS.VIEWS.STORY_PROFILE, { storyId: story.id, originScreen: this.CONSTANTS.CONTEXTUAL_MENU_VIEWS.STORIES });
              };
              listArea.appendChild(itemEl);
          }
      },
  
      async renderStoryProfileScreen(storyId) {
          const container = this.ui.storyProfileScreen; 
          if (!container || !storyId) {
              this.showTopNotification("Error: Story ID missing for profile view.", "error");
              this.switchToScreen(this.CONSTANTS.VIEWS.STORYBOARD);
              return;
          }
      
          const story = await this.db.stories.get(storyId);
          if (!story) {
              this.ui.storyProfileMessageFeed.innerHTML = `<p class="p-4 text-center">Story not found.</p>`;
              this.ui.storyProfileActions.innerHTML = ''; 
              this.ui.storyProfileAiCharacterDisplayArea.style.backgroundImage = '';
              this.ui.storyProfileUserCharacterDisplayArea.style.backgroundImage = '';
              this.ui.topBarDynamicTitle.textContent = `Story Profile`;
              return;
          }
      
          this.currentStoryId = storyId; 
      
          const aiChar = story.storyAiCharacter || await this._getIngredientData(story.aiCharacterId, 'characters', this.getPremadeCharacterItems, 'character') || {};
          const userChar = story.storyUserCharacter || await this._getIngredientData(story.userCharacterId, 'characters', this.getPremadeCharacterItems, 'character') || {};
          const world = story.storyWorld || await this._getIngredientData(story.worldId, 'worlds', this.getPremadeWorldItems, 'world') || {};
      
          this.ui.topBarDynamicTitle.textContent = story.name || `${aiChar?.name || 'AI'} & ${userChar?.name || 'User'}`;
          
          if (this.activeStoryId && this.activeStoryId !== storyId) {
              const activeStoryData = await this.db.stories.get(this.activeStoryId);
              if (activeStoryData) {
                  await this._updateTopBarCharacterInfo('ai', activeStoryData.storyAiCharacter || await this._getIngredientData(activeStoryData.aiCharacterId, 'characters', this.getPremadeCharacterItems, 'character'));
                  await this._updateTopBarCharacterInfo('user', activeStoryData.storyUserCharacter || await this._getIngredientData(activeStoryData.userCharacterId, 'characters', this.getPremadeCharacterItems, 'character'));
              }
          } else if (this.activeStoryId === storyId) { 
               await this._updateTopBarCharacterInfo('ai', aiChar);
               await this._updateTopBarCharacterInfo('user', userChar);
          } else { 
              this.hideEl(this.ui.topBarAiCharacterInfo);
              this.hideEl(this.ui.topBarUserCharacterInfo);
          }
  
      
          this.ui.storyProfileAiCharacterDisplayArea.style.backgroundImage = aiChar.avatar ? `url('${this.sanitizeHtml(aiChar.avatar)}')` : '';
          this.ui.storyProfileUserCharacterDisplayArea.style.backgroundImage = userChar.avatar ? `url('${this.sanitizeHtml(userChar.avatar)}')` : '';
          this.ui.storyProfileAiCharacterDisplayArea.classList.toggle('visible', !!aiChar.avatar);
          this.ui.storyProfileUserCharacterDisplayArea.classList.toggle('visible', !!userChar.avatar);
      
          this.ui.storyProfileMessageFeed.innerHTML = '';
      
          const messages = await this.db.messages.where({ storyId: story.id }).sortBy('timestamp');
          if (messages.length === 0 && !story.concluded) { 
              this.ui.storyProfileMessageFeed.insertAdjacentHTML('beforeend', `<div class="noMessagesNotice p-4 opacity-70 text-sm text-center">No messages in this story yet.</div>`);
          } else {
              messages.forEach(msg => {
                  if (msg.isHidden) return;
                  this._addMessageToFeed(msg, true);
              });
          }
          
          if (story.concluded && story.summary && !messages.some(m => m.content === story.summary && m.role === 'narrator')) {
               this._addMessageToFeed({ role: 'narrator', content: story.summary }, true);
          }
      
          const san = this.sanitizeHtml;
          const conclusionHtml = `
              <div class="story-conclusion-block">
                  <h2 class="story-profile-embedded-title">${san(story.name || `Untitled Story`)}</h2>
                  <div class="story-profile-embedded-ingredients">
                      <div class="story-profile-ingredient-card" data-item-id="${aiChar.id || story.aiCharacterId}" data-item-type="character">
                          <img src="${san(aiChar?.avatar || '')}" alt="${san(aiChar?.name || 'AI Character')}" class="story-profile-ingredient-avatar">
                          <span class="story-profile-ingredient-name">${san(aiChar?.name || 'AI Character')}</span>
                          <span class="story-profile-ingredient-role">(AI Character)</span>
                      </div>
                      <div class="story-profile-ingredient-card" data-item-id="${userChar.id || story.userCharacterId}" data-item-type="character">
                          <img src="${san(userChar?.avatar || '')}" alt="${san(userChar?.name || 'User Character')}" class="story-profile-ingredient-avatar">
                          <span class="story-profile-ingredient-name">${san(userChar?.name || 'User Character')}</span>
                          <span class="story-profile-ingredient-role">(Your Character)</span>
                      </div>
                      <div class="story-profile-ingredient-card" data-item-id="${world.id || story.worldId}" data-item-type="world">
                          <img src="${san(world?.avatar || '')}" alt="${san(world?.name || 'World')}" class="story-profile-ingredient-avatar">
                          <span class="story-profile-ingredient-name">${san(world?.name || 'World')}</span>
                          <span class="story-profile-ingredient-role">(World)</span>
                      </div>
                  </div>
                  ${story.concluded && story.concludedTimestamp ? 
                      `<div class="message systemMessage" style="margin: 1rem auto; text-align: center;"><div class="messageWrap"><div class="messageContentContainer"><div class="messageText">This story concluded on ${new Date(story.concludedTimestamp).toLocaleString()}</div></div></div></div>` 
                      : ''
                  }
              </div>`;
      
          this.ui.storyProfileMessageFeed.insertAdjacentHTML('beforeend', conclusionHtml);
          this.ui.storyProfileMessageFeed.scrollTop = this.ui.storyProfileMessageFeed.scrollHeight; 
          
          let actionButtonsHtml = `
              <button id="storyProfileBackBtn" class="secondary-action-button"><span class="button-icon">⬅️</span><span class="button-text">Back</span></button>
              <div class="ml-auto flex gap-2">
                  <button id="deleteStoryBtn" class="delete-button"><span class="button-text">Delete Story</span><span class="button-icon">🗑️</span></button>
          `;
          if (!story.concluded) {
              actionButtonsHtml += `
                  <button id="concludeStoryBtnStoryProfile" class="danger-button">
                      <span class="button-text">Conclude Story</span>
                      <span class="button-icon">✅</span>
                  </button>
                  <button id="openStoryChatBtnStoryProfile" class="primary-action-button">
                      <span class="button-text">Resume Chat</span><span class="button-icon">💬</span>
                  </button>
              `;
          }
          actionButtonsHtml += `</div>`;
          this.ui.storyProfileActions.innerHTML = actionButtonsHtml;
      
          this.ui.storyProfileActions.querySelector('#storyProfileBackBtn').onclick = () => {
              if (this.activeStoryId) {
                  this.openStory(this.activeStoryId);
              } else {
                  this.switchToScreen(this.CONSTANTS.VIEWS.STORYBOARD);
              }
          }
  
          this.ui.storyProfileActions.querySelector('#deleteStoryBtn').onclick = async () => {
              if (confirm(`Delete story "${story.name || 'this story'}"? This cannot be undone.`)) {
                  await this.db.messages.where({ storyId: story.id }).delete();
                  await this.db.stories.delete(story.id);
                  this.showTopNotification('Story deleted.', 'success');
                  if (this.currentStoryId === story.id) this.currentStoryId = null;
                  if (this.activeStoryId === story.id) {
                      await this.db.appState.update(0, { activeStoryId: null });
                      this.activeStoryId = null;
                  }
                  this.switchToScreen(this.CONSTANTS.VIEWS.STORYBOARD);
              }
          };
      
          if (!story.concluded) {
              const concludeBtnProfile = this.ui.storyProfileActions.querySelector('#concludeStoryBtnStoryProfile');
              if (concludeBtnProfile) concludeBtnProfile.onclick = () => this.concludeStory(storyId);
              
              const openChatBtnProfile = this.ui.storyProfileActions.querySelector('#openStoryChatBtnStoryProfile');
              if(openChatBtnProfile) {
                  openChatBtnProfile.onclick = () => this.openStory(storyId);
                  
                  if (this.activeStoryId && this.activeStoryId !== story.id) {
                      const otherActiveStory = await this.db.stories.get(this.activeStoryId);
                      if (otherActiveStory && !otherActiveStory.concluded) {
                          openChatBtnProfile.disabled = true;
                          openChatBtnProfile.title = "Another story is currently active. Conclude it first.";
                      }
                  }
              }
          }
      
          this.ui.storyProfileMessageFeed.querySelectorAll('.story-profile-ingredient-card').forEach(card => {
              card.onclick = (e) => {
                  const itemId = card.dataset.itemId;
                  const itemType = card.dataset.itemType;
                  const itemConfig = this.CONSTANTS.ITEM_CONFIG[itemType];
                  if (itemId && itemConfig) {
                      this.switchToScreen(itemConfig.profileScreen, {itemId, itemType, originScreen: this.CONSTANTS.VIEWS.STORY_PROFILE });
                  }
              };
          });
      
          this.currentMainView = this.CONSTANTS.VIEWS.STORY_PROFILE;
          await this.saveAppState();
          this.checkAllButtonStates();
      },
      
      async renderFormScreen(options = {}) {
          const { itemType } = options;
          const config = this.CONSTANTS.ITEM_CONFIG[itemType];
          if (!config) { console.error("Invalid itemType for renderFormScreen:", itemType); return; }
  
          const container = this.ui[config.formScreen];
          if (!container) { console.error(`Container for ${config.formScreen} not found`); return; }
  
          const isCreating = options.isCreating || !options.itemId;
          
          this.ui.topBarDynamicTitle.textContent = isCreating ? `Create New ${config.capital}` : `Edit ${config.capital}`;
  
          this.currentCreateFormContext = { 
              isCreating, 
              id: isCreating ? null : options.itemId, 
              premadeId: isCreating ? options.premadeId : null,
              originScreen: options.originScreen || this.CONSTANTS.VIEWS.STORYBOARD,
              itemType,
              forUserCharacter: options.forUserCharacter, 
              forAiCharacter: options.forAiCharacter,
              preSelectedAiCharacterId: options.preSelectedAiCharacterId, 
              preSelectedUserCharacterId: options.preSelectedUserCharacterId,
              preSelectedWorldId: options.preSelectedWorldId
          };
          
          let item = {};
          if (isCreating) {
              if (options.formData && Object.keys(options.formData).length > 0) {
                  item = { ...options.formData };
                  this.createItemFormData = { ...options.formData }; 
                  console.log("[App Form] Using formData passed in options for new item.");
              } else if (Object.keys(this.createItemFormData).length > 0) {
                  item = { ...this.createItemFormData };
                  console.log("[App Form] Using App.createItemFormData for new item.");
              } else {
                  item = {};
                  console.log("[App Form] Creating a truly new item, no prior data.");
              }
          } else { 
              item = await this._getIngredientData(options.itemId, config.dbTableKey, config.getPreMadesFn, itemType);
          }
  
  
          if (!isCreating && !item) { 
              container.innerHTML = `<p>${config.capital} not found.</p>`; 
              return; 
          }
          
          let softLockNoticeHtml = '';
          if (!isCreating && this.activeStoryId) {
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
          
          container.innerHTML = softLockNoticeHtml + this._renderStudioLayout(item, config, true);
          this._attachFormEventListeners(container, itemType, item, isCreating);
          this.checkAllButtonStates();
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
          this.currentProfileOriginScreen = options.originScreen || this.currentMainView;
      
          const isPremade = typeof itemId === 'string' && itemId.startsWith('premade_');
          const item = await this._getIngredientData(itemId, config.dbTableKey, config.getPreMadesFn, itemType);
      
          if (!item) {
              container.innerHTML = `<p class="p-4 text-center">${config.capital} not found.</p>`;
              this.ui.topBarDynamicTitle.textContent = `${config.capital} Profile`;
              return;
          }
          this.ui.topBarDynamicTitle.textContent = `${config.capital} Profile`;
      
          container.innerHTML = this._renderStudioLayout(item, config, false);
      
          const backButton = container.querySelector('#profileBackButton');
          if (backButton) {
              backButton.onclick = () => {
                  if (this.activeStoryId) {
                      this.switchToScreen(this.CONSTANTS.VIEWS.STORY_INTERFACE);
                  } else {
                      this.switchToScreen(this.CONSTANTS.VIEWS.STORYBOARD);
                  }
              };
          }
      
          const actionButton = isPremade ? container.querySelector('#copyCustomizeBtn') : container.querySelector('#editFromProfileBtn');
          if (actionButton) {
              actionButton.onclick = () => {
                  let formOptions = {
                      itemType: itemType,
                      originScreen: this.currentMainView, 
                  };
      
                  if (isPremade) {
                      const premadeDataOriginal = { ...item }; 
                      this.createItemFormData = premadeDataOriginal; 
                      this.createItemFormData.name = `${premadeDataOriginal.name || config.capital} (Copy)`;
                      delete this.createItemFormData.id; 
                      delete this.createItemFormData.isPremade;
                      delete this.createItemFormData.originalPremadeId; 
                      
                      formOptions.isCreating = true;
                      formOptions.premadeId = item.originalPremadeId;
                  } else { 
                      formOptions.isCreating = false; 
                      formOptions.itemId = itemId;
                  }
                  this.switchToScreen(config.formScreen, formOptions);
              };
          }
      },
  
      _renderStudioLayout(item, config, isEditing) {
          const san = this.sanitizeHtml;
          let nameField;
          if (config.itemType === 'character' && isEditing) {
              nameField = `<div id="${config.itemType}NameEditable" class="studio-name-input full-width" contenteditable="true" spellcheck="false" data-placeholder="${config.capital} Name">${san(item?.name || '')}</div>`;
          } else if (isEditing) {
              nameField = `<input type="text" id="${config.itemType}Name" class="studio-name-input full-width" placeholder="${config.capital} Name" value="${san(item?.name || '')}">`;
          } else {
              nameField = `<h2 class="studio-profile-name full-width">${san(item?.name || 'Unnamed')}</h2>`;
          }
  
          const descriptionField = isEditing ? 
          `<div class="form-field-group full-width">
              <div class="form-field-wrapper">
                  <textarea id="${config.itemType}Description" rows="2" placeholder="${san(config.labels.descriptionPlaceholder)}">${san(item?.description || '')}</textarea>
                   <button type="button" class="ai-helper-button" id="summarizeBtn${config.capital}">✨ Summarize for Card</button>
              </div>
           </div>` :
           (item?.description ? `<div class="form-field-group full-width">
                                    <div class="profile-field-value">${san(item.description)}</div>
                                </div>` : '');
          
          const createField = (trait, rows = 4) => {
              const id = `${config.itemType}${trait.charAt(0).toUpperCase() + trait.slice(1)}`;
              const label = config.labels[trait.toLowerCase()];
              const placeholder = config.labels[`${trait.toLowerCase()}Placeholder`];
              const value = item?.[trait.toLowerCase()] || '';
  
              if (isEditing) {
                  return `
                      <div class="form-field-group">
                          <div class="field-label">
                              <span class="main-label">${label.main}</span>
                              <span class="sub-label">${label.sub}</span>
                          </div>
                          <div class="form-field-wrapper">
                              <textarea id="${id}" rows="${rows}" placeholder="${san(placeholder)}">${san(value)}</textarea>
                              <button type="button" class="ai-helper-button" data-trait="${trait.toLowerCase()}" data-buttontype="ai-fill" id="ai-btn-${config.itemType}-${trait.toLowerCase()}">✨ ${value ? 'Refine' : 'Make up'} ${trait}</button>
                          </div>
                      </div>`;
              } else {
                  return `<div class="form-field-group">
                              <div class="field-label"><span class="main-label">${label.main}</span><br><span class="sub-label">${label.sub}</span></div>
                              <div class="profile-field-value">${san(value) || 'N/A'}</div>
                          </div>`;
              }
          };
  
          const isPremade = typeof item.id === 'string' && item.id.startsWith('premade_');
          let actionButtons;
          if (isEditing) {
              actionButtons = `
                  ${!this.currentCreateFormContext.isCreating ? `<button type="button" id="delete${config.capital}BtnMain" class="delete-button"><span class="button-text">Delete</span><span class="button-icon">🗑️</span></button>` : '<div class="mr-auto"></div>'}
                  <div class="ml-auto flex gap-2">
                      <button type="button" id="cancel${config.capital}BtnMain" class="secondary-action-button"><span class="button-text">Cancel</span><span class="button-icon">❌</span></button>
                      <button type="submit" id="submit${config.capital}BtnMain" class="primary-action-button"><span class="button-text">${this.currentCreateFormContext.isCreating ? `Create ${config.capital}` : 'Save Changes'}</span><span class="button-icon">💾</span></button>
                  </div>`;
          } else {
              actionButtons = `
                  <button id="profileBackButton" class="secondary-action-button"><span class="button-icon">⬅️</span><span class="button-text">Back</span></button>
                  <div class="ml-auto flex gap-2">
                      ${isPremade ? 
                          `<button id="copyCustomizeBtn" class="primary-action-button"><span class="button-text">Copy & Customize</span><span class="button-icon">📋</span></button>` :
                          `<button id="editFromProfileBtn" class="primary-action-button"><span class="button-text">Edit ${config.capital}</span><span class="button-icon">✏️</span></button>`
                      }
                  </div>`;
          }
          const avatarPanelClass = `studio-left-panel ${!item?.avatar ? 'empty-avatar' : ''} ${isEditing ? 'editable' : ''} ${!isEditing ? 'no-placeholder' : ''}`;
  
          return `
              <div class="studio-layout-container">
                  <div class="${avatarPanelClass}" 
                       id="${config.itemType}AvatarDisplay" 
                       style="background-image: url('${san(item?.avatar || '')}');"
                       onclick="if(event.target === this) App.showAvatarOverlay(this.querySelector('.avatar-overlay'), '${config.itemType}');">
                      <div id="avatar-overlay-${config.itemType}" class="avatar-overlay">
                          <div class="avatar-overlay-content">
                              <div class="avatar-preview-column" id="avatarPreviewAreaForm-${config.itemType}"><span class="opacity-50 text-sm">Preview Area</span></div>
                              <textarea id="avatarPromptInputForm-${config.itemType}" placeholder="Describe image or paste URL..."></textarea>
                              <button type="button" id="aiHelpAvatarPromptBtn-${config.itemType}" class="ai-helper-button w-full" style="margin-top: 0.25rem;"><span class="button-text">AI Help with Prompt</span><span class="button-icon">✨</span></button>
                          </div>
                          <div class="avatar-overlay-actions">
                               <button type="button" id="generateAvatarBtnForm-${config.itemType}" class="primary-action-button"><span class="button-text">Generate</span></button>
                               <button type="button" id="useAvatarBtnForm-${config.itemType}" class="primary-action-button" disabled><span class="button-text">Use Image</span></button>
                               <button type="button" id="uploadAvatarBtnForm-${config.itemType}" class="secondary-action-button"><span class="button-text">Upload</span></button>
                               <button type="button" id="closeAvatarBtnForm-${config.itemType}" class="secondary-action-button"><span class="button-text">Close</span></button>
                          </div>
                      </div>
                  </div>
                  <div class="studio-right-panel">
                      <form id="${config.itemType}FormMain" class="h-full flex flex-col">
                          <div class="studio-form-content">
                              ${nameField}
                              ${descriptionField}
                              ${createField('eternal')}
                              ${createField('past')}
                              ${createField('present')}
                              ${createField('future')}
                          </div>
                          <div class="studio-form-actions">${actionButtons}</div>
                      </form>
                  </div>
              </div>`;
      },
  
      _attachFormEventListeners(container, itemType, item, isCreating) {
          const config = this.CONSTANTS.ITEM_CONFIG[itemType];
          const form = container.querySelector(`#${itemType}FormMain`);
          const nameEditableDiv = form.querySelector(`#${itemType}NameEditable`); 
          const nameInput = form.querySelector(`#${itemType}Name`); 
          
          const avatarDisplayPanel = container.querySelector(`#${itemType}AvatarDisplay`);
          const avatarOverlay = container.querySelector(`#avatar-overlay-${itemType}`);
          const avatarPromptInputForm = container.querySelector(`#avatarPromptInputForm-${itemType}`);
          const uploadAvatarBtnForm = container.querySelector(`#uploadAvatarBtnForm-${itemType}`);
          const generateAvatarBtnForm = container.querySelector(`#generateAvatarBtnForm-${itemType}`);
          const useAvatarBtnForm = container.querySelector(`#useAvatarBtnForm-${itemType}`);
          const closeAvatarBtnForm = container.querySelector(`#closeAvatarBtnForm-${itemType}`);
          const aiHelpAvatarPromptBtn = container.querySelector(`#aiHelpAvatarPromptBtn-${itemType}`);
          
          avatarPromptInputForm.addEventListener('click', e => e.stopPropagation());
          // Added Enter key listener for avatar prompt input
          avatarPromptInputForm.addEventListener('keyup', (e) => {
              if (e.key === 'Enter' && !e.shiftKey) { 
                  e.preventDefault(); 
                  if (!generateAvatarBtnForm.disabled) {
                      generateAvatarBtnForm.click(); // Trigger the generate/use URL button
                  }
              }
          });

          closeAvatarBtnForm.onclick = (e) => { e.stopPropagation(); this.hideAvatarOverlay(avatarOverlay); };
          if (aiHelpAvatarPromptBtn) {
              aiHelpAvatarPromptBtn.onclick = (e) => { e.stopPropagation(); this._handleAiHelpForAvatarPrompt(aiHelpAvatarPromptBtn, itemType, avatarPromptInputForm, form); };
          }
  
          if (window.uploadDataUrlToTextInput) {
              uploadAvatarBtnForm.onclick = (e) => { e.stopPropagation(); window.uploadDataUrlToTextInput(avatarPromptInputForm, { type: 'image/*' }); };
          } else {
              uploadAvatarBtnForm.disabled = true;
              console.warn("file-upload-plugin not found, disabling upload button.");
          }
          useAvatarBtnForm.onclick = (e) => { e.stopPropagation(); this.handleUseGeneratedAvatar(avatarOverlay, itemType); };
  
          avatarPromptInputForm.oninput = () => {
              const isUrl = avatarPromptInputForm.value.trim().startsWith('http');
              generateAvatarBtnForm.innerHTML = `<span class="button-text">${isUrl ? 'Use URL' : 'Generate'}</span>`;
              if (isUrl) {
                  generateAvatarBtnForm.onclick = (e) => { e.stopPropagation(); this.handleUseUrlForAvatar(avatarOverlay, avatarPromptInputForm.value.trim(), itemType); };
              } else {
                  generateAvatarBtnForm.onclick = (e) => { e.stopPropagation(); this.handleGenerateAvatarSmart(avatarOverlay, itemType, avatarPromptInputForm.value.trim()); };
              }
              this.checkAllButtonStates(); 
          };
          avatarPromptInputForm.dispatchEvent(new Event('input')); 
          
          if (!isCreating) {
              form.querySelector(`#delete${config.capital}BtnMain`).onclick = async () => {
                  if (confirm(`Delete ${itemType} "${item.name || `this ${itemType}`}"? This will remove it from lists but keep it in existing stories.`)) { 
                      await this.db[config.dbTableKey].update(item.id, { isDeleted: true });
                      this.showTopNotification(`${config.capital} deleted (archived).`, 'success');
                      this.switchToScreen(this.CONSTANTS.VIEWS.STORYBOARD);
                  }
              };
          }
  
          form.querySelector(`#cancel${config.capital}BtnMain`).onclick = () => {
              const { originScreen, id, itemType, preSelectedAiCharacterId, preSelectedUserCharacterId, preSelectedWorldId } = this.currentCreateFormContext;
              this.createItemFormData = {}; 
              
              const navOptions = { 
                  preSelectedAiCharacterId, 
                  preSelectedUserCharacterId, 
                  preSelectedWorldId 
              };
              let targetScreen = originScreen;
          
              if (targetScreen === config.profileScreen) {
                  navOptions.itemId = id;
                  navOptions.itemType = itemType;
              } else if (targetScreen === this.CONSTANTS.VIEWS.STORY_PROFILE) {
                  navOptions.storyId = this.currentStoryId;
              } else {
                  targetScreen = this.CONSTANTS.VIEWS.STORYBOARD;
              }
              this.switchToScreen(targetScreen, navOptions);
          };
  
          form.onsubmit = async (e) => {
              e.preventDefault();
              const submitButton = form.querySelector(`#submit${config.capital}BtnMain`);
               await this._manageAiButtonState(submitButton, {
                  actionAsyncFn: async () => {
                      const avatarDisplayPanel = container.querySelector(`#${itemType}AvatarDisplay`);
                      const avatarUrlStyle = avatarDisplayPanel.style.backgroundImage;
                      const avatarUrl = avatarUrlStyle && avatarUrlStyle.startsWith('url("') ? avatarUrlStyle.slice(5, -2) : '';
                      
                      let itemName;
                      if (itemType === 'character' && nameEditableDiv) {
                          itemName = nameEditableDiv.textContent.trim() || `Unnamed ${config.capital}`;
                      } else if (nameInput) {
                          itemName = nameInput.value.trim() || `Unnamed ${config.capital}`;
                      } else {
                          itemName = `Unnamed ${config.capital}`;
                      }
                      
                      const descriptionTextarea = form.querySelector(`#${itemType}Description`);

                      const data = {
                          name: itemName,
                          avatar: avatarUrl,
                          description: descriptionTextarea ? descriptionTextarea.value : '',
                          eternal: form.querySelector(`#${itemType}Eternal`).value,
                          past: form.querySelector(`#${itemType}Past`).value,
                          present: form.querySelector(`#${itemType}Present`).value,
                          future: form.querySelector(`#${itemType}Future`).value,
                      };

                      let newId = this.currentCreateFormContext.id;
                      if (this.currentCreateFormContext.isCreating) {
                          data.createdTimestamp = Date.now();
                          data.uniqueId = `${itemType}_` + Date.now() + Math.random().toString(36).substring(2,7);
                          data.isDeleted = false;
                          newId = await this.db[config.dbTableKey].add(data);
                      } else {
                          await this.db[config.dbTableKey].update(this.currentCreateFormContext.id, data);
                      }
                      return { newId }; 
                  },
                  onSuccess: (result) => {
                      const { newId } = result;
                      this.showTopNotification(`${config.capital} ${this.currentCreateFormContext.isCreating ? 'created' : 'updated'}!`, 'success');
                      this.createItemFormData = {}; 
                      
                      let targetScreen = this.currentCreateFormContext.originScreen;
                      const navOptions = { itemId: newId, itemType };

                      if (targetScreen === config.profileScreen && !this.currentCreateFormContext.isCreating) {
                      } else if (targetScreen === this.CONSTANTS.VIEWS.STORY_PROFILE) {
                          navOptions.storyId = this.currentStoryId;
                      } else if (Object.values(this.CONSTANTS.CONTEXTUAL_MENU_VIEWS).includes(targetScreen)) {
                          targetScreen = this.CONSTANTS.VIEWS.STORYBOARD; 
                      } else { 
                          targetScreen = this.CONSTANTS.VIEWS.STORYBOARD;
                          navOptions.preSelectedAiCharacterId = this.currentCreateFormContext.preSelectedAiCharacterId;
                          navOptions.preSelectedUserCharacterId = this.currentCreateFormContext.preSelectedUserCharacterId;
                          navOptions.preSelectedWorldId = this.currentCreateFormContext.preSelectedWorldId;
                          if (this.currentCreateFormContext.isCreating) { 
                              if (itemType === 'character') {
                                  if (this.currentCreateFormContext.forAiCharacter) navOptions.preSelectedAiCharacterId = newId;
                                  else if (this.currentCreateFormContext.forUserCharacter) navOptions.preSelectedUserCharacterId = newId;
                              } else if (itemType === 'world') {
                                  navOptions.preSelectedWorldId = newId;
                              }
                          }
                      }
                      this.switchToScreen(targetScreen, navOptions);
                      
                      if (this.currentMainView === this.CONSTANTS.VIEWS.STORY_INTERFACE && newId && itemType === 'character') {
                          this.db.characters.get(newId).then(currentCharacterFromDb => {
                              if (this.currentAiCharacterId === newId) { 
                                  this._updateTopBarCharacterInfo('ai', currentCharacterFromDb); 
                                  this._loadCharacterImageToSidePanel('ai', currentCharacterFromDb); 
                              }
                              if (this.currentUserCharacterId === newId) { 
                                  this._updateTopBarCharacterInfo('user', currentCharacterFromDb); 
                                  this._loadCharacterImageToSidePanel('user', currentCharacterFromDb); 
                              }
                          });
                      }
                  },
                  onError: (error) => {
                      console.error("Error saving form:", error);
                      this.showTopNotification("Error saving.", "error");
                  },
                  isCancellable: true,
              });
          };
          
          form.querySelectorAll('textarea').forEach(textarea => {
              textarea.addEventListener('input', (e) => {
                  const aiButton = e.target.nextElementSibling;
                  if (aiButton && aiButton.dataset.buttontype === 'ai-fill') {
                      const hasText = e.target.value.trim() !== '';
                      aiButton.innerHTML = `✨ ${hasText ? 'Refine' : 'Make up'} ${aiButton.dataset.trait}`;
                  }
              });
          });
  
          form.querySelectorAll('button[data-buttontype="ai-fill"]').forEach(button => {
              button.onclick = (e) => {
                  const textarea = e.target.previousElementSibling;
                  const hasText = textarea.value.trim() !== '';
                  this._handleAiCoWriter(button, itemType, hasText, textarea);
              };
          });
          const summarizeBtn = form.querySelector(`#summarizeBtn${config.capital}`);
          if(summarizeBtn) summarizeBtn.onclick = () => this._handleSummarize(summarizeBtn, itemType);
  
          this.checkAllButtonStates(); 
      },
  
      showAvatarOverlay(overlayElement, itemType) {
          if (!overlayElement) return;
          this.currentGeneratedAvatarDataUrl = null;
          this.currentTargetAvatarInputId = `${itemType}AvatarDisplay`;
      
          const promptInput = overlayElement.querySelector(`#avatarPromptInputForm-${itemType}`);
          const previewArea = overlayElement.querySelector(`#avatarPreviewAreaForm-${itemType}`);
          const useBtn = overlayElement.querySelector(`#useAvatarBtnForm-${itemType}`);
          const aiHelpBtn = overlayElement.querySelector(`#aiHelpAvatarPromptBtn-${itemType}`);
      
          if(useBtn) useBtn.disabled = true;
          if(aiHelpBtn) aiHelpBtn.disabled = false; 
      
          promptInput.value = ''; 
          previewArea.innerHTML = '<span class="opacity-50 text-sm">Preview Area</span>';
          previewArea.classList.remove('has-image');
          
          promptInput.dispatchEvent(new Event('input')); 
          this.checkAllButtonStates(); 
          overlayElement.classList.add('visible');
      },
  
      async _handleAiHelpForAvatarPrompt(buttonElement, itemType, promptTextarea, formElement) {
          if (!formElement || !promptTextarea) {
               console.error("Missing form or promptTextarea for AI Avatar Help");
               return;
          }
      
          const existingPromptText = promptTextarea.value.trim();
          let instruction;
      
          if (existingPromptText === "") {
              let name;
              const nameEditableDiv = formElement.querySelector(`#${itemType}NameEditable`);
              if (nameEditableDiv) { 
                  name = nameEditableDiv.textContent.trim();
              } else { 
                  const nameInput = formElement.querySelector(`#${itemType}Name`);
                  name = nameInput ? nameInput.value.trim() : '';
              }
  
              const eternal = formElement.querySelector(`#${itemType}Eternal`)?.value.trim() || 'not specified';
              const present = formElement.querySelector(`#${itemType}Present`)?.value.trim() || 'not specified';
              const itemNameForPrompt = name || `this ${itemType}`;
      
              instruction = `Generate a concise, photorealistic image prompt for a profile picture of: "${itemNameForPrompt}". Focus on physical appearance details primarily from its "Eternal" state ("${eternal}"), and secondarily from its "Present" state ("${present}"). If Eternal is "not specified" or lacks visual detail, rely more on Present. Output only the image prompt. Avoid conversational text or labels.`;
          } else {
              instruction = `You are a master image prompt enhancer. Take the user's existing image prompt: "${existingPromptText}" and refine it into a more detailed, evocative, and visually rich prompt suitable for generating a profile picture. Maintain the core subject and intent of the original prompt. Output only the improved image prompt.`;
          }
          
          const originalPrompt = promptTextarea.value;
          await this._manageAiButtonState(buttonElement, {
              actionAsyncFn: this._createAiRequest,
              paramsForAction: { instruction },
              targetTextarea: promptTextarea,
              onSuccess: (response) => {
                  if (response?.generatedText) {
                      promptTextarea.value = response.generatedText.trim();
                      promptTextarea.dispatchEvent(new Event('input'));
                  }
              },
              onError: (error, wasCancelled) => {
                  if (wasCancelled) {
                    promptTextarea.value = originalPrompt;
                  } else {
                    console.error("AI Help for Avatar Prompt error:", error);
                    this.showTopNotification("AI helper for avatar prompt failed.", "error");
                  }
              },
              isCancellable: true
          });
      },
  
      hideAvatarOverlay(overlayElement) {
          if (!overlayElement) return;
          overlayElement.classList.remove('visible');
          this.currentGeneratedAvatarDataUrl = null;
          this.currentTargetAvatarInputId = null;
          const previewArea = overlayElement.querySelector('[id^="avatarPreviewAreaForm-"]');
          if (previewArea) {
               previewArea.innerHTML = '<span class="opacity-50 text-sm">Preview Area</span>'; 
               previewArea.classList.remove('has-image');
          }
          const useBtn = overlayElement.querySelector('[id^="useAvatarBtnForm-"]');
          if(useBtn) useBtn.disabled = true;
          this.checkAllButtonStates();
      },
      
      handleUseUrlForAvatar(overlayElement, url, itemType) {
          const avatarDisplayPanel = document.getElementById(`${itemType}AvatarDisplay`);
          if (avatarDisplayPanel) {
              avatarDisplayPanel.style.backgroundImage = `url('${this.sanitizeHtml(url)}')`;
              avatarDisplayPanel.classList.remove('empty-avatar');
          }
          this.hideAvatarOverlay(overlayElement);
          this.showTopNotification("Avatar URL applied!", "success", 2000);
      },
  
      _makePromptObjectForImagePlugin(promptString) {
          return { evaluateItem: promptString };
      },
  
      async handleGenerateAvatarSmart(overlayElement, itemType, currentPromptText) {
          const previewArea = overlayElement.querySelector(`#avatarPreviewAreaForm-${itemType}`);
          const genBtn = overlayElement.querySelector(`#generateAvatarBtnForm-${itemType}`);
          const useBtn = overlayElement.querySelector(`#useAvatarBtnForm-${itemType}`);
          const avatarPromptInput = overlayElement.querySelector(`#avatarPromptInputForm-${itemType}`);
          const closeBtn = overlayElement.querySelector(`#closeAvatarBtnForm-${itemType}`);
          const aiHelpBtn = overlayElement.querySelector(`#aiHelpAvatarPromptBtn-${itemType}`);
          
          const finalPrompt = currentPromptText.trim(); 
          if (!finalPrompt) {
              this.showTopNotification("Prompt cannot be empty for generation.", "error", 2000);
              return;
          }
          
          if (!window.root || typeof window.root.textToImagePlugin !== 'function') { 
              this.showTopNotification("Image generation plugin not available.", "error"); 
              previewArea.innerHTML = '<p style="color:var(--danger-bg);">Plugin Error</p>';
              return; 
          }
  
          previewArea.innerHTML = '<div class="spinner"></div><p style="font-size:0.8em; margin-top:0.5em; opacity:0.7;">Generating...</p>';
          previewArea.classList.remove('has-image');
          if (useBtn) useBtn.disabled = true;
          
          console.log('RPGlitch is sending this prompt to textToImagePlugin:', finalPrompt); 
  
          const onSuccessCallback = (result) => {
              previewArea.innerHTML = ''; 
              if (result && result.canvas) {
                  result.canvas.style.maxWidth = '100%'; 
                  result.canvas.style.maxHeight = '100%'; 
                  result.canvas.style.objectFit = 'contain';
                  previewArea.appendChild(result.canvas); 
                  previewArea.classList.add('has-image');
                  this.currentGeneratedAvatarDataUrl = result.canvas.toDataURL('image/png'); 
                  if (useBtn) useBtn.disabled = false;
              } else {
                  previewArea.innerHTML = '<p style="color:var(--danger-bg);">Failed to generate image.</p>';
                  this.showTopNotification("Image generation failed.", "error");
              }
          };
          const onErrorCallback = (error, wasCancelled) => {
               if (!wasCancelled) {
                    console.error("Image generation plugin error:", error);
                    if (error && error.message && error.message.includes("evaluateItem.toString()")) {
                        console.warn("RPGlitch Note: The 'evaluateItem.toString()' error likely originates within the 'text-to-image-plugin'. RPGlitch passes a string as expected for a JS API. This might be a plugin limitation for certain string prompts.");
                        this.showTopNotification("Plugin error. Prompt might be too complex or an issue with the plugin. Try simplifying.", "error", 5000);
                    } else {
                        this.showTopNotification("Image generation failed. Check console for details.", "error");
                    }
                    previewArea.innerHTML = '<p style="color:var(--danger-bg);">Failed. Check console.</p>';
               } else {
                    previewArea.innerHTML = '<span class="opacity-50 text-sm">Preview Area</span>';
               }
          }
          
          await this._manageAiButtonState(genBtn, {
              actionAsyncFn: (params, signal) => new Promise((resolve, reject) => {
                  const onFinish = (res) => signal?.aborted ? reject(new Error("Cancelled")) : resolve(res);
                  const onError = (err) => signal?.aborted ? reject(new Error("Cancelled")) : reject(err);
                  window.root.textToImagePlugin({ ...params, onFinish, onError });
                  if(signal) signal.addEventListener('abort', () => reject(new Error("Cancelled")));
              }),
              paramsForAction: { prompt: this._makePromptObjectForImagePlugin(finalPrompt) }, 
              onSuccess: onSuccessCallback,
              onError: onErrorCallback,
              isCancellable: true,
              targetTextarea: avatarPromptInput,
              inputsToDisable: [closeBtn, aiHelpBtn],
              relatedUseButton: useBtn
          });
      },
      
      handleUseGeneratedAvatar(overlayElement, itemType) {
          if (!this.currentGeneratedAvatarDataUrl) {
              this.showTopNotification("Could not apply image: No image data. Please generate one first.", "error");
              return;
          }
          if (!this.currentTargetAvatarInputId) {
              this.showTopNotification("Could not apply image: Target element not found.", "error");
              return;
          }
          
          const avatarDisplayPanel = document.getElementById(this.currentTargetAvatarInputId);
  
          if (avatarDisplayPanel) {
              avatarDisplayPanel.style.backgroundImage = `url('${this.currentGeneratedAvatarDataUrl}')`;
              avatarDisplayPanel.classList.remove('empty-avatar');
              this.showTopNotification("Avatar image applied!", "success", 2000);
          } else { 
              this.showTopNotification("Error applying image: target display panel not found.", "error"); 
          }
          this.hideAvatarOverlay(overlayElement);
      },
  
      async waitForDependenciesAndInitializeApp() {
          const checkInterval = 100; 
          const timeout = 15000; 
          let elapsedTime = 0;
          
          return new Promise((resolve, reject) => {
              const intervalId = setInterval(async () => {
                  elapsedTime += checkInterval;
                  if (elapsedTime >= timeout) { 
                      clearInterval(intervalId); 
                      reject(new Error("Timeout waiting for Perchance plugins.")); 
                      return; 
                  }
                  
                  const dexieReady = typeof Dexie === 'function';
                  const domPurifyReady = window.DOMPurify && typeof window.DOMPurify.sanitize === 'function';
                  const aiTextPluginReady = window.root && typeof window.root.aiTextPlugin === 'function';
                  const textToImagePluginReady = window.root && typeof window.root.textToImagePlugin === 'function';
  
                  if (dexieReady && domPurifyReady && aiTextPluginReady && textToImagePluginReady) {
                      clearInterval(intervalId);
                      if (window.root.aiTextPlugin && typeof window.aiTextPluginMetaObject === 'undefined') {
                          var tempAiMetaObject = window.root.aiTextPlugin({ getMetaObject: true });
                          window.aiTextPluginMetaObject = tempAiMetaObject;
                          if (tempAiMetaObject) { 
                              window.countTokens = tempAiMetaObject.countTokens; 
                              window.idealMaxContextTokens = tempAiMetaObject.idealMaxContextTokens; 
                          }
                      }
                      console.log("All Perchance plugins and core libraries ready.");
                      resolve();
                  } else {
                      if (window.root && typeof window.root.loadDependencies === 'function' && 
                          (!dexieReady || !domPurifyReady) && !window.dependenciesLoadedCalled) {
                          try {
                              window.dependenciesLoadedCalled = true; 
                              await window.root.loadDependencies();
                          } catch (e) { 
                              console.error("Error calling loadDependencies:", e); 
                          }
                      }
                  }
              }, checkInterval);
          });
      },
  
      async initializeWhenReady() {
        try {
          await this.waitForDependenciesAndInitializeApp();
          await this.initialLoad();
        } catch (error) {
          console.error("Critical initialization error:", error);
          this.showTopNotification("Error loading application: " + error.message, "error", 10000);
          if (this.ui.emergencyExportCtn) this.showEl(this.ui.emergencyExportCtn);
          if (this.ui.initialPageLoadingModal) this.hideEl(this.ui.initialPageLoadingModal);
        }
      },
      
      async switchToScreen(screenId, options = {}) {
          const oldScreen = this.currentMainView;
          this.currentMainView = screenId;
          this.ui.topBar.classList.remove('chat-active');
      
          if (screenId === this.CONSTANTS.VIEWS.CHARACTER_FORM || screenId === this.CONSTANTS.VIEWS.WORLD_FORM) {
              this.currentCreateFormContext.originScreen = options.originScreen || oldScreen || this.CONSTANTS.VIEWS.STORYBOARD;
              this.currentCreateFormContext.itemId = options.itemId; 
              if (options.isCreating) {
                  if (Object.keys(this.createItemFormData).length === 0 && (!options.formData || Object.keys(options.formData).length === 0)) {
                      this.createItemFormData = {}; 
                  }
              } else { 
                  this.createItemFormData = {};
              }
          }
          
          if (screenId === this.CONSTANTS.VIEWS.CHARACTER_PROFILE || screenId === this.CONSTANTS.VIEWS.WORLD_PROFILE || screenId === this.CONSTANTS.VIEWS.STORY_PROFILE) {
              if (options.originScreen && 
                  options.originScreen !== this.CONSTANTS.VIEWS.CHARACTER_FORM && 
                  options.originScreen !== this.CONSTANTS.VIEWS.WORLD_FORM && 
                  options.originScreen !== screenId) {
                  this.currentProfileOriginScreen = options.originScreen;
              } else {
                  if (!(oldScreen === this.CONSTANTS.VIEWS.CHARACTER_FORM || oldScreen === this.CONSTANTS.VIEWS.WORLD_FORM)) {
                      if (!this.currentProfileOriginScreen || 
                          this.currentProfileOriginScreen === screenId || 
                          Object.values(this.CONSTANTS.CONTEXTUAL_MENU_VIEWS).includes(this.currentProfileOriginScreen)) {
                          
                          this.currentProfileOriginScreen = this.CONSTANTS.VIEWS.STORYBOARD;
                      }
                  }
              }
          }
          
          Object.values(this.CONSTANTS.VIEWS).forEach(id => this.ui[id] && this.hideEl(this.ui[id]));
          
          if (screenId === this.CONSTANTS.VIEWS.STORY_INTERFACE) {
              this.showEl(this.ui.topBarAiCharacterInfo);
              this.showEl(this.ui.topBarUserCharacterInfo);
              this.ui.topBar.classList.add('chat-active');
          } else {
              this.hideEl(this.ui.topBarAiCharacterInfo);
              this.hideEl(this.ui.topBarUserCharacterInfo);
               if(this.ui.aiCharacterDisplayArea) this.ui.aiCharacterDisplayArea.classList.remove('visible');
               if(this.ui.userCharacterDisplayArea) this.ui.userCharacterDisplayArea.classList.remove('visible');
          }
  
  
          switch (screenId) {
              case this.CONSTANTS.VIEWS.STORYBOARD:
                  await this._updateStoryboard(options);
                  this.ui.topBarDynamicTitle.textContent = 'Storyboard';
                  this.showEl(this.ui.storyboardScreen);
                  break;
              case this.CONSTANTS.VIEWS.STORY_INTERFACE:
                  if (this.activeStoryId) {
                      const activeStory = await this.db.stories.get(this.activeStoryId);
                      if (activeStory && activeStory.concluded) {
                          await this.renderStoryProfileScreen(this.activeStoryId);
                          this.showEl(this.ui.storyProfileScreen);
                      } else {
                          this.showEl(this.ui.storyInterfaceScreen);
                      }
                  } else {
                      this.showEl(this.ui.storyInterfaceScreen);
                  }
                  break;
              case this.CONSTANTS.VIEWS.CHARACTER_FORM:
              case this.CONSTANTS.VIEWS.WORLD_FORM:
                  await this.renderFormScreen(options);
                  this.showEl(this.ui[screenId]);
                  break;
              case this.CONSTANTS.VIEWS.CHARACTER_PROFILE:
              case this.CONSTANTS.VIEWS.WORLD_PROFILE:
                  await this.renderProfileScreen(options);
                  this.showEl(this.ui[screenId]);
                  break;
             case this.CONSTANTS.VIEWS.STORY_PROFILE: 
                  await this.renderStoryProfileScreen(options.storyId);
                  this.showEl(this.ui.storyProfileScreen);
                  break;
              case this.CONSTANTS.VIEWS.MEMORY_APPLICATION: // <-- ADD THIS CASE BLOCK
                  await this._renderMemoryApplicationScreen(options);
                  this.showEl(this.ui.memoryApplicationScreen);
                  break;
              case this.CONSTANTS.VIEWS.PREMADE_CHARACTER_SELECTION:
                  await this._renderPremadeCharacterList();
                  this.ui.topBarDynamicTitle.textContent = 'Select Premade Character';
                  this.showEl(this.ui.preMadeCharacterSelectionScreen);
                  break;
              case this.CONSTANTS.VIEWS.PREMADE_WORLD_SELECTION:
                  await this._renderPremadeWorldList();
                  this.ui.topBarDynamicTitle.textContent = 'Select Premade World';
                  this.showEl(this.ui.preMadeWorldSelectionScreen);
                  break;
          }
          await this.saveAppState();
          this.checkAllButtonStates();
      },
  
      async _updateTopBarCharacterInfo(characterType, characterData = null) {
          const infoEl = characterType === 'user' ? this.ui.topBarUserCharacterInfo : this.ui.topBarAiCharacterInfo;
          const picEl = characterType === 'user' ? this.ui.topBarUserCharacterPic : this.ui.topBarAiCharacterPic;
          const nameEl = characterType === 'user' ? this.ui.topBarUserCharacterNameText : this.ui.topBarAiCharacterNameText;
      
          // Prioritize characterData if provided, otherwise fetch from DB using current ID
          const dataToUse = characterData || (
              (characterType === 'user' && this.currentUserCharacterId) ? await this._getIngredientData(this.currentUserCharacterId, 'characters', this.getPremadeCharacterItems, 'character') :
              (characterType === 'ai' && this.currentAiCharacterId) ? await this._getIngredientData(this.currentAiCharacterId, 'characters', this.getPremadeCharacterItems, 'character') :
              null
          );
          
          if (dataToUse) {
              picEl.src = this.sanitizeHtml(dataToUse.avatar || '');
              nameEl.textContent = this.sanitizeHtml(dataToUse.name || (characterType === 'user' ? 'Your Character' : 'AI Character'));
              nameEl.title = this.sanitizeHtml(dataToUse.name || (characterType === 'user' ? 'Your Character' : 'AI Character')); 
              this.showEl(infoEl);
          } else {
              picEl.src = '';
              nameEl.textContent = characterType === 'user' ? 'Your Character' : 'AI Character';
              nameEl.title = characterType === 'user' ? 'Your Character' : 'AI Character';
              this.hideEl(infoEl);
          }
      },
      
      _loadCharacterImageToSidePanel(characterType, characterData) {
          const panel = characterType === 'user' ? this.ui.userCharacterDisplayArea : this.ui.aiCharacterDisplayArea;
          if (panel) {
              console.log(`[App UI] Loading ${characterType} image. Data:`, characterData);
              if (characterData && characterData.avatar) {
                  panel.style.backgroundImage = `url('${this.sanitizeHtml(characterData.avatar)}')`;
                  // Add the slide-in class
                  panel.classList.add('visible'); 
              } else {
                  panel.style.backgroundImage = '';
                  panel.classList.remove('visible'); 
                  console.warn(`[App UI] No avatar found for ${characterType}. Hiding panel.`);
              }
          }
      },
      
      async openStory(storyId) { 
          const story = await this.db.stories.get(storyId);
          if (!story) {
              this.showTopNotification("Story not found.", "error");
              return this.switchToScreen(this.CONSTANTS.VIEWS.STORYBOARD);
          }
      
          this.currentStoryId = story.id;
          this.currentAiCharacterId = story.aiCharacterId; 
          this.currentUserCharacterId = story.userCharacterId;
          this.activeStoryId = story.concluded ? null : story.id; 
          if (story.concluded) { await this.db.appState.update(0, { activeStoryId: null }); }
      
          const aiChar = story.storyAiCharacter || await this._getIngredientData(story.aiCharacterId, 'characters', this.getPremadeCharacterItems, 'character');
          const userChar = story.storyUserCharacter || await this._getIngredientData(story.userCharacterId, 'characters', this.getPremadeCharacterItems, 'character');
      
          this.ui.topBarDynamicTitle.textContent = story.name || `${aiChar?.name || 'AI'} & ${userChar?.name || 'User'}`;
          await this._updateTopBarCharacterInfo('ai', aiChar);
          await this._updateTopBarCharacterInfo('user', userChar);
          
          await this.switchToScreen(this.CONSTANTS.VIEWS.STORY_INTERFACE); 
  
          this._loadCharacterImageToSidePanel('ai', aiChar);
          this._loadCharacterImageToSidePanel('user', userChar);
  
          this.ui.messageFeed.innerHTML = '';
          const messages = await this.db.messages.where({ storyId: story.id }).sortBy('timestamp');
          messages.forEach(msg => this._addMessageToFeed(msg));
          this._updateChatUIForNewMessage();
      
          this.ui.concludeStoryChatBtn.onclick = () => this.concludeStory(this.currentStoryId); 
          
          if (story.concluded) {
              this.showEl(this.ui.storyConcludedNotice);
              const concludedTextEl = this.ui.storyConcludedNotice.querySelector('.messageText');
              if (concludedTextEl && story.concludedTimestamp) {
                  concludedTextEl.textContent = `This story concluded on ${new Date(story.concludedTimestamp).toLocaleString()}`;
              }
              this.hideEl(this.ui.concludeStoryChatBtn);
              this.ui.messageInput.disabled = true;
              this.ui.sendButton.disabled = true;
              this.hideEl(this.ui.inputWrapper); 
          } else {
              this.hideEl(this.ui.storyConcludedNotice);
              this.ui.messageInput.disabled = false;
              this.ui.sendButton.disabled = false;
              this.showEl(this.ui.inputWrapper); 
          }
      
          this.checkAllButtonStates(); 
      },
  
      async concludeStory(storyId) {
          const storyBeforeConclusion = await this.db.stories.get(storyId);
          if (!storyBeforeConclusion || storyBeforeConclusion.concluded) {
              this.showTopNotification("Story not found or already concluded.", "error");
              return;
          }
      
          let concludeBtn;
          if (this.currentMainView === this.CONSTANTS.VIEWS.STORY_INTERFACE) {
              concludeBtn = this.ui.concludeStoryChatBtn;
          } else if (this.currentMainView === this.CONSTANTS.VIEWS.STORY_PROFILE) {
              concludeBtn = this.ui.storyProfileScreen.querySelector('#concludeStoryBtnStoryProfile');
          }
          if (!concludeBtn) concludeBtn = this.ui.concludeStoryChatBtn;
      
          await this._manageAiButtonState(concludeBtn, {
              actionAsyncFn: async (params, signal) => {
                  const { storyId } = params;
                  const currentStory = await this.db.stories.get(storyId);
                  
                  const allMessages = await this.db.messages.where({ storyId: storyId, isHidden: false }).sortBy('timestamp');
                  const chatTranscript = allMessages.map(msg => `${msg.role === 'user' ? (currentStory.storyUserCharacter?.name || 'USER') : (msg.role === 'bot' ? (currentStory.storyAiCharacter?.name || 'AI') : msg.role.toUpperCase())}: ${msg.content}`).join('\n\n');
                  console.log("[Conclude Story] Chat Transcript for AI:", chatTranscript);

                  const conclusionInstruction = `You are a skilled Storyteller. Read the following story transcript and write a compelling narrative conclusion. This is not just a summary, but the *final scene or epilogue* of the story. Focus on resolving immediate plot points, reflecting on character transformations, or describing the lasting impact of events. Aim for 1-3 evocative paragraphs.
                  Story Title: "${currentStory.name || 'Untitled Story'}"
                  AI Character: "${currentStory.storyAiCharacter?.name || 'AI Character'}" (Present state: ${currentStory.storyAiCharacter?.present || 'current state unknown'})
                  User Character: "${currentStory.storyUserCharacter?.name || 'User Character'}" (Present state: ${currentStory.storyUserCharacter?.present || 'current state unknown'})
                  World: "${currentStory.storyWorld?.name || 'World'}" (Present state: ${currentStory.storyWorld?.present || 'current state unknown'})
      
                  --- Transcript ---
                  ${chatTranscript}
                  --- End Transcript ---
      
                  Write the final narrative chapter for this story:`;
                  console.log("[Conclude Story] Conclusion Instruction sent to AI:", conclusionInstruction);

                  const conclusionResponse = await this._createAiRequest({ instruction: conclusionInstruction, signal });
                  console.log("[Conclude Story] AI Response for Conclusion:", conclusionResponse);

                  return {
                    conclusionText: conclusionResponse?.generatedText || "And so, their tale reached its conclusion, echoing in the annals of time.",
                    concludedStoryId: storyId
                  };
              },
              paramsForAction: { storyId },
              inputsToDisable: [this.ui.messageInput, this.ui.sendButton],
              onSuccess: async (result) => {
                  const { conclusionText, concludedStoryId } = result;
                  const conclusionTimestamp = Date.now();
      
                  await this.db.messages.add({
                      storyId: concludedStoryId,
                      role: 'narrator',
                      content: conclusionText,
                      timestamp: conclusionTimestamp
                  });
      
                  await this.db.stories.update(concludedStoryId, {
                      concluded: true,
                      concludedTimestamp: conclusionTimestamp,
                      summary: conclusionText
                  });
      
                  if (this.activeStoryId === concludedStoryId) {
                      await this.db.appState.update(0, { activeStoryId: null });
                      this.activeStoryId = null;
                  }
      
                  this.showTopNotification("Story concluded! The final chapter is written.", "success");
                  await this.switchToScreen(this.CONSTANTS.VIEWS.STORY_PROFILE, { storyId: concludedStoryId, originScreen: this.CONSTANTS.VIEWS.STORYBOARD });
              },
              onError: async (error, wasCancelled) => {
                  if (wasCancelled) {
                    this.showTopNotification("Story conclusion cancelled.", "info");
                  } else {
                    console.error("Error concluding story:", error);
                    this.showTopNotification("Failed to conclude story. There was an error with the AI or database. Check console for details.", "error");
                  }
              },
              isCancellable: true,
          });
      },
  
      async beginStory() {
          const storyName = this.ui.storyboardTitle.textContent.trim();
          const masterPrompt = this.ui.storyKickoffPromptTextarea.value.trim();
          const aiCharacterId_ref = this.ui.storyboardAiCharacterSelect.value;
          const userCharacterId_ref = this.ui.storyboardUserCharacterSelect.value;
          const worldId_ref = this.ui.storyboardWorldSelect.value;
      
          if (!aiCharacterId_ref || !userCharacterId_ref || !worldId_ref) {
              this.showTopNotification("Please select an AI Character, your Character, and a World.", "error");
              return;
          }
      
          const currentAppState = await this.getAppState();
          if (currentAppState.activeStoryId) {
              this.showTopNotification(`An active story already exists. Conclude it before starting a new one.`, "info", 4000);
              return;
          }
      
          // --- Start of Manual Loading State (Simplified as per user preference) ---
          this.ui.beginStoryBtn.disabled = true;
          const originalBeginButtonHTML = this.ui.beginStoryBtn.innerHTML;
          const originalCursor = document.body.style.cursor;
          document.body.style.cursor = 'wait';
          this.ui.beginStoryBtn.innerHTML = `<div class="spinner" style="width:20px; height:20px; border-width: 2px;"></div>`;
          
          const localAbortController = new AbortController();
          // Store the abort controller if we need to cancel it from elsewhere (e.g., page unload)
          this.activeAiButtons.set('beginStoryBtn', { abortController: localAbortController, originalHTML: originalBeginButtonHTML, originalCursor: originalCursor });


          try {
              const aiCharFull = await this._getIngredientData(aiCharacterId_ref, 'characters', this.getPremadeCharacterItems, 'character');
              const userCharFull = await this._getIngredientData(userCharacterId_ref, 'characters', this.getPremadeCharacterItems, 'character');
              const worldFull = await this._getIngredientData(worldId_ref, 'worlds', this.getPremadeWorldItems, 'world');
      
              if (!aiCharFull || !userCharFull || !worldFull) {
                  this.showTopNotification("Error fetching details for selected items.", "error");
                  throw new Error("Missing ingredient data.");
              }
              console.log("[beginStory] AI Character Data:", aiCharFull);
              console.log("[beginStory] User Character Data:", userCharFull);
              console.log("[beginStory] World Data:", worldFull);
      
              const snap = (item) => ({ ...item, id: undefined }); // Ensure ID is not carried over from DB/Premade
              const newStoryData = {
                  aiCharacterId: aiCharacterId_ref, userCharacterId: userCharacterId_ref, worldId: worldId_ref,
                  storyAiCharacter: snap(aiCharFull), storyUserCharacter: snap(userCharFull), storyWorld: snap(worldFull),
                  name: storyName, createdTimestamp: Date.now(), lastMessageTimestamp: Date.now(),
                  customJs: this.ui.customStoryJsTextarea.value, concluded: false, concludedTimestamp: null, summary: null
              };
              const newStoryId = await this.db.stories.add(newStoryData);
              await this.db.appState.update(0, { activeStoryId: newStoryId });
              this.activeStoryId = newStoryId;
              this.currentStoryId = newStoryId;
              this.currentAiCharacterId = aiCharacterId_ref;
              this.currentUserCharacterId = userCharacterId_ref;
      
              await this.switchToScreen(this.CONSTANTS.VIEWS.STORY_INTERFACE);
              
              // Update top bar with character information
              await this._updateTopBarCharacterInfo('ai', aiCharFull);
              await this._updateTopBarCharacterInfo('user', userCharFull);
      
              await this._setAiIsTyping(true, "Writing Prologue"); // Capitalized
              let prologueInstruction = `You are the Story Narrator. Write a compelling introductory prologue for a new story. The prologue should be immersive but concise, around 1-2 short paragraphs.
              **World:** ${worldFull.name} - ${worldFull.present}
              **Characters Present:** ${aiCharFull.name} (Present state: ${aiCharFull.present}) and ${userCharFull.name} (Present state: ${userCharFull.present}).
              Focus primarily on the 'Present' fields to set the immediate scene. Be concise and evocative.`;
              if (masterPrompt) {
                  prologueInstruction += `\n**The following is a master prompt that MUST guide the introduction, overriding other details if necessary:**\n${masterPrompt}`;
              }
              const prologueResponse = await this._createAiRequest({ instruction: prologueInstruction, signal: localAbortController.signal });
              
              if (localAbortController.signal.aborted) {
                  throw new Error("Cancelled"); // Propagate cancellation
              }

              const prologueText = prologueResponse?.generatedText || "The story begins...";
              await this.db.messages.add({ storyId: newStoryId, role: 'narrator', content: prologueText, timestamp: Date.now() - 2 });
              this._addMessageToFeed({ role: 'narrator', content: prologueText });
      
              await this._setAiIsTyping(true, `${aiCharFull.name || 'AI'} is thinking`);
              const firstMessageInstruction = `You are ${aiCharFull.name}. The story has just begun with this prologue: "${prologueText}". Speaking in the first person as ${aiCharFull.name}, what is your immediate, brief first action or line of dialogue? Consider your 'Present' state: ${aiCharFull.present}. Keep your response to 1-2 short paragraphs. Be concise.`;
              const firstMessageResponse = await this._createAiRequest({ instruction: firstMessageInstruction, signal: localAbortController.signal });

              if (localAbortController.signal.aborted) {
                  throw new Error("Cancelled"); // Propagate cancellation
              }

              if (firstMessageResponse?.generatedText) {
                  await this.db.messages.add({ storyId: newStoryId, role: 'bot', content: firstMessageResponse.generatedText, timestamp: Date.now() - 1, characterId: aiCharacterId_ref });
                  this._addMessageToFeed({ role: 'bot', content: firstMessageResponse.generatedText, characterId: aiCharacterId_ref });
              }
      
              this.showTopNotification("Story created! Let's begin.", "success");
              this.ui.concludeStoryChatBtn.onclick = () => this.concludeStory(newStoryId);
              this._updateChatUIForNewMessage();
      
          } catch (error) {
              if (error.message === "Cancelled") {
                  console.log("Story creation cancelled by user.");
                  this.showTopNotification("Story creation cancelled.", "info");
                  // Clean up partially created story if cancellation occurred during generation
                  if (this.activeStoryId) {
                      await this.db.messages.where({ storyId: this.activeStoryId }).delete().catch(e => console.error("Cleanup messages failed:", e));
                      await this.db.stories.delete(this.activeStoryId).catch(e => console.error("Cleanup story failed:", e));
                      await this.db.appState.update(0, { activeStoryId: null });
                      this.activeStoryId = null;
                      this.currentStoryId = null;
                  }
                  this.switchToScreen(this.CONSTANTS.VIEWS.STORYBOARD); // Always return to storyboard on cancel
              } else {
                  console.error("Failed to begin story:", error);
                  this.showTopNotification("Error creating story.", "error");
                  if (this.activeStoryId) {
                      await this.db.stories.delete(this.activeStoryId).catch(e => console.error("Cleanup failed:", e));
                      await this.db.appState.update(0, { activeStoryId: null });
                      this.activeStoryId = null;
                  }
                  this.switchToScreen(this.CONSTANTS.VIEWS.STORYBOARD);
              }
          } finally {
              await this._setAiIsTyping(false);
              this.ui.beginStoryBtn.disabled = false;
              this.ui.beginStoryBtn.innerHTML = originalBeginButtonHTML; // Restore original HTML
              document.body.style.cursor = originalCursor; // Restore original cursor
              this.activeAiButtons.delete('beginStoryBtn'); // Clean up the stored controller
              this.checkAllButtonStates();
          }
      },
  
      createMessage(role, content, characterId = null) {
          return {
              storyId: this.currentStoryId,
              role: role,
              content: content,
              timestamp: Date.now(),
              characterId: characterId,
              isHidden: false
          };
      },
  
      async sendButtonClickHandler() {
          const content = this.ui.messageInput.value.trim();
          if (this.ui.sendButton.disabled || !content || !this.currentStoryId) return;
      
          const message = this.createMessage('user', content, this.currentUserCharacterId);
          this.ui.messageInput.value = '';
          this.ui.messageInput.style.height = 'auto';
      
          this._addMessageToFeed(message);
          await this.db.messages.add(message);
          this._updateChatUIForNewMessage();
      
          this.ui.sendButton.disabled = true;
      
          try {
              const story = await this.db.stories.get(this.currentStoryId);
              const aiCharName = story?.storyAiCharacter?.name || 'AI';
              
              if(this.ui.concludeStoryChatBtn) this.ui.concludeStoryChatBtn.disabled = true;
              await this._setAiIsTyping(true, `${aiCharName} is thinking`);
              
              const aiResponse = await this._createAiRequest({
                  instruction: await this._getSystemPrompt(),
                  userMessage: content,
                  chatHistory: await this._getChatHistoryForAI()
              });
      
              if (aiResponse?.generatedText) {
                  const botMessage = this.createMessage('bot', aiResponse.generatedText, story.aiCharacterId);
                  await this.db.messages.add(botMessage); // Add to DB first
                  this._addMessageToFeed(botMessage); // Then add to UI
                  await this.db.stories.update(this.currentStoryId, { lastMessageTimestamp: Date.now() });
              }
          } catch(error) {
              console.error("AI Error:", error);
              this.showTopNotification("The AI failed to respond. Please try again.", "error");
          } finally {
              await this._setAiIsTyping(false);
              this.ui.sendButton.disabled = false;
              if(this.ui.concludeStoryChatBtn) this.ui.concludeStoryChatBtn.disabled = false;
              this.ui.messageInput.focus();
              this._updateChatUIForNewMessage();
              this.checkAllButtonStates(); // Ensure all button states are re-evaluated
          }
      },
  
      _addMessageToFeed(message, isForProfileScreen = false) {
          if (!message || message.isHidden) return;
          const messageEl = document.createElement('div');
          let msgClass;
          if (message.role === 'bot') msgClass = 'botMessage';
          else if (message.role === 'user') msgClass = 'userMessage';
          else if (message.role === 'narrator') msgClass = 'narratorMessage';
          else msgClass = 'systemMessage'; 
          
          messageEl.className = `message ${msgClass}`;
          if (message.id) messageEl.id = `message-wrapper-${message.id}`;
      
          let actionsHtml = '';
          // Only render regenerate button if message has an ID (i.e., saved to DB) and is a bot message, and not on profile screen
          if (message.role === 'bot' && message.id && !isForProfileScreen) {
              actionsHtml = `
                  <div class="message-actions">
                      <button id="regenerate-btn-${message.id}" class="message-action-button" title="Regenerate this response" onclick="App.regenerateMessage(this, ${message.id})">🔄</button>
                  </div>
              `;
          }
      
          messageEl.innerHTML = `
              <div class="messageWrap">
                  <div class="messageContentContainer">
                      ${actionsHtml}
                      <div class="messageText" id="message-text-${message.id || ''}">${this.sanitizeHtml(message.content).replace(/\n/g, '<br>')}</div>
                  </div>
              </div>`;
          
          const feed = isForProfileScreen ? this.ui.storyProfileMessageFeed : this.ui.messageFeed;
          feed.appendChild(messageEl);
          this.checkAllButtonStates(); // Re-check button states after adding message (important for regenerate)
      },
  
      _updateChatUIForNewMessage() {
          const feed = this.currentMainView === this.CONSTANTS.VIEWS.STORY_PROFILE ? this.ui.storyProfileMessageFeed : this.ui.messageFeed;
          if (!feed) return;
          
          feed.scrollTop = feed.scrollHeight;
          
          if (this.ui.noMessagesNotice) { 
              this.ui.noMessagesNotice.classList.toggle('hidden', feed.children.length > 0 || !this.ui.storyConcludedNotice.classList.contains('hidden'));
          }
      },
  
      async _setAiIsTyping(isTyping, customMessage = null) {
          if (this.statusNotifierIntervalId) {
              clearInterval(this.statusNotifierIntervalId);
              this.statusNotifierIntervalId = null;
          }
      
          if (isTyping && (this.currentStoryId || customMessage) ) {
              let baseMessage = customMessage || '';
              if (!customMessage && this.currentStoryId) {
                  const story = await this.db.stories.get(this.currentStoryId);
                  const aiCharName = story?.storyAiCharacter?.name || 'AI';
                  baseMessage = `${this.sanitizeHtml(aiCharName)} is thinking`;
              }
              this.ui.typingIndicatorText.textContent = this.sanitizeHtml(baseMessage);
              
              let seconds = 0;
              this.statusNotifierIntervalId = setInterval(() => {
                  seconds++;
                  this.ui.typingIndicatorText.textContent = `${this.sanitizeHtml(baseMessage)} (${seconds}s)`;
              }, 1000);
      
          } else {
              this.ui.typingIndicatorText.textContent = 'AI is thinking'; 
          }
          this.ui.statusNotifier.classList.toggle('hidden', !isTyping);
      },
  
      _cancelCurrentAiRequest() {
        // Iterate over a copy of the keys to avoid issues if map is modified during iteration
        for (let buttonId of Array.from(this.activeAiButtons.keys())) {
          const state = this.activeAiButtons.get(buttonId);
          if (state && state.abortController) {
            console.log(`[App] Cancelling AI request for button: ${buttonId}`);
            state.abortController.abort();
            // If it's a _manageAiButtonState controlled button, it will restore itself.
            // For beginStory (manual control), we need to manually restore its state here as well.
            if (buttonId === 'beginStoryBtn') {
                this.ui.beginStoryBtn.disabled = false;
                this.ui.beginStoryBtn.innerHTML = state.originalHTML;
                document.body.style.cursor = state.originalCursor;
                this.activeAiButtons.delete('beginStoryBtn'); // Clean up the stored controller
            }
          }
        }
        this.checkAllButtonStates();
      },
  
      async _createAiRequest(options) {
          return await window.root.aiTextPlugin(options);
      },
  
      async _getSystemPrompt(storyIdOverride = null) {
          const storyIdToUse = storyIdOverride || this.currentStoryId;
          const story = await this.db.stories.get(storyIdToUse);
          if (!story) return "Error: Story data not found for system prompt.";
      
          const aiChar = story.storyAiCharacter;
          const userChar = story.storyUserCharacter;
          const world = story.storyWorld;
      
          if (!aiChar || !userChar || !world) {
              console.warn("Snapshot data missing for story:", storyIdToUse, ". Prompt quality may be affected.");
              return `You are a helpful AI. Please continue the story.`;
          }
      
          return `You are the narrator and the AI character in this role-playing story. Your AI character is: ${aiChar.name}. The user's character is: ${userChar.name}. The world is: ${world.name}.
          **AI Character Details (${aiChar.name}):** - Eternal: ${aiChar.eternal} - Past: ${aiChar.past} - Present: ${aiChar.present} - Future: ${aiChar.future}
          **User Character Details (${userChar.name}):** - Eternal: ${userChar.eternal} - Past: ${userChar.past} - Present: ${userChar.present} - Future: ${userChar.future}
          **World Details (${world.name}):** - Eternal: ${world.eternal} - Past: ${world.past} - Present: ${world.present} - Future: ${world.future}
          **Your Role:** 1. Portray your character (${aiChar.name}) authentically, speaking in the first person. 2. Act as the narrator for world events and other NPC actions. 3. Drive the story forward. 4. Respond to the user's last message. Keep your narrative responses and character dialogue concise, typically 1-2 short paragraphs, unless the user's action or query clearly necessitates a more detailed explanation.
          **Formatting:** Narrated actions as plain text. Your character's (${aiChar.name}) dialogue in double quotes. Do NOT label who is speaking (e.g., avoid writing "${aiChar.name}:").`;
      },
  
      async _getChatHistoryForAI() {
          const messages = await this.db.messages.where({ storyId: this.currentStoryId }).sortBy('timestamp');
          const recentMessages = messages.filter(msg => !msg.isHidden).slice(-20); 
          return recentMessages.map(msg => ({ role: msg.role === 'bot' ? 'assistant' : 'user', content: msg.content }));
      },

      async _collectMemoriesFromStory(storyId) {
          if (!storyId) {
              console.warn("_collectMemoriesFromStory called without a storyId.");
              return [];
          }
      
          const messages = await this.db.messages.where({ storyId }).toArray();
          if (!messages || messages.length === 0) {
              return [];
          }
      
          const memorySet = new Set();
      
          messages.forEach(message => {
              if (message.memoriesEndingHere && typeof message.memoriesEndingHere === 'object') {
                  // Iterate over different memory levels (e.g., '1', '2')
                  for (const level in message.memoriesEndingHere) {
                      const memoriesAtLevel = message.memoriesEndingHere[level];
                      if (Array.isArray(memoriesAtLevel)) {
                          memoriesAtLevel.forEach(memoryObj => {
                              // Ensure we have a valid memory object with text
                              if (memoryObj && typeof memoryObj.text === 'string' && memoryObj.text.trim() !== '') {
                                  memorySet.add(memoryObj.text.trim());
                              }
                          });
                      }
                  }
              }
          });
      
          // Convert the Set of unique memories back to an array
          return Array.from(memorySet);
      },

      async _renderMemoryApplicationScreen(options = {}) {
          const { storyId } = options;
          if (!storyId) {
              this.showTopNotification("Error: Story ID missing for memory application.", "error");
              return this.switchToScreen(this.CONSTANTS.VIEWS.STORYBOARD);
          }
      
          const container = this.ui.memoryApplicationScreen;
          container.innerHTML = `<div class="p-4 text-center">Loading memories...</div>`; // Loading state
      
          this.ui.topBarDynamicTitle.textContent = 'Apply Story Memories';
          const memories = await this._collectMemoriesFromStory(storyId);
          const story = await this.db.stories.get(storyId);
      
          if (!story) {
              this.showTopNotification("Error: Could not find story data.", "error");
              return this.switchToScreen(this.CONSTANTS.VIEWS.STORYBOARD);
          }
          
          // If no memories were generated, skip this screen and go straight to the profile.
          if (memories.length === 0) {
              this.showTopNotification("No new memories were extracted from this story.", "info", 4000);
              return this.switchToScreen(this.CONSTANTS.VIEWS.STORY_PROFILE, { storyId });
          }
      
          const aiChar = story.storyAiCharacter;
          const userChar = story.storyUserCharacter;
          const world = story.storyWorld;
          
          const targets = [
              { id: story.aiCharacterId, name: aiChar.name, type: 'character' },
              { id: story.userCharacterId, name: userChar.name, type: 'character' },
              { id: story.worldId, name: world.name, type: 'world' }
          ];
      
          const san = this.sanitizeHtml;
      
          let memoryItemsHtml = memories.map((memory, index) => {
              const targetOptions = targets.map(target => `<option value="${target.id}">${san(target.name)} (${target.type})</option>`).join('');
              
              return `
                  <div class="memory-item" data-memory-index="${index}">
                      <div class="memory-item-selector">
                          <input type="checkbox" id="mem-check-${index}" checked>
                      </div>
                      <div class="memory-item-text" data-memory-text="${san(memory)}">
                          ${san(memory)}
                      </div>
                      <div class="memory-item-controls">
                          <select id="mem-target-${index}" class="mem-target-select">
                              ${targetOptions}
                          </select>
                          <select id="mem-field-${index}" class="mem-field-select">
                              <option value="past">Past (Histories & Legends)</option>
                              <option value="eternal">Eternal (Truths & Traits)</option>
                              <option value="present">Present (State & Setting)</option>
                              <option value="future">Future (Potentials & Hooks)</option>
                          </select>
                      </div>
                  </div>
              `;
          }).join('');
      
          container.innerHTML = `
              <div class="memory-app-header">
                  <h2>Apply Story Memories</h2>
                  <p>The following "timeless facts" were extracted from your story. Choose which ones to apply to your Characters and World profiles to ensure they remember these events in the future.</p>
              </div>
              <div class="memory-list-container">
                  ${memoryItemsHtml}
              </div>
              <div class="memory-app-actions">
                  <button id="skipMemoryApplicationBtn" class="secondary-action-button">Skip for Now</button>
                  <button id="applyMemoriesBtn" class="primary-action-button">Apply Memories</button>
              </div>
          `;
      
          container.querySelector('#applyMemoriesBtn').onclick = () => this._applyMemoriesToProfiles(storyId);
          container.querySelector('#skipMemoryApplicationBtn').onclick = () => this.switchToScreen(this.CONSTANTS.VIEWS.STORY_PROFILE, { storyId });
      },

      async _applyMemoriesToProfiles(storyId) {
          const container = this.ui.memoryApplicationScreen;
          const memoryItems = container.querySelectorAll('.memory-item');
          const updates = new Map(); // Key: targetId, Value: { fields: { past: [], eternal: [] ... } }
      
          memoryItems.forEach(item => {
              const checkbox = item.querySelector('input[type="checkbox"]');
              if (!checkbox.checked) return;
      
              const memoryText = item.querySelector('.memory-item-text').dataset.memoryText;
              const targetId = item.querySelector('.mem-target-select').value;
              const targetField = item.querySelector('.mem-field-select').value;
      
              if (!updates.has(targetId)) {
                  updates.set(targetId, { fields: { eternal: [], past: [], present: [], future: [] } });
              }
              updates.get(targetId).fields[targetField].push(memoryText);
          });
      
          if (updates.size === 0) {
              this.showTopNotification("No memories were selected to apply.", "info");
              return this.switchToScreen(this.CONSTANTS.VIEWS.STORY_PROFILE, { storyId });
          }
      
          const story = await this.db.stories.get(storyId);
      
          for (const [targetId, data] of updates.entries()) {
              let dbTableKey;
              let item;
      
              if (targetId == story.aiCharacterId || targetId == story.userCharacterId) {
                  dbTableKey = 'characters';
                  item = await this.db.characters.get(parseInt(targetId, 10));
              } else if (targetId == story.worldId) {
                  dbTableKey = 'worlds';
                  item = await this.db.worlds.get(parseInt(targetId, 10));
              }
      
              if (item) {
                  let itemUpdated = false;
                  for (const field in data.fields) {
                      if (data.fields[field].length > 0) {
                          const memoriesToAdd = data.fields[field].map(mem => `- ${mem}`).join('\\n');
                          // Append with a newline if the field already has content
                          item[field] = item[field] ? `${item[field]}\\n${memoriesToAdd}` : memoriesToAdd;
                          itemUpdated = true;
                      }
                  }
                  if (itemUpdated) {
                      await this.db[dbTableKey].update(item.id, item);
                  }
              }
          }
      
          this.showTopNotification("Memories successfully applied to profiles!", "success");
          this.switchToScreen(this.CONSTANTS.VIEWS.STORY_PROFILE, { storyId });
      },
      
      async _updateStoryboard(options = {}) {
          const populateSelect = async (selectEl, config, selectedId) => {
              const selectType = selectEl === this.ui.storyboardAiCharacterSelect ? 'AI Character' : 
                                 selectEl === this.ui.storyboardUserCharacterSelect ? 'Your Character' : 
                                 'World';
              selectEl.innerHTML = `<option value="" disabled selected>Select ${selectType}</option>`;
              
              const newOption = new Option(`+ Create New ${config.capital}...`, `create_new_${config.itemType}`);
              newOption.style.fontStyle = 'italic';
              selectEl.appendChild(newOption); 
  
              const allUserItems = await this.db[config.dbTableKey].toArray();
              const userItems = allUserItems.filter(item => item.isDeleted !== true).sort((a, b) => (b.createdTimestamp || 0) - (a.createdTimestamp || 0));
              const premadeItems = config.getPreMadesFn();
  
              const userGroup = document.createElement('optgroup');
              userGroup.label = `Your ${config.capital}s`;
              userItems.forEach(item => userGroup.appendChild(new Option(item.name, String(item.id)))); 
              selectEl.appendChild(userGroup);
  
              const premadeGroup = document.createElement('optgroup');
              premadeGroup.label = `Premade ${config.capital}s`;
              premadeItems.forEach(item => premadeGroup.appendChild(new Option(item.name, `premade_${config.itemType}:${item.id}`)));
              selectEl.appendChild(premadeGroup);
  
  
              if (selectedId) selectEl.value = String(selectedId); 
          };
  
          await populateSelect(this.ui.storyboardAiCharacterSelect, this.CONSTANTS.ITEM_CONFIG.character, options.preSelectedAiCharacterId);
          await populateSelect(this.ui.storyboardUserCharacterSelect, this.CONSTANTS.ITEM_CONFIG.character, options.preSelectedUserCharacterId || this.currentUserCharacterId);
          await populateSelect(this.ui.storyboardWorldSelect, this.CONSTANTS.ITEM_CONFIG.world, options.preSelectedWorldId);
  
          const updateCardAndTitle = async (selectEl, cardEl, config) => {
              const selectedValue = selectEl.value;
              if (selectedValue.startsWith('create_new_')) {
                  this.switchToScreen(config.formScreen, { 
                      isCreating: true, 
                      originScreen: this.CONSTANTS.VIEWS.STORYBOARD, 
                      itemType: config.itemType, 
                      forAiCharacter: selectEl === this.ui.storyboardAiCharacterSelect, 
                      forUserCharacter: selectEl === this.ui.storyboardUserCharacterSelect,
                      preSelectedAiCharacterId: this.ui.storyboardAiCharacterSelect.value,
                      preSelectedUserCharacterId: this.ui.storyboardUserCharacterSelect.value,
                      preSelectedWorldId: this.ui.storyboardWorldSelect.value
                  });
                  return;
              }
              const item = await this._getIngredientData(selectedValue, config.dbTableKey, config.getPreMadesFn, config.itemType);
              this._renderStoryboardCard(cardEl, item, config);
              this.updateDynamicStoryboardTitle(); // Update title after each card updates
          };
  
          this.ui.storyboardAiCharacterSelect.onchange = async () => {
              await updateCardAndTitle(this.ui.storyboardAiCharacterSelect, this.ui.storyboardAiCharacterCard, this.CONSTANTS.ITEM_CONFIG.character);
              this.checkAllButtonStates();
          };
          this.ui.storyboardUserCharacterSelect.onchange = async () => {
              await updateCardAndTitle(this.ui.storyboardUserCharacterSelect, this.ui.storyboardUserCharacterCard, this.CONSTANTS.ITEM_CONFIG.character);
              this.currentUserCharacterId = this.ui.storyboardUserCharacterSelect.value;
              await this._updateTopBarCharacterInfo('user');
              await this.saveAppState();
              this.checkAllButtonStates();
          };
          this.ui.storyboardWorldSelect.onchange = async () => {
              await updateCardAndTitle(this.ui.storyboardWorldSelect, this.ui.storyboardWorldCard, this.CONSTANTS.ITEM_CONFIG.world);
              this.checkAllButtonStates();
          };
  
          await Promise.all([
              updateCardAndTitle(this.ui.storyboardAiCharacterSelect, this.ui.storyboardAiCharacterCard, this.CONSTANTS.ITEM_CONFIG.character),
              updateCardAndTitle(this.ui.storyboardUserCharacterSelect, this.ui.storyboardUserCharacterCard, this.CONSTANTS.ITEM_CONFIG.character),
              updateCardAndTitle(this.ui.storyboardWorldSelect, this.ui.storyboardWorldCard, this.CONSTANTS.ITEM_CONFIG.world)
          ]);
          
          if (this.ui.storyboardUserCharacterSelect.value) {
              this.currentUserCharacterId = this.ui.storyboardUserCharacterSelect.value;
          } else {
              this.currentUserCharacterId = ""; 
          }
          await this._updateTopBarCharacterInfo('user');
          
          this.checkAllButtonStates();
      },
  
      _renderStoryboardCard(cardEl, item, config) {
          if (!item) {
              const selectType = cardEl === this.ui.storyboardAiCharacterCard ? 'AI Character' : 
                                 cardEl === this.ui.storyboardUserCharacterCard ? 'Your Character' : 
                                 'World';
              cardEl.className = 'story-board-ingredient-card empty-card';
              cardEl.innerHTML = `Select ${selectType}`;
              cardEl.onclick = null;
              cardEl.style.backgroundImage = ''; // Clear background image
              return;
          }
          cardEl.className = 'story-board-ingredient-card';
          const displayId = item.id; 
          const isActuallyPremade = (typeof item.id === 'string' && item.id.startsWith('premade_')) || item.isPremade;
      
          const avatarUrl = this.sanitizeHtml(item.avatar || '');
          
          // Render content over the background image, ensuring the image panel is always present
          cardEl.innerHTML = `
              <div class="card-image-panel" style="${avatarUrl ? `background-image: url('${avatarUrl}');` : ''}"></div>
              <div class="card-details-panel">
                  <h3 class="card-name">${this.sanitizeHtml(item.name)}</h3>
                  <p class="card-description">${this.sanitizeHtml(item.description)}</p>
                  ${isActuallyPremade ? '<span class="premade-tag-card">(Premade)</span>' : ''}
              </div>`;
          cardEl.onclick = () => this.switchToScreen(config.profileScreen, { 
              itemId: displayId, 
              itemType: config.itemType, 
              originScreen: this.CONSTANTS.VIEWS.STORYBOARD
          });
      },
  
      updateDynamicStoryboardTitle() {
          if (this.storyboardTitleUserEdited) return;
  
          const getSelectedText = (selectEl) => {
              if (!selectEl || selectEl.selectedIndex < 0) return null;
              const text = selectEl.options[selectEl.selectedIndex]?.text;
              return (text && !text.includes('Select') && !text.includes('+ Create')) ? text : null;
          };
  
          const aiCharName = getSelectedText(this.ui.storyboardAiCharacterSelect);
          const userCharName = getSelectedText(this.ui.storyboardUserCharacterSelect);
          const worldName = getSelectedText(this.ui.storyboardWorldSelect);
  
          let titleParts = [];
          if (aiCharName) titleParts.push(aiCharName);
          if (userCharName) titleParts.push(userCharName);
          
          let finalTitle;
          if (titleParts.length === 2) {
              finalTitle = `${titleParts[0]} & ${titleParts[1]}`;
              if (worldName) finalTitle += ` in ${worldName}`;
          } else if (titleParts.length === 1) {
              finalTitle = titleParts[0]; // Use the single character name
              if (worldName) finalTitle += ` in ${worldName}`;
          } else if (worldName) {
              finalTitle = `Story in ${worldName}`;
          } else {
              finalTitle = 'Untitled Story';
          }
          this.ui.storyboardTitle.textContent = finalTitle;
      },
  
      async _shuffleStoryboard() {
          const getRandomOption = (selectEl) => {
              const options = Array.from(selectEl.querySelectorAll('option:not([disabled]):not([value^="create_new_"])'));
              if (options.length > 0) {
                  const randomOption = options[Math.floor(Math.random() * options.length)];
                  selectEl.value = randomOption.value;
              }
          };
          getRandomOption(this.ui.storyboardAiCharacterSelect);
          getRandomOption(this.ui.storyboardUserCharacterSelect);
          getRandomOption(this.ui.storyboardWorldSelect);
          this.ui.storyboardAiCharacterSelect.dispatchEvent(new Event('change'));
          this.ui.storyboardUserCharacterSelect.dispatchEvent(new Event('change'));
          this.ui.storyboardWorldSelect.dispatchEvent(new Event('change'));
      },
  
      async _handleAiCoWriter(button, itemType, shouldRefine, targetTextarea) {
          const form = document.getElementById(`${itemType}FormMain`);
          if (!form || !targetTextarea) return;
          
          let name;
          if (itemType === 'character') {
              const nameEditableDiv = form.querySelector(`#${itemType}NameEditable`);
              name = nameEditableDiv ? nameEditableDiv.textContent.trim() : (form.querySelector(`#${itemType}Name`)?.value.trim() || '');
          } else {
              name = form.querySelector(`#${itemType}Name`)?.value.trim() || '';
          }
  
          const trait = button.dataset.trait;
          const itemConfig = this.CONSTANTS.ITEM_CONFIG[itemType];
          const traitLabel = itemConfig.labels[trait.toLowerCase()].main;
          const traitPlaceholder = itemConfig.labels[`${trait.toLowerCase()}Placeholder`];
          const itemNameForPrompt = name || `this ${itemType}`;
          let instruction;
  
          if (shouldRefine) {
              const existingText = targetTextarea.value.trim();
              instruction = `You are a master creative editor. Enhance the existing text for the trait "${traitLabel}" for ${itemNameForPrompt}. Make it more evocative, detailed, unique, and narratively rich. Expand on ideas, add depth, and ensure strong storytelling potential. Consider this official guidance for what this trait represents: "${traitPlaceholder}". Avoid clichés. Focus on unique, actionable details. Output only the improved text for the trait.
              Existing text: ${existingText}`;
          } else {
              instruction = `You are an acclaimed creative writer. For ${itemNameForPrompt}, invent a compelling, original, and narratively rich paragraph for the trait: **${traitLabel}**. Avoid clichés and generic statements. Focus on unique details, potential plot hooks, strong imagery, or defining characteristics that are specific and memorable. Consider this official guidance for what this trait represents: "${traitPlaceholder}". Write in a descriptive, engaging style. Output only the text for the paragraph.`;
          }
          
          const originalText = targetTextarea.value;
          await this._manageAiButtonState(button, {
              actionAsyncFn: this._createAiRequest,
              paramsForAction: { instruction },
              inputsToDisable: [targetTextarea], // FIX: Only disable the specific textarea
              onSuccess: (response) => {
                  if (response?.generatedText) {
                      targetTextarea.value = response.generatedText;
                      targetTextarea.dispatchEvent(new Event('input'));
                  }
              },
              onError: (error, wasCancelled) => {
                  if (wasCancelled) {
                      targetTextarea.value = originalText;
                  } else {
                    console.error("AI Co-writer error:", error);
                    this.showTopNotification("AI helper failed.", "error");
                  }
              },
              isCancellable: true,
          });
      },
  
      async _handleSummarize(button, itemType) {
          const form = document.getElementById(`${itemType}FormMain`);
          if (!form) return;
  
          let name;
          if (itemType === 'character') {
              const nameEditableDiv = form.querySelector(`#${itemType}NameEditable`);
              name = nameEditableDiv ? nameEditableDiv.textContent.trim() : (form.querySelector(`#${itemType}Name`)?.value.trim() || '');
          } else {
              name = form.querySelector(`#${itemType}Name`)?.value.trim() || '';
          }
          const eternal = form.querySelector(`#${itemType}Eternal`).value;
          const past = form.querySelector(`#${itemType}Past`).value;
          const present = form.querySelector(`#${itemType}Present`).value;
          const future = form.querySelector(`#${itemType}Future`).value;
          const descriptionTextarea = form.querySelector(`#${itemType}Description`);
          const itemNameForPrompt = name || `this ${itemType}`;
  
          const allText = `Item: ${itemNameForPrompt}\nEternal: ${eternal}\nPast: ${past}\nPresent: ${present}\nFuture: ${future}`;
          const instruction = `You are a skilled editor. Read the following character or world details and write a single, concise sentence that summarizes it for a quick-glance card. This summary will appear on selection cards and should be very brief and impactful. Output only the single sentence.\n\nDETAILS:\n${allText}`;
  
          const originalText = descriptionTextarea.value;
          await this._manageAiButtonState(button, {
              actionAsyncFn: this._createAiRequest,
              paramsForAction: { instruction },
              targetTextarea: descriptionTextarea,
              onSuccess: (response) => {
                  if (response?.generatedText) {
                      descriptionTextarea.value = response.generatedText;
                  }
              },
              onError: (error, wasCancelled) => {
                  if(wasCancelled) {
                    descriptionTextarea.value = originalText;
                  } else {
                    console.error("AI Summarize error:", error);
                    this.showTopNotification("AI Summarizer failed.", "error");
                  }
              },
              isCancellable: true,
          });
      },
  
      _restoreButtonToOriginalState(buttonId) {
          const button = document.getElementById(buttonId);
          const originalState = this.activeAiButtons.get(buttonId);
      
          if (!button || !originalState) {
              if (originalState?.cancelIntervalId) clearInterval(originalState.cancelIntervalId);
              this.activeAiButtons.delete(buttonId);
              return;
          }
      
          clearInterval(originalState.cancelIntervalId);
      
          button.innerHTML = originalState.originalHTML;
          button.onclick = originalState.originalOnClick;
          button.disabled = originalState.originalDisabled;
          button.className = '';
          originalState.originalClasses.forEach(cls => button.classList.add(cls));
      
          if (originalState.inputsToDisable) {
              originalState.inputsToDisable.forEach(input => {
                  if (input) {
                    input.disabled = false;
                    const wrapper = input.closest('.form-field-wrapper');
                    if (wrapper) wrapper.classList.remove('ai-busy');
                    input.classList.remove('busy-cursor');
                  }
              });
          }
      
          this.activeAiButtons.delete(buttonId);
          this.checkAllButtonStates();
      },
      
      async _manageAiButtonState(button, config) {
          // --- 1. Defensive Checks ---
          // Ensure we have a button and a function to run. This prevents silent failures.
          if (!button) {
              console.warn("_manageAiButtonState called with a null button.");
              return;
          }
          if (!config || typeof config.actionAsyncFn !== 'function') {
              console.error("_manageAiButtonState requires a configuration object with an 'actionAsyncFn'.", { button, config });
              return;
          }
      
          const buttonId = button.id || `ai-btn-${Math.random().toString(36).substring(7)}`;
          if (!button.id) button.id = buttonId;
      
          if (this.activeAiButtons.has(buttonId)) {
              console.warn("This AI button is already processing:", buttonId);
              return;
          }
      
          // --- 2. State Setup ---
          // Create a unique controller for this specific action and store the button's original state.
          const localAbortController = new AbortController();
          const originalState = {
              originalHTML: button.innerHTML,
              originalOnClick: button.onclick,
              originalDisabled: button.disabled,
              originalClasses: Array.from(button.classList),
              inputsToDisable: config.inputsToDisable || (config.targetTextarea ? [config.targetTextarea] : []),
              cancelIntervalId: null,
              abortController: localAbortController
          };
          
          if (config.relatedUseButton && !originalState.inputsToDisable.includes(config.relatedUseButton)) {
              originalState.inputsToDisable.push(config.relatedUseButton);
          }
          this.activeAiButtons.set(buttonId, originalState);
      
          // --- 3. Apply Busy/Cancellable UI State ---
          // This section handles all visual changes to indicate an action is in progress.
          originalState.originalClasses.forEach(c => button.classList.remove(c));
          button.classList.add('cancel-ai-button', 'ai-active');
          button.disabled = false;
          
          const formFieldWrapper = button.closest('.form-field-wrapper');
          if (formFieldWrapper) formFieldWrapper.classList.add('ai-busy');
      
          originalState.inputsToDisable.forEach(input => {
              if (input) {
                  input.disabled = true;
                  input.classList.add('busy-cursor');
                  const wrapper = input.closest('.form-field-wrapper');
                  if (wrapper) wrapper.classList.add('ai-busy');
              }
          });
      
          let seconds = 0;
          const updateButtonText = () => {
              const buttonText = button.classList.contains('ai-helper-button') ? "Cancel Refine" : "Cancel";
              button.innerHTML = `<span class="button-text">${buttonText} (${seconds}s)</span><span class="button-icon">⏱️</span>`;
          };
          updateButtonText();
          originalState.cancelIntervalId = setInterval(() => {
              seconds++;
              updateButtonText();
          }, 1000);
      
          // The cancel button's only job is to trigger the abort signal.
          // The 'finally' block will handle all UI cleanup.
          button.onclick = (e) => {
              if (e) e.stopPropagation();
              localAbortController.abort();
          };
      
          this.checkAllButtonStates();
      
          // --- 4. Execute Action and Handle Cleanup ---
          try {
              const result = await config.actionAsyncFn(config.paramsForAction, localAbortController.signal);
              // Only run success logic if the operation wasn't cancelled.
              if (!localAbortController.signal.aborted) {
                  if (config.onSuccess) await config.onSuccess(result);
              }
          } catch (error) {
              // Differentiate between a user cancellation and a genuine error.
              if (localAbortController.signal.aborted) {
                  console.log(`Operation cancelled by user: ${buttonId}`);
                  if (config.onError) config.onError(new Error("Cancelled"), true);
              } else {
                  console.error("AI Action Error:", error);
                  if (config.onError) config.onError(error, false);
                  else this.showTopNotification("An AI error occurred.", "error");
              }
          } finally {
              // This block GUARANTEES UI cleanup, regardless of success, failure, or cancellation.
              if (this.activeAiButtons.has(buttonId)) {
                  this._restoreButtonToOriginalState(buttonId);
              }
              if (config.onFinally) await config.onFinally();
              this.checkAllButtonStates();
          }
      },

      async regenerateMessage(buttonElement, messageId) {
          const inputsToDisable = [
              this.ui.messageInput,
              this.ui.sendButton,
              this.ui.concludeStoryChatBtn,
          ];
          // Collect all other message action buttons to disable them
          document.querySelectorAll('.message-action-button').forEach(btn => {
              if (btn !== buttonElement) { // Don't disable the button that was clicked
                  inputsToDisable.push(btn);
              }
          });
          
          await this._manageAiButtonState(buttonElement, {
              actionAsyncFn: async (params, signal) => {
                  const { messageId } = params;
                  const allMessages = await this.db.messages.where({ storyId: this.currentStoryId }).toArray();
                  allMessages.sort((a, b) => a.timestamp - b.timestamp);
                  const messageIndex = allMessages.findIndex(m => m.id === messageId);
                  
                  if (messageIndex === -1 || messageIndex === 0) throw new Error("Cannot regenerate this message.");
                  
                  const userPromptMessage = allMessages[messageIndex - 1];
                  if (userPromptMessage.role !== 'user') throw new Error("Could not find the user prompt for this message.");

                  const chatHistoryForAI = allMessages.slice(0, messageIndex - 1)
                      .filter(msg => !msg.isHidden && (msg.role === 'user' || msg.role === 'bot'))
                      .map(msg => ({ role: msg.role === 'bot' ? 'assistant' : 'user', content: msg.content }));

                  const aiResponse = await this._createAiRequest({
                      instruction: await this._getSystemPrompt(),
                      userMessage: userPromptMessage.content,
                      chatHistory: chatHistoryForAI,
                      signal
                  });

                  return { aiResponse, messageIndex, allMessages };
              },
              paramsForAction: { messageId },
              inputsToDisable: inputsToDisable,
              onSuccess: async ({ aiResponse, messageIndex, allMessages }) => {
                  if (!aiResponse?.generatedText) {
                      this.showTopNotification("AI did not provide a new response.", "info");
                      return;
                  }

                  const newContent = aiResponse.generatedText;

                  await this.db.messages.update(messageId, { content: newContent });
                  const messageTextElement = document.getElementById(`message-text-${messageId}`);
                  if (messageTextElement) {
                      messageTextElement.innerHTML = this.sanitizeHtml(newContent).replace(/\n/g, '<br>');
                  }

                  const messagesToDelete = allMessages.slice(messageIndex + 1);
                  if (messagesToDelete.length > 0) {
                      const idsToDelete = messagesToDelete.map(m => m.id);
                      await this.db.messages.bulkDelete(idsToDelete);

                      messagesToDelete.forEach(msg => {
                          const messageElement = document.getElementById(`message-wrapper-${msg.id}`);
                          if (messageElement) messageElement.remove();
                      });
                      this.showTopNotification("Response regenerated and subsequent conversation removed.", "success", 3000);
                  } else {
                      this.showTopNotification("Response regenerated.", "success");
                  }
                  this._updateChatUIForNewMessage();
              },
              onError: (error, wasCancelled) => {
                  if (!wasCancelled) {
                      console.error("Error regenerating message:", error);
                      this.showTopNotification("Failed to regenerate response.", "error");
                  }
              },
              isCancellable: true
          });
      },
  
      checkAllButtonStates() {
          if (this.isInitializing) return;
      
          // Check if any AI operation is currently active (including the manually managed beginStory)
          const isAnyAiBusy = this.activeAiButtons.size > 0;
      
          // Begin Story Button
          if (this.ui.beginStoryBtn) {
              const sbAi = this.ui.storyboardAiCharacterSelect?.value;
              const sbUser = this.ui.storyboardUserCharacterSelect?.value;
              const sbWorld = this.ui.storyboardWorldSelect?.value;
              const isBeginStoryProcessing = this.activeAiButtons.has('beginStoryBtn');
              
              this.ui.beginStoryBtn.disabled = !(sbAi && sbUser && sbWorld) || !!this.activeStoryId || isAnyAiBusy;
              this.ui.beginStoryBtn.title = this.activeStoryId ? "Conclude active story first" : !(sbAi && sbUser && sbWorld) ? "Select all ingredients" : "Begin your adventure!";
              
              // If beginStory is processing, keep its spinner/cancel state
              if (isBeginStoryProcessing) {
                  this.ui.beginStoryBtn.disabled = false; // Allow it to be clickable for cancellation
              }
          }
      
          // Story Profile Screen Buttons (Conclude, Resume Chat)
          const storyProfileScreen = document.getElementById(this.CONSTANTS.VIEWS.STORY_PROFILE);
          if (storyProfileScreen && !storyProfileScreen.classList.contains('hidden') && this.currentStoryId) {
              this.db.stories.get(this.currentStoryId).then(story => {
                  if (story) {
                      const concludeBtnStoryProfile = storyProfileScreen.querySelector('#concludeStoryBtnStoryProfile');
                      const resumeChatBtnStoryProfile = storyProfileScreen.querySelector('#openStoryChatBtnStoryProfile');
                      if (concludeBtnStoryProfile && !this.activeAiButtons.has(concludeBtnStoryProfile.id)) {
                           concludeBtnStoryProfile.disabled = isAnyAiBusy;
                      }
                      if (resumeChatBtnStoryProfile && !this.activeAiButtons.has(resumeChatBtnStoryProfile.id)) {
                           resumeChatBtnStoryProfile.disabled = isAnyAiBusy || (!!this.activeStoryId && this.activeStoryId !== story.id);
                      }
                  }
              });
          }
  
          // Conclude Story Button (in chat interface)
          if (this.ui.concludeStoryChatBtn) {
              const concludeBtnIsActive = this.activeAiButtons.has(this.ui.concludeStoryChatBtn.id);
              this.ui.concludeStoryChatBtn.disabled = concludeBtnIsActive ? false : isAnyAiBusy;
              this.ui.concludeStoryChatBtn.classList.toggle('ai-active', concludeBtnIsActive);
              
              const messages = this.ui.messageFeed.querySelectorAll('.message');
              const hasPrologueAndFirstMessage = messages.length >= 2;
      
              this.ui.concludeStoryChatBtn.classList.toggle('hidden', 
                  this.currentMainView !== this.CONSTANTS.VIEWS.STORY_INTERFACE || 
                  !this.currentStoryId || 
                  this.activeStoryId !== this.currentStoryId ||
                  !hasPrologueAndFirstMessage
              );
          }
      
          // Send Button and Message Input (in chat interface)
          if(this.ui.sendButton && this.ui.messageInput) {
              const storyIsActive = this.currentStoryId && this.activeStoryId === this.currentStoryId;
              const isAiResponding = this.ui.statusNotifier && !this.ui.statusNotifier.classList.contains('hidden');
              this.ui.sendButton.disabled = isAnyAiBusy || isAiResponding || !storyIsActive;
              
              this.ui.messageInput.disabled = isAnyAiBusy || isAiResponding || !storyIsActive;
          }

          // Message Action Buttons (Regenerate)
          document.querySelectorAll('.message-action-button').forEach(btn => {
              // If this specific button is currently managing an AI action, its state is handled by _manageAiButtonState
              // Otherwise, disable it if any other AI operation is busy.
              if (!this.activeAiButtons.has(btn.id)) {
                  btn.disabled = isAnyAiBusy;
              }
          });
      
          // Character/World Form Buttons (Submit, AI Helpers, Avatar Gen)
          ['character', 'world'].forEach(itemType => {
              const config = this.CONSTANTS.ITEM_CONFIG[itemType];
              const formScreen = document.getElementById(config.formScreen);
              if (formScreen && !formScreen.classList.contains('hidden')) {
                  const submitBtn = formScreen.querySelector(`#submit${config.capital}BtnMain`);
                  if (submitBtn && !this.activeAiButtons.has(submitBtn.id)) {
                      const nameField = itemType === 'character' ? formScreen.querySelector(`#${itemType}NameEditable`) : formScreen.querySelector(`#${itemType}Name`);
                      const isFormValid = (nameField?.value?.trim() || nameField?.textContent?.trim());
                      submitBtn.disabled = !isFormValid || isAnyAiBusy;
                  }
  
                  formScreen.querySelectorAll('button.ai-helper-button').forEach(btn => {
                      if (!this.activeAiButtons.has(btn.id)) btn.disabled = isAnyAiBusy;
                  });
                  
                  const avatarOverlay = formScreen.querySelector(`#avatar-overlay-${itemType}`);
                  if(avatarOverlay){
                    const aiHelpAvatarBtn = avatarOverlay.querySelector(`#aiHelpAvatarPromptBtn-${itemType}`);
                    const genAvatarBtn = avatarOverlay.querySelector(`#generateAvatarBtnForm-${itemType}`);
                    const useAvatarBtn = avatarOverlay.querySelector(`#useAvatarBtnForm-${itemType}`);
                    const avatarPromptInput = avatarOverlay.querySelector(`#avatarPromptInputForm-${itemType}`);
  
                    if (aiHelpAvatarBtn && !this.activeAiButtons.has(aiHelpAvatarBtn.id)) aiHelpAvatarBtn.disabled = isAnyAiBusy;
                    if (genAvatarBtn && !this.activeAiButtons.has(genAvatarBtn.id)) genAvatarBtn.disabled = !avatarPromptInput?.value.trim() || isAnyAiBusy;
                    if (useAvatarBtn && !this.activeAiButtons.has(useAvatarBtn.id)) useAvatarBtn.disabled = !this.currentGeneratedAvatarDataUrl || isAnyAiBusy;
                  }
              }
          });
      },
  
      exportAllData: async function() {
          try {
              const allData = {};
              for (const table of this.db.tables) {
                  allData[table.name] = await table.toArray();
              }
              const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
              const link = document.createElement('a');
              link.href = URL.createObjectURL(blob);
              link.download = `RPGlitch_Backup_${new Date().toISOString().slice(0,10)}.json`;
              link.click();
              URL.revokeObjectURL(link.href);
              this.showTopNotification('Data exported successfully!', 'success');
          } catch (error) {
              console.error('Export error:', error);
              this.showTopNotification('Error exporting data. Check console.', 'error');
              alert('Error exporting data. Check console.');
          }
      },
      
      importAllData: async function(event) {
          const file = event.target.files[0]; // Access the first file
          if (!file) return;
      
          if (!confirm('Importing data will overwrite existing data. Are you sure?')) {
              event.target.value = null; 
              return;
          }
      
          try {
              const text = await file.text();
              const importedData = JSON.parse(text);
      
              await this.db.transaction('rw', this.db.tables, async () => {
                  for (const tableName in importedData) {
                      if (this.db[tableName]) {
                          await this.db[tableName].clear();
                          await this.db[tableName].bulkAdd(importedData[tableName]);
                      }
                  }
              });
              this.showTopNotification('Data imported successfully! Reloading...', 'success');
              setTimeout(() => window.location.reload(), 2000);
          } catch (error) {
              console.error('Import error:', error);
              this.showTopNotification('Error importing data. Check console.', 'error');
              alert('Error importing data. Ensure the file is a valid JSON export from RPGlitch and check the console.');
          } finally {
              event.target.value = null; 
          }
      },
      
      deleteAllData: async function() {
          if (confirm('🚨 ARE YOU ABSOLUTELY SURE? 🚨\n\nThis will delete ALL stories, characters, worlds, and settings.\nThis action CANNOT be undone!')) {
              if (confirm('🚨 FINAL CONFIRMATION 🚨\n\nReally delete everything?')) {
                  try {
                      for (const table of this.db.tables) {
                          await table.clear();
                      }
                      this.showTopNotification('All data deleted. Reloading...', 'success');
                      this.activeStoryId = null; 
                      this.currentStoryId = null;
                      this.currentUserCharacterId = null;
                      this.currentAiCharacterId = null;
                      await this.saveAppState(); 
                      setTimeout(() => window.location.reload(), 2000);
                  } catch (error) {
                      console.error('Delete all data error:', error);
                      this.showTopNotification('Error deleting data. Check console.', 'error');
                  }
              }
          }
      },
      
      async _renderPremadeCharacterList() {
          const premadeCharacters = this.getPremadeCharacterItems();
          let html = '';
          
          premadeCharacters.forEach(character => {
              html += `
                  <div class="character-card" data-character-id="${character.id}" onclick="App.selectPremadeCharacter('${character.id}')">
                      <img src="${this.sanitizeHtml(character.avatar)}" alt="${this.sanitizeHtml(character.name)}" class="character-avatar">
                      <div class="character-card-name">${this.sanitizeHtml(character.name)}</div>
                      <div class="character-card-description">${this.sanitizeHtml(character.description)}</div>
                      <div class="actions-bar">
                          <button class="secondary-action-button" onclick="event.stopPropagation(); App.selectPremadeCharacter('${character.id}')">
                              <span class="button-text">Use This Character</span>
                              <span class="button-icon">✅</span>
                          </button>
                      </div>
                  </div>
              `;
          });
          
          this.ui.preMadeCharacterOnlyList.innerHTML = html;
      },
      
      async _renderPremadeWorldList() {
          const premadeWorlds = this.getPremadeWorldItems();
          let html = '';
          
          premadeWorlds.forEach(world => {
              html += `
                  <div class="character-card" data-world-id="${world.id}" onclick="App.selectPremadeWorld('${world.id}')">
                      <img src="${this.sanitizeHtml(world.avatar)}" alt="${this.sanitizeHtml(world.name)}" class="character-avatar">
                      <div class="character-card-name">${this.sanitizeHtml(world.name)}</div>
                      <div class="character-card-description">${this.sanitizeHtml(world.description)}</div>
                      <div class="actions-bar">
                          <button class="secondary-action-button" onclick="event.stopPropagation(); App.selectPremadeWorld('${world.id}')">
                              <span class="button-text">Use This World</span>
                              <span class="button-icon">✅</span>
                          </button>
                      </div>
                  </div>
              `;
          });
          
          this.ui.preMadeWorldOnlyList.innerHTML = html;
      },
      
      async selectPremadeCharacter(characterId) {
          const character = this.getPremadeCharacterItems().find(c => c.id === characterId);
          if (!character) {
              this.showTopNotification("Character not found.", "error");
              return;
          }
          
          // Store the premade character data for the form
          this.createItemFormData = { ...character };
          
          // Navigate to character form
          await this.switchToScreen(this.CONSTANTS.VIEWS.CHARACTER_FORM, {
              isCreating: true,
              premadeId: characterId,
              originScreen: this.previousScreenBeforePremadeSelection || this.CONSTANTS.VIEWS.STORYBOARD
          });
      },
      
      async selectPremadeWorld(worldId) {
          const world = this.getPremadeWorldItems().find(w => w.id === worldId);
          if (!world) {
              this.showTopNotification("World not found.", "error");
              return;
          }
          
          // Store the premade world data for the form
          this.createItemFormData = { ...world };
          
          // Navigate to world form
          await this.switchToScreen(this.CONSTANTS.VIEWS.WORLD_FORM, {
              isCreating: true,
              premadeId: worldId,
              originScreen: this.previousScreenBeforePremadeSelection || this.CONSTANTS.VIEWS.STORYBOARD
          });
      }
    };
  
    window.App = App;
    
    window.dbName = "RPGlitchDB_Main"; 
    
    if (document.readyState === 'interactive' || document.readyState === 'complete') {
      console.log("[App Lifecycle] Document already loaded. Initializing directly.");
      App.initializeWhenReady();
    } else {
      console.log("[App Lifecycle] Document not yet loaded. Adding DOMContentLoaded listener.");
      document.addEventListener('DOMContentLoaded', () => App.initializeWhenReady());
    }
