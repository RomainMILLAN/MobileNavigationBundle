<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Tests\Integration\Twig\Component;

use PHPUnit\Framework\Attributes\Test;
use RomainMillan\MobileNavigation\Model\SwipeAction;
use RomainMillan\MobileNavigation\Model\SwipeActions;
use RomainMillan\MobileNavigation\Model\Tone;
use Symfony\Component\Translation\TranslatableMessage;

use function Symfony\Component\String\u;

final class ListRowTest extends ComponentTestCase
{
    #[Test]
    public function it_should_render_a_link_row_with_its_defaults(): void
    {
        $row = $this->renderComponent('ListRow', ['title' => 'Groceries', 'href' => '/transactions/1'])->filter('.rm-mnb-list-row');

        $main = $row->filter('a.rm-mnb-list-row__main');
        self::assertSame('/transactions/1', $main->attr('href'));
        self::assertSame('_top', $main->attr('data-turbo-frame'));
        self::assertSame('Groceries', $row->filter('.rm-mnb-list-row__title')->text());
        self::assertCount(1, $row->filter('.rm-mnb-list-row__chevron'));
        self::assertCount(0, $row->filter('.rm-mnb-chip, .rm-mnb-list-row__subtitle, .rm-mnb-list-row__trailing, .rm-mnb-list-row__select'));
        self::assertNull($row->attr('data-controller'));
    }

    #[Test]
    public function it_should_render_an_information_row_without_link(): void
    {
        $row = $this->renderComponent('ListRow', ['title' => 'Groceries'])->filter('.rm-mnb-list-row');

        self::assertCount(1, $row->filter('div.rm-mnb-list-row__main--static'));
        self::assertCount(0, $row->filter('a, .rm-mnb-list-row__chevron'));
    }

    #[Test]
    public function it_should_render_all_its_parts(): void
    {
        $row = $this->renderComponent('ListRow', [
            'title' => 'Groceries',
            'href' => '/transactions/1',
            'titleStrike' => true,
            'subtitle' => '12/10/2026',
            'leading' => ['icon' => 'icon-cart', 'tone' => 'negative'],
            'value' => ['text' => '-12.00', 'tone' => 'negative'],
            'badge' => ['label' => 'Pending', 'tone' => 'warning'],
            'chevron' => false,
            'turboFrame' => 'page-2',
        ])->filter('.rm-mnb-list-row');

        self::assertStringContainsString('rm-mnb-list-row__title--strike', (string) $row->filter('.rm-mnb-list-row__title')->attr('class'));
        self::assertSame('12/10/2026', $row->filter('.rm-mnb-list-row__subtitle')->text());
        self::assertStringContainsString('rm-mnb-tone--negative', (string) $row->filter('.rm-mnb-chip')->attr('class'));
        self::assertSame('icon-cart', $row->filter('.rm-mnb-chip .rm-mnb-icon-slot > i')->attr('class'));
        self::assertSame('-12.00', $row->filter('.rm-mnb-list-row__value')->text());
        self::assertStringContainsString('rm-mnb-tone--negative', (string) $row->filter('.rm-mnb-list-row__value')->attr('class'));
        self::assertSame('Pending', $row->filter('.rm-mnb-badge')->text());
        self::assertStringContainsString('rm-mnb-tone--warning', (string) $row->filter('.rm-mnb-badge')->attr('class'));
        self::assertCount(0, $row->filter('.rm-mnb-list-row__chevron'));
        self::assertSame('page-2', $row->filter('a')->attr('data-turbo-frame'));
    }

