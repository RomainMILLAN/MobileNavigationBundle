import {
    adoptReloaded,
    backTarget,
    pageUrl,
    recordVisit,
    startAt,
    withScroll,
    type BackTarget,
    type CurrentPage,
    type HistoryEntry,
    type HistoryKey,
} from './history_stack';
import { clearSaved, readSaved, writeSaved } from './history_store';
import { currentScroll } from './scroller';

/**
 * One history tracker per page, shared by every controller that needs it. Each dist
 * controller is built on its own (no shared chunk) and carries its own copy of this module:
 * the instance lives under a global, versioned key. ANY change to this API ⇒ a new key
 * (two builds may coexist, served by a service worker cache).
 *
 * Creation only installs the listeners. Starting is lazy: the module is evaluated before
 * Turbo starts (history.state may still be empty or stale), and with deferred scripts the
 * initial turbo:load only comes at readyState "complete", after the controllers connect.
 * So it starts at the first connect() or the first turbo:load, when history.state and the
 * DOM name the same page — never on turbo:visit (on a restore, history.state is already the
 * destination; a frame `advance` pushes before its turbo:visit).
 */
export type GoBackResult = 'navigating' | 'busy' | 'refused';

export interface HistoryTracker {
    ensureStarted(): void;
    target(): BackTarget | null;
    goBack(target: BackTarget): GoBackResult;
    isGoingBack(): boolean;
    restoredEntry(): HistoryEntry | null;
}

const KEY = Symbol.for('rm-mnb.history-tracker/v1');
const GOING_BACK_SAFETY_MS = 4000;
const TITLE_MAX = 200;

export function historyTracker(): HistoryTracker {
    const registry = window as unknown as Record<symbol, unknown>;
    const existing = registry[KEY];
    if (isTracker(existing)) {
        return existing;
    }
    const tracker = createHistoryTracker();
    registry[KEY] = tracker;

    return tracker;
}

interface GoingBack {
    fromIndex: number;
    restoreSeen: boolean;
    timer: number;
}

/**
 * A new tracker, outside the shared instance: for tests, whose `signal` removes its
 * listeners. Code uses historyTracker().
 */
