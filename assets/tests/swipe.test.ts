/**
 * @vitest-environment jsdom
 */
import { Application } from '@hotwired/stimulus';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import ConfirmSheetController from '../src/controllers/confirm_sheet_controller';
import ConfirmSubmitController from '../src/controllers/confirm_submit_controller';
import SheetController from '../src/controllers/sheet_controller';
import SwipeActionsController from '../src/controllers/swipe_actions_controller';

const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));
const query = <T extends Element>(selector: string): T => document.querySelector(selector) as T;
const queryAll = <T extends Element>(selector: string): T[] => Array.from(document.querySelectorAll<T>(selector));

// The ConfirmSheet.html.twig markup, with short Stimulus identifiers.
const confirmSheet = `
    <dialog id="rm-mnb-confirm" class="rm-mnb-sheet" role="alertdialog"
         data-controller="sheet confirm-sheet" data-sheet-name-value="rm-mnb-confirm" data-confirm-sheet-sheet-value="rm-mnb-confirm">
        <div class="rm-mnb-sheet__panel" tabindex="-1" data-sheet-target="panel">
            <h2 data-confirm-sheet-target="title"></h2>
            <p data-confirm-sheet-target="message"></p>
            <button type="button" id="destroy" data-confirm-sheet-target="confirm" data-action="confirm-sheet#confirm"></button>
            <button type="button" id="close" data-action="sheet#dismiss">Fermer</button>
        </div>
    </dialog>`;

// What ListRow.html.twig renders around a row with actions (_swipe_toggle, _swipe_panel).
const row = (id: string): string => `
    <div class="rm-mnb-list-row" id="${id}" data-controller="swipe-actions">
        <div class="rm-mnb-swipe" data-swipe-actions-target="track">
            <div class="rm-mnb-swipe__content">
                <a href="/items/${id}" class="rm-mnb-list-row__main">Item ${id}</a>
                <button type="button" class="rm-mnb-swipe__toggle" hidden aria-expanded="false" aria-controls="${id}-panel"
                        data-swipe-actions-target="toggle" data-action="swipe-actions#toggle">…</button>
            </div>
            <div class="rm-mnb-swipe-actions" id="${id}-panel" role="group" data-swipe-actions-target="panel">
                <a href="/items/${id}/edit" class="rm-mnb-swipe-actions__button" data-action="click->swipe-actions#carryReturnPath">Modifier</a>
                <form method="post" action="/items/${id}/validate" class="rm-mnb-swipe-actions__form">
                    <input type="hidden" name="_token" value="token">
                    <input type="hidden" name="_redirect" value="">
                    <button type="submit" class="rm-mnb-swipe-actions__button">Valider</button>
                </form>
                <form method="post" action="/items/${id}/delete" class="rm-mnb-swipe-actions__form"
                      data-controller="confirm-submit" data-confirm-submit-title-value="Supprimer"
                      data-confirm-submit-message-value="Définitivement." data-confirm-submit-confirm-label-value="Supprimer">
                    <input type="hidden" name="_token" value="token">
                    <input type="hidden" name="_method" value="DELETE">
                    <input type="hidden" name="_redirect" value="">
                    <button type="submit" class="rm-mnb-swipe-actions__button">Supprimer</button>
                </form>
            </div>
        </div>
    </div>`;

// What reaches the document (where Turbo listens) without being cancelled: the
// submissions Turbo would take over. preventDefault() then stops jsdom navigating.
let submitted: string[] = [];
let redirects: string[] = [];
const onDocumentSubmit = (event: Event): void => {
    const form = event.target as HTMLFormElement;
    if (!event.defaultPrevented) {
        submitted.push(form.getAttribute('action') ?? '');
        redirects.push((form.elements.namedItem('_redirect') as HTMLInputElement | null)?.value ?? '');
    }
    event.preventDefault();
};

const submit = (url: string): void => {
    query<HTMLFormElement>(`form[action="${url}"]`).dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
};

