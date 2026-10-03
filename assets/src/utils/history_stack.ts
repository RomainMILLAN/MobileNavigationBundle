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

export function applyVisit(stack: ReadonlyArray<HistoryEntry>, url: string, action: VisitAction): HistoryEntry[] {
    const entry = { url, scroll: 0 };

    if (action === 'replace' && stack.length > 0) {
        return [...stack.slice(0, -1), entry];
    }

    if (action === 'restore') {
        // Back (or forward) in history: return to the closest known entry.
        const index = findLastIndex(stack, url);

        return index === -1 ? [entry] : stack.slice(0, index + 1);
    }

    if (stack.at(-1)?.url === url) {
        return [...stack];
    }

    return [...stack, entry];
}

export function previousEntry(stack: ReadonlyArray<HistoryEntry>): HistoryEntry | null {
    return stack.length > 1 ? (stack.at(-2) ?? null) : null;
}

export function withCurrentScroll(stack: ReadonlyArray<HistoryEntry>, scroll: number): HistoryEntry[] {
    const current = stack.at(-1);
    if (current === undefined) {
        return [];
    }

    return [...stack.slice(0, -1), { ...current, scroll: Math.max(0, Math.round(scroll)) }];
}

/** Has the gesture gone far enough (distance or velocity) to commit the back navigation? */
export function shouldCompleteBack(distance: number, width: number, velocity: number): boolean {
    if (distance <= 0 || width <= 0) {
        return false;
    }

    return distance / width >= 0.35 || (velocity > 0.5 && distance > 40);
}

function findLastIndex(stack: ReadonlyArray<HistoryEntry>, url: string): number {
    for (let index = stack.length - 1; index >= 0; index--) {
        if (stack[index]?.url === url) {
            return index;
        }
    }

    return -1;
}
