/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createHistoryTracker, historyTracker, type HistoryTracker } from '../src/utils/history_tracker';
import { readSaved, writeSaved } from '../src/utils/history_store';

const at = (path: string): string => new URL(path, window.location.origin).href;
const state = (id: string, index: number): { turbo: { restorationIdentifier: string; restorationIndex: number } } => ({
    turbo: { restorationIdentifier: id, restorationIndex: index },
});

/** What Turbo does: replaceState on start or on a replace visit. */
const replaceTo = (id: string, index: number, path: string): void => window.history.replaceState(state(id, index), '', path);
/** What Turbo does on an advance visit, then the events it fires. */
function advanceTo(id: string, index: number, path: string): void {
    document.dispatchEvent(new CustomEvent('turbo:visit', { detail: { action: 'advance' } }));
    document.dispatchEvent(new Event('turbo:before-cache'));
    window.history.pushState(state(id, index), '', path);
    document.dispatchEvent(new Event('turbo:load'));
}
const navigationIs = (type: string): void => {
    Object.defineProperty(window.performance, 'getEntriesByType', { value: () => [{ type }], configurable: true });
};

let controller: AbortController;
const create = (): HistoryTracker => createHistoryTracker(controller.signal);

beforeEach(() => {
    controller = new AbortController();
    window.sessionStorage.clear();
    window.history.replaceState(null, '', '/');
    document.title = '';
    document.body.innerHTML = '';
    navigationIs('navigate');
});

afterEach(() => {
    controller.abort();
});

describe('starting', () => {
    it('starts at connect, before the late initial turbo:load (deferred scripts)', () => {
        const tracker = create();
        replaceTo('a', 0, '/account');
        tracker.ensureStarted();
        advanceTo('b', 1, '/transaction');

        expect(tracker.target()).toMatchObject({ steps: 1, entry: { url: at('/account') } });
    });

    it('treats the late initial turbo:load as the same page', () => {
        const tracker = create();
        replaceTo('a', 0, '/account');
        tracker.ensureStarted();
        document.dispatchEvent(new Event('turbo:load'));

        expect(readSaved()?.stack).toHaveLength(1);
    });

    it('waits for Turbo state, then starts on the next turbo:load', () => {
        const tracker = create();
        tracker.ensureStarted();
        expect(readSaved()).toBeNull();

        replaceTo('a', 0, '/account');
        document.dispatchEvent(new Event('turbo:load'));
        advanceTo('b', 1, '/transaction');

        expect(tracker.target()?.entry.url).toBe(at('/account'));
    });

    it('never starts on a turbo:visit (a restore already shows the destination)', () => {
        const tracker = create();
        replaceTo('b', 1, '/transaction');
        window.dispatchEvent(new PopStateEvent('popstate'));
        document.dispatchEvent(new CustomEvent('turbo:visit', { detail: { action: 'restore' } }));
        document.dispatchEvent(new Event('turbo:before-cache'));

        expect(readSaved()).toBeNull();
        document.dispatchEvent(new Event('turbo:load'));
        expect(readSaved()?.stack).toMatchObject([{ id: 'b', index: 1 }]);
        expect(tracker.target()).toBeNull();
    });

    it('ignores an invalid Turbo state', () => {
        const tracker = create();
        window.history.replaceState({ turbo: { restorationIdentifier: 'a', restorationIndex: -1 } }, '');
        tracker.ensureStarted();
        window.history.replaceState({ turbo: { restorationIdentifier: 'a', restorationIndex: 1.5 } }, '');
        tracker.ensureStarted();

        expect(readSaved()).toBeNull();
    });
});

describe('reload', () => {
    const saveFor = (index: number, path: string): void => writeSaved({
        stack: [
            { id: 'a', index: index - 1, url: at('/account'), scroll: 0, title: 'Account' },
            { id: 'old', index, url: at(path), scroll: 0, title: 'Transaction' },
        ],
        loadedIndex: index,
        historyLength: window.history.length,
    });

    it('adopts the register, with the renewed identifier, without its titles', () => {
        saveFor(1, '/transaction');
        navigationIs('reload');
        replaceTo('renewed', 1, '/transaction');
        const tracker = create();
        tracker.ensureStarted();

        expect(tracker.target()).toMatchObject({ steps: 1, entry: { url: at('/account'), title: '' } });
    });

    it('does not adopt a register written for another page', () => {
        saveFor(1, '/elsewhere');
        navigationIs('reload');
        replaceTo('renewed', 1, '/transaction');
        const tracker = create();
        tracker.ensureStarted();

        expect(tracker.target()).toBeNull();
    });

    it('invalidates the register at once on any other load', () => {
        saveFor(1, '/transaction');
        navigationIs('navigate');
        create();

        expect(readSaved()).toBeNull();
    });
});

