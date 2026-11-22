import { Controller } from "@hotwired/stimulus";
// src/controllers/list_controller.ts
var TOGGLE_SELECTING_EVENT = "rm-mnb-list:toggle-selecting";
var TOGGLE_EDITING_EVENT = "rm-mnb-list:toggle-editing";
// src/utils/haptic.ts
function haptic(style = "light") {
	if (!navigator.vibrate) return;
	navigator.vibrate({
		light: 10,
		medium: 20,
		heavy: 30
	}[style]);
}
// src/utils/same_origin.ts
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
var LOCAL_PATH_MAX = 2048;
/**
* Same rule as the PHP LocalPath: not empty, at most 2048 characters, starts with "/",
* starts neither with "//" nor with "/\", no control character nor space. A pathname
* can start with "//" (https://host//evil.example): it is not local by construction.
*/
function isLocalPath(value) {
	return value.length > 0 && value.length <= LOCAL_PATH_MAX && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\") && !/[\x00-\x20\x7F]/.test(value);
}
/** The current page as a return path, or null when it is not a safe local path. */
function currentReturnPath() {
	const value = window.location.pathname + window.location.search;
	return isLocalPath(value) ? value : null;
}
// src/controllers/swipe_actions_controller.ts
/**
* Swipe actions: the content and its actions panel sit side by side in a horizontal
* scroll-snap track, rendered server side. The browser does the gesture (momentum,
* snapping, chaining to the page): there is no touch code here. The controller only
* keeps the state that the scroll position implies.
*
* - The "Actions" button reveals or hides the panel without the gesture (keyboard,
*   screen reader, voice control, mouse): aria-expanded follows the panel.
* - Hidden actions are out of the tab order; revealed ones are in it.
* - One row open at a time; a tap outside, Esc, a list mode or a Turbo snapshot closes it.
* - A writing action fills its `_redirect` field at submit time (the URL may have changed
*   since the render: a filter rewrites it in place), goes out once (a double tap sends a
*   single POST; a failed Turbo submission can be retried) and closes the row. A link
*   marked carriesReturnPath gets `_redirect` on click.
*
* The panel listens in the bubble phase: a destructive action's confirm-submit, on the
* form, has already held its first submit back (defaultPrevented) to ask first.
*/
var OPENED_EVENT = "rm-mnb:swipe-opened";
var swipe_actions_controller_default = class extends Controller {
	static targets = [
		"track",
		"panel",
		"toggle"
	];
	opened = false;
	frame = 0;
	onScroll = () => {
		cancelAnimationFrame(this.frame);
		this.frame = requestAnimationFrame(() => this.sync());
	};
	onOtherOpened = (event) => {
		if (event.detail?.element !== this.element) this.close(false);
	};
	onDocumentPointer = (event) => {
		if (this.opened && !this.element.contains(event.target)) this.close();
	};
	onKeydown = (event) => {
		if (event.key !== "Escape" || !this.opened || event.defaultPrevented) return;
		event.preventDefault();
		this.close();
		if (this.hasToggleTarget) this.toggleTarget.focus({ preventScroll: true });
	};
	onFocusIn = (event) => {
		const target = event.target;
		if (this.opened && !this.panelTarget.contains(target) && target !== this.toggleTargetOrNull() && target.matches(":focus-visible")) this.close();
	};
	sent = /* @__PURE__ */ new WeakSet();
	onSubmit = (event) => {
		const form = event.target;
		if (event.defaultPrevented) return;
		if (this.sent.has(form)) {
			event.preventDefault();
			return;
		}
		this.sent.add(form);
		const redirect = form.elements.namedItem("_redirect");
		if (redirect instanceof HTMLInputElement) redirect.value = currentReturnPath() ?? "";
		this.close(false);
	};
	onSubmitEnd = (event) => {
		if (!event.detail?.success) this.sent.delete(event.target);
	};
	onReset = () => this.close(false);
	connect() {
		if (!this.hasTrackTarget) return;
		this.trackTarget.addEventListener("scroll", this.onScroll, { passive: true });
		this.element.addEventListener("keydown", this.onKeydown);
		this.element.addEventListener("focusin", this.onFocusIn);
		this.panelTarget.addEventListener("submit", this.onSubmit);
		this.panelTarget.addEventListener("turbo:submit-end", this.onSubmitEnd);
		window.addEventListener(OPENED_EVENT, this.onOtherOpened);
		window.addEventListener(TOGGLE_SELECTING_EVENT, this.onReset);
		window.addEventListener(TOGGLE_EDITING_EVENT, this.onReset);
		document.addEventListener("turbo:before-cache", this.onReset);
		if (this.hasToggleTarget) this.toggleTarget.hidden = false;
		this.sync();
	}
	disconnect() {
		if (!this.hasTrackTarget) return;
		cancelAnimationFrame(this.frame);
		this.trackTarget.removeEventListener("scroll", this.onScroll);
		this.element.removeEventListener("keydown", this.onKeydown);
		this.element.removeEventListener("focusin", this.onFocusIn);
		this.panelTarget.removeEventListener("submit", this.onSubmit);
		this.panelTarget.removeEventListener("turbo:submit-end", this.onSubmitEnd);
		window.removeEventListener(OPENED_EVENT, this.onOtherOpened);
		window.removeEventListener(TOGGLE_SELECTING_EVENT, this.onReset);
		window.removeEventListener(TOGGLE_EDITING_EVENT, this.onReset);
		document.removeEventListener("turbo:before-cache", this.onReset);
		document.removeEventListener("pointerdown", this.onDocumentPointer, true);
	}
	/** The "Actions" button. */
	toggle() {
		if (this.opened) {
			this.close();
			return;
		}
		this.setOpened(true);
		this.actions()[0]?.focus({ preventScroll: true });
		this.open();
	}
	/** Click on a link marked carriesReturnPath: it takes the current path along. */
	carryReturnPath(event) {
		const link = event.currentTarget;
		const target = sameOriginUrl(link.href);
		const returnPath = currentReturnPath();
		if (target !== null && returnPath !== null && !target.searchParams.has("_redirect")) {
			target.searchParams.set("_redirect", returnPath);
			link.href = target.href;
		}
	}
	open() {
		this.scrollTo(this.trackTarget.scrollWidth - this.trackTarget.clientWidth, true);
		this.setOpened(true);
	}
	close(animate = true) {
		if (!this.hasTrackTarget) return;
		this.scrollTo(0, animate);
		this.setOpened(false);
	}
	scrollTo(left, animate) {
		const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
		if (typeof this.trackTarget.scrollTo === "function") this.trackTarget.scrollTo({
			left,
			behavior: animate && !reduce ? "smooth" : "instant"
		});
		else this.trackTarget.scrollLeft = left;
	}
	/** The scroll position is the truth: a swipe opens or closes the panel by itself. */
	sync() {
		const max = this.trackTarget.scrollWidth - this.trackTarget.clientWidth;
		if (max <= 0) {
			this.setOpened(false);
			return;
		}
		if (Math.abs(this.trackTarget.scrollLeft) >= max - 1) this.setOpened(true);
		else if (Math.abs(this.trackTarget.scrollLeft) <= 1) this.setOpened(false);
	}
	setOpened(opened) {
		const changed = opened !== this.opened;
		this.opened = opened;
		this.toggleTargetOrNull()?.setAttribute("aria-expanded", String(opened));
		this.actions().forEach((action) => action.setAttribute("tabindex", opened ? "0" : "-1"));
		if (!changed) return;
		if (opened) {
			haptic("light");
			window.dispatchEvent(new CustomEvent(OPENED_EVENT, { detail: { element: this.element } }));
			document.addEventListener("pointerdown", this.onDocumentPointer, true);
		} else document.removeEventListener("pointerdown", this.onDocumentPointer, true);
	}
	actions() {
		return Array.from(this.panelTarget.querySelectorAll("a[href], button"));
	}
	toggleTargetOrNull() {
		return this.hasToggleTarget ? this.toggleTarget : null;
	}
};
export { swipe_actions_controller_default as default };
