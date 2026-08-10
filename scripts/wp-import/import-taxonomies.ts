import { readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { REPO_ROOT, decodeWpText, wpFetchAll, writeDataFile } from './lib';

interface WpTerm {
	id: number;
	slug: string;
	name: string;
	count: number;
}

async function clearDir(dir: string) {
	const full = path.join(REPO_ROOT, dir);
	const files = await readdir(full).catch(() => []);
	await Promise.all(files.map((f) => rm(path.join(full, f))));
}

async function importTerms(kind: 'categories' | 'tags', wpPath: string) {
	const terms = await wpFetchAll<WpTerm>(wpPath);
	const used = terms.filter((t) => t.count > 0);
	await clearDir(`src/content/taxonomies/${kind}`);

	const idToSlug: Record<number, string> = {};
	for (const term of used) {
		idToSlug[term.id] = term.slug;
		await writeDataFile(`src/content/taxonomies/${kind}/${term.slug}.yaml`, {
			label: decodeWpText(term.name),
			value: term.slug,
		});
	}
	console.log(`${kind}: wrote ${used.length} terms (skipped ${terms.length - used.length} unused)`);
	return idToSlug;
}

const categoryMap = await importTerms('categories', '/wp-json/wp/v2/categories');
const tagMap = await importTerms('tags', '/wp-json/wp/v2/tags');

await writeFile(
	path.join(import.meta.dir, 'term-maps.json'),
	JSON.stringify({ categoryMap, tagMap }, null, 2),
);
console.log('Wrote term-maps.json for reuse by other import scripts.');
