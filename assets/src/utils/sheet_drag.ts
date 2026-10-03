/**
 * Pull-to-dismiss for a sheet: gesture tracking and dismiss decision.
 *
 * Touch events rather than Pointer Events: the sheet's content scrolls, and the
 * browser would cancel the pointer (pointercancel) as soon as it takes over the
 * scroll. A non-passive touchmove lets us keep the gesture when the sheet is at the top.
 */

// Beyond a quarter of its height, or flung faster than 0.5 px/ms, the sheet closes.
export const DISMISS_RATIO = 0.25;
export const DISMISS_VELOCITY = 0.5;

/** Downwards, the sheet follows the finger; upwards, it resists. */
export function dampen(delta: number): number {
    return delta >= 0 ? delta : delta * 0.15;
}

export function shouldDismiss(offset: number, height: number, velocity: number): boolean {
    return offset > height * DISMISS_RATIO || velocity > DISMISS_VELOCITY;
}

export interface SheetDragCallbacks {
    /** Can the gesture start from this target (handle, or content scrolled to the top)? */
    canStart(target: EventTarget | null): boolean;
    onMove(offset: number): void;
    onEnd(offset: number, velocity: number): void;
}

// Below this, a movement is a tap or a jitter, not a drag.
const START_THRESHOLD = 4;

/** Attaches the gesture to the panel; returns the function that detaches it. */
export function attachSheetDrag(panel: HTMLElement, callbacks: SheetDragCallbacks): () => void {
    let tracking = false;
    let dragging = false;
    let startY = 0;
    let lastY = 0;
    let lastTime = 0;
    let velocity = 0;

    const start = (y: number, target: EventTarget | null): void => {
        tracking = callbacks.canStart(target);
        dragging = false;
        startY = y;
        lastY = y;
        lastTime = performance.now();
        velocity = 0;
    };

    // Returns true when the gesture belongs to the sheet (native scrolling is blocked).
    const move = (y: number): boolean => {
        if (!tracking) {
            return false;
        }

        const delta = y - startY;
        if (!dragging) {
            if (delta < -START_THRESHOLD) {
                // The finger moves up: this is content scrolling, not a dismissal.
                tracking = false;
                return false;
            }
            if (delta <= START_THRESHOLD) {
                return false;
            }
            dragging = true;
        }

        const now = performance.now();
        velocity = (y - lastY) / Math.max(1, now - lastTime);
        lastY = y;
        lastTime = now;
        callbacks.onMove(dampen(delta));

        return true;
    };

    const end = (): void => {
        if (dragging) {
            callbacks.onEnd(dampen(lastY - startY), velocity);
        }
        tracking = false;
        dragging = false;
    };

    const onTouchStart = (event: TouchEvent): void => {
        const touch = event.touches[0];
        if (touch !== undefined) {
            start(touch.clientY, event.target);
        }
    };
    const onTouchMove = (event: TouchEvent): void => {
        const touch = event.touches[0];
        if (touch !== undefined && move(touch.clientY)) {
            event.preventDefault();
        }
    };
    const onMouseMove = (event: MouseEvent): void => {
        if (move(event.clientY)) {
            event.preventDefault();
        }
    };
    const onMouseUp = (): void => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        end();
    };
    const onMouseDown = (event: MouseEvent): void => {
        if (event.button !== 0) {
            return;
        }
        start(event.clientY, event.target);
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    panel.addEventListener('touchstart', onTouchStart, { passive: true });
    panel.addEventListener('touchmove', onTouchMove, { passive: false });
    panel.addEventListener('touchend', end, { passive: true });
    panel.addEventListener('touchcancel', end, { passive: true });
    panel.addEventListener('mousedown', onMouseDown);

    return (): void => {
        panel.removeEventListener('touchstart', onTouchStart);
        panel.removeEventListener('touchmove', onTouchMove);
        panel.removeEventListener('touchend', end);
        panel.removeEventListener('touchcancel', end);
        panel.removeEventListener('mousedown', onMouseDown);
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    };
}
