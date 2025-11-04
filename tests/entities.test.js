/**
 * Unit tests for getBrand() function
 * Testing backward-compatible fallback logic for entity brand colors
 */

import { getBrand } from '../apps/rpglitch/js/entities.js';

describe('getBrand()', () => {
  describe('Modern entities with signatureColour', () => {
    test('returns CSS variable for entity with signatureColour', () => {
      const entity = { signatureColour: 'cyan' };
      const result = getBrand(entity);
      expect(result).toBe('var(--brand-cyan)');
    });

    test('returns CSS variable for entity with pink signatureColour', () => {
      const entity = { signatureColour: 'pink' };
      const result = getBrand(entity);
      expect(result).toBe('var(--brand-pink)');
    });

    test('returns CSS variable for entity with emerald signatureColour', () => {
      const entity = { signatureColour: 'emerald' };
      const result = getBrand(entity);
      expect(result).toBe('var(--brand-emerald)');
    });

    test('skips signatureColour when set to "default"', () => {
      const entity = {
        signatureColour: 'default',
        name: 'Test Entity',
      };
      const result = getBrand(entity);
      // Should fall through to deterministic color generation
      expect(result).toMatch(/^hsl\(\d+, 40%, 60%\)$/);
    });
  });

  describe('Legacy entities with palette property', () => {
    test('returns palette.brand for legacy entity', () => {
      const entity = {
        palette: { brand: '#ec4899' }
      };
      const result = getBrand(entity);
      expect(result).toBe('#ec4899');
    });

    test('returns palette.brand for legacy entity with different color', () => {
      const entity = {
        palette: { brand: '#10b981' }
      };
      const result = getBrand(entity);
      expect(result).toBe('#10b981');
    });

    test('returns palette for legacy entity with palette as string', () => {
      const entity = {
        palette: '#06b6d4'
      };
      const result = getBrand(entity);
      expect(result).toBe('#06b6d4');
    });
  });

  describe('Precedence: signatureColour over palette', () => {
    test('prioritizes signatureColour when both are present', () => {
      const entity = {
        signatureColour: 'emerald',
        palette: { brand: '#ec4899' }
      };
      const result = getBrand(entity);
      expect(result).toBe('var(--brand-emerald)');
    });

    test('falls back to palette when signatureColour is "default"', () => {
      const entity = {
        signatureColour: 'default',
        palette: { brand: '#ec4899' }
      };
      const result = getBrand(entity);
      expect(result).toBe('#ec4899');
    });

    test('uses signatureColour even when palette is null', () => {
      const entity = {
        signatureColour: 'cyan',
        palette: null
      };
      const result = getBrand(entity);
      expect(result).toBe('var(--brand-cyan)');
    });
  });

  describe('Deterministic color generation fallback', () => {
    test('generates deterministic color for entity with name only', () => {
      const entity = { name: 'Aether Blade' };
      const result = getBrand(entity);
      expect(result).toMatch(/^hsl\(\d+, 40%, 60%\)$/);
    });

    test('generates deterministic color for entity with name and tags', () => {
      const entity = {
        name: 'Mystic Bard',
        tags: ['magic', 'music']
      };
      const result = getBrand(entity);
      expect(result).toMatch(/^hsl\(\d+, 40%, 60%\)$/);
    });

    test('generates consistent color for same entity data', () => {
      const entity1 = { name: 'Clockwork Rogue', tags: ['stealth'] };
      const entity2 = { name: 'Clockwork Rogue', tags: ['stealth'] };
      const result1 = getBrand(entity1);
      const result2 = getBrand(entity2);
      expect(result1).toBe(result2);
    });

    test('generates different colors for different entity data', () => {
      const entity1 = { name: 'Entity A' };
      const entity2 = { name: 'Entity B' };
      const result1 = getBrand(entity1);
      const result2 = getBrand(entity2);
      expect(result1).not.toBe(result2);
    });

    test('uses id as fallback seed when name is empty', () => {
      const entity = { id: 'char-123', name: '' };
      const result = getBrand(entity);
      expect(result).toMatch(/^hsl\(\d+, 40%, 60%\)$/);
    });

    test('uses kind as fallback seed when name and id are empty', () => {
      const entity = { kind: 'character', name: '', id: '' };
      const result = getBrand(entity);
      expect(result).toMatch(/^hsl\(\d+, 40%, 60%\)$/);
    });

    test('handles completely empty entity gracefully', () => {
      const entity = {};
      const result = getBrand(entity);
      expect(result).toMatch(/^hsl\(\d+, 40%, 60%\)$/);
    });
  });

  describe('Edge cases and robustness', () => {
    test('handles undefined entity parameter', () => {
      const result = getBrand();
      expect(result).toMatch(/^hsl\(\d+, 40%, 60%\)$/);
    });

    test('handles null entity parameter', () => {
      const result = getBrand(null);
      expect(result).toMatch(/^hsl\(\d+, 40%, 60%\)$/);
    });

    test('handles entity with empty signatureColour string', () => {
      const entity = { signatureColour: '' };
      const result = getBrand(entity);
      // Empty string is falsy, should fall through
      expect(result).toMatch(/^hsl\(\d+, 40%, 60%\)$/);
    });

    test('handles entity with empty palette object', () => {
      const entity = { palette: {} };
      const result = getBrand(entity);
      expect(result).toMatch(/^hsl\(\d+, 40%, 60%\)$/);
    });

    test('handles entity with null palette.brand', () => {
      const entity = { palette: { brand: null } };
      const result = getBrand(entity);
      expect(result).toMatch(/^hsl\(\d+, 40%, 60%\)$/);
    });

    test('handles entity with empty tags array', () => {
      const entity = { name: 'Test', tags: [] };
      const result = getBrand(entity);
      expect(result).toMatch(/^hsl\(\d+, 40%, 60%\)$/);
    });

    test('handles entity with undefined tags', () => {
      const entity = { name: 'Test', tags: undefined };
      const result = getBrand(entity);
      expect(result).toMatch(/^hsl\(\d+, 40%, 60%\)$/);
    });
  });
});
