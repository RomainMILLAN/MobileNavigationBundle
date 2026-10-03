import { Controller } from "@hotwired/stimulus";
//#region src/confirm_contract.ts
var CONFIRM_REQUEST_EVENT = "rm-mnb-confirm:request";
/** Is the confirmation sheet present and displayable (mobile)? Otherwise: confirm(). */
function confirmSheetAvailable(id = "rm-mnb-confirm") {
	const sheet = document.getElementById(id);
	return sheet !== null && sheet.getClientRects().length > 0;
}
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
export { confirm_submit_controller_default as default };
