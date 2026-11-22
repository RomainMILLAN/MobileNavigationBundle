<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Twig\Component;

use RomainMillan\MobileNavigation\Model\SwipeActions;
use RomainMillan\MobileNavigation\Twig\Component\Option\StructuredProp;
use RomainMillan\MobileNavigation\Twig\Component\Option\SwipeOptions;
use RomainMillan\MobileNavigation\Twig\SwipeControllerAttributes;
use Symfony\UX\StimulusBundle\Dto\StimulusAttributes;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PreMount;

/**
 * Swipe actions around markup the app renders itself (ListRow carries its own): the
 * content block slides over the actions panel, and an "Actions" button reveals them
 * without the gesture.
 *
 * Public mutable properties are imposed by TwigComponent (see docs/contributing.md).
 */
#[AsTwigComponent]
final class Swipeable
{
    /** Name of the item (already translated): it names the "Actions" button and the panel. */
    public string|\Stringable $label;

    /** Swipe actions. */
    public SwipeActions $swipe;

    private ?string $panelId = null;

    public function __construct(
        private readonly SwipeControllerAttributes $swipeControllerAttributes,
    ) {
    }

    /**
     * @param array<string, mixed> $data
     *
     * @return array<string, mixed>
     */
    #[PreMount]
    public function preMount(array $data): array
    {
        RequiredProps::createForComponent(self::class, 'label', 'swipe')->assertPresentIn($data);

        if (!$data['swipe'] instanceof SwipeActions) {
            /** @var array{actions: list<mixed>, csrfToken: string} $resolved */
            $resolved = StructuredProp::createForComponent(self::class, 'swipe', new SwipeOptions())->resolve($data['swipe']);
            $data['swipe'] = SwipeActions::createFromActions($resolved['actions'], $resolved['csrfToken']);
        }

        return $data;
    }

    /** Attributes of the swipe-actions controller, empty without action. */
    public function swipeAttributes(): StimulusAttributes
    {
        return $this->swipeControllerAttributes->createForActions($this->swipe);
    }

    /**
     * @return list<array{url: string, icon: string, tone: string, label: string, method?: string, confirm?: string, carriesReturnPath?: true}>
     */
    public function swipeActionList(): array
    {
        return $this->swipeControllerAttributes->actionsOf($this->swipe);
    }

    /** Id of the actions panel, which the "Actions" button controls. */
    public function swipePanelId(): string
    {
        return $this->panelId ??= 'rm-mnb-swipe-'.bin2hex(random_bytes(6));
    }
}
