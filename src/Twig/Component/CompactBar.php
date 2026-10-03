<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Twig\Component;

use RomainMillan\MobileNavigation\Twig\Component\Option\BackOptions;
use RomainMillan\MobileNavigation\Twig\Component\Option\StructuredProp;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PreMount;

/**
 * iOS 26 compact bar: a blurred gradient at the top of the screen and glass controls
 * (back, title pill, the app's trailing block). It shows once the large title scrolls
 * out (large-title controller, set by the app on an ancestor).
 *
 * Public mutable properties are imposed by TwigComponent (see docs/contributing.md).
 */
#[AsTwigComponent]
final class CompactBar
{
    /** Title of the page (already escaped text or Markup). */
    public string|\Stringable $title;

    /** @var array{href: string, label: string|\Stringable}|null The parent, or null. */
    public ?array $back = null;

    /**
     * @param array<string, mixed> $data
     *
     * @return array<string, mixed>
     */
    #[PreMount]
    public function preMount(array $data): array
    {
        RequiredProps::createForComponent(self::class, 'title')->assertPresentIn($data);

        if (null !== ($data['back'] ?? null)) {
            $data['back'] = StructuredProp::createForComponent(self::class, 'back', new BackOptions())->resolve($data['back']);
        }

        return $data;
    }
}
