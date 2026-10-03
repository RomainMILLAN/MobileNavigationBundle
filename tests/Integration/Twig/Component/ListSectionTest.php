<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Tests\Integration\Twig\Component;

use PHPUnit\Framework\Attributes\Test;
use Twig\Markup;

final class ListSectionTest extends ComponentTestCase
{
    #[Test]
    public function it_should_render_a_flat_list_without_title(): void
    {
        $section = $this->renderComponent('ListSection')->filter('section');

        self::assertNull($section->attr('aria-label'));
        self::assertCount(0, $section->filter('h3'));
        self::assertSame('section', $section->attr('data-'.self::PREFIX.'list-target'));
    }

    #[Test]
    public function it_should_render_its_title_and_rows(): void
    {
        $section = $this->renderComponent('ListSection', ['title' => 'October', 'rows' => [new Markup('<div class="row-a"></div>', 'UTF-8'), new Markup('<div class="row-b"></div>', 'UTF-8')]])->filter('section');

        self::assertSame('October', $section->attr('aria-label'));
        self::assertSame('October', $section->filter('h3.rm-mnb-list-section__header')->text());
        self::assertCount(2, $section->filter('.rm-mnb-group > div'));
    }

    #[Test]
    public function it_should_put_free_html_attributes_on_the_root(): void
    {
        $root = $this->renderComponent('ListSection', [...[], 'role' => 'note', 'data-foo' => 'bar'])->filter('section')->first();

        self::assertSame('note', $root->attr('role'));
        self::assertSame('bar', $root->attr('data-foo'));
    }
}
