import { Controller } from '@hotwired/stimulus';

import { focusableIn, isVisible, returnTarget, trapTab } from '../utils/focus_trap';
import { attachSheetDrag, shouldDismiss } from '../utils/sheet_drag';

interface SheetEventDetail {
    name: string;
}

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

    private readonly onToggleCommand = (): void => this.toggle();
    private readonly onOpenCommand = (): void => this.open();
    private readonly onCloseCommand = (): void => this.close();

    private readonly onOpening = (event: Event): void => {
        if ((event as CustomEvent<SheetEventDetail>).detail?.name !== this.nameValue) {
            this.close({ restoreFocus: false });
        }
    };

    private readonly onForceClose = (): void => this.close({ animate: false, restoreFocus: false });

    private readonly onKeydown = (event: KeyboardEvent): void => {
        if (!this.isOpen) {
            return;
        }
        if (event.key === 'Escape') {
            event.preventDefault();
            this.close();
            return;
        }
        trapTab(event, this.panelTarget);
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
        window.addEventListener('keydown', this.onKeydown);
        this.forceCloseEventsValue.forEach((name) => window.addEventListener(name, this.onForceClose));
        this.element.addEventListener('click', this.onClick);

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
        window.removeEventListener('keydown', this.onKeydown);
        this.forceCloseEventsValue.forEach((name) => window.removeEventListener(name, this.onForceClose));
        this.element.removeEventListener('click', this.onClick);
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
        if (this.isOpen) {
            return;
        }

        // 1. Remember whom to return focus to, before the announcement closes the sheet
        //    it may currently be in.
        this.returnTo = returnTarget(document.activeElement, this.triggers(), isVisible);

        // 2. Announce, before any state change.
        window.dispatchEvent(new CustomEvent<SheetEventDetail>('rm-mnb:sheet-opening', { detail: { name: this.nameValue } }));

        // 3. Change state. A "mobile only" sheet is a dialog only while open:
        //    when closed, above 768 px, its content is an ordinary region of the page.
        this.isOpen = true;
        this.setDialogRole(true);
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
        this.setDialogRole(false);
        if (!animate) {
            this.element.classList.add('rm-mnb-sheet--instant');
        }
        this.element.classList.remove('rm-mnb-sheet--open');
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

    private setDialogRole(open: boolean): void {
        if (!this.element.classList.contains('rm-mnb-sheet--mobile-only')) {
            return;
        }
        if (open) {
            this.element.setAttribute('role', 'dialog');
            this.element.setAttribute('aria-modal', 'true');
        } else {
            this.element.removeAttribute('role');
            this.element.removeAttribute('aria-modal');
        }
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
