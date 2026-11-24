// Geometría de las teselaciones del plano euclidiano.
// Cada teselación es una celda (unos polígonos) que se repite trasladándola con los vectores a y b.
// Todas se construyen con lado 1; el dibujo las escala después.

import { penroseCometas, molinete, ammannBeenker, sombrero } from './teselaciones-aperiodicas.ts';

export type Pt = [number, number];
export type Tile = { pts: Pt[]; color: number | ((i: number, j: number) => number) };
export type Tiling = { es: string; en: string; a: Pt; b: Pt; tiles: Tile[] };
/** Teselación que no se repite (como Penrose): se genera directamente un pedazo de radio `radius`. */
export type Patch = { es: string; en: string; patch: (radius: number, side: number) => { pts: Pt[]; color: number }[] };

const R3 = Math.sqrt(3);
const h = R3 / 2; // altura de un triángulo equilátero de lado 1

export const mod = (n: number, m: number) => ((n % m) + m) % m;
const rad = (d: number) => (d * Math.PI) / 180;
const add = (p: Pt, q: Pt): Pt => [p[0] + q[0], p[1] + q[1]];
const polar = (r: number, deg: number, c: Pt = [0, 0]): Pt => [c[0] + r * Math.cos(rad(deg)), c[1] + r * Math.sin(rad(deg))];
const rotate = (pts: Pt[], deg: number): Pt[] =>
	pts.map(([x, y]) => [x * Math.cos(rad(deg)) - y * Math.sin(rad(deg)), x * Math.sin(rad(deg)) + y * Math.cos(rad(deg))]);
/** Polígono regular de n lados con radio r, primer vértice en el ángulo startDeg, centrado en c. */
const ngon = (n: number, r: number, startDeg: number, c: Pt = [0, 0]): Pt[] =>
	Array.from({ length: n }, (_, k) => polar(r, startDeg + (360 * k) / n, c));
/** Radio de un polígono regular de n lados con lado 1. */
const circumradius = (n: number) => 1 / (2 * Math.sin(Math.PI / n));

export const area = (pts: Pt[]) =>
	Math.abs(pts.reduce((s, [x, y], k) => s + x * pts[(k + 1) % pts.length][1] - pts[(k + 1) % pts.length][0] * y, 0)) / 2;
export const centroid = (pts: Pt[]): Pt => [
	pts.reduce((s, p) => s + p[0], 0) / pts.length,
	pts.reduce((s, p) => s + p[1], 0) / pts.length,
];

/** Coordenadas de p en la base (a, b). */
function toLattice(p: Pt, a: Pt, b: Pt): Pt {
	const det = a[0] * b[1] - a[1] * b[0];
	return [(p[0] * b[1] - p[1] * b[0]) / det, (a[0] * p[1] - a[1] * p[0]) / det];
}
const frac = (x: number) => {
	const f = x - Math.floor(x + 1e-7);
	return f > 1 - 1e-7 ? 0 : f;
};

/** De una lista grande de polígonos, deja solo los que caen en la celda (para teselaciones construidas a partir de una malla). */
function inCell(tiles: Tile[], a: Pt, b: Pt): Tile[] {
	return tiles.filter((t) => {
		const [u, v] = toLattice(centroid(t.pts), a, b);
		return u >= -1e-7 && u < 1 - 1e-7 && v >= -1e-7 && v < 1 - 1e-7;
	});
}

/**
 * Teselación dual: un vértice nuevo en el centro de cada cara, y una cara nueva alrededor de cada vértice viejo.
 * Así salen las 8 teselaciones de Laves a partir de las 8 arquimedianas.
 */
