import { Controller } from '@hotwired/stimulus';
export default class extends Controller<HTMLElement> {
    static targets: string[];
    readonly hasTrackTarget: boolean;
    readonly trackTarget: HTMLElement;
    readonly panelTarget: HTMLElement;
    readonly hasToggleTarget: boolean;
    readonly toggleTarget: HTMLButtonElement;
    private opened;
    private frame;
    private readonly onScroll;
    private readonly onOtherOpened;
    private readonly onDocumentPointer;
    private readonly onKeydown;
    private readonly onFocusIn;
    private readonly sent;
    private readonly onSubmit;
    private readonly onSubmitEnd;
    private readonly onReset;
    connect(): void;
    disconnect(): void;
    /** The "Actions" button. */
    toggle(): void;
    /** Click on a link marked carriesReturnPath: it takes the current path along. */
    carryReturnPath(event: Event): void;
    private open;
    private close;
    private scrollTo;
    /** The scroll position is the truth: a swipe opens or closes the panel by itself. */
    private sync;
    private setOpened;
    private actions;
    private toggleTargetOrNull;
}
