import { json } from '@sveltejs/kit';

export const POST = async ({ request }) => {
  const body = await request.json();
  return json({ t: Date.now(), model: 'stub', reason: body.reason ?? 'manual', next: 'compare', confidence: 0.75, heads: { bounce: { noul: 0.2, mode: 'engaged', mode_p: {} }, intent: { choice: 'compare', confidence: 0.8 }, friction: { confused: 0.2, rage: 0, abandon_form: 0 }, interrupt: { noul: 0.1 }, next: { choice: 'compare', confidence: 0.75 } } });
};
