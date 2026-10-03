<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Twig\Component;

use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PreMount;

/**
 * iOS 26 back button: a glass disc and a chevron; the parent name is spoken, not shown.
 *
 * Public mutable properties are imposed by TwigComponent (see docs/contributing.md).
 */
#[AsTwigComponent]
final class BackButton
{
    /** URL of the parent, generated server side. */
    public string $href;

    /** Name of the parent (already translated). */
    public string|\Stringable $label;

    /**
     * @param array<string, mixed> $data
     *
     * @return array<string, mixed>
     */
    #[PreMount]
    public function preMount(array $data): array
    {
        RequiredProps::createForComponent(self::class, 'href', 'label')->assertPresentIn($data);

        return $data;
    }
}
