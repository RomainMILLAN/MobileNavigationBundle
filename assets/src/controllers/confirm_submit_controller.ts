import { Controller } from '@hotwired/stimulus';

import { CONFIRM_REQUEST_EVENT, confirmSheetAvailable, type ConfirmRequestDetail } from '../confirm_contract';

/**
 * POST form that asks for confirmation before submitting (SheetFormRow). The first
 * submit is held back and goes through the page's ConfirmSheet (otherwise confirm()). Once
 * confirmed, the form is resubmitted via requestSubmit() (hence via Turbo, like the
 * desktop form) and that submission is the only one let through: a double tap does
 * not trigger a second POST.
 */
export default class extends Controller<HTMLFormElement> {
    static values = { title: String, message: String, confirmLabel: String };

    declare readonly titleValue: string;
    declare readonly messageValue: string;
    declare readonly confirmLabelValue: string;

    private confirmed = false;
    private sent = false;

    private readonly onSubmit = (event: SubmitEvent): void => {
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

    connect(): void {
        this.element.addEventListener('submit', this.onSubmit);
    }

    disconnect(): void {
        this.element.removeEventListener('submit', this.onSubmit);
    }

    private requestConfirmation(): void {
        const proceed = (): void => {
            this.confirmed = true;
            this.element.requestSubmit();
        };

        if (!confirmSheetAvailable()) {
            if (window.confirm(this.messageValue)) {
                proceed();
            }
            return;
        }

        window.dispatchEvent(new CustomEvent<ConfirmRequestDetail>(CONFIRM_REQUEST_EVENT, {
            detail: {
                title: this.titleValue,
                message: this.messageValue,
                confirmLabel: this.confirmLabelValue,
                onConfirm: proceed,
            },
        }));
    }
}
