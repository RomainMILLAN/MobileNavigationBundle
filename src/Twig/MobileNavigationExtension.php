<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Twig;

use Twig\Extension\AbstractExtension;
use Twig\TwigFunction;

/**
 * Inheritance imposed by the Twig extension point.
 *
 * rm_mnb_controller('sheet') gives the Stimulus name of a bundle controller, to pass to
 * stimulus_controller() / stimulus_action() / stimulus_target().
 *
 * Swipe actions around app markup: the MobileNavigation:Swipeable component.
 */
final class MobileNavigationExtension extends AbstractExtension
{
    /** The only place, PHP side, that spells the package name (see docs/contributing.md). */
    public const CONTROLLER_PREFIX = '@romainmillan/mobile-navigation-bundle/';

    public function getFunctions(): array
    {
        return [
            new TwigFunction('rm_mnb_controller', $this->controller(...)),
        ];
    }

    public function controller(string $name): string
    {
        return self::CONTROLLER_PREFIX.$name;
    }
}
