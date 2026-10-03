/**
 * The module's tones: a closed list. Any unknown value falls back to `neutral`, so
 * that no data coming from the app can inject an arbitrary class or color.
 */
export const TONES = ['accent', 'positive', 'negative', 'info', 'warning', 'neutral'] as const;

export type Tone = (typeof TONES)[number];

export function toTone(value: unknown): Tone {
    return typeof value === 'string' && (TONES as readonly string[]).includes(value) ? (value as Tone) : 'neutral';
}
