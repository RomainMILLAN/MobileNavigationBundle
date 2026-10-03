import { Controller } from '@hotwired/stimulus';

import { dedupeSectionHeaders } from '../utils/list';

export const TOGGLE_SELECTING_EVENT = 'rm-mnb-list:toggle-selecting';
export const TOGGLE_EDITING_EVENT = 'rm-mnb-list:toggle-editing';
/** Notification dispatched on every entry into or exit from the "Edit" mode (detail.editing). */
export const EDITING_CHANGED_EVENT = 'rm-mnb-list:editing-changed';

type ListMode = 'idle' | 'selecting' | 'editing';

const MODE_CLASSES: Record<Exclude<ListMode, 'idle'>, { list: string; root: string }> = {
    selecting: { list: 'is-selecting', root: 'rm-mnb-list-selecting' },
    editing: { list: 'is-editing', root: 'rm-mnb-list-editing' },
};

/**
 * iOS grouped list: section headers deduplicated after "Load more", and two exclusive
 * modes, "Select" and "Edit", held by a single state.
 * While selecting, a tap checks the row instead of opening it: the row is an <a>, so the
 * click is intercepted. The checkboxes belong to the app (its StimulusAttributes); the
 * bundle only checks them and dispatches `change`.
 * While editing, a tap no longer navigates (the drag handles belong to the app, which
 * listens to the rm-mnb-list:editing-changed notification).
 * The window commands target every list of the page: a page has a single selectable or
 * editable list.
 */
export default class extends Controller<HTMLElement> {
    static targets = ['section'];

    declare readonly sectionTargets: HTMLElement[];

    private mode: ListMode = 'idle';

    private readonly onClick = (event: MouseEvent): void => {
        if (this.mode === 'idle') {
            return;
        }
        const target = event.target as Element | null;
        if (this.mode === 'editing') {
            // The handles and the app controls stay active; navigation does not.
            if (target?.closest('a') && this.element.contains(target)) {
                event.preventDefault();
            }
            return;
        }
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
    private readonly onToggleEditingCommand = (): void => this.toggleEditing();

    connect(): void {
        this.element.addEventListener('click', this.onClick, true);
        this.element.addEventListener('turbo:frame-load', this.onFrameLoad);
        window.addEventListener(TOGGLE_SELECTING_EVENT, this.onToggleCommand);
        window.addEventListener(TOGGLE_EDITING_EVENT, this.onToggleEditingCommand);
        this.dedupeSections();
    }

    disconnect(): void {
        this.element.removeEventListener('click', this.onClick, true);
        this.element.removeEventListener('turbo:frame-load', this.onFrameLoad);
        window.removeEventListener(TOGGLE_SELECTING_EVENT, this.onToggleCommand);
        window.removeEventListener(TOGGLE_EDITING_EVENT, this.onToggleEditingCommand);
        this.setMode('idle');
    }

    public toggleSelecting(): void {
        this.setMode(this.mode === 'selecting' ? 'idle' : 'selecting');
    }

    public toggleEditing(): void {
        this.setMode(this.mode === 'editing' ? 'idle' : 'editing');
    }

    private setMode(next: ListMode): void {
        const previous = this.mode;
        if (previous === next) {
            return;
        }
        // Leaving a mode cleans it up first: "Done" clears the selection.
        if (previous === 'selecting') {
            this.clearSelection();
        }
        this.mode = next;

        (Object.keys(MODE_CLASSES) as Array<keyof typeof MODE_CLASSES>).forEach((mode) => {
            this.element.classList.toggle(MODE_CLASSES[mode].list, mode === next);
            // On <html> too: the "Select / Edit" buttons are outside the list.
            document.documentElement.classList.toggle(MODE_CLASSES[mode].root, mode === next);
        });

        if (previous === 'editing' || next === 'editing') {
            window.dispatchEvent(new CustomEvent(EDITING_CHANGED_EVENT, { detail: { editing: next === 'editing' } }));
        }
    }

    private clearSelection(): void {
        this.element.querySelectorAll<HTMLInputElement>('.rm-mnb-list-row__select input[type="checkbox"]:checked')
            .forEach((checkbox) => {
                checkbox.checked = false;
                checkbox.dispatchEvent(new Event('change', { bubbles: true }));
            });
    }

    private dedupeSections(): void {
        // A section's key is its title (aria-label set by ListSection).
        const keys = this.sectionTargets.map((section) => section.getAttribute('aria-label') ?? '');
        this.sectionTargets.forEach((section) => section.classList.remove('is-continuation'));
        dedupeSectionHeaders(keys).forEach((index) => this.sectionTargets[index]?.classList.add('is-continuation'));
    }
}
