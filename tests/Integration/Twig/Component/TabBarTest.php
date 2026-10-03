<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Tests\Integration\Twig\Component;

use PHPUnit\Framework\Attributes\Test;
use Symfony\UX\StimulusBundle\Dto\StimulusAttributes;

use function Symfony\Component\String\u;

final class TabBarTest extends ComponentTestCase
{
    /**
     * @param array<string, mixed> $fab
     *
     * @return array<string, mixed>
     */
    private function props(array $fab = ['label' => 'Add', 'icon' => 'icon-plus', 'href' => '/new']): array
    {
        return [
            'label' => 'Main navigation',
            'tabs' => [
                ['href' => '/', 'label' => 'Home', 'icon' => 'icon-home', 'current' => true],
                ['href' => '/accounts', 'label' => 'Accounts', 'icon' => 'icon-bank'],
            ],
            'fab' => $fab,
        ];
    }

    #[Test]
    public function it_should_render_the_tabs_and_mark_the_current_one(): void
    {
        $crawler = $this->renderComponent('TabBar', $this->props());

        self::assertSame(self::PREFIX.'tab-bar', $crawler->filter('.rm-mnb-tab-bar-layer')->attr('data-controller'));
        self::assertSame('Main navigation', $crawler->filter('nav')->attr('aria-label'));
        $tabs = $crawler->filter('a.rm-mnb-tab-bar__tab');
        self::assertCount(2, $tabs);
        self::assertSame('page', $tabs->eq(0)->attr('aria-current'));
        self::assertNull($tabs->eq(1)->attr('aria-current'));
        self::assertSame('icon-bank', $tabs->eq(1)->filter('.rm-mnb-icon-slot > i')->attr('class'));
        self::assertSame('tab', $tabs->eq(1)->attr('data-'.self::PREFIX.'tab-bar-target'));
        self::assertCount(0, $crawler->filter('button.rm-mnb-tab-bar__tab'));
    }

    #[Test]
    public function it_should_render_the_more_tab_as_a_sheet_toggle(): void
    {
        $more = $this->renderComponent('TabBar', [...$this->props(), 'more' => ['sheet' => 'more-sheet', 'label' => 'More', 'icon' => 'icon-dots']])->filter('button.rm-mnb-tab-bar__tab');

        self::assertSame('more-sheet', $more->attr('aria-controls'));
        self::assertSame(self::PREFIX.'emit-event', $more->attr('data-controller'));
        self::assertSame('more-sheet:toggle', $more->attr('data-'.self::PREFIX.'emit-event-name-value'));
        self::assertSame('icon-dots', $more->filter('i')->attr('class'));
    }

    #[Test]
    public function it_should_render_the_fab_as_a_link(): void
    {
        $fab = $this->renderComponent('TabBar', $this->props())->filter('.rm-mnb-tab-bar-fab');

        self::assertSame('a', $fab->nodeName());
        self::assertSame('/new', $fab->attr('href'));
        self::assertSame('Add', $fab->attr('aria-label'));
        self::assertSame('icon-plus', $fab->filter('.rm-mnb-icon-slot > i')->attr('class'));
    }

    #[Test]
    public function it_should_render_the_fab_as_a_sheet_toggle(): void
    {
        $fab = $this->renderComponent('TabBar', $this->props(['label' => 'Add', 'icon' => 'icon-plus', 'sheet' => 'add-sheet']))->filter('.rm-mnb-tab-bar-fab');

        self::assertSame('button', $fab->nodeName());
        self::assertSame('add-sheet', $fab->attr('aria-controls'));
        self::assertSame(self::PREFIX.'emit-event', $fab->attr('data-controller'));
        self::assertSame('click->'.self::PREFIX.'emit-event#emit', $fab->attr('data-action'));
        self::assertSame('icon-plus', $fab->filter('i')->attr('class'));
    }

