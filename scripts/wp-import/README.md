# WordPress content import

One-off scripts that pulled real content from the live WordPress site
(`institutpourlapaix.org`) into `src/content/` via its REST API (`/wp-json/`), so the
collections aren't just placeholders. Each script is idempotent — re-running it clears
and rewrites only the collection(s) it owns.

Run from the repo root, in this order (later ones depend on earlier output):

```sh
bun scripts/wp-import/import-taxonomies.ts        # categories, tags -> term-maps.json
bun scripts/wp-import/import-actualites.ts        # wp/v2/posts
bun scripts/wp-import/import-groupes.ts           # the 5 recherche child pages
bun scripts/wp-import/import-evenements.ts        # wp/v2/mec-events + per-event JSON-LD
bun scripts/wp-import/import-personnes.ts         # parses the équipe-reseau Elementor page
bun scripts/wp-import/import-publications.ts      # parses the publications page
bun scripts/wp-import/import-ressources-podcasts.ts  # wp/v2/sr_playlist (podcast episodes)
bun scripts/wp-import/import-pages.ts             # contact, mentions-legales, etc.
```

Images/PDFs referenced by imported content are downloaded into
`public/uploads/wp-import/`.

## Known gaps (see the migration summary for details)

- No source for `projets` — the WP site doesn't model projects as distinct from posts.
- `personnes` are parsed from Elementor's generated markup by walking widgets in
  document order; if the équipe page's structure changes, `import-personnes.ts`'s
  section/widget assumptions will need revisiting.
- Cross-links (`relatedResearchGroup` on articles, `researchGroup` on publications,
  etc.) weren't inferred — only what WordPress exposed as structured relationships
  (event → mec_category → research group) was mapped automatically.
