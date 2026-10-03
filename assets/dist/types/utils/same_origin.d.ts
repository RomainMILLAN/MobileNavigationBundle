/**
 * The URL resolved against the current page, when it is an http(s) URL of the same
 * origin; null otherwise (malformed, javascript:, data:, another host).
 */
export declare function sameOriginUrl(url: string): URL | null;