export function createHistoryTracker(signal?: AbortSignal): HistoryTracker {
    const options = { signal };
    let stack: HistoryEntry[] = [];
    let loaded: HistoryKey | null = null;
    let started = false;
    let goingBack: GoingBack | null = null;
    let lastVisitRestores = false;
    let visitSincePopstate = false;

    // Invalidate early: a reload happening before this document starts must never adopt
    // the register of an older document.
    if (navigationType() !== 'reload') {
        clearSaved();
    }

    const persist = (): void => {
        if (loaded !== null) {
            writeSaved({ stack, loadedIndex: loaded.index, historyLength: window.history.length });
        }
    };

    const stopGoingBack = (): void => {
        if (goingBack !== null) {
            window.clearTimeout(goingBack.timer);
            goingBack = null;
        }
    };

    const startHere = (page: CurrentPage): void => {
        stack = startAt(entryOf(page));
        loaded = { id: page.id, index: page.index };
        persist();
    };

    const tracker: HistoryTracker = {
        ensureStarted(): void {
            if (started) {
                return;
            }
            const page = currentPage();
            if (page === null) {
                return;
            }
            started = true;
            const adopted = navigationType() === 'reload' ? adoptReloaded(readSaved(), page, window.history.length) : null;
            if (adopted === null) {
                startHere(page);

                return;
            }
            stack = recordVisit(adopted, null, entryOf(page));
            loaded = { id: page.id, index: page.index };
            persist();
        },

        target(): BackTarget | null {
            return started ? backTarget(stack, currentPage()) : null;
        },

        goBack(target: BackTarget): GoBackResult {
            if (goingBack !== null) {
                return 'busy';
            }
            const steps = target.steps;
            if (!(Number.isSafeInteger(steps) && steps >= 1) || window.history.length <= steps) {
                return 'refused';
            }
            goingBack = {
                fromIndex: currentPage()?.index ?? Number.POSITIVE_INFINITY,
                restoreSeen: false,
                timer: window.setTimeout(stopGoingBack, GOING_BACK_SAFETY_MS),
            };
            window.history.go(-steps);

            return 'navigating';
        },

        isGoingBack(): boolean {
            return goingBack !== null;
        },

        restoredEntry(): HistoryEntry | null {
            const page = currentPage();
            if (!lastVisitRestores || page === null) {
                return null;
            }

            return stack.find((entry) => entry.id === page.id && entry.index === page.index) ?? null;
        },
    };

    document.addEventListener('turbo:visit', (event: Event) => {
        visitSincePopstate = true;
        lastVisitRestores = (event as CustomEvent<{ action?: string }>).detail?.action === 'restore';
        if (lastVisitRestores) {
            // Going back restores the page's scroll position at once: an animated scroll
            // (the theme's scroll-behavior: smooth) would first show it at the top, then sliding.
            document.documentElement.classList.add('rm-mnb-restoring');
            if (goingBack !== null) {
                goingBack.restoreSeen = true;
            }
        }
    }, options);

    // A popstate with a Turbo state always starts a restore visit; only an empty state (a
    // #fragment) does not. Checked in a task, not a microtask: this listener runs before
    // Turbo's, a microtask would run before it too and end every going back.
    window.addEventListener('popstate', () => {
        if (goingBack === null) {
            return;
        }
        visitSincePopstate = false;
        window.setTimeout(() => {
            if (!visitSincePopstate) {
                stopGoingBack();
            }
        }, 0);
    }, options);

    document.addEventListener('turbo:before-cache', () => {
        // The page being left is the loaded one: history.state may already be the next page's.
        if (started && loaded !== null) {
            stack = withScroll(stack, loaded, currentScroll());
            persist();
        }
    }, options);

    document.addEventListener('turbo:load', () => {
        window.requestAnimationFrame(() => document.documentElement.classList.remove('rm-mnb-restoring'));
        tracker.ensureStarted();
        if (!started) {
            return;
        }
        const page = currentPage();
        if (page === null) {
            loaded = null;

            return;
        }
        // The late initial turbo:load finds its own entry (same id, index): a mere update.
        stack = recordVisit(stack, loaded, entryOf(page));
        loaded = { id: page.id, index: page.index };
        persist();
        if (goingBack !== null && goingBack.restoreSeen && page.index < goingBack.fromIndex) {
            stopGoingBack();
        }
        lastVisitRestores = false;
    }, options);

    window.addEventListener('pageshow', (event) => {
        if (!event.persisted) {
            return;
        }
        // Back from the bfcache: another document may have written the register since.
        stopGoingBack();
        const page = currentPage();
        if (page !== null) {
            started = true;
            startHere(page);
        }
    }, options);

    return tracker;
}

/** The page Turbo has written in history.state, or null (Turbo not started, foreign state). */
function currentPage(): CurrentPage | null {
    const state: unknown = window.history.state;
    const turbo = typeof state === 'object' && state !== null ? (state as { turbo?: unknown }).turbo : undefined;
    if (typeof turbo !== 'object' || turbo === null) {
        return null;
    }
    const { restorationIdentifier, restorationIndex } = turbo as Record<string, unknown>;
    if (typeof restorationIdentifier !== 'string' || !Number.isSafeInteger(restorationIndex) || (restorationIndex as number) < 0) {
        return null;
    }

    return { id: restorationIdentifier, index: restorationIndex as number, url: pageUrl(window.location.href) };
}

function entryOf(page: CurrentPage): HistoryEntry {
    return { id: page.id, index: page.index, url: page.url, scroll: 0, title: pageTitle() };
}

/** The page's name in the history: [data-rm-mnb-page-title], otherwise document.title. */
function pageTitle(): string {
    const named = document.querySelector('[data-rm-mnb-page-title]')?.textContent?.trim();

    return (named || document.title.trim()).slice(0, TITLE_MAX);
}

function navigationType(): string | undefined {
    try {
        const entry = window.performance?.getEntriesByType?.('navigation')[0] as PerformanceNavigationTiming | undefined;

        return entry?.type;
    } catch {
        return undefined;
    }
}

function isTracker(value: unknown): value is HistoryTracker {
    if (typeof value !== 'object' || value === null) {
        return false;
    }
    const candidate = value as Record<string, unknown>;

    return ['ensureStarted', 'target', 'goBack', 'isGoingBack', 'restoredEntry']
        .every((method) => typeof candidate[method] === 'function');
}
