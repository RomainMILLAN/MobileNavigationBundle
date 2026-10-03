<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Tests\Integration\Twig\Component;

use PHPUnit\Framework\Attributes\Test;

final class SheetTest extends ComponentTestCase
{
    #[Test]
    public function it_should_render_a_dialog_driven_by_its_id(): void
    {
        $sheet = $this->renderComponent('Sheet', ['id' => 'more', 'title' => 'More'])->filter('#more');

        self::assertSame('dialog', $sheet->attr('role'));
        self::assertSame('true', $sheet->attr('aria-modal'));
        self::assertSame('more-title', $sheet->attr('aria-labelledby'));
        self::assertSame(self::PREFIX.'sheet', $sheet->attr('data-controller'));
        self::assertSame('more', $sheet->attr('data-'.self::PREFIX.'sheet-name-value'));
        self::assertSame('["turbo:before-cache"]', $sheet->attr('data-'.self::PREFIX.'sheet-force-close-events-value'));
        self::assertSame('More', $sheet->filter('h2.rm-mnb-sheet__title')->text());
        self::assertSame('Close', $sheet->filter('.rm-mnb-sheet__handle')->attr('aria-label'));
        self::assertSame('scroll', $sheet->filter('.rm-mnb-sheet__body')->attr('data-'.self::PREFIX.'sheet-target'));
        self::assertStringNotContainsString('rm-mnb-sheet--mobile-only', (string) $sheet->attr('class'));
    }

    #[Test]
    public function it_should_honour_its_options(): void
    {
        $sheet = $this->renderComponent('Sheet', [...['id' => 'more', 'title' => 'More'], 'titleHidden' => true, 'scrollable' => false, 'mobileOnly' => true, 'forceCloseEvents' => ['app:locked']])->filter('#more');

        self::assertNull($sheet->attr('role'));
        self::assertStringContainsString('rm-mnb-sheet--mobile-only', (string) $sheet->attr('class'));
        self::assertCount(1, $sheet->filter('h2.rm-mnb-visually-hidden'));
        self::assertNull($sheet->filter('.rm-mnb-sheet__body')->attr('data-'.self::PREFIX.'sheet-target'));
        self::assertSame('["app:locked"]', $sheet->attr('data-'.self::PREFIX.'sheet-force-close-events-value'));
    }

    #[Test]
    public function it_should_require_id(): void
    {
        $data = ['id' => 'more', 'title' => 'More'];
        unset($data['id']);
        $this->assertMountFails('Sheet', $data, 'There is no "id" prop for the MobileNavigation:Sheet component.');
        $this->assertMountFails('Sheet', [...$data, 'id' => null], 'There is no "id" prop for the MobileNavigation:Sheet component.');
    }

    #[Test]
    public function it_should_require_title(): void
    {
        $data = ['id' => 'more', 'title' => 'More'];
        unset($data['title']);
        $this->assertMountFails('Sheet', $data, 'There is no "title" prop for the MobileNavigation:Sheet component.');
        $this->assertMountFails('Sheet', [...$data, 'title' => null], 'There is no "title" prop for the MobileNavigation:Sheet component.');
    }

    #[Test]
    public function it_should_put_free_html_attributes_on_the_root(): void
    {
        $root = $this->renderComponent('Sheet', [...['id' => 'more', 'title' => 'More'], 'lang' => 'fr', 'data-foo' => 'bar'])->filter('body > *')->first();

        self::assertSame('fr', $root->attr('lang'));
        self::assertSame('bar', $root->attr('data-foo'));
    }
}
