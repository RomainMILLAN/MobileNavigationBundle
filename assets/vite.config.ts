import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { defineConfig, type UserConfig } from 'vite';

/**
 * One config, one entry per build (selected by --mode, see build.mjs): the index and
 * each controller. Every dist file is self-contained (no shared chunk) so that Webpack
 * Encore, Vite and AssetMapper can consume it as is. Output is unminified and hash-free:
 * dist/ is committed and CI checks it is reproducible (`git diff --exit-code dist`).
 * @hotwired/stimulus stays external; Turbo is never imported (read from window.Turbo).
 */
const root = import.meta.dirname;

interface Entry {
    entry: string;
    fileName: string;
}

export const entries: Record<string, Entry> = {
    index: { entry: 'src/index.ts', fileName: 'index.js' },
    ...Object.fromEntries(
        readdirSync(resolve(root, 'src/controllers'))
            .filter((file) => file.endsWith('_controller.ts'))
            .sort()
            .map((file) => {
                const name = file.replace(/\.ts$/, '');

                return [name, { entry: `src/controllers/${file}`, fileName: `controllers/${name}.js` }];
            }),
    ),
};

export default defineConfig(({ mode }): UserConfig => {
    const selected = entries[mode];

    if (!selected) {
        throw new Error(`Unknown build mode "${mode}". Expected one of: ${Object.keys(entries).join(', ')}.`);
    }

    return {
        publicDir: false,
        build: {
            outDir: resolve(root, 'dist'),
            // The first build (index) empties dist/, the others add to it.
            emptyOutDir: mode === 'index',
            target: 'es2022',
            minify: false,
            sourcemap: false,
            reportCompressedSize: false,
            copyPublicDir: false,
            lib: {
                entry: resolve(root, selected.entry),
                formats: ['es'],
                fileName: () => selected.fileName,
            },
            rolldownOptions: {
                external: ['@hotwired/stimulus'],
            },
        },
    };
});
