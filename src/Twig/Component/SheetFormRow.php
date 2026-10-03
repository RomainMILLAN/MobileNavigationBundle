<?php

declare(strict_types=1);

namespace RomainMillan\MobileNavigation\Twig\Component;

use RomainMillan\MobileNavigation\Model\Excerpt;
use RomainMillan\MobileNavigation\Model\Tone;
use RomainMillan\MobileNavigation\Twig\Component\Option\ConfirmOptions;
use RomainMillan\MobileNavigation\Twig\Component\Option\StructuredProp;
use Symfony\UX\TwigComponent\Attribute\AsTwigComponent;
use Symfony\UX\TwigComponent\Attribute\PreMount;

/**
 * A sheet row that sends a POST (finish, stop, delete…), optionally confirmed first by
 * the ConfirmSheet of the page. Without JavaScript the form is sent directly: the server
 * stays the only judge.
 *
 * Public mutable properties are imposed by TwigComponent (see docs/contributing.md).
 */
#[AsTwigComponent]
final class SheetFormRow
{
    /** URL of the action, ALWAYS generated server side (path()/url()). */
    public string $action;

    /** CSRF token provided by the app (the bundle does not know its token id). */
    public string $token;

    /** Label (already translated). */
    public string|\Stringable $label;

    /** CSS classes of the chip icon, or null. */
    public ?string $icon = null;

    /** Tone of the chip, always one of Tone (unknown -> neutral). */
    public string $tone = 'neutral';

    /** Destructive action (red ink). */
    public bool $danger = false;

    /** @var array{title: string|\Stringable, message: string|\Stringable, confirmLabel: string|\Stringable|null}|null Confirmation texts (already translated), or null. */
    public ?array $confirm = null;

    /** @var array<string, string|int|float|bool> Extra hidden fields: scalar values, never a business decision. */
    public array $fields = [];

    /**
     * @param array<string, mixed> $data
     *
     * @return array<string, mixed>
     */
    #[PreMount]
    public function preMount(array $data): array
    {
        RequiredProps::createForComponent(self::class, 'action', 'token', 'label')->assertPresentIn($data);

        $tone = $data['tone'] ?? null;
        $data['tone'] = Tone::createFromLooseValue($tone instanceof Tone || \is_string($tone) ? $tone : null)->value;

        if (null !== ($data['confirm'] ?? null)) {
            $data['confirm'] = StructuredProp::createForComponent(self::class, 'confirm', new ConfirmOptions())->resolve($data['confirm']);
        }

        $data['fields'] = $this->fields($data['fields'] ?? []);

        return $data;
    }

    /**
     * @return array<string, string|int|float|bool>
     */
    private function fields(mixed $fields): array
    {
        if (!\is_array($fields)) {
            throw new \InvalidArgumentException('Cannot mount the "fields" prop of the MobileNavigation:SheetFormRow component: an array is expected.');
        }

        $validated = [];
        foreach ($fields as $name => $value) {
            $name = (string) $name;
            // The CSRF token is the "token" prop: a field cannot replace it.
            if ('_token' === $name || !\is_scalar($value)) {
                throw new \InvalidArgumentException(\sprintf('Cannot mount the %s field of the MobileNavigation:SheetFormRow component.', Excerpt::createFromString($name)->toString()));
            }
            $validated[$name] = $value;
        }

        return $validated;
    }
}
