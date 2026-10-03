<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Tests\Unit\Model;

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;
use RomainMillan\MobileNavigation\Model\Tone;

final class ToneTest extends TestCase
{
    #[Test]
    #[DataProvider('looseValues')]
    public function it_should_create_a_tone_from_a_loose_value(Tone|string|null $value, Tone $expected): void
    {
        self::assertSame($expected, Tone::createFromLooseValue($value));
    }

    /**
     * @return iterable<string, array{Tone|string|null, Tone}>
     */
    public static function looseValues(): iterable
    {
        yield 'known string' => ['positive', Tone::Positive];
        yield 'instance' => [Tone::Warning, Tone::Warning];
        yield 'unknown string' => ['xyz', Tone::Neutral];
        yield 'class injection' => ['positive rm-mnb-evil', Tone::Neutral];
        yield 'empty string' => ['', Tone::Neutral];
        yield 'uppercase' => ['POSITIVE', Tone::Neutral];
        yield 'null' => [null, Tone::Neutral];
    }
}
