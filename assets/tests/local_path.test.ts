import { describe, expect, it } from 'vitest';

import { isLocalPath } from '../src/utils/same_origin';

// The shared list of docs/security.md, also played by LocalPath (PHP) and by consumers.
describe('local path', () => {
    it.each([
        ['/accounts/12?tab=history', true],
        ['/a%0ab', true],
        [`/${'a'.repeat(2047)}`, true],
        [`/${'a'.repeat(2048)}`, false],
        ['', false],
        ['accounts', false],
        ['//evil.example', false],
        ['/\\evil.example', false],
        ['/\t/evil.example', false],
        ['/a\nb', false],
        ['/a b', false],
        ['/a\x7Fb', false],
        ['https://evil.example', false],
        ['javascript:alert(1)', false],
    ])('%j is local: %s', (value, expected) => {
        expect(isLocalPath(value)).toBe(expected);
    });
});