    #[Test]
    public function it_should_fall_back_to_the_neutral_tone(): void
    {
        $row = $this->renderComponent('ListRow', ['title' => 'Groceries', 'leading' => ['icon' => 'icon-cart', 'tone' => 'xyz'], 'value' => ['text' => '1'], 'badge' => ['label' => 'B', 'tone' => Tone::Info]])->filter('.rm-mnb-list-row');

        self::assertStringContainsString('rm-mnb-tone--neutral', (string) $row->filter('.rm-mnb-chip')->attr('class'));
        self::assertStringContainsString('rm-mnb-tone--neutral', (string) $row->filter('.rm-mnb-list-row__value')->attr('class'));
        self::assertStringContainsString('rm-mnb-tone--info', (string) $row->filter('.rm-mnb-badge')->attr('class'));
    }

    #[Test]
    public function it_should_put_the_value_attributes_on_the_value_only(): void
    {
        $row = $this->renderComponent('ListRow', ['title' => 'Groceries', 'value' => ['text' => '12.00'], 'valueAttributes' => ['data-maskable' => true]])->filter('.rm-mnb-list-row');

        self::assertSame('', $row->filter('.rm-mnb-list-row__value')->attr('data-maskable'));
        self::assertNull($row->attr('data-maskable'));
        self::assertCount(1, $row->filter('[data-maskable]'));
    }

    #[Test]
    public function it_should_render_no_stray_attribute_without_value_attributes(): void
    {
        $html = $this->renderTwigComponent('MobileNavigation:ListRow', ['title' => 'Groceries', 'value' => ['text' => '12.00']])->toString();

        self::assertStringContainsString('<span class="rm-mnb-list-row__value rm-mnb-tone--neutral">12.00</span>', $html);
    }

    #[Test]
    public function it_should_mount_the_swipe_actions(): void
    {
        $row = $this->renderComponent('ListRow', ['title' => 'Groceries', 'swipe' => [
            'actions' => [SwipeAction::link('/transactions/1/edit', 'icon-edit', Tone::Accent, new TranslatableMessage('Edit'))],
            'csrfToken' => 'token',
        ]])->filter('.rm-mnb-list-row');

        self::assertSame(self::PREFIX.'swipe-actions', $row->attr('data-controller'));
        self::assertSame('[{"url":"\/transactions\/1\/edit","icon":"icon-edit","tone":"accent","label":"Edit"}]', $row->attr('data-'.self::PREFIX.'swipe-actions-actions-value'));
        self::assertSame('token', $row->attr('data-'.self::PREFIX.'swipe-actions-csrf-token-value'));
    }

    #[Test]
    public function it_should_mount_no_swipe_controller_without_action(): void
    {
        foreach ([[], ['swipe' => null], ['swipe' => ['actions' => [], 'csrfToken' => '']], ['swipe' => SwipeActions::createEmpty()]] as $swipe) {
            $html = $this->renderTwigComponent('MobileNavigation:ListRow', ['title' => 'Groceries', ...$swipe])->toString();

            self::assertStringNotContainsString('data-controller', $html);
            self::assertStringNotContainsString('csrf', $html);
        }
    }

    #[Test]
    public function it_should_keep_the_app_controller_next_to_the_swipe_controller(): void
    {
        $row = $this->renderComponent('ListRow', ['title' => 'Groceries', 'data-controller' => 'app--row', 'swipe' => SwipeActions::createFromActions([SwipeAction::link('/x', 'icon', Tone::Accent, new TranslatableMessage('X'))], 'token')])->filter('.rm-mnb-list-row');

        self::assertSame(self::PREFIX.'swipe-actions app--row', $row->attr('data-controller'));
    }

    #[Test]
    public function it_should_refuse_swipe_actions_without_token(): void
    {
        $this->assertMountFails('ListRow', ['title' => 'Groceries', 'swipe' => ['actions' => [SwipeAction::link('/x', 'icon', Tone::Accent, new TranslatableMessage('X'))], 'csrfToken' => '']], 'Cannot mount swipe actions without a CSRF token.');
    }

