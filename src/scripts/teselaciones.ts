// Fondo: una teselación del plano euclidiano, escogida al azar cada vez que se carga la página
// (forma, colores, tamaño y ángulo). Se dibuja como un SVG fijo detrás de la hoja.
// Las formas están en teselaciones-geometria.ts.
// Para ver una en particular: agrega ?teselacion=N a la dirección (N del 0 al 27),
// y ?tamano=N para escoger el tamaño (ej: /es/?teselacion=18&tamano=200).

import { TESELACIONES, scaled } from './teselaciones-geometria.ts';

const pick = <T,>(list: T[]): T => list[Math.floor(Math.random() * list.length)];
const between = (min: number, max: number) => min + Math.random() * (max - min);

// SECCION Tamaño: lado aproximado de cada pieza en px. A veces sale gigante.
const GRANDE: [number, number] = [70, 130];
const GIGANTE: [number, number] = [130, 190];
const PROBABILIDAD_GIGANTE = 0.3;

// SECCION Colores: mezclas suaves de la paleta, para que el fondo no le robe atención al texto.
const PALETA = {
	pergamino: '#f3ead3',
	papel: '#fbf6e9',
	ocre: '#b8935a',
	rosa: '#d98c96',
	azul: '#8fb3d9',
	musgo: '#4a5d3a',
	agua: '#2c7268',
	hongo: '#a8352f',
};

function mix(c1: string, c2: string, t: number) {
	const n = (c: string, k: number) => parseInt(c.slice(1 + 2 * k, 3 + 2 * k), 16);
	const ch = (k: number) => Math.round(n(c1, k) * t + n(c2, k) * (1 - t)).toString(16).padStart(2, '0');
	return `#${ch(0)}${ch(1)}${ch(2)}`;
}

function palette(dark: boolean): string[] {
	const p = PALETA;
	const [c1, c2] = pick([
		[p.ocre, p.rosa],
		[p.azul, p.agua],
		[p.rosa, p.azul],
		[p.agua, p.musgo],
		[p.musgo, p.ocre],
		[p.hongo, p.ocre],
		[p.azul, p.ocre],
	]);
	const shuffle = (list: string[]) => list.sort(() => Math.random() - 0.5);
	if (dark) {
		const base = '#221d16';
		return shuffle([mix(p.papel, base, 0.07), mix(c1, base, 0.3), mix(c2, base, 0.22)]);
	}
	const base = pick([p.pergamino, p.papel]);
	return shuffle([base, mix(c1, base, 0.35), mix(c2, base, 0.25)]);
}

// SECCION Dibujo
const params = new URLSearchParams(location.search);
const forced = params.has('teselacion') ? TESELACIONES[Number(params.get('teselacion'))] : undefined;
const base = forced ?? pick(TESELACIONES);
// ?tamano=N fuerza el lado de las piezas en px (útil para probar)
const side = params.has('tamano')
	? Number(params.get('tamano'))
	: Math.random() < PROBABILIDAD_GIGANTE
		? between(...GIGANTE)
		: between(...GRANDE);
const tiling = 'patch' in base ? null : scaled(base, side * side);
// Penrose tiene un centro con simetría de estrella; lo ponemos en un lugar al azar de la pantalla
const patchCenter = [0.15 + Math.random() * 0.7, 0.15 + Math.random() * 0.7];
const dark = matchMedia('(prefers-color-scheme: dark)').matches;
const colors = palette(dark);
const angle = pick([0, 0, 15, 30, 45, 60, 90]);

const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
svg.setAttribute('aria-hidden', 'true');
svg.classList.add('teselacion');
document.body.prepend(svg);

function draw() {
	const W = innerWidth;
	const H = innerHeight;
	const paths = colors.map(() => [] as string[]);
	const toPath = (pts: [number, number][], ox: number, oy: number) =>
		pts.map(([x, y], k) => `${k ? 'L' : 'M'}${(ox + x).toFixed(1)} ${(oy + y).toFixed(1)}`).join('') + 'Z';

	let cx = W / 2;
	let cy = H / 2;
	if (!tiling && 'patch' in base) {
		// teselación que no se repite: se genera un pedazo que cubre toda la pantalla
		cx = W * patchCenter[0];
		cy = H * patchCenter[1];
		const far = Math.max(Math.hypot(cx, cy), Math.hypot(W - cx, cy), Math.hypot(cx, H - cy), Math.hypot(W - cx, H - cy));
		for (const tile of base.patch(far / Math.cos(Math.PI / 10) + side, side)) {
			paths[tile.color % colors.length].push(toPath(tile.pts, cx, cy));
		}
	}
	const { a, b, tiles } = tiling ?? { a: [1, 0] as [number, number], b: [0, 1] as [number, number], tiles: [] };
	const cellSize = Math.max(Math.hypot(...a), Math.hypot(...b));
	const R = Math.hypot(W, H) / 2 + cellSize * 2;
	const N = tiling ? Math.ceil((2 * R) / Math.min(Math.hypot(...a), Math.hypot(...b))) + 2 : -1;

	for (let i = -N; i <= N; i++) {
		for (let j = -N; j <= N; j++) {
			const ox = i * a[0] + j * b[0];
			const oy = i * a[1] + j * b[1];
			if (Math.hypot(ox, oy) > R) continue;
			for (const tile of tiles) {
				const color = typeof tile.color === 'function' ? tile.color(i, j) : tile.color;
				paths[color % colors.length].push(toPath(tile.pts, cx + ox, cy + oy));
			}
		}
	}

	const stroke = dark ? 'rgba(0,0,0,0.35)' : 'rgba(108,87,50,0.18)';
	svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
	svg.innerHTML = `<rect width="${W}" height="${H}" fill="${colors[0]}"/><g transform="rotate(${angle} ${cx} ${cy})" stroke="${stroke}" stroke-width="1.2" stroke-linejoin="round">${paths
		.map((p, k) => `<path fill="${colors[k]}" d="${p.join('')}"/>`)
		.join('')}</g>`;
}

draw();
let timer: number | undefined;
addEventListener('resize', () => {
	clearTimeout(timer);
	timer = window.setTimeout(draw, 150);
});

// Nombre de la teselación al pie de la página
const label = document.getElementById('teselacion');
if (label) {
	const en = document.documentElement.lang === 'en';
	label.textContent = (en ? 'Tiling: ' : 'Teselación: ') + (en ? base.en : base.es);
}
