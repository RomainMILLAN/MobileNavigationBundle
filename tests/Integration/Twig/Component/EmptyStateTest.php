<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Tests\Integration\Twig\Component;

use PHPUnit\Framework\Attributes\Test;

final class EmptyStateTest extends ComponentTestCase
{
    #[Test]
    public function it_should_render_its_title_only(): void
    {
        $state = $this->renderComponent('EmptyState', ['title' => 'No loan yet'])->filter('.rm-mnb-empty-state');

        self::assertSame('No loan yet', $state->filter('.rm-mnb-empty-state__title')->text());
        self::assertCount(0, $state->filter('.rm-mnb-empty-state__icon, .rm-mnb-empty-state__message, a'));
    }

    #[Test]
    public function it_should_render_its_icon_message_and_action(): void
    {
        $state = $this->renderComponent('EmptyState', [...['title' => 'No loan yet'], 'icon' => 'icon-loan', 'message' => 'Add one to follow it.', 'action' => ['href' => '/loans/new', 'label' => 'New loan']])->filter('.rm-mnb-empty-state');

        self::assertSame('icon-loan', $state->filter('.rm-mnb-empty-state__icon .rm-mnb-icon-slot > i')->attr('class'));
        self::assertSame('Add one to follow it.', $state->filter('.rm-mnb-empty-state__message')->text());
        self::assertSame('/loans/new', $state->filter('a.rm-mnb-empty-state__action')->attr('href'));
        self::assertSame('New loan', $state->filter('a')->text());
    }

    #[Test]
    public function it_should_refuse_an_unknown_key_in_action(): void
    {
        $this->assertMountFails('EmptyState', [...['title' => 'No loan yet'], 'action' => ['href' => '/x', 'label' => 'X', 'icon' => 'y']], 'Cannot mount the "action" prop of the MobileNavigation:EmptyState component');
    }

    #[Test]
    public function it_should_require_title(): void
    {
        $data = ['title' => 'No loan yet'];
        unset($data['title']);
        $this->assertMountFails('EmptyState', $data, 'There is no "title" prop for the MobileNavigation:EmptyState component.');
        $this->assertMountFails('EmptyState', [...$data, 'title' => null], 'There is no "title" prop for the MobileNavigation:EmptyState component.');
    }

    #[Test]
    public function it_should_put_free_html_attributes_on_the_root(): void
    {
        $root = $this->renderComponent('EmptyState', [...['title' => 'No loan yet'], 'role' => 'note', 'data-foo' => 'bar'])->filter('.rm-mnb-empty-state');

        self::assertSame('note', $root->attr('role'));
        self::assertSame('bar', $root->attr('data-foo'));
    }
}
