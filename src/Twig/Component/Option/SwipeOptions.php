<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Twig\Component\Option;

use Symfony\Component\OptionsResolver\OptionsResolver;

/**
 * ListRow "swipe": {actions, csrfToken}. Keys and types only: SwipeActions::createFromActions() is the authority on the actions themselves.
 */
final readonly class SwipeOptions implements PropOptions
{
    public function configure(OptionsResolver $resolver): void
    {
        $resolver
            ->setRequired(['actions', 'csrfToken'])
            ->setAllowedTypes('actions', 'array')
            ->setAllowedTypes('csrfToken', 'string');
    }
}
