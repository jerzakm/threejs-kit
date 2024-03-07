import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

const viteHeaderPlugin = {
	name: 'add headers',
	configureServer: (server) => {
		server.middlewares.use((req, res, next) => {
			res.setHeader('Access-Control-Allow-Origin', '*');
			res.setHeader('Access-Control-Allow-Methods', 'GET');
			res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
			res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
			next();
		});
	}
};

export default defineConfig({
	plugins: [viteHeaderPlugin, sveltekit()],
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
