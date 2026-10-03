<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Twig\Component\Option;

use Symfony\Component\OptionsResolver\OptionsResolver;

/**
 * A link: CompactBar "back", EmptyState "action": {href, label}.
 */
final readonly class LinkOptions implements PropOptions
{
    public function configure(OptionsResolver $resolver): void
    {
        $resolver
            ->setRequired(['href', 'label'])
            ->setAllowedTypes('href', 'string')
            ->setAllowedTypes('label', ['string', \Stringable::class]);
    }
}
