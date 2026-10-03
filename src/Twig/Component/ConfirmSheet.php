<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Twig\Component;

use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;

/**
 * Confirmation sheet of the destructive swipe actions, one per page: it answers the
 * rm-mnb-confirm:request events.
 *
 * Public mutable properties are imposed by TwigComponent (see docs/contributing.md).
 */
#[AsTwigComponent]
final class ConfirmSheet
{
    /** DOM id of the sheet. */
    public string $id = 'rm-mnb-confirm';

    /** @var list<string> Window events that close the sheet without animation. */
    public array $forceCloseEvents = ['turbo:before-cache'];
}
