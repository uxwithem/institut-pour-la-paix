# Institut pour la Paix

Static site + [Astro](https://astro.build) content collections + [Decap CMS](https://decapcms.org),
hosted on GitHub Pages. See `docs/BRIEF.md` for the content architecture this project
implements, and `docs/DECAP_CMS.md` for the editor setup.

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
