/**
 * @vitest-environment jsdom
 */
import { Application } from '@hotwired/stimulus';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { CONFIRM_REQUEST_EVENT, type ConfirmRequestDetail } from '../src/confirm_contract';
import ConfirmSubmitController from '../src/controllers/confirm_submit_controller';

const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

let application: Application;
let requests: ConfirmRequestDetail[];
let posted: number;

const onRequest = (event: Event): void => {
    requests.push((event as CustomEvent<ConfirmRequestDetail>).detail);
};
const onPost = (event: Event): void => {
    if (!event.defaultPrevented) {
        posted++;
        event.preventDefault();
    }
};

function form(): HTMLFormElement {
    return document.getElementById('action') as HTMLFormElement;
}

// jsdom has no layout: getClientRects() is empty. The sheet is therefore
// "visible" when forced, as on a mobile screen.
function showConfirmSheet(visible: boolean): void {
    const sheet = document.getElementById('rm-mnb-confirm') as HTMLElement;
    sheet.getClientRects = (): DOMRectList => (visible ? [{}] : []) as unknown as DOMRectList;
}

beforeAll(() => {
    application = Application.start();
    application.register('confirm-submit', ConfirmSubmitController);
});

beforeEach(async () => {
    requests = [];
    posted = 0;
    document.body.innerHTML = `
        <div id="rm-mnb-confirm"></div>
        <form id="action" method="post" action="/loan/1/end" data-controller="confirm-submit"
              data-confirm-submit-title-value="Terminer" data-confirm-submit-message-value="Terminer ce prêt ?"
              data-confirm-submit-confirm-label-value="Terminer">
            <button type="submit">Terminer</button>
        </form>`;
    window.addEventListener(CONFIRM_REQUEST_EVENT, onRequest);
    // What actually goes out: the submit no listener held back (Turbo, the browser).
    document.addEventListener('submit', onPost);
    await tick();
});

afterEach(async () => {
    window.removeEventListener(CONFIRM_REQUEST_EVENT, onRequest);
    document.removeEventListener('submit', onPost);
    document.body.innerHTML = '';
    vi.restoreAllMocks();
    await tick();
});

describe('confirm-submit controller', () => {
    it('submits nothing before confirmation, and requests the confirmation sheet', () => {
        showConfirmSheet(true);

        form().requestSubmit();

        expect(posted).toBe(0);
        expect(requests).toHaveLength(1);
        expect(requests[0]).toMatchObject({ title: 'Terminer', message: 'Terminer ce prêt ?', confirmLabel: 'Terminer' });
    });

    it('submits only once after confirmation, even on a double tap', () => {
        showConfirmSheet(true);
        form().requestSubmit();

        requests[0]?.onConfirm();
        form().requestSubmit();
        form().requestSubmit();

        expect(posted).toBe(1);
        expect(requests).toHaveLength(1);
    });

    it('"Close" (no confirmation) submits nothing', () => {
        showConfirmSheet(true);

        form().requestSubmit();

        expect(posted).toBe(0);
    });

    it('falls back to confirm() when the sheet is missing or invisible', () => {
        showConfirmSheet(false);
        const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);

        form().requestSubmit();
        expect(posted).toBe(0);
        expect(requests).toHaveLength(0);

        form().requestSubmit();
        expect(confirm).toHaveBeenCalledWith('Terminer ce prêt ?');
        expect(posted).toBe(1);
    });
});
