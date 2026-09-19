import { json } from '@sveltejs/kit';

export const POST = async ({ request }) => {
  const body = await request.json();
  return json({ t: Date.now(), model: 'stub', reason: body.reason ?? 'manual', next: 'compare', confidence: 0.75, heads: { next: { choice: 'compare', confidence: 0.75 } } });
};
