# Styles

Import the styles once, either as Sass or as precompiled CSS:

```scss
@use '@romainmillan/mobile-navigation-bundle/styles' with (
    $rm-mnb-control-size: 44px,
);
```

```js
import '@romainmillan/mobile-navigation-bundle/dist/mobile-navigation.css';
```

Then map the CSS variables to your theme in **one file**.

## CSS variables

Every variable has a neutral default. They are all prefixed `--rm-mnb-`.

| Variable | Role |
|---|---|
| `surface`, `surface-rgb` | background of groups, rows and glass |
| `ink`, `ink-rgb` | text |
| `accent`, `accent-ink`, `accent-fill`, `on-accent` | focus ring, accent text (≥ 4.5:1 on glass), fill of the "+", text on that fill |
| `danger`, `danger-ink` | destructive action |
| `border`, `backdrop` | hairlines, veil under a sheet |
| `glass-floor`, `glass-floor-strong`, `glass-shadow` | glass floor opacity and shadow |
| `lens`, `lens-dragging` | lens of the tab bar |
| `page-inset` | side margin of the content (edge of the large title) |
| `tone-{t}`, `tone-{t}-ink`, `tone-{t}-solid`, `on-tone` | chip, text and solid fill of each tone |

## Dark mode

Either set `data-rm-mnb-theme="dark"` on an ancestor, or include the `dark-defaults` mixin
in your own dark selector, then override what you need:

```scss
@use '@romainmillan/mobile-navigation-bundle/styles' as mnb;

[data-theme='dark'] {
    @include mnb.dark-defaults;
    --rm-mnb-accent: #0a84ff;
}
```

`light-defaults` is available the same way.

## Sass tokens

Sizes, radii, curves and z-indexes are `!default` Sass variables (`_tokens.scss`):
`$rm-mnb-mobile-max`, `$rm-mnb-tab-bar-height`, `$rm-mnb-tab-bar-gap`,
`$rm-mnb-tab-bar-inset`, `$rm-mnb-fab-size`, `$rm-mnb-control-size`,
`$rm-mnb-large-title-size`, `$rm-mnb-top-row-offset`, `$rm-mnb-row-min-height`,
`$rm-mnb-field-min-height`, `$rm-mnb-chart-height`,
`$rm-mnb-radius-*`, `$rm-mnb-glass-blur`, `$rm-mnb-z-*`, `$rm-mnb-ease-*`,
`$rm-mnb-duration-*`. `$rm-mnb-tones` is the closed list of tones (not configurable). The
mixins `glass`, `accent-ink` and `focus-ring` are forwarded too.

## Classes

Every class is prefixed `rm-mnb-`. They fall into three categories.

1. **Internal**: emitted only by the components (`rm-mnb-list-row__*`,
   `rm-mnb-tab-bar__*`, `rm-mnb-sheet__handle`…). Not an API: they may change.
2. **Public**: set only by the app, never emitted by a component.

   | Class | Where |
   |---|---|
   | `rm-mnb-scroller` | the scrolling container (bottom margin under the tab bar) |
   | `rm-mnb-large-title` | the page title box (iOS grid) |
   | `rm-mnb-large-title__back` | the `BackButton` of the large title |
   | `rm-mnb-large-title__title` | the `<h1>` |
   | `rm-mnb-large-title__trailing` | actions and avatar |
   | `rm-mnb-list` | the grouped list (host of the `list` controller) |
   | `rm-mnb-empty` | empty state of a list |
   | `rm-mnb-tone--{tone}` | sets `--rm-mnb-tone` from a tone |
   | `rm-mnb-form`, `rm-mnb-form-group`, `rm-mnb-form-heading`, `rm-mnb-field*`, `rm-mnb-form__actions` | the iOS form, see below |

3. **Double use**: emitted by a component **and** usable by hand: `rm-mnb-chip`,
   `rm-mnb-row`, `rm-mnb-row__label`, `rm-mnb-row__value`, `rm-mnb-group`,
   `rm-mnb-sheet*`, `rm-mnb-glass-disc` and `rm-mnb-glass-pill` (44 px glass buttons),
   `rm-mnb-visually-hidden`. Their icon rules use a generic descendant selector
   (`:where(i, svg)`), so a raw `<i>` or `<svg>` works as well as the components' markup.

## iOS form

`_form.scss` turns an app form into iOS grouped rows, **only** inside a
`<form class="rm-mnb-form">` and **only** below 768 px: elsewhere the classes are inert,
so the app can put them in its form theme everywhere.

| Class | Where |
|---|---|
| `rm-mnb-form` | the `<form>` |
| `rm-mnb-form-group` | a rounded group of fields |
| `rm-mnb-form-heading` | the heading above a group |
| `rm-mnb-field` | a short field row: the `<label>` first on the left, the native control on the right |
| `rm-mnb-field--stacked` | a long field: label above, full-width control |
| `rm-mnb-field--switch` | a checkbox drawn as an iOS switch |
| `rm-mnb-field__error`, `rm-mnb-field__help` | error / help under the row |
| `rm-mnb-form__actions` | the glass action bar |

The bundle only styles native elements (`input`, `select`, `textarea`, `label`); the app
rewires its own widgets (input groups, enhanced selects) in its adapter.

A group clips its rows (clean corners), **except while one of its fields has the focus**:
a dropdown opened in a row is then shown whole. The focus ring is drawn above the hairlines
with the group's radius, so it fits the group's corners whatever the markup between the
group and the row. Labels are semibold, values regular.

## Icons

The bundle depends on no icon font. Its own icons (chevrons, check, search, filters) are
CSS masks (`rm-mnb-icon rm-mnb-icon--*`: `chevron`, `back`, `check`, `search`, `filters`,
`grip`, `more`), painted in the text color.

Domain icons come from the app: by default the components render
`<i class="{{ icon }}" aria-hidden="true"></i>` inside a `<span class="rm-mnb-icon-slot">`.
The slot is invisible to layout (`display: contents`). Replace the `<i>` with anything by
overriding the icon block (see [extending.md](extending.md)); an image or a sprite is
sized by the app.
