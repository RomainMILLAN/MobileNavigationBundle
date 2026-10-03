<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Twig\Component;

use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PreMount;

/**
 * "Load more": the next page loads into this <turbo-frame> (requires Turbo).
 *
 * Public mutable properties are imposed by TwigComponent (see docs/contributing.md).
 */
#[AsTwigComponent]
final class LoadMore
{
    /** URL of the next page, generated server side (filters kept). */
    public string $href;

    /** Id of the frame, unique per page. */
    public string $frameId;

    /**
     * @param array<string, mixed> $data
     *
     * @return array<string, mixed>
     */
    #[PreMount]
    public function preMount(array $data): array
    {
        RequiredProps::createForComponent(self::class, 'href', 'frameId')->assertPresentIn($data);

        return $data;
    }
}
