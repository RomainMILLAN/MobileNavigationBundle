<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Twig\Component;

use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;

/**
 * Frame of a compact chart: a title, a caption, a fixed-height area. The bundle knows no
 * chart library: the app renders its chart in the "content" block and puts its controller
 * on the root.
 *
 * Public mutable properties are imposed by TwigComponent (see docs/contributing.md).
 */
#[AsTwigComponent]
final class ChartFrame
{
    /** Title (already translated), or null. */
    public string|\Stringable|null $title = null;

    /** Caption under the title (already translated), or null. */
    public string|\Stringable|null $caption = null;
}
