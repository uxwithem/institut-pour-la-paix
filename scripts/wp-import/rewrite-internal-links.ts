import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { REPO_ROOT } from './lib';

const BASE = '/institut-pour-la-paix';

async function slugSet(dir: string): Promise<Set<string>> {
	const files = await readdir(path.join(REPO_ROOT, dir)).catch(() => []);
	return new Set(files.map((f) => f.replace(/\.(md|yaml)$/, '')));
}

const posts = await slugSet('src/content/actualites');
const events = await slugSet('src/content/evenements');
const groups = await slugSet('src/content/groupes');
const episodes = await slugSet('src/content/ressources');
const pages = await slugSet('src/content/pages');

// WP page slugs that were renamed when imported into our `pages` collection.
const pageRenames: Record<string, string> = {
	'adherer-a-lipp': 'devenir-membre',
	'politique-de-cookies-ue': 'politique-de-confidentialite',
};

// Inconsistent slug spelling seen in some WP links vs. the actual page slug.
const groupAliases: Record<string, string> = {
	'paix-conflits-et-environnement': 'paix-conflits-environnement',
};

function resolveInternalPath(url: string): string | null {
	const m = url.match(/^https?:\/\/(?:www\.)?institutpourlapaix\.org(\/[^\s"')]*)?/i);
	if (!m) return null;
	const rawPath = (m[1] ?? '/').split(/[?#]/)[0];
	const segments = rawPath.split('/').filter(Boolean);

	if (segments.length === 0) return `${BASE}/`;

	if (segments[0] === 'events' && segments[1]) {
		return events.has(segments[1]) ? `${BASE}/agenda/${segments[1]}/` : null;
	}
	if (segments[0] === 'episode' && segments[1]) {
		return episodes.has(segments[1]) ? `${BASE}/ressources/${segments[1]}/` : null;
	}
	if (segments[0] === 'recherche' && segments[1]) {
		const slug = groupAliases[segments[1]] ?? segments[1];
		if (groups.has(slug)) return `${BASE}/recherche/${slug}/`;
	}
	if (segments.length === 1) {
		const slug = segments[0];
		if (posts.has(slug)) return `${BASE}/actualites/${slug}/`;
		if (groups.has(slug)) return `${BASE}/recherche/${slug}/`;
		if (groupAliases[slug]) return `${BASE}/recherche/${groupAliases[slug]}/`;
		if (pageRenames[slug]) return `${BASE}/${pageRenames[slug]}/`;
		if (pages.has(slug)) return `${BASE}/${slug}/`;
	}
	return null;
}

const URL_RE = /https?:\/\/(?:www\.)?institutpourlapaix\.org[^\s"')]*/gi;

const collectionsToScan = [
	'actualites',
	'evenements',
	'groupes',
	'personnes',
	'publications',
	'ressources',
	'projets',
	'pages',
];

let rewritten = 0;
let leftExternal = 0;
const unresolved = new Set<string>();

for (const collection of collectionsToScan) {
	const dir = path.join(REPO_ROOT, 'src/content', collection);
	const files = await readdir(dir).catch(() => []);
	for (const file of files) {
		if (!file.endsWith('.md')) continue;
		const filePath = path.join(dir, file);
		const original = await readFile(filePath, 'utf-8');
		let changed = false;
		const updated = original.replace(URL_RE, (match) => {
			// Don't touch links into wp-content/uploads — those are handled by image/file download.
			if (match.includes('/wp-content/uploads/')) return match;
			const resolved = resolveInternalPath(match);
			if (resolved) {
				changed = true;
				rewritten++;
				return resolved;
			}
			leftExternal++;
			unresolved.add(match);
			return match;
		});
		if (changed) await writeFile(filePath, updated, 'utf-8');
	}
}

console.log(`Rewrote ${rewritten} internal links.`);
console.log(`Left ${leftExternal} institutpourlapaix.org links unresolved (no matching imported content).`);
if (unresolved.size > 0) {
	console.log('\nUnresolved (still pointing at the old site):');
	for (const url of [...unresolved].sort()) console.log(`  ${url}`);
}
