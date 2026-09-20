export type PageType = 'essay' | 'pricing' | 'checkout' | 'other';
export type TriggerReason = string;

export type PredictState = {
  page: { path: string; title: string; type: PageType };
  session: { t_ms: number; pages: number; referrer_kind: 'search' | 'social' | 'direct' | 'internal' | 'unknown' };
  engagement: { scroll_max: number; scroll_now: number; clicks: number; keys: number; cta_hover_ms: number; cta_clicked: boolean };
  motion: { idle_ms: number; heading_to_exit: boolean; tab_hidden: boolean; visibility: 'visible' | 'hidden'; rage_clicks: number };
  form: { present: boolean; started: boolean; fields_filled: number; fields_total: number; last_field: string | null; ms_since_input: number } | null;
};

export type Prediction = {
  t: number;
  model: string;
  next: string;
  confidence: number;
  reason: TriggerReason;
  heads: {
    bounce: { noul: number; mode: 'engaged' | 'stalled' | 'exiting'; mode_p: Record<string, number> };
    intent: { choice: string; confidence: number };
    friction: { confused: number; rage: number; abandon_form: number };
    interrupt: { noul: number };
    next: { choice: string; confidence: number };
  };
};

export type PredictRequest = { session?: string; reason: TriggerReason; state: PredictState; metadata?: Record<string, unknown>; outcomes?: string[] };
