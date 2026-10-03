import { Controller } from "@hotwired/stimulus";
//#region src/utils/haptic.ts
function haptic(style = "light") {
	if (!navigator.vibrate) return;
	navigator.vibrate({
		light: 10,
		medium: 20,
		heavy: 30
	}[style]);
}
//#endregion
//#region src/controllers/tab_bar_controller.ts
/** Index of the tab closest to x (coordinate within the pill), -1 when there is no tab. */
function tabIndexAt(x, bounds) {
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
function rubberBand(overflow, limit) {
	if (overflow <= 0 || limit <= 0) return 0;
	return limit * (1 - 1 / (overflow / limit + 1));
}
var RESIDUAL_CLICK_WINDOW_MS = 400;
/** The native click that follows a drag is "trusted" and arrives right after. */
function isResidualClick(isTrusted, armedAt, now) {
	return isTrusted && now - armedAt < 400;
}
var DRAG_THRESHOLD = 8;
var LENS_INSET = 4;
var lastLensX = null;
var tab_bar_controller_default = class extends Controller {
	static targets = [
		"pill",
		"tab",
		"lens"
	];
	bounds = [];
	resizeObserver = null;
	pointerId = null;
	startX = 0;
	dragging = false;
	targetedIndex = -1;
	armedAt = 0;
	disarmTimer = null;
	onPointerDown = (event) => {
		if (event.pointerType === "mouse" && event.button !== 0) return;
		this.disarmResidualClick();
		this.pointerId = event.pointerId;
		this.startX = event.clientX;
		this.dragging = false;
	};
	onPointerMove = (event) => {
		if (event.pointerId !== this.pointerId) return;
		if (!this.dragging) {
			if (Math.abs(event.clientX - this.startX) < DRAG_THRESHOLD) return;
			this.startDrag(event.pointerId);
		}
		const x = event.clientX - this.pillTarget.getBoundingClientRect().left;
		this.placeLens(this.elasticX(x - this.lensWidth() / 2), false);
		const index = tabIndexAt(x, this.bounds);
		if (index !== this.targetedIndex) {
			this.target(index);
			haptic("light");
		}
	};
	onPointerUp = (event) => {
		if (event.pointerId !== this.pointerId) return;
		this.pointerId = null;
		if (!this.dragging) return;
		const index = this.targetedIndex;
		this.endDrag();
		const tab = this.tabTargets[index];
		if (tab === void 0 || index === this.activeIndex()) {
			this.restLens(true);
			return;
		}
		this.armResidualClick();
		if (tab instanceof HTMLAnchorElement) {
			this.placeLens(this.xFor(index), true);
			lastLensX = this.xFor(index);
		} else this.restLens(true);
		tab.click();
	};
	onPointerCancel = (event) => {
		if (event.pointerId !== this.pointerId) return;
		this.pointerId = null;
		if (this.dragging) {
			this.endDrag();
			this.restLens(true);
		}
	};
	onResidualClick = (event) => {
		if (isResidualClick(event.isTrusted, this.armedAt, performance.now())) {
			event.preventDefault();
			event.stopPropagation();
			this.disarmResidualClick();
		}
	};
	onTabClick = (event) => {
		const tab = event.target?.closest("a");
		const index = tab === null || tab === void 0 ? -1 : this.tabTargets.indexOf(tab);
		if (index >= 0 && !event.defaultPrevented) {
			this.lensTarget.classList.add("is-visible");
			this.placeLens(this.xFor(index), true);
			lastLensX = this.xFor(index);
		}
	};
	connect() {
		this.measure();
		this.restLens(false, lastLensX);
		this.pillTarget.addEventListener("pointerdown", this.onPointerDown);
		this.pillTarget.addEventListener("pointermove", this.onPointerMove);
		this.pillTarget.addEventListener("pointerup", this.onPointerUp);
		this.pillTarget.addEventListener("pointercancel", this.onPointerCancel);
		this.pillTarget.addEventListener("click", this.onTabClick);
		this.resizeObserver = new ResizeObserver(() => {
			this.measure();
			this.restLens(false);
		});
		this.resizeObserver.observe(this.pillTarget);
	}
	disconnect() {
		this.pillTarget.removeEventListener("pointerdown", this.onPointerDown);
		this.pillTarget.removeEventListener("pointermove", this.onPointerMove);
		this.pillTarget.removeEventListener("pointerup", this.onPointerUp);
		this.pillTarget.removeEventListener("pointercancel", this.onPointerCancel);
		this.pillTarget.removeEventListener("click", this.onTabClick);
		this.disarmResidualClick();
		this.resizeObserver?.disconnect();
		this.resizeObserver = null;
	}
	activeIndex() {
		const active = this.tabTargets.find((tab) => tab.getAttribute("aria-current") === "page");
		return active === void 0 ? -1 : this.tabTargets.indexOf(active);
	}
	measure() {
		this.bounds = this.tabTargets.map((tab) => ({
			left: tab.offsetLeft,
			right: tab.offsetLeft + tab.offsetWidth
		}));
		const width = this.tabTargets[0]?.offsetWidth ?? 0;
		this.lensTarget.style.width = `${Math.max(0, width - 8)}px`;
	}
	lensWidth() {
		return this.lensTarget.offsetWidth;
	}
	xFor(index) {
		return (this.bounds[index]?.left ?? 0) + LENS_INSET;
	}
	elasticX(x) {
		const min = this.xFor(0);
		const max = this.xFor(this.bounds.length - 1);
		const limit = this.lensWidth() / 3;
		if (x < min) return min - rubberBand(min - x, limit);
		if (x > max) return max + rubberBand(x - max, limit);
		return x;
	}
	/** Places the lens on the active tab, possibly starting from another position. */
	restLens(animate, from = null) {
		const active = this.activeIndex();
		this.target(-1);
		if (active < 0) {
			this.lensTarget.classList.remove("is-visible");
			lastLensX = null;
			return;
		}
		const to = this.xFor(active);
		this.lensTarget.classList.add("is-visible");
		if (from !== null && from !== to) {
			this.placeLens(from, false);
			this.lensTarget.offsetWidth;
			this.placeLens(to, true);
		} else this.placeLens(to, animate);
		lastLensX = to;
	}
	placeLens(x, animate) {
		this.lensTarget.classList.toggle("is-instant", !animate);
		this.lensTarget.style.setProperty("--lens-x", `${x}px`);
	}
	target(index) {
		this.targetedIndex = index;
		this.tabTargets.forEach((tab, i) => tab.classList.toggle("is-targeted", i === index));
	}
	startDrag(pointerId) {
		this.dragging = true;
		this.pillTarget.setPointerCapture(pointerId);
		this.pillTarget.classList.add("is-dragging");
		this.lensTarget.classList.add("is-visible");
	}
	endDrag() {
		this.dragging = false;
		this.pillTarget.classList.remove("is-dragging");
		this.target(-1);
	}
	armResidualClick() {
		this.disarmResidualClick();
		this.armedAt = performance.now();
		this.pillTarget.addEventListener("click", this.onResidualClick, true);
		this.disarmTimer = window.setTimeout(() => this.disarmResidualClick(), 400);
	}
	disarmResidualClick() {
		this.pillTarget.removeEventListener("click", this.onResidualClick, true);
		if (this.disarmTimer !== null) {
			window.clearTimeout(this.disarmTimer);
			this.disarmTimer = null;
		}
	}
};
//#endregion
export { RESIDUAL_CLICK_WINDOW_MS, tab_bar_controller_default as default, isResidualClick, rubberBand, tabIndexAt };
