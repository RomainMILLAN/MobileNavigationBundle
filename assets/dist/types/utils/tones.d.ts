/**
 * The module's tones: a closed list. Any unknown value falls back to `neutral`, so
 * that no data coming from the app can inject an arbitrary class or color.
 */
export declare const TONES: readonly ["accent", "positive", "negative", "info", "warning", "neutral"];
export type Tone = (typeof TONES)[number];
export declare function toTone(value: unknown): Tone;
