import { defineCollection, reference, z } from 'astro:content';
import { glob, file } from 'astro/loaders';
import yaml from 'js-yaml';

// ---------------------------------------------------------------------------
// Editorial collections
// See docs/BRIEF.md sections 5-12 for the rationale behind each schema.
//
// Image/file fields are plain strings (not Astro's `image()` helper): Decap
// CMS uploads write public-relative paths like `/uploads/foo.jpg`, which are
// served as-is rather than passed through Astro's asset-optimization
// pipeline.
// ---------------------------------------------------------------------------

const actualites = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/actualites' }),
	schema: z.object({
		title: z.string(),
		date: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		author: reference('personnes').optional(),
		category: z.string().optional(),
		featuredImage: z.string().optional(),
		excerpt: z.string().optional(),
		relatedEvent: reference('evenements').optional(),
		relatedResearchGroup: reference('groupes').optional(),
		relatedProject: reference('projets').optional(),
		externalLink: z.url().optional(),
		attachments: z.array(z.string()).default([]),
		featured: z.boolean().default(false),
		seoTitle: z.string().optional(),
		seoDescription: z.string().optional(),
	}),
});

const evenements = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/evenements' }),
	schema: z.object({
		title: z.string(),
		startDate: z.coerce.date(),
		endDate: z.coerce.date().optional(),
		startTime: z.string().optional(),
		endTime: z.string().optional(),
		location: z
			.object({
				name: z.string().optional(),
				address: z.string().optional(),
				city: z.string().optional(),
			})
			.optional(),
		description: z.string().optional(),
		registrationUrl: z.url().optional(),
		externalUrl: z.url().optional(),
		image: z.string().optional(),
		organizers: z.array(z.string()).default([]),
		partners: z.array(z.string()).default([]),
		researchGroups: z.array(reference('groupes')).default([]),
		// Upcoming/past is derived from startDate on the frontend (see brief §6);
		// this field only lets editors flag a cancellation.
		cancelled: z.boolean().default(false),
		featured: z.boolean().default(false),
		attachments: z.array(z.string()).default([]),
	}),
});

const groupes = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/groupes' }),
	schema: z.object({
		title: z.string(),
		shortTitle: z.string().optional(),
		intro: z.string().optional(),
		mission: z.string().optional(),
		axes: z
			.array(
				z.object({
					title: z.string(),
					description: z.string().optional(),
				}),
			)
			.default([]),
		coordinators: z.array(reference('personnes')).default([]),
		participants: z.array(reference('personnes')).default([]),
		image: z.string().optional(),
		status: z.enum(['active', 'archived']).default('active'),
		featured: z.boolean().default(false),
		seoTitle: z.string().optional(),
		seoDescription: z.string().optional(),
	}),
});

const personnes = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/personnes' }),
	schema: z.object({
		name: z.string(),
		photo: z.string().optional(),
		role: z.string().optional(),
		organization: z.string().optional(),
		position: z.string().optional(),
		type: z.enum(['equipe', 'copil', 'partenaire', 'chercheur', 'membre-reseau']),
		researchInterests: z.array(z.string()).default([]),
		email: z.email().optional(),
		website: z.url().optional(),
		linkedin: z.url().optional(),
		publications: z.array(reference('publications')).default([]),
		active: z.boolean().default(true),
	}),
});

const publications = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/publications' }),
	schema: z.object({
		title: z.string(),
		date: z.coerce.date(),
		authors: z.array(z.string()).default([]),
		description: z.string().optional(),
		coverImage: z.string().optional(),
		file: z.string().optional(),
		externalUrl: z.url().optional(),
		publisher: z.string().optional(),
		isbn: z.string().optional(),
		doi: z.string().optional(),
		researchGroup: reference('groupes').optional(),
		project: reference('projets').optional(),
		tags: z.array(z.string()).default([]),
		featured: z.boolean().default(false),
		seoTitle: z.string().optional(),
		seoDescription: z.string().optional(),
	}),
});

const ressources = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/ressources' }),
	schema: z.object({
		title: z.string(),
		type: z.enum(['video', 'audio', 'pedagogical', 'report', 'podcast', 'document']),
		date: z.coerce.date(),
		authors: z.array(z.string()).default([]),
		description: z.string().optional(),
		thumbnail: z.string().optional(),
		file: z.string().optional(),
		externalUrl: z.url().optional(),
		youtubeUrl: z.url().optional(),
		audioUrl: z.url().optional(),
		researchGroup: reference('groupes').optional(),
		project: reference('projets').optional(),
		tags: z.array(z.string()).default([]),
		featured: z.boolean().default(false),
	}),
});

