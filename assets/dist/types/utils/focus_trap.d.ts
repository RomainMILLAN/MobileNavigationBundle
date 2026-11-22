/**
 * Focus handling for a modal sheet: what is focusable, and the element to return focus to
 * on close. The Tab trap and the inert page come from showModal(): there is none here.
 */
export declare const OPEN_SHEET_SELECTOR = ".rm-mnb-sheet--open";
export declare function isVisible(element: HTMLElement): boolean;
export declare function focusableIn(root: HTMLElement): HTMLElement[];
/**
 * The element to return focus to when the sheet closes, decided BEFORE opening it.
 *
 * The active element is kept only if it is inside no open sheet: when chaining More →
 * Search, the active element is a row of the More sheet, which will be hidden. On iOS, a tap
 * does not focus the button: the active element is body. In both cases, we fall back to
 * the first visible trigger (aria-controls), otherwise focus will not be moved.
 */
export declare function returnTarget(active: Element | null, triggers: HTMLElement[], isShown: (element: HTMLElement) => boolean): HTMLElement | null;
