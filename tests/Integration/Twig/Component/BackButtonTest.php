<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Tests\Integration\Twig\Component;

use PHPUnit\Framework\Attributes\Test;

final class BackButtonTest extends ComponentTestCase
{
    #[Test]
    public function it_should_render_a_glass_disc_that_speaks_the_parent_name(): void
    {
        $link = $this->renderComponent('BackButton', ['href' => '/accounts', 'label' => 'Accounts'])->filter('a.rm-mnb-back');

        self::assertSame('/accounts', $link->attr('href'));
        self::assertStringContainsString('rm-mnb-glass-disc', (string) $link->attr('class'));
        self::assertSame('Back to Accounts', $link->attr('aria-label'));
        self::assertCount(1, $link->filter('.rm-mnb-icon--back'));
    }

    #[Test]
    public function it_should_require_href(): void
    {
        $data = ['href' => '/accounts', 'label' => 'Accounts'];
        unset($data['href']);
        $this->assertMountFails('BackButton', $data, 'There is no "href" prop for the MobileNavigation:BackButton component.');
        $this->assertMountFails('BackButton', [...$data, 'href' => null], 'There is no "href" prop for the MobileNavigation:BackButton component.');
    }

    #[Test]
    public function it_should_require_label(): void
    {
        $data = ['href' => '/accounts', 'label' => 'Accounts'];
        unset($data['label']);
        $this->assertMountFails('BackButton', $data, 'There is no "label" prop for the MobileNavigation:BackButton component.');
        $this->assertMountFails('BackButton', [...$data, 'label' => null], 'There is no "label" prop for the MobileNavigation:BackButton component.');
    }

    #[Test]
    public function it_should_put_free_html_attributes_on_the_root(): void
    {
        $root = $this->renderComponent('BackButton', [...['href' => '/accounts', 'label' => 'Accounts'], 'role' => 'note', 'data-foo' => 'bar'])->filter('body > *')->first();

        self::assertSame('note', $root->attr('role'));
        self::assertSame('bar', $root->attr('data-foo'));
    }
}
