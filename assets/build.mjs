// Builds every entry of vite.config.ts, one after the other (index first: it empties dist/).
import { build } from 'vite';

const { entries } = await import('./vite.config.ts');

for (const mode of Object.keys(entries)) {
    await build({ mode, logLevel: 'warn' });
}
