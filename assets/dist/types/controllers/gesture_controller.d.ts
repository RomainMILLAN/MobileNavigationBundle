import { Controller } from '@hotwired/stimulus';
export default class extends Controller {
    static values: {
        doubleTap: {
            type: BooleanConstructor;
            default: boolean;
        };
        doubleTapMs: {
            type: NumberConstructor;
            default: number;
        };
        longPressMs: {
            type: NumberConstructor;
            default: number;
        };
        swipeDistance: {
            type: NumberConstructor;
            default: number;
        };
    };
    readonly doubleTapValue: boolean;
    readonly doubleTapMsValue: number;
    readonly longPressMsValue: number;
    readonly swipeDistanceValue: number;
    private lastTapTime;
    private singleTapTimer;
    private longPressTimer;
    private longPressTriggered;
    private startX;
    private startY;
    private moved;
    private touching;
    disconnect(): void;
    start(event: TouchEvent): void;
    move(event: TouchEvent): void;
    end(event: TouchEvent): void;
    /**
     * Replaces the native context menu with a longpress. Outside a touch (right click,
     * the Menu key, Shift+F10), it is the keyboard and mouse equivalent of the long press;
     * during a touch, the timer already handles it (Android also fires contextmenu then).
     */
    preventContextMenu(event: Event): void;
    cancel(): void;
    replayNative(): void;
    private suppress;
    private cancelLongPress;
    private cancelSingleTap;
}
