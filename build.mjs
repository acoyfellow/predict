import { execFileSync } from 'node:child_process';
import { buildHonoSvelte } from 'svelte-hono/build';

execFileSync('bunx', ['@tailwindcss/cli', '-i', './src/tailwind.css', '-o', './src/generated-tailwind.css'], { stdio: 'inherit' });
const tailwindCss = await Bun.file('./src/generated-tailwind.css').text();
await Bun.write('./worker/tailwind.generated.ts', `export const tailwindCss = ${JSON.stringify(tailwindCss)};\n`);

await buildHonoSvelte({
  workerEntry: './worker/index.ts',
  outDir: './build',
  components: { home: '../site/Home.svelte', docs: '../site/Docs.svelte' },
});
