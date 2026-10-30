import { Controller } from "@hotwired/stimulus";
// src/utils/haptic.ts
function haptic(style = "light") {
	if (!navigator.vibrate) return;
	navigator.vibrate({
		light: 10,
		medium: 20,
		heavy: 30
	}[style]);
}
// src/utils/history_stack.ts
/** The page's URL without its fragment: #anchors are the same page. */
function pageUrl(href) {
	const hash = href.indexOf("#");
	return hash === -1 ? href : href.slice(0, hash);
}
/** Register of a document that starts without an adopted register. */
function startAt(entry) {
	return [entry];
}
/**
* Records the page Turbo just loaded. The kind of visit is deduced from its position,
* never from the turbo:visit event (Turbo turns an `advance` to the current URL into a
* `replace` while the event still says `advance`).
*/
function recordVisit(stack, loaded, entry) {
	const known = stack.find((candidate) => sameKey(candidate, entry));
	if (known !== void 0) return stack.map((candidate) => candidate === known ? {
		...entry,
		scroll: known.scroll
	} : candidate);
	if (loaded !== null && entry.index === loaded.index) return bounded([...stack.filter((candidate) => candidate.index !== entry.index), entry]);
	if (loaded !== null && entry.index === loaded.index + 1) return bounded([...stack.filter((candidate) => candidate.index < entry.index), entry]);
	return startAt(entry);
}
/**
* After a reload, Turbo rewrites the current entry with a NEW restorationIdentifier. The
* saved register is adopted only if it was written for this very entry: same index, same
* history length (a reload does not change it: a fingerprint, not a measure), same URL.
*/
function adoptReloaded(saved, current, historyLength) {
	if (saved === null || saved.loadedIndex !== current.index || saved.historyLength !== historyLength) return null;
	const entry = saved.stack.find((candidate) => candidate.index === current.index);
	if (entry === void 0 || entry.url !== current.url) return null;
	return saved.stack.filter((candidate) => candidate.index <= current.index).map((candidate) => candidate === entry ? {
		...candidate,
		id: current.id
	} : candidate);
}
/** The previous page the register proves, and how many steps lead to it; null if in doubt. */
function backTarget(stack, current) {
	if (current === null) return null;
	const head = stack.find((candidate) => candidate.index === current.index);
	if (head === void 0 || head.id !== current.id || head.url !== current.url) return null;
	for (let index = current.index - 1; index >= 0; index--) {
		const entry = stack.find((candidate) => candidate.index === index);
		if (entry === void 0) return null;
		if (entry.url !== current.url) return {
			steps: current.index - index,
			entry
		};
	}
	return null;
}
/** Records the scroll position of the given entry. */
function withScroll(stack, key, scroll) {
	return stack.map((entry) => sameKey(entry, key) ? {
		...entry,
		scroll: Math.max(0, Math.round(scroll))
	} : entry);
}
/** Has the gesture gone far enough (distance or velocity) to commit the back navigation? */
function shouldCompleteBack(distance, width, velocity) {
	if (distance <= 0 || width <= 0) return false;
	return distance / width >= .35 || velocity > .5 && distance > 40;
}
function sameKey(a, b) {
	return a.id === b.id && a.index === b.index;
}
/** In index order, the MAX_ENTRIES most recent ones. */
function bounded(stack) {
	return [...stack].sort((a, b) => a.index - b.index).slice(-50);
}
// src/utils/history_store.ts
/**
* The only owner of the `rm-mnb-history` key. What comes back from sessionStorage is
* untrusted: every entry is checked, a rejected entry leaves a hole in the indexes and
* the register then answers null, on purpose. Never "repair" by compacting the indexes.
*
* Titles are never written (account names at rest in the tab, surviving a logout): they
* live in the tracker's memory only, read back empty after a reload.
*/
var STORAGE_KEY = "rm-mnb-history";
function readSaved() {
	try {
		const raw = window.sessionStorage.getItem(STORAGE_KEY);
		if (raw === null) return null;
		const parsed = JSON.parse(raw);
		if (typeof parsed !== "object" || parsed === null) return null;
		const { stack, loadedIndex, historyLength } = parsed;
		if (!Array.isArray(stack) || !isIndex(loadedIndex) || !isIndex(historyLength)) return null;
		return {
			stack: stack.filter(isStoredEntry).map(({ id, index, url, scroll }) => ({
				id,
				index,
				url,
				scroll,
				title: ""
			})),
			loadedIndex,
			historyLength
		};
	} catch {
		return null;
	}
}
function writeSaved(saved) {
	const stored = {
		stack: saved.stack.slice(-50).map(({ id, index, url, scroll }) => ({
			id,
			index,
			url,
			scroll
		})),
		loadedIndex: saved.loadedIndex,
		historyLength: saved.historyLength
	};
	try {
		window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
	} catch {
		clearSaved();
	}
}
function clearSaved() {
	try {
		window.sessionStorage.removeItem(STORAGE_KEY);
	} catch {}
}
function isIndex(value) {
	return Number.isSafeInteger(value) && value >= 0;
}
function isStoredEntry(value) {
	if (typeof value !== "object" || value === null) return false;
	const entry = value;
	return typeof entry.id === "string" && typeof entry.url === "string" && isIndex(entry.index) && isIndex(entry.scroll);
}
// src/utils/scroller.ts
/** The page container when it scrolls itself (installed PWA), null when the window scrolls. */
function scroller() {
	const element = document.querySelector(".rm-mnb-scroller");
	if (element === null) return null;
	const overflow = getComputedStyle(element).overflowY;
	return overflow === "auto" || overflow === "scroll" ? element : null;
}
function currentScroll() {
	return scroller()?.scrollTop ?? window.scrollY;
}
// src/utils/history_tracker.ts
var KEY = Symbol.for("rm-mnb.history-tracker/v1");
var GOING_BACK_SAFETY_MS = 4e3;
var TITLE_MAX = 200;
function historyTracker() {
	const registry = window;
	const existing = registry[KEY];
	if (isTracker(existing)) return existing;
	const tracker = createHistoryTracker();
	registry[KEY] = tracker;
	return tracker;
}
/**
* A new tracker, outside the shared instance: for tests, whose `signal` removes its
* listeners. Code uses historyTracker().
*/
function createHistoryTracker(signal) {
	const options = { signal };
	let stack = [];
	let loaded = null;
	let started = false;
	let goingBack = null;
	let lastVisitRestores = false;
	let visitSincePopstate = false;
	if (navigationType() !== "reload") clearSaved();
	const persist = () => {
		if (loaded !== null) writeSaved({
			stack,
			loadedIndex: loaded.index,
			historyLength: window.history.length
		});
	};
	const stopGoingBack = () => {
		if (goingBack !== null) {
			window.clearTimeout(goingBack.timer);
			goingBack = null;
		}
	};
	const startHere = (page) => {
		stack = startAt(entryOf(page));
		loaded = {
			id: page.id,
			index: page.index
		};
		persist();
	};
	const tracker = {
		ensureStarted() {
			if (started) return;
			const page = currentPage();
			if (page === null) return;
			started = true;
			const adopted = navigationType() === "reload" ? adoptReloaded(readSaved(), page, window.history.length) : null;
			if (adopted === null) {
				startHere(page);
				return;
			}
			stack = recordVisit(adopted, null, entryOf(page));
			loaded = {
				id: page.id,
				index: page.index
			};
			persist();
		},
		target() {
			return started ? backTarget(stack, currentPage()) : null;
		},
		goBack(target) {
			if (goingBack !== null) return "busy";
			const steps = target.steps;
			if (!(Number.isSafeInteger(steps) && steps >= 1) || window.history.length <= steps) return "refused";
			goingBack = {
				fromIndex: currentPage()?.index ?? Number.POSITIVE_INFINITY,
				restoreSeen: false,
				timer: window.setTimeout(stopGoingBack, GOING_BACK_SAFETY_MS)
			};
			window.history.go(-steps);
			return "navigating";
		},
		isGoingBack() {
			return goingBack !== null;
		},
		restoredEntry() {
			const page = currentPage();
			if (!lastVisitRestores || page === null) return null;
			return stack.find((entry) => entry.id === page.id && entry.index === page.index) ?? null;
		}
	};
	document.addEventListener("turbo:visit", (event) => {
		visitSincePopstate = true;
		lastVisitRestores = event.detail?.action === "restore";
		if (lastVisitRestores) {
			document.documentElement.classList.add("rm-mnb-restoring");
			if (goingBack !== null) goingBack.restoreSeen = true;
		}
	}, options);
	window.addEventListener("popstate", () => {
		if (goingBack === null) return;
		visitSincePopstate = false;
		window.setTimeout(() => {
			if (!visitSincePopstate) stopGoingBack();
		}, 0);
	}, options);
	document.addEventListener("turbo:before-cache", () => {
		if (started && loaded !== null) {
			stack = withScroll(stack, loaded, currentScroll());
			persist();
		}
	}, options);
	document.addEventListener("turbo:load", () => {
		window.requestAnimationFrame(() => document.documentElement.classList.remove("rm-mnb-restoring"));
		tracker.ensureStarted();
		if (!started) return;
		const page = currentPage();
		if (page === null) {
			loaded = null;
			return;
		}
		stack = recordVisit(stack, loaded, entryOf(page));
		loaded = {
			id: page.id,
			index: page.index
		};
		persist();
		if (goingBack !== null && goingBack.restoreSeen && page.index < goingBack.fromIndex) stopGoingBack();
		lastVisitRestores = false;
	}, options);
	window.addEventListener("pageshow", (event) => {
		if (!event.persisted) return;
		stopGoingBack();
		const page = currentPage();
		if (page !== null) {
			started = true;
			startHere(page);
		}
	}, options);
	return tracker;
}
/** The page Turbo has written in history.state, or null (Turbo not started, foreign state). */
function currentPage() {
	const state = window.history.state;
	const turbo = typeof state === "object" && state !== null ? state.turbo : void 0;
	if (typeof turbo !== "object" || turbo === null) return null;
	const { restorationIdentifier, restorationIndex } = turbo;
	if (typeof restorationIdentifier !== "string" || !Number.isSafeInteger(restorationIndex) || restorationIndex < 0) return null;
	return {
		id: restorationIdentifier,
		index: restorationIndex,
		url: pageUrl(window.location.href)
	};
}
function entryOf(page) {
	return {
		id: page.id,
		index: page.index,
		url: page.url,
		scroll: 0,
		title: pageTitle()
	};
}
/** The page's name in the history: [data-rm-mnb-page-title], otherwise document.title. */
function pageTitle() {
	return (document.querySelector("[data-rm-mnb-page-title]")?.textContent?.trim() || document.title.trim()).slice(0, TITLE_MAX);
}
function navigationType() {
	try {
		return (window.performance?.getEntriesByType?.("navigation")[0])?.type;
	} catch {
		return;
	}
}
function isTracker(value) {
	if (typeof value !== "object" || value === null) return false;
	const candidate = value;
	return [
		"ensureStarted",
		"target",
		"goBack",
		"isGoingBack",
		"restoredEntry"
	].every((method) => typeof candidate[method] === "function");
}
// src/controllers/swipe_back_controller.ts
/**
* Swipe back from the left edge, as on iOS: the page follows the finger and
* reveals the previous page, offset then brought back into place (parallax). On release,
* history.go() shows that same page, at the same scroll position: nothing jumps.
*
* The previous page is an inert copy of the snapshot Turbo keeps of every page
* it leaves. Without a snapshot, only the background shows, and the back gesture stays smooth.
*
* Set on the page container (.rm-mnb-scroller). The gesture exists only if the history
* tracker proves a previous page in the app, with Turbo only, and by default only in the
* installed PWA: in a browser, the edge swipe already belongs to the browser.
*
* A system cancellation (touchcancel, e.g. iOS taking the edge gesture over) never
* navigates, and neither does a gesture during which the history already moved: either
* would go back twice.
*/
var EDGE_ZONE = 24;
var MIN_DRAG = 10;
var PARALLAX = .3;
var SETTLE_MS = 320;
var SAFETY_MS = 4e3;
var tracker = historyTracker();
document.addEventListener("turbo:render", () => {
	const entry = tracker.restoredEntry();
	const element = scroller();
	if (element !== null && entry !== null) element.scrollTop = entry.scroll;
});
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
	gestureHref = "";
	historyMoved = false;
	onTouchStart = (event) => this.touchStart(event);
	onTouchMove = (event) => this.touchMove(event);
	onTouchEnd = () => this.touchEnd();
	onTouchCancel = () => this.touchCancel();
	onPopState = () => {
		this.historyMoved = true;
	};
	connect() {
		if (window.Turbo?.session === void 0) return;
		tracker.ensureStarted();
		this.element.addEventListener("touchstart", this.onTouchStart, { passive: true });
		this.element.addEventListener("touchmove", this.onTouchMove, { passive: false });
		this.element.addEventListener("touchend", this.onTouchEnd, { passive: true });
		this.element.addEventListener("touchcancel", this.onTouchCancel, { passive: true });
	}
	disconnect() {
		this.element.removeEventListener("touchstart", this.onTouchStart);
		this.element.removeEventListener("touchmove", this.onTouchMove);
		this.element.removeEventListener("touchend", this.onTouchEnd);
		this.element.removeEventListener("touchcancel", this.onTouchCancel);
		this.reset();
	}
	get enabled() {
		return (window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true || !this.requireStandaloneValue) && !tracker.isGoingBack() && tracker.target() !== null && !document.documentElement.classList.contains("rm-mnb-has-open-sheet");
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
		if (this.tracking) this.watchHistory();
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
			this.unwatchHistory();
			return;
		}
		this.tracking = false;
		this.dragging = false;
		if (shouldCompleteBack(Math.max(0, this.lastX - this.startX), window.innerWidth, this.velocity)) this.complete();
		else this.cancel();
	}
	/** A system cancellation is never an intent to go back: the page returns into place. */
	touchCancel() {
		if (!this.dragging) {
			this.tracking = false;
			this.unwatchHistory();
			return;
		}
		this.tracking = false;
		this.dragging = false;
		this.cancel();
	}
	/** Watches whether the history moves during the gesture (a native back, for instance). */
	watchHistory() {
		this.unwatchHistory();
		this.gestureHref = window.location.href;
		this.historyMoved = false;
		window.addEventListener("popstate", this.onPopState);
	}
	unwatchHistory() {
		window.removeEventListener("popstate", this.onPopState);
	}
	buildUnderlay() {
		const previous = tracker.target()?.entry ?? null;
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
			const moved = this.historyMoved || window.location.href !== this.gestureHref;
			this.unwatchHistory();
			const target = moved ? null : tracker.target();
			if (target === null || tracker.goBack(target) !== "navigating") {
				this.reset();
				return;
			}
			document.documentElement.classList.add("rm-mnb-restoring");
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
		this.unwatchHistory();
		this.underlay?.remove();
		this.underlay = null;
		this.element.classList.remove("rm-mnb-back-swipe--moving", "rm-mnb-back-swipe--settling");
		this.element.style.removeProperty("transform");
	}
};
export { swipe_back_controller_default as default };
