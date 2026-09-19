<svelte:head><title>Predict docs — browser integration</title><meta name="description" content="Install Predict, send your own action and metadata, and use the returned next-step signal." /><link rel="canonical" href="https://predict.coey.dev/docs" /><meta name="theme-color" content="#635bff" /><meta property="og:title" content="Predict docs" /><meta property="og:description" content="Install Predict and use a small signal for the next step on your website." /><meta property="og:url" content="https://predict.coey.dev/docs" /><link rel="manifest" href="/manifest.webmanifest" /><link rel="icon" href="/icon.jpg" /><link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" /><link href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:opsz,wght@6..144,400..700&family=Google+Sans+Mono:wght@400;500&display=swap" rel="stylesheet" /></svelte:head>
<main>
  <header><a class="logo" href="/">predict<span>✦</span></a><nav><a href="/docs">Docs</a><a href="https://github.com/acoyfellow/predict" target="_blank" rel="noreferrer">Source</a></nav></header>
  <article>
    <p class="eyebrow">Predict docs</p>
    <h1>Ask what a visitor will do next.</h1>
    <p class="lead">Predict reads a few page signals and returns a small, typed prediction. Your site decides what to show.</p>
    <p class="cta"><a href="https://github.com/acoyfellow/predict" target="_blank" rel="noreferrer">Install your own Worker on GitHub →</a></p>
    <h2>Install</h2>
    <p>Add the browser script to your site.</p>
    <pre><code>&lt;script src="https://predict.coey.dev/snippet.js"&gt;&lt;/script&gt;</code></pre>
    <h2>Make a prediction</h2>
    <pre><code><span class="kw">const</span> prediction = <span class="kw">await</span> <span class="fn">Predict</span>(&#123;
  <span class="key">endpoint</span>: <span class="str">"/predict"</span>,
  <span class="key">session</span>: crypto.<span class="fn">randomUUID</span>(),
  <span class="key">action</span>: <span class="str">"bounce"</span>
&#125;);</code></pre>
    <p>The call returns the prediction. <code>action</code> is a caller-defined label that says why you are asking. Use any string. <code>metadata</code> is optional customer context. Predict does not collect or invent it.</p>
    <h2>Bring your own context</h2>
    <pre><code><span class="key">metadata</span>: &#123;
  <span class="key">plan</span>: <span class="str">"team"</span>,
  <span class="key">experiment</span>: <span class="str">"comparison-v2"</span>
&#125;</code></pre>
    <p>Metadata stays in your control. Predict passes explicit metadata to the prediction request. Do not send form values, secrets, or sensitive personal data.</p>
    <h2>Use the result</h2>
    <pre><code><span class="kw">if</span> (prediction.next === <span class="str">"compare"</span>) &#123;
  <span class="fn">showPlanComparison</span>();
&#125;

<span class="kw">if</span> (prediction.next === <span class="str">"clarify"</span>) &#123;
  <span class="fn">showHelpfulHint</span>();
&#125;</code></pre>
    <h2>Response</h2>
    <pre><code>&#123;
  "next": "compare",
  "confidence": 0.82,
  "model": "jev-1.13.0",
  "heads": &#123; ... &#125;
&#125;</code></pre>
    <p><code>next</code> and <code>confidence</code> are the simple path. <code>heads</code> contains the full signal set for merchants that need more detail.</p>
    <h2>Actions</h2>
    <p>Actions are open labels from your site. Name them after the event that caused the prediction request.</p>
    <pre><code><span class="key">action</span>: <span class="str">"pricing_confusion"</span>
<span class="key">action</span>: <span class="str">"checkout_stall"</span>
<span class="key">action</span>: <span class="str">"returning_customer"</span></code></pre>
    <p>Predict echoes your action as <code>reason</code>. It does not limit or reinterpret the label. The response field <code>next</code> is separate: it is Predict's suggested next step.</p>
    <p>Metadata is limited to JSON objects up to 8 KB. Predict does not store it by default.</p>
    <h2 id="signals">Signals Predict sends</h2>
    <p>Predict sends a small page and session state. It includes the page path, page title, page type, time on page, page count, referrer category, scroll depth, clicks, key count, CTA interaction, idle time, tab visibility, exit intent, rage-click count, and optional form progress.</p>
    <p>It does not send a user agent, referrer URL, page text, form values, keystrokes, mouse coordinates, cookies, or a fingerprint in the prediction body. Metadata is only sent when your code provides it.</p>
    <h2>Built on</h2>
    <div class="stack-logos"><a href="https://workers.cloudflare.com/" target="_blank" rel="noreferrer"><span class="cloudflare-mark" aria-hidden="true">☁</span><span>Cloudflare<br /><small>Workers · Workers AI · AI Gateway</small></span></a><a href="https://typesafe.ai/" target="_blank" rel="noreferrer"><span class="typesafe-mark" aria-hidden="true">t</span><span>TypeSafe<br /><small>Jev prediction model</small></span></a></div>
    <p>Predict runs at the edge on Cloudflare Workers. Workers AI connects the request to Jev through AI Gateway. The browser integration stays small; the site owns the response.</p>
    <h2>Deploy it yourself</h2>
    <p>Install the Worker in your own Cloudflare account when you are ready. Your endpoint, billing, and limits stay with you. The same open action API works with your own events and visitor flows.</p>
    <h2>What Predict does not do</h2>
    <p>It does not write copy, open popups, or change your page. It returns a signal. Your code owns the response.</p>
  </article>
</main>
<style>
:global(*){box-sizing:border-box}:global(body){margin:0;background:#f7f9fc;color:#172033;font-family:'Google Sans Flex',ui-sans-serif,system-ui,sans-serif}main{max-width:1180px;margin:auto;padding:25px 38px 80px}header{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #dfe4ec;padding-bottom:22px}header a{color:#334a78;text-decoration:none;font-size:13px}nav{display:flex;gap:18px;align-items:center}.logo{color:#172033!important;font-size:21px!important;font-weight:600}.logo span{color:#635bff;margin-left:4px}article{max-width:820px;padding-top:80px}.eyebrow{color:#635bff;font:11px ui-monospace,monospace;}h1{font-size:clamp(42px,7vw,68px);line-height:.96;letter-spacing:-.07em;margin:20px 0}.cta a{display:inline-block;background:#635bff;color:white;padding:12px 16px;border-radius:5px;text-decoration:none;font-weight:600}.lead{color:#69778a;font-size:20px;line-height:1.5;max-width:650px}h2{font-size:26px;;margin:52px 0 12px}p{line-height:1.6;color:#536177}pre{overflow:auto;background:#172033;color:#f7f9fc;border-radius:7px;padding:20px;font:13px/1.7 'Google Sans Mono',ui-monospace,monospace}code{font:inherit;color:#635bff}pre code{color:#d7e3f4}.kw{color:#c792ea}.fn{color:#82aaff}.key{color:#9cdcfe}.str{color:#c3e88d}li{color:#536177;line-height:2}
</style>
