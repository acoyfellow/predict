import { Hono } from 'hono';
import { attachSvelteRoutes, svelteRenderer } from 'svelte-hono';
import { bundles } from './bundles.generated';
import Home from '../site/Home.svelte';
import Docs from '../site/Docs.svelte';
import { HEADS } from '../shared/heads';
import { PAINT_SHOP_BASE64 } from './paint-shop';
import { PAINT_SUNSET_BASE64 } from './paint-sunset';
import { PAINT_ELECTRIC_BASE64 } from './paint-electric';
import { PAINT_AFTERGLOW_BASE64 } from './paint-afterglow';
import { PAINT_EXIT_BASE64 } from './paint-exit';
import { PREDICT_ICON_BASE64 } from './predict-icon';
import { Effect } from 'effect';
import type { PredictRequest, PredictState, Prediction, TriggerReason } from '../shared/schema';
import { isMetadata } from '../shared/validation';

interface Env { PREDICT_LIMIT?: RateLimit; PREDICT_STUB?: string; AI_GATEWAY_ID?: string; AI_GATEWAY_TOKEN?: string }

function headers(): HeadersInit { return { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type' }; }
function trim(state: PredictState): PredictState { return JSON.parse(JSON.stringify(state)); }
function isPredictRequest(value: unknown): value is PredictRequest {
  if (!value || typeof value !== 'object') return false;
  const body = value as Partial<PredictRequest>;
  if (typeof body.session !== 'string' || body.session.length === 0 || typeof body.reason !== 'string' || typeof body.state !== 'object' || body.state === null) return false;
  if (body.metadata !== undefined && !isMetadata(body.metadata)) return false;
  return true;
}
function stub(state: PredictState, reason: TriggerReason): Prediction {
  const exiting = state.motion.heading_to_exit || state.motion.tab_hidden;
  const stalled = state.motion.idle_ms >= 6000 && state.engagement.scroll_max < 0.45;
  const bounce = exiting ? 0.94 : stalled ? 0.74 : Math.max(0.08, 0.42 - state.engagement.scroll_max * 0.25);
  const confused = state.page.type === 'pricing' && stalled ? 0.78 : state.motion.rage_clicks > 1 ? 0.72 : 0.08;
  const intent = state.page.type === 'pricing' ? 'compare' : state.page.type === 'checkout' ? 'buy' : 'learn';
  const next = confused ? 'clarify' : intent === 'compare' ? 'compare' : 'none';
  return { t: Date.now(), model: 'stub', reason, next, confidence: 0.75, heads: { bounce: { noul: bounce, mode: exiting ? 'exiting' : stalled ? 'stalled' : 'engaged', mode_p: { engaged: exiting ? 0.02 : 1 - bounce, stalled: stalled ? 0.7 : 0.1, exiting: exiting ? 0.94 : 0.02 } }, intent: { choice: intent, confidence: 0.78 }, friction: { confused, rage: state.motion.rage_clicks > 1 ? 0.82 : 0.04, abandon_form: state.form?.started && state.form.ms_since_input > 5000 ? 0.8 : 0.02 }, interrupt: { noul: exiting ? 0.2 : confused > 0.6 ? 0.86 : 0.12 }, next: { choice: next, confidence: 0.75 } } };
}
async function predict(env: Env, request: PredictRequest): Promise<Prediction> {
  const state = trim(request.state);
  const modelState = request.metadata ? { ...state, metadata: request.metadata } : state;
  if (env.PREDICT_STUB === '1' || !env.AI_GATEWAY_TOKEN) return stub(state, request.reason);
  const response = await fetch('https://api.cloudflare.com/client/v4/accounts/bfcb6ac5b3ceaf42a09607f6f7925823/ai/run', { method: 'POST', headers: { authorization: `Bearer ${env.AI_GATEWAY_TOKEN}`, 'cf-aig-gateway-id': env.AI_GATEWAY_ID ?? 'default', 'content-type': 'application/json' }, body: JSON.stringify({ model: 'typesafe/jev', input: { state: JSON.stringify(modelState), questions: HEADS } }) });
  if (!response.ok) throw new Error(`AI Gateway request failed: ${response.status} ${await response.text()}`);
  const result = await response.json() as Record<string, unknown>;
  return pack(result, request.reason);
}
function pack(result: Record<string, unknown>, reason: TriggerReason): Prediction {
  const gateway = (result.result ?? result) as Record<string, unknown>;
  const payload = (gateway.result ?? gateway) as Record<string, unknown>;
  const a = (payload.answers ?? {}) as Record<string, any>;
  const choice = (key: string, fallback: string) => a[key]?.choice ?? fallback;
  const score = (key: string) => Number(a[key]?.score ?? a[key]?.noul ?? 0);
  const next = choice('action', 'none');
  const confidence = Number(a.action?.confidence ?? 0);
  return { t: Date.now(), model: String(payload.model ?? 'jev-1.13.0'), reason, next, confidence, heads: { bounce: { noul: score('will_bounce'), mode: choice('bounce_mode', 'stalled') as 'engaged' | 'stalled' | 'exiting', mode_p: a.bounce_mode?.probabilities ?? {} }, intent: { choice: choice('job', 'wander'), confidence: Number(a.job?.confidence ?? 0) }, friction: { confused: score('confused'), rage: score('rage'), abandon_form: score('abandon_form') }, interrupt: { noul: score('may_interrupt') }, next: { choice: next, confidence } } };
}

const app = new Hono();
attachSvelteRoutes(app, { bundles });
app.get('/', svelteRenderer(Home, { hydrateAs: 'home', title: 'predict' }));
app.get('/docs', svelteRenderer(Docs, { hydrateAs: 'docs', title: 'predict docs' }));
app.options('*', () => new Response(null, { headers: { ...headers(), 'access-control-allow-methods': 'POST, OPTIONS' } }));
app.post('/predict', async (c) => {
  try {
    const value = await c.req.json();
    if (!isPredictRequest(value)) return c.json({ error: 'invalid prediction request' }, 400, headers() as Record<string, string>);
    const env = c.env as Env;
    const client = c.req.header('cf-connecting-ip') ?? 'unknown';
    const limit = env.PREDICT_LIMIT ? await env.PREDICT_LIMIT.limit({ key: client }) : { success: true };
    if (!limit.success) return c.json({ error: 'rate limit exceeded', retry_after_seconds: 60 }, 429, { ...headers(), 'retry-after': '60' } as Record<string, string>);
    const result = await Effect.runPromise(Effect.tryPromise({ try: () => predict(env, value), catch: (error) => error }));
    return c.json(result, 200, headers() as Record<string, string>);
  } catch (error) {
    console.error('prediction request failed', error);
    return c.json({ error: 'prediction request failed' }, 502, headers() as Record<string, string>);
  }
});
app.get('/snippet.js', () => new Response(SNIPPET, { headers: { 'content-type': 'application/javascript', 'cache-control': 'public, max-age=3600' } }));
const imageResponse = (base64: string) => new Response(Uint8Array.from(atob(base64), (character) => character.charCodeAt(0)), { headers: { 'content-type': 'image/jpeg', 'cache-control': 'public, max-age=31536000, immutable' } });
app.get('/paint-shop.jpg', () => imageResponse(PAINT_SHOP_BASE64));
app.get('/paint-sunset.jpg', () => imageResponse(PAINT_SUNSET_BASE64));
app.get('/paint-electric.jpg', () => imageResponse(PAINT_ELECTRIC_BASE64));
app.get('/paint-afterglow.jpg', () => imageResponse(PAINT_AFTERGLOW_BASE64));
app.get('/paint-exit.jpg', () => imageResponse(PAINT_EXIT_BASE64));
app.get('/icon.jpg', () => imageResponse(PREDICT_ICON_BASE64));
app.get('/manifest.webmanifest', (c) => c.json({ name: 'Predict', short_name: 'Predict', start_url: '/', display: 'standalone', background_color: '#f7f9fc', theme_color: '#635bff', description: 'See what a visitor is likely to do next.', icons: [{ src: '/icon.jpg', sizes: '512x512', type: 'image/jpeg', purpose: 'any maskable' }] }));
app.get('/sw.js', (c) => new Response(`const CACHE='predict-v1';self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(['/','/docs','/manifest.webmanifest','/icon.jpg']))));self.addEventListener('fetch',event=>event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request))) );`, { headers: { 'content-type': 'application/javascript', 'cache-control': 'no-cache' } }));
export default app;
const SNIPPET = `(()=>{const c=window.PredictConfig||{};if(navigator.doNotTrack==='1'||document.documentElement.hasAttribute('data-off'))return;const predict=async(input={})=>{const s={page:{path:location.pathname,title:document.title,type:location.pathname.includes('pricing')?'pricing':location.pathname.includes('checkout')?'checkout':'essay'},session:{t_ms:performance.now(),pages:1,referrer_kind:'unknown'},engagement:{scroll_max:Math.min(1,scrollY/(document.body.scrollHeight-innerHeight||1)),scroll_now:scrollY/(document.body.scrollHeight-innerHeight||1),clicks:0,keys:0,cta_hover_ms:0,cta_clicked:false},motion:{idle_ms:0,heading_to_exit:false,tab_hidden:document.hidden,visibility:document.visibilityState,rage_clicks:0},form:null};const r=await fetch(input.endpoint||c.endpoint||'/predict',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({session:input.session||c.session||crypto.randomUUID(),reason:input.action||'manual',metadata:input.metadata,state:s})});if(!r.ok)throw new Error('prediction request failed');const p=await r.json();(c.onPredict||(()=>{}))(p);return p};predict.tick=(action='manual')=>predict({action});window.Predict=predict})()`;
