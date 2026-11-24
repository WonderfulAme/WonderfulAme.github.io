// Wraps the first letter of each note's first paragraph in <span class="inicial">,
// so it can be drawn as a big decorated initial (see .inicial in global.css).
// Opening punctuation like ¡ ¿ « " goes inside the box, drawn small.
// Short first paragraphs (like "Por completar.") don't get one: the initial needs text to wrap around it.

const START = /^([\s¡¿«"“'‘(—–-]*)(\p{L})/u;
const MIN_LENGTH = 80;

const textOf = (node) => (node.type === 'text' ? node.value : (node.children ?? []).map(textOf).join(''));

function firstText(node) {
	for (const child of node.children ?? []) {
		if (child.type === 'text' && child.value.trim()) return { parent: node, node: child };
		if (child.type === 'element') {
			const found = firstText(child);
			if (found) return found;
		}
	}
	return null;
}

export default function rehypeInicial() {
	return (tree) => {
		const paragraph = tree.children.find((n) => n.type === 'element' && n.tagName === 'p');
		if (!paragraph || textOf(paragraph).length < MIN_LENGTH) return;
		const found = firstText(paragraph);
		if (!found) return;

		const match = found.node.value.match(START);
		if (!match) return;
		const [whole, before, letter] = match;

		// Opening punctuation (¡ ¿ « …) goes inside the box, small, before the letter.
		const sign = before.trim();
		const inside = [{ type: 'text', value: letter }];
		if (sign) {
			inside.unshift({
				type: 'element',
				tagName: 'span',
				properties: { className: ['inicial-signo'] },
				children: [{ type: 'text', value: sign }],
			});
		}
		const pieces = [{ type: 'element', tagName: 'span', properties: { className: ['inicial'] }, children: inside }];
		pieces.push({ type: 'text', value: found.node.value.slice(whole.length) });

		const siblings = found.parent.children;
		siblings.splice(siblings.indexOf(found.node), 1, ...pieces);
	};
}
