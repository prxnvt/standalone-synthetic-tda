import React from "react";
import Plot from "react-plotly.js";
import { SignalResponse, PipelineResponse, REGIME_COLORS } from "@/lib/types";
import { PLOTLY_LAYOUT_DEFAULTS, PLOTLY_CONFIG } from "@/lib/plotly-theme";

interface SignalPlotProps {
  signalData: SignalResponse | null;
  pipelineResult: PipelineResponse | null;
  selectedWindowIndex: number;
  windowSize: number;
  stepSize: number;
  onWindowClick?: (index: number) => void;
}

function SignalPlotInner({
  signalData,
  pipelineResult,
  selectedWindowIndex,
  windowSize,
  stepSize,
  onWindowClick,
}: SignalPlotProps) {
  if (!signalData) return null;

  const x = Array.from({ length: signalData.length }, (_, i) => i);

  const shapes: Partial<Plotly.Shape>[] = [];
  let currentRegime = signalData.regime_labels[0];
  let regimeStart = 0;

  for (let i = 1; i <= signalData.length; i++) {
    if (
      i === signalData.length ||
      signalData.regime_labels[i] !== currentRegime
    ) {
      shapes.push({
        type: "rect",
        xref: "x",
        yref: "paper",
        x0: regimeStart,
        x1: i,
        y0: 0,
        y1: 1,
        fillcolor: REGIME_COLORS[currentRegime] || REGIME_COLORS[0],
        line: { width: 0 },
        layer: "below",
      });
      if (i < signalData.length) {
        currentRegime = signalData.regime_labels[i];
        regimeStart = i;
      }
    }
  }

  if (pipelineResult) {
    pipelineResult.anomalies.forEach((isAnomaly, i) => {
      if (isAnomaly) {
        const center = pipelineResult.window_centers[i];
        shapes.push({
          type: "rect",
          xref: "x",
          yref: "paper",
          x0: center - stepSize / 2,
          x1: center + stepSize / 2,
          y0: 0,
          y1: 1,
          fillcolor: "rgba(239, 68, 68, 0.2)",
          line: { width: 0 },
          layer: "below",
        });
      }
    });
  }

  return (
    <Plot
      data={[
        {
          x,
          y: signalData.signal,
          type: "scatter",
          mode: "lines",
          line: { width: 1, color: "#e2e8f0" },
          hovertemplate: "t=%{x}<br>value=%{y:.4f}<extra></extra>",
        },
      ]}
      layout={{
        ...PLOTLY_LAYOUT_DEFAULTS,
        height: 200,
        margin: { l: 44, r: 12, t: 6, b: 32 },
        xaxis: {
          ...PLOTLY_LAYOUT_DEFAULTS.xaxis,
          title: { text: "t", font: { size: 10 } },
          zeroline: false,
        },
        yaxis: {
          ...PLOTLY_LAYOUT_DEFAULTS.yaxis,
          title: { text: "", font: { size: 10 } },
          zeroline: false,
        },
        shapes,
        hovermode: "closest",
      }}
      config={PLOTLY_CONFIG}
      useResizeHandler
      style={{ width: "100%" }}
    />
  );
}

export default React.memo(SignalPlotInner);
