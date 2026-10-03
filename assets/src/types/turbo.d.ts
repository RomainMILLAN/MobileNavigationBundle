/**
 * The part of Turbo the bundle uses, read from window.Turbo at run time: Turbo is an
 * optional peer dependency and is never imported.
 */
export {};

declare global {
    interface TurboSession {
        view: {
            snapshotCache: {
                get(location: URL): unknown;
            };
        };
    }

    interface Window {
        Turbo?: {
            visit(url: string): void;
            session?: TurboSession;
        };
    }
}
