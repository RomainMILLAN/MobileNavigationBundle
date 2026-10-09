/**
 * @vitest-environment jsdom
 */
import { Application } from '@hotwired/stimulus';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import LargeTitleController from '../src/controllers/large_title_controller';

/**
 * Who scrolls decides how the compact bar is held: only a scroller that scrolls itself may
 * keep it in absolute position; when the document scrolls, absolute would scroll it away.
 */

function markup(scrollerStyle: string): string {
    return `
        <div data-controller="large-title">
            <div class="rm-mnb-scroller" style="${scrollerStyle}" data-large-title-target="scroller">
                <div class="rm-mnb-compact-bar-veil"></div>
                <div class="rm-mnb-compact-bar" data-large-title-target="bar"></div>
                <h1 data-large-title-target="title">Title</h1>
            </div>
        </div>`;
}

const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));
const bar = (): HTMLElement => document.querySelector('.rm-mnb-compact-bar') as HTMLElement;

let roots: (Element | Document | null | undefined)[];
let application: Application;

beforeAll(() => {
    application = Application.start();
    application.register('large-title', LargeTitleController);
});

beforeEach(() => {
    roots = [];
    // jsdom has no IntersectionObserver: record the root each one is given.
    vi.stubGlobal(
        'IntersectionObserver',
        class {
            constructor(_callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
                roots.push(options?.root);
            }

            observe(): void {}

            disconnect(): void {}
        },
    );
});

afterEach(async () => {
    document.body.innerHTML = '';
    await tick();
    vi.unstubAllGlobals();
});

describe('large-title', () => {
    it('holds the bar in its scroller when the scroller scrolls itself', async () => {
        document.body.innerHTML = markup('overflow-y: auto');
        await tick();

        expect(bar().classList.contains('is-contained')).toBe(true);
        expect(roots).toEqual([document.querySelector('.rm-mnb-scroller')]);
    });

    it('leaves the bar fixed when the document scrolls', async () => {
        document.body.innerHTML = markup('');
        await tick();

        expect(bar().classList.contains('is-contained')).toBe(false);
        expect(roots).toEqual([null]);
    });
});
