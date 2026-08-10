# Working on this project

A non-technical editor manages content through Decap CMS (`/admin/`). Every decision
below exists to keep that working — before changing anything structural, ask whether
it will still make sense to someone who has never seen the code.

## Content is schema-first, and the schema has two halves

`src/content.config.ts` is the source of truth for what a piece of content *is*.
`public/admin/config.yml` is the source of truth for how an editor *edits* it. They
must describe the same fields, in the same shape, at all times.

**Whenever you add, rename, or remove a field in a collection schema, make the
matching change in `config.yml` in the same commit.** A field that exists in one but
not the other either breaks the build (Zod validation fails on content the CMS wrote)
or is invisible to the editor (a field they can never set). Field names are
camelCase in both places — keep them identical, not just similar.

Collections and their content types:

| Collection | Purpose |
| :--- | :--- |
| `actualites`, `evenements`, `groupes`, `personnes`, `publications`, `ressources`, `projets`, `pages` | Editorial content — see `docs/BRIEF.md` for the rationale behind each shape |
| `categories`, `tags`, `resourceTypes` | Editable taxonomy terms, one file per term |
| `siteSettings`, `navigation`, `footer`, `socialLinks`, `newsletter`, `seoDefaults` | Singleton config files, one Decap "file" each |

Don't add a new top-level collection unless the content genuinely doesn't fit an
existing one — the editor has to hold this list in their head.

## Images: plain strings, not Astro's `image()` helper

Every image/file field (`featuredImage`, `photo`, `coverImage`, `thumbnail`, `image`,
`file`) is typed `z.string()`, not Astro's content-collection `image()` helper. Decap
uploads write plain paths like `/uploads/foo.jpg` into `media_folder` — they never go
through Astro's asset-optimization pipeline, so validating them as `image()` would
break the moment an editor uploads something.

Two consequences that are easy to get wrong:

- **In `.astro` templates**, always wrap a frontmatter image path in `withBase()`
  (`src/lib/url.ts`) before using it as `src`. The site is deployed under a base path
  (`/institut-pour-la-paix/`, a GitHub Pages project site), and these plain-string
  paths don't get the prefix applied automatically the way Astro-processed assets do.
- **Inside Markdown body content**, `![](...)` images have no component to run
  `withBase()` for them. If you're writing an import/migration script that generates
  body Markdown, bake the base path in at write time (see `SITE_BASE` in
  `scripts/wp-import/lib.ts`) — don't assume it'll be handled downstream.

If you add a new image field, add the render code (`<img src={withBase(...)} />`) in
the same change — a field that's captured in frontmatter but never rendered is a
silent gap (this happened once already: every card/detail page shipped without any
`<img>` tag for several rounds before it was caught).

## Design tokens: only three real colors

`src/styles/global.css` defines exactly three color decisions —
`--color-bg`, `--color-fg`, `--color-accent` — with light values in `:root` and dark
values under `@media (prefers-color-scheme: dark)`. There is no theme toggle; it
follows the OS setting.

Everything else (`--color-muted`, `--color-line`, `--color-surface`) is *derived*
from those three via `color-mix()`, not hand-picked. Keep it that way — don't
introduce a new named color for a one-off need; derive it, or reconsider whether the
element needs its own color at all.

Sections that are meant to always read as the opposite of the page (hero, footer,
CTA banners) swap `background: var(--color-fg); color: var(--color-bg);` rather than
using a hardcoded dark color. That's intentional: it makes those sections invert
correctly in both light and dark mode automatically. Follow the same pattern for any
new "accent block" section.

## No i18n — the site is French-only by design

There's no `astro:i18n` routing, no locale switcher, and no translation layer. All
copy, all CMS field labels, and all content is French. If a request to add another
language ever comes in, that's a real architectural addition (routing, a locale
switcher, translated field labels in `config.yml`) — don't bolt on a partial version
of it (e.g. a stray English string) without that fuller plan, since a half-translated
site is worse for the editor than a consistently French one.

## The `scripts/wp-import/` directory is a one-off migration tool

It pulled real content from the old WordPress site once. It is not part of the
regular content workflow — editors never touch it, and it shouldn't be wired into
`bun run build` or any CI step. See `scripts/wp-import/README.md` if the WordPress
site changes before final cutover and a re-sync is genuinely needed.

## Listing pages use `FilterTabs`, not ad-hoc filter links

If a listing page needs a "browse by X" control (see `ressources/`, `actualites/`,
`equipe-reseau/`, `agenda/` for examples), use `src/components/FilterTabs.astro` and
give each filter a real route (e.g. `/actualites/categorie/[category]/`) so the
active tab is server-rendered from the URL, not simulated with client-side JS. This
also means every filter state is a real, linkable, indexable page.

## Deploying

Pushing to `main` builds and deploys automatically via
`.github/workflows/deploy.yml` (GitHub Actions → GitHub Pages). There's no staging
environment — check the build succeeds locally (`bun run build`) before pushing.

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and
`astro dev logs`.

## Astro documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/) — see the i18n note above before reaching for this
