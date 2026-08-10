# Institut pour la Paix — Website Audit & WordPress → Static Site Migration Review

**Website:** https://www.institutpourlapaix.org  
**Scope:** Site structure, content architecture, CMS model, migration strategy, SEO, and proposed Decap CMS collections  
**Target architecture:** Static site + Decap CMS

---

## 1. Executive Summary

The Institut pour la Paix website is a strong candidate for migration from WordPress to a static site architecture.

The site contains substantial editorial and academic content, but the current WordPress-oriented structure does not fully reflect the actual nature of the content.

The main recommendation is:

> **Do not migrate the WordPress site page-for-page.**

Instead, the migration should first normalize the existing content into a set of structured content types:

- Articles / Actualités
- Événements
- Groupes de recherche
- Personnes
- Publications
- Ressources
- Projets
- Static Pages

The new site can then be generated from these structured collections.

A recommended stack would be:

```text
Astro
+
Content Collections
+
Decap CMS
+
Markdown / YAML / JSON
+
GitHub
+
Static hosting / CDN
```

This would remove the dependency on:

- PHP
- WordPress database
- WordPress plugins
- WordPress-specific templates
- Server-side rendering for most of the site

while retaining an accessible editorial interface through Decap CMS.

---

# 2. Current Website Structure

The primary navigation is approximately:

```text
Home
├── Équipe et réseau
├── Actualités
├── Recherche
├── Agenda
├── Ressources
└── Devenir membre
```

The homepage aggregates several types of content:

```text
Homepage
├── Introduction / mission
├── Recherche
├── Colloques & rencontres
├── Actualités
├── Événements
├── L'IPP en 3 minutes
├── Devenir membre
└── Newsletter
```

The overall information architecture is understandable, but several different content types are currently represented as pages or WordPress content instead of structured entities.

---

# 3. Recommended New Information Architecture

The proposed public-facing structure is:

```text
/
├── recherche/
│   ├── concepts-de-la-paix/
│   ├── genre-et-paix/
│   ├── approches-regionales/
│   ├── paix-conflits-environnement/
│   └── resistance-civile/
│
├── actualites/
│   └── [article-slug]/
│
├── agenda/
│   └── [event-slug]/
│
├── ressources/
│   ├── publications/
│   ├── pedagogiques/
│   └── audiovisuelles/
│
├── projets/
│   └── [project-slug]/
│
├── equipe-reseau/
│   └── [person-slug]/
│
├── devenir-membre/
│
├── a-propos/
│
├── contact/
│
├── mentions-legales/
└── politique-de-confidentialite/
```

The important change is that the URLs represent content types rather than WordPress implementation details.

---

# 4. Proposed Content Architecture

The new CMS should contain the following primary collections:

```text
CONTENT
│
├── Actualités
├── Événements
├── Groupes de recherche
├── Projets
├── Personnes
├── Publications
├── Ressources
└── Pages
```

In addition, there should be taxonomies and global configuration:

```text
TAXONOMIES
├── Catégories
├── Tags
├── Types de ressources
└── Groupes de recherche

CONFIG
├── Site settings
├── Navigation
├── Footer
├── Social links
├── Newsletter
└── SEO defaults
```

---

# 5. Collection: Actualités

The existing Actualités section behaves like a conventional editorial/news archive.

It contains:

- title
- date
- category
- author
- excerpt
- article content
- image
- related research topics

This should become a dedicated Decap CMS collection.

## Suggested schema

```yaml
title:
slug:
date:
updated_date:

author:

category:

featured_image:

excerpt:

body:

related_event:
related_research_group:
related_project:

external_link:

attachments:

featured:

seo_title:
seo_description:
```

## Suggested URLs

```text
/actualites/
/actualites/[article-slug]/
```

Categories can be generated automatically:

```text
/actualites/concepts-de-la-paix/
/actualites/genre-et-paix/
/actualites/approches-regionales/
```

There should not be a separate CMS collection for every category.

Categories should instead be taxonomy data.

---

# 6. Collection: Événements

The Agenda is one of the clearest examples of content that should be structured.

Current event information generally includes:

- date
- time
- title
- location
- description
- registration/external link

## Suggested schema

