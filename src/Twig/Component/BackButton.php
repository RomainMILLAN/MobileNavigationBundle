<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Twig\Component;

use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PreMount;

/**
 * iOS 26 back button: a glass disc and a chevron. It goes to the previous page when the
 * app's history proves one, otherwise to `href`, the parent fallback. The destination's
 * name is spoken, not shown. CompactBar renders it too, with the same behaviour.
 *
 * Public mutable properties are imposed by TwigComponent (see docs/contributing.md).
 */
#[AsTwigComponent]
final class BackButton
{
    /** Parent fallback: URL of the parent, generated server side, used when no previous page is proven. */
    public string $href;

    /** Name of the parent fallback (already translated). */
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
