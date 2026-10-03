import { Controller } from '@hotwired/stimulus';
import { haptic } from '../utils/haptic';

// Fixed prefix: without it, Stimulus would prefix with the controller identifier, which
// varies per app (`gesture`, `romainmillan--mobile-navigation-bundle--gesture`…).
const EVENT_PREFIX = 'rm-mnb-gesture';

export default class extends Controller {
    static values = {
        doubleTapMs: { type: Number, default: 280 },
        longPressMs: { type: Number, default: 500 },
        swipeDistance: { type: Number, default: 30 },
    };

    declare readonly doubleTapMsValue: number;
    declare readonly longPressMsValue: number;
    declare readonly swipeDistanceValue: number;

    private lastTapTime = 0;
    private singleTapTimer: ReturnType<typeof setTimeout> | null = null;
    private longPressTimer: ReturnType<typeof setTimeout> | null = null;
    private longPressTriggered = false;
    private startX = 0;
    private startY = 0;
    private moved = false;

    disconnect(): void {
        this.cancelLongPress();
        this.cancelSingleTap();
    }

    public start(event: TouchEvent): void {
        const touch = event.touches[0];
        if (touch === undefined) {
            return;
        }
        this.startX = touch.clientX;
        this.startY = touch.clientY;
        this.moved = false;
        this.longPressTriggered = false;
        this.longPressTimer = setTimeout(() => {
            this.longPressTriggered = true;
            haptic('medium');
        }, this.longPressMsValue);
    }

    public move(event: TouchEvent): void {
        const touch = event.touches[0];
        if (touch === undefined) {
            return;
        }
        if (Math.abs(touch.clientX - this.startX) > 10 || Math.abs(touch.clientY - this.startY) > 10) {
            this.moved = true;
            this.cancelLongPress();
        }
    }

    public end(event: TouchEvent): void {
        this.cancelLongPress();

        const touch = event.changedTouches[0];
        const deltaX = (touch ? touch.clientX : this.startX) - this.startX;
        const deltaY = (touch ? touch.clientY : this.startY) - this.startY;

        // Long-press
        if (this.longPressTriggered) {
            this.suppress(event);
            this.cancelSingleTap();
            this.lastTapTime = 0;
            this.dispatch('longpress', { prefix: EVENT_PREFIX });

            return;
        }

        // Vertical swipe (up or down)
        if (Math.abs(deltaY) > this.swipeDistanceValue && Math.abs(deltaY) > Math.abs(deltaX)) {
            this.cancelSingleTap();
            this.lastTapTime = 0;
            this.dispatch('swipe', { prefix: EVENT_PREFIX, detail: { direction: deltaY < 0 ? 'up' : 'down' } });

            return;
        }

        // Ambiguous drift: neither tap nor swipe
        if (this.moved) {
            return;
        }

        // Tap: swallow the native click to tell single from double
        this.suppress(event);

        const now = Date.now();
        if (this.singleTapTimer && now - this.lastTapTime < this.doubleTapMsValue) {
            this.cancelSingleTap();
            this.lastTapTime = 0;
            this.dispatch('doubletap', { prefix: EVENT_PREFIX });

            return;
        }

        this.lastTapTime = now;
        this.singleTapTimer = setTimeout(() => {
            this.singleTapTimer = null;
            this.lastTapTime = 0;
            this.dispatch('tap', { prefix: EVENT_PREFIX });
        }, this.doubleTapMsValue);
    }

    public preventContextMenu(event: Event): void {
        event.preventDefault();
    }

    public replayNative(): void {
        (this.element as HTMLElement).click();
    }

    private suppress(event: Event): void {
        event.preventDefault();
        event.stopImmediatePropagation();
    }

    private cancelLongPress(): void {
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
    }

    private cancelSingleTap(): void {
        if (this.singleTapTimer) {
            clearTimeout(this.singleTapTimer);
            this.singleTapTimer = null;
        }
    }
}
