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
//#region src/utils/history_stack.ts
function applyVisit(stack, url, action) {
	const entry = {
		url,
		scroll: 0
	};
	if (action === "replace" && stack.length > 0) return [...stack.slice(0, -1), entry];
	if (action === "restore") {
		const index = findLastIndex(stack, url);
		return index === -1 ? [entry] : stack.slice(0, index + 1);
	}
	if (stack.at(-1)?.url === url) return [...stack];
	return [...stack, entry];
}
function previousEntry(stack) {
	return stack.length > 1 ? stack.at(-2) ?? null : null;
}
function withCurrentScroll(stack, scroll) {
	const current = stack.at(-1);
	if (current === void 0) return [];
	return [...stack.slice(0, -1), {
		...current,
		scroll: Math.max(0, Math.round(scroll))
	}];
}
/** Has the gesture gone far enough (distance or velocity) to commit the back navigation? */
function shouldCompleteBack(distance, width, velocity) {
	if (distance <= 0 || width <= 0) return false;
	return distance / width >= .35 || velocity > .5 && distance > 40;
}
function findLastIndex(stack, url) {
	for (let index = stack.length - 1; index >= 0; index--) if (stack[index]?.url === url) return index;
	return -1;
}
//#endregion
//#region src/controllers/swipe_back_controller.ts
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
var STORAGE_KEY = "rm-mnb-history";
var EDGE_ZONE = 24;
var MIN_DRAG = 10;
var PARALLAX = .3;
var SETTLE_MS = 320;
var SAFETY_MS = 4e3;
var stack = readStack();
var pendingAction = null;
var tracking = false;
function readStack() {
	try {
		const raw = window.sessionStorage.getItem(STORAGE_KEY);
		const parsed = raw === null ? [] : JSON.parse(raw);
		return Array.isArray(parsed) ? parsed.filter(isEntry) : [];
	} catch {
		return [];
	}
}
function isEntry(value) {
	return typeof value === "object" && value !== null && typeof value.url === "string" && typeof value.scroll === "number";
}
function writeStack() {
	try {
		window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stack.slice(-50)));
	} catch {}
}
function scroller() {
	const element = document.querySelector(".rm-mnb-scroller");
	if (element === null) return null;
	const overflow = getComputedStyle(element).overflowY;
	return overflow === "auto" || overflow === "scroll" ? element : null;
}
function currentScroll() {
	return scroller()?.scrollTop ?? window.scrollY;
}
/** Tracks the app's history, once and for all, whatever the number of pages. */
function trackHistory() {
	if (tracking) return;
	tracking = true;
	document.addEventListener("turbo:visit", (event) => {
		pendingAction = event.detail.action;
		if (pendingAction === "restore") document.documentElement.classList.add("rm-mnb-restoring");
	});
	document.addEventListener("turbo:before-cache", () => {
		stack = withCurrentScroll(stack, currentScroll());
		writeStack();
	});
	document.addEventListener("turbo:render", () => {
		if (pendingAction !== "restore") return;
		const element = scroller();
		const entry = [...stack].reverse().find((candidate) => candidate.url === window.location.href);
		if (element !== null && entry !== void 0) element.scrollTop = entry.scroll;
	});
	document.addEventListener("turbo:load", () => {
		window.requestAnimationFrame(() => document.documentElement.classList.remove("rm-mnb-restoring"));
		stack = applyVisit(stack, window.location.href, pendingAction ?? "advance");
		pendingAction = null;
		writeStack();
	});
	stack = applyVisit(stack, window.location.href, "advance");
	writeStack();
}
/** The page's Turbo snapshot, or null (Turbo internal API: never blocking). */
function cachedPage(url) {
	try {
		const body = (window.Turbo?.session?.view.snapshotCache.get(new URL(url, window.location.href)))?.element;
		return body instanceof Element ? body.querySelector(".rm-mnb-scroller") : null;
	} catch {
		return null;
	}
}
/** A copy that does not come alive: no Stimulus controller, no frame, no duplicate id. */
function inertCopy(page) {
	const copy = page.cloneNode(true);
	[copy, ...Array.from(copy.querySelectorAll("*"))].forEach((element) => {
		element.removeAttribute("id");
		element.removeAttribute("data-controller");
		element.removeAttribute("data-action");
		if (element.localName === "turbo-frame") element.removeAttribute("src");
	});
	copy.setAttribute("inert", "");
	copy.setAttribute("aria-hidden", "true");
	copy.classList.add("rm-mnb-back-underlay__page");
	return copy;
}
var swipe_back_controller_default = class extends Controller {
	static values = { requireStandalone: {
		type: Boolean,
		default: true
	} };
	startX = 0;
	startY = 0;
	lastX = 0;
	lastTime = 0;
	velocity = 0;
	tracking = false;
	dragging = false;
	underlay = null;
	onTouchStart = (event) => this.touchStart(event);
	onTouchMove = (event) => this.touchMove(event);
	onTouchEnd = () => this.touchEnd();
	connect() {
		if (window.Turbo?.session === void 0) return;
		trackHistory();
		this.element.addEventListener("touchstart", this.onTouchStart, { passive: true });
		this.element.addEventListener("touchmove", this.onTouchMove, { passive: false });
		this.element.addEventListener("touchend", this.onTouchEnd, { passive: true });
		this.element.addEventListener("touchcancel", this.onTouchEnd, { passive: true });
	}
	disconnect() {
		this.element.removeEventListener("touchstart", this.onTouchStart);
		this.element.removeEventListener("touchmove", this.onTouchMove);
		this.element.removeEventListener("touchend", this.onTouchEnd);
		this.element.removeEventListener("touchcancel", this.onTouchEnd);
		this.reset();
	}
	get enabled() {
		return (window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true || !this.requireStandaloneValue) && previousEntry(stack) !== null && !document.documentElement.classList.contains("rm-mnb-has-open-sheet");
	}
	touchStart(event) {
		const touch = event.touches[0];
		if (touch === void 0) {
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
	touchMove(event) {
		if (!this.tracking) return;
		const touch = event.touches[0];
		if (touch === void 0) return;
		const deltaX = touch.clientX - this.startX;
		const deltaY = Math.abs(touch.clientY - this.startY);
		if (!this.dragging) {
			if (deltaX < MIN_DRAG && deltaY < MIN_DRAG) return;
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
	touchEnd() {
		if (!this.dragging) {
			this.tracking = false;
			return;
		}
		this.tracking = false;
		this.dragging = false;
		if (shouldCompleteBack(Math.max(0, this.lastX - this.startX), window.innerWidth, this.velocity)) this.complete();
		else this.cancel();
	}
	buildUnderlay() {
		const previous = previousEntry(stack);
		const underlay = document.createElement("div");
		underlay.className = "rm-mnb-back-underlay";
		underlay.setAttribute("data-turbo-temporary", "");
		const page = previous === null ? null : cachedPage(previous.url);
		if (page !== null && previous !== null) {
			const copy = inertCopy(page);
			underlay.appendChild(copy);
			this.placeCopy(underlay, copy, previous.scroll);
		} else document.body.prepend(underlay);
		this.underlay = underlay;
		this.element.classList.add("rm-mnb-back-swipe--moving");
	}
	/** Same frame and same scroll as the real page, so that going back does not jump. */
	placeCopy(underlay, copy, scroll) {
		const rect = this.element.getBoundingClientRect();
		const ownScroller = scroller() !== null;
		document.body.prepend(underlay);
		if (ownScroller) {
			underlay.style.setProperty("top", `${rect.top}px`);
			underlay.style.setProperty("height", `${rect.height}px`);
			copy.style.setProperty("height", `${rect.height}px`);
			copy.scrollTop = scroll;
		} else {
			const documentTop = rect.top + window.scrollY;
			copy.style.setProperty("transform", `translate3d(0, ${documentTop - scroll}px, 0)`);
		}
	}
	follow(distance) {
		const width = window.innerWidth;
		const progress = Math.min(distance / width, 1);
		this.element.style.setProperty("transform", `translate3d(${distance}px, 0, 0)`);
		this.underlay?.style.setProperty("transform", `translate3d(${-(1 - progress) * PARALLAX * width}px, 0, 0)`);
		this.underlay?.style.setProperty("--rm-mnb-back-progress", String(progress));
	}
	complete() {
		const underlay = this.underlay;
		haptic("medium");
		this.settle(() => {
			underlay?.classList.add("is-front");
			this.element.classList.remove("rm-mnb-back-swipe--moving", "rm-mnb-back-swipe--settling");
			this.element.style.removeProperty("transform");
			document.documentElement.classList.add("rm-mnb-restoring");
			window.history.back();
			window.setTimeout(() => {
				if (underlay?.isConnected) this.reset();
			}, SAFETY_MS);
		});
		this.follow(window.innerWidth);
	}
	cancel() {
		this.settle(() => this.reset());
		this.follow(0);
	}
	settle(done) {
		this.element.classList.add("rm-mnb-back-swipe--settling");
		this.underlay?.classList.add("is-settling");
		window.setTimeout(done, SETTLE_MS);
	}
	reset() {
		this.underlay?.remove();
		this.underlay = null;
		this.element.classList.remove("rm-mnb-back-swipe--moving", "rm-mnb-back-swipe--settling");
		this.element.style.removeProperty("transform");
	}
};
//#endregion
export { swipe_back_controller_default as default };
