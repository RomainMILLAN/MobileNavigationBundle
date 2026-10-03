import { describe, expect, it } from 'vitest';

import { applyVisit, previousEntry, shouldCompleteBack, withCurrentScroll } from '../src/utils/history_stack';

const urls = (stack: { url: string }[]): string[] => stack.map((entry) => entry.url);

describe('history stack', () => {
    it('pushes a navigation, without duplicating the current page', () => {
        let stack = applyVisit([], '/a', 'advance');
        stack = applyVisit(stack, '/b', 'advance');
        stack = applyVisit(stack, '/b', 'advance');

        expect(urls(stack)).toEqual(['/a', '/b']);
        expect(previousEntry(stack)?.url).toBe('/a');
    });

    it('replaces the current page', () => {
        const stack = applyVisit(applyVisit([{ url: '/a', scroll: 0 }], '/b', 'advance'), '/c', 'replace');

        expect(urls(stack)).toEqual(['/a', '/c']);
    });

    it('goes back to the known entry, keeping its scroll position', () => {
        const stack = [{ url: '/a', scroll: 420 }, { url: '/b', scroll: 0 }, { url: '/c', scroll: 0 }];

        const restored = applyVisit(stack, '/a', 'restore');

        expect(restored).toEqual([{ url: '/a', scroll: 420 }]);
        expect(previousEntry(restored)).toBeNull();
    });

    it('starts over on an unknown page', () => {
        expect(urls(applyVisit([{ url: '/a', scroll: 0 }], '/z', 'restore'))).toEqual(['/z']);
    });

    it('has nothing to go back to with a single page', () => {
        expect(previousEntry([{ url: '/a', scroll: 0 }])).toBeNull();
    });

    it('records the scroll position of the current page', () => {
        expect(withCurrentScroll([{ url: '/a', scroll: 0 }, { url: '/b', scroll: 0 }], 312.6)).toEqual([
            { url: '/a', scroll: 0 },
            { url: '/b', scroll: 313 },
        ]);
    });
});

describe('end of gesture', () => {
    it('commits beyond a good third of the width', () => {
        expect(shouldCompleteBack(140, 390, 0)).toBe(true);
        expect(shouldCompleteBack(100, 390, 0)).toBe(false);
    });

    it('commits a short but fast gesture', () => {
        expect(shouldCompleteBack(60, 390, 0.9)).toBe(true);
        expect(shouldCompleteBack(20, 390, 0.9)).toBe(false);
    });

    it('never commits when the finger moves back', () => {
        expect(shouldCompleteBack(0, 390, 2)).toBe(false);
    });
});
