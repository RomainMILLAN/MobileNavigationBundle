<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Twig\Component;

use function Symfony\Component\String\u;

/**
 * The props a component cannot render without. Checked by the PreMount hooks, so a
 * missing prop fails where the component is called, not later while its template renders
 * an uninitialized typed property.
 */
final readonly class RequiredProps
{
    /**
     * @param list<string> $props
     */
    private function __construct(
        private string $component,
        private array $props,
    ) {
    }

    /**
     * @param class-string $componentClass
     */
    public static function createForComponent(string $componentClass, string ...$props): self
    {
        return new self('MobileNavigation:'.u($componentClass)->afterLast('\\')->toString(), array_values($props));
    }

    /**
     * A key that is absent or null counts as missing.
     *
     * @param array<array-key, mixed> $data
     */
    public function assertPresentIn(array $data): void
    {
        foreach ($this->props as $prop) {
            if (null === ($data[$prop] ?? null)) {
                throw new \InvalidArgumentException(\sprintf('There is no "%s" prop for the %s component.', $prop, $this->component));
            }
        }
    }
}
