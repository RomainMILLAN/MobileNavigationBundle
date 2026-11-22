import { Controller } from '@hotwired/stimulus';
interface CloseOptions {
    animate?: boolean;
    restoreFocus?: boolean;
}
/**
 * Generic iOS-style bottom sheet. No route, no label: reusable.
 *
 * The element is a <dialog>, opened with showModal(): the browser puts it in the top layer,
 * makes the rest of the page inert, keeps Tab inside it and turns Esc and the Android back
 * gesture into a `cancel` event, which closes it with its animation. A closed sheet stays
 * rendered (visibility: hidden, see _sheet.scss): it slides away after leaving the top
 * layer, and the app can tell a displayable sheet (mobile) from a hidden one.
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
 *
 * With `openOnLoad`, the sheet opens itself once connected (the server chose to land the
 * page on it), then drops the value so that a restored snapshot does not open it again.
 * With `cleanUrl` (a local path given by the server), the address bar is then replaced
 * with it, so that a reload does not open it either. Anything else than a local path is
 * ignored.
 */
export default class extends Controller<HTMLElement> {
    static values: {
        name: StringConstructor;
        forceCloseEvents: {
            type: ArrayConstructor;
            default: string[];
        };
        openOnLoad: {
            type: BooleanConstructor;
            default: boolean;
        };
        cleanUrl: {
            type: StringConstructor;
            default: string;
        };
    };
    static targets: string[];
    readonly nameValue: string;
    readonly forceCloseEventsValue: string[];
    openOnLoadValue: boolean;
    readonly cleanUrlValue: string;
    readonly panelTarget: HTMLElement;
    readonly hasScrollTarget: boolean;
    readonly scrollTarget: HTMLElement;
    readonly closeZoneTargets: HTMLElement[];
    private isOpen;
    private returnTo;
    private detachDrag;
    private ownCloses;
    private readonly onToggleCommand;
    private readonly onOpenCommand;
    private readonly onCloseCommand;
    private readonly onOpening;
    private readonly onForceClose;
    private readonly onCancel;
    private readonly onNativeClose;
    private readonly onClick;
    connect(): void;
    disconnect(): void;
    /** Backdrop and handle action (a Stimulus action receives the event, close() takes options). */
    dismiss(): void;
    toggle(): void;
    open(): void;
    close({ animate, restoreFocus }?: CloseOptions): void;
    private triggers;
    private get dialog();
    private showModal;
    private closeModal;
    /**
     * A "mobile only" sheet above 768 px: its content is part of the page, never a modal.
     * The CSS decides (it holds the breakpoint, configurable): such a sheet is static.
     */
    private rendersInPlace;
    private setExpanded;
    private canStartDrag;
}
export {};
