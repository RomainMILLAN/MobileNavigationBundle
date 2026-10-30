import { describe, expect, it } from 'vitest';

// Environment `node`: no window, no document. The package must still import (SSR, the
// consumers' own Node tests), every controller module included.
describe('import outside a browser', () => {
    it('imports the index without touching window', async () => {
        const module = await import('../src/index');

        expect(Object.keys(module.controllers)).toContain('back');
    });
});
