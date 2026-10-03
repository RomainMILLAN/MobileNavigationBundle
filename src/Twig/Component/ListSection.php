<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Twig\Component;

use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;

/**
 * A section of a grouped list: a header and a block of rows. Two consecutive sections
 * with the same title only show one header (the list controller hides the second).
 *
 * Public mutable properties are imposed by TwigComponent (see docs/contributing.md).
 */
#[AsTwigComponent]
final class ListSection
{
    /** Header, also the accessible name of the section; empty = flat list, no header. */
    public string|\Stringable $title = '';

    /** @var list<mixed> Rows already rendered (Markup), when called through component(). */
    public array $rows = [];
}
