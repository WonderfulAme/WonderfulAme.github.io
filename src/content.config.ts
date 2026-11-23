import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Every Markdown file in src/content/notes/ becomes a note.
// Put Spanish notes in notes/es/ and English notes in notes/en/.
const notes = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/notes' }),
	schema: z.object({
		title: z.string(),
		description: z.string().optional(),
		date: z.coerce.date(),
		// Optional: the series a note belongs to (e.g. "Análisis Real"), shown next to its title.
		series: z.string().optional(),
		// Optional: give a note and its translation the same key so the language switch links them.
		translationKey: z.string().optional(),
		draft: z.boolean().default(false),
	}),
});

export const collections = { notes };
