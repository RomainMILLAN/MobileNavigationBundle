<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Tests\Unit\Model;

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;
use RomainMillan\MobileNavigation\Model\ValueAttributes;

final class ValueAttributesTest extends TestCase
{
    #[Test]
    public function it_should_render_accepted_attributes(): void
    {
        $attributes = ValueAttributes::createFromArray(['data-maskable' => true, 'aria-label' => 'Balance', 'data-hidden' => false, 'aria-hidden' => 'true']);

        self::assertSame(' data-maskable aria-label="Balance" aria-hidden="true"', $attributes->render());
        self::assertSame($attributes->render(), (string) $attributes);
    }

    #[Test]
    public function it_should_escape_the_values(): void
    {
        self::assertSame(' data-x="&quot;&gt;&lt;script&gt;&#039;"', ValueAttributes::createFromArray(['data-x' => '"><script>\''])->render());
    }

    #[Test]
    public function it_should_render_nothing_when_empty(): void
    {
        self::assertSame('', ValueAttributes::createEmpty()->render());
        self::assertSame('', ValueAttributes::createFromArray([])->render());
    }

    #[Test]
    #[DataProvider('refusedNames')]
    public function it_should_refuse_a_name_outside_the_whitelist(string $name): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessageMatches('/^Cannot render the ".*" value attribute\.$/');

        ValueAttributes::createFromArray([$name => 'x']);
    }

    /**
     * @return iterable<string, array{string}>
     */
    public static function refusedNames(): iterable
    {
        foreach (['onclick', 'style', 'href', 'data-controller', 'data-action', 'data-foo-target', 'data-foo-value', 'data-foo-bar-param', 'data-foo-outlet', 'data-foo-class', 'data-bs-toggle', 'data-turbo', 'data-turbo-frame', 'DATA-X', 'data-', 'data-x y', "data-controller\n", "data-x\n", "aria-label\n", "data-\xC3\x28"] as $name) {
            yield json_encode($name, \JSON_THROW_ON_ERROR | \JSON_INVALID_UTF8_SUBSTITUTE) => [$name];
        }
    }

    #[Test]
    public function it_should_never_quote_a_refused_name_raw(): void
    {
        try {
            ValueAttributes::createFromArray(["data-controller\n" => 'x']);
            self::fail('The name should be refused.');
        } catch (\InvalidArgumentException $exception) {
            self::assertSame('Cannot render the "data-controller\n" value attribute.', $exception->getMessage());
        }
    }

    #[Test]
    public function it_should_refuse_a_boolean_on_an_aria_attribute(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Cannot render a boolean for the "aria-hidden" value attribute.');

        ValueAttributes::createFromArray(['aria-hidden' => true]);
    }

    #[Test]
    public function it_should_refuse_a_value_that_is_neither_a_string_nor_a_boolean(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Cannot render a value of type "int" for the "data-count" value attribute.');

        ValueAttributes::createFromArray(['data-count' => 3]);
    }

    #[Test]
    public function it_should_create_attributes_from_a_loose_value(): void
    {
        $attributes = ValueAttributes::createFromArray(['data-maskable' => true]);

        self::assertSame($attributes, ValueAttributes::createFromLooseValue($attributes));
        self::assertSame('', ValueAttributes::createFromLooseValue(null)->render());
        self::assertSame(' data-maskable', ValueAttributes::createFromLooseValue(['data-maskable' => true])->render());
    }

    #[Test]
    public function it_should_refuse_a_loose_value_that_is_not_an_array(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Cannot render value attributes of type "string".');

        ValueAttributes::createFromLooseValue('data-maskable');
    }
}
