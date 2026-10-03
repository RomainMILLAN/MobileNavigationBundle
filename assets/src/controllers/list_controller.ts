import { Controller } from '@hotwired/stimulus';

import { dedupeSectionHeaders } from '../utils/list';

export const TOGGLE_SELECTING_EVENT = 'rm-mnb-list:toggle-selecting';
const SELECTING_CLASS = 'rm-mnb-list-selecting';

/**
 * iOS grouped list: section headers deduplicated after "Load more", and "Select"
 * mode. While selecting, a tap checks the row instead of opening it: the row
 * is an <a>, so the click is intercepted. The checkboxes belong to the app (its
 * StimulusAttributes); the module only checks them and dispatches `change`.
 */
export default class extends Controller<HTMLElement> {
    static targets = ['section'];

    declare readonly sectionTargets: HTMLElement[];

    private readonly onClick = (event: MouseEvent): void => {
        if (!this.element.classList.contains('is-selecting')) {
            return;
        }
        const target = event.target as Element | null;
        const row = target?.closest('.rm-mnb-list-row');
        // The checkbox itself (and its label) keep their native behavior.
        if (row === null || row === undefined || !this.element.contains(row) || target?.closest('.rm-mnb-list-row__select')) {
            return;
        }
        event.preventDefault();
        const checkbox = row.querySelector<HTMLInputElement>('.rm-mnb-list-row__select input[type="checkbox"]');
        if (checkbox !== null) {
            checkbox.checked = !checkbox.checked;
            checkbox.dispatchEvent(new Event('change', { bubbles: true }));
        }
    };

    private readonly onFrameLoad = (): void => this.dedupeSections();

    // "Select" lives in the top row, outside the list: it drives the list through a
    // window event (SelectToggle), like the sheets.
    private readonly onToggleCommand = (): void => this.toggleSelecting();

    connect(): void {
        this.element.addEventListener('click', this.onClick, true);
        this.element.addEventListener('turbo:frame-load', this.onFrameLoad);
        window.addEventListener(TOGGLE_SELECTING_EVENT, this.onToggleCommand);
        this.dedupeSections();
    }

    disconnect(): void {
        this.element.removeEventListener('click', this.onClick, true);
        this.element.removeEventListener('turbo:frame-load', this.onFrameLoad);
        window.removeEventListener(TOGGLE_SELECTING_EVENT, this.onToggleCommand);
        document.documentElement.classList.remove(SELECTING_CLASS);
    }

    public toggleSelecting(): void {
        const selecting = this.element.classList.toggle('is-selecting');
        // On <html> too: the "Select / Done" button is outside the list.
        document.documentElement.classList.toggle(SELECTING_CLASS, selecting);
        if (!selecting) {
            // "Done" clears the selection.
            this.element.querySelectorAll<HTMLInputElement>('.rm-mnb-list-row__select input[type="checkbox"]:checked')
                .forEach((checkbox) => {
                    checkbox.checked = false;
                    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                });
        }
    }

    private dedupeSections(): void {
        // A section's key is its title (aria-label set by ListSection).
        const keys = this.sectionTargets.map((section) => section.getAttribute('aria-label') ?? '');
        this.sectionTargets.forEach((section) => section.classList.remove('is-continuation'));
        dedupeSectionHeaders(keys).forEach((index) => this.sectionTargets[index]?.classList.add('is-continuation'));
    }
}
