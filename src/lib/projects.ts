import { getCollection, type CollectionEntry } from 'astro:content';
import type { Lang } from '../i18n/ui';
import type { Entry } from './indice';

export type Project = CollectionEntry<'projects'>;

/** "es/sismometro" -> "sismometro" (the same name in both languages) */
export const projectSlug = (project: Project) => project.id.split('/').slice(1).join('/');

export const projectUrl = (project: Project, lang: Lang) => `/${lang}/projects/${projectSlug(project)}/`;

/** All projects in a language, in the order given by their `order` field. */
export async function getProjects(lang: Lang) {
	const projects = await getCollection('projects', (p) => p.id.startsWith(`${lang}/`));
	return projects.sort((a, b) => a.data.order - b.data.order);
}

/** A project as a line of the table of contents. */
export const projectEntry = (lang: Lang) => (project: Project): Entry => ({
	href: projectUrl(project, lang),
	title: project.data.title,
	date: project.data.date,
});
