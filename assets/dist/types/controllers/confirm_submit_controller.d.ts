import { Controller } from '@hotwired/stimulus';
/**
 * POST form that asks for confirmation before submitting (SheetFormRow). The first
 * submit is held back and goes through the page's ConfirmSheet (otherwise confirm()). Once
 * confirmed, the form is resubmitted via requestSubmit() (hence via Turbo, like the
 * desktop form) and that submission is the only one let through: a double tap does
 * not trigger a second POST.
 */
export default class extends Controller<HTMLFormElement> {
    static values: {
        title: StringConstructor;
        message: StringConstructor;
        confirmLabel: StringConstructor;
    };
    readonly titleValue: string;
    readonly messageValue: string;
    readonly confirmLabelValue: string;
    private confirmed;
    private sent;
    private readonly onSubmit;
    connect(): void;
    disconnect(): void;
    private requestConfirmation;
}
