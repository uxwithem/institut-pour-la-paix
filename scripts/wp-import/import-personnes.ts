import { readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import * as cheerio from 'cheerio';
import { REPO_ROOT, downloadImage, htmlToMarkdown, wpFetch, writeContentFile } from './lib';

interface WpPage {
	content: { rendered: string };
}

type PersonType = 'equipe' | 'copil' | 'partenaire' | 'membre-reseau';

const SECTION_TYPES: Array<[string, PersonType]> = [
	['Comité de Pilotage', 'copil'],
	['Equipe', 'equipe'],
	['Partenaires', 'partenaire'],
	['Réseau IPP', 'membre-reseau'],
	['Ressources et financement', null as unknown as PersonType], // stop marker, not a person section
];

function matchSection(text: string): PersonType | null {
	for (const [prefix, type] of SECTION_TYPES) {
		if (text.startsWith(prefix)) return type;
	}
	return null;
}

function slugifyName(name: string): string {
	return name
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

function cleanText(t: string): string {
	return t.replace(/\s+/g, ' ').trim();
}

const page = await wpFetch<WpPage>('/wp-json/wp/v2/pages/1318');
const $ = cheerio.load(page.content.rendered);
const widgets = $('[data-widget_type]').toArray();

const dir = path.join(REPO_ROOT, 'src/content/personnes');
const existing = await readdir(dir).catch(() => []);
await Promise.all(existing.map((f) => rm(path.join(dir, f))));

let currentSection: PersonType | null = null;
const seenSlugs = new Set<string>();
let written = 0;
let skippedDuplicates = 0;

for (let i = 0; i < widgets.length; i++) {
	const el = widgets[i];
	const type = $(el).attr('data-widget_type');

	if (type === 'heading.default') {
		const h = $(el).find('h1, h2, h3, h4').first();
		const level = (h.prop('tagName') || '').toLowerCase();
		if (level === 'h3') {
			const text = cleanText(h.text());
			currentSection = matchSection(text);
		}
		continue;
	}

	if (type !== 'image.default' || !currentSection) continue;

	const img = $(el).find('img').first();
	const src = img.attr('src');
	const alt = cleanText(img.attr('alt') || '');
	if (!src) continue;

	// Look ahead until the next image widget or next h3 section heading.
	let name: string | undefined;
	let role: string | undefined;
	let bio: string | undefined;
	for (let j = i + 1; j < widgets.length; j++) {
		const nextEl = widgets[j];
		const nextType = $(nextEl).attr('data-widget_type');
		if (nextType === 'image.default') break;
		if (nextType === 'heading.default') {
			const h = $(nextEl).find('h1, h2, h3, h4').first();
			const level = (h.prop('tagName') || '').toLowerCase();
			if (level === 'h3') break;
			if (level === 'h4' && !name) name = cleanText(h.text());
			continue;
		}
		if (nextType === 'text-editor.default' && !role) {
			const text = cleanText($(nextEl).text());
			if (text) role = text;
			continue;
		}
		if (nextType === 'toggle.default' && !bio) {
			const html = $(nextEl).find('.elementor-tab-content').first().html();
			if (html) bio = htmlToMarkdown(html);
			continue;
		}
	}

	const displayName = name || alt;
	if (!displayName) continue;

	const slug = slugifyName(displayName);
	if (!slug || seenSlugs.has(slug)) {
		if (slug) {
			console.log(`  duplicate skipped: ${displayName} (${slug}), section=${currentSection}`);
			skippedDuplicates++;
		}
		continue;
	}
	seenSlugs.add(slug);

	const photo = await downloadImage(src);

	await writeContentFile(
		`src/content/personnes/${slug}.md`,
		{
			name: displayName,
			...(photo ? { photo } : {}),
			...(role ? { role } : {}),
			type: currentSection,
			active: true,
		},
		bio ?? '',
	);
	written++;
}

console.log(`Done: wrote ${written} personnes (skipped ${skippedDuplicates} duplicates).`);