function dual(t: Tiling, es: string, en: string): Tiling {
	const { a, b } = t;
	const classes: Pt[] = [];
	for (const tile of t.tiles) {
		for (const p of tile.pts) {
			const [u, v] = toLattice(p, a, b).map(frac) as Pt;
			const seen = classes.some(([u2, v2]) => {
				const du = Math.abs(u - u2);
				const dv = Math.abs(v - v2);
				return Math.min(du, 1 - du) < 1e-6 && Math.min(dv, 1 - dv) < 1e-6;
			});
			if (!seen) classes.push([u, v]);
		}
	}
	const faces: Pt[][] = [];
	for (let i = -2; i <= 2; i++)
		for (let j = -2; j <= 2; j++)
			for (const tile of t.tiles) faces.push(tile.pts.map(([x, y]) => [x + i * a[0] + j * b[0], y + i * a[1] + j * b[1]]));

	const tiles = classes.map(([u, v], k) => {
		const vertex: Pt = [u * a[0] + v * b[0], u * a[1] + v * b[1]];
		const around = faces
			.filter((f) => f.some((p) => Math.hypot(p[0] - vertex[0], p[1] - vertex[1]) < 1e-6))
			.map(centroid)
			.sort((p, q) => Math.atan2(p[1] - vertex[1], p[0] - vertex[0]) - Math.atan2(q[1] - vertex[1], q[0] - vertex[0]));
		return { pts: around, color: k % 3 };
	});
	return { es, en, a, b, tiles };
}

// SECCION Regulares (3)

const square: Pt[] = [[0, 0], [1, 0], [1, 1], [0, 1]];

const cuadrada: Tiling = {
	es: 'Cuadrada',
	en: 'Square',
	a: [1, 0],
	b: [0, 1],
	tiles: [{ pts: square, color: (i, j) => mod(i + j, 2) }],
};

const triangular: Tiling = {
	es: 'Triangular',
	en: 'Triangular',
	a: [1, 0],
	b: [0.5, h],
	tiles: [
		{ pts: [[0, 0], [1, 0], [0.5, h]], color: 0 },
		{ pts: [[1, 0], [1.5, h], [0.5, h]], color: 1 },
	],
};

const hexagonal: Tiling = {
	es: 'Hexagonal',
	en: 'Hexagonal',
	a: [R3, 0],
	b: [R3 / 2, 1.5],
	tiles: [{ pts: ngon(6, 1, 30), color: (i, j) => mod(i - j, 3) }],
};

// SECCION Arquimedianas (8)

const trihexagonal: Tiling = {
	es: 'Trihexagonal',
	en: 'Trihexagonal',
	a: [2, 0],
	b: [1, R3],
	tiles: [
		{ pts: ngon(6, 1, 0), color: 0 },
		{ pts: [[1, 0], [0.5, h], [1.5, h]], color: 1 },
		{ pts: [[1, 0], [1.5, -h], [0.5, -h]], color: 2 },
	],
};

const L488 = 1 + Math.SQRT2;
const cuadradaTruncada: Tiling = {
	es: 'Cuadrada truncada',
	en: 'Truncated square',
	a: [L488, 0],
	b: [0, L488],
	tiles: [
		{ pts: ngon(8, circumradius(8), 22.5), color: 0 },
		{ pts: [[L488 / 2, 0.5], [L488 - 0.5, L488 / 2], [L488 / 2, L488 - 0.5], [0.5, L488 / 2]], color: 1 },
	],
};

// hexágonos en una malla triangular, separados por cuadrados; triángulos en los huecos
const D3464 = 1 + R3;
const sq3464: Pt[] = [[h, -0.5], [h + 1, -0.5], [h + 1, 0.5], [h, 0.5]];
const rombitrihexagonal: Tiling = {
	es: 'Rombitrihexagonal',
	en: 'Rhombitrihexagonal',
	a: [D3464, 0],
	b: [D3464 / 2, (D3464 * R3) / 2],
	tiles: [
		{ pts: ngon(6, 1, 30), color: 0 },
		{ pts: sq3464, color: 1 },
		{ pts: rotate(sq3464, 60), color: 1 },
		{ pts: rotate(sq3464, 120), color: 1 },
		{ pts: [[h, 0.5], [h + 1, 0.5], [h + 0.5, 0.5 + h]], color: 2 },
		{ pts: [[h, -0.5], [h + 0.5, -0.5 - h], [h + 1, -0.5]], color: 2 },
	],
};

