import { Controller } from '@hotwired/stimulus';

/**
 * Mobile filter bar: a "proxy" search field that copies its input into the
 * real field of the app's form and fires `input` on it. The app's auto-submit takes
 * over from there: a single form, no duplicate field.
 *
 * The real field is looked up with `form.elements.namedItem()`, never with a built
 * selector (the name contains brackets).
 */
export default class extends Controller<HTMLElement> {
    static values = { form: String, field: String };
    static targets = ['proxy'];

    declare readonly formValue: string;
    declare readonly fieldValue: string;
    declare readonly hasProxyTarget: boolean;
    declare readonly proxyTarget: HTMLInputElement;

    connect(): void {
        const field = this.field();
        if (field !== null && this.hasProxyTarget) {
            this.proxyTarget.value = field.value;
        }
    }

    public mirror(): void {
        const field = this.field();
        if (field === null || !this.hasProxyTarget) {
            return;
        }
        field.value = this.proxyTarget.value;
        field.dispatchEvent(new Event('input', { bubbles: true }));
    }

    private field(): HTMLInputElement | null {
        const form = document.getElementById(this.formValue);
        if (!(form instanceof HTMLFormElement) || this.fieldValue === '') {
            return null;
        }
        const field = form.elements.namedItem(this.fieldValue);

        return field instanceof HTMLInputElement ? field : null;
    }
}
