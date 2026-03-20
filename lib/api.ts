import {
  SignalParams,
  SignalResponse,
  PersistenceResponse,
  EmbeddingResponse,
  PipelineParams,
  PipelineResponse,
} from "./types";

// In dev, Vite proxies /api → localhost:8000, so use relative URLs (no CORS).
// In production, use the env var.
const API_BASE = import.meta.env.DEV
  ? ""
  : (import.meta.env.VITE_API_URL || "http://localhost:8000");

console.log("[api] API_BASE resolved to:", JSON.stringify(API_BASE), import.meta.env.DEV ? "(dev proxy)" : "(production)");

async function post<T>(endpoint: string, body: unknown): Promise<T> {
  const url = `${API_BASE}/api${endpoint}`;
  console.log(`[api] POST ${url}`, body);
  const t0 = performance.now();

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error(`[api] POST ${url} — network error:`, err);
    throw err;
  }

  const elapsed = (performance.now() - t0).toFixed(0);

  if (!res.ok) {
    const text = await res.text();
    console.error(`[api] POST ${url} — ${res.status} (${elapsed}ms):`, text);
    throw new Error(`API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  console.log(`[api] POST ${url} — 200 (${elapsed}ms)`, data);
  return data;
}

export const api = {
  generateSignal: (params: SignalParams) =>
    post<SignalResponse>("/generate-signal", params),

  computePersistence: (
    points: number[][],
    maxDim: number,
    maxEdge: number
  ) =>
    post<PersistenceResponse>("/compute-persistence", {
      points,
      max_dimension: maxDim,
      max_edge_length: maxEdge,
      metric: "euclidean",
    }),

  getEmbedding: (
    segment: number[],
    delay: number,
    dim: number,
    subsample: number
  ) =>
    post<EmbeddingResponse>("/embedding", {
      signal_segment: segment,
      delay,
      dimension: dim,
      subsample,
    }),

  runPipeline: (signal: number[], params: PipelineParams) =>
    post<PipelineResponse>("/run-pipeline", { signal, ...params }),

  // ── Future API stubs (see docs/API_concerns.md) ──────────────────────
  // These trace-only helpers exist so console output shows when future
  // endpoints get wired up.  They are NOT called anywhere yet.

  /** Placeholder: batch pipeline over multiple signals */
  runBatchPipeline: (...args: unknown[]) => {
    console.warn("[api] runBatchPipeline called but NOT IMPLEMENTED", args);
    return Promise.reject(new Error("Not implemented"));
  },

  /** Placeholder: export results */
  exportResults: (...args: unknown[]) => {
    console.warn("[api] exportResults called but NOT IMPLEMENTED", args);
    return Promise.reject(new Error("Not implemented"));
  },

  /** Placeholder: health check */
  healthCheck: async () => {
    const url = `${API_BASE}/api/health`;
    console.log(`[api] GET ${url}`);
    try {
      const res = await fetch(url);
      const data = await res.json();
      console.log(`[api] GET ${url} —`, res.status, data);
      return data;
    } catch (err) {
      console.error(`[api] GET ${url} — network error:`, err);
      throw err;
    }
  },
};

export type PipelineProgressEvent = {
  step: string;
  progress: number;
  result?: PipelineResponse;
};

export async function streamPipeline(
  signal: number[],
  params: PipelineParams,
  onEvent: (e: PipelineProgressEvent) => void
): Promise<void> {
  const url = `${API_BASE}/api/run-pipeline-stream`;
  console.log(`[api] SSE POST ${url}`, { signalLength: signal.length, ...params });
  const t0 = performance.now();

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signal, ...params }),
    });
  } catch (err) {
    console.error(`[api] SSE POST ${url} — network error:`, err);
    throw err;
  }

  if (!res.ok) {
    const text = await res.text();
    console.error(`[api] SSE POST ${url} — ${res.status}:`, text);
    throw new Error(`API error ${res.status}: ${text}`);
  }

  console.log(`[api] SSE stream opened (${(performance.now() - t0).toFixed(0)}ms)`);

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let eventCount = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";
    for (const part of parts) {
      if (part.startsWith("data: ")) {
        const event = JSON.parse(part.slice(6));
        eventCount++;
        console.log(`[api] SSE event #${eventCount}:`, event.step, `${event.progress}%`);
        onEvent(event);
      }
    }
  }

  console.log(`[api] SSE stream closed — ${eventCount} events, ${(performance.now() - t0).toFixed(0)}ms total`);
}
