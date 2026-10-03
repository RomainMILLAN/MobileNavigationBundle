<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Twig\Component;

use RomainMillan\MobileNavigation\Twig\Component\Option\FabOptions;
use RomainMillan\MobileNavigation\Twig\Component\Option\MoreOptions;
use RomainMillan\MobileNavigation\Twig\Component\Option\StructuredProp;
use RomainMillan\MobileNavigation\Twig\Component\Option\TabOptions;
use Symfony\UX\StimulusBundle\Dto\StimulusAttributes;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PreMount;

/**
 * iOS 26 tab bar: a glass pill, a sliding lens, a detached "+".
 *
 * Public mutable properties are imposed by TwigComponent (see docs/contributing.md).
 */
#[AsTwigComponent]
final class TabBar
{
    /** Accessible name of the navigation (already translated). */
    public string|\Stringable $label;

    /** @var list<array{href: string, label: string|\Stringable, icon: string, current: bool}> */
    public array $tabs;

    /** @var array{label: string|\Stringable, icon: string, href: ?string, sheet: ?string} */
    public array $fab;

    /** @var array{sheet: string, label: string|\Stringable, icon: string}|null A tab that opens a sheet, or null. */
    public ?array $more = null;

    /** The app's Stimulus attributes on the "+" (gestures), or null. */
    public ?StimulusAttributes $fabAttributes = null;

    /**
     * @param array<string, mixed> $data
     *
     * @return array<string, mixed>
     */
    #[PreMount]
    public function preMount(array $data): array
    {
        RequiredProps::createForComponent(self::class, 'label', 'tabs', 'fab')->assertPresentIn($data);

        $data['tabs'] = StructuredProp::createForComponent(self::class, 'tabs', new TabOptions())->resolveEach($data['tabs']);
        $data['fab'] = StructuredProp::createForComponent(self::class, 'fab', new FabOptions())->resolve($data['fab']);

        if (null !== ($data['more'] ?? null)) {
            $data['more'] = StructuredProp::createForComponent(self::class, 'more', new MoreOptions())->resolve($data['more']);
        }

        return $data;
    }
}
