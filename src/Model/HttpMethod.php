<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Model;

/**
 * The closed list of methods a swipe action may write with.
 *
 * Browsers only submit GET and POST: PUT, PATCH and DELETE travel as a POST carrying a
 * hidden "_method" field, the convention both Symfony (framework.http_method_override)
 * and Laravel read. The swipe-actions controller emits that field for these three values
 * only, whatever the payload says.
 */
enum HttpMethod: string
{
    case Post = 'POST';
    case Put = 'PUT';
    case Patch = 'PATCH';
    case Delete = 'DELETE';
}
