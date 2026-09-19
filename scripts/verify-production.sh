#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
grep -q '"AI_GATEWAY_ID": "default"' wrangler.jsonc && ! grep -q '"AI_GATEWAY_ID": "default".*PREDICT_STUB' wrangler.jsonc
bun run check
bun run test
curl -fsS https://predict.coey.dev/ >/dev/null
curl -fsS https://predict.coey.dev/docs >/dev/null
response=$(curl -fsS -X POST https://predict.coey.dev/predict -H 'content-type: application/json' --data '{"session":"gate-proof","reason":"pricing_confusion","state":{"page":{"path":"/pricing","title":"Plans","type":"pricing"},"session":{"t_ms":8200,"pages":1,"referrer_kind":"direct"},"engagement":{"scroll_max":0.18,"scroll_now":0.18,"clicks":1,"keys":0,"cta_hover_ms":0,"cta_clicked":false},"motion":{"idle_ms":8200,"heading_to_exit":false,"tab_hidden":false,"visibility":"visible","rage_clicks":0},"form":null}}')
printf '%s\n' "$response" | grep -q 'jev-1.13.0'
printf '%s\n' "$response" | grep -q '"next"'
