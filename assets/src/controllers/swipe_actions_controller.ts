import { Controller } from '@hotwired/stimulus';

import { CONFIRM_REQUEST_EVENT, type ConfirmRequestDetail } from '../confirm_contract';
import { haptic } from '../utils/haptic';
import { sameOriginUrl } from '../utils/same_origin';
import { toTone } from '../utils/tones';

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

const BUTTON_WIDTH = 72;
const MIN_SWIPE = 10;

/**
 * Swiping a row to the left reveals its actions, each with its label. A
 * destructive action is not sent directly: it goes through the confirmation sheet.
 * The panel lives in <body> (it must stay under the sliding row) and is removed
 * before every Turbo snapshot.
 */
export default class extends Controller<HTMLElement> {
    static values = {
        actions: Array,
        csrfToken: String,
    };

    declare readonly actionsValue: SwipeAction[];

    /** Only the actions that target the current origin: any other is ignored. */
    private get actions(): SwipeAction[] {
        return this.actionsValue.filter((action) => sameOriginUrl(action.url) !== null);
    }
    declare readonly csrfTokenValue: string;

    private startX = 0;
    private startY = 0;
    private currentX = 0;
    private swiping = false;
    private opened = false;
    private panel: HTMLDivElement | null = null;
    private panelWidth = 0;
    private panelLeft = 0;
    private panelTop = 0;

    private readonly onTouchStart = (event: TouchEvent): void => this.touchStart(event);
    private readonly onTouchMove = (event: TouchEvent): void => this.touchMove(event);
    private readonly onTouchEnd = (): void => this.touchEnd();
    private readonly onDocumentTouch = (event: TouchEvent): void => {
        const target = event.target as Node;
        if (this.opened && !this.element.contains(target) && !this.panel?.contains(target)) {
            this.close();
        }
    };
    private readonly onBeforeCache = (): void => this.reset();

    connect(): void {
        if (this.actions.length === 0) {
            return;
        }

        this.panelWidth = this.actions.length * BUTTON_WIDTH;
        this.element.addEventListener('touchstart', this.onTouchStart, { passive: true });
        this.element.addEventListener('touchmove', this.onTouchMove, { passive: false });
        this.element.addEventListener('touchend', this.onTouchEnd, { passive: true });
        document.addEventListener('turbo:before-cache', this.onBeforeCache);
        this.buildPanel();
    }

    disconnect(): void {
        this.element.removeEventListener('touchstart', this.onTouchStart);
        this.element.removeEventListener('touchmove', this.onTouchMove);
        this.element.removeEventListener('touchend', this.onTouchEnd);
        document.removeEventListener('touchstart', this.onDocumentTouch, true);
        document.removeEventListener('turbo:before-cache', this.onBeforeCache);
        this.reset();
    }

    private reset(): void {
        this.panel?.remove();
        this.panel = null;
        this.opened = false;
        this.element.classList.remove('rm-mnb-swipe--moving', 'rm-mnb-swipe--settling');
        this.element.style.removeProperty('transform');
    }

    private buildPanel(): void {
        this.panel = document.createElement('div');
        this.panel.className = 'rm-mnb-swipe-actions';
        // Never in the snapshot Turbo caches.
        this.panel.setAttribute('data-turbo-temporary', '');
        this.panel.style.setProperty('width', `${this.panelWidth}px`);
        this.actions.forEach((action) => this.panel?.appendChild(this.createButton(action)));
        document.body.appendChild(this.panel);
    }

    private createContent(action: SwipeAction, button: HTMLElement): void {
        const icon = document.createElement('i');
        icon.className = action.icon;
        icon.setAttribute('aria-hidden', 'true');
        const label = document.createElement('span');
        label.className = 'rm-mnb-swipe-actions__label';
        label.textContent = action.label;
        button.append(icon, label);
        button.setAttribute('aria-label', action.label);
        button.className = `rm-mnb-swipe-actions__button rm-mnb-tone--${toTone(action.tone)}`;
    }

    private hiddenInput(name: string, value: string): HTMLInputElement {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = value;

        return input;
    }

