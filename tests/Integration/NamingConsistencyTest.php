<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Tests\Integration;

use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\Attributes\TestWith;
use PHPUnit\Framework\TestCase;
use RomainMillan\MobileNavigation\Model\Tone;
use RomainMillan\MobileNavigation\Twig\MobileNavigationExtension;
use Symfony\Component\String\UnicodeString;

use function Symfony\Component\String\u;

/**
 * The package name and a few shared lists are spelled on both sides (PHP and JS): this
 * test keeps them in sync (see "renaming points" in docs/contributing.md).
 */
final class NamingConsistencyTest extends TestCase
{
    private const ROOT = __DIR__.'/../..';

    #[Test]
    public function it_should_derive_the_controller_prefix_from_the_js_package_name(): void
    {
        $package = json_decode($this->read('assets/package.json'), true, flags: \JSON_THROW_ON_ERROR);
        self::assertIsArray($package);
        self::assertIsString($package['name']);

        self::assertSame('@'.u($package['name'])->trimPrefix('@')->toString().'/', MobileNavigationExtension::CONTROLLER_PREFIX);
    }

    #[Test]
    public function it_should_derive_the_stimulus_identifier_prefix_from_the_same_name(): void
    {
        $identifierPrefix = u($this->read('assets/src/index.ts'))->match("/export const IDENTIFIER_PREFIX = '([^']+)';/")[1] ?? null;

        // Stimulus form of "@vendor/name/": no leading "@", "/" becomes "--".
        $expected = u(MobileNavigationExtension::CONTROLLER_PREFIX)->trimPrefix('@')->replace('/', '--')->toString();

        self::assertSame('romainmillan--mobile-navigation-bundle--', $expected);
        self::assertSame($expected, $identifierPrefix);
    }

    #[Test]
    public function it_should_list_the_same_tones_in_php_and_typescript(): void
    {
        $list = u($this->read('assets/src/utils/tones.ts'))->match('/export const TONES = \[([^\]]+)\] as const;/')[1] ?? null;
        self::assertIsString($list);
        $tones = array_map(static fn (UnicodeString $tone): string => $tone->trim(" '")->toString(), u($list)->split(','));

        self::assertSame(array_map(static fn (Tone $tone): string => $tone->value, Tone::cases()), $tones);
    }

    #[Test]
    #[TestWith(['TOGGLE_SELECTING_EVENT', 'SelectToggle'])]
    #[TestWith(['TOGGLE_EDITING_EVENT', 'EditToggle'])]
    public function it_should_emit_the_event_the_list_controller_listens_to(string $constant, string $component): void
    {
        $event = u($this->read('assets/src/controllers/list_controller.ts'))->match(\sprintf("/export const %s = '([^']+)';/", $constant))[1] ?? null;

        self::assertIsString($event);
        self::assertTrue(u($this->read(\sprintf('templates/components/%s.html.twig', $component)))->containsAny("{ name: '".$event."' }"));
    }

    private function read(string $path): string
    {
        $contents = file_get_contents(self::ROOT.'/'.$path);
        self::assertIsString($contents);

        return $contents;
    }
}
