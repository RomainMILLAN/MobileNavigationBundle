<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Twig\Component\Option;

use Symfony\Component\OptionsResolver\OptionsResolver;

/**
 * SheetFormRow "confirm": {title, message, confirmLabel = null (the row label)}.
 */
final readonly class ConfirmOptions implements PropOptions
{
    public function configure(OptionsResolver $resolver): void
    {
        $resolver
            ->setRequired(['title', 'message'])
            ->setAllowedTypes('title', ['string', \Stringable::class])
            ->setAllowedTypes('message', ['string', \Stringable::class])
            ->setDefault('confirmLabel', null)
            ->setAllowedTypes('confirmLabel', ['null', 'string', \Stringable::class]);
    }
}
