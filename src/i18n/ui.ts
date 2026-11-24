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
		'nav.notes': 'Notas',
		'nav.projects': 'Proyectos',
		'nav.contact': 'Contacto',
		'home.hello': '¡Hola! Soy Amelia',
		'home.tagline': 'Y esta es otra cosa más: mi rincón de internet para matemáticas, historias y proyectos.',
		'home.about':
			'Actualmente vivo en el planeta Tierra, con planes de mudarme pronto. Algunas de mis cosas favoritas son las nutrias, las nubes, los libros y los jardines. Estudio ingeniería física e ingeniería matemática, y las dos me encantan. Hice esta página para tener un registro de las cosas que he hecho con mi vida.',
		'home.latestNotes': 'Notas recientes',
		'home.allNotes': 'Ver todas las notas',
		'cookie.title': 'Una galleta para ti',
		'cookie.button': 'Recoger la galleta',
		'cookie.prompt': 'Haz clic para recogerla.',
		'cookie.count': 'Galletas recogidas:',
		'notes.title': 'Notas',
		'notes.intro': 'Historias, apuntes y cosas que voy aprendiendo.',
		'notes.empty': 'Todavía no hay notas aquí. ¡Pronto!',
		'projects.title': 'Proyectos',
		'projects.intro': 'Cosas que he hecho o en las que estoy trabajando.',
		'contact.title': 'Contacto',
		'contact.intro': '¿Quieres saludar? Me encuentras aquí:',
		'404.title': 'Página no encontrada',
		'404.text': 'Esta nutria buscó por todo el río y no encontró esta página.',
		'404.home': 'Volver al inicio',
	},
	en: {
		'site.title': 'And AnOtter Thing',
		'site.description': "Amelia's personal site: notes, math, stories and projects.",
		'nav.notes': 'Notes',
		'nav.projects': 'Projects',
		'nav.contact': 'Contact',
		'home.hello': "Hi! I'm Amelia",
		'home.tagline': 'And this is another thing: my corner of the internet for math, stories and projects.',
		'home.about':
			'Nowadays I live on Planet Earth, with plans of moving soon. Some of my favourite things are otters, clouds, books and gardens. I am a student of engineering physics and mathematical engineering, both of which I love. I made this webpage to keep a record of the things I have done with my life.',
		'home.latestNotes': 'Latest notes',
		'home.allNotes': 'See all notes',
		'cookie.title': 'A cookie for you',
		'cookie.button': 'Pick up the cookie',
		'cookie.prompt': 'Click to pick it up.',
		'cookie.count': 'Cookies collected:',
		'notes.title': 'Notes',
		'notes.intro': "Stories, study notes and things I'm learning.",
		'notes.empty': 'No notes here yet. Soon!',
		'projects.title': 'Projects',
		'projects.intro': "Things I've made or am working on.",
		'contact.title': 'Contact',
		'contact.intro': 'Want to say hi? You can find me here:',
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