```yaml
title:
slug:

start_date:
end_date:

start_time:
end_time:

location:
  name:
  address:
  city:

description:
body:

registration_url:
external_url:

image:

organizers:
partners:

research_groups:

status:
  - upcoming
  - past
  - cancelled

featured:

attachments:
```

The frontend should automatically determine whether an event is upcoming or past based on its date.

This means editors should not have to manually maintain separate "upcoming" and "past" lists.

## Suggested structure

```text
/agenda/

    À venir

    [event cards]


    Événements passés

    [event cards]
```

If there are no upcoming events:

```text
À venir

Aucun événement à venir.

Voir les événements passés →
```

---

# 7. Collection: Groupes de Recherche

This is one of the most important collections.

The current research groups are:

1. Concepts de la paix
2. Paix, conflits et environnement
3. Genre et paix
4. Approches régionales
5. Résistance civile, non-violence et culture de la paix

The individual research group pages already follow a fairly consistent structure.

They typically contain:

- mission
- description
- research areas
- coordinators
- participants
- publications
- events
- related research groups

This is ideal for a reusable CMS model.

## Suggested schema

```yaml
title:
slug:
short_title:

intro:

mission:

description:

axes:
  - title:
    description:

coordinators:

participants:

image:

status:
  - active
  - archived

featured:

seo_title:
seo_description:
```

## Suggested URL structure

```text
/recherche/

/recherche/concepts-de-la-paix/
/recherche/genre-et-paix/
/recherche/approches-regionales/
/recherche/paix-conflits-environnement/
/recherche/resistance-civile/
```

The individual pages should all use the same frontend template.

---

# 8. Collection: Personnes

The current "Équipe et réseau" page is one of the clearest examples of content that should be converted from a large page into structured entities.

The page currently combines:

- team members
- Comité de pilotage
- researchers
- network members
- partners
- biographies

This makes the page large and difficult to maintain.

## Recommended model

Create a `personnes` collection.

## Suggested schema

```yaml
name:
slug:

photo:

role:
organization:
position:

type:
  - equipe
  - copil
  - partenaire
  - chercheur
  - membre-reseau

bio:

research_interests:

email:
website:
linkedin:

publications:

active:
```

## Resulting page

```text
Équipe & réseau

Notre fonctionnement

Équipe

[Person cards]


Comité de pilotage

[Person cards]


Réseau scientifique

[Person cards]


Partenaires

[Partner cards / logos]
```

Individual profiles can optionally have their own URLs:

```text
/equipe-reseau/[person-slug]/
```

This is likely the single biggest CMS improvement for the current site.

---

# 9. Collection: Publications

Publications should be treated as persistent research resources rather than normal news articles.

There is an important semantic difference:

```text
Actualité
=
Something the IPP wants to communicate now.
```

versus:

```text
Publication
=
A persistent research/resource object.
```

## Suggested schema

```yaml
title:
slug:

date:

authors:

description:

body:

cover_image:

file:

external_url:

publisher:

isbn:

doi:

research_group:

project:

tags:

featured:

seo_title:
seo_description:
```

## Suggested URLs

```text
/ressources/publications/
/ressources/publications/[publication-slug]/
```

---

# 10. Collection: Ressources

The existing Resources section includes several resource types:

- ressources audiovisuelles
- ressources pédagogiques
- publications

These can share a common metadata structure.

## Suggested schema

```yaml
title:
slug:

type:
  - video
  - audio
  - pedagogical
  - report
  - podcast
  - document

date:

authors:

description:

body:

thumbnail:

file:

external_url:

youtube_url:

audio_url:

research_group:

project:

tags:

featured:
```

The frontend can then provide filters:

```text
Ressources

Tous
Publications
Vidéos
Audios
Ressources pédagogiques
Rapports
Podcasts
```

---

# 11. Collection: Projets

Some content on the current site represents ongoing research projects rather than simple news.

A good example is:

> Constellations pour les paix plurielles

This type of content should have a persistent project page rather than existing only as a series of news posts.

## Suggested schema

```yaml
title:
slug:

description:

status:

start_date:
end_date:

research_group:

partners:

team:

website:

image:

body:

resources:

events:

articles:
```

