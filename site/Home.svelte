<script lang="ts">
  let session = $state(typeof window === 'undefined' ? 'demo' : new URLSearchParams(window.location.search).get('s') || 'demo');
  let result = $state<any>(null);
  let requestPayload = $state<any>(null);
  let latencyMs = $state<number | null>(null);
  let scenario = $state('idle');
  let running = $state(false);
  let error = $state('');
  let elapsed = $state(0);
  let heroStep = $state(0);
  let scrollPercent = $state(0);
  $effect(() => {
    const started = Date.now();
    const updateScroll = () => { scrollPercent = Math.round((scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight)) * 100); };
    const timer = setInterval(() => { elapsed = Math.floor((Date.now() - started) / 1000); }, 250);
    addEventListener('scroll', updateScroll, { passive: true });
    updateScroll();
    return () => { clearInterval(timer); removeEventListener('scroll', updateScroll); };
  });
  function chooseScenario(next: string) {
    if (running) return;
    scenario = next;
    result = null;
  }
  function merchantJson() {
    return JSON.stringify({
      visitor: scenario === 'idle' ? 'stopped after reading 18% of the page' : scenario === 'exit_intent' ? 'moved toward the top of the page' : 'clicked the pricing comparison',
      prediction: result.heads.intent.choice,
      bounce_probability: Number(result.heads.bounce.noul.toFixed(2)),
      next: result.next,
      confidence: result.confidence,
      latency_ms: latencyMs,
      suggested_response: result.next === 'compare' ? 'show the plan comparison' : result.next === 'clarify' ? 'ask a helpful question' : 'do nothing',
    }, null, 2);
  }
  async function runScenario() {
    running = true;
    heroStep = 1;
    error = '';
    result = null;
    latencyMs = null;
    const state = { page: { path: '/pricing', title: 'Northstar pricing', type: 'pricing' }, session: { t_ms: 8200, pages: 1, referrer_kind: 'direct' }, engagement: { scroll_max: scenario === 'idle' ? .18 : .62, scroll_now: .18, clicks: 1, keys: 0, cta_hover_ms: 0, cta_clicked: false }, motion: { idle_ms: scenario === 'idle' ? 8200 : 0, heading_to_exit: scenario === 'exit_intent', tab_hidden: false, visibility: 'visible', rage_clicks: 0 }, form: null };
    requestPayload = { session, reason: scenario, metadata: { experiment: 'comparison-v2' }, state };
    try {
      const startedAt = performance.now();
      const response = await fetch('/predict', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(requestPayload) });
      if (!response.ok) throw new Error('prediction request failed');
      result = await response.json();
      latencyMs = Math.round(performance.now() - startedAt);
      heroStep = 2;
    } catch {
      heroStep = 0;
      error = 'The prediction could not run. Try again.';
    } finally {
      running = false;
    }
  }
