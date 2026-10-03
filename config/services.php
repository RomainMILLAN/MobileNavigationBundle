<?php

declare(strict_types=1);

use RomainMillan\MobileNavigation\Twig\MobileNavigationExtension;
use RomainMillan\MobileNavigation\Twig\SwipeControllerAttributes;
use Symfony\Component\DependencyInjection\Loader\Configurator\ContainerConfigurator;

use function Symfony\Component\DependencyInjection\Loader\Configurator\service;

return static function (ContainerConfigurator $container): void {
    $services = $container->services()
        ->defaults()
            ->private()
            ->autowire()
            ->autoconfigure();

    // #[AsTwigComponent] autoconfiguration registers the components (non shared). Option/*
    // are not services: the PreMount hooks instantiate them.
    $services->load('RomainMillan\\MobileNavigation\\Twig\\Component\\', '../src/Twig/Component/*.php')
        ->exclude('../src/Twig/Component/{Option,RequiredProps.php}');

    // StimulusBundle registers its helper under an id, without a class alias.
    $services->set(SwipeControllerAttributes::class)
        ->arg('$stimulusHelper', service('stimulus.helper'));

    $services->set(MobileNavigationExtension::class)
        ->tag('twig.extension');
};
