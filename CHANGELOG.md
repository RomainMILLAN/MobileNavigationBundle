# Changelog

All notable changes to this project are documented in this file. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.1.1 - Unreleased

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
