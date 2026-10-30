/**
 * The URL resolved against the current page, when it is an http(s) URL of the same
 * origin; null otherwise (malformed, javascript:, data:, another host).
 */
export declare function sameOriginUrl(url: string): URL | null;
/**
 * Same rule as the PHP LocalPath: not empty, at most 2048 characters, starts with "/",
 * starts neither with "//" nor with "/\", no control character nor space. A pathname
 * can start with "//" (https://host//evil.example): it is not local by construction.
 */
export declare function isLocalPath(value: string): boolean;
/** The current page as a return path, or null when it is not a safe local path. */
export declare function currentReturnPath(): string | null;
