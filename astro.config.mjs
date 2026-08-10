// @ts-check
import { defineConfig } from 'astro/config';

// Project page on GitHub Pages: https://uxwithem.github.io/institut-pour-la-paix/
// If a custom domain is configured later, set site to that domain and base to '/'.
export default defineConfig({
	site: 'https://uxwithem.github.io',
	base: '/institut-pour-la-paix',
	trailingSlash: 'always',
});
