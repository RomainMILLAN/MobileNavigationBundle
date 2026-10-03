<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Model;

use function Symfony\Component\String\u;

/**
 * The data-* / aria-* attributes an app puts on the value element of a row (ListRow,
 * SheetRow), e.g. ['data-maskable' => true] for an amount the app hides on demand.
 *
 * Promise: no Stimulus/Bootstrap/Turbo wiring; names and values are app-controlled. Names
 * are whitelisted, so data-controller, data-action, Stimulus targets/values/outlets/
 * classes/params and the data-bs* / data-turbo* families are refused: wiring behaviour
 * goes through the component's own props, never through the value element.
 *
 * Every regex is anchored on both ends with the D modifier: without it, "$" accepts a
 * trailing "\n" and "data-controller\n" would slip through.
 */
final readonly class ValueAttributes implements \Stringable
{
    private const ALLOWED_NAME = '/^(data|aria)-[a-z0-9-]+$/D';

    private const REFUSED_NAMES = [
        '/^data-(controller|action)$/D',
        '/^data-[a-z0-9-]+-(target|value|outlet|class|param)$/D',
        '/^data-(bs|turbo)(-|$)/D',
    ];

    private const ARIA_NAME = '/^aria-/D';

    /**
     * @param array<string, string|bool> $attributes
     */
    private function __construct(
        private array $attributes,
    ) {
    }

    /**
     * @param array<array-key, mixed> $attributes
     */
    public static function createFromArray(array $attributes): self
    {
        $validated = [];

        foreach ($attributes as $name => $value) {
            $name = (string) $name;

            if (!self::isAllowedName($name)) {
                throw new \InvalidArgumentException(\sprintf('Cannot render the %s value attribute.', Excerpt::createFromString($name)->toString()));
            }

            if (\is_bool($value) && [] !== u($name)->match(self::ARIA_NAME)) {
                // aria-* take the strings "true"/"false": a bare aria-hidden does not mean true.
                throw new \InvalidArgumentException(\sprintf('Cannot render a boolean for the %s value attribute.', Excerpt::createFromString($name)->toString()));
            }

            if (!\is_bool($value) && !\is_string($value)) {
                throw new \InvalidArgumentException(\sprintf('Cannot render a value of type "%s" for the %s value attribute.', get_debug_type($value), Excerpt::createFromString($name)->toString()));
            }

            $validated[$name] = $value;
        }

        return new self($validated);
    }

    /**
     * The prop as a component receives it: absent (null) gives the empty set, an array is
     * validated, an instance already built by a composing app component is kept as is.
     */
    public static function createFromLooseValue(mixed $value): self
    {
        if ($value instanceof self) {
            return $value;
        }

        if (null === $value) {
            return self::createEmpty();
        }

        if (!\is_array($value)) {
            throw new \InvalidArgumentException(\sprintf('Cannot render value attributes of type "%s".', get_debug_type($value)));
        }

        return self::createFromArray($value);
    }

    public static function createEmpty(): self
    {
        return new self([]);
    }

    /**
     * The attribute string, already escaped, with a leading space per attribute: true
     * renders the bare name, false omits the attribute.
     */
    public function render(): string
    {
        $html = '';

        foreach ($this->attributes as $name => $value) {
            if (false === $value) {
                continue;
            }

            // Names are whitelisted above, so only values need escaping. symfony/string has
            // no HTML escaping: htmlspecialchars() is the one native string function used here.
            $html .= true === $value
                ? ' '.$name
                : \sprintf(' %s="%s"', $name, htmlspecialchars($value, \ENT_QUOTES | \ENT_SUBSTITUTE, 'UTF-8'));
        }

        return $html;
    }

    public function __toString(): string
    {
        return $this->render();
    }

    private static function isAllowedName(string $name): bool
    {
        try {
            $candidate = u($name);
        } catch (\InvalidArgumentException) {
            return false;
        }

        if ([] === $candidate->match(self::ALLOWED_NAME)) {
            return false;
        }

        foreach (self::REFUSED_NAMES as $refused) {
            if ([] !== $candidate->match($refused)) {
                return false;
            }
        }

        return true;
    }
}
