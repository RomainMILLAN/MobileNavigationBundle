/**
 * Pull-to-dismiss for a sheet: gesture tracking and dismiss decision.
 *
 * Touch events rather than Pointer Events: the sheet's content scrolls, and the
 * browser would cancel the pointer (pointercancel) as soon as it takes over the
 * scroll. A non-passive touchmove lets us keep the gesture when the sheet is at the top.
 */
export declare const DISMISS_RATIO = 0.25;
export declare const DISMISS_VELOCITY = 0.5;
/** Downwards, the sheet follows the finger; upwards, it resists. */
export declare function dampen(delta: number): number;
export declare function shouldDismiss(offset: number, height: number, velocity: number): boolean;
export interface SheetDragCallbacks {
    /** Can the gesture start from this target (handle, or content scrolled to the top)? */
    canStart(target: EventTarget | null): boolean;
    onMove(offset: number): void;
    onEnd(offset: number, velocity: number): void;
}
/** Attaches the gesture to the panel; returns the function that detaches it. */
export declare function attachSheetDrag(panel: HTMLElement, callbacks: SheetDragCallbacks): () => void;
