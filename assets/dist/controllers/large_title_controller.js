import { Controller } from "@hotwired/stimulus";
//#region src/controllers/large_title_controller.ts
/**
* iOS large title: when the page's <h1> scrolls off screen, the compact bar
* (centered title, back) appears at the top.
*
* IntersectionObserver rather than a scroll listener. Its root depends on the mode:
* in the installed PWA, the scroll container, marked with `.rm-mnb-scroller`;
* in the browser, it is the document.
*/
var large_title_controller_default = class extends Controller {
	static targets = [
		"bar",
		"title",
		"scroller"
	];
	observer = null;
	connect() {
		if (!this.hasBarTarget || !this.hasTitleTarget || !this.hasScrollerTarget) return;
		const overflowY = getComputedStyle(this.scrollerTarget).overflowY;
		const root = overflowY === "auto" || overflowY === "scroll" ? this.scrollerTarget : null;
		const barHeight = this.barTarget.offsetHeight;
		const rootTop = root?.getBoundingClientRect().top ?? 0;
		const titleBottom = this.titleTarget.getBoundingClientRect().bottom - rootTop + (root?.scrollTop ?? window.scrollY);
		const margin = Math.max(0, Math.min(barHeight, Math.floor(titleBottom) - 1));
		this.observer = new IntersectionObserver(([entry]) => this.setCollapsed(entry !== void 0 && !entry.isIntersecting), {
			root,
			rootMargin: `-${margin}px 0px 0px 0px`,
			threshold: 0
		});
		this.observer.observe(this.titleTarget);
	}
	disconnect() {
		this.observer?.disconnect();
		this.observer = null;
	}
	setCollapsed(collapsed) {
		this.barTarget.classList.toggle("is-collapsed", collapsed);
		this.barTarget.toggleAttribute("inert", !collapsed);
		if (collapsed) this.barTarget.removeAttribute("aria-hidden");
		else this.barTarget.setAttribute("aria-hidden", "true");
	}
};
//#endregion
export { large_title_controller_default as default };
