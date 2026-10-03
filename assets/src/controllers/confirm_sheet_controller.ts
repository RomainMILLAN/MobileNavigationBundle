import { Controller } from '@hotwired/stimulus';

import { CONFIRM_REQUEST_EVENT, type ConfirmRequestDetail } from './swipe_actions_controller';

/**
 * Confirmation sheet for destructive actions. Mounted on the same element as a
 * `sheet` (its id is the `sheet` value), it receives
 * `rm-mnb-confirm:request` requests, fills in its text via textContent and opens the sheet. The
 * destructive button carries the action's label; the exit, "Close", is the sheet's own
 * and runs nothing.
 */
export default class extends Controller<HTMLElement> {
    static values = { sheet: String };
    static targets = ['title', 'message', 'confirm'];

    declare readonly sheetValue: string;
    declare readonly titleTarget: HTMLElement;
    declare readonly messageTarget: HTMLElement;
    declare readonly confirmTarget: HTMLButtonElement;

    private pending: (() => void) | null = null;

    private readonly onRequest = (event: Event): void => {
        const detail = (event as CustomEvent<ConfirmRequestDetail>).detail;
        if (detail === undefined || typeof detail.onConfirm !== 'function') {
            return;
        }
        this.titleTarget.textContent = detail.title;
        this.messageTarget.textContent = detail.message;
        this.confirmTarget.textContent = detail.confirmLabel;
        this.pending = detail.onConfirm;
        window.dispatchEvent(new CustomEvent(`${this.sheetValue}:open`));
    };

    // Any close without confirmation discards the pending action.
    private readonly onClosed = (event: Event): void => {
        if ((event as CustomEvent<{ name: string }>).detail?.name === this.sheetValue) {
            this.pending = null;
        }
    };

    connect(): void {
        window.addEventListener(CONFIRM_REQUEST_EVENT, this.onRequest);
        window.addEventListener('rm-mnb:sheet-closed', this.onClosed);
    }

    disconnect(): void {
        window.removeEventListener(CONFIRM_REQUEST_EVENT, this.onRequest);
        window.removeEventListener('rm-mnb:sheet-closed', this.onClosed);
        this.pending = null;
    }

    public confirm(): void {
        const action = this.pending;
        this.pending = null;
        window.dispatchEvent(new CustomEvent(`${this.sheetValue}:close`));
        action?.();
    }
}
