<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Tests\Integration\App\Component;

use RomainMillan\MobileNavigation\Model\SwipeAction;
use RomainMillan\MobileNavigation\Model\SwipeActions;
use RomainMillan\MobileNavigation\Model\Tone;
use RomainMillan\MobileNavigation\Model\ValueAttributes;
use Symfony\Component\Translation\TranslatableMessage;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;

/**
 * An app component that composes MobileNavigation:ListRow, handing it values that are
 * already normalized.
 */
#[AsTwigComponent('AppRow', template: 'components/AppRow.html.twig')]
final class AppRow
{
    public string $title = 'Groceries';

    public function valueAttributes(): ValueAttributes
    {
        return ValueAttributes::createFromArray(['data-maskable' => true]);
    }

    public function swipe(): SwipeActions
    {
        return SwipeActions::createFromActions([
            SwipeAction::link('/items/1/edit', 'icon-edit', Tone::Accent, new TranslatableMessage('Edit')),
        ], 'csrf-token');
    }

    public function tone(): Tone
    {
        return Tone::Positive;
    }
}
