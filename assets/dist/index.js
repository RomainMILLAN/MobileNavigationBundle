import { Controller } from "@hotwired/stimulus";
//#region src/confirm_contract.ts
var CONFIRM_REQUEST_EVENT = "rm-mnb-confirm:request";
/** Is the confirmation sheet present and displayable (mobile)? Otherwise: confirm(). */
function confirmSheetAvailable(id = "rm-mnb-confirm") {
	const sheet = document.getElementById(id);
	return sheet !== null && sheet.getClientRects().length > 0;
}
//#endregion
//#region src/controllers/confirm_sheet_controller.ts
/**
* Confirmation sheet for destructive actions. Mounted on the same element as a
* `sheet` (its id is the `sheet` value), it receives
* `rm-mnb-confirm:request` requests, fills in its text via textContent and opens the sheet. The
* destructive button carries the action's label; the exit, "Close", is the sheet's own
* and runs nothing.
*/
var confirm_sheet_controller_default = class extends Controller {
	static values = { sheet: String };
	static targets = [
		"title",
		"message",
		"confirm"
	];
	pending = null;
	onRequest = (event) => {
		const detail = event.detail;
		if (detail === void 0 || typeof detail.onConfirm !== "function") return;
		this.titleTarget.textContent = detail.title;
		this.messageTarget.textContent = detail.message;
		this.confirmTarget.textContent = detail.confirmLabel;
		this.pending = detail.onConfirm;
		window.dispatchEvent(new CustomEvent(`${this.sheetValue}:open`));
	};
	onClosed = (event) => {
		if (event.detail?.name === this.sheetValue) this.pending = null;
	};
	connect() {
		window.addEventListener(CONFIRM_REQUEST_EVENT, this.onRequest);
		window.addEventListener("rm-mnb:sheet-closed", this.onClosed);
	}
	disconnect() {
		window.removeEventListener(CONFIRM_REQUEST_EVENT, this.onRequest);
		window.removeEventListener("rm-mnb:sheet-closed", this.onClosed);
		this.pending = null;
	}
	confirm() {
		const action = this.pending;
		this.pending = null;
		window.dispatchEvent(new CustomEvent(`${this.sheetValue}:close`));
		action?.();
	}
};
//#endregion
//#region src/controllers/confirm_submit_controller.ts
/**
* POST form that asks for confirmation before submitting (SheetFormRow). The first
* submit is held back and goes through the page's ConfirmSheet (otherwise confirm()). Once
* confirmed, the form is resubmitted via requestSubmit() (hence via Turbo, like the
* desktop form) and that submission is the only one let through: a double tap does
* not trigger a second POST.
*/
var confirm_submit_controller_default = class extends Controller {
	static values = {
		title: String,
		message: String,
		confirmLabel: String
	};
	confirmed = false;
	sent = false;
	onSubmit = (event) => {
		if (this.sent) {
			event.preventDefault();
			return;
		}
		if (this.confirmed) {
			this.sent = true;
			return;
		}
		event.preventDefault();
		this.requestConfirmation();
	};
	connect() {
		this.element.addEventListener("submit", this.onSubmit);
	}
	disconnect() {
		this.element.removeEventListener("submit", this.onSubmit);
	}
	requestConfirmation() {
		const proceed = () => {
			this.confirmed = true;
			this.element.requestSubmit();
		};
		if (!confirmSheetAvailable()) {
			if (window.confirm(this.messageValue)) proceed();
			return;
		}
		window.dispatchEvent(new CustomEvent(CONFIRM_REQUEST_EVENT, { detail: {
			title: this.titleValue,
			message: this.messageValue,
			confirmLabel: this.confirmLabelValue,
			onConfirm: proceed
		} }));
	}
};
//#endregion
//#region src/controllers/emit_event_controller.ts
/**
* Generic micro-controller: dispatches a window CustomEvent on click.
* Lets FAB actions (outside the scope of a page controller)
* trigger client actions listened to via `@window`.
*/
var emit_event_controller_default = class extends Controller {
	static values = { name: String };
	emit() {
		window.dispatchEvent(new CustomEvent(this.nameValue));
	}
};
//#endregion
//#region src/controllers/filter_bar_controller.ts
/**
* Mobile filter bar: a "proxy" search field that copies its input into the
* real field of the app's form and fires `input` on it. The app's auto-submit takes
* over from there: a single form, no duplicate field.
*
* The real field is looked up with `form.elements.namedItem()`, never with a built
* selector (the name contains brackets).
*/
var filter_bar_controller_default = class extends Controller {
	static values = {
		form: String,
		field: String
	};
	static targets = ["proxy"];
	connect() {
		const field = this.field();
		if (field !== null && this.hasProxyTarget) this.proxyTarget.value = field.value;
	}
	mirror() {
		const field = this.field();
		if (field === null || !this.hasProxyTarget) return;
		field.value = this.proxyTarget.value;
		field.dispatchEvent(new Event("input", { bubbles: true }));
	}
	field() {
		const form = document.getElementById(this.formValue);
		if (!(form instanceof HTMLFormElement) || this.fieldValue === "") return null;
		const field = form.elements.namedItem(this.fieldValue);
		return field instanceof HTMLInputElement ? field : null;
	}
};
//#endregion
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
//#region src/controllers/gesture_controller.ts
var EVENT_PREFIX = "rm-mnb-gesture";
var gesture_controller_default = class extends Controller {
	static values = {
		doubleTapMs: {
			type: Number,
			default: 280
		},
		longPressMs: {
			type: Number,
			default: 500
		},
		swipeDistance: {
			type: Number,
			default: 30
		}
	};
	lastTapTime = 0;
	singleTapTimer = null;
	longPressTimer = null;
	longPressTriggered = false;
	startX = 0;
	startY = 0;
	moved = false;
	disconnect() {
		this.cancelLongPress();
		this.cancelSingleTap();
	}
	start(event) {
		const touch = event.touches[0];
		if (touch === void 0) return;
		this.startX = touch.clientX;
		this.startY = touch.clientY;
		this.moved = false;
		this.longPressTriggered = false;
		this.longPressTimer = setTimeout(() => {
			this.longPressTriggered = true;
			haptic("medium");
		}, this.longPressMsValue);
	}
	move(event) {
		const touch = event.touches[0];
		if (touch === void 0) return;
		if (Math.abs(touch.clientX - this.startX) > 10 || Math.abs(touch.clientY - this.startY) > 10) {
			this.moved = true;
			this.cancelLongPress();
		}
	}
	end(event) {
		this.cancelLongPress();
		const touch = event.changedTouches[0];
		const deltaX = (touch ? touch.clientX : this.startX) - this.startX;
		const deltaY = (touch ? touch.clientY : this.startY) - this.startY;
		if (this.longPressTriggered) {
			this.suppress(event);
			this.cancelSingleTap();
			this.lastTapTime = 0;
			this.dispatch("longpress", { prefix: EVENT_PREFIX });
			return;
		}
		if (Math.abs(deltaY) > this.swipeDistanceValue && Math.abs(deltaY) > Math.abs(deltaX)) {
			this.cancelSingleTap();
			this.lastTapTime = 0;
			this.dispatch("swipe", {
				prefix: EVENT_PREFIX,
				detail: { direction: deltaY < 0 ? "up" : "down" }
			});
			return;
		}
		if (this.moved) return;
		this.suppress(event);
		const now = Date.now();
		if (this.singleTapTimer && now - this.lastTapTime < this.doubleTapMsValue) {
			this.cancelSingleTap();
			this.lastTapTime = 0;
			this.dispatch("doubletap", { prefix: EVENT_PREFIX });
			return;
		}
		this.lastTapTime = now;
		this.singleTapTimer = setTimeout(() => {
			this.singleTapTimer = null;
			this.lastTapTime = 0;
			this.dispatch("tap", { prefix: EVENT_PREFIX });
		}, this.doubleTapMsValue);
	}
	preventContextMenu(event) {
		event.preventDefault();
	}
	replayNative() {
		this.element.click();
	}
	suppress(event) {
		event.preventDefault();
		event.stopImmediatePropagation();
	}
	cancelLongPress() {
		if (this.longPressTimer) {
			clearTimeout(this.longPressTimer);
			this.longPressTimer = null;
		}
	}
	cancelSingleTap() {
		if (this.singleTapTimer) {
			clearTimeout(this.singleTapTimer);
			this.singleTapTimer = null;
		}
	}
};
//#endregion
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
//#region src/utils/list.ts
/**
* Indexes of the section headers to hide: those repeating the previous one. This happens
* when "Load more" appends a page that continues the same month.
*/
function dedupeSectionHeaders(keys) {
	const duplicates = [];
	keys.forEach((key, index) => {
		if (index > 0 && key === keys[index - 1]) duplicates.push(index);
	});
	return duplicates;
}
//#endregion
//#region src/controllers/list_controller.ts
var TOGGLE_SELECTING_EVENT = "rm-mnb-list:toggle-selecting";
var TOGGLE_EDITING_EVENT = "rm-mnb-list:toggle-editing";
/** Notification dispatched on every entry into or exit from the "Edit" mode (detail.editing). */
var EDITING_CHANGED_EVENT = "rm-mnb-list:editing-changed";
var MODE_CLASSES = {
	selecting: {
		list: "is-selecting",
		root: "rm-mnb-list-selecting"
	},
	editing: {
		list: "is-editing",
		root: "rm-mnb-list-editing"
	}
};
/**
* iOS grouped list: section headers deduplicated after "Load more", and two exclusive
* modes, "Select" and "Edit", held by a single state.
* While selecting, a tap checks the row instead of opening it: the row is an <a>, so the
* click is intercepted. The checkboxes belong to the app (its StimulusAttributes); the
* bundle only checks them and dispatches `change`.
* While editing, a tap no longer navigates (the drag handles belong to the app, which
* listens to the rm-mnb-list:editing-changed notification).
* The window commands target every list of the page: a page has a single selectable or
* editable list.
*/
var list_controller_default = class extends Controller {
	static targets = ["section"];
	mode = "idle";
	onClick = (event) => {
		if (this.mode === "idle") return;
		const target = event.target;
		if (this.mode === "editing") {
			if (target?.closest("a") && this.element.contains(target)) event.preventDefault();
			return;
		}
		const row = target?.closest(".rm-mnb-list-row");
		if (row === null || row === void 0 || !this.element.contains(row) || target?.closest(".rm-mnb-list-row__select")) return;
		event.preventDefault();
		const checkbox = row.querySelector(".rm-mnb-list-row__select input[type=\"checkbox\"]");
		if (checkbox !== null) {
			checkbox.checked = !checkbox.checked;
			checkbox.dispatchEvent(new Event("change", { bubbles: true }));
		}
	};
	onFrameLoad = () => this.dedupeSections();
	onToggleCommand = () => this.toggleSelecting();
	onToggleEditingCommand = () => this.toggleEditing();
	connect() {
		this.element.addEventListener("click", this.onClick, true);
		this.element.addEventListener("turbo:frame-load", this.onFrameLoad);
		window.addEventListener(TOGGLE_SELECTING_EVENT, this.onToggleCommand);
		window.addEventListener(TOGGLE_EDITING_EVENT, this.onToggleEditingCommand);
		this.dedupeSections();
	}
	disconnect() {
		this.element.removeEventListener("click", this.onClick, true);
		this.element.removeEventListener("turbo:frame-load", this.onFrameLoad);
		window.removeEventListener(TOGGLE_SELECTING_EVENT, this.onToggleCommand);
		window.removeEventListener(TOGGLE_EDITING_EVENT, this.onToggleEditingCommand);
		this.setMode("idle");
	}
	toggleSelecting() {
		this.setMode(this.mode === "selecting" ? "idle" : "selecting");
	}
	toggleEditing() {
		this.setMode(this.mode === "editing" ? "idle" : "editing");
	}
	setMode(next) {
		const previous = this.mode;
		if (previous === next) return;
		if (previous === "selecting") this.clearSelection();
		this.mode = next;
		Object.keys(MODE_CLASSES).forEach((mode) => {
			this.element.classList.toggle(MODE_CLASSES[mode].list, mode === next);
			document.documentElement.classList.toggle(MODE_CLASSES[mode].root, mode === next);
		});
		if (previous === "editing" || next === "editing") window.dispatchEvent(new CustomEvent(EDITING_CHANGED_EVENT, { detail: { editing: next === "editing" } }));
	}
	clearSelection() {
		this.element.querySelectorAll(".rm-mnb-list-row__select input[type=\"checkbox\"]:checked").forEach((checkbox) => {
			checkbox.checked = false;
			checkbox.dispatchEvent(new Event("change", { bubbles: true }));
		});
	}
	dedupeSections() {
		const keys = this.sectionTargets.map((section) => section.getAttribute("aria-label") ?? "");
		this.sectionTargets.forEach((section) => section.classList.remove("is-continuation"));
		dedupeSectionHeaders(keys).forEach((index) => this.sectionTargets[index]?.classList.add("is-continuation"));
	}
};
//#endregion
//#region src/utils/same_origin.ts
/**
* The URL resolved against the current page, when it is an http(s) URL of the same
* origin; null otherwise (malformed, javascript:, data:, another host).
*/
function sameOriginUrl(url) {
	let target;
	try {
		target = new URL(url, window.location.href);
	} catch {
		return null;
	}
	if (target.protocol !== "http:" && target.protocol !== "https:") return null;
	return target.origin === window.location.origin ? target : null;
}
//#endregion
//#region src/controllers/navigate_controller.ts
/**
* Navigates to `url`: with Turbo when the page has it, with a full page load otherwise.
* Only same-origin http(s) URLs are followed.
*/
var navigate_controller_default = class extends Controller {
	static values = { url: String };
	visit() {
		if (!this.urlValue) return;
		const target = sameOriginUrl(this.urlValue);
		if (target === null) return;
		haptic("light");
		if (window.Turbo) window.Turbo.visit(target.href);
		else window.location.assign(target.href);
	}
};
var FOCUSABLE_SELECTOR = [
	"a[href]",
	"button:not([disabled])",
	"input:not([disabled]):not([type=\"hidden\"])",
	"select:not([disabled])",
	"textarea:not([disabled])",
	"[tabindex]:not([tabindex=\"-1\"])"
].join(",");
function isVisible(element) {
	return element.getClientRects().length > 0 && getComputedStyle(element).visibility !== "hidden";
}
function focusableIn(root) {
	return Array.from(root.querySelectorAll(FOCUSABLE_SELECTOR)).filter(isVisible);
}
/**
* The element to return focus to when the sheet closes, decided BEFORE opening it.
*
* The active element is kept only if it is inside no sheet: when chaining More →
* Search, the active element is a row of the More sheet, which will be hidden. On iOS, a tap
* does not focus the button: the active element is body. In both cases, we fall back to
* the first visible trigger (aria-controls), otherwise focus will not be moved.
*/
function returnTarget(active, triggers, isShown) {
	if (active instanceof HTMLElement && active !== active.ownerDocument.body && active.closest("[role=\"dialog\"][aria-modal=\"true\"]") === null) return active;
	return triggers.find(isShown) ?? null;
}
/** Keeps Tab and Shift+Tab inside root. */
function trapTab(event, root) {
	if (event.key !== "Tab") return;
	const items = focusableIn(root);
	if (items.length === 0) {
		event.preventDefault();
		root.focus({ preventScroll: true });
		return;
	}
	const first = items[0];
	const last = items[items.length - 1];
	if (first === void 0 || last === void 0) return;
	const active = root.ownerDocument.activeElement;
	if (event.shiftKey && (active === first || !root.contains(active))) {
		event.preventDefault();
		last.focus({ preventScroll: true });
	} else if (!event.shiftKey && (active === last || !root.contains(active))) {
		event.preventDefault();
		first.focus({ preventScroll: true });
	}
}
/** Downwards, the sheet follows the finger; upwards, it resists. */
function dampen(delta) {
	return delta >= 0 ? delta : delta * .15;
}
function shouldDismiss(offset, height, velocity) {
	return offset > height * .25 || velocity > .5;
}
var START_THRESHOLD = 4;
/** Attaches the gesture to the panel; returns the function that detaches it. */
function attachSheetDrag(panel, callbacks) {
	let tracking = false;
	let dragging = false;
	let startY = 0;
	let lastY = 0;
	let lastTime = 0;
	let velocity = 0;
	const start = (y, target) => {
		tracking = callbacks.canStart(target);
		dragging = false;
		startY = y;
		lastY = y;
		lastTime = performance.now();
		velocity = 0;
	};
	const move = (y) => {
		if (!tracking) return false;
		const delta = y - startY;
		if (!dragging) {
			if (delta < -4) {
				tracking = false;
				return false;
			}
			if (delta <= START_THRESHOLD) return false;
			dragging = true;
		}
		const now = performance.now();
		velocity = (y - lastY) / Math.max(1, now - lastTime);
		lastY = y;
		lastTime = now;
		callbacks.onMove(dampen(delta));
		return true;
	};
	const end = () => {
		if (dragging) callbacks.onEnd(dampen(lastY - startY), velocity);
		tracking = false;
		dragging = false;
	};
	const onTouchStart = (event) => {
		const touch = event.touches[0];
		if (touch !== void 0) start(touch.clientY, event.target);
	};
	const onTouchMove = (event) => {
		const touch = event.touches[0];
		if (touch !== void 0 && move(touch.clientY)) event.preventDefault();
	};
	const onMouseMove = (event) => {
		if (move(event.clientY)) event.preventDefault();
	};
	const onMouseUp = () => {
		document.removeEventListener("mousemove", onMouseMove);
		document.removeEventListener("mouseup", onMouseUp);
		end();
	};
	const onMouseDown = (event) => {
		if (event.button !== 0) return;
		start(event.clientY, event.target);
		document.addEventListener("mousemove", onMouseMove);
		document.addEventListener("mouseup", onMouseUp);
	};
	panel.addEventListener("touchstart", onTouchStart, { passive: true });
	panel.addEventListener("touchmove", onTouchMove, { passive: false });
	panel.addEventListener("touchend", end, { passive: true });
	panel.addEventListener("touchcancel", end, { passive: true });
	panel.addEventListener("mousedown", onMouseDown);
	return () => {
		panel.removeEventListener("touchstart", onTouchStart);
		panel.removeEventListener("touchmove", onTouchMove);
		panel.removeEventListener("touchend", end);
		panel.removeEventListener("touchcancel", end);
		panel.removeEventListener("mousedown", onMouseDown);
		document.removeEventListener("mousemove", onMouseMove);
		document.removeEventListener("mouseup", onMouseUp);
	};
}
//#endregion
//#region src/controllers/sheet_controller.ts
/**
* Generic iOS-style bottom sheet. No route, no label: reusable.
*
* Commands: `<name>:toggle`, `<name>:open`, `<name>:close`, on window (dispatched by the
* emit-event controller). They carry no detail. Opening an open sheet or
* closing a closed sheet does nothing.
*
* The element's id equals the `name` value: it is what the triggers reference
* in aria-controls, and it is through this ARIA attribute that the sheet keeps their
* aria-expanded up to date and finds whom to return focus to.
*
* "Only one open sheet" has no coordinator: it is a choreography. Before any
* state change, open() announces `rm-mnb:sheet-opening` (detail.name); every other sheet
* then closes without returning focus. Everything is synchronous, so there are never two
* open sheets.
*
* Emitted facts: `rm-mnb:sheet-opened` and `rm-mnb:sheet-closed` (bubbles, detail.name).
* `rm-mnb:sheet-opening` is a non-cancelable pre-event, dispatched on window before any
* state change.
*
* Closes without animation on each of the events in the `forceCloseEvents` value,
* listened to on window (document events bubble up to it). By default
* `turbo:before-cache`, so that no Turbo snapshot keeps a sheet open. The app
* adds its own: a lock screen, or the opening of a modal that would otherwise have
* a second focus trap competing with the sheet's.
*/
var sheet_controller_default = class extends Controller {
	static values = {
		name: String,
		forceCloseEvents: {
			type: Array,
			default: ["turbo:before-cache"]
		}
	};
	static targets = [
		"panel",
		"scroll",
		"closeZone"
	];
	isOpen = false;
	returnTo = null;
	detachDrag = null;
	onToggleCommand = () => this.toggle();
	onOpenCommand = () => this.open();
	onCloseCommand = () => this.close();
	onOpening = (event) => {
		if (event.detail?.name !== this.nameValue) this.close({ restoreFocus: false });
	};
	onForceClose = () => this.close({
		animate: false,
		restoreFocus: false
	});
	onKeydown = (event) => {
		if (!this.isOpen) return;
		if (event.key === "Escape") {
			event.preventDefault();
			this.close();
			return;
		}
		trapTab(event, this.panelTarget);
	};
	onClick = (event) => {
		const target = event.target;
		if (this.isOpen && target?.closest("a, button") !== null && this.closeZoneTargets.some((zone) => zone.contains(target))) this.close({ restoreFocus: false });
	};
	connect() {
		if (this.element.id !== this.nameValue) console.error(`rm-mnb sheet: the id "${this.element.id}" must equal the name value "${this.nameValue}".`);
		window.addEventListener(`${this.nameValue}:toggle`, this.onToggleCommand);
		window.addEventListener(`${this.nameValue}:open`, this.onOpenCommand);
		window.addEventListener(`${this.nameValue}:close`, this.onCloseCommand);
		window.addEventListener("rm-mnb:sheet-opening", this.onOpening);
		window.addEventListener("keydown", this.onKeydown);
		this.forceCloseEventsValue.forEach((name) => window.addEventListener(name, this.onForceClose));
		this.element.addEventListener("click", this.onClick);
		this.detachDrag = attachSheetDrag(this.panelTarget, {
			canStart: (target) => this.canStartDrag(target),
			onMove: (offset) => {
				this.panelTarget.classList.add("is-dragging");
				this.panelTarget.style.transform = `translate3d(0, ${offset}px, 0)`;
			},
			onEnd: (offset, velocity) => {
				this.panelTarget.classList.remove("is-dragging");
				if (shouldDismiss(offset, this.panelTarget.offsetHeight, velocity)) this.close();
				else this.panelTarget.style.transform = "";
			}
		});
	}
	disconnect() {
		window.removeEventListener(`${this.nameValue}:toggle`, this.onToggleCommand);
		window.removeEventListener(`${this.nameValue}:open`, this.onOpenCommand);
		window.removeEventListener(`${this.nameValue}:close`, this.onCloseCommand);
		window.removeEventListener("rm-mnb:sheet-opening", this.onOpening);
		window.removeEventListener("keydown", this.onKeydown);
		this.forceCloseEventsValue.forEach((name) => window.removeEventListener(name, this.onForceClose));
		this.element.removeEventListener("click", this.onClick);
		this.detachDrag?.();
		this.detachDrag = null;
		this.close({
			animate: false,
			restoreFocus: false
		});
	}
	/** Backdrop and handle action (a Stimulus action receives the event, close() takes options). */
	dismiss() {
		this.close();
	}
	toggle() {
		if (this.isOpen) this.close();
		else this.open();
	}
	open() {
		if (this.isOpen) return;
		this.returnTo = returnTarget(document.activeElement, this.triggers(), isVisible);
		window.dispatchEvent(new CustomEvent("rm-mnb:sheet-opening", { detail: { name: this.nameValue } }));
		this.isOpen = true;
		this.setDialogRole(true);
		this.element.classList.add("rm-mnb-sheet--open");
		document.documentElement.classList.add("rm-mnb-has-open-sheet");
		this.setExpanded(true);
		(focusableIn(this.panelTarget)[0] ?? this.panelTarget).focus({ preventScroll: true });
		this.dispatch("sheet-opened", {
			prefix: "rm-mnb",
			detail: { name: this.nameValue }
		});
	}
	close({ animate = true, restoreFocus = true } = {}) {
		if (!this.isOpen) return;
		this.isOpen = false;
		this.setDialogRole(false);
		if (!animate) this.element.classList.add("rm-mnb-sheet--instant");
		this.element.classList.remove("rm-mnb-sheet--open");
		this.panelTarget.style.transform = "";
		if (document.querySelector(".rm-mnb-sheet--open") === null) document.documentElement.classList.remove("rm-mnb-has-open-sheet");
		this.setExpanded(false);
		if (restoreFocus && this.returnTo !== null && isVisible(this.returnTo)) this.returnTo.focus({ preventScroll: true });
		this.returnTo = null;
		if (!animate) requestAnimationFrame(() => this.element.classList.remove("rm-mnb-sheet--instant"));
		this.dispatch("sheet-closed", {
			prefix: "rm-mnb",
			detail: { name: this.nameValue }
		});
	}
	triggers() {
		return Array.from(document.querySelectorAll(`[aria-controls="${this.element.id}"]`));
	}
	setDialogRole(open) {
		if (!this.element.classList.contains("rm-mnb-sheet--mobile-only")) return;
		if (open) {
			this.element.setAttribute("role", "dialog");
			this.element.setAttribute("aria-modal", "true");
		} else {
			this.element.removeAttribute("role");
			this.element.removeAttribute("aria-modal");
		}
	}
	setExpanded(expanded) {
		this.triggers().forEach((trigger) => trigger.setAttribute("aria-expanded", String(expanded)));
	}
	canStartDrag(target) {
		if (!this.isOpen) return false;
		const scroller = this.hasScrollTarget ? this.scrollTarget : this.panelTarget;
		return !(target instanceof Node && scroller.contains(target)) || scroller.scrollTop <= 0;
	}
};
//#endregion
//#region src/utils/tones.ts
/**
* The module's tones: a closed list. Any unknown value falls back to `neutral`, so
* that no data coming from the app can inject an arbitrary class or color.
*/
var TONES = [
	"accent",
	"positive",
	"negative",
	"info",
	"warning",
	"neutral"
];
function toTone(value) {
	return typeof value === "string" && TONES.includes(value) ? value : "neutral";
}
//#endregion
//#region src/controllers/swipe_actions_controller.ts
/**
* Methods a browser cannot submit, sent as a POST with a "_method" field (Symfony's
* http_method_override, Laravel's method spoofing). Same list as the HttpMethod enum
* (PHP side); any other value gets no field, so a payload cannot inject one.
*/
var SPOOFED_METHODS = /* @__PURE__ */ new Set([
	"PUT",
	"PATCH",
	"DELETE"
]);
var BUTTON_WIDTH = 72;
var MIN_SWIPE = 10;
/**
* Swiping a row to the left reveals its actions, each with its label. A
* destructive action is not sent directly: it goes through the confirmation sheet.
* The panel lives in <body> (it must stay under the sliding row) and is removed
* before every Turbo snapshot.
*/
var swipe_actions_controller_default = class extends Controller {
	static values = {
		actions: Array,
		csrfToken: String
	};
	/** Only the actions that target the current origin: any other is ignored. */
	get actions() {
		return this.actionsValue.filter((action) => sameOriginUrl(action.url) !== null);
	}
	startX = 0;
	startY = 0;
	currentX = 0;
	swiping = false;
	opened = false;
	panel = null;
	panelWidth = 0;
	panelLeft = 0;
	panelTop = 0;
	onTouchStart = (event) => this.touchStart(event);
	onTouchMove = (event) => this.touchMove(event);
	onTouchEnd = () => this.touchEnd();
	onDocumentTouch = (event) => {
		const target = event.target;
		if (this.opened && !this.element.contains(target) && !this.panel?.contains(target)) this.close();
	};
	onBeforeCache = () => this.reset();
	connect() {
		if (this.actions.length === 0) return;
		this.panelWidth = this.actions.length * BUTTON_WIDTH;
		this.element.addEventListener("touchstart", this.onTouchStart, { passive: true });
		this.element.addEventListener("touchmove", this.onTouchMove, { passive: false });
		this.element.addEventListener("touchend", this.onTouchEnd, { passive: true });
		document.addEventListener("turbo:before-cache", this.onBeforeCache);
		this.buildPanel();
	}
	disconnect() {
		this.element.removeEventListener("touchstart", this.onTouchStart);
		this.element.removeEventListener("touchmove", this.onTouchMove);
		this.element.removeEventListener("touchend", this.onTouchEnd);
		document.removeEventListener("touchstart", this.onDocumentTouch, true);
		document.removeEventListener("turbo:before-cache", this.onBeforeCache);
		this.reset();
	}
	reset() {
		this.panel?.remove();
		this.panel = null;
		this.opened = false;
		this.element.classList.remove("rm-mnb-swipe--moving", "rm-mnb-swipe--settling");
		this.element.style.removeProperty("transform");
	}
	buildPanel() {
		this.panel = document.createElement("div");
		this.panel.className = "rm-mnb-swipe-actions";
		this.panel.setAttribute("data-turbo-temporary", "");
		this.panel.style.setProperty("width", `${this.panelWidth}px`);
		this.actions.forEach((action) => this.panel?.appendChild(this.createButton(action)));
		document.body.appendChild(this.panel);
	}
	createContent(action, button) {
		const icon = document.createElement("i");
		icon.className = action.icon;
		icon.setAttribute("aria-hidden", "true");
		const label = document.createElement("span");
		label.className = "rm-mnb-swipe-actions__label";
		label.textContent = action.label;
		button.append(icon, label);
		button.setAttribute("aria-label", action.label);
		button.className = `rm-mnb-swipe-actions__button rm-mnb-tone--${toTone(action.tone)}`;
	}
	hiddenInput(name, value) {
		const input = document.createElement("input");
		input.type = "hidden";
		input.name = name;
		input.value = value;
		return input;
	}
	createButton(action) {
		if (action.method === void 0 || action.method.toUpperCase() === "GET") {
			const link = document.createElement("a");
			link.href = action.url;
			this.createContent(action, link);
			return link;
		}
		const form = document.createElement("form");
		form.method = "POST";
		form.action = action.url;
		form.className = "rm-mnb-swipe-actions__form";
		form.appendChild(this.hiddenInput("_token", this.csrfTokenValue));
		const method = action.method.toUpperCase();
		if (SPOOFED_METHODS.has(method)) form.appendChild(this.hiddenInput("_method", method));
		const redirect = this.hiddenInput("_redirect", "");
		form.appendChild(redirect);
		const submit = () => {
			redirect.value = window.location.pathname + window.location.search;
			form.submit();
		};
		form.addEventListener("submit", (event) => {
			event.preventDefault();
			if (action.confirm === void 0) {
				submit();
				return;
			}
			this.close();
			window.dispatchEvent(new CustomEvent(CONFIRM_REQUEST_EVENT, { detail: {
				title: action.label,
				message: action.confirm,
				confirmLabel: action.label,
				onConfirm: submit
			} }));
		});
		const button = document.createElement("button");
		button.type = "submit";
		this.createContent(action, button);
		form.appendChild(button);
		return form;
	}
	positionPanel() {
		if (this.panel === null) return;
		if (!this.opened) {
			const rect = this.element.getBoundingClientRect();
			this.panelLeft = rect.right - this.panelWidth;
			this.panelTop = rect.top;
			this.panel.style.setProperty("height", `${rect.height}px`);
		}
		this.panel.style.setProperty("top", `${this.panelTop}px`);
		this.panel.style.setProperty("left", `${this.panelLeft}px`);
		this.panel.classList.add("is-visible");
	}
	touchStart(event) {
		const touch = event.touches[0];
		if (touch === void 0) return;
		this.startX = touch.clientX;
		this.startY = touch.clientY;
		this.currentX = this.startX;
		this.swiping = false;
		document.addEventListener("touchstart", this.onDocumentTouch, {
			once: true,
			capture: true
		});
	}
	touchMove(event) {
		if (this.element.closest(".is-selecting, .is-editing") !== null) return;
		const touch = event.touches[0];
		if (touch === void 0) return;
		this.currentX = touch.clientX;
		const deltaX = this.startX - this.currentX;
		const deltaY = Math.abs(touch.clientY - this.startY);
		if (!this.swiping && (Math.abs(deltaX) < MIN_SWIPE || deltaY > Math.abs(deltaX))) return;
		if (!this.swiping && !this.opened && deltaX < 0) return;
		if (!this.swiping) {
			if (this.panel === null || !this.panel.isConnected) this.buildPanel();
			this.positionPanel();
		}
		this.swiping = true;
		event.preventDefault();
		let offset;
		if (this.opened) offset = Math.max(Math.min(-this.panelWidth + deltaX, 0), -this.panelWidth);
		else {
			if (deltaX <= 0) return;
			offset = Math.max(-deltaX, -this.panelWidth);
		}
		this.element.classList.add("rm-mnb-swipe--moving");
		this.element.classList.remove("rm-mnb-swipe--settling");
		this.element.style.setProperty("transform", `translateX(${offset}px)`);
		this.panel?.style.setProperty("clip-path", `inset(0 0 0 ${this.panelWidth - Math.abs(offset)}px)`);
		if (Math.abs(offset) >= this.panelWidth) haptic("light");
	}
	touchEnd() {
		if (!this.swiping) return;
		this.swiping = false;
		const deltaX = this.startX - this.currentX;
		if (this.opened ? deltaX < -this.panelWidth * .3 : deltaX <= this.panelWidth * .4) this.close();
		else this.open();
	}
	open() {
		this.opened = true;
		this.element.classList.add("rm-mnb-swipe--moving", "rm-mnb-swipe--settling");
		this.element.style.setProperty("transform", `translateX(${-this.panelWidth}px)`);
		this.panel?.style.setProperty("clip-path", "inset(0)");
	}
	close() {
		this.opened = false;
		this.element.classList.add("rm-mnb-swipe--settling");
		this.element.style.removeProperty("transform");
		window.setTimeout(() => {
			if (!this.opened) {
				this.element.classList.remove("rm-mnb-swipe--moving", "rm-mnb-swipe--settling");
				this.panel?.classList.remove("is-visible");
				this.panel?.style.removeProperty("clip-path");
			}
		}, 300);
	}
};
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
//#region src/index.ts
/**
* Prefix of the Stimulus identifiers: the one produced by
* stimulus_controller('@romainmillan/mobile-navigation-bundle/<name>'), i.e. by
* rm_mnb_controller('<name>'). registerMobileNavigation() registers the controllers by
* hand under these identifiers, for apps that use neither the Symfony UX controllers.json
* nor AssetMapper.
*/
var IDENTIFIER_PREFIX = "romainmillan--mobile-navigation-bundle--";
var controllers = {
	"confirm-sheet": confirm_sheet_controller_default,
	"confirm-submit": confirm_submit_controller_default,
	"emit-event": emit_event_controller_default,
	"filter-bar": filter_bar_controller_default,
	gesture: gesture_controller_default,
	"large-title": large_title_controller_default,
	list: list_controller_default,
	navigate: navigate_controller_default,
	sheet: sheet_controller_default,
	"swipe-actions": swipe_actions_controller_default,
	"swipe-back": swipe_back_controller_default,
	"tab-bar": tab_bar_controller_default
};
function registerMobileNavigation(application) {
	Object.entries(controllers).forEach(([name, controller]) => {
		application.register(`${IDENTIFIER_PREFIX}${name}`, controller);
	});
}
//#endregion
export { CONFIRM_REQUEST_EVENT, EDITING_CHANGED_EVENT, IDENTIFIER_PREFIX, TOGGLE_EDITING_EVENT, TOGGLE_SELECTING_EVENT, confirmSheetAvailable, controllers, haptic, registerMobileNavigation };
