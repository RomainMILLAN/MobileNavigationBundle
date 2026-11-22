/**
 * Focus handling for a modal sheet: what is focusable, and the element to return focus to
 * on close. The Tab trap and the inert page come from showModal(): there is none here.
 */

// An OPEN sheet, whatever its markup: a mobileOnly sheet rendered in place above
// 768 px is a <dialog> too, but never one the focus has to leave.
export const OPEN_SHEET_SELECTOR = '.rm-mnb-sheet--open';

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
 * The active element is kept only if it is inside no open sheet: when chaining More →
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
        && active.closest(OPEN_SHEET_SELECTOR) === null
    ) {
        return active;
    }

    return triggers.find(isShown) ?? null;
}
