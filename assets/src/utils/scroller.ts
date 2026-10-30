/** The page container when it scrolls itself (installed PWA), null when the window scrolls. */
export function scroller(): HTMLElement | null {
    const element = document.querySelector<HTMLElement>('.rm-mnb-scroller');
    if (element === null) {
        return null;
    }
    const overflow = getComputedStyle(element).overflowY;

    return overflow === 'auto' || overflow === 'scroll' ? element : null;
}

export function currentScroll(): number {
    return scroller()?.scrollTop ?? window.scrollY;
}