// dodecágonos separados por cuadrados; hexágonos en los huecos
const ap12 = (2 + R3) / 2; // apotema del dodecágono de lado 1
const D4612 = 3 + R3;
const sq4612: Pt[] = [[ap12, -0.5], [ap12 + 1, -0.5], [ap12 + 1, 0.5], [ap12, 0.5]];
const trihexagonalTruncada: Tiling = {
	es: 'Trihexagonal truncada',
	en: 'Truncated trihexagonal',
	a: [D4612, 0],
	b: [D4612 / 2, (D4612 * R3) / 2],
	tiles: [
		{ pts: ngon(12, circumradius(12), 15), color: 0 },
		{ pts: sq4612, color: 1 },
		{ pts: rotate(sq4612, 60), color: 1 },
		{ pts: rotate(sq4612, 120), color: 1 },
		{ pts: ngon(6, 1, 0, [D4612 / 2, 0.5 + h]), color: 2 },
		{ pts: ngon(6, 1, 0, [D4612 / 2, -0.5 - h]), color: 2 },
	],
};

// dodecágonos que se tocan por un lado; triángulos en los huecos
const D31212 = 2 + R3;
const hexagonalTruncada: Tiling = {
	es: 'Hexagonal truncada',
	en: 'Truncated hexagonal',
	a: [D31212, 0],
	b: [D31212 / 2, (D31212 * R3) / 2],
	tiles: [
		{ pts: ngon(12, circumradius(12), 15), color: 0 },
		{ pts: ngon(3, 1 / R3, 30, [D31212 / 2, (D31212 * R3) / 6]), color: 1 },
		{ pts: ngon(3, 1 / R3, -30, [D31212 / 2, -(D31212 * R3) / 6]), color: 2 },
	],
};

// la malla triangular, juntando en hexágonos los 6 triángulos alrededor de 1 de cada 7 puntos
function hexagonalAchatadaTiles(): Tiling {
	const e1: Pt = [1, 0];
	const e2: Pt = [0.5, h];
	const at = (m: number, n: number): Pt => [m * e1[0] + n * e2[0], m * e1[1] + n * e2[1]];
	const center = (m: number, n: number) => mod(3 * m + n, 7) === 0;
	const a: Pt = at(2, 1);
	const b: Pt = at(-1, 3);
	const all: Tile[] = [];
	for (let m = -8; m <= 8; m++) {
		for (let n = -8; n <= 8; n++) {
			if (center(m, n)) all.push({ pts: ngon(6, 1, 0, at(m, n)), color: 0 });
			if (!center(m, n) && !center(m + 1, n) && !center(m, n + 1))
				all.push({ pts: [at(m, n), at(m + 1, n), at(m, n + 1)], color: 1 });
			if (!center(m + 1, n) && !center(m + 1, n + 1) && !center(m, n + 1))
				all.push({ pts: [at(m + 1, n), at(m + 1, n + 1), at(m, n + 1)], color: 2 });
		}
	}
	return { es: 'Hexagonal achatada', en: 'Snub hexagonal', a, b, tiles: inCell(all, a, b) };
}
const hexagonalAchatada = hexagonalAchatadaTiles();

