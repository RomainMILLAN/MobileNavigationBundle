import { Controller } from '@hotwired/stimulus';

import { focusableIn, isVisible, returnTarget } from '../utils/focus_trap';
import { attachSheetDrag, shouldDismiss } from '../utils/sheet_drag';

interface SheetEventDetail {
    name: string;
    /**
     * Filled by the sheet that closes because this one opens: where its own focus was to
     * return. The opening sheet takes it when it found none itself (a confirmation opened
     * from a row of an action sheet), so closing the chain never drops focus on body.
     */
    handedReturnTo?: HTMLElement | null;
}

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
 */
export default class extends Controller<HTMLElement> {
    static values = {
        name: String,
        forceCloseEvents: { type: Array, default: ['turbo:before-cache'] },
    };
    static targets = ['panel', 'scroll', 'closeZone'];

    declare readonly nameValue: string;
    declare readonly forceCloseEventsValue: string[];
    declare readonly panelTarget: HTMLElement;
    declare readonly hasScrollTarget: boolean;
    declare readonly scrollTarget: HTMLElement;
    declare readonly closeZoneTargets: HTMLElement[];

    private isOpen = false;
    private returnTo: HTMLElement | null = null;
    private detachDrag: (() => void) | null = null;
    private ownCloses = 0;

    private readonly onToggleCommand = (): void => this.toggle();
    private readonly onOpenCommand = (): void => this.open();
    private readonly onCloseCommand = (): void => this.close();

    private readonly onOpening = (event: Event): void => {
        const detail = (event as CustomEvent<SheetEventDetail>).detail;
        if (detail?.name === this.nameValue || !this.isOpen) {
            return;
        }
        detail.handedReturnTo ??= this.returnTo;
        this.close({ restoreFocus: false });
    };

    private readonly onForceClose = (): void => this.close({ animate: false, restoreFocus: false });

    // Esc, the Android back gesture, a close request: the sheet closes itself, animated.
    private readonly onCancel = (event: Event): void => {
        event.preventDefault();
        this.close();
    };

    // The browser closed the dialog on its own (a second back gesture it no longer lets
    // the page cancel, say): the state catches up.
    private readonly onNativeClose = (): void => {
        // The close event is queued: the one following our own close() must not close a
        // sheet reopened in between.
        if (this.ownCloses > 0) {
            this.ownCloses -= 1;
            return;
        }
        if (this.isOpen) {
            this.close();
        }
    };

    // Any action (link, POST, button) inside a marked zone closes the sheet: the
    // fab.item macro allows no attribute on its rows, so the zone carries the mark.
    private readonly onClick = (event: Event): void => {
        const target = event.target as Element | null;
        if (
            this.isOpen
            && target?.closest('a, button') !== null
            && this.closeZoneTargets.some((zone) => zone.contains(target))
        ) {
            this.close({ restoreFocus: false });
        }
    };

    connect(): void {
        if (this.element.id !== this.nameValue) {
            console.error(`rm-mnb sheet: the id "${this.element.id}" must equal the name value "${this.nameValue}".`);
        }

        window.addEventListener(`${this.nameValue}:toggle`, this.onToggleCommand);
        window.addEventListener(`${this.nameValue}:open`, this.onOpenCommand);
        window.addEventListener(`${this.nameValue}:close`, this.onCloseCommand);
        window.addEventListener('rm-mnb:sheet-opening', this.onOpening);
        this.forceCloseEventsValue.forEach((name) => window.addEventListener(name, this.onForceClose));
        this.element.addEventListener('click', this.onClick);
        this.element.addEventListener('cancel', this.onCancel);
        this.element.addEventListener('close', this.onNativeClose);

        this.detachDrag = attachSheetDrag(this.panelTarget, {
            canStart: (target) => this.canStartDrag(target),
            onMove: (offset) => {
                this.panelTarget.classList.add('is-dragging');
                this.panelTarget.style.transform = `translate3d(0, ${offset}px, 0)`;
            },
            onEnd: (offset, velocity) => {
                this.panelTarget.classList.remove('is-dragging');
                if (shouldDismiss(offset, this.panelTarget.offsetHeight, velocity)) {
                    this.close();
                } else {
                    this.panelTarget.style.transform = '';
                }
            },
        });
    }

    disconnect(): void {
        window.removeEventListener(`${this.nameValue}:toggle`, this.onToggleCommand);
        window.removeEventListener(`${this.nameValue}:open`, this.onOpenCommand);
        window.removeEventListener(`${this.nameValue}:close`, this.onCloseCommand);
        window.removeEventListener('rm-mnb:sheet-opening', this.onOpening);
        this.forceCloseEventsValue.forEach((name) => window.removeEventListener(name, this.onForceClose));
        this.element.removeEventListener('click', this.onClick);
        this.element.removeEventListener('cancel', this.onCancel);
        this.element.removeEventListener('close', this.onNativeClose);
        this.detachDrag?.();
        this.detachDrag = null;
        this.close({ animate: false, restoreFocus: false });
    }

