/**
 * @vitest-environment jsdom
 */
import { Application } from '@hotwired/stimulus';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import NavigateController from '../src/controllers/navigate_controller';
import SwipeActionsController from '../src/controllers/swipe_actions_controller';
import SwipeBackController from '../src/controllers/swipe_back_controller';

const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

let assign: ReturnType<typeof vi.fn>;

beforeAll(() => {
    const application = Application.start();
    application.register('navigate', NavigateController);
    application.register('swipe-actions', SwipeActionsController);
    application.register('swipe-back', SwipeBackController);
});

beforeEach(() => {
    assign = vi.fn();
    vi.spyOn(window, 'location', 'get').mockReturnValue({
        ...window.location,
        href: 'https://app.example/accounts',
        origin: 'https://app.example',
        assign,
    } as unknown as Location);
});

afterEach(async () => {
    document.body.innerHTML = '';
    delete window.Turbo;
    await tick();
    vi.restoreAllMocks();
});

async function clickNavigate(url: string): Promise<void> {
    document.body.innerHTML = `<button id="go" data-controller="navigate" data-navigate-url-value="${url}" data-action="navigate#visit"></button>`;
    await tick();
    document.getElementById('go')?.click();
}

describe('navigate controller', () => {
    it.each([
        ['javascript:alert(1)'],
        ['https://evil.example/x'],
        ['//evil.example/x'],
        ['http://[::1'],
    ])('ignores %s', async (url) => {
        const visit = vi.fn();
        window.Turbo = { visit };

        await clickNavigate(url);

        expect(visit).not.toHaveBeenCalled();
        expect(assign).not.toHaveBeenCalled();
    });

    it('visits once with Turbo and never assigns', async () => {
        const visit = vi.fn();
        window.Turbo = { visit };

        await clickNavigate('/transactions?page=2');

        expect(visit).toHaveBeenCalledTimes(1);
        expect(visit).toHaveBeenCalledWith('https://app.example/transactions?page=2');
        expect(assign).not.toHaveBeenCalled();
    });

    it('falls back to a full page load without Turbo', async () => {
        await clickNavigate('/transactions');

        expect(assign).toHaveBeenCalledWith('https://app.example/transactions');
    });
});

describe('swipe-actions controller', () => {
    it('ignores an action that targets another host', async () => {
        const actions = [
            { url: '/edit', icon: 'icon-edit', tone: 'accent', label: 'Edit' },
            { url: 'https://evil.example/steal', icon: 'icon-x', tone: 'negative', label: 'Steal', method: 'POST' },
            { url: 'javascript:alert(1)', icon: 'icon-x', tone: 'negative', label: 'Script' },
        ];
        document.body.innerHTML = `<div class="rm-mnb-list-row" data-controller="swipe-actions"
            data-swipe-actions-actions-value='${JSON.stringify(actions)}' data-swipe-actions-csrf-token-value="token"></div>`;
        await tick();

        const labels = Array.from(document.querySelectorAll('.rm-mnb-swipe-actions__button')).map((button) => button.getAttribute('aria-label'));

        expect(labels).toEqual(['Edit']);
    });
});

describe('swipe-back controller', () => {
    it('stays inert without Turbo', async () => {
        const addEventListener = vi.spyOn(document, 'addEventListener');
        document.body.innerHTML = '<div class="rm-mnb-scroller" data-controller="swipe-back"></div>';
        await tick();

        expect(addEventListener.mock.calls.map(([type]) => type)).not.toContain('turbo:load');
        expect(window.sessionStorage.getItem('rm-mnb-history')).toBeNull();
    });

    // After the inert case: the history tracking is installed once per page.
    it('tracks the history with Turbo', async () => {
        window.Turbo = { visit: vi.fn(), session: { view: { snapshotCache: { get: () => undefined } } } };
        const addEventListener = vi.spyOn(document, 'addEventListener');
        document.body.innerHTML = '<div class="rm-mnb-scroller" data-controller="swipe-back"></div>';
        await tick();

        expect(addEventListener.mock.calls.map(([type]) => type)).toContain('turbo:load');
    });
});
