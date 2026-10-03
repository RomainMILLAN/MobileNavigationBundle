<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Twig\Component;

use RomainMillan\MobileNavigation\Twig\Component\Option\LinkOptions;
use RomainMillan\MobileNavigation\Twig\Component\Option\StructuredProp;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PreMount;

/**
 * Empty state outside a list: a discreet icon, a sentence, an optional action.
 *
 * Public mutable properties are imposed by TwigComponent (see docs/contributing.md).
 */
#[AsTwigComponent]
final class EmptyState
{
    /** Title (already translated). */
    public string|\Stringable $title;

    /** CSS classes of the icon (rendered by the "icon" block), or null. */
    public ?string $icon = null;

    /** Details (already translated), or null. */
    public string|\Stringable|null $message = null;

    /** @var array{href: string, label: string|\Stringable}|null Link generated server side, or null. */
    public ?array $action = null;

    /**
     * @param array<string, mixed> $data
     *
     * @return array<string, mixed>
     */
    #[PreMount]
    public function preMount(array $data): array
    {
        RequiredProps::createForComponent(self::class, 'title')->assertPresentIn($data);

        if (null !== ($data['action'] ?? null)) {
            $data['action'] = StructuredProp::createForComponent(self::class, 'action', new LinkOptions())->resolve($data['action']);
        }

        return $data;
    }
}
