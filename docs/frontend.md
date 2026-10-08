# Frontend

The JS package `@romainmillan/mobile-navigation-bundle` lives in `assets/` of the
Composer package. It ships prebuilt ESM files (`dist/`), one per controller, with
`@hotwired/stimulus` as the only import.

## Controllers

| Name | Role |
|---|---|
| `tab-bar` | lens that follows the finger, haptics |
| `emit-event` | dispatches a window event on click (sheet toggles) |
| `sheet` | sheet: open/close commands, focus trap, drag to dismiss |
| `confirm-sheet` | the confirmation sheet (answers `rm-mnb-confirm:request`) |
| `confirm-submit` | a POST form confirmed first (`SheetFormRow`), submitted once |
| `large-title` | shows the compact bar when the `<h1>` scrolls out |
| `list` | section headers deduplicated after "Load more", "Select" and "Edit" modes |
| `swipe-actions` | actions revealed by swiping a row to the left |
| `swipe-back` | swipe from the left edge to go back (installed PWA) |
| `filter-bar` | mirrors the proxy search field into the app form |
| `gesture` | tap / double tap / swipe / long press events |
| `navigate` | navigates to a URL (same origin only) |

With Webpack Encore or AssetMapper, enable them through Symfony UX (see the README). To
register them by hand instead:

```ts
import { registerMobileNavigation } from '@romainmillan/mobile-navigation-bundle';

registerMobileNavigation(application);
```

The identifiers are the Symfony UX ones (`romainmillan--mobile-navigation-bundle--sheet`),
so `stimulus_controller(rm_mnb_controller('sheet'))` works in both cases.

## Outside Symfony

An app that does not run Symfony (Laravel/Blade, for one) can still use the bundle: it
consumes `styles/` (or `dist/mobile-navigation.css`) and `dist/` as they are, registers the
controllers with `registerMobileNavigation()`, and ports the templates it needs.

`assets/contract.json` is the contract such a port tests itself against: the Stimulus
identifier prefix, the methods sent as `_method`, reference swipe payloads and the tab badge
cases ("99+"). `ContractTest` rebuilds it from the PHP models, so it never drifts from what
the Twig components render. When upgrading, diff `templates/components/` between the two
tags and re-run the port's contract tests.

## Turbo is optional

The bundle never imports `@hotwired/turbo`; it reads `window.Turbo` at run time.

| Feature | With Turbo | Without Turbo |
|---|---|---|
| `navigate` | `Turbo.visit()` | full page load (`location.assign()`) |
| `swipe-back` | active | inert (it needs Turbo snapshots and visit events) |
| `LoadMore` | loads the next page in a frame | **requires Turbo** |
| `forceCloseEvents` default | closes sheets before a snapshot | harmless (the event never fires) |

`navigate` and `swipe-actions` only follow http(s) URLs of the current origin.

## Storage

`swipe-back` keeps the in-app history in `sessionStorage['rm-mnb-history']` (URL and
scroll position of the last 50 pages).
