import { Controller } from '@hotwired/stimulus';
interface CloseOptions {
    animate?: boolean;
    restoreFocus?: boolean;
}
/**
 * Generic iOS-style bottom sheet. No route, no label: reusable.
 *
 * Commands: `<name>:toggle`, `<name>:open`, `<name>:close`, on window (dispatched by the
 * emit-event controller). They carry no detail. Opening an open sheet or
 * closing a closed sheet does nothing.
 *
 * The element's id equals the `name` value: it is what the triggers reference
 * in aria-controls, and it is through this ARIA attribute that the sheet keeps their
 * aria-expanded up to date and finds whom to return focus to.
 *
 * "Only one open sheet" has no coordinator: it is a choreography. Before any
 * state change, open() announces `rm-mnb:sheet-opening` (detail.name); every other sheet
 * then closes without returning focus. Everything is synchronous, so there are never two
 * open sheets.
 *
 * Emitted facts: `rm-mnb:sheet-opened` and `rm-mnb:sheet-closed` (bubbles, detail.name).
 * `rm-mnb:sheet-opening` is a non-cancelable pre-event, dispatched on window before any
 * state change.
 *
 * Closes without animation on each of the events in the `forceCloseEvents` value,
 * listened to on window (document events bubble up to it). By default
 * `turbo:before-cache`, so that no Turbo snapshot keeps a sheet open. The app
 * adds its own: a lock screen, or the opening of a modal that would otherwise have
 * a second focus trap competing with the sheet's.
 */
export default class extends Controller<HTMLElement> {
    static values: {
        name: StringConstructor;
        forceCloseEvents: {
            type: ArrayConstructor;
            default: string[];
        };
    };
    static targets: string[];
    readonly nameValue: string;
    readonly forceCloseEventsValue: string[];
    readonly panelTarget: HTMLElement;
    readonly hasScrollTarget: boolean;
    readonly scrollTarget: HTMLElement;
    readonly closeZoneTargets: HTMLElement[];
    private isOpen;
    private returnTo;
    private detachDrag;
    private readonly onToggleCommand;
    private readonly onOpenCommand;
    private readonly onCloseCommand;
    private readonly onOpening;
    private readonly onForceClose;
    private readonly onKeydown;
    private readonly onClick;
    connect(): void;
    disconnect(): void;
    /** Backdrop and handle action (a Stimulus action receives the event, close() takes options). */
    dismiss(): void;
    toggle(): void;
    open(): void;
    close({ animate, restoreFocus }?: CloseOptions): void;
    private triggers;
    private setDialogRole;
    private setExpanded;
    private canStartDrag;
}
export {};
