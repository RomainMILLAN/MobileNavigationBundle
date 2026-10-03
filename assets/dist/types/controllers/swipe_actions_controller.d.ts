import { Controller } from '@hotwired/stimulus';
/**
 * Action revealed by swiping a row to the left. The server builds and
 * translates it: the module only receives text, never a translation key.
 */
export interface SwipeAction {
    url: string;
    icon: string;
    tone: string;
    label: string;
    method?: string;
    /** Present on every destructive action: the confirmation sheet's message. */
    confirm?: string;
}
/** Confirmation request, handled by the module's confirm-sheet controller. */
export interface ConfirmRequestDetail {
    title: string;
    message: string;
    confirmLabel: string;
    onConfirm: () => void;
}
export declare const CONFIRM_REQUEST_EVENT = "rm-mnb-confirm:request";
/**
 * Swiping a row to the left reveals its actions, each with its label. A
 * destructive action is not sent directly: it goes through the confirmation sheet.
 * The panel lives in <body> (it must stay under the sliding row) and is removed
 * before every Turbo snapshot.
 */
export default class extends Controller<HTMLElement> {
    static values: {
        actions: ArrayConstructor;
        csrfToken: StringConstructor;
    };
    readonly actionsValue: SwipeAction[];
    /** Only the actions that target the current origin: any other is ignored. */
    private get actions();
    readonly csrfTokenValue: string;
    private startX;
    private startY;
    private currentX;
    private swiping;
    private opened;
    private panel;
    private panelWidth;
    private panelLeft;
    private panelTop;
    private readonly onTouchStart;
    private readonly onTouchMove;
    private readonly onTouchEnd;
    private readonly onDocumentTouch;
    private readonly onBeforeCache;
    connect(): void;
    disconnect(): void;
    private reset;
    private buildPanel;
    private createContent;
    private hiddenInput;
    private createButton;
    private positionPanel;
    private touchStart;
    private touchMove;
    private touchEnd;
    private open;
    private close;
}
