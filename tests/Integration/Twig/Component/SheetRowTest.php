<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Tests\Integration\Twig\Component;

use PHPUnit\Framework\Attributes\Test;
use RomainMillan\MobileNavigation\Model\Tone;
use RomainMillan\MobileNavigation\Model\ValueAttributes;

final class SheetRowTest extends ComponentTestCase
{
    #[Test]
    public function it_should_render_a_button_by_default(): void
    {
        $row = $this->renderComponent('SheetRow', ['label' => 'Settings'])->filter('.rm-mnb-row');

        self::assertSame('button', $row->nodeName());
        self::assertSame('button', $row->attr('type'));
        self::assertSame('Settings', $row->filter('.rm-mnb-row__label')->text());
        self::assertCount(0, $row->filter('.rm-mnb-chip, .rm-mnb-row__value, .rm-mnb-badge, .rm-mnb-switch, .rm-mnb-row__check, .rm-mnb-row__chevron'));
    }

    #[Test]
    public function it_should_render_a_link_with_href(): void
    {
        $row = $this->renderComponent('SheetRow', ['label' => 'Profile', 'href' => '/profile', 'chevron' => true])->filter('.rm-mnb-row');

        self::assertSame('a', $row->nodeName());
        self::assertSame('/profile', $row->attr('href'));
        self::assertNull($row->attr('type'));
        self::assertCount(1, $row->filter('.rm-mnb-row__chevron'));
    }

    #[Test]
    public function it_should_render_a_static_row(): void
    {
        $row = $this->renderComponent('SheetRow', ['label' => 'Version', 'href' => '/x', 'static' => true])->filter('.rm-mnb-row');

        self::assertSame('div', $row->nodeName());
        self::assertStringContainsString('rm-mnb-row--static', (string) $row->attr('class'));
    }

    #[Test]
    public function it_should_keep_the_type_given_by_the_app(): void
    {
        self::assertSame('submit', $this->renderComponent('SheetRow', ['label' => 'Save', 'type' => 'submit'])->filter('.rm-mnb-row')->attr('type'));
    }

    #[Test]
    public function it_should_render_its_flags(): void
    {
        $row = $this->renderComponent('SheetRow', ['label' => 'Delete', 'danger' => true, 'checked' => true, 'switch' => true, 'badge' => 'New'])->filter('.rm-mnb-row');

        self::assertStringContainsString('rm-mnb-row--danger', (string) $row->attr('class'));
        self::assertCount(1, $row->filter('.rm-mnb-row__check'));
        self::assertCount(1, $row->filter('.rm-mnb-switch'));
        self::assertSame('New', $row->filter('.rm-mnb-badge')->text());
    }

    #[Test]
    public function it_should_render_the_chip_with_its_tone(): void
    {
        $chip = $this->renderComponent('SheetRow', ['label' => 'Bank', 'icon' => 'icon-bank', 'tone' => 'positive'])->filter('.rm-mnb-chip');

        self::assertStringContainsString('rm-mnb-tone--positive', (string) $chip->attr('class'));
        self::assertSame('icon-bank', $chip->filter('.rm-mnb-icon-slot > i')->attr('class'));
    }

    #[Test]
    public function it_should_fall_back_to_the_neutral_tone(): void
    {
        self::assertStringContainsString('rm-mnb-tone--neutral', (string) $this->renderComponent('SheetRow', ['label' => 'Bank', 'icon' => 'icon-bank', 'tone' => 'xyz'])->filter('.rm-mnb-chip')->attr('class'));
        self::assertStringContainsString('rm-mnb-tone--neutral', (string) $this->renderComponent('SheetRow', ['label' => 'Bank', 'icon' => 'icon-bank'])->filter('.rm-mnb-chip')->attr('class'));
    }

    #[Test]
    public function it_should_accept_a_tone_instance(): void
    {
        self::assertStringContainsString('rm-mnb-tone--positive', (string) $this->renderComponent('SheetRow', ['label' => 'Bank', 'icon' => 'icon-bank', 'tone' => Tone::Positive])->filter('.rm-mnb-chip')->attr('class'));
    }

    #[Test]
    public function it_should_put_the_value_attributes_on_the_value_only(): void
    {
        $row = $this->renderComponent('SheetRow', ['label' => 'Balance', 'value' => '12.00', 'valueAttributes' => ['data-maskable' => true]])->filter('.rm-mnb-row');

        self::assertSame('', $row->filter('.rm-mnb-row__value')->attr('data-maskable'));
        self::assertSame('12.00', $row->filter('.rm-mnb-row__value')->text());
        self::assertNull($row->attr('data-maskable'));
    }

    #[Test]
    public function it_should_accept_built_value_attributes(): void
    {
        $value = $this->renderComponent('SheetRow', ['label' => 'Balance', 'value' => '12.00', 'valueAttributes' => ValueAttributes::createFromArray(['aria-label' => 'Hidden'])])->filter('.rm-mnb-row__value');

        self::assertSame('Hidden', $value->attr('aria-label'));
    }

    #[Test]
    public function it_should_render_no_stray_attribute_without_value_attributes(): void
    {
        $html = $this->renderTwigComponent('MobileNavigation:SheetRow', ['label' => 'Balance', 'value' => '12.00'])->toString();

        self::assertStringContainsString('<span class="rm-mnb-row__value">12.00</span>', $html);
    }

    #[Test]
    public function it_should_refuse_a_wiring_value_attribute(): void
    {
        $this->assertMountFails('SheetRow', ['label' => 'Balance', 'value' => '1', 'valueAttributes' => ['data-controller' => 'evil']], 'Cannot render the "data-controller" value attribute.');
    }

    #[Test]
    public function it_should_put_free_html_attributes_on_the_root(): void
    {
        $row = $this->renderComponent('SheetRow', ['label' => 'Theme', 'role' => 'switch', 'aria-checked' => 'false', 'data-foo' => 'bar'])->filter('.rm-mnb-row');

        self::assertSame('switch', $row->attr('role'));
        self::assertSame('false', $row->attr('aria-checked'));
        self::assertSame('bar', $row->attr('data-foo'));
    }
}
