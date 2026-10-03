<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Tests\Integration\App;

use RomainMillan\MobileNavigation\MobileNavigationBundle;
use RomainMillan\MobileNavigation\Tests\Integration\App\Component\AppRow;
use Symfony\Bundle\FrameworkBundle\FrameworkBundle;
use Symfony\Bundle\FrameworkBundle\Kernel\MicroKernelTrait;
use Symfony\Bundle\TwigBundle\TwigBundle;
use Symfony\Component\DependencyInjection\Loader\Configurator\ContainerConfigurator;
use Symfony\Component\HttpKernel\Kernel;
use Symfony\UX\StimulusBundle\StimulusBundle;
use Symfony\UX\TwigComponent\TwigComponentBundle;

/**
 * Environments: "test" (the bundle as an app installs it), "override" (the app overrides
 * a bundle template from templates/bundles/MobileNavigationBundle/), "no_twig_component"
 * (TwigComponentBundle missing).
 */
final class TestKernel extends Kernel
{
    use MicroKernelTrait;

    public function registerBundles(): iterable
    {
        yield new FrameworkBundle();
        yield new TwigBundle();

        if ('no_twig_component' !== $this->environment) {
            yield new TwigComponentBundle();
        }

        yield new StimulusBundle();
        yield new MobileNavigationBundle();
    }

    public function getProjectDir(): string
    {
        return __DIR__;
    }

    public function getCacheDir(): string
    {
        // Infection runs several PHPUnit processes at once, each with its own TEST_TOKEN.
        $process = getenv('TEST_TOKEN');

        return __DIR__.'/var/cache/'.$this->environment.(false === $process ? '' : '-'.$process);
    }

    public function getLogDir(): string
    {
        return __DIR__.'/var/log';
    }

    protected function configureContainer(ContainerConfigurator $container): void
    {
        $container->extension('framework', [
            'secret' => 'test',
            'test' => true,
            'http_method_override' => false,
            'handle_all_throwables' => true,
            'php_errors' => ['log' => true],
            'default_locale' => 'en',
            'translator' => ['default_path' => __DIR__.'/translations', 'fallbacks' => ['en']],
        ]);

        // Only the "override" environment sees templates/bundles/MobileNavigationBundle/:
        // Twig looks for bundle overrides under its default path.
        $container->extension('twig', [
            'default_path' => 'override' === $this->environment ? __DIR__.'/templates' : __DIR__.'/templates/app',
            'paths' => [__DIR__.'/templates/app' => null],
        ]);

        if ('no_twig_component' !== $this->environment) {
            $container->extension('twig_component', ['anonymous_template_directory' => 'components/']);
            $container->services()->set(AppRow::class)->autoconfigure();
        }
    }
}
