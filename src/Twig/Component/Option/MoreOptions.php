<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Twig\Component\Option;

use Symfony\Component\OptionsResolver\OptionsResolver;

/**
 * TabBar "more": {sheet, label, icon}.
 */
final readonly class MoreOptions implements PropOptions
{
    public function configure(OptionsResolver $resolver): void
    {
        $resolver
            ->setRequired(['sheet', 'label', 'icon'])
            ->setAllowedTypes('sheet', 'string')
            ->setAllowedTypes('label', ['string', \Stringable::class])
            ->setAllowedTypes('icon', 'string');
    }
}
