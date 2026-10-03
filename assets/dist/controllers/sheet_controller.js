import { Controller } from "@hotwired/stimulus";
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
export { sheet_controller_default as default };
