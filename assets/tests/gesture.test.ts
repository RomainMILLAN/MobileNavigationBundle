/**
 * @vitest-environment jsdom
 */
import { Application } from '@hotwired/stimulus';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import GestureController from '../src/controllers/gesture_controller';

function touch(type: string, x = 10, y = 10): TouchEvent {
    const point = { clientX: x, clientY: y } as Touch;
    const event = new Event(type, { bubbles: true, cancelable: true }) as TouchEvent;
    Object.defineProperty(event, 'touches', { value: type === 'touchend' ? [] : [point] });
    Object.defineProperty(event, 'changedTouches', { value: [point] });

    return event;
}

async function mount(attributes = ''): Promise<{ app: Application; element: HTMLElement }> {
    document.body.innerHTML = `<div data-controller="gesture" ${attributes}
        data-action="touchstart->gesture#start touchmove->gesture#move touchend->gesture#end contextmenu->gesture#preventContextMenu"></div>`;
    const app = Application.start();
    app.register('gesture', GestureController);
    await Promise.resolve();

    return { app, element: document.querySelector<HTMLElement>('[data-controller]')! };
}

describe('gesture controller', () => {
    let app: Application;

    beforeEach(() => vi.useFakeTimers());
    afterEach(() => {
        app?.stop();
        vi.useRealTimers();
        document.body.innerHTML = '';
    });

    it('emits tap immediately and lets the native click through without double tap', async () => {
        const mounted = await mount();
        app = mounted.app;
        const taps = vi.fn();
        mounted.element.addEventListener('rm-mnb-gesture:tap', taps);

        mounted.element.dispatchEvent(touch('touchstart'));
        const end = touch('touchend');
        mounted.element.dispatchEvent(end);

        expect(taps).toHaveBeenCalledTimes(1);
        expect(end.defaultPrevented).toBe(false);
    });

    it('waits for a second tap when double tap is on', async () => {
        const mounted = await mount('data-gesture-double-tap-value="true"');
        app = mounted.app;
        const taps = vi.fn();
        const doubles = vi.fn();
        mounted.element.addEventListener('rm-mnb-gesture:tap', taps);
        mounted.element.addEventListener('rm-mnb-gesture:doubletap', doubles);

        mounted.element.dispatchEvent(touch('touchstart'));
        mounted.element.dispatchEvent(touch('touchend'));
        expect(taps).not.toHaveBeenCalled();
        mounted.element.dispatchEvent(touch('touchstart'));
        mounted.element.dispatchEvent(touch('touchend'));

        expect(doubles).toHaveBeenCalledTimes(1);
        vi.runAllTimers();
        expect(taps).not.toHaveBeenCalled();
    });

    it('turns a context menu outside a touch into a longpress', async () => {
        const mounted = await mount();
        app = mounted.app;
        const presses = vi.fn();
        mounted.element.addEventListener('rm-mnb-gesture:longpress', presses);

        const menu = new Event('contextmenu', { bubbles: true, cancelable: true });
        mounted.element.dispatchEvent(menu);

        expect(menu.defaultPrevented).toBe(true);
        expect(presses).toHaveBeenCalledTimes(1);
    });

    it('does not double the longpress when a touch also fires contextmenu', async () => {
        const mounted = await mount();
        app = mounted.app;
        const presses = vi.fn();
        mounted.element.addEventListener('rm-mnb-gesture:longpress', presses);

        mounted.element.dispatchEvent(touch('touchstart'));
        vi.advanceTimersByTime(600);
        mounted.element.dispatchEvent(new Event('contextmenu', { bubbles: true, cancelable: true }));
        mounted.element.dispatchEvent(touch('touchend'));

        expect(presses).toHaveBeenCalledTimes(1);
    });
});