// cuadrados girados ±15°, con triángulos entre ellos
const rSq = 1 / Math.SQRT2;
const LSnub = Math.sqrt(2 + R3);
const cB: Pt = [LSnub / 2, LSnub / 2];
const A = (deg: number) => polar(rSq, deg);
const B = (deg: number) => polar(rSq, deg, cB);
const cuadradaAchatada: Tiling = {
	es: 'Cuadrada achatada',
	en: 'Snub square',
	a: [LSnub, 0],
	b: [0, LSnub],
	tiles: [
		{ pts: ngon(4, rSq, 60), color: 0 },
		{ pts: ngon(4, rSq, 30, cB), color: 0 },
		{ pts: [A(60), A(330), B(300)], color: 1 },
		{ pts: [A(330), add(A(240), [LSnub, 0]), B(300)], color: 2 },
		{ pts: [A(60), B(120), add(A(240), [0, LSnub])], color: 2 },
		{ pts: [A(150), A(60), add(A(240), [0, LSnub])], color: 1 },
	],
};

// SECCION Otras

const espiga: Tiling = {
	es: 'Espiga',
	en: 'Herringbone',
	a: [1, 1],
	b: [2, -2],
	tiles: [
		{ pts: [[0, 0], [2, 0], [2, 1], [0, 1]], color: 0 },
		{ pts: [[2, -1], [3, -1], [3, 1], [2, 1]], color: 1 },
	],
};

const cesteria: Tiling = {
	es: 'Cestería',
	en: 'Basketweave',
	a: [2, 0],
	b: [1, 1],
	tiles: [
		{ pts: [[0, 0], [1, 0], [1, 0.5], [0, 0.5]], color: 0 },
		{ pts: [[0, 0.5], [1, 0.5], [1, 1], [0, 1]], color: 1 },
		{ pts: [[1, 0], [1.5, 0], [1.5, 1], [1, 1]], color: 2 },
		{ pts: [[1.5, 0], [2, 0], [2, 1], [1.5, 1]], color: 0 },
	],
};

// SECCION Pentágonos: de los 15 tipos de pentágonos convexos que teselan el plano, aquí están los tipos 1 a 5
// (la pentagonal del Cairo es tipo 2 y 4, y la florida es tipo 5).

// hexágono regular (vértices V, puntos medios de los lados M) en su malla
const V = ngon(6, 1, 0);
const M = V.map((p, k): Pt => [(p[0] + V[(k + 1) % 6][0]) / 2, (p[1] + V[(k + 1) % 6][1]) / 2]);
const hexA: Pt = polar(R3, 30);
const hexB: Pt = [0, R3];

const hexagonosEnDos: Tiling = {
	es: 'Hexágonos partidos en dos',
	en: 'Hexagons cut in two',
	a: hexA,
	b: hexB,
	tiles: [
		{ pts: [M[0], V[1], V[2], V[3], M[3]], color: 0 },
		{ pts: [M[3], V[4], V[5], V[0], M[0]], color: (i) => 1 + mod(i, 2) },
	],
};

const hexagonosEnTres: Tiling = {
	es: 'Hexágonos partidos en tres',
	en: 'Hexagons cut in three',
	a: hexA,
	b: hexB,
	tiles: [
		{ pts: [[0, 0], M[0], V[1], V[2], M[2]], color: 0 },
		{ pts: [[0, 0], M[2], V[3], V[4], M[4]], color: 1 },
		{ pts: [[0, 0], M[4], V[5], V[0], M[0]], color: 2 },
	],
};

// SECCION Penrose: rombos gruesos y delgados que nunca se repiten.
// Se empieza con una estrella de 10 triángulos de Robinson y se subdivide con la razón áurea.

const PHI = (1 + Math.sqrt(5)) / 2;

