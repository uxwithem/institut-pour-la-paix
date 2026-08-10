# Decap CMS setup

The editor lives at `/admin/` (`public/admin/index.html` + `public/admin/config.yml`).
Collections mirror the schemas in `src/content.config.ts` — see `docs/BRIEF.md` for the
editorial rationale behind each one.

## Editing locally

GitHub Pages serves static files only, so it can't run the OAuth handshake Decap
normally needs. For local editing, use Decap's local backend instead, which writes
straight to your working copy on disk:

```sh
npx decap-server      # in one terminal — proxies writes to the local filesystem
bun run dev            # in another terminal
```

Open `http://localhost:4321/admin/` and log in via "Login with Local Backend". Edits
are written directly to `src/content/`, same as editing the files by hand — commit and
push them yourself.

## Production login (not yet configured)

`public/admin/config.yml` is set up with `backend: { name: github, repo:
uxwithem/institut-pour-la-paix }`, but the `base_url` pointing at an OAuth provider is
commented out. Without it, editors won't be able to log in on the deployed site.

To finish this:

1. Create a GitHub OAuth App (Settings → Developer settings → OAuth Apps) with its
   callback URL set to `<your-oauth-provider>/callback`.
2. Deploy a small OAuth proxy that performs the GitHub handshake on the CMS's behalf —
   Decap's docs list the "Custom backend" / "GitHub backend" options for this. A
   Cloudflare Worker is a good fit for a GitHub Pages site with no other backend; ask
   for help wiring one up when you're ready.
3. Uncomment `base_url` (and `auth_endpoint` if your proxy needs it) in
   `public/admin/config.yml` and point it at the deployed proxy.

## Media uploads

Editors' uploads land in `public/uploads/` (`media_folder` / `public_folder` in
`config.yml`) and are referenced as plain `/uploads/...` paths in frontmatter — not
through Astro's image-optimization pipeline. See the comment at the top of
`src/content.config.ts` for why.
