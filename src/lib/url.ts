/** Prefixes an absolute internal path with the configured base path (see astro.config.mjs). */
export function withBase(path: string): string {
	const base = import.meta.env.BASE_URL.replace(/\/$/, '');
	if (/^https?:\/\//.test(path)) return path;
	return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
