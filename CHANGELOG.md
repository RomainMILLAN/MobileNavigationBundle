# Changelog

All notable changes to this project are documented in this file. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.1.0 - Unreleased

Extracted from Finance @6ec62d3e.

### Added

- Twig components `TabBar`, `Sheet`, `SheetGroup`, `SheetRow`, `BackButton`,
  `CompactBar`, `ListSection`, `ListRow`, `SelectToggle`, `LoadMore`, `FilterBar`,
  `ConfirmSheet`, as classes with typed props validated at mount time.
- `SwipeAction` / `SwipeActions` value objects, `ValueAttributes`, `Tone`, `LocalPath`.
- Twig functions `rm_mnb_controller()` and `rm_mnb_swipe_controller()`.
- Overridable icon blocks: `tab_icon`, `more_icon`, `fab_icon`, `leading_icon`, `icon`.
- Eleven Stimulus controllers, prebuilt in `assets/dist`, for Webpack Encore and
  AssetMapper.
- Sass sources and a precompiled `dist/mobile-navigation.css`.
- English and French translations (`rm_mnb` domain).

### Changed (compared to the in-app module)

- `maskable` is replaced by the generic `valueAttributes` prop.
- Turbo is optional: never imported, read from `window.Turbo`.
- `navigate` and `swipe-actions` only follow same-origin http(s) URLs.
- App-specific classes (`rm-mnb-bulk-bar`, `rm-mnb-avatar`, `rm-mnb-identity*`,
  `rm-mnb-row--action`) are no longer styled by the bundle.
- Minimum `symfony/ux-twig-component` is 2.25.2: earlier 2.x versions escape twice the
  `StimulusAttributes` passed to `attributes.defaults()`.
