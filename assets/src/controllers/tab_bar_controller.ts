import { Controller } from '@hotwired/stimulus';

import { haptic } from '../utils/haptic';

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
export function tabIndexAt(x: number, bounds: ReadonlyArray<TabBounds>): number {
    let best = -1;
    let bestDistance = Infinity;
    bounds.forEach((bound, index) => {
        const distance = x < bound.left ? bound.left - x : x > bound.right ? x - bound.right : 0;
        if (distance < bestDistance) {
            best = index;
            bestDistance = distance;
        }
    });

    return best;
}

/** Elasticity beyond an edge: grows with the overshoot without ever reaching limit. */
export function rubberBand(overflow: number, limit: number): number {
    if (overflow <= 0 || limit <= 0) {
        return 0;
    }

    return limit * (1 - 1 / (overflow / limit + 1));
}

export const RESIDUAL_CLICK_WINDOW_MS = 400;

/** The native click that follows a drag is "trusted" and arrives right after. */
export function isResidualClick(isTrusted: boolean, armedAt: number, now: number): boolean {
    return isTrusted && now - armedAt < RESIDUAL_CLICK_WINDOW_MS;
}

// Horizontal threshold beyond which a press becomes a drag.
const DRAG_THRESHOLD = 8;
// Inset of the lens within its tab, on each side.
const LENS_INSET = 4;

// Last visual position of the lens, in px within the pill. It lives at module
// level because the JS survives Turbo visits, the DOM does not: the new page starts from
// where the lens was and animates it to the active tab. Animation data only
// (the server remains the source of truth for the active tab); null when no tab
// is active, so as not to start from an unrelated position.
let lastLensX: number | null = null;

export default class extends Controller<HTMLElement> {
    static targets = ['pill', 'tab', 'lens'];

    declare readonly pillTarget: HTMLElement;
    declare readonly tabTargets: HTMLElement[];
    declare readonly lensTarget: HTMLElement;

    private bounds: TabBounds[] = [];
    private resizeObserver: ResizeObserver | null = null;

    private pointerId: number | null = null;
    private startX = 0;
    private dragging = false;
    private targetedIndex = -1;

    private armedAt = 0;
    private disarmTimer: number | null = null;

    private readonly onPointerDown = (event: PointerEvent): void => {
        if (event.pointerType === 'mouse' && event.button !== 0) {
            return;
        }
        this.disarmResidualClick();
        this.pointerId = event.pointerId;
        this.startX = event.clientX;
        this.dragging = false;
    };

    private readonly onPointerMove = (event: PointerEvent): void => {
        if (event.pointerId !== this.pointerId) {
            return;
        }

        if (!this.dragging) {
            if (Math.abs(event.clientX - this.startX) < DRAG_THRESHOLD) {
                return;
            }
            this.startDrag(event.pointerId);
        }

        const x = event.clientX - this.pillTarget.getBoundingClientRect().left;
        this.placeLens(this.elasticX(x - this.lensWidth() / 2), false);

        const index = tabIndexAt(x, this.bounds);
        if (index !== this.targetedIndex) {
            this.target(index);
            haptic('light');
        }
    };

    private readonly onPointerUp = (event: PointerEvent): void => {
        if (event.pointerId !== this.pointerId) {
            return;
        }
        this.pointerId = null;
        if (!this.dragging) {
            return;
        }

        const index = this.targetedIndex;
        this.endDrag();

        const tab = this.tabTargets[index];
        if (tab === undefined || index === this.activeIndex()) {
            this.restLens(true);
            return;
        }

        // Order: arm the guard, snap the lens, then click. The programmatic click()
        // is not "trusted" and passes the guard; the residual native click does not.
        this.armResidualClick();
        if (tab instanceof HTMLAnchorElement) {
            this.placeLens(this.xFor(index), true);
            lastLensX = this.xFor(index);
        } else {
            this.restLens(true);
        }
        tab.click();
    };

    private readonly onPointerCancel = (event: PointerEvent): void => {
        if (event.pointerId !== this.pointerId) {
            return;
        }
        this.pointerId = null;
        if (this.dragging) {
            this.endDrag();
            this.restLens(true);
        }
    };

    private readonly onResidualClick = (event: MouseEvent): void => {
        if (isResidualClick(event.isTrusted, this.armedAt, performance.now())) {
            event.preventDefault();
            event.stopPropagation();
            this.disarmResidualClick();
        }
    };

