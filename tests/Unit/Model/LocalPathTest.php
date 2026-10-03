<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Tests\Unit\Model;

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;
use RomainMillan\MobileNavigation\Model\LocalPath;

use function Symfony\Component\String\u;

final class LocalPathTest extends TestCase
{
    #[Test]
    #[DataProvider('acceptedPaths')]
    public function it_should_accept_a_local_path(string $path): void
    {
        self::assertSame($path, LocalPath::createFromString($path)->toString());
    }

    /**
     * @return iterable<string, array{string}>
     */
    public static function acceptedPaths(): iterable
    {
        yield 'root' => ['/'];
        yield 'with query' => ['/a/b?c=d'];
        yield 'at the length limit' => ['/'.u('a')->repeat(2047)->toString()];
        yield 'unicode' => ['/comptes/éé'];
    }

    #[Test]
    #[DataProvider('refusedPaths')]
    public function it_should_refuse_a_path_that_is_not_local(string $path): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessageMatches('/^Cannot use .* as a local path\.$/');

        LocalPath::createFromString($path);
    }

    /**
     * @return iterable<string, array{string}>
     */
    public static function refusedPaths(): iterable
    {
        yield 'empty' => [''];
        yield 'relative' => ['x/y'];
        yield 'protocol relative' => ['//x'];
        yield 'backslash' => ['/\x'];
        yield 'javascript' => ['javascript:alert(1)'];
        yield 'absolute url' => ['https://x'];
        yield 'tab' => ["/\t/x"];
        yield 'line feed' => ["/\n/x"];
        yield 'space' => ['/ /x'];
        yield 'delete' => ["/\x7F"];
        yield 'too long' => ['/'.u('a')->repeat(2048)->toString()];
        yield 'invalid utf-8' => ["/\xC3\x28"];
    }

    #[Test]
    public function it_should_quote_a_bounded_and_encoded_excerpt_of_the_refused_path(): void
    {
        try {
            LocalPath::createFromString("x\n".u('a')->repeat(3000)->toString());
            self::fail('The path should be refused.');
        } catch (\InvalidArgumentException $exception) {
            self::assertStringNotContainsString("\n", $exception->getMessage());
            self::assertStringContainsString('"x\n', $exception->getMessage());
            self::assertLessThan(120, u($exception->getMessage())->length());
        }
    }

    #[Test]
    public function it_should_quote_an_invalid_utf8_path_without_failing(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Cannot use "/\\ufffd(" as a local path.');

        LocalPath::createFromString("/\xC3\x28");
    }
}
