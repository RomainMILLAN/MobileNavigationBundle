import { Controller } from '@hotwired/stimulus';
export default class extends Controller<HTMLElement> {
    static values: {
        requireStandalone: {
            type: BooleanConstructor;
            default: boolean;
        };
    };
    readonly requireStandaloneValue: boolean;
    private startX;
    private startY;
    private lastX;
    private lastTime;
    private velocity;
    private tracking;
    private dragging;
    private underlay;
    private readonly onTouchStart;
    private readonly onTouchMove;
    private readonly onTouchEnd;
    connect(): void;
    disconnect(): void;
    private get enabled();
    private touchStart;
    private touchMove;
    private touchEnd;
    private buildUnderlay;
    /** Same frame and same scroll as the real page, so that going back does not jump. */
    private placeCopy;
    private follow;
    private complete;
    private cancel;
    private settle;
    private reset;
}
