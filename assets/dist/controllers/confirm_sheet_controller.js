import { Controller } from "@hotwired/stimulus";
//#region src/confirm_contract.ts
var CONFIRM_REQUEST_EVENT = "rm-mnb-confirm:request";
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
export { confirm_sheet_controller_default as default };
