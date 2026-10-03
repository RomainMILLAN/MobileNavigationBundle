/**
 * The bundle's confirmation contract: any building block (swipe, action sheet, app) that
 * wants a confirmation dispatches CONFIRM_REQUEST_EVENT on window; the page's ConfirmSheet
 * receives it, sets the texts via textContent and only calls onConfirm after the
 * tap on the destructive button.
 */
export interface ConfirmRequestDetail {
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
}

export const CONFIRM_REQUEST_EVENT = 'rm-mnb-confirm:request';

/** Is the confirmation sheet present and displayable (mobile)? Otherwise: confirm(). */
export function confirmSheetAvailable(id = 'rm-mnb-confirm'): boolean {
    const sheet = document.getElementById(id);

    return sheet !== null && sheet.getClientRects().length > 0;
}
