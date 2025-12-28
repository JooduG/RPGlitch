
import { jest } from '@jest/globals';
import { showErrorModal } from '../../apps/rpglitch/js/ui/services/modals.js';

// Mock DOMPurify globally
global.window.DOMPurify = {
  sanitize: jest.fn(str => str.replace(/onerror=/g, 'data-blocked=')),
  isSupported: true,
};

// Mock Dialog.showModal (not implemented in JSDOM)
HTMLDialogElement.prototype.showModal = jest.fn();
HTMLDialogElement.prototype.close = jest.fn();

// Mock TurnManager
jest.mock('../../apps/rpglitch/js/engine/director.js', () => ({
  TurnManager: {
    regenerate: jest.fn(),
  }
}));

describe('Security: Modal XSS Vulnerability', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    global.window.DOMPurify.sanitize.mockClear();
  });

  test('showErrorModal should sanitize error messages', () => {
    const maliciousPayload = '<img src=x onerror=alert(1)>';

    showErrorModal('generic', maliciousPayload);

    const dialog = document.querySelector('#error-modal');
    const errorMsg = dialog.querySelector('#error-msg');
    const innerHTML = errorMsg.innerHTML;

    // VERIFICATION:
    // We assert that the payload DOES NOT contain the malicious attribute.
    // This assertion will FAIL if the code is vulnerable (because it contains "onerror=").
    // It will PASS if the code is patched (because "onerror=" is removed/sanitized).

    expect(innerHTML).not.toContain('onerror=');
    expect(global.window.DOMPurify.sanitize).toHaveBeenCalled();
  });
});
