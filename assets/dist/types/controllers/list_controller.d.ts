import { Controller } from '@hotwired/stimulus';
export declare const TOGGLE_SELECTING_EVENT = "rm-mnb-list:toggle-selecting";
export declare const TOGGLE_EDITING_EVENT = "rm-mnb-list:toggle-editing";
/** Notification dispatched on every entry into or exit from the "Edit" mode (detail.editing). */
export declare const EDITING_CHANGED_EVENT = "rm-mnb-list:editing-changed";
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
    static targets: string[];
    readonly sectionTargets: HTMLElement[];
    private mode;
    private readonly onClick;
    private readonly onFrameLoad;
    private readonly onToggleCommand;
    private readonly onToggleEditingCommand;
    connect(): void;
    disconnect(): void;
    toggleSelecting(): void;
    toggleEditing(): void;
    private setMode;
    private clearSelection;
    private dedupeSections;
}
