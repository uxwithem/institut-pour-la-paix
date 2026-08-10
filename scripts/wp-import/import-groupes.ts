import { downloadImage, htmlToMarkdown, localizeImages, wpFetch, writeContentFile } from './lib';

interface WpPage {
	id: number;
	content: { rendered: string };
	featured_media: number;
}

const GROUPS: Array<{ slug: string; wpId: number; title: string }> = [
	{ slug: 'concepts-de-la-paix', wpId: 1603, title: 'Concepts de la paix' },
	{ slug: 'genre-et-paix', wpId: 2068, title: 'Genre et paix' },
	{ slug: 'paix-conflits-environnement', wpId: 2062, title: 'Paix, conflits et environnement' },
	{ slug: 'approches-regionales', wpId: 3426, title: 'Approches régionales' },
	{
		slug: 'resistance-civile',
		wpId: 4417,
		title: 'Résistance civile, non-violence et culture de la paix',
	},
];

async function featuredMediaUrl(mediaId: number): Promise<string | undefined> {
	if (!mediaId) return undefined;
	const media = await wpFetch<{ source_url?: string }>(`/wp-json/wp/v2/media/${mediaId}`);
	return media.source_url;
}

for (const group of GROUPS) {
	console.log(group.slug);
	const page = await wpFetch<WpPage>(`/wp-json/wp/v2/pages/${group.wpId}`);
	const html = page.content.rendered;

	const missionMatch = html.match(
		/<h2[^>]*>La mission du groupe de travail[^<]*<\/h2>\s*(?:<div[^>]*>\s*)*<p[^>]*>([\s\S]*?)<\/p>/,
	);
	const mission = missionMatch ? htmlToMarkdown(missionMatch[1]) : undefined;

	const image = await downloadImage(await featuredMediaUrl(page.featured_media));
	const localized = await localizeImages(html);
	const body = htmlToMarkdown(localized).replace(/^#\s[^\n]*\n+/, '');

	await writeContentFile(
		`src/content/groupes/${group.slug}.md`,
		{
			title: group.title,
			...(mission ? { mission } : {}),
			...(image ? { image } : {}),
			status: 'active',
			featured: true,
		},
		body,
	);
}

console.log(`Done: wrote ${GROUPS.length} groupes.`);