    #[Test]
    public function it_should_render_the_selection_checkbox_with_the_app_attributes_escaped(): void
    {
        $attributes = $this->stimulusAttributes();
        $attributes->addAction('app--bulk', 'toggle', null, ['id' => '"><script>']);

        $html = $this->renderTwigComponent('MobileNavigation:ListRow', ['title' => 'Groceries', 'selectable' => ['name' => 'ids[]', 'value' => 12, 'label' => 'Select Groceries', 'attributes' => $attributes]])->toString();
        $checkbox = $this->renderComponent('ListRow', ['title' => 'Groceries', 'selectable' => ['name' => 'ids[]', 'value' => 12, 'label' => 'Select Groceries']])->filter('.rm-mnb-list-row__select input');

        self::assertSame('ids[]', $checkbox->attr('name'));
        self::assertSame('12', $checkbox->attr('value'));
        self::assertSame('Select Groceries', $checkbox->attr('aria-label'));
        self::assertStringContainsString('data-action="app--bulk#toggle"', $html);
        self::assertStringNotContainsString('"><script>', $html);
        self::assertTrue(u($html)->containsAny('&quot;&gt;&lt;script&gt;'));
    }

    #[Test]
    public function it_should_refuse_an_unknown_key_in_a_structured_prop(): void
    {
        $this->assertMountFails('ListRow', ['title' => 'Groceries', 'value' => ['text' => '1', 'maskable' => true]], 'Cannot mount the "value" prop of the MobileNavigation:ListRow component');
        $this->assertMountFails('ListRow', ['title' => 'Groceries', 'leading' => ['tone' => 'accent']], 'Cannot mount the "leading" prop');
        $this->assertMountFails('ListRow', ['title' => 'Groceries', 'badge' => 'Pending'], 'Cannot mount the "badge" prop');
        $this->assertMountFails('ListRow', ['title' => 'Groceries', 'swipe' => ['actions' => []]], 'Cannot mount the "swipe" prop');
        $this->assertMountFails('ListRow', ['title' => 'Groceries', 'selectable' => ['name' => 'x', 'value' => 'y']], 'Cannot mount the "selectable" prop');
    }

    #[Test]
    public function it_should_render_the_reorder_handle_with_the_app_attributes(): void
    {
        $attributes = $this->stimulusAttributes();
        $attributes->addTarget('app--sortable', 'handle');

        $html = $this->renderTwigComponent('MobileNavigation:ListRow', ['title' => 'Groceries', 'reorder' => ['label' => 'Move Groceries', 'attributes' => $attributes]])->toString();
        $handle = $this->renderComponent('ListRow', ['title' => 'Groceries', 'reorder' => ['label' => 'Move Groceries']])->filter('.rm-mnb-list-row__reorder');

        self::assertSame('Move Groceries', $handle->attr('aria-label'));
        self::assertSame('button', $handle->attr('role'));
        self::assertCount(1, $handle->filter('.rm-mnb-icon--grip'));
        self::assertStringContainsString('data-app--sortable-target="handle"', $html);
        self::assertCount(0, $this->renderComponent('ListRow', ['title' => 'Groceries'])->filter('.rm-mnb-list-row__reorder'));
        $this->assertMountFails('ListRow', ['title' => 'Groceries', 'reorder' => ['label' => 'Move', 'icon' => 'x']], 'Cannot mount the "reorder" prop');
    }

    #[Test]
    public function it_should_require_title(): void
    {
        $this->assertMountFails('ListRow', [], 'There is no "title" prop for the MobileNavigation:ListRow component.');
        $this->assertMountFails('ListRow', ['title' => null], 'There is no "title" prop for the MobileNavigation:ListRow component.');
    }

    #[Test]
    public function it_should_put_free_html_attributes_on_the_root(): void
    {
        $row = $this->renderComponent('ListRow', ['title' => 'Groceries', 'role' => 'listitem', 'data-foo' => 'bar'])->filter('.rm-mnb-list-row');

        self::assertSame('listitem', $row->attr('role'));
        self::assertSame('bar', $row->attr('data-foo'));
    }
}
