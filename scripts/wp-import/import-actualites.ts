import { readFile, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import {
	REPO_ROOT,
	decodeWpText,
	downloadImage,
	htmlToMarkdown,
	localizeImages,
	wpFetchAll,
	writeContentFile,
} from './lib';

interface WpPost {
	slug: string;
	date: string;
	title: { rendered: string };
	excerpt: { rendered: string };
	content: { rendered: string };
	categories: number[];
	tags: number[];
	featured_media: number;
	_embedded?: {
		'wp:featuredmedia'?: Array<{ source_url?: string }>;
	};
}

const { categoryMap, tagMap } = JSON.parse(
	await readFile(path.join(import.meta.dir, 'term-maps.json'), 'utf-8'),
) as { categoryMap: Record<string, string>; tagMap: Record<string, string> };

const dir = path.join(REPO_ROOT, 'src/content/actualites');
const existing = await readdir(dir).catch(() => []);
await Promise.all(existing.map((f) => rm(path.join(dir, f))));

console.log('Fetching posts…');
const posts = await wpFetchAll<WpPost>('/wp-json/wp/v2/posts', { _embed: '1' });
console.log(`Fetched ${posts.length} posts.`);

let i = 0;
for (const post of posts) {
	i++;
	const title = decodeWpText(post.title.rendered);
	console.log(`[${i}/${posts.length}] ${post.slug}`);

	const featuredImage = await downloadImage(post._embedded?.['wp:featuredmedia']?.[0]?.source_url);
	const localizedBody = await localizeImages(post.content.rendered);
	const body = htmlToMarkdown(localizedBody);
	const excerpt = decodeWpText(post.excerpt.rendered).replace(/\s*\[…]\s*$/, '');

	const category = post.categories.map((id) => categoryMap[id]).find(Boolean);
	const tags = post.tags.map((id) => tagMap[id]).filter(Boolean);

	await writeContentFile(
		`src/content/actualites/${post.slug}.md`,
		{
			title,
			date: post.date,
			...(category ? { category } : {}),
			...(tags.length ? { tags } : {}),
			...(featuredImage ? { featuredImage } : {}),
			...(excerpt ? { excerpt } : {}),
			featured: false,
		},
		body,
	);
}

console.log(`Done: wrote ${posts.length} actualites.`);
