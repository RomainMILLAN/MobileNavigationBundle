<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Twig\Component\Option;

use RomainMillan\MobileNavigation\Model\TabBadge;
use Symfony\Component\OptionsResolver\OptionsResolver;

/**
 * TabBar "tabs" item: {href, label, icon, current = false, badge = null}.
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
            ->setAllowedTypes('current', 'bool')
            // A TabBadge, never a bare number: the count >= 1 and "99+" rules live in it.
            ->setDefault('badge', null)
            ->setAllowedTypes('badge', ['null', TabBadge::class]);
    }
}
