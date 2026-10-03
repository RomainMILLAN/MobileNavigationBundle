<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Twig;

use RomainMillan\MobileNavigation\Model\SwipeActions;
use Symfony\Contracts\Translation\TranslatorInterface;
use Symfony\UX\StimulusBundle\Dto\StimulusAttributes;
use Symfony\UX\StimulusBundle\Helper\StimulusHelper;

/**
 * Mounts the swipe-actions controller: the one place, PHP side, where it is mounted (by
 * ListRow and by the rm_mnb_swipe_controller() Twig function).
 */
final readonly class SwipeControllerAttributes
{
    public function __construct(
        private StimulusHelper $stimulusHelper,
        private TranslatorInterface $translator,
    ) {
    }

    /**
     * Empty attributes (rendered as '') when there is no action: no controller, no token.
     */
    public function createForActions(SwipeActions $swipeActions): StimulusAttributes
    {
        $attributes = $this->stimulusHelper->createStimulusAttributes();

        if (!$swipeActions->isEmpty()) {
            $attributes->addController(MobileNavigationExtension::CONTROLLER_PREFIX.'swipe-actions', $swipeActions->payload($this->translator));
        }

        return $attributes;
    }
}
