import { Controller } from '@hotwired/stimulus';

import { haptic } from '../utils/haptic';
import { sameOriginUrl } from '../utils/same_origin';

/**
 * Navigates to `url`: with Turbo when the page has it, with a full page load otherwise.
 * Only same-origin http(s) URLs are followed.
 */
export default class extends Controller {
    static values = {
        url: String,
    };

    declare readonly urlValue: string;

    public visit(): void {
        if (!this.urlValue) {
            return;
        }

        const target = sameOriginUrl(this.urlValue);
        if (target === null) {
            return;
        }

        haptic('light');
        // Never `??`: visit() returns undefined.
        if (window.Turbo) {
            window.Turbo.visit(target.href);
        } else {
            window.location.assign(target.href);
        }
    }
}
