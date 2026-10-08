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

let submitted: string[] = [];

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
    vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(function (this: HTMLFormElement) {
        submitted.push(this.getAttribute('action') ?? '');
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
    document.body.innerHTML = '';
    await tick();
    vi.restoreAllMocks();
});

const panelButtons = (): HTMLElement[] => Array.from(document.querySelectorAll<HTMLElement>('.rm-mnb-swipe-actions__button'));
const submitAction = (url: string): void => {
    const form = query<HTMLFormElement>(`form[action="${url}"]`);
    form.dispatchEvent(new Event('submit', { cancelable: true }));
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
