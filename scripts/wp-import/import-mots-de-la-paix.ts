// One-off import for the "Les mots de la paix" WP *page* (id 6473) — a pedagogical
// exhibition resource that the regular post-based import scripts never touched
// because it's a page, not a post. Not part of the regular re-run pipeline.
import { wpFetch, decodeWpText, htmlToMarkdown, localizeImages, downloadImage, writeContentFile } from './lib';

interface WpPage {
	title: { rendered: string };
	content: { rendered: string };
}

const page = await wpFetch<WpPage>('/wp-json/wp/v2/pages/6473');

const title = decodeWpText(page.title.rendered);
let html = page.content.rendered;

// The full page has ~94 gallery images across 3 sub-projects; keep the intro
// paragraph and each section heading, but trim each project's photo grid down
// to a handful of representative shots instead of downloading all of them.
function trimGallery(input: string, keep: number): string {
	const imgTags = [...input.matchAll(/<img[^>]+>/g)];
	if (imgTags.length <= keep) return input;
	let out = input;
	let count = 0;
	for (const tag of imgTags) {
		count++;
		if (count > keep) {
			// remove the <img> and its wrapping <figure>/<a> if present
			out = out.replace(tag[0], '');
		}
	}
	return out;
}
html = trimGallery(html, 12);

const localized = await localizeImages(html);
const body = htmlToMarkdown(localized);

const thumbnail = await downloadImage(
	'https://www.institutpourlapaix.org/wp-content/uploads/2024/09/1698268353649-1-768x1024.jpeg',
);

await writeContentFile('src/content/ressources/les-mots-de-la-paix.md', {
	title,
	type: 'pedagogical',
	date: new Date('2023-10-13'),
	authors: ['Tania Romero Barrios', 'Laura Lema Silva', 'Fernando Garlin Politis'],
	description:
		"Exposition participative présentée aux Rencontres 2023 : trois projets de recherche en dialogue avec les arts (Warmikuna, Sanaduría, Poésie des arts désarmés) autour des sens pluriels de la paix.",
	thumbnail,
	tags: ['exposition', 'arts', 'rencontres-2023'],
	featured: true,
}, body);

console.log('Wrote src/content/ressources/les-mots-de-la-paix.md');
