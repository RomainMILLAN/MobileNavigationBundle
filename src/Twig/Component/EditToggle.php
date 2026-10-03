<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Twig\Component;

use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;

/**
 * "Edit / Done" button: toggles the edit (reorder) mode of the page list through the
 * rm-mnb-list:toggle-editing window event. The twin of SelectToggle.
 */
#[AsTwigComponent]
final class EditToggle
{
}
