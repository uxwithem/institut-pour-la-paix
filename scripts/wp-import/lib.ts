import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import yaml from 'js-yaml';
import TurndownService from 'turndown';

export const WP_BASE = 'https://www.institutpourlapaix.org';
const UA = 'Mozilla/5.0 (compatible; ResearchBot/1.0)';

export const REPO_ROOT = '/home/u0/src/institut-pour-la-paix/institut-pour-la-paix';
export const UPLOADS_DIR = path.join(REPO_ROOT, 'public/uploads/wp-import');

export async function wpFetch<T>(pathname: string): Promise<T> {
	const url = pathname.startsWith('http') ? pathname : `${WP_BASE}${pathname}`;
	const res = await fetch(url, { headers: { 'User-Agent': UA } });
	if (!res.ok) throw new Error(`Fetch failed ${res.status} for ${url}`);
	return res.json() as Promise<T>;
}

export async function wpFetchText(pathname: string): Promise<string> {
	const url = pathname.startsWith('http') ? pathname : `${WP_BASE}${pathname}`;
	const res = await fetch(url, { headers: { 'User-Agent': UA } });
	if (!res.ok) throw new Error(`Fetch failed ${res.status} for ${url}`);
	return res.text();
}

export async function wpFetchAll<T>(pathname: string, params: Record<string, string> = {}): Promise<T[]> {
	const results: T[] = [];
	let page = 1;
	while (true) {
		const qs = new URLSearchParams({ per_page: '100', page: String(page), ...params });
		const url = `${WP_BASE}${pathname}?${qs.toString()}`;
		const res = await fetch(url, { headers: { 'User-Agent': UA } });
		if (res.status === 400) break; // WP returns 400 once page exceeds total pages
		if (!res.ok) throw new Error(`Fetch failed ${res.status} for ${url}`);
		const batch = (await res.json()) as T[];
		results.push(...batch);
		if (batch.length < 100) break;
		page++;
	}
	return results;
}

const turndown = new TurndownService({
	headingStyle: 'atx',
	bulletListMarker: '-',
	codeBlockStyle: 'fenced',
	// CommonMark suppresses `_..._` emphasis inside a word (e.g. "Ta_ï_wan" won't
	// render), which real WP content hits often (a single accented letter styled
	// italic mid-word). `*...*` has no such restriction.
	emDelimiter: '*',
});

/** WP sometimes wraps a heading's text across a <br>, which breaks ATX headings
 * (single-line only) into a heading with a stray unclosed "**" on the next line. */
function stripBreaksInsideHeadings(html: string): string {
	return html.replace(/(<h[1-6][^>]*>)([\s\S]*?)(<\/h[1-6]>)/gi, (_m, open, inner, close) => {
		return open + inner.replace(/<br\s*\/?>/gi, ' ') + close;
	});
}

/** A <strong>/<em> run containing a <br> becomes "**a<br>b**" in Markdown, and
 * CommonMark's flanking rules reject a "**" as a closer right after a line
 * break — it's treated as literal text instead of closing the emphasis. Split
 * the tag around each <br> into several tags of its own line, so each pair
 * is fully closed before the break. */
function splitEmphasisAcrossBreaks(html: string): string {
	for (const tag of ['strong', 'em', 'b', 'i']) {
		// The opening tag may carry attributes (WP/Elementor content often inlines
		// style="..."), so match up to the first ">" rather than requiring a bare tag.
		const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'gi');
		html = html.replace(re, (m, inner) => {
			if (!/<br\s*\/?>/i.test(inner)) return m;
			return inner
				.split(/<br\s*\/?>/i)
				.map((part: string) => (part.trim() ? `<${tag}>${part}</${tag}>` : ''))
				.join('<br>');
		});
	}
	return html;
}

function preprocessHtml(html: string): string {
	return splitEmphasisAcrossBreaks(stripBreaksInsideHeadings(html));
}

/** Collapses markdown artifacts from adjacent inline spans in the source HTML
 * (e.g. two back-to-back <strong> tags produce "**a****b**", which most
 * parsers don't merge back into one run). */
