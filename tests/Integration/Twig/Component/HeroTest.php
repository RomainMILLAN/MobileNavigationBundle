<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Tests\Integration\Twig\Component;

use PHPUnit\Framework\Attributes\Test;
use RomainMillan\MobileNavigation\Model\Tone;

final class HeroTest extends ComponentTestCase
{
    #[Test]
    public function it_should_render_the_value_with_its_defaults(): void
    {
        $hero = $this->renderComponent('Hero', ['value' => '1 250,00 €'])->filter('section.rm-mnb-hero');

        $value = $hero->filter('.rm-mnb-hero__value');
        self::assertSame('1 250,00 €', $value->text());
        self::assertStringContainsString('rm-mnb-hero__value--neutral', (string) $value->attr('class'));
        self::assertNull($value->attr('data-maskable'));
        self::assertCount(0, $hero->filter('.rm-mnb-hero__label, .rm-mnb-hero__caption, .rm-mnb-hero__progress'));
    }

    #[Test]
    public function it_should_render_label_caption_and_attributes(): void
    {
        $hero = $this->renderComponent('Hero', [...['value' => '1 250,00 €'], 'label' => 'Balance', 'tone' => 'positive', 'valueAttributes' => ['data-maskable' => true], 'caption' => '+ 120,00 € this month', 'captionTone' => 'xyz', 'captionAttributes' => ['data-maskable' => true]])->filter('section');

        self::assertSame('Balance', $hero->filter('.rm-mnb-hero__label')->text());
        self::assertStringContainsString('rm-mnb-hero__value--positive', (string) $hero->filter('.rm-mnb-hero__value')->attr('class'));
        self::assertSame('', $hero->filter('.rm-mnb-hero__value')->attr('data-maskable'));
        $caption = $hero->filter('.rm-mnb-hero__caption');
        self::assertStringContainsString('rm-mnb-tone--neutral', (string) $caption->attr('class'));
        self::assertSame('', $caption->attr('data-maskable'));
        self::assertNull($hero->attr('data-maskable'));
    }

    #[Test]
    public function it_should_clamp_and_step_the_gauge(): void
    {
        $gauge = $this->renderComponent('Hero', [...['value' => '1 250,00 €'], 'progress' => 63.4, 'progressLabel' => 'Repaid'])->filter('.rm-mnb-hero__progress');

        self::assertSame('progressbar', $gauge->attr('role'));
        self::assertSame('63', $gauge->attr('aria-valuenow'));
        self::assertSame('Repaid', $gauge->attr('aria-label'));
        $bar = (string) $gauge->filter('.rm-mnb-hero__progress-bar')->attr('class');
        self::assertStringContainsString('rm-mnb-hero__progress-bar--65', $bar);
        self::assertStringContainsString('rm-mnb-tone--positive', $bar);

        $over = $this->renderComponent('Hero', [...['value' => '1 250,00 €'], 'progress' => 140, 'progressTone' => Tone::Warning])->filter('.rm-mnb-hero__progress');
        self::assertSame('100', $over->attr('aria-valuenow'));
        self::assertStringContainsString('rm-mnb-tone--warning', (string) $over->filter('.rm-mnb-hero__progress-bar')->attr('class'));
    }

    #[Test]
    public function it_should_refuse_a_wiring_value_attribute(): void
    {
        $this->assertMountFails('Hero', [...['value' => '1 250,00 €'], 'captionAttributes' => ['data-action' => 'x']], 'Cannot render the "data-action" value attribute.');
    }

    #[Test]
    public function it_should_require_value(): void
    {
        $data = ['value' => '1 250,00 €'];
        unset($data['value']);
        $this->assertMountFails('Hero', $data, 'There is no "value" prop for the MobileNavigation:Hero component.');
        $this->assertMountFails('Hero', [...$data, 'value' => null], 'There is no "value" prop for the MobileNavigation:Hero component.');
    }

    #[Test]
    public function it_should_put_free_html_attributes_on_the_root(): void
    {
        $root = $this->renderComponent('Hero', [...['value' => '1 250,00 €'], 'role' => 'note', 'data-foo' => 'bar'])->filter('section');

        self::assertSame('note', $root->attr('role'));
        self::assertSame('bar', $root->attr('data-foo'));
    }
}
