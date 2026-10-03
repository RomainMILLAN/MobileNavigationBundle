import { Controller } from '@hotwired/stimulus';

import { haptic } from '../utils/haptic';
import {
    applyVisit,
    previousEntry,
    shouldCompleteBack,
    withCurrentScroll,
    type HistoryEntry,
    type VisitAction,
} from '../utils/history_stack';

/**
 * Swipe back from the left edge, as on iOS: the page follows the finger and
 * reveals the previous page, offset then brought back into place (parallax). On release,
 * history.back() shows that same page, at the same scroll position: nothing jumps.
 *
 * The previous page is an inert copy of the snapshot Turbo keeps of every page
 * it leaves. Without a snapshot, only the background shows, and the back gesture stays smooth.
 *
 * Set on the page container (.rm-mnb-scroller). The gesture exists only if there is an
 * app page to go back to, with Turbo only, and by default only in the installed PWA: in a
 * browser, the edge swipe already belongs to the browser (double back otherwise).
 */
const STORAGE_KEY = 'rm-mnb-history';
const EDGE_ZONE = 24;
const MIN_DRAG = 10;
const PARALLAX = 0.3;
const SETTLE_MS = 320;
const SAFETY_MS = 4000;

let stack: HistoryEntry[] = readStack();
let pendingAction: VisitAction | null = null;
let tracking = false;

function readStack(): HistoryEntry[] {
    try {
        const raw = window.sessionStorage.getItem(STORAGE_KEY);
        const parsed: unknown = raw === null ? [] : JSON.parse(raw);

        return Array.isArray(parsed) ? parsed.filter(isEntry) : [];
    } catch {
        return [];
    }
}

function isEntry(value: unknown): value is HistoryEntry {
    return typeof value === 'object' && value !== null
        && typeof (value as HistoryEntry).url === 'string'
        && typeof (value as HistoryEntry).scroll === 'number';
}

function writeStack(): void {
    try {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stack.slice(-50)));
    } catch {
        // Storage unavailable (private browsing): the stack lives in memory.
    }
}

function scroller(): HTMLElement | null {
    const element = document.querySelector<HTMLElement>('.rm-mnb-scroller');
    if (element === null) {
        return null;
    }
    const overflow = getComputedStyle(element).overflowY;

    return overflow === 'auto' || overflow === 'scroll' ? element : null;
}

function currentScroll(): number {
    return scroller()?.scrollTop ?? window.scrollY;
}

/** Tracks the app's history, once and for all, whatever the number of pages. */
function trackHistory(): void {
    if (tracking) {
        return;
    }
    tracking = true;

    document.addEventListener('turbo:visit', (event) => {
        pendingAction = (event as CustomEvent<{ action: VisitAction }>).detail.action;
        // Going back restores the page's scroll position at once: an animated scroll
        // (the theme's scroll-behavior: smooth) would first show it at the top, then sliding.
        if (pendingAction === 'restore') {
            document.documentElement.classList.add('rm-mnb-restoring');
        }
    });
    document.addEventListener('turbo:before-cache', () => {
        stack = withCurrentScroll(stack, currentScroll());
        writeStack();
    });
    // The scrolling container (PWA) is not restored by Turbo, only the window is:
    // the restored page gets back here the scroll position where it was left.
    document.addEventListener('turbo:render', () => {
        if (pendingAction !== 'restore') {
            return;
        }
        const element = scroller();
        const entry = [...stack].reverse().find((candidate) => candidate.url === window.location.href);
        if (element !== null && entry !== undefined) {
            element.scrollTop = entry.scroll;
        }
    });
    document.addEventListener('turbo:load', () => {
        window.requestAnimationFrame(() => document.documentElement.classList.remove('rm-mnb-restoring'));
        stack = applyVisit(stack, window.location.href, pendingAction ?? 'advance');
        pendingAction = null;
        writeStack();
    });

    stack = applyVisit(stack, window.location.href, 'advance');
    writeStack();
}

