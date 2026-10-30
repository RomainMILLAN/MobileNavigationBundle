import { MAX_ENTRIES, type HistoryEntry, type SavedHistory } from './history_stack';

/**
 * The only owner of the `rm-mnb-history` key. What comes back from sessionStorage is
 * untrusted: every entry is checked, a rejected entry leaves a hole in the indexes and
 * the register then answers null, on purpose. Never "repair" by compacting the indexes.
 *
 * Titles are never written (account names at rest in the tab, surviving a logout): they
 * live in the tracker's memory only, read back empty after a reload.
 */
const STORAGE_KEY = 'rm-mnb-history';

export function readSaved(): SavedHistory | null {
    try {
        const raw = window.sessionStorage.getItem(STORAGE_KEY);
        if (raw === null) {
            return null;
        }
        const parsed: unknown = JSON.parse(raw);
        if (typeof parsed !== 'object' || parsed === null) {
            return null;
        }
        const { stack, loadedIndex, historyLength } = parsed as Record<string, unknown>;
        if (!Array.isArray(stack) || !isIndex(loadedIndex) || !isIndex(historyLength)) {
            return null;
        }

        return {
            stack: stack.filter(isStoredEntry).map(({ id, index, url, scroll }) => ({ id, index, url, scroll, title: '' })),
            loadedIndex,
            historyLength,
        };
    } catch {
        return null;
    }
}

export function writeSaved(saved: SavedHistory): void {
    const stored = {
        stack: saved.stack.slice(-MAX_ENTRIES).map(({ id, index, url, scroll }) => ({ id, index, url, scroll })),
        loadedIndex: saved.loadedIndex,
        historyLength: saved.historyLength,
    };
    try {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    } catch {
        // Never leave an older register behind, adoptable after a reload.
        clearSaved();
    }
}

export function clearSaved(): void {
    try {
        window.sessionStorage.removeItem(STORAGE_KEY);
    } catch {
        // Storage unavailable (private browsing): nothing was written either.
    }
}

function isIndex(value: unknown): value is number {
    return Number.isSafeInteger(value) && (value as number) >= 0;
}

function isStoredEntry(value: unknown): value is Omit<HistoryEntry, 'title'> {
    if (typeof value !== 'object' || value === null) {
        return false;
    }
    const entry = value as Record<string, unknown>;

    return typeof entry.id === 'string' && typeof entry.url === 'string' && isIndex(entry.index) && isIndex(entry.scroll);
}
