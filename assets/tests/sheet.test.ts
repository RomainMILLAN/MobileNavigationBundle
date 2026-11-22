/**
 * @vitest-environment jsdom
 */
import { Application } from '@hotwired/stimulus';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import SheetController from '../src/controllers/sheet_controller';
import { returnTarget } from '../src/utils/focus_trap';

/**
 * Sheet choreography: only one open, idempotent receivers, forced close
 * (lock screen, Bootstrap modal), and where focus returns.
 */

function sheetMarkup(name: string): string {
    return `
        <dialog class="sheet" id="${name}"
             data-controller="sheet" data-sheet-name-value="${name}"
             data-sheet-force-close-events-value='["turbo:before-cache","inactivity:locked","show.bs.modal"]'>
            <div class="sheet__panel" tabindex="-1" data-sheet-target="panel">
                <div data-sheet-target="closeZone">
                    <button type="button" class="row-${name}">Action ${name}</button>
                </div>
            </div>
        </dialog>
        <button type="button" class="trigger-${name}" aria-controls="${name}" aria-expanded="false">${name}</button>`;
}

const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));
const send = (name: string): boolean => window.dispatchEvent(new CustomEvent(name));
const byId = (id: string): HTMLElement => document.getElementById(id) as HTMLElement;
const isOpen = (id: string): boolean => byId(id).classList.contains('rm-mnb-sheet--open');
const query = (selector: string): HTMLElement => document.querySelector(selector) as HTMLElement;

let application: Application;

beforeAll(() => {
    if (typeof window.requestAnimationFrame !== 'function') {
        vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => setTimeout(() => callback(0), 0));
    }
    application = Application.start();
    application.register('sheet', SheetController);
});

beforeEach(async () => {
    // jsdom computes no layout: without this stub, everything would be "invisible"
    // and the fallback to the trigger would never be exercised.
    vi.spyOn(Element.prototype, 'getClientRects').mockReturnValue([{}] as unknown as DOMRectList);
    document.documentElement.className = '';
    document.body.className = '';
    document.body.innerHTML = sheetMarkup('sheet-a') + sheetMarkup('sheet-b');
    await tick();
});

afterEach(async () => {
    document.body.innerHTML = '';
    await tick();
    vi.restoreAllMocks();
});

describe('sheets', () => {
    it('keeps only one open: opening B closes A, the scroll lock stays', () => {
        send('sheet-a:open');
        send('sheet-b:open');

        expect(isOpen('sheet-a')).toBe(false);
        expect(isOpen('sheet-b')).toBe(true);
        expect(document.documentElement.classList.contains('rm-mnb-has-open-sheet')).toBe(true);
    });

    it('releases the scroll lock when no sheet is open anymore', () => {
        send('sheet-a:open');
        send('sheet-a:close');

        expect(document.documentElement.classList.contains('rm-mnb-has-open-sheet')).toBe(false);
    });

    it('opens as a modal dialog and closes it again', () => {
        send('sheet-a:open');
        expect((byId('sheet-a') as HTMLDialogElement).open).toBe(true);

        send('sheet-a:close');
        expect((byId('sheet-a') as HTMLDialogElement).open).toBe(false);
    });

    it('closes on cancel (Esc, Android back) and keeps the native close from running', () => {
        const trigger = query('.trigger-sheet-a');
        trigger.focus();
        send('sheet-a:open');

        const cancel = new Event('cancel', { cancelable: true });
        byId('sheet-a').dispatchEvent(cancel);

        expect(cancel.defaultPrevented).toBe(true);
        expect(isOpen('sheet-a')).toBe(false);
        expect(document.activeElement).toBe(trigger);
    });

    it('catches up when the browser closes the dialog on its own', () => {
        send('sheet-a:open');

        byId('sheet-a').removeAttribute('open');
        byId('sheet-a').dispatchEvent(new Event('close'));

        expect(isOpen('sheet-a')).toBe(false);
        expect(document.documentElement.classList.contains('rm-mnb-has-open-sheet')).toBe(false);
    });

    it('hands its return target to the sheet that replaces it', () => {
        const trigger = query('.trigger-sheet-a');
        trigger.focus();
        send('sheet-a:open');
        query('.row-sheet-a').focus();
        query('.trigger-sheet-b').remove();

        send('sheet-b:open');
        send('sheet-b:close');

        expect(document.activeElement).toBe(trigger);
    });

    it('does not open a mobile-only sheet rendered in place', async () => {
        document.body.insertAdjacentHTML(
            'beforeend',
            '<dialog id="filters" class="rm-mnb-sheet--mobile-only" style="position: static" data-controller="sheet" data-sheet-name-value="filters"><div data-sheet-target="panel"></div></dialog>',
        );
        await tick();

        send('filters:open');

        expect(isOpen('filters')).toBe(false);
        expect((byId('filters') as HTMLDialogElement).open).toBe(false);
    });

    it('re-emits nothing when closing an already closed sheet', () => {
        const closed = vi.fn();
        window.addEventListener('rm-mnb:sheet-closed', closed);

        send('sheet-a:close');

        expect(closed).not.toHaveBeenCalled();
        window.removeEventListener('rm-mnb:sheet-closed', closed);
    });

    it('closes all sheets on a forced-close event (lock screen)', () => {
        send('sheet-a:open');

        send('inactivity:locked');

        expect(isOpen('sheet-a')).toBe(false);
        expect(isOpen('sheet-b')).toBe(false);
    });

    it('closes when an action from its zone is chosen', () => {
        send('sheet-a:open');

        query('.row-sheet-a').click();

        expect(isOpen('sheet-a')).toBe(false);
    });

    it('closes without returning focus when a Bootstrap modal opens', () => {
        const trigger = query('.trigger-sheet-a');
        trigger.focus();
        send('sheet-a:open');

        document.dispatchEvent(new Event('show.bs.modal', { bubbles: true }));

        expect(isOpen('sheet-a')).toBe(false);
        expect(document.activeElement).not.toBe(trigger);
    });

    it('keeps its triggers aria-expanded up to date', () => {
        send('sheet-a:open');
        expect(query('.trigger-sheet-a').getAttribute('aria-expanded')).toBe('true');

        send('sheet-a:close');
        expect(query('.trigger-sheet-a').getAttribute('aria-expanded')).toBe('false');
    });

    it('returns focus to the trigger of B when B was opened from A', () => {
        send('sheet-a:open');
        query('.row-sheet-a').focus();

        send('sheet-b:open');
        send('sheet-b:close');

        expect(document.activeElement).toBe(query('.trigger-sheet-b'));
    });

    it('reports an id that differs from the name value', async () => {
        const error = vi.spyOn(console, 'error').mockImplementation(() => {});
        document.body.insertAdjacentHTML(
            'beforeend',
            '<dialog id="autre" data-controller="sheet" data-sheet-name-value="sheet-c"><div data-sheet-target="panel"></div></dialog>',
        );
        await tick();

        expect(error).toHaveBeenCalled();
    });
});

