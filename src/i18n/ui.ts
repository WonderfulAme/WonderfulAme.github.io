// All the text that appears on the site, in both languages.
// To change what the site says, edit it here.

export const languages = { es: 'Español', en: 'English' } as const;
export type Lang = keyof typeof languages;
export const defaultLang: Lang = 'es';
export const langs = Object.keys(languages) as Lang[];

export const ui = {
	es: {
		'site.title': 'And AnOtter Thing',
		'site.description': 'La página personal de Amelia: notas, matemáticas, historias y proyectos.',
		'nav.home': 'Inicio',
		'nav.notes': 'Notas',
		'nav.projects': 'Proyectos',
		'nav.contact': 'Contacto',
		'nav.switch': 'Read in English',
		'home.hello': '¡Hola! Soy Amelia',
		'home.tagline': 'Y esta es otra cosa más: mi rincón de internet para matemáticas, historias y proyectos.',
		'home.aboutTitle': 'Sobre mí',
		'home.about':
			'Aquí puedes escribir un poco sobre ti: qué estudias, qué te gusta, qué te emociona aprender. Edita este texto en src/i18n/ui.ts.',
		'home.latestNotes': 'Notas recientes',
		'home.allNotes': 'Ver todas las notas',
		'home.featuredProjects': 'Algunos proyectos',
		'home.allProjects': 'Ver todos los proyectos',
		'notes.title': 'Notas',
		'notes.intro': 'Historias, apuntes y cosas que voy aprendiendo.',
		'notes.other': 'Otras notas',
		'notes.empty': 'Todavía no hay notas aquí. ¡Pronto!',
		'notes.back': '← Volver a las notas',
		'projects.title': 'Proyectos',
		'projects.intro': 'Cosas que he hecho o en las que estoy trabajando.',
		'contact.title': 'Contacto',
		'contact.intro': '¿Quieres saludar? Me encuentras aquí:',
		'footer.made': 'Hecho con cariño (y nutrias) usando Astro.',
		'404.title': 'Página no encontrada',
		'404.text': 'Esta nutria buscó por todo el río y no encontró esta página.',
		'404.home': 'Volver al inicio',
	},
	en: {
		'site.title': 'And AnOtter Thing',
		'site.description': "Amelia's personal site: notes, math, stories and projects.",
		'nav.home': 'Home',
		'nav.notes': 'Notes',
		'nav.projects': 'Projects',
		'nav.contact': 'Contact',
		'nav.switch': 'Leer en español',
		'home.hello': "Hi! I'm Amelia",
		'home.tagline': 'And this is another thing: my corner of the internet for math, stories and projects.',
		'home.aboutTitle': 'About me',
		'home.about':
			'Write a little about yourself here: what you study, what you enjoy, what you are excited to learn. Edit this text in src/i18n/ui.ts.',
		'home.latestNotes': 'Latest notes',
		'home.allNotes': 'See all notes',
		'home.featuredProjects': 'Some projects',
		'home.allProjects': 'See all projects',
		'notes.title': 'Notes',
		'notes.intro': "Stories, study notes and things I'm learning.",
		'notes.other': 'Other notes',
		'notes.empty': 'No notes here yet. Soon!',
		'notes.back': '← Back to notes',
		'projects.title': 'Projects',
		'projects.intro': "Things I've made or am working on.",
		'contact.title': 'Contact',
		'contact.intro': 'Want to say hi? You can find me here:',
		'footer.made': 'Made with love (and otters) using Astro.',
		'404.title': 'Page not found',
		'404.text': 'This otter searched the whole river and could not find that page.',
		'404.home': 'Back home',
	},
} as const;

export type UiKey = keyof (typeof ui)['es'];

export function useTranslations(lang: Lang) {
	return (key: UiKey) => ui[lang][key] ?? ui[defaultLang][key];
}

export function otherLang(lang: Lang): Lang {
	return lang === 'es' ? 'en' : 'es';
}

/** Used by every page under src/pages/[lang]/ to build both language versions. */
export function langPaths() {
	return langs.map((lang) => ({ params: { lang } }));
}

export function formatDate(date: Date, lang: Lang, month: 'long' | 'short' = 'long') {
	if (month === 'short' && lang === 'es') {
		// "23 nov 2026" (sin los "de")
		const parts = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).formatToParts(date);
		const get = (type: string) => parts.find((p) => p.type === type)?.value.replace('.', '') ?? '';
		return `${get('day')} ${get('month')} ${get('year')}`;
	}
	return date.toLocaleDateString(lang === 'es' ? 'es-CO' : 'en-US', {
		year: 'numeric',
		month,
		day: 'numeric',
		timeZone: 'UTC',
	});
}
