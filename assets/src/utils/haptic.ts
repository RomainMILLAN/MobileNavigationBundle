export function haptic(style: 'light' | 'medium' | 'heavy' = 'light'): void {
    if (!navigator.vibrate) return;
    const durations = { light: 10, medium: 20, heavy: 30 };
    navigator.vibrate(durations[style]);
}
