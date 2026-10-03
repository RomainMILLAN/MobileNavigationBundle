<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Tests\Integration\Twig\Component;

use PHPUnit\Framework\Attributes\Test;

final class SheetGroupTest extends ComponentTestCase
{
    #[Test]
    public function it_should_render_a_group_without_heading_by_default(): void
    {
        $crawler = $this->renderComponent('SheetGroup');

        self::assertCount(0, $crawler->filter('h3'));
        self::assertCount(1, $crawler->filter('div.rm-mnb-group'));
        self::assertNull($crawler->filter('div.rm-mnb-group')->attr('data-'.self::PREFIX.'sheet-target'));
    }

    #[Test]
    public function it_should_render_its_heading_and_close_zone(): void
    {
        $crawler = $this->renderComponent('SheetGroup', ['heading' => 'Account', 'closesSheet' => true]);

        self::assertSame('Account', $crawler->filter('h3.rm-mnb-group__heading')->text());
        self::assertSame('closeZone', $crawler->filter('div.rm-mnb-group')->attr('data-'.self::PREFIX.'sheet-target'));
    }

    #[Test]
    public function it_should_put_free_html_attributes_on_the_root(): void
    {
        $root = $this->renderComponent('SheetGroup', [...[], 'role' => 'note', 'data-foo' => 'bar'])->filter('div.rm-mnb-group')->first();

        self::assertSame('note', $root->attr('role'));
        self::assertSame('bar', $root->attr('data-foo'));
    }
}
