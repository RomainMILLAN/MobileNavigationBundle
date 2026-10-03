<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Twig\Component;

use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;

/**
 * iOS grouped list: a rounded block of rows, with an optional heading.
 *
 * Public mutable properties are imposed by TwigComponent (see docs/contributing.md).
 */
#[AsTwigComponent]
final class SheetGroup
{
    /** Heading (already translated), or null. */
    public string|\Stringable|null $heading = null;

    /** A tap on a row of the group closes the sheet that contains it. */
    public bool $closesSheet = false;
}
