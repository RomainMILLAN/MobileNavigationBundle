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
var CONFIRM_REQUEST_EVENT = "rm-mnb-confirm:request";
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
		if (this.element.closest(".is-selecting") !== null) return;
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
export { CONFIRM_REQUEST_EVENT, swipe_actions_controller_default as default };
