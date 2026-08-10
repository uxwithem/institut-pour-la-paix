# Institut pour la Paix

Static site + [Astro](https://astro.build) content collections + [Decap CMS](https://decapcms.org),
hosted on GitHub Pages. See `docs/BRIEF.md` for the content architecture this project
implements, and `docs/DECAP_CMS.md` for the editor setup.

Content is edited by a non-technical editor through Decap CMS (`/admin/`), not by
reading code. That constrains how this project should evolve — see **Conventions**
below, and `AGENTS.md` for the fuller set of rules any agent working on this repo
should follow.

## Project structure

```text
src/
├── content.config.ts   # Collection schemas — the source of truth for content shape
├── content/
│   ├── actualites/      # Articles
│   ├── evenements/       # Events
│   ├── groupes/           # Research groups
│   ├── personnes/          # People
│   ├── publications/        # Publications
│   ├── ressources/           # Other resources (video, audio, reports…)
│   ├── projets/                # Projects
│   ├── pages/                    # Generic static pages
│   ├── taxonomies/                 # Editable term lists (categories, tags, resource types)
│   └── config/                       # Site settings, navigation, footer, SEO defaults
├── layouts/, components/, lib/, styles/
└── pages/                # Routes — mirrors the sitemap in docs/BRIEF.md §29

public/admin/            # Decap CMS (config.yml + index.html)
```

## Commands

| Command          | Action                                           |
| :---------------- | :----------------------------------------------- |
| `bun install`      | Install dependencies                             |
| `bun run dev`        | Start the local dev server at `localhost:4321`   |
| `bun run build`        | Build the production site to `./dist/`           |
| `bun run preview`        | Preview the build locally                        |

Pushing to `main` builds and deploys automatically via
`.github/workflows/deploy.yml`.

## Editing content

- By hand: edit the Markdown/YAML files under `src/content/` directly.
- Through Decap CMS: see `docs/DECAP_CMS.md` — local editing works today; production
  login needs an OAuth provider that isn't set up yet.

## Conventions

This project has a few rules that exist specifically to keep the CMS usable for a
non-technical editor. The full list — with the reasoning behind each — is in
`AGENTS.md`. In short:

- **`src/content.config.ts` and `public/admin/config.yml` must always describe the
  same fields.** Change one, change the other, in the same commit.
- **Image/file fields are plain strings**, not Astro's `image()` helper, and need
  `withBase()` (`src/lib/url.ts`) wherever they're rendered — see `AGENTS.md` for why.
- **Only three colors are real decisions**: `--color-bg`, `--color-fg`,
  `--color-accent` in `src/styles/global.css`. Everything else is derived from them.
  Light/dark follow the OS setting; there's no theme toggle.
- **No i18n.** The site is French-only, including CMS field labels. Don't add a
  partial translation without a real internationalization plan.
- **`scripts/wp-import/`** is a one-off WordPress migration tool, not part of the
  regular build or content workflow.
