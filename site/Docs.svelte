<script lang="ts">
  import Nav from './Nav.svelte';
</script>

<svelte:head><title>Predict docs — browser integration</title><meta name="description" content="Install Predict, send your own action and metadata, and use the returned next-step signal." /><link rel="canonical" href="https://predict.coey.dev/docs" /><meta name="theme-color" content="#635bff" /><meta property="og:title" content="Predict docs" /><meta property="og:description" content="Install Predict and use a small signal for the next step on your website." /><meta property="og:url" content="https://predict.coey.dev/docs" /><link rel="manifest" href="/manifest.webmanifest" /><link rel="stylesheet" href="/tailwind.css" /><link rel="icon" href="/icon.jpg" /><link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" /><link href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:opsz,wght@6..144,400..700&family=Google+Sans+Mono:wght@400;500&display=swap" rel="stylesheet" /></svelte:head>
<main class="mx-auto max-w-[1180px] px-[38px] py-[25px] pb-20 max-[800px]:px-5">
  <Nav />
  <article class="max-w-[820px] pt-20 @container">
    <p class="eyebrow">Predict docs</p>
    <h1 class="font-bold">Ask what a visitor will do next.</h1>
    <p class="lead">Predict reads page activity and returns one suggested next step. Your site decides what to show.</p>
    <p class="cta"><a href="https://github.com/acoyfellow/predict" target="_blank" rel="noreferrer">Install your own Worker on GitHub →</a></p>
    <h2>Install</h2>
    <div class="install-choice"><div><strong>Try the hosted demo</strong><p>Use the hosted snippet to test Predict. The hosted service limits requests. Use it for evaluation.</p><pre><code>&lt;script src="https://predict.coey.dev/snippet.js"&gt;&lt;/script&gt;</code></pre></div><div class="mt-8 border-t border-slate-200 pt-8 pb-2"><strong class="block">Bring Predict to your Cloudflare account</strong><p>For your own service, install the Worker in your Cloudflare account. You control the endpoint, AI Gateway, billing, limits, and data.</p><p><a href="https://deploy.workers.cloudflare.com/?url=https://github.com/acoyfellow/predict" target="_blank" rel="noreferrer">Install on my Cloudflare Workers →</a></p><pre><code>npm install github:acoyfellow/predict
