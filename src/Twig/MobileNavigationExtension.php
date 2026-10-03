<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Twig;

use RomainMillan\MobileNavigation\Model\SwipeAction;
use RomainMillan\MobileNavigation\Model\SwipeActions;
use Symfony\UX\StimulusBundle\Dto\StimulusAttributes;
use Twig\Extension\AbstractExtension;
use Twig\TwigFunction;

/**
 * Inheritance imposed by the Twig extension point.
 *
 * rm_mnb_controller('sheet') gives the Stimulus name of a bundle controller, to pass to
 * stimulus_controller() / stimulus_action() / stimulus_target().
 *
 * rm_mnb_swipe_controller(actions, csrfToken) mounts the swipe-actions controller on an
 * element the app renders itself. Like stimulus_controller(), it is safe in an HTML
 * attribute context: StimulusAttributes escapes its values, so no |raw is needed.
 */
final class MobileNavigationExtension extends AbstractExtension
{
    /** The only place, PHP side, that spells the package name (see docs/contributing.md). */
    public const CONTROLLER_PREFIX = '@romainmillan/mobile-navigation-bundle/';

    public function __construct(
        private readonly SwipeControllerAttributes $swipeControllerAttributes,
    ) {
    }

    public function getFunctions(): array
    {
        return [
            new TwigFunction('rm_mnb_controller', $this->controller(...)),
            new TwigFunction('rm_mnb_swipe_controller', $this->swipeController(...), ['is_safe' => ['html_attr']]),
        ];
    }

    public function controller(string $name): string
    {
        return self::CONTROLLER_PREFIX.$name;
    }

    /**
     * @param list<SwipeAction> $actions
     */
    public function swipeController(array $actions, string $csrfToken): StimulusAttributes
    {
        return $this->swipeControllerAttributes->createForActions(SwipeActions::createFromActions($actions, $csrfToken));
    }
}
