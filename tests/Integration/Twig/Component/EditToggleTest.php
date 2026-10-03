<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Tests\Integration\Twig\Component;

use PHPUnit\Framework\Attributes\Test;

final class EditToggleTest extends ComponentTestCase
{
    #[Test]
    public function it_should_emit_the_toggle_editing_event(): void
    {
        $button = $this->renderComponent('EditToggle')->filter('button');

        self::assertStringContainsString('rm-mnb-glass-pill', (string) $button->attr('class'));
        self::assertSame(self::PREFIX.'emit-event', $button->attr('data-controller'));
        self::assertSame('rm-mnb-list:toggle-editing', $button->attr('data-'.self::PREFIX.'emit-event-name-value'));
        self::assertSame('Edit', $button->filter('.rm-mnb-edit-toggle__start')->text());
        self::assertSame('Done', $button->filter('.rm-mnb-edit-toggle__done')->text());
    }

    #[Test]
    public function it_should_put_free_html_attributes_on_the_root(): void
    {
        $root = $this->renderComponent('EditToggle', [...[], 'role' => 'note', 'data-foo' => 'bar'])->filter('button');

        self::assertSame('note', $root->attr('role'));
        self::assertSame('bar', $root->attr('data-foo'));
    }
}
