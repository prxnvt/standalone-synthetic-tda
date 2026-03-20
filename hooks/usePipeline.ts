import { useState, useCallback, useRef, useEffect } from "react";
import { api, streamPipeline } from "@/lib/api";
import {
  SignalType,
  SignalParams,
  SignalResponse,
  PipelineParams,
  PipelineResponse,
  EmbeddingResponse,
  PersistenceResponse,
  DEFAULT_SIGNAL_PARAMS,
  DEFAULT_PIPELINE_PARAMS,
} from "@/lib/types";

const STORAGE_KEY = "tda-pipeline-state";

interface PersistedState {
  signalParams: SignalParams;
  signalData: SignalResponse | null;
  pipelineParams: PipelineParams;
  pipelineResult: PipelineResponse | null;
}

function loadPersisted(): PersistedState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      console.log("[usePipeline] Restored from sessionStorage:", {
        hasSignal: !!parsed.signalData,
        hasPipeline: !!parsed.pipelineResult,
      });
      return parsed;
    }
  } catch (e) {
    console.warn("[usePipeline] Failed to load persisted state:", e);
  }
  console.log("[usePipeline] No persisted state found, using defaults");
  return null;
}

function savePersisted(s: PersistedState) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {}
}

export interface PipelineState {
  signalParams: SignalParams;
  signalData: SignalResponse | null;
  isGenerating: boolean;
  isSignalStale: boolean;

  pipelineParams: PipelineParams;
  pipelineResult: PipelineResponse | null;
  isRunning: boolean;
  isPipelineStale: boolean;

  windowEmbedding: EmbeddingResponse | null;
  windowPersistence: PersistenceResponse | null;
  isLoadingWindow: boolean;

  error: string | null;
  progressMessage: string;
  progressPct: number;

  generateSignal: () => Promise<void>;
  runPipeline: () => Promise<void>;
  fetchWindowData: (windowIdx: number) => void;
  setSignalType: (type: SignalType) => void;
  updateSignalParams: (params: Record<string, number | string>) => void;
  updateSignalLength: (length: number) => void;
  updateSeed: (seed: number) => void;
  updatePipelineParams: (params: Partial<PipelineParams>) => void;
}

