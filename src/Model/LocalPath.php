<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Model;

use Symfony\Component\String\Exception\InvalidArgumentException as StringInvalidArgumentException;

use function Symfony\Component\String\u;

/**
 * A path on the current origin: "/accounts/12?tab=history", never "//evil.example",
 * "/\evil.example", "javascript:…" nor "https://…".
 *
 * The rule: not empty, at most 2048 characters, starts with "/", starts neither with "//"
 * nor with "/\", and contains no control character nor space. The WHATWG URL parser strips
 * tabs and line feeds, so "/\t/x" would otherwise become the protocol-relative "//x".
 */
final readonly class LocalPath
{
    private const MAX_LENGTH = 2048;

    private function __construct(
        private string $path,
    ) {
    }

    public static function createFromString(string $path): self
    {
        try {
            $candidate = u($path);
        } catch (StringInvalidArgumentException) {
            throw self::rejected($path);
        }

        if ($candidate->isEmpty() || $candidate->length() > self::MAX_LENGTH) {
            throw self::rejected($path);
        }

        if (!$candidate->startsWith('/') || $candidate->startsWith('//') || $candidate->startsWith('/\\')) {
            throw self::rejected($path);
        }

        if ([] !== $candidate->match('/[\x00-\x20\x7F]/')) {
            throw self::rejected($path);
        }

        return new self($path);
    }

    public function toString(): string
    {
        return $this->path;
    }

    /**
     * The rejected input is never quoted raw: it may hold line feeds, invalid UTF-8 or
     * thousands of characters. A bounded, JSON-encoded excerpt is enough to find it.
     */
    private static function rejected(string $path): \InvalidArgumentException
    {
        return new \InvalidArgumentException(\sprintf('Cannot use %s as a local path.', Excerpt::createFromString($path)->toString()));
    }
}
