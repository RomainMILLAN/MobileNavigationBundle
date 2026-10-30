/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { readSaved, writeSaved } from '../src/utils/history_store';

const KEY = 'rm-mnb-history';

beforeEach(() => {
    window.sessionStorage.clear();
});

describe('history store', () => {
    it('never writes a title', () => {
        writeSaved({ stack: [{ id: 'a', index: 0, url: '/a', scroll: 3, title: 'Compte joint' }], loadedIndex: 0, historyLength: 2 });

        expect(window.sessionStorage.getItem(KEY)).not.toContain('Compte');
        expect(readSaved()).toEqual({ stack: [{ id: 'a', index: 0, url: '/a', scroll: 3, title: '' }], loadedIndex: 0, historyLength: 2 });
    });

    it('rejects every malformed entry', () => {
        window.sessionStorage.setItem(KEY, JSON.stringify({
            stack: [
                { id: 'ok', index: 1, url: '/ok', scroll: 0 },
                { id: 'nan', index: null, url: '/x', scroll: 0 },
                { id: 'float', index: 2.5, url: '/x', scroll: 0 },
                { id: 'negative', index: -1, url: '/x', scroll: 0 },
                { id: 3, index: 3, url: '/x', scroll: 0 },
                { id: 'scroll', index: 4, url: '/x', scroll: '12' },
                'garbage',
            ],
            loadedIndex: 1,
            historyLength: 3,
        }));

        expect(readSaved()?.stack.map((entry) => entry.id)).toEqual(['ok']);
    });

    it('rejects a malformed register', () => {
        window.sessionStorage.setItem(KEY, '{not json');
        expect(readSaved()).toBeNull();
        window.sessionStorage.setItem(KEY, JSON.stringify({ stack: [], loadedIndex: 'x', historyLength: 1 }));
        expect(readSaved()).toBeNull();
    });

    it('removes the key when it cannot be written', () => {
        window.sessionStorage.setItem(KEY, JSON.stringify({ stack: [], loadedIndex: 0, historyLength: 1 }));
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('QuotaExceededError');
        });

        writeSaved({ stack: [], loadedIndex: 0, historyLength: 1 });

        expect(window.sessionStorage.getItem(KEY)).toBeNull();
    });
});
