/**
 * @vitest-environment jsdom
 */
import { Application } from '@hotwired/stimulus';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import type { BackTarget } from '../src/utils/history_stack';
import type { GoBackResult } from '../src/utils/history_tracker';

// The gesture only: the tracker has its own tests.
const fake = vi.hoisted(() => ({
    target: null as BackTarget | null,
    goBack: vi.fn<(target: BackTarget) => GoBackResult>(),
}));

vi.mock('../src/utils/history_tracker', () => ({
    historyTracker: () => ({
        ensureStarted: () => undefined,
        target: () => fake.target,
        goBack: fake.goBack,
        isGoingBack: () => false,
        restoredEntry: () => null,
    }),
}));

const { default: SwipeBackController } = await import('../src/controllers/swipe_back_controller');

const SETTLE = 400;

const touch = (type: string, clientX: number): void => {
    const event = new Event(type, { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'touches', { value: type === 'touchend' || type === 'touchcancel' ? [] : [{ clientX, clientY: 100 }] });
    document.querySelector('.rm-mnb-scroller')!.dispatchEvent(event);
};
/** A drag from the left edge far enough to commit. */
const drag = (): void => {
    touch('touchstart', 5);
    touch('touchmove', 60);
    touch('touchmove', 300);
};

beforeAll(() => {
    window.Turbo = { visit: vi.fn(), session: { view: { snapshotCache: { get: () => undefined } } } } as unknown as typeof window.Turbo;
    Application.start().register('swipe-back', SwipeBackController);
});

beforeEach(async () => {
    fake.target = { steps: 1, entry: { id: 'a', index: 0, url: 'http://localhost:3000/account', scroll: 0, title: 'Compte' } };
    fake.goBack.mockReset().mockReturnValue('navigating');
    // Left by a successful going back; the (mocked) tracker would remove it on turbo:load.
    document.documentElement.classList.remove('rm-mnb-restoring');
    document.body.innerHTML = '<div class="rm-mnb-scroller" data-controller="swipe-back" data-swipe-back-require-standalone-value="false"></div>';
    await new Promise((resolve) => setTimeout(resolve, 0));
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
});

describe('swipe back', () => {
    it('goes back once the drag is released far enough', () => {
        drag();
        touch('touchend', 300);
        vi.advanceTimersByTime(SETTLE);

        expect(fake.goBack).toHaveBeenCalledOnce();
    });

    it('never navigates on a system cancellation', () => {
        drag();
        touch('touchcancel', 300);
        vi.advanceTimersByTime(SETTLE);

        expect(fake.goBack).not.toHaveBeenCalled();
        expect(document.querySelector('.rm-mnb-back-underlay')).toBeNull();
    });

    it('does not go back again when the history moved during the gesture', () => {
        drag();
        window.dispatchEvent(new PopStateEvent('popstate'));
        touch('touchend', 300);
        vi.advanceTimersByTime(SETTLE);

        expect(fake.goBack).not.toHaveBeenCalled();
        expect(document.querySelector('.rm-mnb-back-underlay')).toBeNull();
    });

    it('puts the page back when going back is refused', () => {
        fake.goBack.mockReturnValue('refused');
        drag();
        touch('touchend', 300);
        vi.advanceTimersByTime(SETTLE);

        expect(document.querySelector('.rm-mnb-back-underlay')).toBeNull();
        expect(document.documentElement.classList.contains('rm-mnb-restoring')).toBe(false);
    });

    it('does not start without a previous page', () => {
        fake.target = null;
        drag();

        expect(document.querySelector('.rm-mnb-back-underlay')).toBeNull();
    });
});
