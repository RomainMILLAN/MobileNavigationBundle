<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Tests\Unit\Model;

use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;
use RomainMillan\MobileNavigation\Model\SwipeAction;
use RomainMillan\MobileNavigation\Model\SwipeActions;
use RomainMillan\MobileNavigation\Model\Tone;
use RomainMillan\MobileNavigation\Tests\Support\TestTranslator;
use Symfony\Component\Translation\TranslatableMessage;

final class SwipeActionsTest extends TestCase
{
    #[Test]
    public function it_should_assemble_the_payload_of_its_actions(): void
    {
        $swipeActions = SwipeActions::createFromActions(new \ArrayIterator([
            SwipeAction::link('/items/1/edit', 'icon-edit', Tone::Accent, new TranslatableMessage('item.edit', domain: 'app')),
            SwipeAction::post('/items/1/validate', 'icon-ok', Tone::Positive, new TranslatableMessage('item.validate', domain: 'app')),
        ]), 'token');

        self::assertFalse($swipeActions->isEmpty());
        self::assertSame([
            'actions' => [
                ['url' => '/items/1/edit', 'icon' => 'icon-edit', 'tone' => 'accent', 'label' => 'Edit'],
                ['url' => '/items/1/validate', 'icon' => 'icon-ok', 'tone' => 'positive', 'label' => 'Validate', 'method' => 'POST'],
            ],
            'csrfToken' => 'token',
        ], $swipeActions->payload(TestTranslator::create()));
    }

    #[Test]
    public function it_should_be_empty_without_action(): void
    {
        self::assertTrue(SwipeActions::createEmpty()->isEmpty());
        self::assertSame(['actions' => [], 'csrfToken' => ''], SwipeActions::createEmpty()->payload(TestTranslator::create()));
        self::assertTrue(SwipeActions::createFromActions([], '')->isEmpty());
    }

    #[Test]
    public function it_should_refuse_actions_without_token(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Cannot mount swipe actions without a CSRF token.');

        SwipeActions::createFromActions([SwipeAction::link('/x', 'icon', Tone::Accent, new TranslatableMessage('x'))], '');
    }

    #[Test]
    public function it_should_refuse_an_element_that_is_not_a_swipe_action(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Cannot mount a swipe action of type "array".');

        SwipeActions::createFromActions([['url' => '/x']], 'token');
    }
}
