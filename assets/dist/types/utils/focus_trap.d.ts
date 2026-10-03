/**
 * Focus handling for a modal sheet: what is focusable, the Tab trap, and the element to
 * return focus to on close.
 */
export declare const DIALOG_SELECTOR = "[role=\"dialog\"][aria-modal=\"true\"]";
export declare function isVisible(element: HTMLElement): boolean;
export declare function focusableIn(root: HTMLElement): HTMLElement[];
/**
 * The element to return focus to when the sheet closes, decided BEFORE opening it.
 *
 * The active element is kept only if it is inside no sheet: when chaining More →
 * Search, the active element is a row of the More sheet, which will be hidden. On iOS, a tap
 * does not focus the button: the active element is body. In both cases, we fall back to
 * the first visible trigger (aria-controls), otherwise focus will not be moved.
 */
export declare function returnTarget(active: Element | null, triggers: HTMLElement[], isShown: (element: HTMLElement) => boolean): HTMLElement | null;
/** Keeps Tab and Shift+Tab inside root. */
export declare function trapTab(event: KeyboardEvent, root: HTMLElement): void;
