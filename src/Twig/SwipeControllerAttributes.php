<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Twig;

use RomainMillan\MobileNavigation\Model\SwipeActions;
use Symfony\Contracts\Translation\TranslatorInterface;
use Symfony\UX\StimulusBundle\Dto\StimulusAttributes;
use Symfony\UX\StimulusBundle\Helper\StimulusHelper;

/**
 * Everything a swipeable element needs, PHP side: the swipe-actions controller and the
 * actions as the panel template renders them. The one place where both are produced (by
 * ListRow and Swipeable).
 */
final readonly class SwipeControllerAttributes
{
    public function __construct(
        private StimulusHelper $stimulusHelper,
        private TranslatorInterface $translator,
    ) {
    }

    /**
     * Empty attributes (rendered as '') when there is no action: no controller. The
     * controller carries no value: the actions are rendered server side, in the panel.
     */
    public function createForActions(SwipeActions $swipeActions): StimulusAttributes
    {
        $attributes = $this->stimulusHelper->createStimulusAttributes();

        if (!$swipeActions->isEmpty()) {
            $attributes->addController(MobileNavigationExtension::CONTROLLER_PREFIX.'swipe-actions');
        }

        return $attributes;
    }

    /**
     * The actions translated, as published by assets/contract.json.
     *
     * @return list<array{url: string, icon: string, tone: string, label: string, method?: string, confirm?: string, carriesReturnPath?: true}>
     */
    public function actionsOf(SwipeActions $swipeActions): array
    {
        return $swipeActions->payload($this->translator)['actions'];
    }
}
