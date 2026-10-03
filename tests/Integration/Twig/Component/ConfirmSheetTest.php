<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Tests\Integration\Twig\Component;

use PHPUnit\Framework\Attributes\Test;

final class ConfirmSheetTest extends ComponentTestCase
{
    #[Test]
    public function it_should_mount_the_sheet_and_confirm_controllers_on_one_element(): void
    {
        $sheet = $this->renderComponent('ConfirmSheet')->filter('#rm-mnb-confirm');

        self::assertSame('alertdialog', $sheet->attr('role'));
        self::assertSame(self::PREFIX.'sheet '.self::PREFIX.'confirm-sheet', $sheet->attr('data-controller'));
        self::assertSame('rm-mnb-confirm', $sheet->attr('data-'.self::PREFIX.'confirm-sheet-sheet-value'));
        self::assertSame('rm-mnb-confirm-title', $sheet->attr('aria-labelledby'));
        self::assertSame('rm-mnb-confirm-message', $sheet->attr('aria-describedby'));
        self::assertSame('Close', trim($sheet->filter('.rm-mnb-confirm__button:not(.rm-mnb-confirm__button--destructive)')->text()));
    }

    #[Test]
    public function it_should_accept_another_id(): void
    {
        self::assertCount(1, $this->renderComponent('ConfirmSheet', ['id' => 'confirm-2', 'forceCloseEvents' => []])->filter('#confirm-2'));
    }

    #[Test]
    public function it_should_put_free_html_attributes_on_the_root(): void
    {
        $root = $this->renderComponent('ConfirmSheet', [...[], 'lang' => 'fr', 'data-foo' => 'bar'])->filter('body > *')->first();

        self::assertSame('fr', $root->attr('lang'));
        self::assertSame('bar', $root->attr('data-foo'));
    }
}
