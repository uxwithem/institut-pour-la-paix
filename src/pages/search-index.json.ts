import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';

interface SearchEntry {
	title: string;
	type: string;
	url: string;
	meta?: string;
}

export const GET: APIRoute = async () => {
	const base = import.meta.env.BASE_URL.replace(/\/$/, '');
	const entries: SearchEntry[] = [];

	const actualites = await getCollection('actualites');
	for (const a of actualites) {
		entries.push({
			title: a.data.title,
			type: 'Actualité',
			url: `${base}/actualites/${a.id}/`,
			meta: a.data.excerpt,
		});
	}

	const evenements = await getCollection('evenements');
	for (const e of evenements) {
		entries.push({
			title: e.data.title,
			type: 'Événement',
			url: `${base}/agenda/${e.id}/`,
			meta: e.data.startDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
		});
	}

	const groupes = await getCollection('groupes');
	for (const g of groupes) {
		entries.push({
			title: g.data.title,
			type: 'Groupe de recherche',
			url: `${base}/recherche/${g.id}/`,
			meta: g.data.intro,
		});
	}

	const personnes = await getCollection('personnes', ({ data }) => data.active);
	for (const p of personnes) {
		entries.push({
			title: p.data.name,
			type: 'Personne',
			url: `${base}/equipe-reseau/${p.id}/`,
			meta: p.data.role,
		});
	}

	const publications = await getCollection('publications');
	for (const p of publications) {
		entries.push({
			title: p.data.title,
			type: 'Publication',
			url: `${base}/ressources/publications/${p.id}/`,
			meta: p.data.description,
		});
	}

	const ressources = await getCollection('ressources');
	for (const r of ressources) {
		entries.push({
			title: r.data.title,
			type: 'Ressource',
			url: `${base}/ressources/${r.id}/`,
			meta: r.data.description,
		});
	}

	const projets = await getCollection('projets');
	for (const p of projets) {
		entries.push({
			title: p.data.title,
			type: 'Projet',
			url: `${base}/projets/${p.id}/`,
			meta: p.data.description,
		});
	}

	const pages = await getCollection('pages');
	for (const p of pages) {
		entries.push({
			title: p.data.title,
			type: 'Page',
			url: `${base}/${p.id}/`,
		});
	}

	return new Response(JSON.stringify(entries), {
		headers: { 'Content-Type': 'application/json' },
	});
};
