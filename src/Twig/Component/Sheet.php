<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Twig\Component;

use RomainMillan\MobileNavigation\Model\LocalPath;
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
     * Opens itself once connected: the server decided the page lands on this sheet (a
     * link that means "choose a duration", say). Opened once, never again on a restore.
     */
    public bool $open = false;

    /**
     * Local path the address bar is replaced with once the sheet opened on load, so that
     * a reload does not open it again. Given by the server: the client never learns which
     * query parameter asked for the sheet.
     */
    public ?string $cleanUrl = null;

    /**
     * @param array<string, mixed> $data
     *
     * @return array<string, mixed>
     */
    #[PreMount]
    public function preMount(array $data): array
    {
        RequiredProps::createForComponent(self::class, 'id', 'title')->assertPresentIn($data);

        // Refused at mount, where the component is called, rather than silently dropped by
        // the controller: a clean URL that is not a local path is a programming error.
        if (\is_string($data['cleanUrl'] ?? null)) {
            $data['cleanUrl'] = LocalPath::createFromString($data['cleanUrl'])->toString();
        }

        return $data;
    }
}
