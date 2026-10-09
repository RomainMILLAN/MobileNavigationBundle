# Changelog

All notable changes to this project are documented in this file. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.2.1 - 2026-10-09

Reported from Notifier (dashboard in the iOS PWA).

### Fixed

- `rm-mnb-large-title` reserves `env(safe-area-inset-top)` like the compact bar: with
  `viewport-fit=cover` (iOS PWA, translucent status bar), the title was drawn under the status
  bar, and the compact bar row jumped on collapse.
- `docs/styles.md` states the large title placement contract: at the very top of the
  scroller, no host top padding above it, and a horizontal margin equal to
  `--rm-mnb-page-inset`, or its row does not line up with the compact bar.

## 0.2.0 - 2026-10-08

Requested by a Laravel/Blade app (Notifier) porting the templates.

### Added

- `TabBar` tab `badge`: a `TabBadge` (count >= 1, displayed "99+" above 99, negative tone by
  default, optional accessible label read instead of the number).
- `HttpMethod` and `SwipeAction::destructive(..., HttpMethod $method = HttpMethod::Post)`:
  a destructive swipe action can target a PUT, PATCH or DELETE route. The swipe-actions
  controller sends it as a POST with a `_method` field, for these three values only.
- `assets/contract.json`: the identifier prefix, the spoofed methods, reference swipe
  payloads and the tab badge cases, for integrations outside Symfony. `ContractTest` keeps it
  in sync with the PHP models.

### Changed

- `TabBar` `fab` is optional: without it, there is no "+" and the pill takes the whole width.

## 0.1.2 - 2026-10-04

Reported from Finance (transaction form on iPhone).

### Changed

- iOS form: labels are semibold (600), values stay regular, so a label no longer reads like
  the value typed next to it.
- iOS form: the focus ring is drawn above the hairlines with the group's radius, so no
  hairline crosses it and it fits the group's corners.

### Fixed

- iOS form: a group no longer clips its content while one of its fields has the focus, so a
  dropdown opened in a row (enhanced select, autocomplete) is shown whole.

## 0.1.1 - 2026-10-03

Reported from Finance @8cbbbe43.

### Added

- `ListRow` `caption` (`{text, tone}`, a second value under the value) and
  `captionAttributes`.

### Changed

- In a grouped list, the hairline of a row without chip starts at the text edge.
- CI also runs on `v*` tags.

## 0.1.0 - 2026-10-03

Extracted from Finance @2920cb74.

### Added

- Twig components `TabBar`, `Sheet`, `SheetGroup`, `SheetRow`, `SheetFormRow`,
  `BackButton`, `CompactBar`, `ListSection`, `ListRow`, `SelectToggle`, `EditToggle`,
  `ActionsDisc`, `Hero`, `SegmentedControl`, `EmptyState`, `ChartFrame`, `LoadMore`,
  `FilterBar`, `ConfirmSheet`, as classes with typed props validated at mount time.
- "Select" and "Edit" list modes, exclusive, driven by window events.
- `SwipeAction` / `SwipeActions` value objects, `ValueAttributes`, `Tone`, `LocalPath`.
- Twig functions `rm_mnb_controller()` and `rm_mnb_swipe_controller()`.
- Overridable icon blocks: `tab_icon`, `more_icon`, `fab_icon`, `leading_icon`, `icon`.
- iOS form styles (`rm-mnb-form`, `rm-mnb-field*`), opt-in and mobile only.
- Twelve Stimulus controllers, prebuilt in `assets/dist`, for Webpack Encore and
  AssetMapper.
- Sass sources and a precompiled `dist/mobile-navigation.css`.
- English and French translations (`rm_mnb` domain).

### Changed (compared to the in-app module)

- `maskable` is replaced by the generic `valueAttributes` prop; `Hero` no longer masks
  its value by default (`valueAttributes` and `captionAttributes`, empty by default).
- Turbo is optional: never imported, read from `window.Turbo`.
- `navigate` and `swipe-actions` only follow same-origin http(s) URLs.
- App-specific classes (`rm-mnb-bulk-bar`, `rm-mnb-avatar`, `rm-mnb-identity*`,
  `rm-mnb-row--action`) are no longer styled by the bundle.
- Minimum `symfony/ux-twig-component` is 2.25.2: earlier 2.x versions escape twice the
  `StimulusAttributes` passed to `attributes.defaults()`.