    // Tap on a link: the lens moves right away, without waiting for the next page.
    private readonly onTabClick = (event: MouseEvent): void => {
        const tab = (event.target as Element | null)?.closest('a');
        const index = tab === null || tab === undefined ? -1 : this.tabTargets.indexOf(tab);
        if (index >= 0 && !event.defaultPrevented) {
            this.lensTarget.classList.add('is-visible');
            this.placeLens(this.xFor(index), true);
            lastLensX = this.xFor(index);
        }
    };

    connect(): void {
        this.measure();
        this.restLens(false, lastLensX);

        this.pillTarget.addEventListener('pointerdown', this.onPointerDown);
        this.pillTarget.addEventListener('pointermove', this.onPointerMove);
        this.pillTarget.addEventListener('pointerup', this.onPointerUp);
        this.pillTarget.addEventListener('pointercancel', this.onPointerCancel);
        this.pillTarget.addEventListener('click', this.onTabClick);

        this.resizeObserver = new ResizeObserver(() => {
            this.measure();
            this.restLens(false);
        });
        this.resizeObserver.observe(this.pillTarget);
    }

    disconnect(): void {
        this.pillTarget.removeEventListener('pointerdown', this.onPointerDown);
        this.pillTarget.removeEventListener('pointermove', this.onPointerMove);
        this.pillTarget.removeEventListener('pointerup', this.onPointerUp);
        this.pillTarget.removeEventListener('pointercancel', this.onPointerCancel);
        this.pillTarget.removeEventListener('click', this.onTabClick);
        this.disarmResidualClick();
        this.resizeObserver?.disconnect();
        this.resizeObserver = null;
    }

    private activeIndex(): number {
        const active = this.tabTargets.find((tab) => tab.getAttribute('aria-current') === 'page');

        return active === undefined ? -1 : this.tabTargets.indexOf(active);
    }

    private measure(): void {
        this.bounds = this.tabTargets.map((tab) => ({
            left: tab.offsetLeft,
            right: tab.offsetLeft + tab.offsetWidth,
        }));
        const width = this.tabTargets[0]?.offsetWidth ?? 0;
        this.lensTarget.style.width = `${Math.max(0, width - LENS_INSET * 2)}px`;
    }

    private lensWidth(): number {
        return this.lensTarget.offsetWidth;
    }

    private xFor(index: number): number {
        return (this.bounds[index]?.left ?? 0) + LENS_INSET;
    }

    private elasticX(x: number): number {
        const min = this.xFor(0);
        const max = this.xFor(this.bounds.length - 1);
        const limit = this.lensWidth() / 3;
        if (x < min) {
            return min - rubberBand(min - x, limit);
        }
        if (x > max) {
            return max + rubberBand(x - max, limit);
        }

        return x;
    }

    /** Places the lens on the active tab, possibly starting from another position. */
    private restLens(animate: boolean, from: number | null = null): void {
        const active = this.activeIndex();
        this.target(-1);

        if (active < 0) {
            this.lensTarget.classList.remove('is-visible');
            lastLensX = null;
            return;
        }

        const to = this.xFor(active);
        this.lensTarget.classList.add('is-visible');
        if (from !== null && from !== to) {
            this.placeLens(from, false);
            // Forces the starting position to be computed before starting the transition.
            void this.lensTarget.offsetWidth;
            this.placeLens(to, true);
        } else {
            this.placeLens(to, animate);
        }
        lastLensX = to;
    }

    private placeLens(x: number, animate: boolean): void {
        this.lensTarget.classList.toggle('is-instant', !animate);
        this.lensTarget.style.setProperty('--lens-x', `${x}px`);
    }

    private target(index: number): void {
        this.targetedIndex = index;
        this.tabTargets.forEach((tab, i) => tab.classList.toggle('is-targeted', i === index));
    }

    private startDrag(pointerId: number): void {
        this.dragging = true;
        this.pillTarget.setPointerCapture(pointerId);
        this.pillTarget.classList.add('is-dragging');
        this.lensTarget.classList.add('is-visible');
    }

    private endDrag(): void {
        this.dragging = false;
        this.pillTarget.classList.remove('is-dragging');
        this.target(-1);
    }

    private armResidualClick(): void {
        this.disarmResidualClick();
        this.armedAt = performance.now();
        this.pillTarget.addEventListener('click', this.onResidualClick, true);
        this.disarmTimer = window.setTimeout(() => this.disarmResidualClick(), RESIDUAL_CLICK_WINDOW_MS);
    }

    // Removed by hand, never via { once: true }: the programmatic click()
    // would consume the listener first and let the residual click through.
    private disarmResidualClick(): void {
        this.pillTarget.removeEventListener('click', this.onResidualClick, true);
        if (this.disarmTimer !== null) {
            window.clearTimeout(this.disarmTimer);
            this.disarmTimer = null;
        }
    }
}
