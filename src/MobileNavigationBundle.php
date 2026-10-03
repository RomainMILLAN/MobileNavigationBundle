<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation;

use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\DependencyInjection\Loader\Configurator\ContainerConfigurator;
use Symfony\Component\HttpKernel\Bundle\AbstractBundle;

/**
 * Inheritance imposed by the HttpKernel bundle extension point.
 *
 * The bundle path is the repository root, so Symfony's conventions do the wiring:
 * templates/ is registered as @MobileNavigation (and overridable from the app's
 * templates/bundles/MobileNavigationBundle/), translations/ is loaded (domain rm_mnb).
 */
final class MobileNavigationBundle extends AbstractBundle
{
    protected string $extensionAlias = 'mobile_navigation';

    public function getPath(): string
    {
        return \dirname(__DIR__);
    }

    public function prependExtension(ContainerConfigurator $container, ContainerBuilder $builder): void
    {
        if (!$builder->hasExtension('twig_component')) {
            throw new \LogicException('Cannot use MobileNavigationBundle without symfony/ux-twig-component.');
        }

        if (!$builder->hasExtension('stimulus')) {
            throw new \LogicException('Cannot use MobileNavigationBundle without symfony/stimulus-bundle.');
        }

        // Components are named MobileNavigation:<ShortClassName>, their templates live in
        // @MobileNavigation/components/<ShortClassName>.html.twig.
        $builder->prependExtensionConfig('twig_component', [
            'defaults' => [
                'RomainMillan\MobileNavigation\Twig\Component\\' => [
                    'template_directory' => '@MobileNavigation/components',
                    'name_prefix' => 'MobileNavigation',
                ],
            ],
        ]);
    }

    /**
     * @param array<array-key, mixed> $config
     */
    public function loadExtension(array $config, ContainerConfigurator $container, ContainerBuilder $builder): void
    {
        /** @var \Closure(ContainerConfigurator): void $services */
        $services = require __DIR__.'/../config/services.php';
        $services($container);
    }
}
