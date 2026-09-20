import { execFileSync } from 'node:child_process';
import { buildHonoSvelte } from 'svelte-hono/build';

execFileSync('bunx', ['@tailwindcss/cli', '-i', './src/tailwind.css', '-o', './src/generated-tailwind.css'], { stdio: 'inherit' });
const generatedTailwindCss = await Bun.file('./src/generated-tailwind.css').text();
const bannerEnd = generatedTailwindCss.startsWith('/*!') ? generatedTailwindCss.indexOf('*/') + 2 : 0;
const tailwindCss = generatedTailwindCss.slice(bannerEnd).trimStart();
await Bun.write('./src/generated-tailwind.css', tailwindCss);
await Bun.write('./worker/tailwind.generated.ts', `export const tailwindCss = ${JSON.stringify(tailwindCss)};\n`);

await buildHonoSvelte({
  workerEntry: './worker/index.ts',
  outDir: './build',
  components: { home: '../site/Home.svelte', docs: '../site/Docs.svelte' },
});
