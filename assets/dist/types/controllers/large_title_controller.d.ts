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
    static targets: string[];
    readonly hasBarTarget: boolean;
    readonly barTarget: HTMLElement;
    readonly hasTitleTarget: boolean;
    readonly titleTarget: HTMLElement;
    readonly hasScrollerTarget: boolean;
    readonly scrollerTarget: HTMLElement;
    private observer;
    connect(): void;
    disconnect(): void;
    private setCollapsed;
}