## Suggested URL

```text
/projets/constellations-pour-les-paix-plurielles/
```

This allows the project to accumulate:

- articles
- events
- publications
- resources
- team members

without losing its identity.

---

# 12. Collection: Pages

Not everything should become a structured collection.

Static institutional pages should be managed through a generic `pages` collection.

Examples:

```text
À propos
Devenir membre
Contact
Mentions légales
Politique de confidentialité
```

## Suggested schema

```yaml
title:
slug:

template:

hero_image:

body:

seo_title:
seo_description:
```

However, research groups, events, people and publications should **not** be represented as generic pages.

---

# 13. Final Decap CMS Model

The recommended CMS structure is:

```text
ACTUALITÉS
ÉVÉNEMENTS
GROUPES DE RECHERCHE
PROJETS
PERSONNES
PUBLICATIONS
RESSOURCES
PAGES
```

Taxonomies:

```text
CATÉGORIES
TAGS
TYPES DE RESSOURCES
GROUPES DE RECHERCHE
```

Global configuration:

```text
SITE SETTINGS
NAVIGATION
FOOTER
SOCIAL LINKS
NEWSLETTER
SEO DEFAULTS
```

---

# 14. Homepage Audit

The current homepage contains the right broad content but tries to perform several jobs simultaneously.

It needs to explain:

- what IPP is
- what IPP researches
- what IPP is currently doing
- how people can participate
- what resources IPP publishes

A clearer hierarchy would be:

```text
HERO

L'Institut Pour la Paix

Short positioning statement

[Découvrir l'IPP]
[Nos recherches]


MISSION

La paix comme objet d'étude

Short explanation


RECHERCHE

5 research groups

[Concepts de la paix]
[Genre et paix]
[Approches régionales]
[Paix, conflits et environnement]
[Résistance civile]


À LA UNE

Featured article


AGENDA

Upcoming events


RESSOURCES

Latest publications / videos / podcasts


L'IPP EN 3 MINUTES

Video


REJOINDRE LE RÉSEAU

Membership CTA


NEWSLETTER
```

This provides a much clearer user journey.

---

# 15. Research Section

The current Research section has a strong intellectual foundation.

The introduction explains the IPP approach to peace and conflict before presenting the different research groups.

This should be retained, but the presentation should become more editorial and visual.

Recommended structure:

```text
Recherche

La paix comme objet d'étude

[2–3 paragraphs]


Notre approche

[3 principles]


Nos groupes de recherche

[5 research group cards]


Projets transversaux

[project cards]
```

---

# 16. Research Group Template

All research group pages should share a common template.

Recommended template:

```text
RESEARCH GROUP

[Group title]

Mission

Axes de recherche

Coordination

Participants

Actualités

Publications

Événements

Projets

Groupes associés
```

The same template should render all five groups.

This eliminates duplicate page structures and makes future research groups easy to add.

---

# 17. Actualités Archive

The existing category system should be retained as taxonomy data.

Current categories include themes such as:

- Approches régionales
- Concepts de la Paix
- Études de Paix
- Genre et Paix
- IPP
- Paix, Conflits et Environnement
- Recherche
- Résistance civile, non-violence et culture de la paix

Recommended architecture:

```text
/actualites/
/actualites/[article-slug]/
/actualites/[category]/
```

Alternatively, category pages can be represented as:

```text
/actualites/concepts-de-la-paix/
/actualites/genre-et-paix/
```

---

# 18. Agenda UX

Recommended event card:

```text
24
JUIN 2026

Cinquième séance des
"Apéros Justice, care et paix"

18:30 → 20:00

Fondation pour le Progrès Humain

[Voir l'événement]
```

Event detail:

```text
Event title

Date
Time
Location

Description

Programme

Intervenants

Partners

Registration

Related research group
```

---

# 19. Team & Network Redesign

The current team/network page should be completely restructured.

Instead of:

```text
One very large page
    ↓
many people
    ↓
long biographies
```

use:

```text
Équipe & réseau

Notre fonctionnement

Équipe
    ↓
Person cards

Comité de pilotage
    ↓
Person cards

Réseau scientifique
    ↓
Person cards

Partenaires
    ↓
Partner cards
```

