# Changelog

All notable changes to this project are documented in this file. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.3.1 - 2026-10-30

### Fixed

- Importing the package outside a browser (SSR, a consumer's Node tests) threw
  `window is not defined` since 0.3.0: the history tracker is now only created when a
  window exists.

## 0.3.0 - 2026-10-30

Reported from Finance (the back button went to the list instead of the previous page; a
swipe back went back two pages).

### Added

- `back` controller, mounted by `BackButton`: goes to the previous page when the app's
  history proves one, otherwise follows `href`. Its aria-label says where the click leads.
- `SwipeAction::linkCarryingReturnPath()`: a link that adds `_redirect` (the current local
  path) on click. Captured by `contract.json` (`carriesReturnPath`).
- `[data-rm-mnb-page-title]`: the page's name in the history (otherwise `document.title`).
- Translation `back.previous`.

### Changed

- **Peer `@hotwired/turbo` `^8.0`** (Turbo 7 is no longer supported). Migration: under
  Turbo 7 nothing fails, but swipe back no longer activates and the back button follows
  its `href`, silently. Upgrade to Turbo 8.
- `BackButton`: the click goes to the previous page; `href` becomes the parent fallback.
- History: a register keyed by Turbo's (restorationIdentifier, restorationIndex), shared by
  the controllers, started lazily; `applyVisit`/`previousEntry` removed (never exported).
- `swipe-back`: a system cancellation (`touchcancel`) never navigates, nor a gesture during
  which the history moved (a native back): one swipe, one page back.
- A long row value (`.rm-mnb-row__value`) scrolls sideways instead of overflowing.

### Security

- `_redirect` (POST swipe actions, opt-in links) is only sent when the current path is a
  local path (`isLocalPath`); empty otherwise.
- Page titles are never stored: no account name at rest in `sessionStorage`.

## 0.2.4 - 2026-10-27

### Fixed

- A POST swipe action without confirmation (validate, duplicate…) sent nothing in a browser
  since 0.2.3: it was resent with `requestSubmit()` from inside its own submit event, which
  a browser ignores. The user's own submit now goes through; `requestSubmit()` only resends
  a confirmed action, from the confirmation sheet. The tests reproduce the browser rule
  that jsdom lacks.

### Security

- Development dependencies raised for the CI audit: `vite` 8.3.5 (GHSA-587h-7wmj-h5pm) and
  `undici` 8.12.3 through `jsdom` (GHSA-xjj6-f33q-929c). The published `dist` only changes
  by the bundler's region comments.

## 0.2.3 - 2026-10-27

Reported from Finance (a swipe action sent the user back to the top of the list).

### Changed

- `swipe-actions` submits a POST action with `requestSubmit()` instead of `form.submit()`,
  which fired no `submit` event: Turbo now takes the submission over instead of a full page
  load. A double tap sends a single POST; a failed Turbo submission can be retried. Under
  Turbo, the action's endpoint must answer with a redirect (or a 4xx/5xx).
- `LoadMore` renders its frame with `refresh="morph"`: on a morphing page refresh, a loaded
  page is reloaded in place instead of emptied. No effect without a morphing refresh.
- `large-title` and `list` realign after `turbo:morph`: the compact bar gets its collapsed
  state back, and the list leaves the "Select" or "Edit" mode.

See "Keeping the scroll after an action" in `docs/frontend.md` for the two meta tags.

## 0.2.2 - 2026-10-09

Reported from Notifier (notification history in the iOS PWA).

### Fixed

- The compact bar and its veil scrolled away with the page in an installed PWA whose document
  scrolls: they were held in absolute position on `display-mode: standalone`, which assumed
  only `rm-mnb-scroller` scrolls. The `large-title` controller now marks the bar
  `is-contained` when the scroller scrolls itself, and only then is it held in absolute
  position; otherwise it stays fixed, in a browser and in a PWA alike.

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
