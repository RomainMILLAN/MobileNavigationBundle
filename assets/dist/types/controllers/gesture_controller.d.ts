import { Controller } from '@hotwired/stimulus';
export default class extends Controller {
    static values: {
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
    disconnect(): void;
    start(event: TouchEvent): void;
    move(event: TouchEvent): void;
    end(event: TouchEvent): void;
    preventContextMenu(event: Event): void;
    replayNative(): void;
    private suppress;
    private cancelLongPress;
    private cancelSingleTap;
}
