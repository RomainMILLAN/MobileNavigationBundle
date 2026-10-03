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
//#endregion
export { navigate_controller_default as default };
