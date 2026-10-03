<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Tests\Integration\Twig\Component;

use RomainMillan\MobileNavigation\Tests\Integration\IntegrationTestCase;
use Symfony\Component\DomCrawler\Crawler;
use Symfony\UX\StimulusBundle\Dto\StimulusAttributes;
use Twig\Environment;

abstract class ComponentTestCase extends IntegrationTestCase
{
    protected const PREFIX = 'romainmillan--mobile-navigation-bundle--';

    /**
     * Mounting alone must fail: a missing prop is reported where the component is called.
     *
     * @param array<string, mixed> $data
     */
    protected function assertMountFails(string $name, array $data, string $message): void
    {
        try {
            $this->mountTwigComponent('MobileNavigation:'.$name, $data);
            self::fail(\sprintf('Mounting MobileNavigation:%s should fail.', $name));
        } catch (\InvalidArgumentException $exception) {
            self::assertStringContainsString($message, $exception->getMessage());
        }
    }

    protected function stimulusAttributes(): StimulusAttributes
    {
        $twig = self::getContainer()->get('twig');
        self::assertInstanceOf(Environment::class, $twig);

        return new StimulusAttributes($twig);
    }

    protected function root(Crawler $crawler): Crawler
    {
        return $crawler->filter('body > *')->first();
    }
}