export function usePipeline(): PipelineState {
  console.log("[usePipeline] Hook initializing");
  const persisted = useRef(loadPersisted());

  const [signalParams, setSignalParams] = useState<SignalParams>(
    persisted.current?.signalParams ?? {
      signal_type: "sine_to_noise",
      length: 1000,
      seed: 42,
      params: { ...DEFAULT_SIGNAL_PARAMS.sine_to_noise },
    }
  );

  const [signalData, setSignalData] = useState<SignalResponse | null>(
    persisted.current?.signalData ?? null
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSignalStale, setIsSignalStale] = useState(false);

  const [pipelineParams, setPipelineParams] = useState<PipelineParams>(
    persisted.current?.pipelineParams ?? { ...DEFAULT_PIPELINE_PARAMS }
  );
  const [pipelineResult, setPipelineResult] = useState<PipelineResponse | null>(
    persisted.current?.pipelineResult ?? null
  );
  const [isRunning, setIsRunning] = useState(false);
  const [isPipelineStale, setIsPipelineStale] = useState(false);

  // Persist to sessionStorage so HMR doesn't wipe analysis results
  useEffect(() => {
    savePersisted({ signalParams, signalData, pipelineParams, pipelineResult });
  }, [signalParams, signalData, pipelineParams, pipelineResult]);

  const [windowEmbedding, setWindowEmbedding] =
    useState<EmbeddingResponse | null>(null);
  const [windowPersistence, setWindowPersistence] =
    useState<PersistenceResponse | null>(null);
  const [isLoadingWindow, setIsLoadingWindow] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState("");
  const [progressPct, setProgressPct] = useState(0);

  // Use refs for values needed in fetchWindowData to avoid stale closures
  const signalDataRef = useRef(signalData);
  signalDataRef.current = signalData;
  const pipelineParamsRef = useRef(pipelineParams);
  pipelineParamsRef.current = pipelineParams;
  const fetchIdRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const generateSignal = useCallback(async () => {
    console.group("[usePipeline] generateSignal");
    console.log("params:", signalParams);
    setIsGenerating(true);
    setError(null);
    setPipelineResult(null);
    setIsPipelineStale(false);
    setWindowEmbedding(null);
    setWindowPersistence(null);
    try {
      const data = await api.generateSignal(signalParams);
      console.log("signal received:", data.length, "points,", data.regime_names.length, "regimes");
      setSignalData(data);
      setIsSignalStale(false);
    } catch (e) {
      console.error("generateSignal failed:", e);
      setError(e instanceof Error ? e.message : "Failed to generate signal");
    } finally {
      setIsGenerating(false);
      console.groupEnd();
    }
  }, [signalParams]);

  const runPipeline = useCallback(async () => {
    if (!signalData) {
      console.warn("[usePipeline] runPipeline called with no signal data");
      return;
    }
    console.group("[usePipeline] runPipeline");
    console.log("signal length:", signalData.signal.length, "params:", pipelineParams);
    setIsRunning(true);
    setError(null);
    setProgressMessage("Initializing...");
    setProgressPct(0);
    try {
      await streamPipeline(signalData.signal, pipelineParams, (event) => {
        setProgressMessage(event.step);
        setProgressPct(event.progress);
        if (event.result) {
          console.log("pipeline result received:", event.result.num_windows, "windows");
          setPipelineResult(event.result);
          setIsPipelineStale(false);
        }
      });
    } catch (e) {
      console.error("runPipeline failed:", e);
      setError(e instanceof Error ? e.message : "Pipeline failed");
    } finally {
      setIsRunning(false);
      setProgressMessage("");
      setProgressPct(0);
      console.groupEnd();
    }
  }, [signalData, pipelineParams]);

  // Debounced window data fetch — called by WindowInspector's local slider
  const fetchWindowData = useCallback((windowIdx: number) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const sd = signalDataRef.current;
      const pp = pipelineParamsRef.current;
      if (!sd) return;

      const start = windowIdx * pp.step_size;
      const end = start + pp.window_size;
      const segment = sd.signal.slice(start, end);
      if (segment.length === 0) return;

      const fetchId = ++fetchIdRef.current;
      console.log(`[usePipeline] fetchWindowData(${windowIdx}) → segment [${start}:${end}], fetchId=${fetchId}`);
      setIsLoadingWindow(true);

      try {
        const embedding = await api.getEmbedding(
          segment,
          pp.embedding_delay,
          pp.embedding_dimension,
          pp.subsample_size
        );
        // Only apply if this is still the latest request
        if (fetchId !== fetchIdRef.current) {
          console.log(`[usePipeline] fetchWindowData(${windowIdx}) — stale (fetchId ${fetchId} vs ${fetchIdRef.current}), dropping`);
          return;
        }
        const persistence = await api.computePersistence(
          embedding.points,
          pp.max_simplex_dimension,
          pp.max_edge_length
        );
        if (fetchId !== fetchIdRef.current) return;
        console.log(`[usePipeline] fetchWindowData(${windowIdx}) — done, ${embedding.num_points} pts, ${persistence.pairs.length} pairs`);
        setWindowEmbedding(embedding);
        setWindowPersistence(persistence);
      } catch (e) {
        console.error(`[usePipeline] fetchWindowData(${windowIdx}) failed:`, e);
      } finally {
        if (fetchId === fetchIdRef.current) {
          setIsLoadingWindow(false);
        }
      }
    }, 250);
  }, []);

  const markSignalStale = useCallback(() => {
    if (signalDataRef.current) setIsSignalStale(true);
  }, []);

  const markPipelineStale = useCallback(() => {
    setIsPipelineStale((prev) => prev || !!pipelineResult);
  }, [pipelineResult]);

  const setSignalType = useCallback(
    (type: SignalType) => {
      console.log("[usePipeline] setSignalType:", type);
      setSignalParams((prev) => ({
        ...prev,
        signal_type: type,
        params: { ...DEFAULT_SIGNAL_PARAMS[type] },
      }));
      markSignalStale();
    },
    [markSignalStale]
  );

  const updateSignalParams = useCallback(
    (params: Record<string, number | string>) => {
      setSignalParams((prev) => ({
        ...prev,
        params: { ...prev.params, ...params },
      }));
      markSignalStale();
    },
    [markSignalStale]
  );

  const updateSignalLength = useCallback(
    (length: number) => {
      console.log("[usePipeline] updateSignalLength:", length);
      setSignalParams((prev) => ({ ...prev, length }));
      markSignalStale();
    },
    [markSignalStale]
  );

  const updateSeed = useCallback(
    (seed: number) => {
      console.log("[usePipeline] updateSeed:", seed);
      setSignalParams((prev) => ({ ...prev, seed }));
      markSignalStale();
    },
    [markSignalStale]
  );

  const updatePipelineParams = useCallback(
    (params: Partial<PipelineParams>) => {
      console.log("[usePipeline] updatePipelineParams:", params);
      setPipelineParams((prev) => ({ ...prev, ...params }));
      markPipelineStale();
    },
    [markPipelineStale]
  );

  return {
    signalParams,
    signalData,
    isGenerating,
    isSignalStale,
    pipelineParams,
    pipelineResult,
    isRunning,
    isPipelineStale,
    windowEmbedding,
    windowPersistence,
    isLoadingWindow,
    error,
    progressMessage,
    progressPct,
    generateSignal,
    runPipeline,
    fetchWindowData,
    setSignalType,
    updateSignalParams,
    updateSignalLength,
    updateSeed,
    updatePipelineParams,
  };
}
