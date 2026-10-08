<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Model;

use Symfony\Contracts\Translation\TranslatableInterface;
use Symfony\Contracts\Translation\TranslatorInterface;

/**
 * One action revealed by swiping a list row to the left.
 *
 * `icon` is a CSS class list, rendered on an <i> by the swipe-actions controller (unlike
 * the *_icon Twig blocks, which hold markup). `url` is always a local path: every action,
 * GET included, targets the current origin.
 *
 * "Destructive" is carried by the type: a deletion or a cancellation is built with
 * destructive(), so it always writes, is always negative and always confirmed first. It
 * writes with POST unless the route expects another HttpMethod (a DELETE route, say): the
 * controller then sends a POST with a "_method" field.
 */
final readonly class SwipeAction
{
    private const GET = 'GET';

    private function __construct(
        private LocalPath $url,
        private string $icon,
        private Tone $tone,
        private TranslatableInterface $label,
        private string $method,
        private ?TranslatableInterface $confirm,
    ) {
    }

    /** A navigation (GET): view, edit. */
    public static function link(string $url, string $icon, Tone $tone, TranslatableInterface $label): self
    {
        return new self(LocalPath::createFromString($url), $icon, $tone, $label, self::GET, null);
    }

    /** A write that loses nothing (POST): validate. */
    public static function post(string $url, string $icon, Tone $tone, TranslatableInterface $label): self
    {
        return new self(LocalPath::createFromString($url), $icon, $tone, $label, HttpMethod::Post->value, null);
    }

    /** A write that destroys or cancels (negative tone, mandatory confirmation). */
    public static function destructive(string $url, string $icon, TranslatableInterface $label, TranslatableInterface $confirm, HttpMethod $method = HttpMethod::Post): self
    {
        return new self(LocalPath::createFromString($url), $icon, Tone::Negative, $label, $method->value, $confirm);
    }

    /**
     * The action, described for the swipe-actions controller: `method` is omitted for a
     * GET, `confirm` when there is none.
     *
     * The translator is lent for the duration of the call, never kept: the action stays a
     * value without state dependency.
     *
     * @return array{url: string, icon: string, tone: string, label: string, method?: string, confirm?: string}
     */
    public function payload(TranslatorInterface $translator): array
    {
        $payload = [
            'url' => $this->url->toString(),
            'icon' => $this->icon,
            'tone' => $this->tone->value,
            'label' => $this->label->trans($translator),
        ];

        if (self::GET !== $this->method) {
            $payload['method'] = $this->method;
        }

        if ($this->confirm instanceof TranslatableInterface) {
            $payload['confirm'] = $this->confirm->trans($translator);
        }

        return $payload;
    }

    /** Exposed for consumer tests, not part of the rendering contract. */
    public function getMethod(): string
    {
        return $this->method;
    }

    /** Exposed for consumer tests, not part of the rendering contract. */
    public function isDestructive(): bool
    {
        return $this->confirm instanceof TranslatableInterface;
    }

    /** Exposed for consumer tests, not part of the rendering contract. */
    public function getLabel(): TranslatableInterface
    {
        return $this->label;
    }
}
