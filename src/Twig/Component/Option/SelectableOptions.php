<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Twig\Component\Option;

use Symfony\Component\OptionsResolver\OptionsResolver;
use Symfony\UX\StimulusBundle\Dto\StimulusAttributes;

/**
 * ListRow "selectable": {name, value, label, attributes = null}.
 */
final readonly class SelectableOptions implements PropOptions
{
    public function configure(OptionsResolver $resolver): void
    {
        $resolver
            ->setRequired(['name', 'value', 'label'])
            ->setAllowedTypes('name', 'string')
            ->setAllowedTypes('value', ['string', 'int'])
            ->setAllowedTypes('label', ['string', \Stringable::class])
            ->setDefault('attributes', null)
            ->setAllowedTypes('attributes', ['null', StimulusAttributes::class]);
    }
}
