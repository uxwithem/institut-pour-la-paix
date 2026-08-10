// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';

// Project page on GitHub Pages: https://uxwithem.github.io/institut-pour-la-paix/
// If a custom domain is configured later, set site to that domain and base to '/'.
const BASE = '/institut-pour-la-paix';

// Root-relative href/src in Markdown content (typed by an editor, or written by
// hand in src/content/pages/*.md) don't get the base path applied automatically
// the way Astro-processed assets do — see AGENTS.md. This rewrites them at build
// time so editors can just write `/equipe-reseau/` without knowing about the
// base path. Idempotent: already-prefixed paths (e.g. from the wp-import
// scripts) are left alone.
function rehypeBasePath() {
	return (/** @type {any} */ tree) => {
		function visit(/** @type {any} */ node) {
			if (node.type === 'element' && node.properties) {
				for (const attr of ['href', 'src']) {
					const value = node.properties[attr];
					if (
						typeof value === 'string' &&
						value.startsWith('/') &&
						!value.startsWith('//') &&
						value !== BASE &&
						!value.startsWith(`${BASE}/`)
					) {
						node.properties[attr] = BASE + value;
					}
				}
			}
			if (node.children) node.children.forEach(visit);
		}
		visit(tree);
	};
}

export default defineConfig({
	site: 'https://uxwithem.github.io',
	base: BASE,
	trailingSlash: 'always',
	markdown: {
		processor: unified({
			rehypePlugins: [rehypeBasePath],
		}),
	},
});
