<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Twig\Component;

use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PreMount;

/**
 * Mobile filter bar: a search field that mirrors its input into the real field of the
 * app form, and a button that opens the sheet of the other filters.
 *
 * Public mutable properties are imposed by TwigComponent (see docs/contributing.md).
 */
#[AsTwigComponent]
final class FilterBar
{
    /** Id of the filter form. */
    public string $form;

    /** Id of the filter sheet. */
    public string $sheet;

    /** Name of the real search field, or null (no field). */
    public ?string $field = null;

    /** Placeholder of the field (already translated), or null for the default one. */
    public string|\Stringable|null $placeholder = null;

    /** Number of active filters (computed server side). */
    public int $activeCount = 0;

    /**
     * @param array<string, mixed> $data
     *
     * @return array<string, mixed>
     */
    #[PreMount]
    public function preMount(array $data): array
    {
        RequiredProps::createForComponent(self::class, 'form', 'sheet')->assertPresentIn($data);

        return $data;
    }
}
