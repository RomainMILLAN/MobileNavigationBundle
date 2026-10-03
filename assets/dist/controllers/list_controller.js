import { Controller } from "@hotwired/stimulus";
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
export { EDITING_CHANGED_EVENT, TOGGLE_EDITING_EVENT, TOGGLE_SELECTING_EVENT, list_controller_default as default };
