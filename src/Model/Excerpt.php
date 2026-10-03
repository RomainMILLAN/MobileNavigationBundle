<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Model;

use Symfony\Component\String\Exception\InvalidArgumentException as StringInvalidArgumentException;

use function Symfony\Component\String\b;
use function Symfony\Component\String\u;

/**
 * A rejected input, quoted safely in an exception message: at most 64 characters,
 * JSON-encoded (line feeds and quotes escaped, invalid UTF-8 substituted).
 *
 * @internal
 */
final readonly class Excerpt
{
    private const MAX_LENGTH = 64;

    private function __construct(
        private string $excerpt,
    ) {
    }

    public static function createFromString(string $input): self
    {
        try {
            $bounded = u($input)->truncate(self::MAX_LENGTH, '…')->toString();
        } catch (StringInvalidArgumentException) {
            // Invalid UTF-8: cut on bytes, json_encode() substitutes the broken sequences.
            $bounded = b($input)->slice(0, self::MAX_LENGTH)->toString();
        }

        return new self(json_encode($bounded, \JSON_INVALID_UTF8_SUBSTITUTE | \JSON_UNESCAPED_SLASHES | \JSON_THROW_ON_ERROR));
    }

    public function toString(): string
    {
        return $this->excerpt;
    }
}
