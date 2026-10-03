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
    static values: {
        form: StringConstructor;
        field: StringConstructor;
    };
    static targets: string[];
    readonly formValue: string;
    readonly fieldValue: string;
    readonly hasProxyTarget: boolean;
    readonly proxyTarget: HTMLInputElement;
    connect(): void;
    mirror(): void;
    private field;
}
