<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Twig\Component\Option;

use Symfony\Component\OptionsResolver\OptionsResolver;

/**
 * TabBar "fab": {label, icon, href?, sheet?}: a link with href, a sheet toggle with sheet, disabled with neither.
 */
final readonly class FabOptions implements PropOptions
{
    public function configure(OptionsResolver $resolver): void
    {
        $resolver
            ->setRequired(['label', 'icon'])
            ->setAllowedTypes('label', ['string', \Stringable::class])
            ->setAllowedTypes('icon', 'string')
            ->setDefaults(['href' => null, 'sheet' => null])
            ->setAllowedTypes('href', ['null', 'string'])
            ->setAllowedTypes('sheet', ['null', 'string']);
    }
}
