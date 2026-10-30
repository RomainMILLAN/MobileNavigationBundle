import { Controller } from "@hotwired/stimulus";
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
// src/controllers/back_controller.ts
/**
* Back link: goes to the **previous page** when the history tracker proves one in the app
* (history.go), otherwise lets the link follow its href, the **parent fallback** computed
* by the server. Modified clicks (new tab, etc.) always follow the href.
*
* With `targetLabel` (a translated template holding %label%), the aria-label always says
* where the click leads: the previous page's name, "previous page" when its name is
* unknown (after a reload), the parent fallback's label otherwise.
*
* The tracker is created with the module, so its turbo:load listener runs before ours.
* Without Turbo 8 (no restoration state) there is never a target: the href applies.
*/
if (typeof window !== "undefined") historyTracker();
var back_controller_default = class extends Controller {
	static values = {
		targetLabel: String,
		previousLabel: String,
		fallbackLabel: String
	};
	onPageChange = () => this.refreshLabel();
	connect() {
		historyTracker().ensureStarted();
		this.refreshLabel();
		document.addEventListener("turbo:morph", this.onPageChange);
		document.addEventListener("turbo:load", this.onPageChange);
	}
	disconnect() {
		document.removeEventListener("turbo:morph", this.onPageChange);
		document.removeEventListener("turbo:load", this.onPageChange);
	}
	go(event) {
		if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
		const tracker = historyTracker();
		if (tracker.isGoingBack()) {
			event.preventDefault();
			return;
		}
		const target = tracker.target();
		if (target === null) return;
		if (tracker.goBack(target) !== "refused") event.preventDefault();
	}
	refreshLabel() {
		if (!this.hasTargetLabelValue) return;
		const title = historyTracker().target()?.entry.title;
		let label;
		if (title === void 0) label = this.fallbackLabelValue;
		else if (title === "") label = this.previousLabelValue;
		else label = this.targetLabelValue.split("%label%").join(title);
		if (label !== "") this.element.setAttribute("aria-label", label);
	}
};
export { back_controller_default as default };
