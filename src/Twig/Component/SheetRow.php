<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Twig\Component;

use RomainMillan\MobileNavigation\Model\Tone;
use RomainMillan\MobileNavigation\Model\ValueAttributes;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PreMount;

/**
 * A row of a grouped list: a link with href, a static row with static, a button
 * otherwise. Other attributes (role, aria-*, app Stimulus actions) go on the row.
 *
 * Public mutable properties are imposed by TwigComponent (see docs/contributing.md).
 */
#[AsTwigComponent]
final class SheetRow
{
    /** Label (already translated). */
    public string|\Stringable|null $label = null;

    /** URL generated server side, or null. */
    public ?string $href = null;

    /** CSS classes of the chip icon (rendered by the "icon" block), or null. */
    public ?string $icon = null;

    /** Tone of the chip, always one of Tone (unknown -> neutral). */
    public string $tone = 'neutral';

    /** Value shown on the right, or null. */
    public string|\Stringable|null $value = null;

    /** Attributes of the value element (e.g. data-maskable). */
    public ValueAttributes $valueAttributes;

    /** Tone of the value ink (income, expense), or null for the body ink; neutral = body ink. */
    public ?string $valueTone = null;

    /** The value goes under the label, on several lines (description, IBAN, keywords). */
    public bool $multiline = false;

    /** Badge on the right, or null. */
    public string|\Stringable|null $badge = null;

    public bool $chevron = false;

    /** Selection tick (the current row of a choice). */
    public bool $checked = false;

    /** Destructive action (red ink). */
    public bool $danger = false;

    /** Information, not an action. */
    public bool $static = false;

    /** iOS switch on the right (the state is aria-checked, held by the app). */
    public bool $switch = false;

    /**
     * @param array<string, mixed> $data
     *
     * @return array<string, mixed>
     */
    #[PreMount]
    public function preMount(array $data): array
    {
        $tone = $data['tone'] ?? null;
        $data['tone'] = Tone::createFromLooseValue($tone instanceof Tone || \is_string($tone) ? $tone : null)->value;
        $data['valueAttributes'] = ValueAttributes::createFromLooseValue($data['valueAttributes'] ?? null);

        $valueTone = $data['valueTone'] ?? null;
        $data['valueTone'] = null === $valueTone ? null : Tone::createFromLooseValue($valueTone instanceof Tone || \is_string($valueTone) ? $valueTone : null)->value;

        return $data;
    }
}
