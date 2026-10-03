<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Tests\Integration\Twig\Component;

use PHPUnit\Framework\Attributes\Test;

final class ActionsDiscTest extends ComponentTestCase
{
    #[Test]
    public function it_should_toggle_the_action_sheet_with_the_bundle_dots(): void
    {
        $disc = $this->renderComponent('ActionsDisc', ['sheet' => 'page-actions'])->filter('button.rm-mnb-glass-disc');

        self::assertSame('More actions', $disc->attr('aria-label'));
        self::assertSame('page-actions', $disc->attr('aria-controls'));
        self::assertSame(self::PREFIX.'emit-event', $disc->attr('data-controller'));
        self::assertSame('page-actions:toggle', $disc->attr('data-'.self::PREFIX.'emit-event-name-value'));
        self::assertCount(1, $disc->filter('.rm-mnb-icon-slot > .rm-mnb-icon--more'));
        self::assertCount(0, $disc->filter('i'));
    }

    #[Test]
    public function it_should_render_the_app_icon_and_label(): void
    {
        $disc = $this->renderComponent('ActionsDisc', [...['sheet' => 'page-actions'], 'label' => 'Account actions', 'icon' => 'icon-dots'])->filter('button');

        self::assertSame('Account actions', $disc->attr('aria-label'));
        self::assertSame('icon-dots', $disc->filter('.rm-mnb-icon-slot > i')->attr('class'));
    }

    #[Test]
    public function it_should_require_sheet(): void
    {
        $data = ['sheet' => 'page-actions'];
        unset($data['sheet']);
        $this->assertMountFails('ActionsDisc', $data, 'There is no "sheet" prop for the MobileNavigation:ActionsDisc component.');
        $this->assertMountFails('ActionsDisc', [...$data, 'sheet' => null], 'There is no "sheet" prop for the MobileNavigation:ActionsDisc component.');
    }

    #[Test]
    public function it_should_put_free_html_attributes_on_the_root(): void
    {
        $root = $this->renderComponent('ActionsDisc', [...['sheet' => 'page-actions'], 'role' => 'note', 'data-foo' => 'bar'])->filter('button');

        self::assertSame('note', $root->attr('role'));
        self::assertSame('bar', $root->attr('data-foo'));
    }
}
