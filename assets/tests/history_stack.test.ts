import { describe, expect, it } from 'vitest';

import {
    adoptReloaded,
    backTarget,
    MAX_ENTRIES,
    pageUrl,
    recordVisit,
    shouldCompleteBack,
    startAt,
    withScroll,
    type HistoryEntry,
} from '../src/utils/history_stack';

const entry = (index: number, url: string, id = `id-${index}`, scroll = 0): HistoryEntry => ({ id, index, url, scroll, title: url });
const page = (e: HistoryEntry): { id: string; index: number; url: string } => ({ id: e.id, index: e.index, url: e.url });
const key = (e: HistoryEntry): { id: string; index: number } => ({ id: e.id, index: e.index });
const urls = (stack: HistoryEntry[]): string[] => stack.map((e) => e.url);

/** Plays a sequence of advance visits from a first page. */
function advances(...paths: string[]): HistoryEntry[] {
    let stack = startAt(entry(0, paths[0]!));
    for (let index = 1; index < paths.length; index++) {
        stack = recordVisit(stack, key(stack.at(-1)!), entry(index, paths[index]!));
    }

    return stack;
}

describe('recording visits', () => {
    it('pushes an advance and truncates what was ahead', () => {
        const stack = advances('/a', '/b', '/c');
        const fromA = recordVisit(stack, key(stack[0]!), entry(1, '/z', 'other'));

        expect(urls(stack)).toEqual(['/a', '/b', '/c']);
        expect(urls(fromA)).toEqual(['/a', '/z']);
    });

    it('replaces the entry at the same index', () => {
        const stack = advances('/a', '/b');
        const replaced = recordVisit(stack, key(stack[1]!), entry(1, '/b', 'refreshed'));

        expect(replaced.map((e) => e.id)).toEqual(['id-0', 'refreshed']);
    });

    it('restores a known entry, back or forward, keeping its scroll and what is ahead', () => {
        let stack = advances('/a', '/b', '/c');
        stack = withScroll(stack, key(stack[0]!), 420);

        const back = recordVisit(stack, key(stack[2]!), entry(0, '/a'));
        expect(back[0]!.scroll).toBe(420);
        expect(urls(back)).toEqual(['/a', '/b', '/c']);

        const forwardOne = recordVisit(back, key(back[0]!), entry(1, '/b'));
        const forwardTwo = recordVisit(back, key(back[0]!), entry(2, '/c'));
        expect(urls(forwardOne)).toEqual(['/a', '/b', '/c']);
        expect(backTarget(forwardTwo, page(entry(2, '/c')))?.entry.url).toBe('/b');
    });

    it('starts over on a restore of another session', () => {
        const stack = advances('/a', '/b');

        expect(urls(recordVisit(stack, key(stack[1]!), entry(0, '/a', 'other-session')))).toEqual(['/a']);
    });

    it('starts over on an index jump (an entry Turbo never loaded)', () => {
        const stack = advances('/a', '/b');

        expect(urls(recordVisit(stack, key(stack[1]!), entry(3, '/d')))).toEqual(['/d']);
    });

    it('keeps distinct entries for a frame advancing with the same identifier', () => {
        let stack = startAt(entry(0, '/list', 'frame'));
        stack = recordVisit(stack, key(stack[0]!), entry(1, '/list?q=a', 'frame'));
        stack = recordVisit(stack, key(stack[1]!), entry(2, '/list?q=ab', 'frame'));

        expect(urls(stack)).toEqual(['/list', '/list?q=a', '/list?q=ab']);
    });

    it(`keeps the ${MAX_ENTRIES} most recent entries`, () => {
        const stack = advances(...Array.from({ length: MAX_ENTRIES + 10 }, (_, index) => `/p${index}`));

        expect(stack).toHaveLength(MAX_ENTRIES);
        expect(stack[0]!.index).toBe(10);
    });

    it('does not drift on a long session', () => {
        const stack = advances(...Array.from({ length: 150 }, (_, index) => `/p${index}`));

        expect(backTarget(stack, page(stack.at(-1)!))).toMatchObject({ steps: 1, entry: { url: '/p148' } });
    });
});

describe('back target', () => {
    it('is the previous entry', () => {
        const stack = advances('/account', '/transaction');

        expect(backTarget(stack, page(stack[1]!))).toMatchObject({ steps: 1, entry: { url: '/account' } });
    });

    it('skips the same page twice in a row (save, then replace)', () => {
        const stack = advances('/account', '/transaction', '/transaction');

        expect(backTarget(stack, page(stack[2]!))).toMatchObject({ steps: 2, entry: { url: '/account' } });
    });

    it('is null in doubt', () => {
        const stack = advances('/a', '/b');

        expect(backTarget([], page(entry(1, '/b')))).toBeNull();
        expect(backTarget(stack, null)).toBeNull();
        expect(backTarget(stack, { ...page(stack[1]!), id: 'other' })).toBeNull();
        expect(backTarget(stack, { ...page(stack[1]!), url: '/elsewhere' })).toBeNull();
        expect(backTarget(startAt(entry(0, '/a')), page(entry(0, '/a')))).toBeNull();
    });

    it('is null across a hole (a #fragment entry, never loaded)', () => {
        const stack = [entry(0, '/a'), entry(2, '/b')];

        expect(backTarget(stack, page(stack[1]!))).toBeNull();
    });

    it('never asks for more steps than the index', () => {
        const stack = advances('/a', '/b', '/c', '/d');
        const target = backTarget(stack, page(stack[3]!));

        expect(target!.steps).toBeLessThanOrEqual(3);
    });

    it('ignores the fragment of the URL', () => {
        expect(pageUrl('https://app.example/a?x=1#main')).toBe('https://app.example/a?x=1');
        expect(pageUrl('https://app.example/a')).toBe('https://app.example/a');
    });
});

describe('adopting after a reload', () => {
    const saved = { stack: advances('/a', '/b'), loadedIndex: 1, historyLength: 3 };

    it('gives the reloaded entry its new identifier', () => {
        const adopted = adoptReloaded(saved, { id: 'new', index: 1, url: '/b' }, 3);

        expect(adopted!.map((e) => e.id)).toEqual(['id-0', 'new']);
        expect(backTarget(adopted!, { id: 'new', index: 1, url: '/b' })?.entry.url).toBe('/a');
    });

    it('refuses a register written for another entry', () => {
        expect(adoptReloaded(saved, { id: 'new', index: 1, url: '/z' }, 3)).toBeNull();
        expect(adoptReloaded(saved, { id: 'new', index: 0, url: '/a' }, 3)).toBeNull();
        expect(adoptReloaded(saved, { id: 'new', index: 1, url: '/b' }, 4)).toBeNull();
        expect(adoptReloaded(null, { id: 'new', index: 1, url: '/b' }, 3)).toBeNull();
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
