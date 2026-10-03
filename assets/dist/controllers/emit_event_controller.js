import { Controller } from "@hotwired/stimulus";
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
export { emit_event_controller_default as default };
