<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Tests\Integration\Twig\Component;

use PHPUnit\Framework\Attributes\Test;

final class SegmentedControlTest extends ComponentTestCase
{
    #[Test]
    public function it_should_render_link_segments_and_mark_the_current_one(): void
    {
        $nav = $this->renderComponent('SegmentedControl', ['label' => 'Period', 'items' => [
            ['href' => '/?p=month', 'label' => 'Month', 'current' => true],
            ['href' => '/?p=year', 'label' => 'Year', 'count' => 3],
        ]])->filter('nav.rm-mnb-segmented');

        self::assertSame('Period', $nav->attr('aria-label'));
        $items = $nav->filter('a.rm-mnb-segmented__item');
        self::assertCount(2, $items);
        self::assertSame('page', $items->eq(0)->attr('aria-current'));
        self::assertStringContainsString('is-current', (string) $items->eq(0)->attr('class'));
        self::assertNull($items->eq(1)->attr('aria-current'));
        self::assertCount(0, $items->eq(0)->filter('.rm-mnb-segmented__count'));
        self::assertSame('3', $items->eq(1)->filter('.rm-mnb-segmented__count')->text());
    }

    #[Test]
    public function it_should_render_an_empty_control_by_default(): void
    {
        $nav = $this->renderComponent('SegmentedControl')->filter('nav');

        self::assertNull($nav->attr('aria-label'));
        self::assertCount(0, $nav->filter('a'));
    }

    #[Test]
    public function it_should_refuse_an_unknown_key_in_an_item(): void
    {
        $this->assertMountFails('SegmentedControl', ['items' => [['href' => '/', 'label' => 'All', 'icon' => 'x']]], 'Cannot mount the "items" prop of the MobileNavigation:SegmentedControl component');
    }

    #[Test]
    public function it_should_put_free_html_attributes_on_the_root(): void
    {
        $root = $this->renderComponent('SegmentedControl', [...[], 'role' => 'note', 'data-foo' => 'bar'])->filter('nav');

        self::assertSame('note', $root->attr('role'));
        self::assertSame('bar', $root->attr('data-foo'));
    }
}
