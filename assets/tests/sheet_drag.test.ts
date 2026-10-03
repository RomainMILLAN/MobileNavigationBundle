import { describe, expect, it } from 'vitest';

import { dampen, DISMISS_VELOCITY, shouldDismiss } from '../src/utils/sheet_drag';

describe('dampen', () => {
    it('follows the finger downwards', () => {
        expect(dampen(120)).toBe(120);
    });

    it('resists upwards', () => {
        expect(dampen(-100)).toBeGreaterThan(-100);
        expect(dampen(-100)).toBeLessThan(0);
    });
});

describe('shouldDismiss', () => {
    it('closes beyond a quarter of the height', () => {
        expect(shouldDismiss(110, 400, 0)).toBe(true);
    });

    it('closes on a fast fling, even a short one', () => {
        expect(shouldDismiss(20, 400, DISMISS_VELOCITY + 0.1)).toBe(true);
    });

    it('keeps the sheet on a small slow gesture', () => {
        expect(shouldDismiss(40, 400, 0.1)).toBe(false);
    });
});
