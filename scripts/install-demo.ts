import { $ } from 'bun';

await $`bun install`;
await $`bun run check`;
console.log('predict is ready at http://127.0.0.1:8787');
console.log('start it with: bun run dev -- --local --port 8787');
