import { Controller } from '@hotwired/stimulus';

import { historyTracker } from '../utils/history_tracker';

/**
 * Back link: goes to the **previous page** when the history tracker proves one in the app
 * (history.go), otherwise lets the link follow its href, the **parent fallback** computed
 * by the server. Modified clicks (new tab, etc.) always follow the href.
 *
 * With `targetLabel` (a translated template holding %label%), the aria-label always says
 * where the click leads: the previous page's name, "previous page" when its name is
 * unknown (after a reload), the parent fallback's label otherwise.
 *
 * The tracker is created with the module, so its turbo:load listener runs before ours.
 * Without Turbo 8 (no restoration state) there is never a target: the href applies.
 */
// Created with the module in a browser (never on import elsewhere: SSR, Node tests).
if (typeof window !== 'undefined') {
    historyTracker();
}

export default class extends Controller<HTMLElement> {
    static values = {
        targetLabel: String,
        previousLabel: String,
        fallbackLabel: String,
    };

    declare readonly targetLabelValue: string;
    declare readonly hasTargetLabelValue: boolean;
    declare readonly previousLabelValue: string;
    declare readonly fallbackLabelValue: string;

    private readonly onPageChange = (): void => this.refreshLabel();

    connect(): void {
        historyTracker().ensureStarted();
        this.refreshLabel();
        // A morph puts the server's aria-label back: it is set again after it.
        document.addEventListener('turbo:morph', this.onPageChange);
        document.addEventListener('turbo:load', this.onPageChange);
    }

    disconnect(): void {
        document.removeEventListener('turbo:morph', this.onPageChange);
        document.removeEventListener('turbo:load', this.onPageChange);
    }

    go(event: MouseEvent): void {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
            return;
        }
        const tracker = historyTracker();
        // Never a second navigation while going back.
        if (tracker.isGoingBack()) {
            event.preventDefault();
            return;
        }
        const target = tracker.target();
        if (target === null) {
            return;
        }
        if (tracker.goBack(target) !== 'refused') {
            event.preventDefault();
        }
    }

    private refreshLabel(): void {
        if (!this.hasTargetLabelValue) {
            return;
        }
        const title = historyTracker().target()?.entry.title;
        let label: string;
        if (title === undefined) {
            label = this.fallbackLabelValue;
        } else if (title === '') {
            label = this.previousLabelValue;
        } else {
            // Never String.replace with a string: the $& of an account name would be interpreted.
            label = this.targetLabelValue.split('%label%').join(title);
        }
        if (label !== '') {
            this.element.setAttribute('aria-label', label);
        }
    }
}
