<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Twig\Component;

use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PreMount;

/**
 * iOS sheet, driven by the <id>:open|close|toggle window events.
 *
 * Public mutable properties are imposed by TwigComponent (see docs/contributing.md).
 */
#[AsTwigComponent]
final class Sheet
{
    /** DOM id, also the name of the commands. */
    public string $id;

    /** Title of the sheet (already translated). */
    public string|\Stringable $title;

    /** The title is for screen readers only. */
    public bool $titleHidden = false;

    /** The body is the scrolling area (otherwise the app sets the scroll target). */
    public bool $scrollable = true;

    /** @var list<string> Window events that close the sheet without animation. */
    public array $forceCloseEvents = ['turbo:before-cache'];

    /** A sheet below 768 px only: above, its content renders in place, without the shell. */
    public bool $mobileOnly = false;

    /**
     * @param array<string, mixed> $data
     *
     * @return array<string, mixed>
     */
    #[PreMount]
    public function preMount(array $data): array
    {
        RequiredProps::createForComponent(self::class, 'id', 'title')->assertPresentIn($data);

        return $data;
    }
}
