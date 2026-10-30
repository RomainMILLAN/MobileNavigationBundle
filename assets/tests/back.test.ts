/**
 * @vitest-environment jsdom
 */
import { Application } from '@hotwired/stimulus';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import type { BackTarget } from '../src/utils/history_stack';
import type { GoBackResult } from '../src/utils/history_tracker';

// The controller's logic only: the tracker has its own tests.
const fake = vi.hoisted(() => ({
    target: null as BackTarget | null,
    going: false,
    goBack: vi.fn<(target: BackTarget) => GoBackResult>(),
}));

vi.mock('../src/utils/history_tracker', () => ({
    historyTracker: () => ({
        ensureStarted: () => undefined,
        target: () => fake.target,
        goBack: fake.goBack,
        isGoingBack: () => fake.going,
        restoredEntry: () => null,
    }),
}));

const { default: BackController } = await import('../src/controllers/back_controller');

const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));
const target = (title: string): BackTarget => ({ steps: 2, entry: { id: 'a', index: 0, url: '/account', scroll: 0, title } });

const BUTTON = `<a id="back" href="/transactions" aria-label="Retour à Transactions"
    data-controller="back" data-action="back#go"
    data-back-target-label-value="Retour à %label%"
    data-back-previous-label-value="Page précédente"
    data-back-fallback-label-value="Retour à Transactions">‹</a>`;

const click = (init: MouseEventInit = {}): MouseEvent => {
    const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...init });
    document.getElementById('back')!.dispatchEvent(event);

    return event;
};

beforeAll(() => {
    Application.start().register('back', BackController);
    // jsdom would try to navigate on an unprevented click.
    document.addEventListener('click', (event) => event.preventDefault());
});

beforeEach(() => {
    fake.target = null;
    fake.going = false;
    fake.goBack.mockReset().mockReturnValue('navigating');
});

describe('back controller', () => {
    it('goes back to the previous page instead of following the href', async () => {
        fake.target = target('Compte courant');
        document.body.innerHTML = BUTTON;
        await tick();

        const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
        const prevented = vi.spyOn(event, 'preventDefault');
        document.getElementById('back')!.dispatchEvent(event);

        expect(fake.goBack).toHaveBeenCalledWith(fake.target);
        expect(prevented).toHaveBeenCalled();
    });

    it('follows the href without a previous page, or when going back is refused', async () => {
        document.body.innerHTML = BUTTON;
        await tick();
        const followed = (): boolean => {
            const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
            const prevented = vi.spyOn(event, 'preventDefault');
            document.getElementById('back')!.dispatchEvent(event);
            // Only the document listener of this test file prevents it.
            return prevented.mock.calls.length === 1;
        };

        expect(followed()).toBe(true);
        fake.target = target('Compte');
        fake.goBack.mockReturnValue('refused');
        expect(followed()).toBe(true);
    });

    it('follows the href on a modified click', async () => {
        fake.target = target('Compte');
        document.body.innerHTML = BUTTON;
        await tick();

        click({ metaKey: true });
        click({ button: 1 });

        expect(fake.goBack).not.toHaveBeenCalled();
    });

    it('never navigates a second time while going back', async () => {
        fake.target = target('Compte');
        document.body.innerHTML = BUTTON;
        await tick();
        fake.going = true;

        const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
        const prevented = vi.spyOn(event, 'preventDefault');
        document.getElementById('back')!.dispatchEvent(event);

        expect(fake.goBack).not.toHaveBeenCalled();
        expect(prevented).toHaveBeenCalledTimes(2);
    });

    it('says where the click leads', async () => {
        const label = (): string | null => document.getElementById('back')!.getAttribute('aria-label');

        fake.target = target('Compte $& courant');
        document.body.innerHTML = BUTTON;
        await tick();
        expect(label()).toBe('Retour à Compte $& courant');

        fake.target = target('');
        document.dispatchEvent(new Event('turbo:load'));
        expect(label()).toBe('Page précédente');

        fake.target = null;
        document.dispatchEvent(new Event('turbo:morph'));
        expect(label()).toBe('Retour à Transactions');
    });

    it('leaves the aria-label alone without a target label (a Cancel link)', async () => {
        fake.target = target('Compte');
        document.body.innerHTML = '<a id="back" href="/list" data-controller="back" data-action="back#go">Annuler</a>';
        await tick();

        expect(document.getElementById('back')!.hasAttribute('aria-label')).toBe(false);
    });
});