    /** Backdrop and handle action (a Stimulus action receives the event, close() takes options). */
    public dismiss(): void {
        this.close();
    }

    public toggle(): void {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    public open(): void {
        if (this.isOpen || this.rendersInPlace()) {
            return;
        }

        // 1. Remember whom to return focus to, before the announcement closes the sheet
        //    it may currently be in.
        this.returnTo = returnTarget(document.activeElement, this.triggers(), isVisible);

        // 2. Announce, before any state change. A sheet closing for this one hands over
        //    its own return target.
        const detail: SheetEventDetail = { name: this.nameValue };
        window.dispatchEvent(new CustomEvent<SheetEventDetail>('rm-mnb:sheet-opening', { detail }));
        this.returnTo ??= detail.handedReturnTo ?? null;

        // 3. Change state.
        this.isOpen = true;
        this.showModal();
        this.element.classList.add('rm-mnb-sheet--open');
        document.documentElement.classList.add('rm-mnb-has-open-sheet');
        this.setExpanded(true);

        const first = focusableIn(this.panelTarget)[0];
        (first ?? this.panelTarget).focus({ preventScroll: true });

        this.dispatch('sheet-opened', { prefix: 'rm-mnb', detail: { name: this.nameValue } });
    }

    public close({ animate = true, restoreFocus = true }: CloseOptions = {}): void {
        if (!this.isOpen) {
            return;
        }

        this.isOpen = false;
        if (!animate) {
            this.element.classList.add('rm-mnb-sheet--instant');
        }
        this.element.classList.remove('rm-mnb-sheet--open');
        // Out of the top layer right away: the page is no longer inert, focus can return.
        // The panel finishes sliding away under visibility (see _sheet.scss).
        this.closeModal();
        this.panelTarget.style.transform = '';

        // Another sheet may have opened in the same tick (choreography): the scroll
        // lock is released only when no sheet remains open.
        if (document.querySelector('.rm-mnb-sheet--open') === null) {
            document.documentElement.classList.remove('rm-mnb-has-open-sheet');
        }
        this.setExpanded(false);

        if (restoreFocus && this.returnTo !== null && isVisible(this.returnTo)) {
            this.returnTo.focus({ preventScroll: true });
        }
        this.returnTo = null;

        if (!animate) {
            // The "instant" style must last only for the closing frame.
            requestAnimationFrame(() => this.element.classList.remove('rm-mnb-sheet--instant'));
        }

        this.dispatch('sheet-closed', { prefix: 'rm-mnb', detail: { name: this.nameValue } });
    }

    private triggers(): HTMLElement[] {
        return Array.from(document.querySelectorAll<HTMLElement>(`[aria-controls="${this.element.id}"]`));
    }

    private get dialog(): HTMLDialogElement | null {
        return this.element instanceof HTMLDialogElement ? this.element : null;
    }

    private showModal(): void {
        const dialog = this.dialog;
        if (dialog === null || dialog.open) {
            return;
        }
        // An engine without showModal() (an old one, jsdom) still gets an open dialog.
        if (typeof dialog.showModal === 'function') {
            dialog.showModal();
        } else {
            dialog.setAttribute('open', '');
        }
    }

    private closeModal(): void {
        const dialog = this.dialog;
        if (dialog === null || !dialog.open) {
            return;
        }
        if (typeof dialog.close === 'function') {
            this.ownCloses += 1;
            dialog.close();
        } else {
            dialog.removeAttribute('open');
        }
    }

    /**
     * A "mobile only" sheet above 768 px: its content is part of the page, never a modal.
     * The CSS decides (it holds the breakpoint, configurable): such a sheet is static.
     */
    private rendersInPlace(): boolean {
        return this.element.classList.contains('rm-mnb-sheet--mobile-only')
            && getComputedStyle(this.element).position === 'static';
    }

    private setExpanded(expanded: boolean): void {
        this.triggers().forEach((trigger) => trigger.setAttribute('aria-expanded', String(expanded)));
    }

    private canStartDrag(target: EventTarget | null): boolean {
        if (!this.isOpen) {
            return false;
        }
        const scroller = this.hasScrollTarget ? this.scrollTarget : this.panelTarget;
        const fromScroller = target instanceof Node && scroller.contains(target);

        return !fromScroller || scroller.scrollTop <= 0;
    }
}