Every person becomes independently editable through Decap CMS.

---

# 20. Membership

The membership page contains:

- why become a member
- conditions
- ethical charter
- membership information
- form
- newsletter preference

For the static site, the form should not be implemented as a custom WordPress-like backend.

Recommended architecture:

```text
Static website
      ↓
External form service / API
      ↓
Email / CRM / database / spreadsheet
```

Decap CMS should manage the page content, not membership submissions.

---

# 21. Legal & Privacy

The legal pages should not simply be copied from WordPress.

They should be reviewed during migration.

Items to check:

```text
[ ] Legal entity information
[ ] Address
[ ] Postal codes
[ ] GDPR wording
[ ] Cookie policy
[ ] Consent mechanism
[ ] Newsletter provider
[ ] Form processor
[ ] Analytics
[ ] Third-party services
```

There are already some inconsistencies in the existing legal information, including GDPR terminology.

These should be corrected during migration.

---

# 22. WordPress → Static Content Mapping

| Existing WordPress content | New static content |
|---|---|
| Pages | `pages` |
| Posts | `actualites` |
| Event posts | `evenements` |
| Research group pages | `groupes-de-recherche` |
| Team page | `personnes` |
| COPIL profiles | `personnes` |
| Publications | `publications` |
| Videos | `ressources` |
| Audio | `ressources` |
| Pedagogical resources | `ressources` |
| Projects | `projets` |
| Categories | Taxonomies |
| Tags | Taxonomies |
| Media Library | `/assets/` / CDN |
| Newsletter form | External service |
| Membership form | External service |
| Menus | Site config |
| Footer | Site config |

---

# 23. Recommended Repository Structure

Assuming Astro:

```text
src/
├── pages/
├── layouts/
├── components/
│
├── content/
│   ├── actualites/
│   ├── evenements/
│   ├── groupes/
│   ├── personnes/
│   ├── publications/
│   ├── ressources/
│   └── projets/
│
public/
├── images/
├── documents/
└── fonts/

public/
└── admin/
    └── config.yml
```

---

# 24. Example Decap CMS Configuration

Conceptually, the configuration would look like:

```yaml
collections:

  - name: actualites
    label: Actualités
    folder: src/content/actualites
    create: true
    fields:
      - { name: title, label: Titre, widget: string }
      - { name: slug, label: Slug, widget: string }
      - { name: date, label: Date, widget: datetime }
      - { name: category, label: Catégorie, widget: relation }
      - { name: excerpt, label: Extrait, widget: text }
      - { name: image, label: Image, widget: image }
      - { name: body, label: Contenu, widget: markdown }

  - name: evenements
    label: Événements
    folder: src/content/evenements
    create: true

  - name: groupes
    label: Groupes de recherche
    folder: src/content/groupes
    create: true

  - name: personnes
    label: Personnes
    folder: src/content/personnes
    create: true

  - name: publications
    label: Publications
    folder: src/content/publications
    create: true

  - name: ressources
    label: Ressources
    folder: src/content/ressources
    create: true

  - name: projets
    label: Projets
    folder: src/content/projets
    create: true

  - name: pages
    label: Pages
    folder: src/content/pages
    create: true
```

This is an initial conceptual configuration. The final `config.yml` should be created after the complete content inventory and schema have been finalized.

---

# 25. What Should NOT Be Editable Through Decap

Decap should manage editorial content, not application architecture.

Editors should manage:

```text
✓ Articles
✓ Events
✓ Research groups
✓ People
✓ Publications
✓ Resources
✓ Projects
✓ Basic pages
✓ SEO metadata
```

Developers should control:

```text
✗ Navigation structure
✗ Layout
✗ Design system
✗ Components
✗ Search implementation
✗ Filters
✗ Routing
✗ Responsive behavior
✗ Analytics implementation
✗ Cookie implementation
```

Some global settings can be exposed through Decap, but Decap should not become a page builder.

---

# 26. Main Content Problems Identified

## 26.1 Content is too page-oriented

The team page is the clearest example.

A database of people is currently represented as one very large page.

### Recommendation

Create a structured `personnes` collection.

---

