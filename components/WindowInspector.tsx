import { useState, useCallback, useEffect, useRef } from "react";
import Plot from "react-plotly.js";
import { PipelineState } from "@/hooks/usePipeline";
import { PLOTLY_LAYOUT_DEFAULTS, PLOTLY_CONFIG } from "@/lib/plotly-theme";
import EmbeddingPlot3D from "./EmbeddingPlot3D";
import PersistenceDiagram from "./PersistenceDiagram";
import ExpandablePanel, { useIsExpanded } from "./ExpandablePanel";
import LoadingOverlay from "./LoadingOverlay";

/** Extracted so it can read ExpandedContext via useIsExpanded */
function WindowSignalChart({
  segX,
  segment,
  isStale,
}: {
  segX: number[];
  segment: number[];
  isStale: boolean;
}) {
  const isExpanded = useIsExpanded();
  const chartHeight = isExpanded
    ? Math.round(window.innerHeight * 0.75 - 80)
    : 260;

  return (
    <div className="relative">
      {isStale && <LoadingOverlay message="Adjusting..." />}
      <Plot
        data={[
          {
            x: segX,
            y: segment,
            type: "scatter",
            mode: "lines",
            line: { width: 1.5, color: "#4a6cf7" },
          },
        ]}
        layout={{
          ...PLOTLY_LAYOUT_DEFAULTS,
          height: chartHeight,
          margin: { l: 40, r: 10, t: 4, b: 32 },
          xaxis: {
            ...PLOTLY_LAYOUT_DEFAULTS.xaxis,
            title: { text: "t", font: { size: 9, color: "#e2e8f0" } },
          },
          yaxis: {
            ...PLOTLY_LAYOUT_DEFAULTS.yaxis,
            title: { text: "", font: { size: 9 } },
          },
        }}
        config={PLOTLY_CONFIG}
        useResizeHandler
        style={{ width: "100%" }}
      />
    </div>
  );
}

interface WindowInspectorProps {
  state: PipelineState;
}

export default function WindowInspector({ state }: WindowInspectorProps) {
  const { pipelineResult, signalData, pipelineParams } = state;

  // LOCAL slider state — never touches parent on every tick
  const [localIdx, setLocalIdx] = useState(0);
  const [debouncedIdx, setDebouncedIdx] = useState(0);
  const lastFetchedIdx = useRef(-1);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset to 0 when pipeline result changes
  useEffect(() => {
    setLocalIdx(0);
    setDebouncedIdx(0);
    lastFetchedIdx.current = -1;
    if (pipelineResult && signalData) {
      state.fetchWindowData(0);
      lastFetchedIdx.current = 0;
    }
  }, [pipelineResult, signalData]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  // Handler: update local state instantly, debounce chart + API fetch
  const handleSlider = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const idx = parseInt(e.target.value);
      setLocalIdx(idx);
      state.fetchWindowData(idx);

      // Debounce local chart update
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        setDebouncedIdx(idx);
      }, 200);
    },
    [state.fetchWindowData] // eslint-disable-line react-hooks/exhaustive-deps
  );

  if (!pipelineResult || !signalData) return null;

  // Use debouncedIdx for chart data (avoids Plotly re-render on every slider tick)
  const windowStart = debouncedIdx * pipelineParams.step_size;
  const windowEnd = windowStart + pipelineParams.window_size;
  const segment = signalData.signal.slice(windowStart, windowEnd);
  const segX = Array.from(
    { length: segment.length },
    (_, i) => windowStart + i
  );

  // For slider label use localIdx (instant feedback)
  const labelStart = localIdx * pipelineParams.step_size;
  const labelEnd = labelStart + pipelineParams.window_size;
  const isAnomaly = pipelineResult.anomalies[localIdx];
  const isWindowSignalStale = localIdx !== debouncedIdx;

  return (
    <>
      {/* Slider row — pure DOM, no Plotly */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="text-[11px] whitespace-nowrap flex items-center gap-1.5"
          style={{ fontFamily: "var(--mono)" }}
        >
          <span style={{ color: "var(--muted)" }}>Window</span>
          <span>
            {localIdx + 1}/{pipelineResult.num_windows}
          </span>
          <span style={{ color: "var(--muted)" }}>
            t=[{labelStart},{labelEnd})
          </span>
          {isAnomaly && (
            <span className="text-red-500 font-medium ml-1">Anomaly</span>
          )}
        </div>
        <input
          type="range"
          className="flex-1"
          min={0}
          max={pipelineResult.num_windows - 1}
          step={1}
          value={localIdx}
          onInput={handleSlider as unknown as React.FormEventHandler}
          onChange={handleSlider}
        />
      </div>

      {/* Three panels inline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-start">
        {/* Signal segment — debounced update */}
        <ExpandablePanel>
          <div className="sec-label mb-1">Window Signal</div>
          <WindowSignalChart
            segX={segX}
            segment={segment}
            isStale={isWindowSignalStale}
          />
        </ExpandablePanel>

        {/* Embedding — uses parent's fetched data */}
        <ExpandablePanel>
          <div className="sec-label mb-1">Takens Embedding</div>
          <EmbeddingPlot3D
            embedding={state.windowEmbedding}
            isLoading={state.isLoadingWindow}
          />
        </ExpandablePanel>

        {/* Persistence — uses parent's fetched data */}
        <ExpandablePanel>
          <div className="sec-label mb-1">Persistence Diagram</div>
          <PersistenceDiagram
            persistence={state.windowPersistence}
            isLoading={state.isLoadingWindow}
          />
        </ExpandablePanel>
      </div>
    </>
  );
}
