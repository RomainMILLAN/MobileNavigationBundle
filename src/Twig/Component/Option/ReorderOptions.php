<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Twig\Component\Option;

use Symfony\Component\OptionsResolver\OptionsResolver;
use Symfony\UX\StimulusBundle\Dto\StimulusAttributes;

/**
 * ListRow "reorder": {label, attributes = null}: the drag handle shown in "Edit" mode.
 */
final readonly class ReorderOptions implements PropOptions
{
    public function configure(OptionsResolver $resolver): void
    {
        $resolver
            ->setRequired('label')
            ->setAllowedTypes('label', ['string', \Stringable::class])
            ->setDefault('attributes', null)
            ->setAllowedTypes('attributes', ['null', StimulusAttributes::class]);
    }
}
