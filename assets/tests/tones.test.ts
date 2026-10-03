import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { TONES, toTone } from '../src/utils/tones';

describe('tones', () => {
    it('are the same list in TypeScript and in SCSS', () => {
        const tokens = readFileSync(resolve(__dirname, '../styles/_tokens.scss'), 'utf8');
        const scss = tokens.match(/\$rm-mnb-tones:\s*([^;]+);/)?.[1]?.split(',').map((tone) => tone.trim());

        expect(scss).toEqual([...TONES]);
    });

    it('fall back to neutral', () => {
        expect(toTone('positive')).toBe('positive');
        expect(toTone('<img src=x>')).toBe('neutral');
        expect(toTone(undefined)).toBe('neutral');
    });
});