    #[Test]
    public function it_should_disable_the_fab_without_href_nor_sheet(): void
    {
        $fab = $this->renderComponent('TabBar', $this->props(['label' => 'Add', 'icon' => 'icon-plus']))->filter('.rm-mnb-tab-bar-fab');

        self::assertSame('button', $fab->nodeName());
        self::assertNotNull($fab->attr('disabled'));
        self::assertSame('icon-plus', $fab->filter('i')->attr('class'));
    }

    #[Test]
    public function it_should_chain_the_app_attributes_and_the_sheet_toggle_in_one_controller(): void
    {
        $fabAttributes = $this->stimulusAttributes();
        $fabAttributes->addController('app--gesture', ['label' => '"><script>']);

        $html = $this->renderTwigComponent('MobileNavigation:TabBar', [...$this->props(['label' => 'Add', 'icon' => 'icon-plus', 'sheet' => 'add-sheet']), 'fabAttributes' => $fabAttributes])->toString();
        $fab = $this->renderComponent('TabBar', [...$this->props(['label' => 'Add', 'icon' => 'icon-plus', 'sheet' => 'add-sheet']), 'fabAttributes' => $this->gestureAttributes()])->filter('.rm-mnb-tab-bar-fab');

        // On the raw tag: a parsed DOM would silently drop a duplicated attribute.
        $fabTag = u($html)->after('class="rm-mnb-tab-bar-fab"')->before('>');
        self::assertCount(2, $fabTag->split('data-controller='));
        self::assertSame('app--gesture '.self::PREFIX.'emit-event', $fab->attr('data-controller'));
        self::assertStringNotContainsString('"><script>', $html);
        self::assertStringContainsString('&quot;&gt;&lt;script&gt;', $html);
    }

    #[Test]
    public function it_should_escape_the_app_attributes_on_the_fab_link(): void
    {
        $fabAttributes = $this->stimulusAttributes();
        $fabAttributes->addController('app--gesture', ['label' => '"><script>']);

        $html = $this->renderTwigComponent('MobileNavigation:TabBar', [...$this->props(), 'fabAttributes' => $fabAttributes])->toString();

        self::assertStringNotContainsString('"><script>', $html);
        self::assertStringContainsString('data-controller="app--gesture"', $html);
    }

    #[Test]
    public function it_should_refuse_an_unknown_key_in_a_tab(): void
    {
        $props = [...$this->props(), 'tabs' => [['href' => '/', 'label' => 'Home', 'icon' => 'icon-home'], ['href' => '/x', 'label' => 'X', 'icon' => 'icon-x', 'badge' => 3]]];

        $this->assertMountFails('TabBar', $props, 'Cannot mount the "tabs" prop of the MobileNavigation:TabBar component');
    }

    #[Test]
    public function it_should_refuse_an_unknown_key_in_fab_or_more(): void
    {
        $this->assertMountFails('TabBar', $this->props(['label' => 'Add', 'icon' => 'icon-plus', 'url' => '/new']), 'Cannot mount the "fab" prop');
        $this->assertMountFails('TabBar', [...$this->props(), 'more' => ['sheet' => 's', 'label' => 'More']], 'Cannot mount the "more" prop');
    }

    #[Test]
    public function it_should_require_label_tabs_and_fab(): void
    {
        foreach (['label', 'tabs', 'fab'] as $prop) {
            $props = $this->props();
            unset($props[$prop]);
            $this->assertMountFails('TabBar', $props, \sprintf('There is no "%s" prop for the MobileNavigation:TabBar component.', $prop));
            $this->assertMountFails('TabBar', [...$props, $prop => null], \sprintf('There is no "%s" prop for the MobileNavigation:TabBar component.', $prop));
        }
    }

    #[Test]
    public function it_should_put_free_html_attributes_on_the_root(): void
    {
        $root = $this->renderComponent('TabBar', [...$this->props(), 'role' => 'presentation', 'data-foo' => 'bar'])->filter('.rm-mnb-tab-bar-layer');

        self::assertSame('presentation', $root->attr('role'));
        self::assertSame('bar', $root->attr('data-foo'));
    }

    private function gestureAttributes(): StimulusAttributes
    {
        $attributes = $this->stimulusAttributes();
        $attributes->addController('app--gesture');

        return $attributes;
    }
}
