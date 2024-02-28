import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	ssr: {
		noExternal: ['three']
	},
	build: {
		minify: false
	},
	optimizeDeps: {
		exclude: ['three']
	}
});
