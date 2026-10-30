/**
 * Register of the pages visited INSIDE the app, keyed by what Turbo 8 writes itself in
 * history.state.turbo. It tells the back button and swipe back two things: is there a
 * **previous page** the app can prove (otherwise the button follows its **parent
 * fallback**, the server-side href), and how many history steps lead to it.
 *
 * - Identity of an entry: the pair (id, index). `id` is Turbo's restorationIdentifier, not
 *   unique on its own (a frame `advance` reuses the same identifier on every push);
 *   `index` is Turbo's restorationIndex (only a push increments it, a replace keeps it).
 * - No measure through history.length: browsers cap a tab's history (WebKit ~100,
 *   Chrome 50), such a measure would drift on every page beyond. Entries outside Turbo
 *   show up otherwise: a #fragment link Turbo does not handle pops a stateless entry,
 *   Turbo rewrites it at its real index but fires no turbo:load, which leaves a hole in
 *   the register. A third-party pushState without Turbo state would make `steps` too
 *   small (going back less far, same origin), never too large.
 * - Invariant: steps ≤ index, so history.go(-steps) never leaves the tab's Turbo session.
 * - Any doubt (hole, mismatch) ⇒ null ⇒ the parent fallback applies.
 */
export interface HistoryEntry {
    id: string;
    index: number;
    url: string;
    scroll: number;
    title: string;
}

export interface HistoryKey {
    id: string;
    index: number;
}

export interface CurrentPage extends HistoryKey {
    url: string;
}

export interface BackTarget {
    steps: number;
    entry: HistoryEntry;
}

export interface SavedHistory {
    stack: HistoryEntry[];
    loadedIndex: number;
    historyLength: number;
}

/** Entries kept, the most recent ones (highest index). */
export const MAX_ENTRIES = 50;

/** The page's URL without its fragment: #anchors are the same page. */
export function pageUrl(href: string): string {
    const hash = href.indexOf('#');

    return hash === -1 ? href : href.slice(0, hash);
}

/** Register of a document that starts without an adopted register. */
export function startAt(entry: HistoryEntry): HistoryEntry[] {
    return [entry];
}

/**
 * Records the page Turbo just loaded. The kind of visit is deduced from its position,
 * never from the turbo:visit event (Turbo turns an `advance` to the current URL into a
 * `replace` while the event still says `advance`).
 */
export function recordVisit(stack: ReadonlyArray<HistoryEntry>, loaded: HistoryKey | null, entry: HistoryEntry): HistoryEntry[] {
    const known = stack.find((candidate) => sameKey(candidate, entry));
    if (known !== undefined) {
        // Restore (back or forward): same page, the scroll written on leaving it is kept.
        return stack.map((candidate) => (candidate === known ? { ...entry, scroll: known.scroll } : candidate));
    }

    if (loaded !== null && entry.index === loaded.index) {
        return bounded([...stack.filter((candidate) => candidate.index !== entry.index), entry]);
    }

    if (loaded !== null && entry.index === loaded.index + 1) {
        return bounded([...stack.filter((candidate) => candidate.index < entry.index), entry]);
    }

    return startAt(entry);
}

/**
 * After a reload, Turbo rewrites the current entry with a NEW restorationIdentifier. The
 * saved register is adopted only if it was written for this very entry: same index, same
 * history length (a reload does not change it: a fingerprint, not a measure), same URL.
 */
export function adoptReloaded(saved: SavedHistory | null, current: CurrentPage, historyLength: number): HistoryEntry[] | null {
    if (saved === null || saved.loadedIndex !== current.index || saved.historyLength !== historyLength) {
        return null;
    }
    const entry = saved.stack.find((candidate) => candidate.index === current.index);
    if (entry === undefined || entry.url !== current.url) {
        return null;
    }

    return saved.stack
        .filter((candidate) => candidate.index <= current.index)
        .map((candidate) => (candidate === entry ? { ...candidate, id: current.id } : candidate));
}

/** The previous page the register proves, and how many steps lead to it; null if in doubt. */
export function backTarget(stack: ReadonlyArray<HistoryEntry>, current: CurrentPage | null): BackTarget | null {
    if (current === null) {
        return null;
    }
    const head = stack.find((candidate) => candidate.index === current.index);
    if (head === undefined || head.id !== current.id || head.url !== current.url) {
        return null;
    }

    for (let index = current.index - 1; index >= 0; index--) {
        const entry = stack.find((candidate) => candidate.index === index);
        if (entry === undefined) {
            return null;
        }
        // Same URL twice in a row (save then replace): the previous page is further back.
        if (entry.url !== current.url) {
            return { steps: current.index - index, entry };
        }
    }

    return null;
}

/** Records the scroll position of the given entry. */
export function withScroll(stack: ReadonlyArray<HistoryEntry>, key: HistoryKey, scroll: number): HistoryEntry[] {
    return stack.map((entry) => (sameKey(entry, key) ? { ...entry, scroll: Math.max(0, Math.round(scroll)) } : entry));
}

/** Has the gesture gone far enough (distance or velocity) to commit the back navigation? */
export function shouldCompleteBack(distance: number, width: number, velocity: number): boolean {
    if (distance <= 0 || width <= 0) {
        return false;
    }

    return distance / width >= 0.35 || (velocity > 0.5 && distance > 40);
}

function sameKey(a: HistoryKey, b: HistoryKey): boolean {
    return a.id === b.id && a.index === b.index;
}

/** In index order, the MAX_ENTRIES most recent ones. */
function bounded(stack: HistoryEntry[]): HistoryEntry[] {
    return [...stack].sort((a, b) => a.index - b.index).slice(-MAX_ENTRIES);
}
