/**
 * RPGlitch Database Manager
 * Database operations and state management
 */

import { CONSTANTS } from './constants.js';
import { uiManager } from './ui.js';

/**
 * Database Manager Class
 * Handles all database operations and state management
 */
export class DatabaseManager {
    constructor() {
        this.db = null;
        this.currentUserCharacterId = null;
        this.currentStoryId = null;
        this.activeStoryId = null;
        this.currentMainView = CONSTANTS.VIEWS.STORYBOARD;
        this.data = {
            characters: [],
            worlds: []
        };
    }

    /**
     * Initialize the Dexie database with schema and migrations
     */
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
            uiManager.showTopNotification("Error initializing database. Trying to recover...", "error", 5000);
            
            // Attempt to recover by deleting and recreating the database
            try {
                await this.db.delete();
                await this.db.open();
                const appState = {
                    id: 0, 
                    lastOpenedStoryId: null, 
                    currentUserCharacterId: null,
                    currentMainView: "STORYBOARD",
                    activeStoryId: null
                };
                await this.db.appState.put(appState);
                uiManager.showTopNotification("Database reset successfully. Please refresh.", "success", 5000);
            } catch (recoveryError) {
                console.error("Recovery failed:", recoveryError);
                uiManager.showTopNotification("Critical database error. Please refresh.", "error", 10000);
            }
            throw error;
        }
    }

    /**
     * Get application state from database
     */
    async getAppState() {
        let appState = await this.db.appState.get(0);
        if (!appState) {
            appState = {
                id: 0, 
                lastOpenedStoryId: null, 
                currentUserCharacterId: null,
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
    }

    /**
     * Save application state to database
     */
    async saveAppState() {
        // CRITICAL FIX: Don't save editing screen states that might cause issues on restore
        const isEditingScreen = this.currentMainView === CONSTANTS.VIEWS.CHARACTER_FORM || 
                                this.currentMainView === CONSTANTS.VIEWS.WORLD_FORM;
        const appState = {
            id: 0,
            lastOpenedStoryId: this.currentStoryId,
            currentUserCharacterId: this.currentUserCharacterId,
            currentMainView: isEditingScreen ? CONSTANTS.VIEWS.STORYBOARD : this.currentMainView,
            activeStoryId: this.activeStoryId 
        };
        await this.db.appState.put(appState);
    }

    /**
     * Get item data from database or premade items
     */
    async getItemData(id, dbTableKey, getPremadesFn) {
        // Check if database is initialized
        if (!this.db) {
            // Database not initialized yet, skipping getItemData
            return null;
        }
        
        if (typeof id === 'string' && id.startsWith('premade_')) {
            const actualPremadeId = id.substring(id.indexOf(':') + 1);
            const items = await getPremadesFn();
            const foundItem = items.find(item => item.id === actualPremadeId);
            
            if (foundItem) {
                const basePremade = {
                    eternal: '', 
                    past: '', 
                    present: '', 
                    future: '',
                    ...foundItem, 
                    isPremade: true, 
                    originalPremadeId: foundItem.id, 
                    id: id // Keep the full premade ID for later reference
                };
                return basePremade;
            }
            return null;
        }
        
        if ((typeof id === 'number' || (typeof id === 'string' && !isNaN(parseInt(id, 10)))) && this.db[dbTableKey]) {
            const result = await this.db[dbTableKey].get(parseInt(id, 10));
            return result;
        }
        
        return null;
    }

    /**
     * Populate list with items from database and premade items
     */
    async populateList(listArea, searchTerm = '', config) {
        if (!listArea || !config) return;
        
        // Check if database is initialized
        if (!this.db) {
            // Database not initialized yet, skipping populateList
            listArea.innerHTML = '<p class="list-item-empty-message">Loading...</p>';
            return;
        }
        
        const { dbTableKey, getPremadesFn } = config;
        const allUserItems = await this.db[dbTableKey].toArray();
        const fetchedItems = allUserItems
            .filter(item => item.isDeleted !== true)
            .sort((a, b) => (b.createdTimestamp || 0) - (a.createdTimestamp || 0));
        const premadeItemsRaw = await getPremadesFn();
        const premadeItems = premadeItemsRaw.map(p => ({...p, isPremade: true}));
        const combinedItems = [...fetchedItems, ...premadeItems];

        // Filter by search term if provided
        let filteredItems = combinedItems;
        if (searchTerm && searchTerm.trim()) {
            const searchLower = searchTerm.toLowerCase();
            filteredItems = combinedItems.filter(item => 
                item.name && item.name.toLowerCase().includes(searchLower)
            );
        }

        // Clear and populate list area
        listArea.innerHTML = '';
        
        if (filteredItems.length === 0) {
            listArea.innerHTML = '<p class="list-item-empty-message">No items found.</p>';
            return;
        }

        filteredItems.forEach(item => {
            const listItem = this.createListItem(item, config);
            listArea.appendChild(listItem);
        });
    }

    /**
     * Create a list item element for display
     */
    createListItem(item, config) {
        const listItem = document.createElement('div');
        listItem.className = 'list-item';
        listItem.setAttribute('data-item-id', item.id);
        listItem.setAttribute('data-item-type', config.itemType);
        
        const itemName = item.name || 'Unnamed Item';
        const itemDescription = item.description || '';
        
        listItem.innerHTML = `
            <div class="list-item-content">
                <h3 class="list-item-title">${itemName}</h3>
                <p class="list-item-description">${itemDescription}</p>
            </div>
            <div class="list-item-actions">
                <button class="list-item-edit-btn" onclick="App.editItem('${item.id}', '${config.itemType}')">Edit</button>
                <button class="list-item-delete-btn" onclick="App.deleteItem('${item.id}', '${config.itemType}')">Delete</button>
            </div>
        `;
        
        return listItem;
    }

    /**
     * Get premade character items
     */
    async getPremadeCharacterItems() {
        // This would typically load from a premade data source
        // For now, return empty array - can be extended later
        return [];
    }

    /**
     * Get premade world items
     */
    async getPremadeWorldItems() {
        // This would typically load from a premade data source
        // For now, return empty array - can be extended later
        return [];
    }

    /**
     * Load all data from database
     */
    async loadAllData() {
        if (!this.db) {
            // Database not initialized yet, skipping loadAllData
            return;
        }

        this.data = {
            characters: await this.db.characters.toArray(),
            worlds: await this.db.worlds.toArray()
        };

        return this.data;
    }

    /**
     * Export all data from database
     */
    async exportAllData() {
        if (!this.db) {
            // Database not initialized yet, skipping exportAllData
            return null;
        }

        const exportData = {
            appState: await this.db.appState.toArray(),
            characters: await this.db.characters.toArray(),
            stories: await this.db.stories.toArray(),
            messages: await this.db.messages.toArray(),
            worlds: await this.db.worlds.toArray(),
            exportTimestamp: new Date().toISOString(),
            version: '1.0'
        };

        return exportData;
    }

    /**
     * Import data into database
     */
    async importAllData(importData) {
        if (!this.db) {
            console.warn('[DEBUG] Database not initialized yet, skipping importAllData');
            return false;
        }

        try {
            // Clear existing data
            await this.db.appState.clear();
            await this.db.characters.clear();
            await this.db.stories.clear();
            await this.db.messages.clear();
            await this.db.worlds.clear();

            // Import new data
            if (importData.appState) {
                await this.db.appState.bulkAdd(importData.appState);
            }
            if (importData.characters) {
                await this.db.characters.bulkAdd(importData.characters);
            }
            if (importData.stories) {
                await this.db.stories.bulkAdd(importData.stories);
            }
            if (importData.messages) {
                await this.db.messages.bulkAdd(importData.messages);
            }
            if (importData.worlds) {
                await this.db.worlds.bulkAdd(importData.worlds);
            }

            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    /**
     * Delete all data from database
     */
    async deleteAllData() {
        if (!this.db) {
            // Database not initialized yet, skipping deleteAllData
            return false;
        }

        try {
            await this.db.appState.clear();
            await this.db.characters.clear();
            await this.db.stories.clear();
            await this.db.messages.clear();
            await this.db.worlds.clear();
            return true;
        } catch (error) {
            console.error('Error deleting data:', error);
            return false;
        }
    }
}

// Export singleton instance
export const databaseManager = new DatabaseManager();

// Export individual functions for backward compatibility
export const initializeDb = () => databaseManager.initializeDb();
export const getAppState = () => databaseManager.getAppState();
export const saveAppState = () => databaseManager.saveAppState();
export const getItemData = (id, dbTableKey, getPremadesFn) => databaseManager.getItemData(id, dbTableKey, getPremadesFn);
export const populateList = (listArea, searchTerm, config) => databaseManager.populateList(listArea, searchTerm, config);
export const createListItem = (item, config) => databaseManager.createListItem(item, config);
export const getPremadeCharacterItems = () => databaseManager.getPremadeCharacterItems();
export const getPremadeWorldItems = () => databaseManager.getPremadeWorldItems();
export const loadAllData = () => databaseManager.loadAllData();
export const exportAllData = () => databaseManager.exportAllData();
export const importAllData = (importData) => databaseManager.importAllData(importData);
export const deleteAllData = () => databaseManager.deleteAllData();

export default databaseManager; 