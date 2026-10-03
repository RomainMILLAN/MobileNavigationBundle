import { Controller } from "@hotwired/stimulus";
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
export { filter_bar_controller_default as default };