const projets = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/projets' }),
	schema: z.object({
		title: z.string(),
		description: z.string().optional(),
		status: z.enum(['upcoming', 'active', 'completed']).default('active'),
		startDate: z.coerce.date().optional(),
		endDate: z.coerce.date().optional(),
		researchGroup: reference('groupes').optional(),
		partners: z.array(z.string()).default([]),
		team: z.array(reference('personnes')).default([]),
		website: z.url().optional(),
		image: z.string().optional(),
		resources: z.array(reference('ressources')).default([]),
		events: z.array(reference('evenements')).default([]),
		articles: z.array(reference('actualites')).default([]),
	}),
});

const pages = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
	schema: z.object({
		title: z.string(),
		template: z.string().optional(),
		heroImage: z.string().optional(),
		seoTitle: z.string().optional(),
		seoDescription: z.string().optional(),
	}),
});

// ---------------------------------------------------------------------------
// Taxonomies — editable term lists, referenced by string value from content
// (see brief §4). Kept as flat data files rather than a Zod enum so editors
// can add a term without a code change.
// ---------------------------------------------------------------------------

const termSchema = z.object({
	label: z.string(),
	value: z.string(),
});

const categories = defineCollection({
	loader: glob({ pattern: '**/*.yaml', base: './src/content/taxonomies/categories' }),
	schema: termSchema,
});

const tags = defineCollection({
	loader: glob({ pattern: '**/*.yaml', base: './src/content/taxonomies/tags' }),
	schema: termSchema,
});

const resourceTypes = defineCollection({
	loader: glob({ pattern: '**/*.yaml', base: './src/content/taxonomies/resource-types' }),
	schema: termSchema,
});

// ---------------------------------------------------------------------------
// Global configuration — singleton files, each edited as one Decap "file"
// entry (see brief §4 CONFIG and §13). Each YAML file holds one flat object
// (matching what Decap's file collections write) which `singleton()` loads
// as a single entry with id "main".
// ---------------------------------------------------------------------------

function singleton(fileName: string) {
	return file(fileName, {
		parser: (text) => ({ main: yaml.load(text) as Record<string, unknown> }),
	});
}

const siteSettings = defineCollection({
	loader: singleton('src/content/config/site-settings.yaml'),
	schema: z.object({
		siteName: z.string(),
		tagline: z.string().optional(),
		description: z.string().optional(),
		logo: z.string().optional(),
		email: z.email().optional(),
		phone: z.string().optional(),
		address: z.string().optional(),
	}),
});

const navigation = defineCollection({
	loader: singleton('src/content/config/navigation.yaml'),
	schema: z.object({
		items: z.array(
			z.object({
				label: z.string(),
				url: z.string(),
			}),
		),
	}),
});

const footer = defineCollection({
	loader: singleton('src/content/config/footer.yaml'),
	schema: z.object({
		text: z.string().optional(),
		columns: z
			.array(
				z.object({
					title: z.string(),
					links: z.array(z.object({ label: z.string(), url: z.string() })),
				}),
			)
			.default([]),
	}),
});

const socialLinks = defineCollection({
	loader: singleton('src/content/config/social-links.yaml'),
	schema: z.object({
		items: z.array(
			z.object({
				platform: z.string(),
				url: z.url(),
			}),
		),
	}),
});

const newsletter = defineCollection({
	loader: singleton('src/content/config/newsletter.yaml'),
	schema: z.object({
		heading: z.string().optional(),
		description: z.string().optional(),
		provider: z.string().optional(),
		formAction: z.string().optional(),
	}),
});

const seoDefaults = defineCollection({
	loader: singleton('src/content/config/seo-defaults.yaml'),
	schema: z.object({
		defaultTitle: z.string().optional(),
		titleTemplate: z.string().optional(),
		defaultDescription: z.string().optional(),
		defaultImage: z.string().optional(),
		twitterHandle: z.string().optional(),
	}),
});

export const collections = {
	actualites,
	evenements,
	groupes,
	personnes,
	publications,
	ressources,
	projets,
	pages,
	categories,
	tags,
	resourceTypes,
	siteSettings,
	navigation,
	footer,
	socialLinks,
	newsletter,
	seoDefaults,
};
