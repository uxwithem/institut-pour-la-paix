import { downloadImage, htmlToMarkdown, localizeImages, wpFetch, writeContentFile } from './lib';

interface WpPage {
	content: { rendered: string };
	featured_media: number;
	title: { rendered: string };
}

const PAGES: Array<{ slug: string; wpId: number; title: string }> = [
	{ slug: 'contact', wpId: 16, title: 'Contact' },
	{ slug: 'mentions-legales', wpId: 3, title: 'Mentions légales' },
	{ slug: 'devenir-membre', wpId: 5390, title: 'Devenir membre' },
	{ slug: 'politique-de-confidentialite', wpId: 1758, title: 'Politique de confidentialité' },
];

async function featuredMediaUrl(mediaId: number): Promise<string | undefined> {
	if (!mediaId) return undefined;
	const media = await wpFetch<{ source_url?: string }>(`/wp-json/wp/v2/media/${mediaId}`);
	return media.source_url;
}

for (const page of PAGES) {
	console.log(page.slug);
	const wpPage = await wpFetch<WpPage>(`/wp-json/wp/v2/pages/${page.wpId}`);
	const heroImage = await downloadImage(await featuredMediaUrl(wpPage.featured_media));
	const localized = await localizeImages(wpPage.content.rendered);
	const body = htmlToMarkdown(localized).replace(/^#\s[^\n]*\n+/, '');

	await writeContentFile(
		`src/content/pages/${page.slug}.md`,
		{
			title: page.title,
			...(heroImage ? { heroImage } : {}),
		},
		body,
	);
}

console.log(`Done: wrote ${PAGES.length} pages.`);
