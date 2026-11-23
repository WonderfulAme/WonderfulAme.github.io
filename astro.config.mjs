// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeInicial from './src/lib/rehype-inicial.mjs';

// https://astro.build/config
export default defineConfig({
	site: 'https://wonderfulame.github.io',
	markdown: {
		processor: unified({
			// Math in Markdown: write $x^2$ inline or $$\sum_{n=1}^\infty \frac{1}{n^2}$$ as a block.
			remarkPlugins: [remarkMath],
			// rehypeInicial: the big decorated first letter of each note.
			rehypePlugins: [rehypeKatex, rehypeInicial],
		}),
	},
});
