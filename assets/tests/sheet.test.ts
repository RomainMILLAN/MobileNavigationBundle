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
        <div class="sheet" id="${name}" role="dialog" aria-modal="true"
             data-controller="sheet" data-sheet-name-value="${name}"
             data-sheet-force-close-events-value='["turbo:before-cache","inactivity:locked","show.bs.modal"]'>
            <div class="sheet__panel" tabindex="-1" data-sheet-target="panel">
                <div data-sheet-target="closeZone">
                    <button type="button" class="row-${name}">Action ${name}</button>
                </div>
            </div>
        </div>
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

    it('ignores Escape with no open sheet: no close emitted, no focus moved', () => {
        const outside = query('.trigger-sheet-a');
        outside.focus();
        const closed = vi.fn();
        window.addEventListener('rm-mnb:sheet-closed', closed);

        document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

        expect(closed).not.toHaveBeenCalled();
        expect(document.activeElement).toBe(outside);
        window.removeEventListener('rm-mnb:sheet-closed', closed);
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
            '<div id="autre" role="dialog" aria-modal="true" data-controller="sheet" data-sheet-name-value="sheet-c"><div data-sheet-target="panel"></div></div>',
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

    it('falls back to the first visible trigger when the active element is in a sheet', () => {
        document.body.innerHTML = '<div role="dialog" aria-modal="true"><button id="in">in</button></div><button id="t">t</button>';

        expect(returnTarget(byId('in'), [byId('t')], visible)).toBe(byId('t'));
    });

    it('also falls back when the active element is body (iOS tap)', () => {
        document.body.innerHTML = '<button id="t">t</button>';

        expect(returnTarget(document.body, [byId('t')], visible)).toBe(byId('t'));
    });

    it('returns nothing when no trigger is visible', () => {
        document.body.innerHTML = '<div role="dialog" aria-modal="true"><button id="in">in</button></div><button id="t">t</button>';

        expect(returnTarget(byId('in'), [byId('t')], hidden)).toBeNull();
    });
});