/** The page's Turbo snapshot, or null (Turbo internal API: never blocking). */
function cachedPage(url: string): HTMLElement | null {
    try {
        const snapshot = window.Turbo?.session?.view.snapshotCache.get(new URL(url, window.location.href));
        // `element` (the snapshot's body) is not declared by Turbo's types.
        const body = (snapshot as unknown as { element?: unknown } | undefined)?.element;

        return body instanceof Element ? body.querySelector<HTMLElement>('.rm-mnb-scroller') : null;
    } catch {
        return null;
    }
}

/** A copy that does not come alive: no Stimulus controller, no frame, no duplicate id. */
function inertCopy(page: HTMLElement): HTMLElement {
    const copy = page.cloneNode(true) as HTMLElement;
    [copy, ...Array.from(copy.querySelectorAll<HTMLElement>('*'))].forEach((element) => {
        element.removeAttribute('id');
        element.removeAttribute('data-controller');
        element.removeAttribute('data-action');
        if (element.localName === 'turbo-frame') {
            element.removeAttribute('src');
        }
    });
    copy.setAttribute('inert', '');
    copy.setAttribute('aria-hidden', 'true');
    copy.classList.add('rm-mnb-back-underlay__page');

    return copy;
}

export default class extends Controller<HTMLElement> {
    static values = { requireStandalone: { type: Boolean, default: true } };

    declare readonly requireStandaloneValue: boolean;

    private startX = 0;
    private startY = 0;
    private lastX = 0;
    private lastTime = 0;
    private velocity = 0;
    private tracking = false;
    private dragging = false;
    private underlay: HTMLElement | null = null;

    private readonly onTouchStart = (event: TouchEvent): void => this.touchStart(event);
    private readonly onTouchMove = (event: TouchEvent): void => this.touchMove(event);
    private readonly onTouchEnd = (): void => this.touchEnd();

    connect(): void {
        // Without Turbo there is no snapshot nor visit event: the gesture stays off.
        if (window.Turbo?.session === undefined) {
            return;
        }
        trackHistory();
        this.element.addEventListener('touchstart', this.onTouchStart, { passive: true });
        this.element.addEventListener('touchmove', this.onTouchMove, { passive: false });
        this.element.addEventListener('touchend', this.onTouchEnd, { passive: true });
        this.element.addEventListener('touchcancel', this.onTouchEnd, { passive: true });
    }

    disconnect(): void {
        this.element.removeEventListener('touchstart', this.onTouchStart);
        this.element.removeEventListener('touchmove', this.onTouchMove);
        this.element.removeEventListener('touchend', this.onTouchEnd);
        this.element.removeEventListener('touchcancel', this.onTouchEnd);
        this.reset();
    }

    private get enabled(): boolean {
        const standalone = window.matchMedia?.('(display-mode: standalone)').matches
            || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

        return (standalone || !this.requireStandaloneValue)
            && previousEntry(stack) !== null
            && !document.documentElement.classList.contains('rm-mnb-has-open-sheet');
    }

    private touchStart(event: TouchEvent): void {
        const touch = event.touches[0];
        if (touch === undefined) {
            this.tracking = false;
            return;
        }
        this.tracking = touch.clientX <= EDGE_ZONE && this.underlay === null && this.enabled;
        this.dragging = false;
        this.startX = touch.clientX;
        this.startY = touch.clientY;
        this.lastX = touch.clientX;
        this.lastTime = event.timeStamp;
        this.velocity = 0;
    }

    private touchMove(event: TouchEvent): void {
        if (!this.tracking) {
            return;
        }
        const touch = event.touches[0];
        if (touch === undefined) {
            return;
        }
        const deltaX = touch.clientX - this.startX;
        const deltaY = Math.abs(touch.clientY - this.startY);

        if (!this.dragging) {
            if (deltaX < MIN_DRAG && deltaY < MIN_DRAG) {
                return;
            }
            if (deltaY > deltaX) {
                this.tracking = false;
                return;
            }
            this.dragging = true;
            this.buildUnderlay();
        }

        event.preventDefault();
        const elapsed = Math.max(1, event.timeStamp - this.lastTime);
        this.velocity = (touch.clientX - this.lastX) / elapsed;
        this.lastX = touch.clientX;
        this.lastTime = event.timeStamp;
        this.follow(Math.max(0, deltaX));
    }

