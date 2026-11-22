<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Tests\Integration\Twig\Component;

use PHPUnit\Framework\Attributes\Test;
use RomainMillan\MobileNavigation\Model\HttpMethod;
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
    public function it_should_mount_the_swipe_actions_controller_without_value(): void
    {
        $row = $this->renderComponent('ListRow', ['title' => 'Groceries', 'swipe' => $this->swipe()])->filter('.rm-mnb-list-row');

        self::assertSame(self::PREFIX.'swipe-actions', $row->attr('data-controller'));
        self::assertNull($row->attr('data-'.self::PREFIX.'swipe-actions-actions-value'));
        self::assertNull($row->attr('data-'.self::PREFIX.'swipe-actions-csrf-token-value'));
    }

    #[Test]
    public function it_should_put_the_row_and_its_actions_in_one_snap_track(): void
    {
        $track = $this->renderComponent('ListRow', ['title' => 'Groceries', 'href' => '/transactions/1', 'swipe' => $this->swipe()])->filter('.rm-mnb-list-row > .rm-mnb-swipe');

        self::assertSame('track', $track->attr('data-'.self::PREFIX.'swipe-actions-target'));
        self::assertCount(1, $track->filter('.rm-mnb-swipe__content > a.rm-mnb-list-row__main'));
        self::assertCount(1, $track->filter('.rm-mnb-swipe__content + .rm-mnb-swipe-actions[role="group"]'));
    }

    #[Test]
    public function it_should_name_the_actions_button_and_panel_after_the_row(): void
    {
        $row = $this->renderComponent('ListRow', ['title' => 'Groceries', 'swipe' => $this->swipe()]);
        $toggle = $row->filter('button.rm-mnb-swipe__toggle');
        $panel = $row->filter('.rm-mnb-swipe-actions');

        self::assertSame('Show the actions for Groceries', $toggle->attr('aria-label'));
        self::assertSame('false', $toggle->attr('aria-expanded'));
        self::assertNotNull($toggle->attr('hidden'));
        self::assertSame($panel->attr('id'), $toggle->attr('aria-controls'));
        self::assertMatchesRegularExpression('/^rm-mnb-swipe-[0-9a-f]{12}$/', (string) $panel->attr('id'));
        self::assertSame('Actions for Groceries', $panel->attr('aria-label'));
    }

    #[Test]
    public function it_should_render_a_link_action(): void
    {
        $link = $this->renderComponent('ListRow', ['title' => 'Groceries', 'swipe' => $this->swipe()])->filter('.rm-mnb-swipe-actions a');

        self::assertSame('/transactions/1/edit', $link->attr('href'));
        self::assertSame('rm-mnb-swipe-actions__button rm-mnb-tone--accent', $link->attr('class'));
        self::assertSame('icon-edit', $link->filter('i')->attr('class'));
        self::assertSame('Edit', $link->filter('.rm-mnb-swipe-actions__label')->text());
        self::assertNull($link->attr('data-action'));
    }

    #[Test]
    public function it_should_let_a_link_carry_its_return_path_on_click(): void
    {
        $swipe = SwipeActions::createFromActions([SwipeAction::linkCarryingReturnPath('/transactions/1/edit', 'icon-edit', Tone::Accent, new TranslatableMessage('Edit'))], 'token');

        $link = $this->renderComponent('ListRow', ['title' => 'Groceries', 'swipe' => $swipe])->filter('.rm-mnb-swipe-actions a');

        self::assertSame('click->'.self::PREFIX.'swipe-actions#carryReturnPath', $link->attr('data-action'));
    }

    #[Test]
    public function it_should_render_a_writing_action_as_a_post_form(): void
    {
        $form = $this->renderComponent('ListRow', ['title' => 'Groceries', 'swipe' => $this->swipe()])->filter('form[action="/transactions/1/ack"]');

        self::assertSame('post', $form->attr('method'));
        self::assertSame('token', $form->filter('input[name="_token"]')->attr('value'));
        self::assertSame('', $form->filter('input[name="_redirect"]')->attr('value'));
        self::assertCount(0, $form->filter('input[name="_method"]'));
        self::assertNull($form->attr('data-controller'));
        self::assertSame('submit', $form->filter('button')->attr('type'));
    }

    #[Test]
    public function it_should_confirm_a_destructive_action_and_spoof_its_method(): void
    {
        $form = $this->renderComponent('ListRow', ['title' => 'Groceries', 'swipe' => $this->swipe()])->filter('form[action="/transactions/1"]');

        self::assertSame('DELETE', $form->filter('input[name="_method"]')->attr('value'));
        self::assertSame(self::PREFIX.'confirm-submit', $form->attr('data-controller'));
        self::assertSame('Delete', $form->attr('data-'.self::PREFIX.'confirm-submit-title-value'));
        self::assertSame('Gone for good.', $form->attr('data-'.self::PREFIX.'confirm-submit-message-value'));
        self::assertSame('Delete', $form->attr('data-'.self::PREFIX.'confirm-submit-confirm-label-value'));
        self::assertSame('rm-mnb-swipe-actions__button rm-mnb-tone--negative', $form->filter('button')->attr('class'));
    }

    #[Test]
    public function it_should_escape_the_action_texts(): void
    {
        $swipe = SwipeActions::createFromActions([SwipeAction::link('/x', 'icon', Tone::Accent, new TranslatableMessage('<b>X</b>'))], 'to"ken');

        $html = $this->renderTwigComponent('MobileNavigation:ListRow', ['title' => '<i>G</i>', 'swipe' => $swipe])->toString();

        self::assertStringNotContainsString('<b>', $html);
        self::assertStringNotContainsString('<i>G', $html);
        self::assertStringContainsString('&lt;b&gt;X&lt;/b&gt;', $html);
    }

    #[Test]
    public function it_should_mount_no_swipe_controller_without_action(): void
    {
        foreach ([[], ['swipe' => null], ['swipe' => ['actions' => [], 'csrfToken' => '']], ['swipe' => SwipeActions::createEmpty()]] as $swipe) {
            $html = $this->renderTwigComponent('MobileNavigation:ListRow', ['title' => 'Groceries', ...$swipe])->toString();

            self::assertStringNotContainsString('data-controller', $html);
            self::assertStringNotContainsString('rm-mnb-swipe', $html);
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
        self::assertSame('button', $handle->nodeName());
        self::assertSame('button', $handle->attr('type'));
        self::assertCount(1, $handle->filter('.rm-mnb-icon--grip'));
        self::assertStringContainsString('data-app--sortable-target="handle"', $html);
        self::assertCount(0, $this->renderComponent('ListRow', ['title' => 'Groceries'])->filter('.rm-mnb-list-row__reorder'));
        $this->assertMountFails('ListRow', ['title' => 'Groceries', 'reorder' => ['label' => 'Move', 'icon' => 'x']], 'Cannot mount the "reorder" prop');
    }

    #[Test]
    public function it_should_render_the_caption_under_the_value(): void
    {
        $trailing = $this->renderComponent('ListRow', [
            'title' => 'Checking',
            'value' => ['text' => '1 250,00 €'],
            'caption' => ['text' => '1 100,00 € projected', 'tone' => 'warning'],
            'captionAttributes' => ['data-maskable' => true],
        ])->filter('.rm-mnb-list-row__trailing');

        $caption = $trailing->filter('.rm-mnb-list-row__value + .rm-mnb-list-row__caption');
        self::assertSame('1 100,00 € projected', $caption->text());
        self::assertStringContainsString('rm-mnb-tone--warning', (string) $caption->attr('class'));
        self::assertSame('', $caption->attr('data-maskable'));
        self::assertNull($trailing->filter('.rm-mnb-list-row__value')->attr('data-maskable'));

        $alone = $this->renderComponent('ListRow', ['title' => 'Checking', 'caption' => ['text' => 'Closed', 'tone' => 'xyz']])->filter('.rm-mnb-list-row__trailing .rm-mnb-list-row__caption');
        self::assertStringContainsString('rm-mnb-tone--neutral', (string) $alone->attr('class'));
        $this->assertMountFails('ListRow', ['title' => 'Checking', 'caption' => ['text' => '1', 'maskable' => true]], 'Cannot mount the "caption" prop');
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

    private function swipe(): SwipeActions
    {
        return SwipeActions::createFromActions([
            SwipeAction::link('/transactions/1/edit', 'icon-edit', Tone::Accent, new TranslatableMessage('Edit')),
            SwipeAction::post('/transactions/1/ack', 'icon-check', Tone::Positive, new TranslatableMessage('Acknowledge')),
            SwipeAction::destructive('/transactions/1', 'icon-trash', new TranslatableMessage('Delete'), new TranslatableMessage('Gone for good.'), HttpMethod::Delete),
        ], 'token');
    }
}
