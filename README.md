# Predict

Predict helps a website choose its next useful action.

It has three parts:

- a small browser client;
- a Worker backend that you can host yourself;
- a typed request and response contract.

Your code records the result and decides what to show.

## Try the hosted client

```html
<script src="https://predict.coey.dev/snippet.js"></script>
```

```js
const prediction = await Predict({
  action: "pricing_confusion",
  outcomes: ["compare", "clarify", "none"],
  metadata: {
    experiment: "comparison-v2"
  }
});

if (prediction.next === "compare") {
  showPlanComparison();
}
```

`action` is the only required field. `outcomes` tells Jev which choices it can return. `metadata` is optional context from your site.

## Input

```ts
type PredictInput = {
  action: string;
  outcomes?: string[];
  endpoint?: string;
  session?: string;
  metadata?: Record<string, unknown>;
};
```

- `action` is your label for why you are asking for a prediction.
- `outcomes` is the set of choices for `next`. Jev selects one value from this list.
- `endpoint` defaults to `/predict`.
- `session` is optional. The Worker creates a UUID when you omit it.
- `metadata` is an optional JSON object. It can be up to 8 KB.

Do not send secrets, form values, or sensitive personal data in `metadata`.

## Output

```ts
type Prediction<Outcome extends string = string> = {
  t: number;
  model: string;
  reason: string;
  next: Outcome;
  confidence: number;
};
```

`next` is one of the supplied `outcomes`. Your code decides what that value does.

## Record the result

Predict does not send results to your analytics system. Record the fields you need in your own system:

```js
analytics.track("prediction_received", {
  action: prediction.reason,
  outcome: prediction.next,
  confidence: prediction.confidence
});
```

## Host your own Worker

For production, deploy the Worker in your Cloudflare account:

```sh
npm install github:acoyfellow/predict
npx wrangler deploy
```

Set the Worker secret used for the AI Gateway request:

```sh
npx wrangler secret put AI_GATEWAY_TOKEN
```

Then point the browser client to your Worker:

```js
const prediction = await Predict({
  endpoint: "https://your-worker.example.com/predict",
  action: "checkout_stall",
  outcomes: ["show_shipping_help", "offer_chat", "none"]
});
```

Your account controls the Worker endpoint, rate limit, billing, and AI Gateway credential.

## What the browser sends

Predict builds a small state object from the current page. It includes page, session, engagement, motion, and form state. It does not send page text, form values, raw keystrokes, mouse coordinates, cookies, or a user-agent value in the prediction body.

## Local development

```sh
bun install
bun run dev
```

Open [http://127.0.0.1:5173/](http://127.0.0.1:5173/).

Local development uses the deterministic stub when `PREDICT_STUB=1` or when no local AI Gateway token is set.

## Verification

```sh
bun run check
bun run test
bun run build
bash scripts/verify-production.sh
```

The production verification checks the homepage, docs, real Jev response, and the supplied-outcome constraint.

## Links

- [Hosted demo](https://predict.coey.dev/)
- [Integration docs](https://predict.coey.dev/docs)
- [GitHub repository](https://github.com/acoyfellow/predict)
- [Cloudflare Workers](https://workers.cloudflare.com/)
- [Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/)
- [TypeSafe Jev](https://typesafe.ai/)

MIT license.
