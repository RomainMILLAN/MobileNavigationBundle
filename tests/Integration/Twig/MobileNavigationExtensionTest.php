<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Tests\Integration\Twig;

use PHPUnit\Framework\Attributes\Test;
use RomainMillan\MobileNavigation\Tests\Integration\IntegrationTestCase;

final class MobileNavigationExtensionTest extends IntegrationTestCase
{
    private const PREFIX = 'romainmillan--mobile-navigation-bundle--';

    #[Test]
    public function it_should_name_a_bundle_controller(): void
    {
        self::assertSame('@romainmillan/mobile-navigation-bundle/sheet', $this->renderTemplate("{{ rm_mnb_controller('sheet') }}"));
        self::assertSame('data-controller="'.self::PREFIX.'sheet"', $this->renderTemplate("{{ stimulus_controller(rm_mnb_controller('sheet')) }}"));
    }
}
