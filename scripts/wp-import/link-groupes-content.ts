import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import yaml from 'js-yaml';
import { REPO_ROOT } from './lib';

const ACTU_RE = /\/institut-pour-la-paix\/actualites\/([a-z0-9-]+)\//g;
const EVENT_RE = /\/institut-pour-la-paix\/agenda\/([a-z0-9-]+)\//g;

function extractSlugs(text: string, re: RegExp): string[] {
	return [...new Set([...text.matchAll(re)].map((m) => m[1]))];
}

function sectionBetween(body: string, startHeading: string, endHeadings: string[]): string {
	const startIdx = body.indexOf(startHeading);
	if (startIdx === -1) return '';
	const rest = body.slice(startIdx + startHeading.length);
	let endIdx = rest.length;
	for (const h of endHeadings) {
		const i = rest.indexOf(h);
		if (i !== -1 && i < endIdx) endIdx = i;
	}
	return rest.slice(0, endIdx);
}

function splitFrontmatter(raw: string): { fm: Record<string, unknown>; body: string } {
	const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
	if (!m) return { fm: {}, body: raw };
	return { fm: (yaml.load(m[1]) as Record<string, unknown>) ?? {}, body: m[2] };
}

function serialize(fm: Record<string, unknown>, body: string): string {
	return `---\n${yaml.dump(fm, { lineWidth: 100, noRefs: true, sortKeys: false })}---\n${body}`;
}

const groupesDir = path.join(REPO_ROOT, 'src/content/groupes');
const actualitesDir = path.join(REPO_ROOT, 'src/content/actualites');
const evenementsDir = path.join(REPO_ROOT, 'src/content/evenements');

let articleLinks = 0;
let eventLinks = 0;

for (const file of await readdir(groupesDir)) {
	if (!file.endsWith('.md')) continue;
	const groupSlug = file.replace(/\.md$/, '');
	const raw = await readFile(path.join(groupesDir, file), 'utf-8');
	const { body } = splitFrontmatter(raw);

	const articlesSection = sectionBetween(body, '## Actualités et Publications', ['## Evènements', '## Autres groupes']);
	const eventsSection = sectionBetween(body, '## Evènements', ['## Autres groupes']);

	const articleSlugs = extractSlugs(articlesSection, ACTU_RE);
	const eventSlugs = extractSlugs(eventsSection, EVENT_RE);

	for (const slug of articleSlugs) {
		const filePath = path.join(actualitesDir, `${slug}.md`);
		const articleRaw = await readFile(filePath, 'utf-8').catch(() => null);
		if (!articleRaw) continue;
		const { fm, body: articleBody } = splitFrontmatter(articleRaw);
		if (fm.relatedResearchGroup) continue;
		fm.relatedResearchGroup = groupSlug;
		await writeFile(filePath, serialize(fm, articleBody), 'utf-8');
		articleLinks++;
	}

	for (const slug of eventSlugs) {
		const filePath = path.join(evenementsDir, `${slug}.md`);
		const eventRaw = await readFile(filePath, 'utf-8').catch(() => null);
		if (!eventRaw) continue;
		const { fm, body: eventBody } = splitFrontmatter(eventRaw);
		const existing = Array.isArray(fm.researchGroups) ? (fm.researchGroups as string[]) : [];
		if (existing.includes(groupSlug)) continue;
		fm.researchGroups = [...existing, groupSlug];
		await writeFile(filePath, serialize(fm, eventBody), 'utf-8');
		eventLinks++;
	}

	// Trim the now-redundant scraped listings — the group page renders these
	// sections live from the relations we just set, via getCollection() filters.
	const trimIdx = body.indexOf('## Actualités et Publications');
	const trimmedBody = trimIdx === -1 ? body : body.slice(0, trimIdx).trimEnd() + '\n';
	if (trimmedBody !== body) {
		const { fm } = splitFrontmatter(raw);
		await writeFile(path.join(groupesDir, file), serialize(fm, trimmedBody), 'utf-8');
	}
}

console.log(`Linked ${articleLinks} articles and ${eventLinks} events to their research group.`);
