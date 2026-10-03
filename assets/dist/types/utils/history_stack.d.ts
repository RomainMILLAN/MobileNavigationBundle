/**
 * Stack of the pages visited INSIDE the app, in browser history order. It tells
 * swipe back whether there is a page to go back to (otherwise, history.back() would leave
 * the app) and at which scroll position the previous page was.
 */
export interface HistoryEntry {
    url: string;
    scroll: number;
}
export type VisitAction = 'advance' | 'replace' | 'restore';
export declare function applyVisit(stack: ReadonlyArray<HistoryEntry>, url: string, action: VisitAction): HistoryEntry[];
export declare function previousEntry(stack: ReadonlyArray<HistoryEntry>): HistoryEntry | null;
export declare function withCurrentScroll(stack: ReadonlyArray<HistoryEntry>, scroll: number): HistoryEntry[];
/** Has the gesture gone far enough (distance or velocity) to commit the back navigation? */
export declare function shouldCompleteBack(distance: number, width: number, velocity: number): boolean;
