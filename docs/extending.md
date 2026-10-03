# Extending

## Overriding a template

Like any bundle template, a component template can be replaced by the app:
`templates/bundles/MobileNavigationBundle/components/<Component>.html.twig`. The props
stay available as variables and through `this`.

Prefer overriding a **block** when you only need to change a part.

## Blocks

| Component | Block | Variables |
|---|---|---|
| `TabBar` | `tab_icon` | `tab` (`{href, label, icon, current}`) |
| `TabBar` | `more_icon` | `more` (`{sheet, label, icon}`) |
| `TabBar` | `fab_icon` (shared by the three "+" variants) | `fab` (`{label, icon, href, sheet}`) |
| `ListRow` | `leading_icon` | `leading` (`{icon, tone}`) |
| `SheetRow` | `icon` | `icon`, `tone` |
| `ActionsDisc` | `icon` (replaces the three dots) | `icon` |
| `EmptyState` | `icon` | `icon` |
| `SheetRow` | `content` (chip and label) | all props |
| `Sheet`, `SheetGroup`, `ListSection`, `Hero`, `ChartFrame` | `content` | — |
| `CompactBar` | `trailing` | — |

```twig
{% component 'MobileNavigation:TabBar' with {label: 'Navigation', tabs: tabs, fab: fab} %}
    {% block tab_icon %}{{ ux_icon(tab.icon, {'aria-hidden': 'true'}) }}{% endblock %}
    {% block fab_icon %}{{ ux_icon('plus', {'aria-hidden': 'true'}) }}{% endblock %}
{% endcomponent %}
```

The block content is rendered inside `<span class="rm-mnb-icon-slot">`, which is invisible
to layout.

## Composing a bundle component in an app component

An app component can wrap a bundle component and hand it values it has already built:
`ValueAttributes`, `SwipeActions` and `Tone` instances are accepted as they are.

```php
#[AsTwigComponent('TransactionRow')]
final class TransactionRow
{
    public Transaction $transaction;

    public function swipe(): SwipeActions
    {
        return SwipeActions::createFromActions($this->transactionSwipeActions->resolve($this->transaction), $this->csrfToken);
    }

    public function valueAttributes(): ValueAttributes
    {
        return ValueAttributes::createFromArray(['data-maskable' => true]);
    }
}
```

```twig
{{ component('MobileNavigation:ListRow', {
    title: transaction.description,
    value: {text: transaction.amount, tone: this.tone},
    valueAttributes: this.valueAttributes,
    swipe: this.swipe,
}) }}
```

## Value attributes

`valueAttributes` (on `ListRow` and `SheetRow`) is the way to put app attributes on the
value element: `data-*` and `aria-*` only, no Stimulus, Bootstrap or Turbo wiring (see
[security.md](security.md)). Attach behaviour to an ancestor instead, and target the value
with a `data-*` attribute.