    private touchEnd(): void {
        if (!this.dragging) {
            this.tracking = false;
            return;
        }
        this.tracking = false;
        this.dragging = false;
        const distance = Math.max(0, this.lastX - this.startX);

        if (shouldCompleteBack(distance, window.innerWidth, this.velocity)) {
            this.complete();
        } else {
            this.cancel();
        }
    }

    private buildUnderlay(): void {
        const previous = previousEntry(stack);
        const underlay = document.createElement('div');
        underlay.className = 'rm-mnb-back-underlay';
        // Never in the snapshot Turbo takes of this page when leaving it.
        underlay.setAttribute('data-turbo-temporary', '');

        const page = previous === null ? null : cachedPage(previous.url);
        if (page !== null && previous !== null) {
            const copy = inertCopy(page);
            underlay.appendChild(copy);
            this.placeCopy(underlay, copy, previous.scroll);
        } else {
            document.body.prepend(underlay);
        }

        this.underlay = underlay;
        this.element.classList.add('rm-mnb-back-swipe--moving');
    }

    /** Same frame and same scroll as the real page, so that going back does not jump. */
    private placeCopy(underlay: HTMLElement, copy: HTMLElement, scroll: number): void {
        const rect = this.element.getBoundingClientRect();
        const ownScroller = scroller() !== null;
        // Under the current page: first child of body, painted before it.
        document.body.prepend(underlay);

        if (ownScroller) {
            underlay.style.setProperty('top', `${rect.top}px`);
            underlay.style.setProperty('height', `${rect.height}px`);
            copy.style.setProperty('height', `${rect.height}px`);
            copy.scrollTop = scroll;
        } else {
            const documentTop = rect.top + window.scrollY;
            copy.style.setProperty('transform', `translate3d(0, ${documentTop - scroll}px, 0)`);
        }
    }

    private follow(distance: number): void {
        const width = window.innerWidth;
        const progress = Math.min(distance / width, 1);
        this.element.style.setProperty('transform', `translate3d(${distance}px, 0, 0)`);
        this.underlay?.style.setProperty('transform', `translate3d(${-(1 - progress) * PARALLAX * width}px, 0, 0)`);
        this.underlay?.style.setProperty('--rm-mnb-back-progress', String(progress));
    }

    private complete(): void {
        const underlay = this.underlay;
        haptic('medium');
        this.settle(() => {
            // The copy moves to the front, the real page returns to its place unseen, then
            // Turbo shows the identical previous page: the copy disappears with the
            // replaced body.
            underlay?.classList.add('is-front');
            this.element.classList.remove('rm-mnb-back-swipe--moving', 'rm-mnb-back-swipe--settling');
            this.element.style.removeProperty('transform');
            document.documentElement.classList.add('rm-mnb-restoring');
            window.history.back();
            window.setTimeout(() => {
                if (underlay?.isConnected) {
                    this.reset();
                }
            }, SAFETY_MS);
        });
        this.follow(window.innerWidth);
    }

    private cancel(): void {
        this.settle(() => this.reset());
        this.follow(0);
    }

    private settle(done: () => void): void {
        this.element.classList.add('rm-mnb-back-swipe--settling');
        this.underlay?.classList.add('is-settling');
        window.setTimeout(done, SETTLE_MS);
    }

    private reset(): void {
        this.underlay?.remove();
        this.underlay = null;
        this.element.classList.remove('rm-mnb-back-swipe--moving', 'rm-mnb-back-swipe--settling');
        this.element.style.removeProperty('transform');
    }
}
