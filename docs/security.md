# Security

The bundle renders what the app gives it. These are the guarantees it offers and the ones
the app must provide.

## What the app must guarantee

- **Texts** are translated and escaped by Twig as usual; never pass unescaped user content
  as `Markup`.
- **URLs** passed as props (`href`, `tabs[].href`, `fab.href`, `back.href`…) are generated
  by the app (`path()` / `url()`), never taken from user input.
- **POST swipe actions**: the endpoint must
  - check the CSRF token sent as `_token` (one token per action is recommended over a
    token shared by every row);
  - validate `_redirect` as a **local path** before redirecting to it: not empty, at most
    2048 characters, starts with `/`, starts neither with `//` nor with `/\`, contains no
    control character nor space. `LocalPath::createFromString()` implements this rule.

## What the bundle guarantees

- `SwipeAction` only accepts local paths (same rule as above), so a swipe action can
  never point to another site, nor to `javascript:`.
- The `navigate` and `swipe-actions` controllers only follow http(s) URLs of the current
  origin, whatever the markup says.
- `|raw` is only used on types guaranteed escaped: `StimulusAttributes`
  (`fabAttributes`, `selectable.attributes`) and `ValueAttributes`.
- `ValueAttributes`: no Stimulus/Bootstrap/Turbo wiring; names and values are
  app-controlled. Names are whitelisted (`data-*`, `aria-*`), and `data-controller`,
  `data-action`, Stimulus targets/values/outlets/classes/params, `data-bs*` and
  `data-turbo*` are refused; values are HTML-escaped; a boolean on `aria-*` is refused
  (`aria-hidden` alone does not mean `true` to assistive technologies). Any future
  JS library driven by `data-*` attributes (Live Components, htmx…) must be added to this
  exclusion list.
- Rejected inputs are quoted in exception messages as a bounded, JSON-encoded excerpt,
  never raw.
- The controllers never write HTML as strings (`innerHTML`, `insertAdjacentHTML`): labels
  are set with `textContent`, tones through a closed list of classes.
- The JS package has no install script, and its own dependencies run none
  (`enableScripts: false`).