describe('recording', () => {
    it('writes the scroll on the page being left, not on history.state', () => {
        const tracker = create();
        replaceTo('a', 0, '/account');
        tracker.ensureStarted();
        advanceTo('b', 1, '/transaction');

        Object.defineProperty(window, 'scrollY', { value: 300, configurable: true });
        // Going back: the popstate has already put the destination in history.state.
        replaceTo('a', 0, '/account');
        document.dispatchEvent(new CustomEvent('turbo:visit', { detail: { action: 'restore' } }));
        document.dispatchEvent(new Event('turbo:before-cache'));
        Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });

        expect(readSaved()?.stack.map((entry) => [entry.index, entry.scroll])).toEqual([[0, 0], [1, 300]]);
        expect(tracker.restoredEntry()).toMatchObject({ id: 'a', index: 0 });
    });

    it('names the page from data-rm-mnb-page-title, then document.title, never stored', () => {
        const tracker = create();
        document.body.innerHTML = '<h1 data-rm-mnb-page-title> Compte courant </h1>';
        replaceTo('a', 0, '/account');
        tracker.ensureStarted();
        document.body.innerHTML = '';
        document.title = 'Transaction - Finance';
        advanceTo('b', 1, '/transaction');
        advanceTo('c', 2, '/edit');

        expect(tracker.target()?.entry.title).toBe('Transaction - Finance');
        expect(window.sessionStorage.getItem('rm-mnb-history')).not.toContain('Compte');
    });

    it('starts over when coming back from the bfcache', () => {
        const tracker = create();
        replaceTo('a', 0, '/account');
        tracker.ensureStarted();
        advanceTo('b', 1, '/transaction');

        const pageshow = new Event('pageshow');
        Object.defineProperty(pageshow, 'persisted', { value: true });
        window.dispatchEvent(pageshow);

        expect(tracker.target()).toBeNull();
        expect(readSaved()?.stack).toHaveLength(1);
    });
});

describe('going back', () => {
    it('goes back the steps of the target, once', () => {
        const go = vi.spyOn(window.history, 'go').mockImplementation(() => undefined);
        const tracker = create();
        replaceTo('a', 0, '/account');
        tracker.ensureStarted();
        advanceTo('b', 1, '/transaction');
        const target = tracker.target()!;

        expect(tracker.goBack(target)).toBe('navigating');
        expect(tracker.isGoingBack()).toBe(true);
        expect(tracker.goBack(target)).toBe('busy');
        expect(go).toHaveBeenCalledOnce();
        expect(go).toHaveBeenCalledWith(-1);
    });

    it('refuses a step count it cannot trust', () => {
        const go = vi.spyOn(window.history, 'go').mockImplementation(() => undefined);
        const tracker = create();
        const entry = { id: 'a', index: 0, url: at('/a'), scroll: 0, title: '' };

        expect(tracker.goBack({ steps: 1.5, entry })).toBe('refused');
        expect(tracker.goBack({ steps: 0, entry })).toBe('refused');
        expect(tracker.goBack({ steps: window.history.length, entry })).toBe('refused');
        expect(go).not.toHaveBeenCalled();
    });
});

describe('end of going back', () => {
    function goneBack(): HistoryTracker {
        vi.spyOn(window.history, 'go').mockImplementation(() => undefined);
        const tracker = create();
        replaceTo('a', 0, '/account');
        tracker.ensureStarted();
        advanceTo('b', 1, '/transaction');
        tracker.goBack(tracker.target()!);

        return tracker;
    }

    it('ends on the load of the restore that went back', () => {
        const tracker = goneBack();
        // A visit already in flight, or the late initial load, does not end it.
        document.dispatchEvent(new Event('turbo:load'));
        expect(tracker.isGoingBack()).toBe(true);

        replaceTo('a', 0, '/account');
        document.dispatchEvent(new CustomEvent('turbo:visit', { detail: { action: 'restore' } }));
        document.dispatchEvent(new Event('turbo:load'));

        expect(tracker.isGoingBack()).toBe(false);
    });

    it('ends on a popstate no visit follows', async () => {
        const tracker = goneBack();
        window.dispatchEvent(new PopStateEvent('popstate'));
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(tracker.isGoingBack()).toBe(false);
    });

    it('goes on through a popstate a restore visit follows', async () => {
        const tracker = goneBack();
        window.dispatchEvent(new PopStateEvent('popstate'));
        document.dispatchEvent(new CustomEvent('turbo:visit', { detail: { action: 'restore' } }));
        await new Promise((resolve) => setTimeout(resolve, 0));

        expect(tracker.isGoingBack()).toBe(true);
    });

    it('ends when the page comes back from the bfcache', () => {
        const tracker = goneBack();
        const pageshow = new Event('pageshow');
        Object.defineProperty(pageshow, 'persisted', { value: true });
        window.dispatchEvent(pageshow);

        expect(tracker.isGoingBack()).toBe(false);
    });
});

describe('shared instance', () => {
    it('is one per page, and ignores a foreign object under its key', () => {
        const key = Symbol.for('rm-mnb.history-tracker/v1');
        const registry = window as unknown as Record<symbol, unknown>;
        registry[key] = { target: () => null };

        const tracker = historyTracker();

        expect(typeof tracker.restoredEntry).toBe('function');
        expect(historyTracker()).toBe(tracker);
    });
});
