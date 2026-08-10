import { readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import {
	REPO_ROOT,
	decodeWpText,
	downloadImage,
	htmlToMarkdown,
	localizeImages,
	wpFetchAll,
	wpFetchText,
	writeContentFile,
} from './lib';

interface WpEvent {
	slug: string;
	date: string;
	link: string;
	title: { rendered: string };
	content: { rendered: string };
	mec_category: number[];
	_embedded?: {
		'wp:featuredmedia'?: Array<{ source_url?: string }>;
	};
}

interface EventJsonLd {
	eventStatus?: string;
	startDate?: string;
	endDate?: string;
	location?: { name?: string; address?: string };
}

const MEC_CATEGORY_TO_GROUP: Record<number, string> = {
	83: 'approches-regionales',
	50: 'concepts-de-la-paix',
	82: 'genre-et-paix',
	100: 'resistance-civile',
	99: 'resistance-civile',
	56: 'paix-conflits-environnement',
};

function toHHMM(iso: string | undefined): string | undefined {
	if (!iso) return undefined;
	const d = new Date(iso);
	if (Number.isNaN(d.valueOf())) return undefined;
	return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false });
}

async function fetchEventJsonLd(link: string): Promise<EventJsonLd | undefined> {
	const html = await wpFetchText(link).catch(() => undefined);
	if (!html) return undefined;
	const matches = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
	for (const m of matches) {
		try {
			const data = JSON.parse(m[1]);
			if (data['@type'] === 'Event') return data as EventJsonLd;
		} catch {
			// ignore malformed blocks
		}
	}
	return undefined;
}

function findRegistrationUrl(html: string): string | undefined {
	const matches = html.matchAll(
		/<a[^>]+href="(https?:\/\/(?!www\.institutpourlapaix\.org)[^"]+)"[^>]*>([^<]*)<\/a>/g,
	);
	for (const m of matches) {
		if (!/inscri/i.test(m[2])) continue;
		try {
			new URL(m[1]);
			return m[1];
		} catch {
			// malformed href text, keep looking
		}
	}
	return undefined;
}

const dir = path.join(REPO_ROOT, 'src/content/evenements');
const existing = await readdir(dir).catch(() => []);
await Promise.all(existing.map((f) => rm(path.join(dir, f))));

console.log('Fetching events…');
const events = await wpFetchAll<WpEvent>('/wp-json/wp/v2/mec-events', { _embed: '1' });
console.log(`Fetched ${events.length} events.`);

let i = 0;
let missingJsonLd = 0;
for (const event of events) {
	i++;
	console.log(`[${i}/${events.length}] ${event.slug}`);

	const jsonLd = await fetchEventJsonLd(event.link);
	if (!jsonLd?.startDate) missingJsonLd++;

	const featuredImage = await downloadImage(event._embedded?.['wp:featuredmedia']?.[0]?.source_url);
	const localizedBody = await localizeImages(event.content.rendered);
	const body = htmlToMarkdown(localizedBody);
	const registrationUrl = findRegistrationUrl(event.content.rendered);

	const researchGroups = [...new Set(event.mec_category.map((id) => MEC_CATEGORY_TO_GROUP[id]).filter(Boolean))];
	const cancelled = jsonLd?.eventStatus?.includes('Cancelled') ?? false;

	await writeContentFile(
		`src/content/evenements/${event.slug}.md`,
		{
			title: decodeWpText(event.title.rendered),
			startDate: jsonLd?.startDate ?? event.date,
			...(jsonLd?.endDate ? { endDate: jsonLd.endDate } : {}),
			...(toHHMM(jsonLd?.startDate) ? { startTime: toHHMM(jsonLd?.startDate) } : {}),
			...(toHHMM(jsonLd?.endDate) ? { endTime: toHHMM(jsonLd?.endDate) } : {}),
			...(jsonLd?.location?.name || jsonLd?.location?.address
				? { location: { name: jsonLd?.location?.name, address: jsonLd?.location?.address } }
				: {}),
			...(registrationUrl ? { registrationUrl } : {}),
			...(featuredImage ? { image: featuredImage } : {}),
			...(researchGroups.length ? { researchGroups } : {}),
			cancelled,
			featured: false,
		},
		body,
	);
}

console.log(`Done: wrote ${events.length} evenements (${missingJsonLd} without parseable structured date).`);
