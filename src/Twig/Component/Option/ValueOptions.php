<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Twig\Component\Option;

use RomainMillan\MobileNavigation\Model\Tone;
use Symfony\Component\OptionsResolver\Options;
use Symfony\Component\OptionsResolver\OptionsResolver;

/**
 * ListRow "value" and "caption": {text, tone}.
 */
final readonly class ValueOptions implements PropOptions
{
    public function configure(OptionsResolver $resolver): void
    {
        $resolver
            ->setRequired('text')
            ->setAllowedTypes('text', ['string', \Stringable::class]);
        $resolver
            ->setDefault('tone', null)
            ->setAllowedTypes('tone', ['null', 'string', Tone::class])
            // A tone is always present after resolution, as a string; unknown -> neutral.
            ->setNormalizer('tone', static fn (Options $options, Tone|string|null $tone): string => Tone::createFromLooseValue($tone)->value);
    }
}
