<?php

declare(strict_types=1);

use Rector\Config\RectorConfig;

return RectorConfig::configure()
    ->withPaths([__DIR__.'/config', __DIR__.'/src', __DIR__.'/tests'])
    ->withSkip([
        __DIR__.'/tests/Integration/App/var',
    ])
    // The package supports PHP 8.2: never let Rector introduce 8.3+ syntax (typed constants, #[Override]…).
    ->withPhpSets(php82: true)
    ->withPreparedSets(deadCode: true, codeQuality: true, typeDeclarations: true, earlyReturn: true)
    ->withImportNames(importShortClasses: false, removeUnusedImports: true);
