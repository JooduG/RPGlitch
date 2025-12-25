
import { renderDynamicsWidget } from '../../apps/rpglitch/js/ui/services/ui-utils.js';
import { jest } from '@jest/globals';

describe('Security Vulnerability Check', () => {

    beforeEach(() => {
        document.body.innerHTML = '';
        // Mock DOMPurify to simulate browser environment
        window.DOMPurify = {
            sanitize: (html) => html.replace(/<script.*?>.*?<\/script>/gi, '').replace(/<.*?onerror.*?>/gi, 'safe')
        };
    });

    test('renderDynamicsWidget should be safe from XSS in keys', () => {
        const container = document.createElement('div');
        const maliciousKey = '<img src=x onerror=alert(1)>';
        const entity = {
            dynamics: {
                [maliciousKey]: 50
            }
        };

        renderDynamicsWidget(container, entity);

        const label = container.querySelector('.dynamics-label');

        // Assert that the image tag IS removed or sanitized
        expect(label.querySelector('img')).toBeNull();
    });
});