npx wrangler deploy</code></pre></div></div>
    <p>Use the hosted snippet to try Predict. Deploy the Worker when you need your own endpoint and limits.</p>
    <h2>Make your first prediction</h2>
    <pre><code><span class="kw">const</span> prediction = <span class="kw">await</span> <span class="fn">Predict</span>(&#123;
  <span class="key">action</span>: <span class="str">"pricing_confusion"</span>,
  <span class="key">outcomes</span>: [<span class="str">"compare"</span>, <span class="str">"clarify"</span>, <span class="str">"none"</span>],
  <span class="key">metadata</span>: &#123;
    <span class="key">experiment</span>: <span class="str">"comparison-v2"</span>
  &#125;
&#125;);</code></pre>
    <p><code>action</code> is the only required field. Use it to name the event that caused the request. <code>outcomes</code> is optional. When you send it, Jev chooses one value from the list. <code>endpoint</code> defaults to <code>"/predict"</code>. You can set it to your Worker URL. <code>session</code> is optional. If you omit it, the Worker creates a UUID. <code>metadata</code> is optional context from your site.</p>
    <h2>Input schema</h2>
    <pre><code>&#123;
  <span class="key">action</span>: <span class="str">string</span>,
  <span class="key">endpoint</span>?: <span class="str">string</span>,
  <span class="key">session</span>?: <span class="str">string</span>,
  <span class="key">outcomes</span>?: <span class="str">string[]</span>,
  <span class="key">metadata</span>?: <span class="str">object</span>
&#125;</code></pre>
    <p>Predict builds page, engagement, motion, and form data in the browser. It sends your metadata with that data to help Jev choose an outcome. Do not send secrets, form values, or sensitive personal data.</p>
    <h2>Add context and choices</h2>
    <pre><code><span class="key">metadata</span>: &#123;
  <span class="key">plan</span>: <span class="str">"team"</span>,
  <span class="key">experiment</span>: <span class="str">"comparison-v2"</span>
&#125;</code></pre>
    <p>Metadata comes from your site. Predict sends it with the request. Do not send form values, secrets, or sensitive personal data.</p>
    <h2>Send the result to your analytics</h2>
    <p>Predict returns a result. Your site decides whether to record it. Send the fields you need to your analytics system.</p>
    <pre><code><span class="fn">analytics</span>.<span class="fn">track</span>(<span class="str">"prediction_received"</span>, &#123;
  <span class="key">action</span>: prediction.reason,
  <span class="key">outcome</span>: prediction.next,
  <span class="key">confidence</span>: prediction.confidence
&#125;);</code></pre>
    <h2>Take action in your code</h2>
    <p>Predict does not change your page. Your code decides what each outcome does.</p>
    <pre><code><span class="kw">if</span> (prediction.next === <span class="str">"compare"</span>) &#123;
  <span class="fn">showPlanComparison</span>();
&#125;

<span class="kw">if</span> (prediction.next === <span class="str">"clarify"</span>) &#123;
  <span class="fn">showHelpfulHint</span>();
&#125;</code></pre>
    <h2>Output schema</h2>
    <pre><code>&#123;
  <span class="key">next</span>: <span class="str">string</span>,
  <span class="key">confidence</span>: <span class="str">number</span>,
  <span class="key">reason</span>: <span class="str">string</span>,
  <span class="key">model</span>: <span class="str">string</span>,
  <span class="key">t</span>: <span class="str">number</span>,
&#125;</code></pre>
    <p><code>next</code> is one of the outcomes you supplied. <code>confidence</code> is Jev's confidence in that choice. Your code decides whether to act.</p>
    <h2>Choose your action label</h2>
    <p>Actions are open labels from your site. Name them after the event that caused the prediction request. Supply the possible <code>next</code> values in <code>outcomes</code>. Jev chooses the most probable value from that list.</p>
    <pre><code><span class="key">action</span>: <span class="str">"pricing_confusion"</span>
<span class="key">action</span>: <span class="str">"checkout_stall"</span>
<span class="key">action</span>: <span class="str">"returning_customer"</span></code></pre>
    <p>The response repeats your action in <code>reason</code>. The response field <code>next</code> is separate. It is the outcome Jev selected.</p>
    <p>Metadata is limited to JSON objects up to 8 KB. Predict does not store it by default.</p>
    <h2>Deploy it yourself</h2>
    <p>Install the Worker in your Cloudflare account when you need your own endpoint. Your account controls billing and limits. You can use any action label from your site.</p>
  </article>
</main>


<style>
:global(*){box-sizing:border-box}:global(body){margin:0;background:#f7f9fc;color:#172033;font-family:'Google Sans Flex',ui-sans-serif,system-ui,sans-serif}main{max-width:1180px;margin:auto;padding:25px 38px 80px}header{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #dfe4ec;padding-bottom:22px}header a{color:#334a78;text-decoration:none;font-size:13px}nav{display:flex;gap:18px;align-items:center}.logo{color:#172033!important;font-size:21px!important;font-weight:600}.logo span{color:#635bff;margin-left:4px}article{max-width:820px;padding-top:80px}.eyebrow{color:#635bff;font:11px ui-monospace,monospace;}h1{font-size:clamp(42px,7vw,68px);line-height:.96;letter-spacing:-.07em;margin:20px 0}.cta a{display:inline-block;background:#635bff;color:white;padding:12px 16px;border-radius:5px;text-decoration:none;font-weight:600}.lead{color:#69778a;font-size:20px;line-height:1.5;max-width:650px}h2{font-size:26px;;margin:52px 0 12px}p{line-height:1.6;color:#536177}pre{overflow:auto;background:#172033;color:#f7f9fc;border-radius:7px;padding:20px;font:13px/1.7 'Google Sans Mono',ui-monospace,monospace}code{font:inherit;color:#635bff}pre code{color:#d7e3f4}.kw{color:#c792ea}.fn{color:#82aaff}.key{color:#9cdcfe}.str{color:#c3e88d}li{color:#536177;line-height:2}
</style>
