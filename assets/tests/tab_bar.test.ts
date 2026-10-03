import { describe, expect, it } from 'vitest';

import {
    isResidualClick,
    RESIDUAL_CLICK_WINDOW_MS,
    rubberBand,
    tabIndexAt,
} from '../src/controllers/tab_bar_controller';

// Three adjacent 100px tabs, as in the pill.
const BOUNDS = [
    { left: 0, right: 100 },
    { left: 100, right: 200 },
    { left: 200, right: 300 },
];

describe('tabIndexAt', () => {
    it('returns the tab containing x', () => {
        expect(tabIndexAt(50, BOUNDS)).toBe(0);
        expect(tabIndexAt(150, BOUNDS)).toBe(1);
        expect(tabIndexAt(299, BOUNDS)).toBe(2);
    });

    it('returns the first or last tab when the finger leaves the pill', () => {
        expect(tabIndexAt(-40, BOUNDS)).toBe(0);
        expect(tabIndexAt(420, BOUNDS)).toBe(2);
    });

    it('returns the closest tab between two spaced tabs', () => {
        const spaced = [
            { left: 0, right: 90 },
            { left: 110, right: 200 },
        ];
        expect(tabIndexAt(95, spaced)).toBe(0);
        expect(tabIndexAt(106, spaced)).toBe(1);
    });

    it('returns -1 with no tab', () => {
        expect(tabIndexAt(10, [])).toBe(-1);
    });
});

describe('rubberBand', () => {
    it('does not move without overshoot', () => {
        expect(rubberBand(0, 30)).toBe(0);
        expect(rubberBand(-12, 30)).toBe(0);
    });

    it('grows with the overshoot', () => {
        expect(rubberBand(10, 30)).toBeLessThan(rubberBand(40, 30));
        expect(rubberBand(40, 30)).toBeLessThan(rubberBand(400, 30));
    });

    it('stays bounded by the limit, whatever the overshoot', () => {
        expect(rubberBand(10_000, 30)).toBeLessThan(30);
        expect(rubberBand(10, 30)).toBeLessThan(10);
    });
});

describe('isResidualClick', () => {
    it('neutralizes the trusted click that follows a drag', () => {
        expect(isResidualClick(true, 1000, 1000 + 50)).toBe(true);
    });

    it('always lets the programmatic click() through', () => {
        expect(isResidualClick(false, 1000, 1000 + 50)).toBe(false);
    });

    it('lets a trusted click outside the window through', () => {
        expect(isResidualClick(true, 1000, 1000 + RESIDUAL_CLICK_WINDOW_MS)).toBe(false);
    });
});
