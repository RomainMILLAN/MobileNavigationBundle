import { type BackTarget, type HistoryEntry } from './history_stack';
/**
 * One history tracker per page, shared by every controller that needs it. Each dist
 * controller is built on its own (no shared chunk) and carries its own copy of this module:
 * the instance lives under a global, versioned key. ANY change to this API ⇒ a new key
 * (two builds may coexist, served by a service worker cache).
 *
 * Creation only installs the listeners. Starting is lazy: the module is evaluated before
 * Turbo starts (history.state may still be empty or stale), and with deferred scripts the
 * initial turbo:load only comes at readyState "complete", after the controllers connect.
 * So it starts at the first connect() or the first turbo:load, when history.state and the
 * DOM name the same page — never on turbo:visit (on a restore, history.state is already the
 * destination; a frame `advance` pushes before its turbo:visit).
 */
export type GoBackResult = 'navigating' | 'busy' | 'refused';
export interface HistoryTracker {
    ensureStarted(): void;
    target(): BackTarget | null;
    goBack(target: BackTarget): GoBackResult;
    isGoingBack(): boolean;
    restoredEntry(): HistoryEntry | null;
}
export declare function historyTracker(): HistoryTracker;
/**
 * A new tracker, outside the shared instance: for tests, whose `signal` removes its
 * listeners. Code uses historyTracker().
 */
export declare function createHistoryTracker(signal?: AbortSignal): HistoryTracker;
