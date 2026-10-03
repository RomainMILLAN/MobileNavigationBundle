# Contributing

## Tooling

Everything runs in Docker (no port is published):

```bash
make install    # build the containers, install Composer, tools and Yarn dependencies
make tests      # PHPUnit, Vitest, TypeScript type check
make quality    # php-cs-fixer, PHPStan (max), Rector, deptrac
make infection  # mutation testing of src/Model and src/Twig
make js.build   # rebuild assets/dist (committed)
make help       # every target
```

- PHP tools live in `tools/<tool>/` with their own `composer.lock`.
- Node is pinned by `.nvmrc` (CI and the `node` container); Yarn by `packageManager` in
  `assets/package.json` (with its hash, checked by Corepack).
- `assets/.yarnrc.yml` disables install scripts and refuses packages published less than
  3 days ago.
- `assets/dist` is committed: CI rebuilds it and fails on any difference.

## Design choices

The PHP code follows Elegant Objects (final classes, named constructors, no `null`
returns), with assumed exceptions:

- **Component classes** have public mutable properties: TwigComponent mounts props that
  way.
- `fabAttributes` and `selectable.attributes` stay `?StimulusAttributes`: an empty
  `StimulusAttributes` needs the Twig environment to be built.
- The PreMount hooks repeat "resolve the prop when present". To factor out in 0.2 if it
  grows.

## Release

1. Update `CHANGELOG.md` (move "Unreleased" to the version and date).
2. Bump `version` in `assets/package.json`.
3. `make tests quality infection`, `make js.build` (no diff).
4. Tag `vX.Y.Z` on `main`, push the tag; Packagist picks it up.

## Renaming points

The package name is spelled in a few places; rename them together:

1. `composer.json` `name`;
2. `assets/package.json` `name`;
3. `MobileNavigationExtension::CONTROLLER_PREFIX`;
4. `IDENTIFIER_PREFIX` in `assets/src/index.ts`;
5. the README.

`NamingConsistencyTest` checks that 2, 3 and 4 agree. The local working folder may be
named differently from the package (e.g. `ios-navigation-bundle`): it does not matter.

The `rm-mnb-` CSS prefix, the `rm_mnb` translation domain and the `MobileNavigation` Twig
namespace are part of the public API: they do not change with the package name.
