<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Twig\Component;

use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;

/**
 * "Select / Done" button: toggles the selection mode of the page list through the
 * rm-mnb-list:toggle-selecting window event, so it can live anywhere on the page.
 */
#[AsTwigComponent]
final class SelectToggle
{
}
