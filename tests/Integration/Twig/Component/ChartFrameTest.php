<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Tests\Integration\Twig\Component;

use PHPUnit\Framework\Attributes\Test;

final class ChartFrameTest extends ComponentTestCase
{
    #[Test]
    public function it_should_render_a_bare_frame(): void
    {
        $figure = $this->renderComponent('ChartFrame')->filter('figure.rm-mnb-chart');

        self::assertCount(0, $figure->filter('figcaption'));
        self::assertCount(1, $figure->filter('.rm-mnb-chart__canvas'));
    }

    #[Test]
    public function it_should_render_its_title_and_caption(): void
    {
        $figure = $this->renderComponent('ChartFrame', ['title' => 'Expenses', 'caption' => 'Last 6 months'])->filter('figure');

        self::assertSame('Expenses', $figure->filter('.rm-mnb-chart__title')->text());
        self::assertSame('Last 6 months', $figure->filter('.rm-mnb-chart__caption')->text());
    }

    #[Test]
    public function it_should_put_free_html_attributes_on_the_root(): void
    {
        $root = $this->renderComponent('ChartFrame', [...[], 'role' => 'note', 'data-foo' => 'bar'])->filter('figure');

        self::assertSame('note', $root->attr('role'));
        self::assertSame('bar', $root->attr('data-foo'));
    }
}