/** jsdom has no layout: the track is given a scrollable width, and scrollTo moves it. */
function layOut(track: HTMLElement, max = 216): void {
    Object.defineProperty(track, 'scrollWidth', { configurable: true, value: 375 + max });
    Object.defineProperty(track, 'clientWidth', { configurable: true, value: 375 });
    track.scrollTo = ((options: ScrollToOptions) => {
        track.scrollLeft = options.left ?? 0;
        track.dispatchEvent(new Event('scroll'));
    }) as typeof track.scrollTo;
}

const track = (id: string): HTMLElement => query(`#${id} .rm-mnb-swipe`);
const toggle = (id: string): HTMLButtonElement => query(`#${id} .rm-mnb-swipe__toggle`);
const actionsOf = (id: string): HTMLElement[] => queryAll(`#${id} .rm-mnb-swipe-actions__button`);

beforeAll(() => {
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
        callback(0);
        return 0;
    });
    const application = Application.start();
    application.register('sheet', SheetController);
    application.register('confirm-sheet', ConfirmSheetController);
    application.register('confirm-submit', ConfirmSubmitController);
    application.register('swipe-actions', SwipeActionsController);
});

beforeEach(async () => {
    submitted = [];
    redirects = [];
    document.addEventListener('submit', onDocumentSubmit);
    vi.spyOn(Element.prototype, 'getClientRects').mockReturnValue([{}] as unknown as DOMRectList);
    history.replaceState(null, '', '/items?page=2');
    document.body.innerHTML = confirmSheet + row('a') + row('b');
    await tick();
    layOut(track('a'));
    layOut(track('b'));
});

afterEach(async () => {
    document.removeEventListener('submit', onDocumentSubmit);
    document.body.innerHTML = '';
    await tick();
    vi.restoreAllMocks();
});

describe('the panel without the gesture', () => {
    it('shows the "Actions" button and keeps hidden actions out of the tab order', () => {
        expect(toggle('a').hidden).toBe(false);
        expect(toggle('a').getAttribute('aria-expanded')).toBe('false');
        expect(actionsOf('a').map((action) => action.getAttribute('tabindex'))).toEqual(['-1', '-1', '-1']);
    });

    it('reveals the actions, makes them focusable and focuses the first one', () => {
        toggle('a').click();

        expect(track('a').scrollLeft).toBe(216);
        expect(toggle('a').getAttribute('aria-expanded')).toBe('true');
        expect(actionsOf('a').map((action) => action.getAttribute('tabindex'))).toEqual(['0', '0', '0']);
        expect(document.activeElement).toBe(actionsOf('a')[0]);
    });

    it('hides them again from the same button', () => {
        toggle('a').click();
        toggle('a').click();

        expect(track('a').scrollLeft).toBe(0);
        expect(toggle('a').getAttribute('aria-expanded')).toBe('false');
    });

    it('closes on Escape and gives the focus back to the button', () => {
        toggle('a').click();

        actionsOf('a')[0]?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));

        expect(toggle('a').getAttribute('aria-expanded')).toBe('false');
        expect(document.activeElement).toBe(toggle('a'));
    });
});

describe('the state follows the scroll position', () => {
    it('opens when a swipe snaps the panel into view, and vibrates once', () => {
        const vibrate = vi.fn();
        Object.defineProperty(navigator, 'vibrate', { configurable: true, value: vibrate });

        track('a').scrollLeft = 216;
        track('a').dispatchEvent(new Event('scroll'));
        track('a').dispatchEvent(new Event('scroll'));

        expect(toggle('a').getAttribute('aria-expanded')).toBe('true');
        expect(vibrate).toHaveBeenCalledTimes(1);
    });

    it('does not change state mid-gesture', () => {
        track('a').scrollLeft = 100;
        track('a').dispatchEvent(new Event('scroll'));

        expect(toggle('a').getAttribute('aria-expanded')).toBe('false');
    });

    it('keeps a single row open', () => {
        toggle('a').click();
        toggle('b').click();

        expect(track('a').scrollLeft).toBe(0);
        expect(toggle('a').getAttribute('aria-expanded')).toBe('false');
        expect(toggle('b').getAttribute('aria-expanded')).toBe('true');
    });

    it('closes on a tap outside the row', () => {
        toggle('a').click();

        document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));

        expect(toggle('a').getAttribute('aria-expanded')).toBe('false');
    });

    it('closes before a Turbo snapshot and when a list mode starts', () => {
        toggle('a').click();
        document.dispatchEvent(new Event('turbo:before-cache'));
        expect(track('a').scrollLeft).toBe(0);

        toggle('a').click();
        window.dispatchEvent(new CustomEvent('rm-mnb-list:toggle-editing'));
        expect(track('a').scrollLeft).toBe(0);
    });
});

