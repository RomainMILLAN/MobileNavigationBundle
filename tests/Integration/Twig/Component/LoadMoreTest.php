<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Tests\Integration\Twig\Component;

use PHPUnit\Framework\Attributes\Test;

final class LoadMoreTest extends ComponentTestCase
{
    #[Test]
    public function it_should_load_the_next_page_into_its_frame(): void
    {
        $crawler = $this->renderComponent('LoadMore', ['href' => '/transactions?page=2', 'frameId' => 'page-2']);

        self::assertSame('page-2', $crawler->filter('turbo-frame')->attr('id'));
        self::assertSame('_top', $crawler->filter('turbo-frame')->attr('target'));
        $link = $crawler->filter('turbo-frame > a.rm-mnb-load-more');
        self::assertSame('/transactions?page=2', $link->attr('href'));
        self::assertSame('page-2', $link->attr('data-turbo-frame'));
        self::assertSame('Load more', trim($link->text()));
    }

    #[Test]
    public function it_should_require_href(): void
    {
        $data = ['href' => '/transactions?page=2', 'frameId' => 'page-2'];
        unset($data['href']);
        $this->assertMountFails('LoadMore', $data, 'There is no "href" prop for the MobileNavigation:LoadMore component.');
        $this->assertMountFails('LoadMore', [...$data, 'href' => null], 'There is no "href" prop for the MobileNavigation:LoadMore component.');
    }

    #[Test]
    public function it_should_require_frameid(): void
    {
        $data = ['href' => '/transactions?page=2', 'frameId' => 'page-2'];
        unset($data['frameId']);
        $this->assertMountFails('LoadMore', $data, 'There is no "frameId" prop for the MobileNavigation:LoadMore component.');
        $this->assertMountFails('LoadMore', [...$data, 'frameId' => null], 'There is no "frameId" prop for the MobileNavigation:LoadMore component.');
    }

    #[Test]
    public function it_should_put_free_html_attributes_on_the_root(): void
    {
        $root = $this->renderComponent('LoadMore', [...['href' => '/transactions?page=2', 'frameId' => 'page-2'], 'role' => 'note', 'data-foo' => 'bar'])->filter('a.rm-mnb-load-more')->first();

        self::assertSame('note', $root->attr('role'));
        self::assertSame('bar', $root->attr('data-foo'));
    }
}