function collapseAdjacentEmphasis(markdown: string): string {
	return markdown.replace(/\*{4}/g, '').replace(/_{4}/g, '');
}

/** Strips tags/decodes entities from a short WP "rendered" string (title, excerpt) without producing Markdown syntax. */
export function decodeWpText(html: string): string {
	return turndown
		.turndown(preprocessHtml(html))
		.replace(/\\([*_[\]()#>`~-])/g, '$1')
		.replace(/[*_]/g, '')
		.replace(/\s+/g, ' ')
		.trim();
}

/** Converts a WP content.rendered HTML blob to Markdown. Image URLs should already be localized before calling. */
export function htmlToMarkdown(html: string): string {
	return collapseAdjacentEmphasis(turndown.turndown(preprocessHtml(html)))
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

const downloadCache = new Map<string, string>();

/** Downloads a remote image into public/uploads/wp-import/ (idempotent) and returns the site-relative public path. */
export async function downloadImage(sourceUrl: string | undefined | null): Promise<string | undefined> {
	if (!sourceUrl) return undefined;
	if (downloadCache.has(sourceUrl)) return downloadCache.get(sourceUrl);

	let filename: string;
	try {
		filename = decodeURIComponent(new URL(sourceUrl).pathname.split('/').pop() ?? '');
	} catch {
		return undefined;
	}
	if (!filename) return undefined;
	filename = filename.replace(/[^a-zA-Z0-9._-]/g, '-');

	await mkdir(UPLOADS_DIR, { recursive: true });
	const destPath = path.join(UPLOADS_DIR, filename);
	const publicPath = `/uploads/wp-import/${filename}`;

	const res = await fetch(sourceUrl, { headers: { 'User-Agent': UA } });
	if (!res.ok) {
		console.warn(`  ! image download failed (${res.status}): ${sourceUrl}`);
		return undefined;
	}
	const buf = new Uint8Array(await res.arrayBuffer());
	await writeFile(destPath, buf);
	downloadCache.set(sourceUrl, publicPath);
	return publicPath;
}

// astro.config.mjs `base` — frontmatter image fields get this prefix applied at
// render time via withBase(), but images embedded directly in body Markdown are
// plain <img>/![]() output with no component in between, so it must be baked in
// here instead.
const SITE_BASE = '/institut-pour-la-paix';

/** Rewrites all <img src> in an HTML blob to local downloaded copies. Call before htmlToMarkdown. */
export async function localizeImages(html: string): Promise<string> {
	const srcs = [...html.matchAll(/<img[^>]+src="([^"]+)"/g)].map((m) => m[1]);
	let out = html;
	for (const src of new Set(srcs)) {
		const local = await downloadImage(src);
		if (local) out = out.split(src).join(SITE_BASE + local);
	}
	// Drop srcset (points at remote sizes we didn't download) to avoid broken responsive images.
	out = out.replace(/\s+srcset="[^"]*"/g, '').replace(/\s+sizes="[^"]*"/g, '');
	return out;
}

export function writeContentFile(relPath: string, frontmatter: Record<string, unknown>, body: string) {
	const fm = yaml.dump(frontmatter, { lineWidth: 100, noRefs: true, sortKeys: false });
	const content = `---\n${fm}---\n\n${body.trim()}\n`;
	const destPath = path.join(REPO_ROOT, relPath);
	return mkdir(path.dirname(destPath), { recursive: true }).then(() => writeFile(destPath, content, 'utf-8'));
}

export function writeDataFile(relPath: string, data: Record<string, unknown>) {
	const content = yaml.dump(data, { lineWidth: 100, noRefs: true, sortKeys: false });
	const destPath = path.join(REPO_ROOT, relPath);
	return mkdir(path.dirname(destPath), { recursive: true }).then(() => writeFile(destPath, content, 'utf-8'));
}

/** Filesystem-safe slug from a WP slug (already url-safe, but guard against edge cases). */
export function safeSlug(slug: string): string {
	return slug
		.toLowerCase()
		.replace(/[^a-z0-9-]+/g, '-')
		.replace(/^-+|-+$/g, '');
}
