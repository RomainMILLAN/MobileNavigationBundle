<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Twig\Component\Option;

use Symfony\Component\OptionsResolver\OptionsResolver;

/**
 * The keys of one structured (array) prop: a flat resolver, no nested option.
 */
interface PropOptions
{
    public function configure(OptionsResolver $resolver): void;
}
