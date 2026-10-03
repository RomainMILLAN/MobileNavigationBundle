<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Tests\Support;

use Symfony\Component\Translation\Loader\ArrayLoader;
use Symfony\Component\Translation\Translator;

/**
 * A real translator holding a few "app" messages, to see payloads translated.
 */
final class TestTranslator
{
    public static function create(): Translator
    {
        $translator = new Translator('en');
        $translator->addLoader('array', new ArrayLoader());
        $translator->addResource('array', ['item.edit' => 'Edit', 'item.cancel' => 'Cancel', 'item.cancel_confirm' => 'It will no longer count.', 'item.validate' => 'Validate'], 'en', 'app');

        return $translator;
    }
}
