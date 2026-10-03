<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Twig\Component;

use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PreMount;

/**
 * The "…" glass disc of the top row: it opens the action sheet of the page (window
 * command <sheet>:toggle), like the "…" menu of iOS.
 *
 * Public mutable properties are imposed by TwigComponent (see docs/contributing.md).
 */
#[AsTwigComponent]
final class ActionsDisc
{
    /** Id of the sheet to open. */
    public string $sheet;

    /** Accessible name (already translated), or null for "More actions". */
    public string|\Stringable|null $label = null;

    /** CSS classes of an app icon (rendered by the "icon" block), or null for the bundle's three dots. */
    public ?string $icon = null;

    /**
     * @param array<string, mixed> $data
     *
     * @return array<string, mixed>
     */
    #[PreMount]
    public function preMount(array $data): array
    {
        RequiredProps::createForComponent(self::class, 'sheet')->assertPresentIn($data);

        return $data;
    }
}
