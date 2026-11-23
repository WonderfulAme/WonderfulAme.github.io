import { getCollection, type CollectionEntry } from 'astro:content';
import type { Lang } from '../i18n/ui';

export type Note = CollectionEntry<'notes'>;

/** "es/analisis-real/capitulo-1" -> "es" */
export const noteLang = (note: Note) => note.id.split('/')[0] as Lang;

/** "es/analisis-real/capitulo-1" -> "analisis-real/capitulo-1" */
export const noteSlug = (note: Note) => note.id.split('/').slice(1).join('/');

export const noteUrl = (note: Note) => `/${noteLang(note)}/notes/${noteSlug(note)}/`;

/** All published notes in a language, newest first. */
export async function getNotes(lang: Lang) {
	const notes = await getCollection(
		'notes',
		(note) => noteLang(note) === lang && (import.meta.env.DEV || !note.data.draft),
	);
	return notes.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

/** Notes of one series in reading order. */
export function sortSeries(notes: Note[]) {
	return [...notes].sort(
		(a, b) => (a.data.order ?? 0) - (b.data.order ?? 0) || a.data.title.localeCompare(b.data.title),
	);
}

/** The same note in the other language, if one has the same translationKey. */
export async function findTranslation(note: Note, lang: Lang) {
	if (!note.data.translationKey) return undefined;
	const all = await getNotes(lang);
	return all.find((n) => n.data.translationKey === note.data.translationKey);
}
