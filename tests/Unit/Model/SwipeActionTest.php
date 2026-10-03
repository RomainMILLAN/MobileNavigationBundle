<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Tests\Unit\Model;

use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;
use RomainMillan\MobileNavigation\Model\SwipeAction;
use RomainMillan\MobileNavigation\Model\Tone;
use RomainMillan\MobileNavigation\Tests\Support\TestTranslator;
use Symfony\Component\Translation\TranslatableMessage;

final class SwipeActionTest extends TestCase
{
    #[Test]
    public function it_should_describe_a_link_without_method(): void
    {
        $action = SwipeAction::link('/items/1/edit', 'icon-edit', Tone::Accent, new TranslatableMessage('item.edit', domain: 'app'));

        self::assertSame(['url' => '/items/1/edit', 'icon' => 'icon-edit', 'tone' => 'accent', 'label' => 'Edit'], $action->payload(TestTranslator::create()));
        self::assertSame('GET', $action->getMethod());
        self::assertFalse($action->isDestructive());
    }

    #[Test]
    public function it_should_describe_a_post(): void
    {
        $action = SwipeAction::post('/items/1/validate', 'icon-ok', Tone::Positive, new TranslatableMessage('item.validate', domain: 'app'));

        self::assertSame(['url' => '/items/1/validate', 'icon' => 'icon-ok', 'tone' => 'positive', 'label' => 'Validate', 'method' => 'POST'], $action->payload(TestTranslator::create()));
        self::assertSame('POST', $action->getMethod());
        self::assertFalse($action->isDestructive());
    }

    #[Test]
    public function it_should_make_a_destructive_action_a_confirmed_negative_post(): void
    {
        $label = new TranslatableMessage('item.cancel', domain: 'app');
        $action = SwipeAction::destructive('/items/1/cancel', 'icon-x', $label, new TranslatableMessage('item.cancel_confirm', domain: 'app'));

        self::assertSame([
            'url' => '/items/1/cancel',
            'icon' => 'icon-x',
            'tone' => 'negative',
            'label' => 'Cancel',
            'method' => 'POST',
            'confirm' => 'It will no longer count.',
        ], $action->payload(TestTranslator::create()));
        self::assertTrue($action->isDestructive());
        self::assertSame('POST', $action->getMethod());
        self::assertSame($label, $action->getLabel());
    }

    #[Test]
    public function it_should_refuse_a_link_that_is_not_local(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        SwipeAction::link('https://evil.example/x', 'icon', Tone::Accent, new TranslatableMessage('x'));
    }

    #[Test]
    public function it_should_refuse_a_post_that_is_not_local(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        SwipeAction::post('//evil.example/x', 'icon', Tone::Accent, new TranslatableMessage('x'));
    }

    #[Test]
    public function it_should_refuse_a_destructive_action_that_is_not_local(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        SwipeAction::destructive('javascript:alert(1)', 'icon', new TranslatableMessage('x'), new TranslatableMessage('y'));
    }
}
