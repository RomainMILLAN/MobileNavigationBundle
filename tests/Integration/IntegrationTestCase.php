<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Tests\Integration;

use RomainMillan\MobileNavigation\Tests\Integration\App\TestKernel;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;
use Symfony\Component\DomCrawler\Crawler;
use Symfony\UX\TwigComponent\Test\InteractsWithTwigComponents;
use Twig\Environment;

abstract class IntegrationTestCase extends KernelTestCase
{
    use InteractsWithTwigComponents;

    protected static function getKernelClass(): string
    {
        return TestKernel::class;
    }

    /**
     * @param array<string, mixed> $data
     */
    protected function renderComponent(string $name, array $data = []): Crawler
    {
        return $this->renderTwigComponent('MobileNavigation:'.$name, $data)->crawler();
    }

    /**
     * Renders a template source through the real Twig environment (autoescape on).
     *
     * @param array<string, mixed> $context
     */
    protected function renderTemplate(string $source, array $context = []): string
    {
        $twig = self::getContainer()->get('twig');
        self::assertInstanceOf(Environment::class, $twig);

        return $twig->createTemplate($source)->render($context);
    }
}