describe('writing actions', () => {
    it('sends a POST action right away, with the current path as _redirect, and closes the row', () => {
        toggle('a').click();

        submit('/items/a/validate');

        expect(submitted).toEqual(['/items/a/validate']);
        expect(redirects).toEqual(['/items?page=2']);
        expect(track('a').scrollLeft).toBe(0);
    });

    it('sends a single POST on a double tap, and again after a failed Turbo submission', () => {
        submit('/items/a/validate');
        submit('/items/a/validate');
        expect(submitted).toEqual(['/items/a/validate']);

        query('form[action="/items/a/validate"]').dispatchEvent(new CustomEvent('turbo:submit-end', { bubbles: true, detail: { success: false } }));
        submit('/items/a/validate');

        expect(submitted).toEqual(['/items/a/validate', '/items/a/validate']);
    });

    it('confirms a destructive action first, then sends it once', () => {
        submit('/items/a/delete');

        expect(submitted).toEqual([]);
        expect(query('#rm-mnb-confirm').classList.contains('rm-mnb-sheet--open')).toBe(true);
        expect(query('[data-confirm-sheet-target="message"]').textContent).toBe('Définitivement.');

        query<HTMLButtonElement>('#destroy').click();

        expect(submitted).toEqual(['/items/a/delete']);
        expect(redirects).toEqual(['/items?page=2']);
    });

    it('discards the destructive action when closing without confirming', () => {
        submit('/items/a/delete');
        query<HTMLButtonElement>('#close').click();

        query<HTMLButtonElement>('#destroy').click();

        expect(submitted).toEqual([]);
    });

    it('sends an empty _redirect from a page whose path is not local', () => {
        vi.spyOn(window, 'location', 'get').mockReturnValue({ ...window.location, pathname: '//evil.tld', search: '' } as unknown as Location);

        submit('/items/a/validate');

        expect(redirects).toEqual(['']);
    });
});

describe('return path of a link', () => {
    const link = (): HTMLAnchorElement => {
        const element = query<HTMLAnchorElement>('#a a.rm-mnb-swipe-actions__button');
        // jsdom would navigate on an unprevented click.
        element.addEventListener('click', (event) => event.preventDefault());

        return element;
    };

    it('adds the current path on click, read at click time', () => {
        const edit = link();
        history.replaceState(null, '', '/accounts/3?page=4');

        edit.click();

        expect(new URL(edit.href).searchParams.get('_redirect')).toBe('/accounts/3?page=4');
    });

    it('keeps the one the link already has', () => {
        const edit = link();
        edit.href = '/items/a/edit?_redirect=/home';

        edit.click();

        expect(new URL(edit.href).searchParams.get('_redirect')).toBe('/home');
    });

    it('never carries a path that is not local', () => {
        const edit = link();
        vi.spyOn(window, 'location', 'get').mockReturnValue({
            ...window.location,
            href: 'https://app.example//evil.tld',
            origin: 'https://app.example',
            pathname: '//evil.tld',
            search: '',
        } as unknown as Location);

        edit.click();

        expect(new URL(edit.href).searchParams.has('_redirect')).toBe(false);
    });
});
