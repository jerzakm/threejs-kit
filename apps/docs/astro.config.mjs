import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import tailwind from '@astrojs/tailwind';
import svelte from '@astrojs/svelte';

const noExternal = ['three', 'troika-three-text', 'postprocessing']
if (process.env.NODE_ENV === 'production') {
  noExternal.push('@theatre/core')
}


// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      title: 'threejs-kit',
      social: {
        github: 'https://github.com/jerzakm/threejs-kit',
      },
      sidebar: [
        {
          label: 'Intro',
          autogenerate: { directory: 'intro' },
        },
        {
          label: 'Materials',
          autogenerate: { directory: 'materials' },
        },
      ],
      customCss: ['./src/tailwind.css'],

    }),
    tailwind({ applyBaseStyles: false }),
    svelte()
  ],
  vite: {
    ssr: {
      // "@theatre/core" needs to be externalized in development mode but not in production!
      noExternal: noExternal
    },
    resolve: {
      alias: {
        'lib/*': './src/lib'
      }
    }
  },
  output: 'static'
});
