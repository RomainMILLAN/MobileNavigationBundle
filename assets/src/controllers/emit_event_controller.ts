import { Controller } from '@hotwired/stimulus';

/**
 * Generic micro-controller: dispatches a window CustomEvent on click.
 * Lets FAB actions (outside the scope of a page controller)
 * trigger client actions listened to via `@window`.
 */
export default class extends Controller<HTMLElement> {
    static values = {
        name: String,
    };

    declare readonly nameValue: string;

    emit(): void {
        window.dispatchEvent(new CustomEvent(this.nameValue));
    }
}
