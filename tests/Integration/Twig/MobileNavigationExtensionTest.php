<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Tests\Integration\Twig;

use PHPUnit\Framework\Attributes\Test;
use RomainMillan\MobileNavigation\Model\SwipeAction;
use RomainMillan\MobileNavigation\Model\Tone;
use RomainMillan\MobileNavigation\Tests\Integration\IntegrationTestCase;
use Symfony\Component\DomCrawler\Crawler;
use Symfony\Component\Translation\TranslatableMessage;
use Twig\Error\RuntimeError;

final class MobileNavigationExtensionTest extends IntegrationTestCase
{
    private const PREFIX = 'romainmillan--mobile-navigation-bundle--';

    #[Test]
    public function it_should_name_a_bundle_controller(): void
    {
        self::assertSame('@romainmillan/mobile-navigation-bundle/sheet', $this->renderTemplate("{{ rm_mnb_controller('sheet') }}"));
        self::assertSame('data-controller="'.self::PREFIX.'sheet"', $this->renderTemplate("{{ stimulus_controller(rm_mnb_controller('sheet')) }}"));
    }

    #[Test]
    public function it_should_render_nothing_without_action(): void
    {
        self::assertSame('<div ></div>', $this->renderTemplate("<div {{ rm_mnb_swipe_controller([], 'x') }}></div>"));
    }

    #[Test]
    public function it_should_mount_the_swipe_controller_escaped_once(): void
    {
        $html = $this->renderTemplate('<div {{ rm_mnb_swipe_controller(actions, token) }}></div>', ['actions' => $this->actions(), 'token' => 'token']);

        self::assertStringContainsString('data-controller="'.self::PREFIX.'swipe-actions"', $html);
        self::assertStringNotContainsString('&amp;', $html);
        self::assertStringNotContainsString('&quot;'.self::PREFIX, $html);
        self::assertSame('token', (new Crawler($html))->filter('div')->attr('data-'.self::PREFIX.'swipe-actions-csrf-token-value'));
    }

    #[Test]
    public function it_should_render_the_same_payload_as_list_row(): void
    {
        $actions = $this->actions();
        $attribute = 'data-'.self::PREFIX.'swipe-actions-actions-value';

        $fromFunction = (new Crawler($this->renderTemplate('<div {{ rm_mnb_swipe_controller(actions, token) }}></div>', ['actions' => $actions, 'token' => 'token'])))->filter('div')->attr($attribute);
        $fromListRow = $this->renderComponent('ListRow', ['title' => 'Groceries', 'swipe' => ['actions' => $actions, 'csrfToken' => 'token']])->filter('.rm-mnb-list-row')->attr($attribute);

        self::assertSame($fromListRow, $fromFunction);
        self::assertSame('[{"url":"\/items\/1\/edit","icon":"icon-edit","tone":"accent","label":"Back to Items"},{"url":"\/items\/1\/cancel","icon":"icon-x","tone":"negative","label":"Close","method":"POST","confirm":"Done"}]', $fromFunction);
    }

    #[Test]
    public function it_should_refuse_actions_without_token(): void
    {
        $this->expectException(RuntimeError::class);
        $this->expectExceptionMessage('Cannot mount swipe actions without a CSRF token.');

        $this->renderTemplate("<div {{ rm_mnb_swipe_controller(actions, '') }}></div>", ['actions' => $this->actions()]);
    }

    /**
     * Labels are translated by the app translator: the rm_mnb messages are reused here.
     *
     * @return list<SwipeAction>
     */
    private function actions(): array
    {
        return [
            SwipeAction::link('/items/1/edit', 'icon-edit', Tone::Accent, new TranslatableMessage('back.to', ['%label%' => 'Items'], 'rm_mnb')),
            SwipeAction::destructive('/items/1/cancel', 'icon-x', new TranslatableMessage('sheet.close', domain: 'rm_mnb'), new TranslatableMessage('list.done', domain: 'rm_mnb')),
        ];
    }
}
