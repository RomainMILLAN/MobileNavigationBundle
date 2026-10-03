import { Controller } from '@hotwired/stimulus';
/**
 * Navigates to `url`: with Turbo when the page has it, with a full page load otherwise.
 * Only same-origin http(s) URLs are followed.
 */
export default class extends Controller {
    static values: {
        url: StringConstructor;
    };
    readonly urlValue: string;
    visit(): void;
}
