<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Twig\Component;

use RomainMillan\MobileNavigation\Model\Tone;
use RomainMillan\MobileNavigation\Model\ValueAttributes;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PreMount;

/**
 * The main figure of a page (balance, amount left, available): its name, a large tabular
 * number, a caption and, when needed, a gauge.
 *
 * Public mutable properties are imposed by TwigComponent (see docs/contributing.md).
 */
#[AsTwigComponent]
final class Hero
{
    /** Value already formatted by the app. */
    public string|\Stringable $value;

    /** Name of the figure, sentence case (already translated), or null. */
    public string|\Stringable|null $label = null;

    /** Tone of the value, always one of Tone (unknown -> neutral). */
    public string $tone = 'neutral';

    /** Attributes of the value element (e.g. data-maskable). */
    public ValueAttributes $valueAttributes;

    /** Caption under the value (already translated), or null. */
    public string|\Stringable|null $caption = null;

    /** Tone of the caption, always one of Tone (unknown -> neutral). */
    public string $captionTone = 'neutral';

    /** Attributes of the caption element (e.g. data-maskable when it holds an amount). */
    public ValueAttributes $captionAttributes;

    /** Gauge from 0 to 100 (clamped), or null. */
    public int|float|null $progress = null;

    /** Accessible name of the gauge (already translated), or null. */
    public string|\Stringable|null $progressLabel = null;

    /** Tone of the gauge fill, always one of Tone (absent -> positive, unknown -> neutral). */
    public string $progressTone = 'positive';

    /**
     * @param array<string, mixed> $data
     *
     * @return array<string, mixed>
     */
    #[PreMount]
    public function preMount(array $data): array
    {
        RequiredProps::createForComponent(self::class, 'value')->assertPresentIn($data);

        $data['tone'] = $this->toneOf($data['tone'] ?? null, Tone::Neutral);
        $data['captionTone'] = $this->toneOf($data['captionTone'] ?? null, Tone::Neutral);
        $data['progressTone'] = $this->toneOf($data['progressTone'] ?? null, Tone::Positive);
        $data['valueAttributes'] = ValueAttributes::createFromLooseValue($data['valueAttributes'] ?? null);
        $data['captionAttributes'] = ValueAttributes::createFromLooseValue($data['captionAttributes'] ?? null);

        return $data;
    }

    private function toneOf(mixed $tone, Tone $default): string
    {
        if (null === $tone) {
            return $default->value;
        }

        return Tone::createFromLooseValue($tone instanceof Tone || \is_string($tone) ? $tone : null)->value;
    }
}
