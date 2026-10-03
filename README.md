# MobileNavigationBundle

iOS 26 "liquid glass" mobile navigation for Symfony: a glass tab bar with a sliding lens,
iOS sheets, a large title with a compact bar, and compact grouped lists with swipe actions,
selection mode and "Load more". Twig components on the server, Stimulus controllers in
the browser.

The bundle provides the **chrome**; the **content** (routes, labels, icons) stays in your
app. Every text the components receive is already translated, every URL is generated
server side.

## Requirements

| | Supported |
|---|---|
| PHP | 8.2 – 8.5 |
| Symfony | 6.4, 7.x, 8.x |
| `symfony/ux-twig-component` | ^2.25.2 or ^3.0 |
| `symfony/stimulus-bundle` | ^2.20 or ^3.0 |
| `@hotwired/stimulus` | ^3.0 |
| `@hotwired/turbo` | ^7.3 or ^8.0, **optional** |

UX 3 requires PHP ≥ 8.4 and Symfony ≥ 7.4.

## Installation

```bash
composer require romainmillan/mobile-navigation-bundle
```

Without Symfony Flex, enable the bundle in `config/bundles.php`:

```php
return [
    // ...
    RomainMillan\MobileNavigation\MobileNavigationBundle::class => ['all' => true],
];
```

There is nothing to configure: the templates are registered as `@MobileNavigation`, the
components as `MobileNavigation:*`, the translations under the `rm_mnb` domain.

### Frontend with Webpack Encore

Add the JS package, which ships with the Composer package:

```json
{
    "devDependencies": {
        "@romainmillan/mobile-navigation-bundle": "file:vendor/romainmillan/mobile-navigation-bundle/assets"
    }
}
```

then enable its controllers in `assets/controllers.json`:

```json
{
    "controllers": {
        "@romainmillan/mobile-navigation-bundle": {
            "sheet": { "enabled": true, "fetch": "eager" }
        }
    }
}
```

(one entry per controller: `confirm-sheet`, `confirm-submit`, `emit-event`, `filter-bar`, `gesture`,
`large-title`, `list`, `navigate`, `sheet`, `swipe-actions`, `swipe-back`, `tab-bar`). You
can also register them all by hand: see [docs/frontend.md](docs/frontend.md).

### Frontend with AssetMapper

```bash
php bin/console importmap:require @romainmillan/mobile-navigation-bundle
```

The package declares its controllers (`symfony.controllers`) and its importmap needs
(`symfony.importmap`): StimulusBundle picks them up like any Symfony UX package.

### Styles

Pick one:

- **Sass**, to override the tokens:
  ```scss
  @use '@romainmillan/mobile-navigation-bundle/styles' with ($rm-mnb-control-size: 48px);
  ```
- **Precompiled CSS**: `@romainmillan/mobile-navigation-bundle/dist/mobile-navigation.css`.

Then map the `--rm-mnb-*` CSS variables to your theme, in a single file. See
[docs/styles.md](docs/styles.md).

## Components

| Component | Role |
|---|---|
| `TabBar` | glass tab pill, lens, detached "+" |
| `Sheet` | iOS sheet, driven by `<id>:open|close|toggle` window events |
| `SheetGroup`, `SheetRow` | grouped list and its rows |
| `BackButton` | back disc; the parent name is spoken, not shown |
| `CompactBar` | floating compact bar (`title`, `back`, `trailing` block) |
| `ListSection`, `ListRow` | compact list: sections, rows (tap = view, swipe = actions) |
| `SelectToggle`, `EditToggle` | "Select / Done" and "Edit / Done" buttons (list modes) |
| `ActionsDisc` | "…" glass disc that opens the action sheet of the page |
| `SheetFormRow` | sheet row that sends a POST, optionally confirmed |
| `Hero` | main figure of a page, with caption and gauge |
| `SegmentedControl` | segmented control of links |
| `EmptyState` | empty state outside a list |
| `ChartFrame` | frame of a compact chart rendered by the app |
| `LoadMore` | "Load more" inside a `<turbo-frame>` (requires Turbo) |
| `FilterBar` | proxy search field and filter button |
| `ConfirmSheet` | confirmation of the destructive swipe actions (one per page) |

```twig
<twig:MobileNavigation:Sheet id="more" title="{{ 'menu.more'|trans }}">
    <twig:MobileNavigation:SheetGroup closesSheet>
        <twig:MobileNavigation:SheetRow label="{{ 'menu.settings'|trans }}" href="{{ path('settings') }}" icon="icon-settings" chevron />
    </twig:MobileNavigation:SheetGroup>
</twig:MobileNavigation:Sheet>
```

## Documentation

- [Components](docs/components.md): props, blocks, events
- [Styles](docs/styles.md): CSS variables, tokens, hook classes, dark mode
- [Frontend](docs/frontend.md): controllers, optional Turbo, manual registration
- [Extending](docs/extending.md): template overrides, icon blocks, app components
- [Security](docs/security.md): what the app must guarantee
- [Contributing](docs/contributing.md): tooling, release, renaming points

## License

MIT, see [LICENSE](LICENSE).
