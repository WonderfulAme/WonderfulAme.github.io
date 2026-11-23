// Teselaciones que no se repiten nunca. Cada una genera directamente un pedazo del plano
// centrado en (0, 0) que cubre un círculo de radio `radius`, con piezas de tamaño ~`side`.

type Pt = [number, number];
type Piece = { pts: Pt[]; color: number };

const PHI = (1 + Math.sqrt(5)) / 2;

/** Deja solo las piezas que tocan el círculo visible. */
const nearby = (pieces: Piece[], radius: number) =>
	pieces.filter((p) => p.pts.some(([x, y]) => Math.hypot(x, y) < radius));

// SECCION Penrose P2: cometas y dardos.
// Se empieza con 5 cometas alrededor del centro y se "desinfla" con la razón áurea: cada cometa se
// convierte en 2 cometas y 2 dardos más pequeños, y cada dardo en 1 cometa y 2 dardos.

export function penroseCometas(radius: number, side: number): Piece[] {
	const T = Math.PI / 5; // 36°
	type Tile = { kite: boolean; x: number; y: number; a: number; s: number };
	const steps = Math.max(1, Math.round(Math.log((radius * 1.3) / (side * 0.7)) / Math.log(PHI)));
	let tiles: Tile[] = [];
	for (let a = Math.PI / 2 + T; a < 3 * Math.PI; a += 2 * T) tiles.push({ kite: true, x: 0, y: 0, a, s: radius * 1.3 });

	for (let n = 0; n < steps; n++) {
		const next: Tile[] = [];
		for (const { kite, x, y, a, s: big } of tiles) {
			const s = big / PHI;
			const at = (ang: number) => [x + Math.cos(ang) * PHI * big, y - Math.sin(ang) * PHI * big];
			if (!kite) {
				next.push({ kite: true, x, y, a: a + 5 * T, s });
				for (const sg of [1, -1]) {
					const [nx, ny] = at(a - 4 * T * sg);
					next.push({ kite: false, x: nx, y: ny, a: a - 4 * T * sg, s });
				}
			} else {
				for (const sg of [1, -1]) {
					next.push({ kite: false, x, y, a: a - 4 * T * sg, s });
					const [nx, ny] = at(a - T * sg);
					next.push({ kite: true, x: nx, y: ny, a: a + 3 * T * sg, s });
				}
			}
		}
		// las piezas que salen repetidas de dos padres vecinos se cuentan una sola vez
		const seen = new Map<string, Tile>();
		for (const t of next) {
			const ang = Math.round(((((t.a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) * 1e4)) % 62832;
			seen.set(`${t.kite},${Math.round(t.x * 100)},${Math.round(t.y * 100)},${ang}`, t);
		}
		tiles = [...seen.values()];
	}

	const pieces = tiles.map(({ kite, x, y, a, s }) => {
		const dist = kite ? [PHI, PHI, PHI] : [-PHI, -1, -PHI];
		const pts: Pt[] = [[x, y]];
		let ang = a - T;
		for (const d of dist) {
			pts.push([x + d * s * Math.cos(ang), y - d * s * Math.sin(ang)]);
			ang += T;
		}
		return { pts, color: kite ? 0 : 1 };
	});
	return nearby(pieces, radius);
}

// SECCION Molinete (pinwheel) de Conway y Radin.
// Un triángulo rectángulo de catetos 1 y 2 se parte en 5 copias iguales, más pequeñas por √5.
// Como √5 no es una rotación "racional", los triángulos terminan apuntando en infinitas direcciones.

export function molinete(radius: number, side: number): Piece[] {
	// cada triángulo: [punta del cateto largo, ángulo recto, punta del cateto corto]
	type Tri = [Pt, Pt, Pt];
	const k = 2 * radius;
	let tris: (Tri & { c?: number })[] = [
		[[-k, -k / 2], [k, -k / 2], [k, k / 2]],
		[[k, k / 2], [-k, k / 2], [-k, -k / 2]],
	];
	const hyp = Math.sqrt(5) * k;
	const steps = Math.max(1, Math.round(Math.log(hyp / side) / Math.log(Math.sqrt(5))));
	let colors = [0, 1];
	for (let n = 0; n < steps; n++) {
		const next: Tri[] = [];
		const nextColors: number[] = [];
		for (const [A, B, C] of tris) {
			// u: cateto largo (de B a A), v: cateto corto (de B a C)
			const u: Pt = [A[0] - B[0], A[1] - B[1]];
			const v: Pt = [C[0] - B[0], C[1] - B[1]];
			const at = (a: number, b: number): Pt => [B[0] + a * u[0] + b * v[0], B[1] + a * u[1] + b * v[1]];
			const M = at(0.5, 0); // mitad del cateto largo
			const Q = at(0.1, 0.4);
			const R = at(0.6, 0.4); // sobre la hipotenusa
			const Pp = at(0.2, 0.8); // sobre la hipotenusa
			// 5 hijos: tres en espejo y dos sin espejo, por eso las direcciones se van mezclando
			const children: Tri[] = [[M, Q, B], [A, R, M], [B, Pp, C], [M, Q, Pp], [Pp, R, M]];
			children.forEach((child, i) => {
				// solo se siguen partiendo los triángulos que pueden quedar en pantalla
				if (child.some(([x, y]) => Math.hypot(x, y) < radius + hyp / Math.pow(Math.sqrt(5), n + 1))) {
					next.push(child);
					nextColors.push([0, 1, 2, 1, 0][i]);
				}
			});
		}
		tris = next;
		colors = nextColors;
	}
	return nearby(
		tris.map((t, i) => ({ pts: [...t], color: colors[i] })),
		radius,
	);
}

// SECCION Ammann–Beenker: cuadrados y rombos de 45°, con simetría de 8 puntas.
// Método de la multirrejilla de de Bruijn: 4 familias de rectas paralelas (a 0°, 45°, 90° y 135°);
// cada cruce de dos rectas se convierte en un rombo (o un cuadrado, si las rectas son perpendiculares).

export function ammannBeenker(radius: number, side: number): Piece[] {
	const N = 4;
	const e: Pt[] = Array.from({ length: N }, (_, j) => [Math.cos((j * Math.PI) / N), Math.sin((j * Math.PI) / N)]);
	const gamma = Array.from({ length: N }, () => Math.random());
	const R = radius / side + 2; // radio en unidades de lado
	const rho = R / 2 + 2; // los vértices quedan ~2 veces más lejos que el punto de la rejilla
	const dot = (p: Pt, q: Pt) => p[0] * q[0] + p[1] * q[1];
	const vertex = (K: number[]): Pt => [
		K.reduce((s, k, j) => s + k * e[j][0], 0) * side,
		K.reduce((s, k, j) => s + k * e[j][1], 0) * side,
	];

	const pieces: Piece[] = [];
	for (let r = 0; r < N; r++) {
		for (let s = r + 1; s < N; s++) {
			const det = e[r][0] * e[s][1] - e[r][1] * e[s][0];
			for (let kr = Math.floor(-rho + gamma[r]); kr <= Math.ceil(rho + gamma[r]); kr++) {
				for (let ks = Math.floor(-rho + gamma[s]); ks <= Math.ceil(rho + gamma[s]); ks++) {
					// punto donde se cruzan la recta kr de la familia r y la recta ks de la familia s
					const br = kr - gamma[r];
					const bs = ks - gamma[s];
					const x: Pt = [(br * e[s][1] - bs * e[r][1]) / det, (e[r][0] * bs - e[s][0] * br) / det];
					if (Math.hypot(...x) > rho) continue;
					const K = e.map((ej, j) => Math.floor(dot(x, ej) + gamma[j]));
					const corner = (dr: number, ds: number) => {
						const k = [...K];
						k[r] = kr - 1 + dr;
						k[s] = ks - 1 + ds;
						return vertex(k);
					};
					const pts = [corner(0, 0), corner(1, 0), corner(1, 1), corner(0, 1)];
					pieces.push({ pts, color: s - r === 2 ? 0 : 1 + (r % 2) });
				}
			}
		}
	}
	return nearby(pieces, radius);
}

// SECCION El sombrero ("hat"), el primer "einstein": una sola pieza que tesela el plano sin repetirse.
// Smith, Myers, Kaplan y Goodman-Strauss, "An aperiodic monotile" (2023).
//
/*!
 * La construcción de las metapiezas H, T, P y F está adaptada de hatviz (https://github.com/isohedral/hatviz).
 * El aviso de esta licencia también se publica con el sitio en public/licencias-terceros.txt:
 *
 * BSD 3-Clause License
 *
 * Copyright (c) 2023, Craig S. Kaplan
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * 3. Neither the name of the copyright holder nor the names of its
 *    contributors may be used to endorse or promote products derived from
 *    this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

type P = { x: number; y: number };
type M = number[]; // matriz afín [a, b, c, d, e, f]

const hr3 = 0.8660254037844386;
const ident: M = [1, 0, 0, 0, 1, 0];
const pt = (x: number, y: number): P => ({ x, y });
const hexPt = (x: number, y: number) => pt(x + 0.5 * y, hr3 * y);
const inv = (T: M): M => {
	const det = T[0] * T[4] - T[1] * T[3];
	return [T[4] / det, -T[1] / det, (T[1] * T[5] - T[2] * T[4]) / det, -T[3] / det, T[0] / det, (T[2] * T[3] - T[0] * T[5]) / det];
};
const mul = (A: M, B: M): M => [
	A[0] * B[0] + A[1] * B[3],
	A[0] * B[1] + A[1] * B[4],
	A[0] * B[2] + A[1] * B[5] + A[2],
	A[3] * B[0] + A[4] * B[3],
	A[3] * B[1] + A[4] * B[4],
	A[3] * B[2] + A[4] * B[5] + A[5],
];
const padd = (p: P, q: P) => pt(p.x + q.x, p.y + q.y);
const psub = (p: P, q: P) => pt(p.x - q.x, p.y - q.y);
const trot = (ang: number): M => [Math.cos(ang), -Math.sin(ang), 0, Math.sin(ang), Math.cos(ang), 0];
const ttrans = (tx: number, ty: number): M => [1, 0, tx, 0, 1, ty];
const rotAbout = (p: P, ang: number) => mul(ttrans(p.x, p.y), mul(trot(ang), ttrans(-p.x, -p.y)));
const transPt = (M: M, P: P) => pt(M[0] * P.x + M[1] * P.y + M[2], M[3] * P.x + M[4] * P.y + M[5]);
const matchSeg = (p: P, q: P): M => [q.x - p.x, p.y - q.y, p.x, q.y - p.y, q.x - p.x, p.y];
const matchTwo = (p1: P, q1: P, p2: P, q2: P) => mul(matchSeg(p2, q2), inv(matchSeg(p1, q1)));
function intersect(p1: P, q1: P, p2: P, q2: P) {
	const d = (q2.y - p2.y) * (q1.x - p1.x) - (q2.x - p2.x) * (q1.y - p1.y);
	const uA = ((q2.x - p2.x) * (p1.y - p2.y) - (q2.y - p2.y) * (p1.x - p2.x)) / d;
	return pt(p1.x + uA * (q1.x - p1.x), p1.y + uA * (q1.y - p1.y));
}

const hat_outline = [
	hexPt(0, 0), hexPt(-1, -1), hexPt(0, -2), hexPt(2, -2),
	hexPt(2, -1), hexPt(4, -2), hexPt(5, -1), hexPt(4, 0),
	hexPt(3, 0), hexPt(2, 2), hexPt(0, 3), hexPt(0, 2),
	hexPt(-1, 2),
];

class HatTile {
	label: string;
	constructor(label: string) {
		this.label = label;
	}
	collect(T: M, out: { T: M; label: string }[]) {
		out.push({ T, label: this.label });
	}
}

class MetaTile {
	children: { T: M; geom: HatTile | MetaTile }[] = [];
	shape: P[];
	width: number;
	constructor(shape: P[], width: number) {
		this.shape = shape;
		this.width = width;
	}
	addChild(T: M, geom: HatTile | MetaTile) {
		this.children.push({ T, geom });
	}
	evalChild(n: number, i: number) {
		return transPt(this.children[n].T, (this.children[n].geom as MetaTile).shape[i]);
	}
	recentre() {
		let cx = 0;
		let cy = 0;
		for (const p of this.shape) {
			cx += p.x;
			cy += p.y;
		}
		cx /= this.shape.length;
		cy /= this.shape.length;
		const tr = pt(-cx, -cy);
		for (let idx = 0; idx < this.shape.length; ++idx) this.shape[idx] = padd(this.shape[idx], tr);
		const M = ttrans(-cx, -cy);
		for (const ch of this.children) ch.T = mul(M, ch.T);
	}
	collect(T: M, out: { T: M; label: string }[]) {
		for (const g of this.children) g.geom.collect(mul(T, g.T), out);
	}
}

function hatInit() {
	const H1_hat = new HatTile('H1');
	const H_hat = new HatTile('H');
	const T_hat = new HatTile('T');
	const P_hat = new HatTile('P');
	const F_hat = new HatTile('F');

	const H_outline = [pt(0, 0), pt(4, 0), pt(4.5, hr3), pt(2.5, 5 * hr3), pt(1.5, 5 * hr3), pt(-0.5, hr3)];
	const H = new MetaTile(H_outline, 2);
	H.addChild(matchTwo(hat_outline[5], hat_outline[7], H_outline[5], H_outline[0]), H_hat);
	H.addChild(matchTwo(hat_outline[9], hat_outline[11], H_outline[1], H_outline[2]), H_hat);
	H.addChild(matchTwo(hat_outline[5], hat_outline[7], H_outline[3], H_outline[4]), H_hat);
	H.addChild(mul(ttrans(2.5, hr3), mul([-0.5, -hr3, 0, hr3, -0.5, 0], [0.5, 0, 0, 0, -0.5, 0])), H1_hat);

	const T = new MetaTile([pt(0, 0), pt(3, 0), pt(1.5, 3 * hr3)], 2);
	T.addChild([0.5, 0, 0.5, 0, 0.5, hr3], T_hat);

	const P = new MetaTile([pt(0, 0), pt(4, 0), pt(3, 2 * hr3), pt(-1, 2 * hr3)], 2);
	P.addChild([0.5, 0, 1.5, 0, 0.5, hr3], P_hat);
	P.addChild(mul(ttrans(0, 2 * hr3), mul([0.5, hr3, 0, -hr3, 0.5, 0], [0.5, 0.0, 0.0, 0.0, 0.5, 0.0])), P_hat);

	const F = new MetaTile([pt(0, 0), pt(3, 0), pt(3.5, hr3), pt(3, 2 * hr3), pt(-1, 2 * hr3)], 2);
	F.addChild([0.5, 0, 1.5, 0, 0.5, hr3], F_hat);
	F.addChild(mul(ttrans(0, 2 * hr3), mul([0.5, hr3, 0, -hr3, 0.5, 0], [0.5, 0.0, 0.0, 0.0, 0.5, 0.0])), F_hat);

	return [H, T, P, F];
}

function constructPatch(H: MetaTile, T: MetaTile, P: MetaTile, F: MetaTile) {
	const rules: (string | number)[][] = [
		['H'],
		[0, 0, 'P', 2],
		[1, 0, 'H', 2],
		[2, 0, 'P', 2],
		[3, 0, 'H', 2],
		[4, 4, 'P', 2],
		[0, 4, 'F', 3],
		[2, 4, 'F', 3],
		[4, 1, 3, 2, 'F', 0],
		[8, 3, 'H', 0],
		[9, 2, 'P', 0],
		[10, 2, 'H', 0],
		[11, 4, 'P', 2],
		[12, 0, 'H', 2],
		[13, 0, 'F', 3],
		[14, 2, 'F', 1],
		[15, 3, 'H', 4],
		[8, 2, 'F', 1],
		[17, 3, 'H', 0],
		[18, 2, 'P', 0],
		[19, 2, 'H', 2],
		[20, 4, 'F', 3],
		[20, 0, 'P', 2],
		[22, 0, 'H', 2],
		[23, 4, 'F', 3],
		[23, 0, 'F', 3],
		[16, 0, 'P', 2],
		[9, 4, 0, 2, 'T', 2],
		[4, 0, 'F', 3],
	];
	const ret = new MetaTile([], H.width);
	const shapes: Record<string, MetaTile> = { H, T, P, F };
	const shapeOf = (n: number) => (ret.children[n].geom as MetaTile).shape;

	for (const r of rules) {
		if (r.length === 1) {
			ret.addChild(ident, shapes[r[0] as string]);
		} else if (r.length === 4) {
			const poly = shapeOf(r[0] as number);
			const Tm = ret.children[r[0] as number].T;
			const Pp = transPt(Tm, poly[((r[1] as number) + 1) % poly.length]);
			const Q = transPt(Tm, poly[r[1] as number]);
			const nshp = shapes[r[2] as string];
			const npoly = nshp.shape;
			ret.addChild(matchTwo(npoly[r[3] as number], npoly[((r[3] as number) + 1) % npoly.length], Pp, Q), nshp);
		} else {
			const chP = ret.children[r[0] as number];
			const chQ = ret.children[r[2] as number];
			const Pp = transPt(chQ.T, (chQ.geom as MetaTile).shape[r[3] as number]);
			const Q = transPt(chP.T, (chP.geom as MetaTile).shape[r[1] as number]);
			const nshp = shapes[r[4] as string];
			const npoly = nshp.shape;
			ret.addChild(matchTwo(npoly[r[5] as number], npoly[((r[5] as number) + 1) % npoly.length], Pp, Q), nshp);
		}
	}
	return ret;
}

function constructMetatiles(patch: MetaTile) {
	const PI = Math.PI;
	const bps1 = patch.evalChild(8, 2);
	const bps2 = patch.evalChild(21, 2);
	const rbps = transPt(rotAbout(bps1, (-2.0 * PI) / 3.0), bps2);

	const p72 = patch.evalChild(7, 2);
	const p252 = patch.evalChild(25, 2);

	const llc = intersect(bps1, rbps, patch.evalChild(6, 2), p72);
	let w = psub(patch.evalChild(6, 2), llc);

	const new_H_outline = [llc, bps1];
	w = transPt(trot(-PI / 3), w);
	new_H_outline.push(padd(new_H_outline[1], w));
	new_H_outline.push(patch.evalChild(14, 2));
	w = transPt(trot(-PI / 3), w);
	new_H_outline.push(psub(new_H_outline[3], w));
	new_H_outline.push(patch.evalChild(6, 2));

	const new_H = new MetaTile(new_H_outline, patch.width * 2);
	for (const ch of [0, 9, 16, 27, 26, 6, 1, 8, 10, 15]) new_H.addChild(patch.children[ch].T, patch.children[ch].geom);

	const new_P_outline = [p72, padd(p72, psub(bps1, llc)), bps1, llc];
	const new_P = new MetaTile(new_P_outline, patch.width * 2);
	for (const ch of [7, 2, 3, 4, 28]) new_P.addChild(patch.children[ch].T, patch.children[ch].geom);

	const new_F_outline = [bps2, patch.evalChild(24, 2), patch.evalChild(25, 0), p252, padd(p252, psub(llc, bps1))];
	const new_F = new MetaTile(new_F_outline, patch.width * 2);
	for (const ch of [21, 20, 22, 23, 24, 25]) new_F.addChild(patch.children[ch].T, patch.children[ch].geom);

	const AAA = new_H_outline[2];
	const BBB = padd(new_H_outline[1], psub(new_H_outline[4], new_H_outline[5]));
	const CCC = transPt(rotAbout(BBB, -PI / 3), AAA);
	const new_T_outline = [BBB, CCC, AAA];
	const new_T = new MetaTile(new_T_outline, patch.width * 2);
	new_T.addChild(patch.children[11].T, patch.children[11].geom);

	new_H.recentre();
	new_P.recentre();
	new_F.recentre();
	new_T.recentre();

	return [new_H, new_T, new_P, new_F];
}
// (fin del código adaptado de hatviz)

const HAT_AREA = (() => {
	let a = 0;
	for (let k = 0; k < hat_outline.length; k++) {
		const p = hat_outline[k];
		const q = hat_outline[(k + 1) % hat_outline.length];
		a += p.x * q.y - q.x * p.y;
	}
	return Math.abs(a) / 2;
})();

export function sombrero(radius: number, side: number): Piece[] {
	const scale = side / Math.sqrt(HAT_AREA);
	const need = (radius / scale) * 1.3 + 6; // radio a cubrir, en unidades del sombrero (con margen)
	let tiles = hatInit();
	let hats: { T: M; label: string }[] = [];

	// cada nivel junta las metapiezas en metapiezas más grandes, hasta que el pedazo cubre la pantalla
	for (let level = 0; level < 8; level++) {
		const patch = constructPatch(tiles[0], tiles[1], tiles[2], tiles[3]);
		hats = [];
		patch.collect(ident, hats);
		const centers = hats.map(({ T }) => transPt(T, pt(1.5, hr3)));
		const cx = centers.reduce((s, p) => s + p.x, 0) / centers.length;
		const cy = centers.reduce((s, p) => s + p.y, 0) / centers.length;
		// qué tan lejos llega el pedazo en la dirección donde menos llega
		let reach = Infinity;
		for (let d = 0; d < 36; d++) {
			const ang = (d * Math.PI) / 18;
			let best = 0;
			for (const c of centers) {
				const dx = c.x - cx;
				const dy = c.y - cy;
				const dist = Math.hypot(dx, dy);
				if (dist > 0 && Math.cos(Math.atan2(dy, dx) - ang) > 0.985) best = Math.max(best, dist);
			}
			reach = Math.min(reach, best);
		}
		if (reach > need) {
			const colorOf: Record<string, number> = { H1: 1, H: 0, T: 2, P: 0, F: 2 };
			const pieces = hats.map(({ T, label }) => ({
				pts: hat_outline.map((p) => {
					const q = transPt(T, p);
					return [(q.x - cx) * scale, (q.y - cy) * scale] as Pt;
				}),
				color: colorOf[label],
			}));
			return nearby(pieces, radius);
		}
		tiles = constructMetatiles(patch);
	}
	return [];
}
