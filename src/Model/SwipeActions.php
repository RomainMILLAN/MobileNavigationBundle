<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Model;

use Symfony\Contracts\Translation\TranslatorInterface;

/**
 * A mountable set of swipe actions: the actions and the CSRF token that authorises them.
 *
 * This class is the authority for the "actions imply a token" invariant; SwipeOptions
 * only checks keys and types.
 */
final readonly class SwipeActions
{
    /**
     * @param list<SwipeAction> $actions
     */
    private function __construct(
        private array $actions,
        private string $csrfToken,
    ) {
    }

    /**
     * @param iterable<mixed> $actions
     */
    public static function createFromActions(iterable $actions, string $csrfToken): self
    {
        $validated = [];

        foreach ($actions as $action) {
            if (!$action instanceof SwipeAction) {
                throw new \InvalidArgumentException(\sprintf('Cannot mount a swipe action of type "%s".', get_debug_type($action)));
            }

            $validated[] = $action;
        }

        if ([] !== $validated && '' === $csrfToken) {
            throw new \InvalidArgumentException('Cannot mount swipe actions without a CSRF token.');
        }

        return new self($validated, $csrfToken);
    }

    public static function createEmpty(): self
    {
        return new self([], '');
    }

    public function isEmpty(): bool
    {
        return [] === $this->actions;
    }

    /**
     * @return array{actions: list<array{url: string, icon: string, tone: string, label: string, method?: string, confirm?: string}>, csrfToken: string}
     */
    public function payload(TranslatorInterface $translator): array
    {
        return [
            'actions' => array_map(
                static fn (SwipeAction $action): array => $action->payload($translator),
                $this->actions,
            ),
            'csrfToken' => $this->csrfToken,
        ];
    }
}
