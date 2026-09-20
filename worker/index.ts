import '../src/app.css';
import '../src/generated-tailwind.css';
import { tailwindCss } from './tailwind.generated';
import { Hono } from 'hono';
import { attachSvelteRoutes, svelteRenderer } from 'svelte-hono';
import { bundles } from './bundles.generated';
import Home from '../site/Home.svelte';
import Docs from '../site/Docs.svelte';
import { HEADS } from '../shared/heads';
import { Effect } from 'effect';
import type { PredictRequest, PredictState, Prediction, TriggerReason } from '../shared/schema';
import { isMetadata } from '../shared/validation';

interface Env { PREDICT_LIMIT?: RateLimit; PREDICT_STUB?: string; AI_GATEWAY_ID?: string; AI_GATEWAY_TOKEN?: string }

function headers(): HeadersInit { return { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type' }; }
function trim(state: PredictState): PredictState { return JSON.parse(JSON.stringify(state)); }
function isPredictRequest(value: unknown): value is PredictRequest {
  if (!value || typeof value !== 'object') return false;
  const body = value as Partial<PredictRequest>;
  if ((body.session !== undefined && (typeof body.session !== 'string' || body.session.length === 0)) || typeof body.reason !== 'string' || typeof body.state !== 'object' || body.state === null) return false;
  if (body.metadata !== undefined && !isMetadata(body.metadata)) return false;
  if (body.outcomes !== undefined && (!Array.isArray(body.outcomes) || body.outcomes.length === 0 || body.outcomes.length > 16 || body.outcomes.some(outcome => typeof outcome !== 'string' || outcome.length === 0 || outcome.length > 64))) return false;
  return true;
}
function selectOutcome(candidate: string, outcomes?: string[]): string {
  if (!outcomes || outcomes.includes(candidate)) return candidate;
  throw new Error(`model returned an outcome outside the supplied choices: ${candidate}`);
}
function actionQuestions(outcomes?: string[]) {
  if (!outcomes) return HEADS;
  return { ...HEADS, action: { ...HEADS.action, criteria: Object.fromEntries(outcomes.map(outcome => [outcome, `Recommend the caller outcome named ${outcome}.`])) } };
}
function stub(state: PredictState, reason: TriggerReason, outcomes?: string[]): Prediction {
  const exiting = state.motion.heading_to_exit || state.motion.tab_hidden;
  const stalled = state.motion.idle_ms >= 6000 && state.engagement.scroll_max < 0.45;
  const bounce = exiting ? 0.94 : stalled ? 0.74 : Math.max(0.08, 0.42 - state.engagement.scroll_max * 0.25);
  const confused = state.page.type === 'pricing' && stalled ? 0.78 : state.motion.rage_clicks > 1 ? 0.72 : 0.08;
  const intent = state.page.type === 'pricing' ? 'compare' : state.page.type === 'checkout' ? 'buy' : 'learn';
  const suggested = confused ? 'clarify' : intent === 'compare' ? 'compare' : 'none';
  const next = selectOutcome(suggested, outcomes);
  return { t: Date.now(), model: 'stub', reason, next, confidence: 0.75, heads: { bounce: { noul: bounce, mode: exiting ? 'exiting' : stalled ? 'stalled' : 'engaged', mode_p: { engaged: exiting ? 0.02 : 1 - bounce, stalled: stalled ? 0.7 : 0.1, exiting: exiting ? 0.94 : 0.02 } }, intent: { choice: intent, confidence: 0.78 }, friction: { confused, rage: state.motion.rage_clicks > 1 ? 0.82 : 0.04, abandon_form: state.form?.started && state.form.ms_since_input > 5000 ? 0.8 : 0.02 }, interrupt: { noul: exiting ? 0.2 : confused > 0.6 ? 0.86 : 0.12 }, next: { choice: next, confidence: 0.75 } } };
}
function predict(env: Env, request: PredictRequest): Effect.Effect<Prediction, Error> {
  const session = request.session ?? crypto.randomUUID();
  const state = trim(request.state);
  const modelState = { ...state, session_id: session, ...(request.metadata ? { metadata: request.metadata } : {}), ...(request.outcomes ? { allowed_next_steps: request.outcomes } : {}) };
  if (env.PREDICT_STUB === '1' || !env.AI_GATEWAY_TOKEN) return Effect.succeed(stub(state, request.reason, request.outcomes));
  return Effect.gen(function* () {
    const response = yield* Effect.tryPromise({ try: () => fetch('https://api.cloudflare.com/client/v4/accounts/bfcb6ac5b3ceaf42a09607f6f7925823/ai/run', { method: 'POST', headers: { authorization: `Bearer ${env.AI_GATEWAY_TOKEN}`, 'cf-aig-gateway-id': env.AI_GATEWAY_ID ?? 'default', 'content-type': 'application/json' }, body: JSON.stringify({ model: 'typesafe/jev', input: { state: JSON.stringify(modelState), questions: actionQuestions(request.outcomes) } }) }) , catch: error => new Error(String(error)) });
    if (!response.ok) return yield* Effect.fail(new Error(`AI Gateway request failed: ${response.status}`));
    const result = yield* Effect.tryPromise({ try: () => response.json() as Promise<Record<string, unknown>>, catch: error => new Error(String(error)) });
    return pack(result, request.reason, request.outcomes);
  });
}
function pack(result: Record<string, unknown>, reason: TriggerReason, outcomes?: string[]): Prediction {
  const gateway = (result.result ?? result) as Record<string, unknown>;
  const payload = (gateway.result ?? gateway) as Record<string, unknown>;
  const a = (payload.answers ?? {}) as Record<string, any>;
  const choice = (key: string, fallback: string) => a[key]?.choice ?? fallback;
  const score = (key: string) => Number(a[key]?.score ?? a[key]?.noul ?? 0);
  const suggested = choice('action', 'none');
  const next = selectOutcome(suggested, outcomes);
  const confidence = Number(a.action?.confidence ?? 0);
  return { t: Date.now(), model: String(payload.model ?? 'jev-1.13.0'), reason, next, confidence, heads: { bounce: { noul: score('will_bounce'), mode: choice('bounce_mode', 'stalled') as 'engaged' | 'stalled' | 'exiting', mode_p: a.bounce_mode?.probabilities ?? {} }, intent: { choice: choice('job', 'wander'), confidence: Number(a.job?.confidence ?? 0) }, friction: { confused: score('confused'), rage: score('rage'), abandon_form: score('abandon_form') }, interrupt: { noul: score('may_interrupt') }, next: { choice: next, confidence } } };
}

const app = new Hono();
app.onError((error, c) => c.json({ error: error.message }, 502, headers() as Record<string, string>));
attachSvelteRoutes(app, { bundles });
app.get('/tailwind.css', () => new Response(tailwindCss, { headers: { 'content-type': 'text/css; charset=utf-8', 'cache-control': 'public, max-age=3600' } }));
app.get('/', svelteRenderer(Home, { hydrateAs: 'home', title: 'predict' }));
app.get('/docs', svelteRenderer(Docs, { hydrateAs: 'docs', title: 'predict docs' }));
app.options('*', () => new Response(null, { headers: { ...headers(), 'access-control-allow-methods': 'POST, OPTIONS' } }));
app.post('/predict', async (c) => {
  const value = await Effect.runPromise(Effect.tryPromise({ try: () => c.req.json(), catch: () => null }));
  if (!isPredictRequest(value)) return c.json({ error: 'invalid prediction request' }, 400, headers() as Record<string, string>);
  const env = c.env as Env;
  const client = c.req.header('cf-connecting-ip') ?? 'unknown';
  let result: { _tag: 'Right'; right: Prediction } | { _tag: 'Left'; left: Error };
  try {
    result = { _tag: 'Right', right: await Effect.runPromise(Effect.gen(function* () {
      const limit = env.PREDICT_LIMIT ? yield* Effect.tryPromise({ try: () => env.PREDICT_LIMIT!.limit({ key: client }), catch: error => new Error(String(error)) }) : { success: true };
      if (!limit.success) return yield* Effect.fail(new Error('rate limit exceeded'));
      return yield* predict(env, value);
    })) };
  } catch (error) {
    result = { _tag: 'Left', left: error instanceof Error ? error : new Error(String(error)) };
  }
  if (result._tag === 'Left') return c.json({ error: result.left.message }, result.left.message === 'rate limit exceeded' ? 429 : 502, { ...headers(), ...(result.left.message === 'rate limit exceeded' ? { 'retry-after': '60' } : {}) } as Record<string, string>);
  return c.json(result.right, 200, headers() as Record<string, string>);
});
app.get('/snippet.js', () => new Response(SNIPPET, { headers: { 'content-type': 'application/javascript', 'cache-control': 'public, max-age=3600' } }));
app.get('/manifest.webmanifest', (c) => c.json({ name: 'Predict', short_name: 'Predict', start_url: '/', display: 'standalone', background_color: '#f7f9fc', theme_color: '#635bff', description: 'See what a visitor is likely to do next.', icons: [{ src: '/icon.jpg', sizes: '512x512', type: 'image/jpeg', purpose: 'any maskable' }] }));
app.get('/sw.js', (c) => new Response(`self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(key=>caches.delete(key)))).then(()=>self.clients.claim())));self.addEventListener('fetch',event=>{if(event.request.method==='GET')event.respondWith(fetch(event.request))});`, { headers: { 'content-type': 'application/javascript', 'cache-control': 'no-store' } }));
export default app;
const SNIPPET = `(()=>{const c=window.PredictConfig||{};if(navigator.doNotTrack==='1'||document.documentElement.hasAttribute('data-off'))return;const predict=async(input={})=>{const s={page:{path:location.pathname,title:document.title,type:location.pathname.includes('pricing')?'pricing':location.pathname.includes('checkout')?'checkout':'essay'},session:{t_ms:performance.now(),pages:1,referrer_kind:'unknown'},engagement:{scroll_max:Math.min(1,scrollY/(document.body.scrollHeight-innerHeight||1)),scroll_now:scrollY/(document.body.scrollHeight-innerHeight||1),clicks:0,keys:0,cta_hover_ms:0,cta_clicked:false},motion:{idle_ms:0,heading_to_exit:false,tab_hidden:document.hidden,visibility:document.visibilityState,rage_clicks:0},form:null};const r=await fetch(input.endpoint||c.endpoint||'/predict',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({session:input.session||c.session||crypto.randomUUID(),reason:input.action||'manual',metadata:input.metadata,outcomes:input.outcomes,state:s})});if(!r.ok)throw new Error('prediction request failed');const p=await r.json();(c.onPredict||(()=>{}))(p);return p};predict.tick=(action='manual')=>predict({action});window.Predict=predict})()`;
