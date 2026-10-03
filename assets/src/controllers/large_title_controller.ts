import { Controller } from '@hotwired/stimulus';

/**
 * iOS large title: when the page's <h1> scrolls off screen, the compact bar
 * (centered title, back) appears at the top.
 *
 * IntersectionObserver rather than a scroll listener. Its root depends on the mode:
 * in the installed PWA, the scroll container, marked with `.rm-mnb-scroller`;
 * in the browser, it is the document.
 */
export default class extends Controller<HTMLElement> {
    static targets = ['bar', 'title', 'scroller'];

    declare readonly hasBarTarget: boolean;
    declare readonly barTarget: HTMLElement;
    declare readonly hasTitleTarget: boolean;
    declare readonly titleTarget: HTMLElement;
    declare readonly hasScrollerTarget: boolean;
    declare readonly scrollerTarget: HTMLElement;

    private observer: IntersectionObserver | null = null;

    connect(): void {
        if (!this.hasBarTarget || !this.hasTitleTarget || !this.hasScrollerTarget) {
            return;
        }

        const overflowY = getComputedStyle(this.scrollerTarget).overflowY;
        const root = overflowY === 'auto' || overflowY === 'scroll' ? this.scrollerTarget : null;

        // The title is "gone" as soon as it passes under the compact bar, not at the edge. Without
        // a back button, it already starts within the bar's height: the margin is then capped
        // by its starting position, otherwise the bar would show before any scrolling.
        const barHeight = this.barTarget.offsetHeight;
        const rootTop = root?.getBoundingClientRect().top ?? 0;
        const titleBottom = this.titleTarget.getBoundingClientRect().bottom - rootTop + (root?.scrollTop ?? window.scrollY);
        const margin = Math.max(0, Math.min(barHeight, Math.floor(titleBottom) - 1));
        this.observer = new IntersectionObserver(
            ([entry]) => this.setCollapsed(entry !== undefined && !entry.isIntersecting),
            { root, rootMargin: `-${margin}px 0px 0px 0px`, threshold: 0 },
        );
        this.observer.observe(this.titleTarget);
    }

    disconnect(): void {
        this.observer?.disconnect();
        this.observer = null;
    }

    private setCollapsed(collapsed: boolean): void {
        this.barTarget.classList.toggle('is-collapsed', collapsed);
        // When collapsed, the compact bar exists neither for the keyboard nor for screen readers.
        this.barTarget.toggleAttribute('inert', !collapsed);
        if (collapsed) {
            this.barTarget.removeAttribute('aria-hidden');
        } else {
            this.barTarget.setAttribute('aria-hidden', 'true');
        }
    }
}
