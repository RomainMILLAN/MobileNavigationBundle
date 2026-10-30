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
export declare const MAX_ENTRIES = 50;
/** The page's URL without its fragment: #anchors are the same page. */
export declare function pageUrl(href: string): string;
/** Register of a document that starts without an adopted register. */
export declare function startAt(entry: HistoryEntry): HistoryEntry[];
/**
 * Records the page Turbo just loaded. The kind of visit is deduced from its position,
 * never from the turbo:visit event (Turbo turns an `advance` to the current URL into a
 * `replace` while the event still says `advance`).
 */
export declare function recordVisit(stack: ReadonlyArray<HistoryEntry>, loaded: HistoryKey | null, entry: HistoryEntry): HistoryEntry[];
/**
 * After a reload, Turbo rewrites the current entry with a NEW restorationIdentifier. The
 * saved register is adopted only if it was written for this very entry: same index, same
 * history length (a reload does not change it: a fingerprint, not a measure), same URL.
 */
export declare function adoptReloaded(saved: SavedHistory | null, current: CurrentPage, historyLength: number): HistoryEntry[] | null;
/** The previous page the register proves, and how many steps lead to it; null if in doubt. */
export declare function backTarget(stack: ReadonlyArray<HistoryEntry>, current: CurrentPage | null): BackTarget | null;
/** Records the scroll position of the given entry. */
export declare function withScroll(stack: ReadonlyArray<HistoryEntry>, key: HistoryKey, scroll: number): HistoryEntry[];
/** Has the gesture gone far enough (distance or velocity) to commit the back navigation? */
export declare function shouldCompleteBack(distance: number, width: number, velocity: number): boolean;
