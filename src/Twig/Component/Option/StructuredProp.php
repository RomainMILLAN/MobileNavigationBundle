<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Twig\Component\Option;

use Symfony\Component\OptionsResolver\Exception\ExceptionInterface;
use Symfony\Component\OptionsResolver\OptionsResolver;

use function Symfony\Component\String\u;

/**
 * One structured prop of a component, validated by its PropOptions: an unknown or
 * mistyped key fails at mount time, naming the component and the prop.
 */
final readonly class StructuredProp
{
    private function __construct(
        private string $component,
        private string $prop,
        private PropOptions $propOptions,
    ) {
    }

    /**
     * @param class-string $componentClass
     */
    public static function createForComponent(string $componentClass, string $prop, PropOptions $propOptions): self
    {
        return new self('MobileNavigation:'.u($componentClass)->afterLast('\\')->toString(), $prop, $propOptions);
    }

    /**
     * @return array<string, mixed>
     */
    public function resolve(mixed $value): array
    {
        if (!\is_array($value)) {
            throw new \InvalidArgumentException(\sprintf('Cannot mount the "%s" prop of the %s component: an array is expected, "%s" given.', $this->prop, $this->component, get_debug_type($value)));
        }

        $resolver = new OptionsResolver();
        $this->propOptions->configure($resolver);

        try {
            /** @var array<string, mixed> $resolved */
            $resolved = $resolver->resolve($value);

            return $resolved;
        } catch (ExceptionInterface $exception) {
            throw new \InvalidArgumentException(\sprintf('Cannot mount the "%s" prop of the %s component: %s', $this->prop, $this->component, $exception->getMessage()), 0, $exception);
        }
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function resolveEach(mixed $value): array
    {
        if (!\is_array($value) || !array_is_list($value)) {
            throw new \InvalidArgumentException(\sprintf('Cannot mount the "%s" prop of the %s component: a list is expected.', $this->prop, $this->component));
        }

        return array_map($this->resolve(...), $value);
    }
}
