import { readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import * as cheerio from 'cheerio';
import { REPO_ROOT, downloadImage, wpFetch, writeContentFile } from './lib';

interface WpPage {
	content: { rendered: string };
}

const page = await wpFetch<WpPage>('/wp-json/wp/v2/pages/6181');
const $ = cheerio.load(page.content.rendered);

// Publications on this page are rendered as: a cover <img> (sometimes wrapped in a
// link to the file, sometimes bare), immediately followed by a separate text link
// to the file/external page. Pair each image with the next non-empty text link.
const nodes = $('img, a[href]').toArray();
const publications: Array<{ href: string; cover: string; title: string }> = [];
let pendingCover: string | undefined;
for (const el of nodes) {
	if (el.tagName === 'img') {
		pendingCover = $(el).attr('src');
		continue;
	}
	const href = $(el).attr('href');
	const text = $(el).text().trim();
	if (!href || !text) continue;
	if (pendingCover) {
		publications.push({ href, cover: pendingCover, title: text });
		pendingCover = undefined;
	}
}

console.log(`Found ${publications.length} publications.`);

const dir = path.join(REPO_ROOT, 'src/content/publications');
const existing = await readdir(dir).catch(() => []);
await Promise.all(existing.map((f) => rm(path.join(dir, f))));

function slugify(title: string): string {
	return title
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

function dateFromUploadPath(url: string): string {
	const m = url.match(/\/uploads\/(\d{4})\/(\d{2})\//);
	return m ? `${m[1]}-${m[2]}-01` : new Date().toISOString().slice(0, 10);
}

for (const pub of publications) {
	console.log(pub.title);
	const coverImage = await downloadImage(pub.cover);
	const isInternal = pub.href.includes('institutpourlapaix.org');
	const file = isInternal ? await downloadImage(pub.href) : undefined;

	await writeContentFile(
		`src/content/publications/${slugify(pub.title)}.md`,
		{
			title: pub.title,
			// Approximate: WP upload folder date, not the publication's real date — flagged for editor review.
			date: dateFromUploadPath(pub.cover),
			...(coverImage ? { coverImage } : {}),
			...(file ? { file } : { externalUrl: pub.href }),
			featured: false,
		},
		'',
	);
}

console.log(`Done: wrote ${publications.length} publications.`);
