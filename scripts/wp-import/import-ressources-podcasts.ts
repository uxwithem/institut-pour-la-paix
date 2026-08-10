import { readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { REPO_ROOT, decodeWpText, downloadImage, wpFetchAll, wpFetchText, writeContentFile } from './lib';

interface WpEpisode {
	slug: string;
	date: string;
	link: string;
	title: { rendered: string };
	featured_media: number;
	_embedded?: {
		'wp:featuredmedia'?: Array<{ source_url?: string }>;
	};
}

function extractDescription(html: string): string | undefined {
	const m = html.match(/<meta name="description" content="([^"]*)"/);
	return m ? decodeWpText(m[1]) : undefined;
}

function extractAudioUrl(html: string): string | undefined {
	const m = html.match(/data-audiopath="([^"]+)"/);
	return m?.[1];
}

const dir = path.join(REPO_ROOT, 'src/content/ressources');
const existing = await readdir(dir).catch(() => []);
await Promise.all(existing.map((f) => rm(path.join(dir, f))));

console.log('Fetching episodes…');
const episodes = await wpFetchAll<WpEpisode>('/wp-json/wp/v2/sr_playlist', { _embed: '1' });
console.log(`Fetched ${episodes.length} episodes.`);

let i = 0;
for (const ep of episodes) {
	i++;
	console.log(`[${i}/${episodes.length}] ${ep.slug}`);

	const html = await wpFetchText(ep.link).catch(() => '');
	const audioUrl = extractAudioUrl(html);
	const description = extractDescription(html);
	const thumbnail = await downloadImage(ep._embedded?.['wp:featuredmedia']?.[0]?.source_url);

	await writeContentFile(
		`src/content/ressources/${ep.slug}.md`,
		{
			title: decodeWpText(ep.title.rendered),
			type: 'podcast',
			date: ep.date,
			...(thumbnail ? { thumbnail } : {}),
			...(description ? { description } : {}),
			...(audioUrl ? { audioUrl } : {}),
			featured: false,
		},
		'',
	);
}

console.log(`Done: wrote ${episodes.length} podcast ressources.`);
