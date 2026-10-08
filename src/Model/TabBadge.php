<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Model;

/**
 * The counter shown on a tab: "3", "99+".
 *
 * A badge counts something, so it is never zero: an app with nothing to count passes no
 * badge at all. The "99+" cap lives here only, so that every integration (the Twig
 * template, an app porting it) displays the same thing; assets/contract.json carries the
 * reference cases.
 *
 * The visible number alone reads "Alerts 3" to a screen reader. An app that can say what
 * is counted passes an accessible label ("3 alerts awaiting acknowledgement"): the number
 * is then hidden from assistive technologies and the label read instead.
 */
final readonly class TabBadge
{
    private const CAP = 99;

    private function __construct(
        private int $count,
        private Tone $tone,
        private string|\Stringable|null $accessibleLabel,
    ) {
    }

    public static function createFromCount(int $count, Tone $tone = Tone::Negative, string|\Stringable|null $accessibleLabel = null): self
    {
        if ($count < 1) {
            throw new \InvalidArgumentException(\sprintf('Cannot show a tab badge for a count of %d: pass no badge instead.', $count));
        }

        return new self($count, $tone, $accessibleLabel);
    }

    /** What the badge displays: the count, capped at "99+". */
    public function text(): string
    {
        return $this->count > self::CAP ? self::CAP.'+' : (string) $this->count;
    }

    public function tone(): string
    {
        return $this->tone->value;
    }

    public function accessibleLabel(): string|\Stringable|null
    {
        return $this->accessibleLabel;
    }
}
