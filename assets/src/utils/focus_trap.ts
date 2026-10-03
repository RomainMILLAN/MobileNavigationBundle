/**
 * Focus handling for a modal sheet: what is focusable, the Tab trap, and the element to
 * return focus to on close.
 */

// ARIA contract published by the sheets' markup: an open or closed sheet is
// always a modal dialog. We rely on it rather than on a Stimulus attribute.
export const DIALOG_SELECTOR = '[role="dialog"][aria-modal="true"]';

const FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(',');

export function isVisible(element: HTMLElement): boolean {
    return element.getClientRects().length > 0 && getComputedStyle(element).visibility !== 'hidden';
}

export function focusableIn(root: HTMLElement): HTMLElement[] {
    return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(isVisible);
}

/**
 * The element to return focus to when the sheet closes, decided BEFORE opening it.
 *
 * The active element is kept only if it is inside no sheet: when chaining More →
 * Search, the active element is a row of the More sheet, which will be hidden. On iOS, a tap
 * does not focus the button: the active element is body. In both cases, we fall back to
 * the first visible trigger (aria-controls), otherwise focus will not be moved.
 */
export function returnTarget(
    active: Element | null,
    triggers: HTMLElement[],
    isShown: (element: HTMLElement) => boolean,
): HTMLElement | null {
    if (
        active instanceof HTMLElement
        && active !== active.ownerDocument.body
        && active.closest(DIALOG_SELECTOR) === null
    ) {
        return active;
    }

    return triggers.find(isShown) ?? null;
}

/** Keeps Tab and Shift+Tab inside root. */
export function trapTab(event: KeyboardEvent, root: HTMLElement): void {
    if (event.key !== 'Tab') {
        return;
    }

    const items = focusableIn(root);
    if (items.length === 0) {
        event.preventDefault();
        root.focus({ preventScroll: true });
        return;
    }

    const first = items[0];
    const last = items[items.length - 1];
    if (first === undefined || last === undefined) {
        return;
    }
    const active = root.ownerDocument.activeElement;

    if (event.shiftKey && (active === first || !root.contains(active))) {
        event.preventDefault();
        last.focus({ preventScroll: true });
    } else if (!event.shiftKey && (active === last || !root.contains(active))) {
        event.preventDefault();
        first.focus({ preventScroll: true });
    }
}
