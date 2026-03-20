import React from "react";
import Plot from "react-plotly.js";
import { PipelineResponse, SignalResponse } from "@/lib/types";
import { PLOTLY_LAYOUT_DEFAULTS, PLOTLY_CONFIG } from "@/lib/plotly-theme";

interface AnomalyBarProps {
  pipelineResult: PipelineResponse | null;
  signalData: SignalResponse | null;
}

function AnomalyBarInner({ pipelineResult, signalData }: AnomalyBarProps) {
  if (!pipelineResult) return null;

  const x = pipelineResult.window_centers;
  const anomalyVals = pipelineResult.anomalies.map((a) => (a ? 1 : 0));
  const colors = pipelineResult.anomalies.map((a) =>
    a ? "rgba(239, 68, 68, 0.7)" : "rgba(34, 197, 94, 0.35)"
  );

  const regimeBoundaries: Partial<Plotly.Shape>[] = [];
  if (signalData) {
    for (let i = 1; i < signalData.regime_labels.length; i++) {
      if (signalData.regime_labels[i] !== signalData.regime_labels[i - 1]) {
        regimeBoundaries.push({
          type: "line",
          xref: "x",
          yref: "paper",
          x0: i,
          x1: i,
          y0: 0,
          y1: 1,
          line: { color: "#ef4444", dash: "dash", width: 1 },
        });
      }
    }
  }

  return (
    <Plot
      data={[
        {
          x,
          y: anomalyVals,
          type: "bar",
          marker: { color: colors },
          hovertemplate: "center=%{x}<br>anomaly=%{y}<extra></extra>",
        },
      ]}
      layout={{
        ...PLOTLY_LAYOUT_DEFAULTS,
        height: 120,
        margin: { l: 48, r: 12, t: 18, b: 32 },
        title: {
          text: "Anomaly Flags",
          font: { size: 10, color: "#e2e8f0", family: "\"Geist Mono Variable\", monospace" },
          x: 0.005,
          xanchor: "left",
        },
        xaxis: {
          ...PLOTLY_LAYOUT_DEFAULTS.xaxis,
          title: { text: "t (window center)", font: { size: 10, color: "#e2e8f0" } },
        },
        yaxis: {
          ...PLOTLY_LAYOUT_DEFAULTS.yaxis,
          visible: true,
          range: [0, 1.2],
          tickvals: [0, 1],
          ticktext: ["normal", "anomaly"],
          title: { text: "" },
        },
        shapes: regimeBoundaries,
        bargap: 0,
        showlegend: false,
      }}
      config={PLOTLY_CONFIG}
      useResizeHandler
      style={{ width: "100%" }}
    />
  );
}

export default React.memo(AnomalyBarInner);