</script>
<svelte:head><title>Predict — see what visitors do next</title><meta name="description" content="Predict visitor intent from a few page signals and choose a better next step." /><link rel="canonical" href="https://predict.coey.dev/" /><meta name="theme-color" content="#635bff" /><meta property="og:title" content="Predict — see what visitors do next" /><meta property="og:description" content="A small browser signal for the next step on your website." /><meta property="og:image" content="https://predict.coey.dev/icon.jpg" /><meta property="og:url" content="https://predict.coey.dev/" /><meta name="twitter:card" content="summary_large_image" /><link rel="manifest" href="/manifest.webmanifest" /><link rel="icon" href="/icon.jpg" /><script>if ('serviceWorker' in navigator && !['localhost', '127.0.0.1'].includes(location.hostname)) navigator.serviceWorker.register('/sw.js');</script><link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" /><link href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:opsz,wght@6..144,400..700&family=Google+Sans+Mono:wght@400;500&display=swap" rel="stylesheet" /></svelte:head>
<main class="mx-auto max-w-[1180px] px-[38px] py-[25px] max-[800px]:px-5"><header><a class="logo" href="/">predict<span>✦</span></a><a class="source-link" href="https://github.com/acoyfellow/predict" target="_blank" rel="noreferrer" aria-label="View predict source on GitHub"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.25c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.74.08-.74 1.2.08 1.84 1.23 1.84 1.23 1.07 1.83 2.8 1.3 3.48.99.11-.77.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.93 0-1.31.47-2.38 1.23-3.22-.12-.3-.53-1.52.12-3.17 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.3-1.55 3.3-1.23 3.3-1.23.65 1.65.24 2.87.12 3.17.76.84 1.23 1.91 1.23 3.22 0 4.6-2.8 5.62-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12 12 0 0 0 12 .5Z" /></svg><span>Source</span></a><a class="docs-link" href="/docs">Docs</a></header><section class="hero"><div class="hero-copy"><p class="eyebrow">On-page prediction for your website</p><h1>See what a visitor is likely to do next.</h1><p class="intro">Add one small call to your site. Give Predict an action and session. Use any action label. It returns a typed prediction. Your code decides what to show.</p><div class="hero-actions"><a class="primary" href="/docs">Read the docs</a><a class="github-cta" href="https://github.com/acoyfellow/predict" target="_blank" rel="noreferrer">Install from GitHub →</a></div></div><svg class="hero-lifecycle" viewBox="0 0 1000 420" aria-hidden="true"><path d="M0 320 C180 300 220 180 390 240 S610 300 730 120 S900 110 1000 40" /><circle cx="0" cy="320" r="8" /><circle cx="390" cy="240" r="8" /><circle cx="730" cy="120" r="8" /><circle cx="1000" cy="40" r="11" /></svg><div class="snippet"><div class="snippet-bar"><span></span><span></span><span></span><b>proposed browser API</b></div><div class="lifecycle" aria-label="Illustrated visitor session timeline"><svg viewBox="0 0 520 150" role="img" aria-label="Visitor behavior moves from reading to stalled to a predicted next step"><path class="grid-line" d="M32 24H500M32 68H500M32 112H500" /><path class="lifecycle-line" d="M32 104 C105 98 130 72 190 78 S275 94 330 57 S410 42 488 25" /><circle class="point" cx="32" cy="104" r="5" /><circle class="point" cx="190" cy="78" r="5" /><circle class="point" cx="330" cy="57" r="5" /><circle class="point current" cx="488" cy={heroStep === 2 ? 25 : heroStep === 1 ? 57 : 78} r="7" /></svg></div><pre><code><span class="muted">&lt;script&gt;</span>
  <span class="keyword">const</span> prediction = <span class="keyword">await</span> Predict(&#123;
    <span class="key">endpoint</span>: <i>"/predict"</i>,
    <span class="key">session</span>: crypto.randomUUID(),
    <span class="key">action</span>: <i>"pricing_confusion"</i>,
    <span class="key">metadata</span>: &#123;
      <span class="key">experiment</span>: <i>"comparison-v2"</i>
    &#125;
  &#125;);

  <span class="keyword">if</span> (prediction.next === <i>"compare"</i>) &#123;
    showPlanComparison();
  &#125;
<span class="muted">&lt;/script&gt;</span></code></pre><div class="snippet-live" aria-live="polite"><div class="cockpit-head"><span><span class="live-dot"></span><b>Live signals</b></span><small>{elapsed}s</small></div><div class="signal-grid"><span><b>PAGE</b><code>/pricing</code></span><span><b>SCROLL</b><code>{scrollPercent}%</code></span><span><b>◉ EYE</b><code>on</code></span><span><b>NEXT</b><code>{result ? result.next : 'wait'}</code></span></div><a class="signal-link" href="/docs#signals">See all signals →</a></div></div></section><section id="demo" class="demo @container"><div class="sample-site"><div class="scenario min-w-0"><div class="scenario-label"><span>Visitor scenario</span><small>Choose a path to replay</small></div><div class="scenario-tabs" role="tablist" aria-label="Visitor scenarios"><button class:active={scenario === 'manual'} role="tab" aria-selected={scenario === 'manual'} onclick={() => chooseScenario('manual')} disabled={running}><svg class="scenario-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="10" height="14" rx="1"/><rect x="10" y="3" width="10" height="14" rx="1"/><path d="M7 9h4M7 12h4M13 7h4M13 10h4M13 13h3"/></svg><b>Compare</b><small>Reviews plans</small></button><button class:active={scenario === 'idle'} role="tab" aria-selected={scenario === 'idle'} onclick={() => chooseScenario('idle')} disabled={running}><svg class="scenario-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/></svg><b>Stall</b><small>Stops reading</small></button><button class:active={scenario === 'exit_intent'} role="tab" aria-selected={scenario === 'exit_intent'} onclick={() => chooseScenario('exit_intent')} disabled={running}><svg class="scenario-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h5v16h-5M11 12h9M15 8l4 4-4 4"/></svg><b>Leave</b><small>Moves to exit</small></button></div><button class="run" onclick={runScenario} disabled={running}>{running ? 'Running…' : 'Run this scenario'}</button>{#if error}<p class="form-error" role="alert">{error}</p>{/if}</div><div class="website-column"><div class="demo-label website-label">Example website</div><div class="site-frame"><img class="site-paint" src="/paint-shop.jpg" alt="" /><div class="site-brand">PAINTBOX <i>colors for loud rooms</i></div><h2>Make a room<br />impossible to ignore.</h2><p class="site-copy">Big color, fast shipping, zero beige energy.</p>{#if result && scenario === 'manual'}<div class="site-response compare-response reveal"><b>Electric is your boldest move.</b><span>Best for rooms that need energy · 400 sq ft · satin finish · dries in 2 hours.</span><button>See Electric in my room →</button><details><summary>Why Electric?</summary><p>A high-energy yellow with enough warmth for kitchens, studios, and creative spaces.</p><b>Will it look too bright?</b><p>Not in a room with natural light. Use one wall for a sharp accent.</p></details></div>{:else if result && scenario === 'idle'}<div class="site-response stall-response reveal"><b>Need a nudge?</b><strong>Free color cards with every order.</strong><span>See the palette in your room before you commit.</span><button>Claim the color cards →</button></div>{/if}<div class="plans"><div><img class="paint-product" src="/paint-sunset.jpg" alt="Sunset orange paint can" /><b>Sunset</b><strong>$18</strong><small>Warm and bright</small></div><div class="selected"><img class="paint-product" src="/paint-electric.jpg" alt="Electric yellow paint can" /><b>Electric</b><strong>$42</strong><small>Loud by design</small></div><div><img class="paint-product" src="/paint-afterglow.jpg" alt="Afterglow pink paint can" /><b>Afterglow</b><strong>$96</strong><small>Glow after dark</small></div></div>{#if result && scenario === 'exit_intent'}<div class="website-modal reveal"><img class="exit-paint" src="/paint-exit.jpg" alt="Abstract paint strokes around a glowing doorway" /><button aria-label="Close" onclick={() => result = null}>×</button><p class="modal-kicker">Before you go</p><h3>Still deciding on a color?</h3><p>Save this palette and come back when the room is ready.</p><a href="#demo">Email me this palette →</a></div>{/if}</div></div><aside class="merchant"><div class="demo-label">Prediction exchange</div>{#if requestPayload}<details class="exchange-request"><summary>Request sent to <code>/predict</code><span>View JSON</span></summary><pre class="json compact"><code>{JSON.stringify(requestPayload, null, 2)}</code></pre></details>{/if}{#if result}<section class="exchange-response"><p class="json-label">Response from Predict <span class="latency">{latencyMs} ms</span></p><pre class="json"><code>{merchantJson()}</code></pre></section>{:else}<div class="empty"><span class="dot"></span><p>No prediction yet.</p><small>Run one to see the request and response.</small></div>{/if}</aside></section><footer><span>Predict gives your code a signal about visitor intent.</span><span>It does not generate text or open a popup.</span></footer></main>

