import { Controller } from '@hotwired/stimulus';

import { TOGGLE_EDITING_EVENT, TOGGLE_SELECTING_EVENT } from './list_controller';
import { haptic } from '../utils/haptic';
import { currentReturnPath, sameOriginUrl } from '../utils/same_origin';

/**
 * Swipe actions: the content and its actions panel sit side by side in a horizontal
 * scroll-snap track, rendered server side. The browser does the gesture (momentum,
 * snapping, chaining to the page): there is no touch code here. The controller only
 * keeps the state that the scroll position implies.
 *
 * - The "Actions" button reveals or hides the panel without the gesture (keyboard,
 *   screen reader, voice control, mouse): aria-expanded follows the panel.
 * - Hidden actions are out of the tab order; revealed ones are in it.
 * - One row open at a time; a tap outside, Esc, a list mode or a Turbo snapshot closes it.
 * - A writing action fills its `_redirect` field at submit time (the URL may have changed
 *   since the render: a filter rewrites it in place), goes out once (a double tap sends a
 *   single POST; a failed Turbo submission can be retried) and closes the row. A link
 *   marked carriesReturnPath gets `_redirect` on click.
 *
 * The panel listens in the bubble phase: a destructive action's confirm-submit, on the
 * form, has already held its first submit back (defaultPrevented) to ask first.
 */
const OPENED_EVENT = 'rm-mnb:swipe-opened';

export default class extends Controller<HTMLElement> {
    static targets = ['track', 'panel', 'toggle'];

    declare readonly hasTrackTarget: boolean;
    declare readonly trackTarget: HTMLElement;
    declare readonly panelTarget: HTMLElement;
    declare readonly hasToggleTarget: boolean;
    declare readonly toggleTarget: HTMLButtonElement;

    private opened = false;
    private frame = 0;

    private readonly onScroll = (): void => {
        cancelAnimationFrame(this.frame);
        this.frame = requestAnimationFrame(() => this.sync());
    };

    private readonly onOtherOpened = (event: Event): void => {
        if ((event as CustomEvent<{ element: HTMLElement }>).detail?.element !== this.element) {
            this.close(false);
        }
    };

    private readonly onDocumentPointer = (event: Event): void => {
        if (this.opened && !this.element.contains(event.target as Node)) {
            this.close();
        }
    };

    private readonly onKeydown = (event: KeyboardEvent): void => {
        if (event.key !== 'Escape' || !this.opened || event.defaultPrevented) {
            return;
        }
        event.preventDefault();
        this.close();
        if (this.hasToggleTarget) {
            this.toggleTarget.focus({ preventScroll: true });
        }
    };

    // Tabbing back into the content (not tapping it) closes the panel, as on a native list.
    private readonly onFocusIn = (event: FocusEvent): void => {
        const target = event.target as HTMLElement;
        if (this.opened && !this.panelTarget.contains(target) && target !== this.toggleTargetOrNull() && target.matches(':focus-visible')) {
            this.close();
        }
    };

    private readonly sent = new WeakSet<HTMLFormElement>();

    private readonly onSubmit = (event: Event): void => {
        const form = event.target as HTMLFormElement;
        if (event.defaultPrevented) {
            return;
        }
        if (this.sent.has(form)) {
            event.preventDefault();
            return;
        }
        this.sent.add(form);
        const redirect = form.elements.namedItem('_redirect');
        if (redirect instanceof HTMLInputElement) {
            redirect.value = currentReturnPath() ?? '';
        }
        this.close(false);
    };

    // Network failure under Turbo: the page stays, the action must be retryable.
    private readonly onSubmitEnd = (event: Event): void => {
        if (!(event as CustomEvent<{ success: boolean }>).detail?.success) {
            this.sent.delete(event.target as HTMLFormElement);
        }
    };

    private readonly onReset = (): void => this.close(false);

    connect(): void {
        if (!this.hasTrackTarget) {
            return;
        }
        this.trackTarget.addEventListener('scroll', this.onScroll, { passive: true });
        this.element.addEventListener('keydown', this.onKeydown);
        this.element.addEventListener('focusin', this.onFocusIn);
        this.panelTarget.addEventListener('submit', this.onSubmit);
        this.panelTarget.addEventListener('turbo:submit-end', this.onSubmitEnd);
        window.addEventListener(OPENED_EVENT, this.onOtherOpened);
        window.addEventListener(TOGGLE_SELECTING_EVENT, this.onReset);
        window.addEventListener(TOGGLE_EDITING_EVENT, this.onReset);
        document.addEventListener('turbo:before-cache', this.onReset);
        if (this.hasToggleTarget) {
            this.toggleTarget.hidden = false;
        }
        this.sync();
    }