function penroseRombos(radius: number, side: number) {
	type Tri = [number, Pt, Pt, Pt];
	const lerp = (p: Pt, q: Pt, t: number): Pt => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
	let tris: Tri[] = [];
	for (let k = 0; k < 10; k++) {
		let B = polar(radius, (2 * k - 1) * 18);
		let C = polar(radius, (2 * k + 1) * 18);
		if (k % 2 === 0) [B, C] = [C, B];
		tris.push([0, [0, 0], B, C]);
	}
	const steps = Math.max(1, Math.round(Math.log(radius / side) / Math.log(PHI)));
	for (let n = 0; n < steps; n++) {
		const next: Tri[] = [];
		for (const [color, A, B, C] of tris) {
			if (color === 0) {
				const P = lerp(A, B, 1 / PHI);
				next.push([0, C, P, B], [1, P, C, A]);
			} else {
				const Q = lerp(B, A, 1 / PHI);
				const R = lerp(B, C, 1 / PHI);
				next.push([1, R, C, A], [1, Q, R, B], [0, R, Q, A]);
			}
		}
		tris = next;
	}
	// cada rombo son dos triángulos del mismo color que comparten la base BC
	const key = (p: Pt, q: Pt) =>
		[p, q]
			.map(([x, y]) => `${Math.round(x * 10)},${Math.round(y * 10)}`)
			.sort()
			.join('|');
	const halves = new Map<string, Tri>();
	const out: { pts: Pt[]; color: number }[] = [];
	for (const tri of tris) {
		const [color, A, B, C] = tri;
		const k = color + ':' + key(B, C);
		const other = halves.get(k);
		if (other) {
			out.push({ pts: [A, B, other[1], C], color });
			halves.delete(k);
		} else halves.set(k, tri);
	}
	for (const [color, A, B, C] of halves.values()) out.push({ pts: [A, B, C], color });
	return out;
}

const penrose: Patch = {
	es: 'Penrose con rombos',
	en: 'Penrose rhombs',
	patch: penroseRombos,
};

// SECCION Todas: el número de cada una es el que se usa en ?teselacion=N

export const TESELACIONES: (Tiling | Patch)[] = [
	// regulares
	cuadrada,
	triangular,
	hexagonal,
	// arquimedianas
	trihexagonal,
	cuadradaTruncada,
	rombitrihexagonal,
	trihexagonalTruncada,
	hexagonalTruncada,
	hexagonalAchatada,
	cuadradaAchatada,
	// de Laves (duales de las arquimedianas)
	dual(trihexagonal, 'Rómbica', 'Rhombille'),
	dual(cuadradaTruncada, 'Tetrakis cuadrada', 'Tetrakis square'),
	dual(rombitrihexagonal, 'Deltoidal trihexagonal', 'Deltoidal trihexagonal'),
	dual(trihexagonalTruncada, 'Kisrómbica', 'Kisrhombille'),
	dual(hexagonalTruncada, 'Triakis triangular', 'Triakis triangular'),
	dual(hexagonalAchatada, 'Pentagonal florida', 'Floret pentagonal'),
	dual(cuadradaAchatada, 'Pentagonal del Cairo', 'Cairo pentagonal'),
	// otras
	espiga,
	cesteria,
	// pentágonos
	hexagonosEnDos,
	hexagonosEnTres,
	// aperiódicas: nunca se repiten
	penrose,
	{ es: 'Penrose con cometas y dardos', en: 'Penrose kites and darts', patch: penroseCometas },
	{ es: 'Molinete de Conway y Radin', en: 'Conway–Radin pinwheel', patch: molinete },
	{ es: 'Ammann–Beenker', en: 'Ammann–Beenker', patch: ammannBeenker },
	{ es: 'El sombrero', en: 'The hat', patch: sombrero },
];

/** Escala una teselación para que sus piezas midan, en promedio, `tileArea` px². */
export function scaled(t: Tiling, tileArea: number): Tiling {
	const avg = t.tiles.reduce((s, tile) => s + area(tile.pts), 0) / t.tiles.length;
	const k = Math.sqrt(tileArea / avg);
	const sc = (p: Pt): Pt => [p[0] * k, p[1] * k];
	return { ...t, a: sc(t.a), b: sc(t.b), tiles: t.tiles.map((tile) => ({ ...tile, pts: tile.pts.map(sc) })) };
}
