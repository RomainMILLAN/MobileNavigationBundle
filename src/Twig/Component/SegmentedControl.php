<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Twig\Component;

use RomainMillan\MobileNavigation\Twig\Component\Option\SegmentItemOptions;
use RomainMillan\MobileNavigation\Twig\Component\Option\StructuredProp;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PreMount;

/**
 * iOS segmented control. Every segment is a link to a route (not an ARIA tab): the current
 * segment carries aria-current="page".
 *
 * Public mutable properties are imposed by TwigComponent (see docs/contributing.md).
 */
#[AsTwigComponent]
final class SegmentedControl
{
    /** @var list<array{href: string, label: string|\Stringable, count: int|string|null, current: bool}> */
    public array $items = [];

    /** Accessible name of the group (already translated), or null. */
    public string|\Stringable|null $label = null;

    /**
     * @param array<string, mixed> $data
     *
     * @return array<string, mixed>
     */
    #[PreMount]
    public function preMount(array $data): array
    {
        if (null !== ($data['items'] ?? null)) {
            $data['items'] = StructuredProp::createForComponent(self::class, 'items', new SegmentItemOptions())->resolveEach($data['items']);
        }

        return $data;
    }
}
