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
var SELECTING_CLASS = "rm-mnb-list-selecting";
/**
* iOS grouped list: section headers deduplicated after "Load more", and "Select"
* mode. While selecting, a tap checks the row instead of opening it: the row
* is an <a>, so the click is intercepted. The checkboxes belong to the app (its
* StimulusAttributes); the module only checks them and dispatches `change`.
*/
var list_controller_default = class extends Controller {
	static targets = ["section"];
	onClick = (event) => {
		if (!this.element.classList.contains("is-selecting")) return;
		const target = event.target;
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
	connect() {
		this.element.addEventListener("click", this.onClick, true);
		this.element.addEventListener("turbo:frame-load", this.onFrameLoad);
		window.addEventListener(TOGGLE_SELECTING_EVENT, this.onToggleCommand);
		this.dedupeSections();
	}
	disconnect() {
		this.element.removeEventListener("click", this.onClick, true);
		this.element.removeEventListener("turbo:frame-load", this.onFrameLoad);
		window.removeEventListener(TOGGLE_SELECTING_EVENT, this.onToggleCommand);
		document.documentElement.classList.remove(SELECTING_CLASS);
	}
	toggleSelecting() {
		const selecting = this.element.classList.toggle("is-selecting");
		document.documentElement.classList.toggle(SELECTING_CLASS, selecting);
		if (!selecting) this.element.querySelectorAll(".rm-mnb-list-row__select input[type=\"checkbox\"]:checked").forEach((checkbox) => {
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
export { TOGGLE_SELECTING_EVENT, list_controller_default as default };
