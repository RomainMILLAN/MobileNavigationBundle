# Components

Every component is named `MobileNavigation:<Name>`:
`<twig:MobileNavigation:Sheet …>` or `component('MobileNavigation:Sheet', {…})`. Inside a
classic `{% block %}` of a component, the `<twig:…>` tag is not compiled: use
`component()` there.

All texts are **already translated** by the app; all URLs are **generated server side**
(`path()` / `url()`), never taken from user input.

**Tones** are a closed list: `accent`, `positive`, `negative`, `info`, `warning`,
`neutral`. An unknown tone *value* falls back to `neutral`; an unknown *key* inside a
structured prop fails at mount time. A tone can be given as a string or as a
`RomainMillan\MobileNavigation\Model\Tone`.

**Required props** missing or `null` fail at mount time:
`There is no "<prop>" prop for the MobileNavigation:<Component> component.`

**Free attributes** (class, `role`, `aria-*`, `data-*`, Stimulus actions of the app by
spread `{{ ...stimulus_action('x', 'y') }}`) go on the root element of the component.

## Props

| Component | Props (default) | Blocks | Notes |
|---|---|---|---|
| `TabBar` | `label` (required), `tabs` (required, list of `{href, label, icon, current = false}`), `fab` (required, `{label, icon, href?, sheet?}`), `more` (`null`, `{sheet, label, icon}`), `fabAttributes` (`null`, `?StimulusAttributes`) | `tab_icon` (variable `tab`), `more_icon` (`more`), `fab_icon` (`fab`) | controllers `tab-bar`, `emit-event` (`<sheet>:toggle`); the "+" is a link with `href`, a button that emits `<sheet>:toggle` with `sheet`, disabled otherwise; `fabAttributes` is chained to `emit-event` in a **single** `data-controller` |
| `Sheet` | `id` (required), `title` (required), `titleHidden` (`false`), `scrollable` (`true`), `forceCloseEvents` (`['turbo:before-cache']`), `mobileOnly` (`false`) | `content` | controller `sheet`; with `mobileOnly`, above 768 px the content renders in place |
| `SheetGroup` | `heading` (`null`), `closesSheet` (`false`), `footer` (`null`, a note under the group) | `content` | target `sheet:closeZone` with `closesSheet` |
| `SheetRow` | `label` (`null`), `href` (`null`), `icon` (`null`), `tone` (`'neutral'`), `value` (`null`, string), `valueAttributes` (array, empty by default), `badge` (`null`, string), `chevron` (`false`), `checked` (`false`), `danger` (`false`), `static` (`false`), `switch` (`false`), `multiline` (`false`), `valueTone` (`null`) | `content`, `icon` | renders an `a` with `href`, a `div` with `static`, a `button` otherwise; with `switch`, the state is `aria-checked`, held by the app; with `multiline`, the value goes under the label, on several lines; `valueTone` inks the value (`neutral` or unknown = body ink) |
| `SheetFormRow` | `action` (required), `token` (required), `label` (required), `icon` (`null`), `tone` (`'neutral'`), `danger` (`false`), `confirm` (`null`, `{title, message, confirmLabel = label}`), `fields` (`{}`, hidden fields with scalar values, `_token` refused) | — | a POST `<form>` holding a submit `SheetRow`; with `confirm`, controller `confirm-submit` asks the `ConfirmSheet` first (or `confirm()` when the sheet is not shown), and lets a single submission through |
| `BackButton` | `href` (required), `label` (required) | — | |
| `CompactBar` | `title` (required), `back` (`null`, `{href, label}`) | `trailing` | target `large-title:bar` |
| `ListSection` | `title` (`''`), `rows` (`[]`, rows already rendered) | `content` | target `list:section` |
| `ListRow` | `title` (required), `href` (`null`), `titleStrike` (`false`), `subtitle` (`null`), `leading` (`null`, `{icon, tone}`), `value` (`null`, `{text, tone}`), `valueAttributes` (array, empty by default), `badge` (`null`, `{label, tone}`), `chevron` (`true`), `swipe` (`null`, `{actions: list<SwipeAction>, csrfToken}`), `selectable` (`null`, `{name, value, label, attributes: ?StimulusAttributes}`), `turboFrame` (`'_top'`), `reorder` (`null`, `{label, attributes: ?StimulusAttributes}`) | `leading_icon` (variable `leading`) | controller `swipe-actions` when there are actions; `reorder` adds a drag handle shown in "Edit" mode only, the app sets its drag target on it through `attributes` |
| `SelectToggle` | — | — | a `rm-mnb-glass-pill` button that emits the window event `rm-mnb-list:toggle-selecting`; it can live outside the list; its label follows the `rm-mnb-list-selecting` class the `list` controller sets on `<html>` |
| `EditToggle` | — | — | the twin of `SelectToggle` for the "Edit" (reorder) mode: emits `rm-mnb-list:toggle-editing`; its label follows `html.rm-mnb-list-editing` |
| `ActionsDisc` | `sheet` (required), `label` (`null`: "More actions"), `icon` (`null`: three dots) | `icon` (variable `icon`) | a `rm-mnb-glass-disc` button that emits `<sheet>:toggle` |
| `Hero` | `value` (required), `label` (`null`), `tone` (`'neutral'`), `valueAttributes` (array, empty by default), `caption` (`null`), `captionTone` (`'neutral'`), `captionAttributes` (array, empty by default), `progress` (`null`, 0–100, clamped), `progressLabel` (`null`), `progressTone` (`'positive'`) | `content` | the main figure of a page; the gauge is a `progressbar` |
| `SegmentedControl` | `items` (`[]`, list of `{href, label, count = null, current = false}`), `label` (`null`) | — | links, not ARIA tabs: the current one has `aria-current="page"` |
| `EmptyState` | `title` (required), `icon` (`null`), `message` (`null`), `action` (`null`, `{href, label}`) | `icon` (variable `icon`) | empty state outside a list |
| `ChartFrame` | `title` (`null`), `caption` (`null`) | `content` | fixed-height frame: the app renders its chart in `content` and puts its controller on the root |
| `LoadMore` | `href` (required), `frameId` (required) | — | `<turbo-frame>`: requires Turbo |
| `FilterBar` | `form` (required), `sheet` (required), `field` (`null`), `placeholder` (`null`), `activeCount` (`0`) | — | controller `filter-bar` |
| `ConfirmSheet` | `id` (`'rm-mnb-confirm'`), `forceCloseEvents` (`['turbo:before-cache']`) | — | controllers `sheet` + `confirm-sheet`; answers `rm-mnb-confirm:request` |

