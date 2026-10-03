<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Twig\Component\Option;

use Symfony\Component\OptionsResolver\OptionsResolver;

/**
 * SegmentedControl "items" item: {href, label, count = null, current = false}.
 */
final readonly class SegmentItemOptions implements PropOptions
{
    public function configure(OptionsResolver $resolver): void
    {
        $resolver
            ->setRequired(['href', 'label'])
            ->setAllowedTypes('href', 'string')
            ->setAllowedTypes('label', ['string', \Stringable::class])
            ->setDefaults(['count' => null, 'current' => false])
            ->setAllowedTypes('count', ['null', 'int', 'string'])
            ->setAllowedTypes('current', 'bool');
    }
}
