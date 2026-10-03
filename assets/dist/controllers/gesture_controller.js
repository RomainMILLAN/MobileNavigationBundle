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
//#region src/controllers/gesture_controller.ts
var EVENT_PREFIX = "rm-mnb-gesture";
var gesture_controller_default = class extends Controller {
	static values = {
		doubleTapMs: {
			type: Number,
			default: 280
		},
		longPressMs: {
			type: Number,
			default: 500
		},
		swipeDistance: {
			type: Number,
			default: 30
		}
	};
	lastTapTime = 0;
	singleTapTimer = null;
	longPressTimer = null;
	longPressTriggered = false;
	startX = 0;
	startY = 0;
	moved = false;
	disconnect() {
		this.cancelLongPress();
		this.cancelSingleTap();
	}
	start(event) {
		const touch = event.touches[0];
		if (touch === void 0) return;
		this.startX = touch.clientX;
		this.startY = touch.clientY;
		this.moved = false;
		this.longPressTriggered = false;
		this.longPressTimer = setTimeout(() => {
			this.longPressTriggered = true;
			haptic("medium");
		}, this.longPressMsValue);
	}
	move(event) {
		const touch = event.touches[0];
		if (touch === void 0) return;
		if (Math.abs(touch.clientX - this.startX) > 10 || Math.abs(touch.clientY - this.startY) > 10) {
			this.moved = true;
			this.cancelLongPress();
		}
	}
	end(event) {
		this.cancelLongPress();
		const touch = event.changedTouches[0];
		const deltaX = (touch ? touch.clientX : this.startX) - this.startX;
		const deltaY = (touch ? touch.clientY : this.startY) - this.startY;
		if (this.longPressTriggered) {
			this.suppress(event);
			this.cancelSingleTap();
			this.lastTapTime = 0;
			this.dispatch("longpress", { prefix: EVENT_PREFIX });
			return;
		}
		if (Math.abs(deltaY) > this.swipeDistanceValue && Math.abs(deltaY) > Math.abs(deltaX)) {
			this.cancelSingleTap();
			this.lastTapTime = 0;
			this.dispatch("swipe", {
				prefix: EVENT_PREFIX,
				detail: { direction: deltaY < 0 ? "up" : "down" }
			});
			return;
		}
		if (this.moved) return;
		this.suppress(event);
		const now = Date.now();
		if (this.singleTapTimer && now - this.lastTapTime < this.doubleTapMsValue) {
			this.cancelSingleTap();
			this.lastTapTime = 0;
			this.dispatch("doubletap", { prefix: EVENT_PREFIX });
			return;
		}
		this.lastTapTime = now;
		this.singleTapTimer = setTimeout(() => {
			this.singleTapTimer = null;
			this.lastTapTime = 0;
			this.dispatch("tap", { prefix: EVENT_PREFIX });
		}, this.doubleTapMsValue);
	}
	preventContextMenu(event) {
		event.preventDefault();
	}
	replayNative() {
		this.element.click();
	}
	suppress(event) {
		event.preventDefault();
		event.stopImmediatePropagation();
	}
	cancelLongPress() {
		if (this.longPressTimer) {
			clearTimeout(this.longPressTimer);
			this.longPressTimer = null;
		}
	}
	cancelSingleTap() {
		if (this.singleTapTimer) {
			clearTimeout(this.singleTapTimer);
			this.singleTapTimer = null;
		}
	}
};
//#endregion
export { gesture_controller_default as default };
