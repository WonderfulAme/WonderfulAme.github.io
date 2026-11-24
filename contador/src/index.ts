// Contador de galletas compartido por todos los visitantes de la página.
//   GET  /galletas  -> { "total": 312 }
//   POST /galletas  -> suma una galleta y devuelve el total nuevo
// El número vive en un Durable Object, que atiende las peticiones de una en una:
// si dos personas hacen clic al mismo tiempo, se cuentan las dos.

import { DurableObject } from 'cloudflare:workers';

interface Env {
	CONTADOR: DurableObjectNamespace<Contador>;
}

// Páginas que pueden usar el contador (la publicada y la de prueba en tu computador)
const ORIGENES = ['https://wonderfulame.github.io', 'http://localhost:4321'];

export class Contador extends DurableObject<Env> {
	async leer(): Promise<number> {
		return (await this.ctx.storage.get<number>('total')) ?? 0;
	}

	async sumar(): Promise<number> {
		const total = (await this.leer()) + 1;
		await this.ctx.storage.put('total', total);
		return total;
	}
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const origin = request.headers.get('Origin') ?? '';
		const headers: Record<string, string> = {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
			Vary: 'Origin',
		};
		if (ORIGENES.includes(origin)) headers['Access-Control-Allow-Origin'] = origin;

		if (request.method === 'OPTIONS') return new Response(null, { headers });

		const { pathname } = new URL(request.url);
		if (pathname !== '/galletas') return new Response('{"error":"no existe"}', { status: 404, headers });

		const contador = env.CONTADOR.get(env.CONTADOR.idFromName('galletas'));
		if (request.method === 'GET') return Response.json({ total: await contador.leer() }, { headers });
		if (request.method === 'POST') return Response.json({ total: await contador.sumar() }, { headers });
		return new Response('{"error":"método no permitido"}', { status: 405, headers });
	},
};
