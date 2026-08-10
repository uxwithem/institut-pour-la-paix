import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import yaml from 'js-yaml';
import { REPO_ROOT } from './lib';

interface Person {
	slug: string;
	name: string;
}

function splitFrontmatter(raw: string): { fm: Record<string, unknown>; body: string } {
	const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
	if (!m) return { fm: {}, body: raw };
	return { fm: (yaml.load(m[1]) as Record<string, unknown>) ?? {}, body: m[2] };
}

function serialize(fm: Record<string, unknown>, body: string): string {
	return `---\n${yaml.dump(fm, { lineWidth: 100, noRefs: true, sortKeys: false })}---\n${body}`;
}

const personnesDir = path.join(REPO_ROOT, 'src/content/personnes');
const groupesDir = path.join(REPO_ROOT, 'src/content/groupes');

const people: Person[] = [];
for (const file of await readdir(personnesDir)) {
	if (!file.endsWith('.md')) continue;
	const raw = await readFile(path.join(personnesDir, file), 'utf-8');
	const { fm } = splitFrontmatter(raw);
	// Some "partenaire" entries are organizations (e.g. "espol", from a logo's
	// alt text) rather than people — a short one-word org acronym can
	// false-positive match inside an unrelated word (e.g. "ESPOL-ICL"). Real
	// person names are multi-word regardless of their `type`, so filter on
	// shape rather than excluding `partenaire` outright (some individuals,
	// e.g. a partner university's professor, are legitimately tagged that way
	// and can still be a research group coordinator).
	if (typeof fm.name === 'string' && fm.name.includes(' ') && fm.name.length >= 6) {
		people.push({ slug: file.replace(/\.md$/, ''), name: fm.name });
	}
}
// Match longer names first so "Laura Lema Silva" isn't shadowed by a shorter partial.
people.sort((a, b) => b.name.length - a.name.length);

function findZone(text: string, startMarker: RegExp, endMarker: RegExp): string {
	const startMatch = text.match(startMarker);
	if (!startMatch || startMatch.index === undefined) return '';
	const from = startMatch.index;
	const rest = text.slice(from + startMatch[0].length);
	const endMatch = rest.match(endMarker);
	const to = endMatch && endMatch.index !== undefined ? endMatch.index : rest.length;
	return rest.slice(0, to);
}

function namesIn(zone: string): string[] {
	const lower = zone.toLowerCase();
	const found: string[] = [];
	for (const person of people) {
		if (lower.includes(person.name.toLowerCase())) found.push(person.slug);
	}
	return found;
}

let groupsUpdated = 0;
let coordinatorLinks = 0;
let participantLinks = 0;

for (const file of await readdir(groupesDir)) {
	if (!file.endsWith('.md')) continue;
	const filePath = path.join(groupesDir, file);
	const raw = await readFile(filePath, 'utf-8');
	const { fm, body } = splitFrontmatter(raw);

	const animateursZone = findZone(body, /Animateurs?\s*:/i, /Participant|^##\s/m);
	const participantsZone = findZone(body, /Participant\.?e?\.?s?\s*:/i, /^##\s/m);

	const coordinators = namesIn(animateursZone);
	const participants = namesIn(participantsZone);

	if (coordinators.length === 0 && participants.length === 0) continue;

	fm.coordinators = coordinators;
	fm.participants = participants;
	coordinatorLinks += coordinators.length;
	participantLinks += participants.length;
	groupsUpdated++;
	await writeFile(filePath, serialize(fm, body), 'utf-8');
	console.log(`${file}: coordinators=[${coordinators.join(', ')}] participants=[${participants.join(', ')}]`);
}

console.log(`\nUpdated ${groupsUpdated} groups: ${coordinatorLinks} coordinator links, ${participantLinks} participant links.`);
