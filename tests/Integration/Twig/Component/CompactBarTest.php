<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Tests\Integration\Twig\Component;

use PHPUnit\Framework\Attributes\Test;

final class CompactBarTest extends ComponentTestCase
{
    #[Test]
    public function it_should_render_an_inert_bar_without_back(): void
    {
        $crawler = $this->renderComponent('CompactBar', ['title' => 'Account']);

        self::assertCount(1, $crawler->filter('.rm-mnb-compact-bar-veil'));
        $bar = $crawler->filter('.rm-mnb-compact-bar');
        self::assertSame('bar', $bar->attr('data-'.self::PREFIX.'large-title-target'));
        self::assertNotNull($bar->attr('inert'));
        self::assertSame('Account', $bar->filter('.rm-mnb-compact-bar__title')->text());
        self::assertCount(0, $bar->filter('.rm-mnb-back'));
    }

    #[Test]
    public function it_should_render_the_back_button(): void
    {
        $back = $this->renderComponent('CompactBar', [...['title' => 'Account'], 'back' => ['href' => '/accounts', 'label' => 'Accounts']])->filter('.rm-mnb-compact-bar__leading a.rm-mnb-back');

        self::assertSame('/accounts', $back->attr('href'));
        self::assertSame('Back to Accounts', $back->attr('aria-label'));
    }

    #[Test]
    public function it_should_refuse_an_unknown_key_in_back(): void
    {
        $this->assertMountFails('CompactBar', [...['title' => 'Account'], 'back' => ['href' => '/a', 'label' => 'A', 'icon' => 'x']], 'Cannot mount the "back" prop of the MobileNavigation:CompactBar component');
    }

    #[Test]
    public function it_should_require_title(): void
    {
        $data = ['title' => 'Account'];
        unset($data['title']);
        $this->assertMountFails('CompactBar', $data, 'There is no "title" prop for the MobileNavigation:CompactBar component.');
        $this->assertMountFails('CompactBar', [...$data, 'title' => null], 'There is no "title" prop for the MobileNavigation:CompactBar component.');
    }

    #[Test]
    public function it_should_put_free_html_attributes_on_the_root(): void
    {
        $root = $this->renderComponent('CompactBar', [...['title' => 'Account'], 'role' => 'note', 'data-foo' => 'bar'])->filter('.rm-mnb-compact-bar')->first();

        self::assertSame('note', $root->attr('role'));
        self::assertSame('bar', $root->attr('data-foo'));
    }
}
