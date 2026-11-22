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
     * Level of the title heading (1 to 6), 2 by default; null renders a plain paragraph,
     * for a page whose outline already has its headings.
     */
    public ?int $headingLevel = 2;

    /**
     * @param array<string, mixed> $data
     *
     * @return array<string, mixed>
     */
    #[PreMount]
    public function preMount(array $data): array
    {
        RequiredProps::createForComponent(self::class, 'title')->assertPresentIn($data);

        $headingLevel = \array_key_exists('headingLevel', $data) ? $data['headingLevel'] : 2;
        if (null !== $headingLevel && (!\is_int($headingLevel) || $headingLevel < 1 || $headingLevel > 6)) {
            throw new \InvalidArgumentException(\sprintf('The "headingLevel" prop of the MobileNavigation:EmptyState component must be an integer from 1 to 6, or null; got %s.', get_debug_type($headingLevel)));
        }

        if (null !== ($data['action'] ?? null)) {
            $data['action'] = StructuredProp::createForComponent(self::class, 'action', new LinkOptions())->resolve($data['action']);
        }

        return $data;
    }
}
