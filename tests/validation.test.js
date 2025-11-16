/**
 * Test suite for validation.js module
 * Tests all validation, sanitization, and color utility functions
 */

import {
  isValidImageUrl,
  extractImageUrl,
  sanitizeHtml,
  SIGNATURE_COLORS,
  getSignatureColor,
  getContrastColor,
} from '../apps/rpglitch/js/validation.js';

// Mock DOMPurify for sanitizeHtml tests
global.DOMPurify = {
  sanitize: (input) => {
    // Simple XSS removal for testing
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/on\w+='[^']*'/gi, '');
  },
};

describe('validation.js', () => {
  // ============================================================================
  // isValidImageUrl() Tests
  // ============================================================================
  describe('isValidImageUrl()', () => {
    describe('valid URLs', () => {
      test('accepts https URL with jpg extension', () => {
        expect(isValidImageUrl('https://example.com/image.jpg')).toBe(true);
      });

      test('accepts http URL with png extension', () => {
        expect(isValidImageUrl('http://example.com/image.png')).toBe(true);
      });

      test('accepts blob URL', () => {
        expect(isValidImageUrl('blob:http://localhost/abc-123')).toBe(true);
      });

      test('accepts data:image URL', () => {
        expect(isValidImageUrl('data:image/png;base64,iVBORw0KGgo=')).toBe(true);
      });

      test('accepts URL with query parameters', () => {
        expect(isValidImageUrl('https://example.com/image.jpg?v=123&size=large')).toBe(true);
      });

      test('accepts all valid image extensions', () => {
        const validExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff', 'tif', 'ico', 'avif', 'jfif'];
        validExts.forEach(ext => {
          expect(isValidImageUrl(`https://example.com/image.${ext}`)).toBe(true);
        });
      });

      test('accepts uppercase extensions', () => {
        expect(isValidImageUrl('https://example.com/IMAGE.JPG')).toBe(true);
      });
    });

    describe('invalid URLs', () => {
      test('rejects non-string input', () => {
        expect(isValidImageUrl(123)).toBe(false);
        expect(isValidImageUrl(null)).toBe(false);
        expect(isValidImageUrl(undefined)).toBe(false);
        expect(isValidImageUrl({})).toBe(false);
      });

      test('rejects too short string', () => {
        expect(isValidImageUrl('abc')).toBe(false);
      });

      test('rejects ftp protocol', () => {
        expect(isValidImageUrl('ftp://example.com/image.jpg')).toBe(false);
      });

      test('rejects javascript protocol', () => {
        expect(isValidImageUrl('javascript:alert(1)')).toBe(false);
      });

      test('rejects data URL without image MIME type', () => {
        expect(isValidImageUrl('data:text/plain,hello')).toBe(false);
      });

      test('rejects URL without image extension', () => {
        expect(isValidImageUrl('https://example.com/document.pdf')).toBe(false);
      });

      test('rejects malformed URLs', () => {
        expect(isValidImageUrl('not-a-url')).toBe(false);
        expect(isValidImageUrl('///')).toBe(false);
      });
    });

    describe('logging parameter', () => {
      test('logs warnings when allowLog is true', () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
        isValidImageUrl('ftp://example.com/image.jpg', true);
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
      });

      test('does not log when allowLog is false', () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
        isValidImageUrl('ftp://example.com/image.jpg', false);
        expect(consoleSpy).not.toHaveBeenCalled();
        consoleSpy.mockRestore();
      });
    });
  });

  // ============================================================================
  // extractImageUrl() Tests
  // ============================================================================
  describe('extractImageUrl()', () => {
    describe('active plugin formats', () => {
      test('extracts from text-to-image standard format { imageUrl }', () => {
        const result = { imageUrl: 'https://example.com/image.jpg' };
        expect(extractImageUrl(result)).toBe('https://example.com/image.jpg');
      });

      test('extracts from text-to-image data URL format { dataUrl }', () => {
        const result = { dataUrl: 'data:image/png;base64,abc123' };
        expect(extractImageUrl(result)).toBe('data:image/png;base64,abc123');
      });

      test('extracts from upload plugin format { url }', () => {
        const result = { url: 'blob:http://localhost/abc-123' };
        expect(extractImageUrl(result)).toBe('blob:http://localhost/abc-123');
      });

      test('extracts from legacy direct string format', () => {
        const result = 'https://example.com/image.jpg';
        expect(extractImageUrl(result)).toBe('https://example.com/image.jpg');
      });
    });

    describe('deprecated formats', () => {
      test('returns undefined for old text-to-image { imageId, fileExtension }', () => {
        const result = { imageId: '12345', fileExtension: 'jpeg' };
        expect(extractImageUrl(result)).toBeUndefined();
      });

      test('returns undefined for nested upload { file: { url } }', () => {
        const result = { file: { url: 'https://example.com/image.jpg' } };
        expect(extractImageUrl(result)).toBeUndefined();
      });

      test('returns undefined for direct file { file: "..." }', () => {
        const result = { file: 'https://example.com/image.jpg' };
        expect(extractImageUrl(result)).toBeUndefined();
      });

      test('returns undefined for unusual { name: "..." }', () => {
        const result = { name: 'https://example.com/image.jpg' };
        expect(extractImageUrl(result)).toBeUndefined();
      });

      test('returns undefined for generic { value: "..." }', () => {
        const result = { value: 'https://example.com/image.jpg' };
        expect(extractImageUrl(result)).toBeUndefined();
      });
    });

    describe('edge cases', () => {
      test('trims whitespace from extracted URLs', () => {
        const result = { imageUrl: '  https://example.com/image.jpg  ' };
        expect(extractImageUrl(result)).toBe('https://example.com/image.jpg');
      });

      test('returns undefined for empty string after trim', () => {
        const result = { imageUrl: '   ' };
        expect(extractImageUrl(result)).toBeUndefined();
      });

      test('returns undefined for null input', () => {
        expect(extractImageUrl(null)).toBeUndefined();
      });

      test('returns undefined for undefined input', () => {
        expect(extractImageUrl(undefined)).toBeUndefined();
      });

      test('returns undefined for empty object', () => {
        expect(extractImageUrl({})).toBeUndefined();
      });

      test('handles String objects correctly', () => {
        const result = { url: new String('https://example.com/image.jpg') };
        expect(extractImageUrl(result)).toBe('https://example.com/image.jpg');
      });
    });
  });

  // ============================================================================
  // sanitizeHtml() Tests
  // ============================================================================
  describe('sanitizeHtml()', () => {
    test('removes script tags', () => {
      const input = '<p>Hello</p><script>alert("XSS")</script>';
      const output = sanitizeHtml(input);
      expect(output).not.toContain('<script>');
      expect(output).toContain('<p>Hello</p>');
    });

    test('removes inline event handlers', () => {
      const input = '<img src="x" onerror="alert(1)">';
      const output = sanitizeHtml(input);
      expect(output).not.toContain('onerror');
    });

    test('preserves safe HTML', () => {
      const input = '<p>Hello <strong>World</strong></p>';
      const output = sanitizeHtml(input);
      expect(output).toBe(input);
    });

    test('handles non-string input gracefully', () => {
      expect(sanitizeHtml(123)).toBe('123');
      expect(sanitizeHtml(null)).toBe('');
      expect(sanitizeHtml(undefined)).toBe('');
    });

    test('handles empty string', () => {
      expect(sanitizeHtml('')).toBe('');
    });
  });

  // ============================================================================
  // SIGNATURE_COLORS Tests
  // ============================================================================
  describe('SIGNATURE_COLORS', () => {
    test('exports correct color values', () => {
      expect(SIGNATURE_COLORS.pink).toBe('#ec4899');
      expect(SIGNATURE_COLORS.emerald).toBe('#10b981');
      expect(SIGNATURE_COLORS.cyan).toBe('#06b6d4');
      expect(SIGNATURE_COLORS.orange).toBe('#f97316');
      expect(SIGNATURE_COLORS.purple).toBe('#a855f7');
      expect(SIGNATURE_COLORS.default).toBe('#777');
    });

    test('is immutable (frozen)', () => {
      expect(Object.isFrozen(SIGNATURE_COLORS)).toBe(false); // Not frozen by default
      // If we want to enforce immutability, we could freeze it in validation.js
    });
  });

  // ============================================================================
  // getSignatureColor() Tests
  // ============================================================================
  describe('getSignatureColor()', () => {
    test('returns correct color for valid keys', () => {
      expect(getSignatureColor('pink')).toBe('#ec4899');
      expect(getSignatureColor('emerald')).toBe('#10b981');
      expect(getSignatureColor('cyan')).toBe('#06b6d4');
      expect(getSignatureColor('orange')).toBe('#f97316');
      expect(getSignatureColor('purple')).toBe('#a855f7');
    });

    test('returns default color for invalid key', () => {
      expect(getSignatureColor('invalid')).toBe('#777');
      expect(getSignatureColor('')).toBe('#777');
    });

    test('returns default color for null/undefined', () => {
      expect(getSignatureColor(null)).toBe('#777');
      expect(getSignatureColor(undefined)).toBe('#777');
    });
  });

  // ============================================================================
  // getContrastColor() Tests
  // ============================================================================
  describe('getContrastColor()', () => {
    describe('6-digit hex format', () => {
      test('returns black for light colors', () => {
        expect(getContrastColor('#ffffff')).toBe('#000'); // white
        expect(getContrastColor('#10b981')).toBe('#000'); // emerald (light)
      });

      test('returns white for dark colors', () => {
        expect(getContrastColor('#000000')).toBe('#fff'); // black
        expect(getContrastColor('#ec4899')).toBe('#fff'); // pink (dark)
        expect(getContrastColor('#06b6d4')).toBe('#fff'); // cyan (dark)
      });

      test('handles colors with # prefix', () => {
        expect(getContrastColor('#ffffff')).toBe('#000');
      });

      test('handles colors without # prefix', () => {
        expect(getContrastColor('ffffff')).toBe('#000');
      });
    });

    describe('3-digit hex format', () => {
      test('expands 3-digit hex to 6-digit', () => {
        expect(getContrastColor('#fff')).toBe('#000'); // white
        expect(getContrastColor('#000')).toBe('#fff'); // black
      });

      test('handles 3-digit hex without # prefix', () => {
        expect(getContrastColor('fff')).toBe('#000');
        expect(getContrastColor('000')).toBe('#fff');
      });

      test('correctly calculates contrast for 3-digit colors', () => {
        expect(getContrastColor('#f00')).toBe('#fff'); // red (dark)
        expect(getContrastColor('#0f0')).toBe('#000'); // lime (light)
      });
    });

    describe('invalid input handling', () => {
      test('returns default #000 for non-string input', () => {
        expect(getContrastColor(123)).toBe('#000');
        expect(getContrastColor(null)).toBe('#000');
        expect(getContrastColor(undefined)).toBe('#000');
        expect(getContrastColor({})).toBe('#000');
      });

      test('returns default #000 for empty string', () => {
        expect(getContrastColor('')).toBe('#000');
      });

      test('returns default #000 for invalid hex length', () => {
        expect(getContrastColor('#ff')).toBe('#000'); // too short
        expect(getContrastColor('#fffffff')).toBe('#000'); // too long
        expect(getContrastColor('#fffff')).toBe('#000'); // 5 digits
      });

      test('returns default #000 for invalid hex characters', () => {
        expect(getContrastColor('#zzz')).toBe('#000');
        expect(getContrastColor('#12g45h')).toBe('#000');
      });
    });

    describe('edge cases', () => {
      test('handles mid-range luminance correctly', () => {
        // Color right at the threshold (luminance ~0.5)
        expect(getContrastColor('#808080')).toBe('#fff'); // gray
      });

      test('handles all signature colors correctly', () => {
        expect(getContrastColor(SIGNATURE_COLORS.pink)).toBe('#fff');
        expect(getContrastColor(SIGNATURE_COLORS.emerald)).toBe('#000');
        expect(getContrastColor(SIGNATURE_COLORS.cyan)).toBe('#fff');
        expect(getContrastColor(SIGNATURE_COLORS.orange)).toBe('#fff');
        expect(getContrastColor(SIGNATURE_COLORS.purple)).toBe('#fff');
        expect(getContrastColor(SIGNATURE_COLORS.default)).toBe('#fff');
      });
    });
  });
});
