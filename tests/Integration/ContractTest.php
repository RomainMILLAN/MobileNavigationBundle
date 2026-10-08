<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Tests\Integration;

use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;
use RomainMillan\MobileNavigation\Model\HttpMethod;
use RomainMillan\MobileNavigation\Model\SwipeAction;
use RomainMillan\MobileNavigation\Model\TabBadge;
use RomainMillan\MobileNavigation\Model\Tone;
use RomainMillan\MobileNavigation\Twig\MobileNavigationExtension;
use Symfony\Component\Translation\TranslatableMessage;
use Symfony\Component\Translation\Translator;

use function Symfony\Component\String\u;

/**
 * assets/contract.json is what an app that ports the templates (outside Symfony) tests
 * itself against: the Stimulus identifier prefix, reference swipe payloads, the tab badge
 * cases. This test rebuilds it from the PHP models, so the committed file can never drift
 * from what the bundle actually renders.
 */
final class ContractTest extends TestCase
{
    private const PATH = __DIR__.'/../../assets/contract.json';

    #[Test]
    public function it_should_publish_exactly_what_the_models_produce(): void
    {
        $committed = file_get_contents(self::PATH);
        self::assertIsString($committed);

        self::assertSame($this->expected(), json_decode($committed, true, flags: \JSON_THROW_ON_ERROR));
    }

    /**
     * @return array<string, mixed>
     */
    private function expected(): array
    {
        // No resource: a translatable message renders as its own id.
        $translator = new Translator('en');

        return [
            'identifierPrefix' => u(MobileNavigationExtension::CONTROLLER_PREFIX)->trimPrefix('@')->replace('/', '--')->toString(),
            'spoofedMethods' => array_values(array_map(
                static fn (HttpMethod $method): string => $method->value,
                array_filter(HttpMethod::cases(), static fn (HttpMethod $method): bool => HttpMethod::Post !== $method),
            )),
            'swipeActions' => [
                'link' => SwipeAction::link('/items/1/edit', 'icon-edit', Tone::Accent, new TranslatableMessage('Edit'))->payload($translator),
                'post' => SwipeAction::post('/items/1/ack?from=list', 'icon-check', Tone::Positive, new TranslatableMessage('Acknowledge'))->payload($translator),
                'destructive' => SwipeAction::destructive('/items/1', 'icon-trash', new TranslatableMessage('Delete'), new TranslatableMessage('This cannot be undone.'), HttpMethod::Delete)->payload($translator),
            ],
            'tabBadge' => [
                'text' => array_combine(['1', '99', '100', '1000'], array_map(static fn (int $count): string => TabBadge::createFromCount($count)->text(), [1, 99, 100, 1000])),
                'rejectedCounts' => [0, -1],
                'defaultTone' => TabBadge::createFromCount(1)->tone(),
            ],
        ];
    }
}
