<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Tests\Integration\Twig\Component;

use PHPUnit\Framework\Attributes\Test;

final class FilterBarTest extends ComponentTestCase
{
    #[Test]
    public function it_should_render_the_filter_button_only_without_field(): void
    {
        $bar = $this->renderComponent('FilterBar', ['form' => 'filters', 'sheet' => 'filter-sheet'])->filter('.rm-mnb-filter-bar');

        self::assertSame(self::PREFIX.'filter-bar', $bar->attr('data-controller'));
        self::assertSame('filters', $bar->attr('data-'.self::PREFIX.'filter-bar-form-value'));
        self::assertCount(0, $bar->filter('input'));
        $button = $bar->filter('button');
        self::assertSame('Filters', $button->attr('aria-label'));
        self::assertSame('filter-sheet', $button->attr('aria-controls'));
        self::assertSame('filter-sheet:toggle', $button->attr('data-'.self::PREFIX.'emit-event-name-value'));
        self::assertCount(0, $button->filter('.rm-mnb-filter-bar__count'));
    }

    #[Test]
    public function it_should_mirror_its_field_and_count_the_active_filters(): void
    {
        $bar = $this->renderComponent('FilterBar', [...['form' => 'filters', 'sheet' => 'filter-sheet'], 'field' => 'q', 'activeCount' => 2])->filter('.rm-mnb-filter-bar');

        self::assertSame('q', $bar->attr('data-'.self::PREFIX.'filter-bar-field-value'));
        self::assertSame('Search', $bar->filter('input')->attr('placeholder'));
        self::assertSame('Filters, 2 active filters', $bar->filter('button')->attr('aria-label'));
        self::assertSame('2', $bar->filter('.rm-mnb-filter-bar__count')->text());
    }

    #[Test]
    public function it_should_use_the_given_placeholder(): void
    {
        $input = $this->renderComponent('FilterBar', [...['form' => 'filters', 'sheet' => 'filter-sheet'], 'field' => 'q', 'placeholder' => 'Find'])->filter('input');

        self::assertSame('Find', $input->attr('placeholder'));
        self::assertSame('Find', $input->attr('aria-label'));
    }

    #[Test]
    public function it_should_require_form(): void
    {
        $data = ['form' => 'filters', 'sheet' => 'filter-sheet'];
        unset($data['form']);
        $this->assertMountFails('FilterBar', $data, 'There is no "form" prop for the MobileNavigation:FilterBar component.');
        $this->assertMountFails('FilterBar', [...$data, 'form' => null], 'There is no "form" prop for the MobileNavigation:FilterBar component.');
    }

    #[Test]
    public function it_should_require_sheet(): void
    {
        $data = ['form' => 'filters', 'sheet' => 'filter-sheet'];
        unset($data['sheet']);
        $this->assertMountFails('FilterBar', $data, 'There is no "sheet" prop for the MobileNavigation:FilterBar component.');
        $this->assertMountFails('FilterBar', [...$data, 'sheet' => null], 'There is no "sheet" prop for the MobileNavigation:FilterBar component.');
    }

    #[Test]
    public function it_should_put_free_html_attributes_on_the_root(): void
    {
        $root = $this->renderComponent('FilterBar', [...['form' => 'filters', 'sheet' => 'filter-sheet'], 'role' => 'note', 'data-foo' => 'bar'])->filter('body > *')->first();

        self::assertSame('note', $root->attr('role'));
        self::assertSame('bar', $root->attr('data-foo'));
    }
}
