/**
 * The URL resolved against the current page, when it is an http(s) URL of the same
 * origin; null otherwise (malformed, javascript:, data:, another host).
 */
export function sameOriginUrl(url: string): URL | null {
    let target: URL;
    try {
        target = new URL(url, window.location.href);
    } catch {
        return null;
    }

    if (target.protocol !== 'http:' && target.protocol !== 'https:') {
        return null;
    }

    return target.origin === window.location.origin ? target : null;
}

const LOCAL_PATH_MAX = 2048;

/**
 * Same rule as the PHP LocalPath: not empty, at most 2048 characters, starts with "/",
 * starts neither with "//" nor with "/\", no control character nor space. A pathname
 * can start with "//" (https://host//evil.example): it is not local by construction.
 */
export function isLocalPath(value: string): boolean {
    return value.length > 0
        && value.length <= LOCAL_PATH_MAX
        && value.startsWith('/')
        && !value.startsWith('//')
        && !value.startsWith('/\\')
        && !/[\x00-\x20\x7F]/.test(value);
}

/** The current page as a return path, or null when it is not a safe local path. */
export function currentReturnPath(): string | null {
    const value = window.location.pathname + window.location.search;

    return isLocalPath(value) ? value : null;
}