describe('returnTarget', () => {
    const visible = (): boolean => true;
    const hidden = (): boolean => false;

    it('keeps the active element when it is outside any sheet', () => {
        document.body.innerHTML = '<button id="b">b</button><button id="t" aria-controls="s">t</button>';

        expect(returnTarget(byId('b'), [byId('t')], visible)).toBe(byId('b'));
    });

    it('keeps the active element when it is in a sheet rendered in place (not open)', () => {
        document.body.innerHTML = '<dialog class="rm-mnb-sheet--mobile-only"><button id="in">in</button></dialog><button id="t">t</button>';

        expect(returnTarget(byId('in'), [byId('t')], visible)).toBe(byId('in'));
    });

    it('falls back to the first visible trigger when the active element is in an open sheet', () => {
        document.body.innerHTML = '<dialog class="rm-mnb-sheet--open" open><button id="in">in</button></dialog><button id="t">t</button>';

        expect(returnTarget(byId('in'), [byId('t')], visible)).toBe(byId('t'));
    });

    it('also falls back when the active element is body (iOS tap)', () => {
        document.body.innerHTML = '<button id="t">t</button>';

        expect(returnTarget(document.body, [byId('t')], visible)).toBe(byId('t'));
    });

    it('returns nothing when no trigger is visible', () => {
        document.body.innerHTML = '<dialog class="rm-mnb-sheet--open" open><button id="in">in</button></dialog><button id="t">t</button>';

        expect(returnTarget(byId('in'), [byId('t')], hidden)).toBeNull();
    });
});

describe('a sheet opened on load', () => {
    const landing = (cleanUrl: string): string => `
        <dialog class="sheet" id="mute"
             data-controller="sheet" data-sheet-name-value="mute"
             data-sheet-open-on-load-value="true" data-sheet-clean-url-value="${cleanUrl}">
            <div class="sheet__panel" tabindex="-1" data-sheet-target="panel">
                <button type="button">Mute for 1 h</button>
            </div>
        </dialog>`;

    it('opens itself, drops the value and cleans the address bar with the local path', async () => {
        window.history.replaceState(null, '', '/webhooks/1?sheet=mute');
        document.body.innerHTML = landing('/webhooks/1');
        await tick();

        expect(isOpen('mute')).toBe(true);
        expect((byId('mute') as HTMLDialogElement).open).toBe(true);
        expect(byId('mute').getAttribute('data-sheet-open-on-load-value')).toBe('false');
        expect(window.location.pathname + window.location.search).toBe('/webhooks/1');
    });

    it('opens but ignores a clean URL that is not a local path', async () => {
        window.history.replaceState(null, '', '/webhooks/1?sheet=mute');
        document.body.innerHTML = landing('//evil.example/x');
        await tick();

        expect(isOpen('mute')).toBe(true);
        expect(window.location.pathname + window.location.search).toBe('/webhooks/1?sheet=mute');
    });

    it('stays closed by default', () => {
        expect(isOpen('sheet-a')).toBe(false);
        expect(isOpen('sheet-b')).toBe(false);
    });
});