## 26.2 Events are structured but tied to WordPress

Event information is already relatively clean.

### Recommendation

Create an `evenements` collection with automatic upcoming/past classification.

---

## 26.3 Research groups are semi-structured

The research groups use very similar structures but are not modeled as reusable entities.

### Recommendation

Create a `groupes-de-recherche` collection.

---

## 26.4 Projects can disappear into news

Long-running projects should have persistent identities.

### Recommendation

Create a `projets` collection.

---

## 26.5 Resources are fragmented

Publications, audiovisual material and pedagogical resources are currently presented as separate resource types.

### Recommendation

Use shared metadata and structured resource types.

---

## 26.6 Repeated content should become reusable components

Repeated elements such as:

```text
Dernières actualités
Catégories
Autres groupes de travail
Newsletter
Footer
Cookie UI
```

should become reusable components rather than duplicated page markup.

---

# 27. Recommended Technical Architecture

A strong target architecture would be:

```text
Astro
+
Content Collections
+
Decap CMS
+
Markdown / YAML
+
GitHub
+
Static Hosting / CDN
```

Architecture:

```text
                  ┌──────────────┐
                  │   Decap CMS  │
                  └──────┬───────┘
                         │
                         ▼
                  ┌──────────────┐
                  │    GitHub    │
                  └──────┬───────┘
                         │
                         ▼
                  ┌──────────────┐
                  │     Astro    │
                  │ Static Build │
                  └──────┬───────┘
                         │
                         ▼
                  ┌──────────────┐
                  │ CDN / Hosting│
                  └──────────────┘
```

Benefits:

- no PHP
- no WordPress database
- no WordPress plugins
- faster pages
- easier deployment
- simpler hosting
- version-controlled content
- easier development
- structured editorial workflow
- better long-term maintainability

---

# 28. Frontend Component Architecture

Recommended reusable components:

```text
Global
├── Header
├── Navigation
├── Breadcrumbs
├── Footer
├── Newsletter
└── Cookie Consent

Content
├── ArticleCard
├── EventCard
├── PersonCard
├── PublicationCard
├── ResourceCard
├── ResearchGroupCard
└── ProjectCard

Pages
├── Home
├── Actualites
├── Article
├── Agenda
├── Event
├── Recherche
├── ResearchGroup
├── Ressources
├── Resource
├── Equipe
├── Person
├── Publication
├── Project
└── StaticPage
```

---

# 29. Recommended Final Sitemap

```text
/
│
├── actualites/
│   └── [article]/
│
├── agenda/
│   └── [event]/
│
├── recherche/
│   ├── concepts-de-la-paix/
│   ├── genre-et-paix/
│   ├── approches-regionales/
│   ├── paix-conflits-environnement/
│   └── resistance-civile/
│
├── projets/
│   └── [project]/
│
├── ressources/
│   ├── publications/
│   ├── audiovisuelles/
│   └── pedagogiques/
│
├── equipe-reseau/
│   └── [person]/
│
├── devenir-membre/
│
├── a-propos/
│
├── contact/
│
├── mentions-legales/
│
└── politique-de-confidentialite/
```

---

# 30. Migration Strategy

The migration should be done in the following order:

```text
1. Crawl the complete WordPress website
        ↓
2. Build a complete URL inventory
        ↓
3. Build a complete content inventory
        ↓
4. Identify content types
        ↓
5. Define the CMS schema
        ↓
6. Export WordPress content
        ↓
7. Transform content → Markdown/YAML
        ↓
8. Import into Decap-compatible structure
        ↓
9. Build page templates
        ↓
10. Build the design system
        ↓
11. Implement redirects
        ↓
12. Perform SEO/content QA
        ↓
13. Launch
```

The key principle is:

> **Schema before migration.**

Do not start by copying WordPress pages into Markdown.

First determine what each piece of content actually represents.

---

# 31. SEO Migration

SEO should be treated as a first-class migration task.

For every existing URL:

```text
OLD URL
   ↓
NEW URL
   ↓
301 REDIRECT
   ↓
CANONICAL
   ↓
META TITLE
   ↓
META DESCRIPTION
   ↓
OPEN GRAPH
```

Where possible, existing URLs should be preserved.

