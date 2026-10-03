<?php

declare(strict_types=1);

use Symfony\Component\Filesystem\Filesystem;

require __DIR__.'/../vendor/autoload.php';

// A stale container (built before a source change, or by a mutation run) would hide the
// change: every plain PHPUnit run starts from an empty kernel cache. Mutation runs get
// one cache per process instead (see TestKernel::getCacheDir()).
if (false === getenv('INFECTION')) {
    (new Filesystem())->remove(__DIR__.'/Integration/App/var/cache');
}
