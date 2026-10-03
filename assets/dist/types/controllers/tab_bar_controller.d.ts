import { Controller } from '@hotwired/stimulus';
/**
 * iOS 26-style tab bar: a pill and a lens that marks the active tab.
 *
 * Generic and portable: no route and no label. The active tab is the one the
 * server marked aria-current="page"; if there is none, the lens is hidden.
 *
 * Tap: the lens slides to the tapped tab while navigation starts.
 * Drag: the lens follows the finger, grows and stretches beyond the edges; on release
 * it snaps into place and the target tab receives a click() (Turbo for a link, emit-event for a
 * button). The native click that sometimes follows a drag is neutralized.
 */
export interface TabBounds {
    left: number;
    right: number;
}
/** Index of the tab closest to x (coordinate within the pill), -1 when there is no tab. */
export declare function tabIndexAt(x: number, bounds: ReadonlyArray<TabBounds>): number;
/** Elasticity beyond an edge: grows with the overshoot without ever reaching limit. */
export declare function rubberBand(overflow: number, limit: number): number;
export declare const RESIDUAL_CLICK_WINDOW_MS = 400;
/** The native click that follows a drag is "trusted" and arrives right after. */
export declare function isResidualClick(isTrusted: boolean, armedAt: number, now: number): boolean;
export default class extends Controller<HTMLElement> {
    static targets: string[];
    readonly pillTarget: HTMLElement;
    readonly tabTargets: HTMLElement[];
    readonly lensTarget: HTMLElement;
    private bounds;
    private resizeObserver;
    private pointerId;
    private startX;
    private dragging;
    private targetedIndex;
    private armedAt;
    private disarmTimer;
    private readonly onPointerDown;
    private readonly onPointerMove;
    private readonly onPointerUp;
    private readonly onPointerCancel;
    private readonly onResidualClick;
    private readonly onTabClick;
    connect(): void;
    disconnect(): void;
    private activeIndex;
    private measure;
    private lensWidth;
    private xFor;
    private elasticX;
    /** Places the lens on the active tab, possibly starting from another position. */
    private restLens;
    private placeLens;
    private target;
    private startDrag;
    private endDrag;
    private armResidualClick;
    private disarmResidualClick;
}
