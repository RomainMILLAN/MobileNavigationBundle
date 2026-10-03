<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Twig\Component;

use RomainMillan\MobileNavigation\Model\SwipeActions;
use RomainMillan\MobileNavigation\Model\ValueAttributes;
use RomainMillan\MobileNavigation\Twig\Component\Option\BadgeOptions;
use RomainMillan\MobileNavigation\Twig\Component\Option\LeadingOptions;
use RomainMillan\MobileNavigation\Twig\Component\Option\SelectableOptions;
use RomainMillan\MobileNavigation\Twig\Component\Option\StructuredProp;
use RomainMillan\MobileNavigation\Twig\Component\Option\SwipeOptions;
use RomainMillan\MobileNavigation\Twig\Component\Option\ValueOptions;
use RomainMillan\MobileNavigation\Twig\SwipeControllerAttributes;
use Symfony\UX\StimulusBundle\Dto\StimulusAttributes;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PreMount;

/**
 * iOS grouped list row: tap = view, swipe = actions, a checkbox in selection mode.
 * Texts arrive translated, URLs generated server side.
 *
 * Public mutable properties are imposed by TwigComponent (see docs/contributing.md).
 */
#[AsTwigComponent]
final class ListRow
{
    /** Title (one line, truncated). */
    public string|\Stringable $title;

    /** URL of the item view, or null (an information row, without link). */
    public ?string $href = null;

    /** Struck-through title (a cancelled item). */
    public bool $titleStrike = false;

    /** Subtitle (one line, truncated), or null. */
    public string|\Stringable|null $subtitle = null;

    /** @var array{icon: string, tone: string}|null Chip, or null. */
    public ?array $leading = null;

    /** @var array{text: string|\Stringable, tone: string}|null Value on the right, or null. */
    public ?array $value = null;

    /** Attributes of the value element (e.g. data-maskable). */
    public ValueAttributes $valueAttributes;

    /** @var array{label: string|\Stringable, tone: string}|null Badge under the value, or null. */
    public ?array $badge = null;

    /** Navigation chevron (only shown with href). */
    public bool $chevron = true;

    /** Swipe actions, empty by default. */
    public SwipeActions $swipe;

    /** @var array{name: string, value: string|int, label: string|\Stringable, attributes: ?StimulusAttributes}|null Checkbox of the selection mode, or null. */
    public ?array $selectable = null;

    /** Turbo target of the link (the row may live in a "Load more" frame). */
    public string $turboFrame = '_top';

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
        RequiredProps::createForComponent(self::class, 'title')->assertPresentIn($data);

        foreach (['leading' => new LeadingOptions(), 'value' => new ValueOptions(), 'badge' => new BadgeOptions(), 'selectable' => new SelectableOptions()] as $prop => $propOptions) {
            if (null !== ($data[$prop] ?? null)) {
                $data[$prop] = StructuredProp::createForComponent(self::class, $prop, $propOptions)->resolve($data[$prop]);
            }
        }

        $data['valueAttributes'] = ValueAttributes::createFromLooseValue($data['valueAttributes'] ?? null);
        $data['swipe'] = $this->swipeActions($data['swipe'] ?? null);

        return $data;
    }

    /** Attributes of the swipe-actions controller, empty without action. */
    public function swipeAttributes(): StimulusAttributes
    {
        return $this->swipeControllerAttributes->createForActions($this->swipe);
    }

    private function swipeActions(mixed $swipe): SwipeActions
    {
        if ($swipe instanceof SwipeActions) {
            return $swipe;
        }

        if (null === $swipe) {
            return SwipeActions::createEmpty();
        }

        /** @var array{actions: list<mixed>, csrfToken: string} $resolved */
        $resolved = StructuredProp::createForComponent(self::class, 'swipe', new SwipeOptions())->resolve($swipe);

        return SwipeActions::createFromActions($resolved['actions'], $resolved['csrfToken']);
    }
}
