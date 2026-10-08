<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Tests\Unit\Model;

use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\Attributes\TestWith;
use PHPUnit\Framework\TestCase;
use RomainMillan\MobileNavigation\Model\TabBadge;
use RomainMillan\MobileNavigation\Model\Tone;

final class TabBadgeTest extends TestCase
{
    #[Test]
    #[TestWith([1, '1'])]
    #[TestWith([99, '99'])]
    #[TestWith([100, '99+'])]
    #[TestWith([12345, '99+'])]
    public function it_should_display_the_count_capped_at_99(int $count, string $expected): void
    {
        self::assertSame($expected, TabBadge::createFromCount($count)->text());
    }

    #[Test]
    #[TestWith([0])]
    #[TestWith([-3])]
    public function it_should_refuse_a_count_below_one(int $count): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage(\sprintf('Cannot show a tab badge for a count of %d: pass no badge instead.', $count));

        TabBadge::createFromCount($count);
    }

    #[Test]
    public function it_should_be_negative_without_accessible_label_by_default(): void
    {
        $badge = TabBadge::createFromCount(3);

        self::assertSame('negative', $badge->tone());
        self::assertNull($badge->accessibleLabel());
    }

    #[Test]
    public function it_should_keep_the_tone_and_the_accessible_label_it_is_given(): void
    {
        $badge = TabBadge::createFromCount(3, Tone::Accent, '3 notifications need your attention');

        self::assertSame('accent', $badge->tone());
        self::assertSame('3 notifications need your attention', $badge->accessibleLabel());
    }
}
