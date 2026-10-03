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
