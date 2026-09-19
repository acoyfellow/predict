import { buildHonoSvelte } from 'svelte-hono/build';

await buildHonoSvelte({
  workerEntry: './worker/index.ts',
  outDir: './build',
  components: { home: '../site/Home.svelte', docs: '../site/Docs.svelte' },
});