    private createButton(action: SwipeAction): HTMLElement {
        if (action.method === undefined || action.method.toUpperCase() === 'GET') {
            const link = document.createElement('a');
            link.href = action.url;
            this.createContent(action, link);

            return link;
        }

        const form = document.createElement('form');
        form.method = 'POST';
        form.action = action.url;
        form.className = 'rm-mnb-swipe-actions__form';
        form.appendChild(this.hiddenInput('_token', this.csrfTokenValue));
        // The panel survives Turbo navigations: the return URL is read at submit time.
        const redirect = this.hiddenInput('_redirect', '');
        form.appendChild(redirect);

        const submit = (): void => {
            redirect.value = window.location.pathname + window.location.search;
            form.submit();
        };

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            if (action.confirm === undefined) {
                submit();
                return;
            }
            this.close();
            window.dispatchEvent(new CustomEvent<ConfirmRequestDetail>(CONFIRM_REQUEST_EVENT, {
                detail: { title: action.label, message: action.confirm, confirmLabel: action.label, onConfirm: submit },
            }));
        });

        const button = document.createElement('button');
        button.type = 'submit';
        this.createContent(action, button);
        form.appendChild(button);

        return form;
    }

    private positionPanel(): void {
        if (this.panel === null) {
            return;
        }
        // The position is measured only when the row is closed, in its original place.
        if (!this.opened) {
            const rect = this.element.getBoundingClientRect();
            this.panelLeft = rect.right - this.panelWidth;
            this.panelTop = rect.top;
            this.panel.style.setProperty('height', `${rect.height}px`);
        }
        this.panel.style.setProperty('top', `${this.panelTop}px`);
        this.panel.style.setProperty('left', `${this.panelLeft}px`);
        this.panel.classList.add('is-visible');
    }

    private touchStart(event: TouchEvent): void {
        const touch = event.touches[0];
        if (touch === undefined) {
            return;
        }
        this.startX = touch.clientX;
        this.startY = touch.clientY;
        this.currentX = this.startX;
        this.swiping = false;
        document.addEventListener('touchstart', this.onDocumentTouch, { once: true, capture: true });
    }

    private touchMove(event: TouchEvent): void {
        // In selection mode the row gets checked, in edit mode it gets dragged: it does not slide.
        if (this.element.closest('.is-selecting, .is-editing') !== null) {
            return;
        }

        const touch = event.touches[0];
        if (touch === undefined) {
            return;
        }
        this.currentX = touch.clientX;
        const deltaX = this.startX - this.currentX;
        const deltaY = Math.abs(touch.clientY - this.startY);

        if (!this.swiping && (Math.abs(deltaX) < MIN_SWIPE || deltaY > Math.abs(deltaX))) {
            return;
        }
        // Closed row swiped to the right: the gesture is not for it (swipe back,
        // scrolling); it does not capture it.
        if (!this.swiping && !this.opened && deltaX < 0) {
            return;
        }
        if (!this.swiping) {
            // Turbo may have removed the panel (turbo:before-cache, including when a filter
            // updates the URL without leaving the page): it is rebuilt as needed.
            if (this.panel === null || !this.panel.isConnected) {
                this.buildPanel();
            }
            this.positionPanel();
        }

        this.swiping = true;
        event.preventDefault();

        let offset: number;
        if (this.opened) {
            offset = Math.max(Math.min(-this.panelWidth + deltaX, 0), -this.panelWidth);
        } else {
            if (deltaX <= 0) {
                return;
            }
            offset = Math.max(-deltaX, -this.panelWidth);
        }

        this.element.classList.add('rm-mnb-swipe--moving');
        this.element.classList.remove('rm-mnb-swipe--settling');
        this.element.style.setProperty('transform', `translateX(${offset}px)`);
        this.panel?.style.setProperty('clip-path', `inset(0 0 0 ${this.panelWidth - Math.abs(offset)}px)`);

        if (Math.abs(offset) >= this.panelWidth) {
            haptic('light');
        }
    }

    private touchEnd(): void {
        if (!this.swiping) {
            return;
        }
        this.swiping = false;
        const deltaX = this.startX - this.currentX;

        if (this.opened ? deltaX < -this.panelWidth * 0.3 : deltaX <= this.panelWidth * 0.4) {
            this.close();
        } else {
            this.open();
        }
    }

    private open(): void {
        this.opened = true;
        this.element.classList.add('rm-mnb-swipe--moving', 'rm-mnb-swipe--settling');
        this.element.style.setProperty('transform', `translateX(${-this.panelWidth}px)`);
        this.panel?.style.setProperty('clip-path', 'inset(0)');
    }

    private close(): void {
        this.opened = false;
        this.element.classList.add('rm-mnb-swipe--settling');
        this.element.style.removeProperty('transform');
        window.setTimeout(() => {
            if (!this.opened) {
                this.element.classList.remove('rm-mnb-swipe--moving', 'rm-mnb-swipe--settling');
                this.panel?.classList.remove('is-visible');
                this.panel?.style.removeProperty('clip-path');
            }
        }, 300);
    }
}
