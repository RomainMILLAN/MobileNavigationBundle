import { Controller } from '@hotwired/stimulus';
export declare const TOGGLE_SELECTING_EVENT = "rm-mnb-list:toggle-selecting";
/**
 * iOS grouped list: section headers deduplicated after "Load more", and "Select"
 * mode. While selecting, a tap checks the row instead of opening it: the row
 * is an <a>, so the click is intercepted. The checkboxes belong to the app (its
 * StimulusAttributes); the module only checks them and dispatches `change`.
 */
export default class extends Controller<HTMLElement> {
    static targets: string[];
    readonly sectionTargets: HTMLElement[];
    private readonly onClick;
    private readonly onFrameLoad;
    private readonly onToggleCommand;
    connect(): void;
    disconnect(): void;
    toggleSelecting(): void;
    private dedupeSections;
}
