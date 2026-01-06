
import { jest } from '@jest/globals';

// Define mocks
const mockStoriesList = jest.fn();

// Mock db to prevent crash in repo.js
jest.unstable_mockModule('../../src/js/core/db.js', () => ({
    db: {
        settings: { get: jest.fn() },
        stories: {},
        entities: {}
    }
}));

// Mock ui-utils
jest.unstable_mockModule('../../src/js/ui/services/ui-utils.js', () => ({
    getPictureHTML: () => {
        const div = document.createElement('div');
        div.className = 'picture';
        return div;
    },
    TooltipService: { init: jest.fn() },
    createIconBtn: jest.fn(),
    createProfileRow: jest.fn(),
    renderDynamicsWidget: jest.fn(),
    chin: { init: jest.fn() },
    setTopBarRight: jest.fn(),
    hideEl: jest.fn(),
    showEl: jest.fn(),
    replaceEventHandler: jest.fn(),
    dismissLoadingUI: jest.fn(),
    setAppBackground: jest.fn(),
    renderTags: jest.fn(),
    downloadImage: jest.fn()
}));

// Mock theme service
jest.unstable_mockModule('../../src/js/ui/services/theme.js', () => ({
    ThemeService: { apply: jest.fn() }
}));

describe('Security Vulnerability Check - Settings', () => {

    let StoryOptionsController;
    let repo;

    beforeAll(async () => {
        // Import repo and monkey-patch
        repo = await import('../../src/js/data/repo.js');
        // Save original to restore later if needed (not needed for one test file)
        repo.stories.list = mockStoriesList;

        const module = await import('../../src/js/ui/components/settings.js');
        StoryOptionsController = module.StoryOptionsController;
    });

    beforeEach(() => {
        document.body.innerHTML = '<div id="library-grid"></div>';

        window.DOMPurify = {
            sanitize: (html) => String(html).replace(/\s+on\w+=/gi, ' data-removed-on-attr=')
        };

        mockStoriesList.mockReset();
    });

    test('renderStories should be safe from XSS in story titles', async () => {
        const maliciousTitle = '<img src=x onerror=alert(1)>';

        mockStoriesList.mockResolvedValue([
            {
                id: '1',
                title: maliciousTitle,
                fractalName: 'Test',
                lastPlayed: Date.now(),
                state: 'active',
                signatureColor: 'red',
                fractalAvatar: ''
            }
        ]);

        await StoryOptionsController.renderStories();

        const grid = document.getElementById('library-grid');

        const titleContainer = grid.querySelector('.drawer-card-label > div:first-child');

        expect(titleContainer).not.toBeNull();

        const img = titleContainer.querySelector('img');

        expect(img).not.toBeNull();
        expect(img.hasAttribute('onerror')).toBe(false);
        expect(img.hasAttribute('data-removed-on-attr')).toBe(true);
    });
});
