<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Twig\Component\Option;

use Symfony\Component\OptionsResolver\OptionsResolver;

/**
 * TabBar "tabs" item: {href, label, icon, current = false}.
 */
final readonly class TabOptions implements PropOptions
{
    public function configure(OptionsResolver $resolver): void
    {
        $resolver
            ->setRequired(['href', 'label', 'icon'])
            ->setAllowedTypes('href', 'string')
            ->setAllowedTypes('label', ['string', \Stringable::class])
            ->setAllowedTypes('icon', 'string')
            ->setDefault('current', false)
            ->setAllowedTypes('current', 'bool');
    }
}
