<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Model;

/**
 * The closed list of tones a chip, a value, a badge or a swipe action can take.
 *
 * Same list as assets/src/utils/tones.ts and $rm-mnb-tones (assets/styles/_tokens.scss):
 * NamingConsistencyTest keeps them in sync.
 *
 * An unknown prop KEY fails loudly, an unknown tone VALUE falls back to neutral: the
 * fallback keeps the historical template behaviour and never lets app data inject an
 * arbitrary CSS class.
 */
enum Tone: string
{
    case Accent = 'accent';
    case Positive = 'positive';
    case Negative = 'negative';
    case Info = 'info';
    case Warning = 'warning';
    case Neutral = 'neutral';

    public static function createFromLooseValue(self|string|null $value): self
    {
        if ($value instanceof self) {
            return $value;
        }

        return null === $value ? self::Neutral : (self::tryFrom($value) ?? self::Neutral);
    }
}
