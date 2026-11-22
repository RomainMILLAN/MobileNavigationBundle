<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Tests\Integration\Twig\Component;

use PHPUnit\Framework\Attributes\Test;
use RomainMillan\MobileNavigation\Model\SwipeAction;
use RomainMillan\MobileNavigation\Model\SwipeActions;
use RomainMillan\MobileNavigation\Model\Tone;
use Symfony\Component\Translation\TranslatableMessage;

final class SwipeableTest extends ComponentTestCase
{
    #[Test]
    public function it_should_wrap_the_app_content_in_the_snap_track(): void
    {
        $root = $this->renderComponent('Swipeable', ['label' => 'Groceries', 'swipe' => $this->swipe(), 'class' => 'app-card'])->filter('.rm-mnb-swipeable');

        self::assertSame(self::PREFIX.'swipe-actions', $root->attr('data-controller'));
        self::assertStringContainsString('app-card', (string) $root->attr('class'));
        self::assertCount(1, $root->filter('.rm-mnb-swipe > .rm-mnb-swipe__content > button.rm-mnb-swipe__toggle'));
        self::assertSame('Actions for Groceries', $root->filter('.rm-mnb-swipe > .rm-mnb-swipe-actions')->attr('aria-label'));
        self::assertSame('/items/1/edit', $root->filter('.rm-mnb-swipe-actions a')->attr('href'));
    }

    #[Test]
    public function it_should_accept_the_swipe_as_an_array(): void
    {
        $root = $this->renderComponent('Swipeable', ['label' => 'Groceries', 'swipe' => ['actions' => [$this->edit()], 'csrfToken' => 'token']]);

        self::assertCount(1, $root->filter('.rm-mnb-swipe-actions a'));
    }

    #[Test]
    public function it_should_require_label_and_swipe(): void
    {
        $this->assertMountFails('Swipeable', ['swipe' => $this->swipe()], 'There is no "label" prop for the MobileNavigation:Swipeable component.');
        $this->assertMountFails('Swipeable', ['label' => 'Groceries'], 'There is no "swipe" prop for the MobileNavigation:Swipeable component.');
    }

    #[Test]
    public function it_should_refuse_actions_without_token(): void
    {
        $this->assertMountFails('Swipeable', ['label' => 'Groceries', 'swipe' => ['actions' => [$this->edit()], 'csrfToken' => '']], 'Cannot mount swipe actions without a CSRF token.');
    }

    private function swipe(): SwipeActions
    {
        return SwipeActions::createFromActions([$this->edit()], 'token');
    }

    private function edit(): SwipeAction
    {
        return SwipeAction::link('/items/1/edit', 'icon-edit', Tone::Accent, new TranslatableMessage('Edit'));
    }
}