`valueAttributes` (and `captionAttributes` of `Hero`) puts `data-*` / `aria-*` attributes on the **value element**,
e.g. `{'data-maskable': true}` for an amount the app hides on demand. `true` renders the
bare name, `false` omits the attribute, a string renders `name="value"` (escaped). Wiring
attributes are refused (see [security.md](security.md)).

## Swipe actions

`ListRow` receives `swipe: {actions, csrfToken}`, where `actions` is a list of
`RomainMillan\MobileNavigation\Model\SwipeAction`:

```php
use RomainMillan\MobileNavigation\Model\SwipeAction;
use RomainMillan\MobileNavigation\Model\Tone;
use Symfony\Component\Translation\TranslatableMessage;

SwipeAction::link($this->urlGenerator->generate('item_edit', ['id' => $id]), 'icon-edit', Tone::Accent, new TranslatableMessage('item.edit'));
SwipeAction::post($validateUrl, 'icon-check', Tone::Positive, new TranslatableMessage('item.validate'));
SwipeAction::destructive($deleteUrl, 'icon-trash', new TranslatableMessage('item.delete'), new TranslatableMessage('item.delete_confirm'));
```

A destructive action is always a POST, always negative, always confirmed in the
`ConfirmSheet` first. Every URL must be a local path. A POST action is submitted in a form
with `_token` (the CSRF token) and `_redirect` (the current path and query).

To mount the controller on markup the app renders itself:
`<div {{ rm_mnb_swipe_controller(actions, csrf_token('item')) }}>` (no `|raw` needed). Without
action, it renders nothing.

## Twig functions

| Function | Returns |
|---|---|
| `rm_mnb_controller(name)` | the Stimulus name of a bundle controller, for `stimulus_controller()`, `stimulus_action()`, `stimulus_target()` |
| `rm_mnb_swipe_controller(actions, csrfToken)` | the `StimulusAttributes` of the `swipe-actions` controller |

## Events

**Commands the bundle listens to** (window events):

| Event | Effect |
|---|---|
| `<id>:open`, `<id>:close`, `<id>:toggle` | opens, closes, toggles the sheet `<id>` |
| `rm-mnb-confirm:request` | asks the `ConfirmSheet` for a confirmation (`detail: {title, message, confirmLabel, onConfirm}`); `CONFIRM_REQUEST_EVENT` and `confirmSheetAvailable()` are exported for the app's own requests |
| `rm-mnb-list:toggle-selecting` | toggles the "Select" mode of the list (`TOGGLE_SELECTING_EVENT`) |
| `rm-mnb-list:toggle-editing` | toggles the "Edit" mode of the list (`TOGGLE_EDITING_EVENT`) |

The list commands target **every** list of the page (a page has a single selectable or
editable list). The two modes are exclusive: entering one leaves the other first, and
leaving the selection clears it.

**Notifications the bundle emits** (window events):

| Event | Meaning |
|---|---|
| `rm-mnb:sheet-opening` | a sheet is about to open (the others close); not cancelable |
| `rm-mnb:sheet-opened`, `rm-mnb:sheet-closed` | done; `detail.name` is the sheet id |
| `rm-mnb-list:editing-changed` | the list entered or left the "Edit" mode; `detail.editing` (`EDITING_CHANGED_EVENT`) |
| `rm-mnb-gesture:tap`, `:doubletap`, `:swipe`, `:longpress` | gestures of the `gesture` controller |

`forceCloseEvents` lists the window events that close a sheet without animation
(`turbo:before-cache` by default); add your own, e.g. a lock screen event.

Public state classes: `html.rm-mnb-list-selecting` and `html.rm-mnb-list-editing`, set
while the list is in that mode.

## Known inconsistencies (candidates for 0.2)

- `value` is a **string** in `SheetRow` and a **`{text, tone}` array** in `ListRow`.
- `icon` of a `SwipeAction` is a CSS class list rendered on an `<i>` by the controller,
  while the `*_icon` Twig blocks hold markup; an `iconClass` name would be clearer.
- `SheetRow` boolean flags (`danger`, `static`, `switch`, `checked`, `chevron`) could
  become a variant.
