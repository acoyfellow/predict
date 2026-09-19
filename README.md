# Predict

Predict is a small browser signal for the next useful step on a website.

Send an action and optional context. Predict returns a structured prediction. Your code decides what to show.

```js
const prediction = await Predict({
  endpoint: 'https://your-worker.example.com/predict',
  session: crypto.randomUUID(),
  action: 'pricing_confusion',
  metadata: {
    experiment: 'comparison-v2'
  }
});

if (prediction.next === 'compare') {
  showPlanComparison();
}
```

## Why Predict

- Predicts a next step, not page copy.
- Uses compact page and session signals.
- Accepts any caller-defined action label.
- Accepts optional customer metadata.
- Returns `next` and `confidence` at the top level.
- Keeps the site in control of the response.

## Try the demo

Open [predict.coey.dev](https://predict.coey.dev/). Choose Compare, Stall, or Leave to see a complete request, prediction, and customer-facing response.

Read the [integration docs](https://predict.coey.dev/docs) for the full request and response contract.

## Install your own Worker

Use the GitHub **Install on Workers** button to deploy your own endpoint. Your account owns the endpoint, billing, rate limits, model configuration, and data retention.

After deployment, load the browser snippet from your Worker:

```html
<script src="https://your-worker.example.com/snippet.js"></script>
<script>
  const prediction = await Predict({
    endpoint: 'https://your-worker.example.com/predict',
    session: crypto.randomUUID(),
    action: 'checkout_stall',
    metadata: {
      plan: 'team'
    }
  });

  if (prediction.next === 'clarify') {
    showHelpfulHint();
  }
</script>
```

`action` is an open label from your site. It is not an allowlist. Use names such as `pricing_confusion`, `checkout_stall`, `returning_customer`, or your own event name.

`metadata` is optional customer context. It must be a JSON object no larger than 8 KB. Predict does not collect or invent it. Do not send secrets, form values, or sensitive personal data.

## What Predict sends by default

The Worker receives a compact state containing:

- page path, title, and type
- time on page and page count
- referrer category
- scroll depth and position
- click and key counts
- CTA interaction
- idle time
- tab visibility and exit intent
- rage-click count
- optional form progress

Predict does not send page text, form values, raw keystrokes, mouse coordinates, cookies, or a user-agent value in the prediction body.

## Local development

```sh
bun install
bun run dev -- --local --port 8787
```

Open [http://127.0.0.1:8787/](http://127.0.0.1:8787/). Local development uses a deterministic stub so the demo works without model access.

## Verification

```sh
bun run test
bun run lint
bun run check
bash scripts/verify-production.sh
```

The production verification checks the homepage, docs, real Jev model response, and top-level `next` field. The hosted production endpoint is rate-limited. A customer-owned Worker provides customer-owned limits and billing.

## Built on

- [Cloudflare Workers](https://workers.cloudflare.com/)
- [Workers AI](https://developers.cloudflare.com/workers-ai/)
- [AI Gateway](https://developers.cloudflare.com/ai-gateway/)
- [TypeSafe Jev](https://developers.cloudflare.com/ai/models/typesafe/jev/)

## Boundaries

Predict does not generate page copy, open popups, or change your page. It returns a signal. Your code owns the response.

MIT license.