    disconnect(): void {
        if (!this.hasTrackTarget) {
            return;
        }
        cancelAnimationFrame(this.frame);
        this.trackTarget.removeEventListener('scroll', this.onScroll);
        this.element.removeEventListener('keydown', this.onKeydown);
        this.element.removeEventListener('focusin', this.onFocusIn);
        this.panelTarget.removeEventListener('submit', this.onSubmit);
        this.panelTarget.removeEventListener('turbo:submit-end', this.onSubmitEnd);
        window.removeEventListener(OPENED_EVENT, this.onOtherOpened);
        window.removeEventListener(TOGGLE_SELECTING_EVENT, this.onReset);
        window.removeEventListener(TOGGLE_EDITING_EVENT, this.onReset);
        document.removeEventListener('turbo:before-cache', this.onReset);
        document.removeEventListener('pointerdown', this.onDocumentPointer, true);
    }

    /** The "Actions" button. */
    public toggle(): void {
        if (this.opened) {
            this.close();
            return;
        }
        // Focus first: focusing during a smooth scroll of the track would cancel it.
        this.setOpened(true);
        this.actions()[0]?.focus({ preventScroll: true });
        this.open();
    }

    /** Click on a link marked carriesReturnPath: it takes the current path along. */
    public carryReturnPath(event: Event): void {
        const link = event.currentTarget as HTMLAnchorElement;
        const target = sameOriginUrl(link.href);
        const returnPath = currentReturnPath();
        if (target !== null && returnPath !== null && !target.searchParams.has('_redirect')) {
            target.searchParams.set('_redirect', returnPath);
            link.href = target.href;
        }
    }

    private open(): void {
        this.scrollTo(this.trackTarget.scrollWidth - this.trackTarget.clientWidth, true);
        this.setOpened(true);
    }

    private close(animate = true): void {
        if (!this.hasTrackTarget) {
            return;
        }
        this.scrollTo(0, animate);
        this.setOpened(false);
    }

    private scrollTo(left: number, animate: boolean): void {
        const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
        if (typeof this.trackTarget.scrollTo === 'function') {
            this.trackTarget.scrollTo({ left, behavior: animate && !reduce ? 'smooth' : 'instant' });
        } else {
            this.trackTarget.scrollLeft = left;
        }
    }

    /** The scroll position is the truth: a swipe opens or closes the panel by itself. */
    private sync(): void {
        const max = this.trackTarget.scrollWidth - this.trackTarget.clientWidth;
        if (max <= 0) {
            this.setOpened(false);
            return;
        }
        // Snapped at the end (a pixel of rounding aside): open. Back at the start: closed.
        // In between (mid-gesture), the state does not change.
        if (Math.abs(this.trackTarget.scrollLeft) >= max - 1) {
            this.setOpened(true);
        } else if (Math.abs(this.trackTarget.scrollLeft) <= 1) {
            this.setOpened(false);
        }
    }

    private setOpened(opened: boolean): void {
        const changed = opened !== this.opened;
        this.opened = opened;
        this.toggleTargetOrNull()?.setAttribute('aria-expanded', String(opened));
        this.actions().forEach((action) => action.setAttribute('tabindex', opened ? '0' : '-1'));
        if (!changed) {
            return;
        }
        if (opened) {
            haptic('light');
            window.dispatchEvent(new CustomEvent(OPENED_EVENT, { detail: { element: this.element } }));
            document.addEventListener('pointerdown', this.onDocumentPointer, true);
        } else {
            document.removeEventListener('pointerdown', this.onDocumentPointer, true);
        }
    }

    private actions(): HTMLElement[] {
        return Array.from(this.panelTarget.querySelectorAll<HTMLElement>('a[href], button'));
    }

    private toggleTargetOrNull(): HTMLButtonElement | null {
        return this.hasToggleTarget ? this.toggleTarget : null;
    }
}
