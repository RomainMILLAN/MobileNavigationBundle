/**
 * @vitest-environment jsdom
 */
import { Application } from '@hotwired/stimulus';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import ConfirmSheetController from '../src/controllers/confirm_sheet_controller';
import SheetController from '../src/controllers/sheet_controller';
import SwipeActionsController from '../src/controllers/swipe_actions_controller';

const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));
const query = <T extends Element>(selector: string): T => document.querySelector(selector) as T;

const ACTIONS = [
    { url: '/edit', icon: 'icon-edit', tone: 'accent', label: 'Modifier' },
    { url: '/cancel', icon: 'icon-x', tone: 'negative', label: 'Annuler', method: 'POST', confirm: 'Elle ne comptera plus.' },
    { url: '/validate', icon: 'icon-ok', tone: '<img src=x>', label: '<b>Valider</b>', method: 'POST' },
    { url: '/delete', icon: 'icon-trash', tone: 'negative', label: 'Supprimer', method: 'DELETE', confirm: 'Définitivement.' },
    { url: '/patch', icon: 'icon-pen', tone: 'accent', label: 'Corriger', method: 'patch' },
    { url: '/odd', icon: 'icon-x', tone: 'accent', label: 'Bizarre', method: 'TRACE' },
];

// The ConfirmSheet.html.twig markup, with short Stimulus identifiers.
const confirmSheet = `
    <div id="confirm" class="rm-mnb-sheet" role="alertdialog" aria-modal="true"
         data-controller="sheet confirm-sheet" data-sheet-name-value="confirm" data-confirm-sheet-sheet-value="confirm">
        <div class="rm-mnb-sheet__backdrop" data-action="click->sheet#dismiss"></div>
        <div class="rm-mnb-sheet__panel" tabindex="-1" data-sheet-target="panel">
            <h2 data-confirm-sheet-target="title"></h2>
            <p data-confirm-sheet-target="message"></p>
            <button type="button" id="destroy" data-confirm-sheet-target="confirm" data-action="confirm-sheet#confirm"></button>
            <button type="button" id="close" data-action="sheet#dismiss">Fermer</button>
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
let nativeSubmit: ReturnType<typeof vi.spyOn>;

// A browser ignores requestSubmit() while the form is still firing its submit event (the
// "firing submission events" flag); jsdom does not. Reproduced here, or a resubmission from
// inside the submit listener would pass the tests and do nothing in a browser.
const firing = new WeakSet<HTMLFormElement>();
const requestSubmit = HTMLFormElement.prototype.requestSubmit;
const whileFiring = (form: HTMLFormElement, fire: () => void): void => {
    firing.add(form);
    try {
        fire();
    } finally {
        firing.delete(form);
    }
};

beforeAll(() => {
    if (typeof window.requestAnimationFrame !== 'function') {
        vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => setTimeout(() => callback(0), 0));
    }
    const application = Application.start();
    application.register('sheet', SheetController);
    application.register('confirm-sheet', ConfirmSheetController);
    application.register('swipe-actions', SwipeActionsController);
});

beforeEach(async () => {
    submitted = [];
    redirects = [];
    document.addEventListener('submit', onDocumentSubmit);
    nativeSubmit = vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(() => undefined);
    vi.spyOn(HTMLFormElement.prototype, 'requestSubmit').mockImplementation(function (this: HTMLFormElement, submitter?: HTMLElement | null) {
        if (!firing.has(this)) {
            whileFiring(this, () => requestSubmit.call(this, submitter));
        }
    });
    vi.spyOn(Element.prototype, 'getClientRects').mockReturnValue([{}] as unknown as DOMRectList);
    document.body.innerHTML = `
        ${confirmSheet}
        <div class="rm-mnb-list-row" data-controller="swipe-actions"
             data-swipe-actions-actions-value='${JSON.stringify(ACTIONS).replace(/'/g, '&#39;')}'
             data-swipe-actions-csrf-token-value="token"></div>`;
    await tick();
});

afterEach(async () => {
    document.removeEventListener('submit', onDocumentSubmit);
    document.body.innerHTML = '';
    await tick();
    vi.restoreAllMocks();
});

const panelButtons = (): HTMLElement[] => Array.from(document.querySelectorAll<HTMLElement>('.rm-mnb-swipe-actions__button'));
const submitAction = (url: string): void => {
    const form = query<HTMLFormElement>(`form[action="${url}"]`);
    // The user's tap: a real submit event, which bubbles.
    whileFiring(form, () => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
};
const touch = (type: string, clientX: number): void => {
    const event = new Event(type, { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'touches', { value: type === 'touchend' ? [] : [{ clientX, clientY: 10 }] });
    query('.rm-mnb-list-row').dispatchEvent(event);
};

describe('swipe panel', () => {
    it('gives each button a visible and accessible label, set as text', () => {
        const buttons = panelButtons();

        expect(buttons.slice(0, 3).map((button) => button.getAttribute('aria-label'))).toEqual(['Modifier', 'Annuler', '<b>Valider</b>']);
        expect(buttons[2]?.querySelector('b')).toBeNull();
        expect(buttons[2]?.textContent).toContain('<b>Valider</b>');
    });

    it('only sets a tone class from the closed list', () => {
        const buttons = panelButtons();

        expect(buttons[1]?.classList.contains('rm-mnb-tone--negative')).toBe(true);
        expect(buttons[2]?.className).toContain('rm-mnb-tone--neutral');
        expect(buttons[2]?.className).not.toContain('img');
    });

    it('sends a POST action without confirmation right away', () => {
        submitAction('/validate');

        expect(submitted).toEqual(['/validate']);
    });
});

describe('destructive action confirmation', () => {
    it('sends nothing before confirmation and opens the sheet with the action label', () => {
        submitAction('/cancel');

        expect(submitted).toEqual([]);
        expect(query('#confirm').classList.contains('rm-mnb-sheet--open')).toBe(true);
        expect(query('[data-confirm-sheet-target="title"]').textContent).toBe('Annuler');
        expect(query('[data-confirm-sheet-target="message"]').textContent).toBe('Elle ne comptera plus.');
        expect(query('#destroy').textContent).toBe('Annuler');
        expect(query('#close').textContent).toBe('Fermer');
    });

    it('sends the action once confirmed', () => {
        submitAction('/cancel');

        query<HTMLButtonElement>('#destroy').click();

        expect(submitted).toEqual(['/cancel']);
        expect(query('#confirm').classList.contains('rm-mnb-sheet--open')).toBe(false);
    });

    it('discards the action when closing without confirming', () => {
        submitAction('/cancel');
        query<HTMLButtonElement>('#close').click();

        query<HTMLButtonElement>('#destroy').click();

        expect(submitted).toEqual([]);
    });
});

describe('method spoofing', () => {
    const methodField = (url: string): HTMLInputElement | null => query<HTMLFormElement>(`form[action="${url}"]`).querySelector('input[name="_method"]');

    it('still submits a POST form, carrying the method in a _method field', () => {
        expect(query<HTMLFormElement>('form[action="/delete"]').method.toUpperCase()).toBe('POST');
        expect(methodField('/delete')?.value).toBe('DELETE');
        expect(methodField('/patch')?.value).toBe('PATCH');
    });

    it('adds no _method field to a plain POST nor to a method outside the closed list', () => {
        expect(methodField('/validate')).toBeNull();
        expect(methodField('/odd')).toBeNull();
    });

    it('still confirms a destructive DELETE before sending it', () => {
        submitAction('/delete');
        expect(submitted).toEqual([]);

        query<HTMLButtonElement>('#destroy').click();

        expect(submitted).toEqual(['/delete']);
    });
});

describe('submission through Turbo', () => {
    it('lets exactly one submit reach the document, never through form.submit()', () => {
        history.replaceState(null, '', '/accounts/3?page=2');

        submitAction('/validate');

        expect(submitted).toEqual(['/validate']);
        expect(redirects).toEqual(['/accounts/3?page=2']);
        expect(nativeSubmit).not.toHaveBeenCalled();
    });

    it('lets the user\'s own submit through for an action without confirmation', () => {
        submitAction('/validate');

        expect(HTMLFormElement.prototype.requestSubmit).not.toHaveBeenCalled();
        expect(submitted).toEqual(['/validate']);
    });

    it('sends a single POST on a double tap', () => {
        submitAction('/validate');
        submitAction('/validate');

        expect(submitted).toEqual(['/validate']);
    });

    it('lets the action be sent again after a failed Turbo submission', () => {
        submitAction('/validate');
        query('form[action="/validate"]').dispatchEvent(new CustomEvent('turbo:submit-end', { detail: { success: false } }));

        submitAction('/validate');

        expect(submitted).toEqual(['/validate', '/validate']);
    });

    it('keeps the confirmation for the next tap after a confirmed destructive action', () => {
        submitAction('/cancel');
        query<HTMLButtonElement>('#destroy').click();

        submitAction('/delete');

        expect(submitted).toEqual(['/cancel']);
        expect(query('#confirm').classList.contains('rm-mnb-sheet--open')).toBe(true);
    });

    it('drops the pass when the form was detached and fired nothing', () => {
        const form = query<HTMLFormElement>('form[action="/cancel"]');
        // A browser fires no submit event for a detached form; jsdom would.
        form.requestSubmit = (): void => undefined;
        submitAction('/cancel');
        query<HTMLButtonElement>('#destroy').click();

        submitAction('/cancel');

        expect(submitted).toEqual([]);
        expect(query('#confirm').classList.contains('rm-mnb-sheet--open')).toBe(true);
    });

    it('rebuilds its panel removed by a Turbo morph, and its actions still go through', () => {
        submitAction('/validate');
        document.querySelectorAll('.rm-mnb-swipe-actions').forEach((panel) => panel.remove());

        touch('touchstart', 300);
        touch('touchmove', 0);
        touch('touchend', 0);

        const panel = query('.rm-mnb-swipe-actions');
        expect(panel?.isConnected).toBe(true);
        expect(panelButtons()).toHaveLength(ACTIONS.length);
        submitAction('/validate');
        expect(submitted).toEqual(['/validate', '/validate']);
    });
});

describe('return path', () => {
    const mountLink = async (action: Record<string, unknown>): Promise<HTMLAnchorElement> => {
        document.body.innerHTML = `
            <div class="rm-mnb-list-row" data-controller="swipe-actions"
                 data-swipe-actions-actions-value='${JSON.stringify([action])}'
                 data-swipe-actions-csrf-token-value="token"></div>`;
        await tick();
        const link = query<HTMLAnchorElement>('a.rm-mnb-swipe-actions__button');
        // jsdom would navigate on an unprevented click.
        link.addEventListener('click', (event) => event.preventDefault());

        return link;
    };
    const edit = { url: '/transactions/7/edit', icon: 'icon-edit', tone: 'accent', label: 'Modifier' };

    it('adds the current path on click, read at click time', async () => {
        history.replaceState(null, '', '/accounts/3');
        const link = await mountLink({ ...edit, carriesReturnPath: true });
        history.replaceState(null, '', '/accounts/3?page=2');

        link.click();

        expect(new URL(link.href).searchParams.get('_redirect')).toBe('/accounts/3?page=2');
    });

    it('leaves the link alone when not asked, or when it already has one', async () => {
        history.replaceState(null, '', '/accounts/3');
        const plain = await mountLink(edit);
        plain.click();
        expect(new URL(plain.href).searchParams.has('_redirect')).toBe(false);

        const own = await mountLink({ ...edit, url: '/transactions/7/edit?_redirect=/home', carriesReturnPath: true });
        own.click();
        expect(new URL(own.href).searchParams.get('_redirect')).toBe('/home');
    });

    it('never carries a path that is not local', async () => {
        const link = await mountLink({ ...edit, carriesReturnPath: true });
        vi.spyOn(window, 'location', 'get').mockReturnValue({
            ...window.location,
            href: 'https://app.example//evil.tld',
            origin: 'https://app.example',
            pathname: '//evil.tld',
            search: '',
        } as unknown as Location);

        link.click();

        expect(new URL(link.href).searchParams.has('_redirect')).toBe(false);
    });

    it('sends an empty _redirect from a page whose path is not local', () => {
        vi.spyOn(window, 'location', 'get').mockReturnValue({
            ...window.location,
            pathname: '//evil.tld',
            search: '',
        } as unknown as Location);

        submitAction('/validate');

        expect(redirects).toEqual(['']);
    });
});