Examples:

```text
/recherche/concepts-de-la-paix/
/agenda/
/actualites/
/ressources/
/equipe-reseau/
/adherer-a-lipp/
```

should ideally remain stable unless there is a strong reason to change them.

---

# 32. URL Migration Spreadsheet

Before development, create a spreadsheet containing:

| Old URL | New URL | Content Type | CMS Collection | Status | Redirect |
|---|---|---|---|---|---|
| `/actualites/...` | `/actualites/...` | Article | actualites | To migrate | 301 |
| `/agenda/...` | `/agenda/...` | Event | evenements | To migrate | 301 |
| `/recherche/...` | `/recherche/...` | Research group | groupes | To migrate | 301 |
| `/equipe-reseau/...` | `/equipe-reseau/...` | Person | personnes | To migrate | 301 |
| `/ressources/...` | `/ressources/...` | Resource | ressources | To migrate | 301 |

This should become the master migration document.

---

# 33. Content Migration Checklist

## Discovery

- [ ] Crawl all public URLs
- [ ] Identify pagination
- [ ] Identify category pages
- [ ] Identify tag pages
- [ ] Identify individual articles
- [ ] Identify events
- [ ] Identify research groups
- [ ] Identify people
- [ ] Identify publications
- [ ] Identify multimedia
- [ ] Identify downloadable documents
- [ ] Identify forms
- [ ] Identify external services

## Content modeling

- [ ] Define article schema
- [ ] Define event schema
- [ ] Define research group schema
- [ ] Define person schema
- [ ] Define publication schema
- [ ] Define resource schema
- [ ] Define project schema
- [ ] Define page schema
- [ ] Define taxonomies
- [ ] Define global configuration

## Migration

- [ ] Export WordPress content
- [ ] Normalize HTML
- [ ] Convert to Markdown
- [ ] Extract metadata
- [ ] Extract images
- [ ] Extract documents
- [ ] Normalize authors
- [ ] Normalize categories
- [ ] Normalize research groups
- [ ] Generate slugs
- [ ] Generate redirects

## QA

- [ ] Check every migrated URL
- [ ] Check images
- [ ] Check documents
- [ ] Check internal links
- [ ] Check external links
- [ ] Check metadata
- [ ] Check structured data
- [ ] Check accessibility
- [ ] Check mobile
- [ ] Check redirects
- [ ] Check sitemap
- [ ] Check robots.txt

---

# 34. Overall Assessment

| Area | Assessment |
|---|---:|
| Content quality | 8/10 |
| Editorial value | 9/10 |
| Information architecture | 6/10 |
| CMS architecture | 4/10 |
| Static migration potential | 9/10 |
| Structured content potential | 9/10 |
| Technical migration complexity | Medium |
| SEO migration risk | Medium |
| Recommended approach | Static + Decap |

---

# 35. Final Recommendation

The Institut pour la Paix website is a very good candidate for a static-site migration.

However, the migration should not be treated as:

```text
WordPress
   ↓
HTML
```

It should be treated as:

```text
WordPress
   ↓
CONTENT AUDIT
   ↓
CONTENT MODEL
   ↓
STRUCTURED DATA
   ↓
DECAP CMS
   ↓
STATIC FRONTEND
```

The most important architectural decision is to separate **content types** from **pages**.

The final CMS should therefore be based around:

```text
Actualités
Événements
Groupes de recherche
Projets
Personnes
Publications
Ressources
Pages
```

rather than trying to reproduce the WordPress page hierarchy.

---

# 36. Recommended Next Step

The next deliverable should be a **complete URL + content inventory** of the current WordPress site.

For every URL, capture:

```text
URL
Title
Content type
Current WordPress type
New URL
New CMS collection
Category
Research group
Author
Date
Featured image
Attachments
SEO title
SEO description
Migration status
Redirect required
Notes
```

The resulting document should look like:

```text
URL INVENTORY
│
├── All current URLs
├── URL → URL mapping
├── Content type mapping
├── Decap collection mapping
├── Redirect mapping
├── Assets mapping
└── Migration status
```

That inventory should be completed **before implementation**.

It will become the master reference for the entire WordPress → static site migration.