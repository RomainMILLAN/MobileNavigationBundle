<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Tests\Integration\Twig\Component;

use PHPUnit\Framework\Attributes\Test;

final class SelectToggleTest extends ComponentTestCase
{
    #[Test]
    public function it_should_emit_the_toggle_selecting_event(): void
    {
        $button = $this->renderComponent('SelectToggle')->filter('button');

        self::assertStringContainsString('rm-mnb-glass-pill', (string) $button->attr('class'));
        self::assertSame(self::PREFIX.'emit-event', $button->attr('data-controller'));
        self::assertSame('rm-mnb-list:toggle-selecting', $button->attr('data-'.self::PREFIX.'emit-event-name-value'));
        self::assertSame(self::PREFIX.'emit-event#emit', $button->attr('data-action'));
        self::assertSame('Select', $button->filter('.rm-mnb-select-toggle__start')->text());
        self::assertSame('Done', $button->filter('.rm-mnb-select-toggle__done')->text());
    }

    #[Test]
    public function it_should_put_free_html_attributes_on_the_root(): void
    {
        $root = $this->renderComponent('SelectToggle', [...[], 'role' => 'note', 'data-foo' => 'bar'])->filter('body > *')->first();

        self::assertSame('note', $root->attr('role'));
        self::assertSame('bar', $root->attr('data-foo'));
    }
}
