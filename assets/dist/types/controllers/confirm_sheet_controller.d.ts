import { Controller } from '@hotwired/stimulus';
/**
 * Confirmation sheet for destructive actions. Mounted on the same element as a
 * `sheet` (its id is the `sheet` value), it receives
 * `rm-mnb-confirm:request` requests, fills in its text via textContent and opens the sheet. The
 * destructive button carries the action's label; the exit, "Close", is the sheet's own
 * and runs nothing.
 */
export default class extends Controller<HTMLElement> {
    static values: {
        sheet: StringConstructor;
    };
    static targets: string[];
    readonly sheetValue: string;
    readonly titleTarget: HTMLElement;
    readonly messageTarget: HTMLElement;
    readonly confirmTarget: HTMLButtonElement;
    private pending;
    private readonly onRequest;
    private readonly onClosed;
    connect(): void;
    disconnect(): void;
    confirm(): void;
}
