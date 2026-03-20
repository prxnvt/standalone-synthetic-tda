import React, { useRef, useState, useCallback } from "react";
import Plot from "react-plotly.js";
import { EmbeddingResponse } from "@/lib/types";
import { PLOTLY_LAYOUT_DEFAULTS, PLOTLY_CONFIG } from "@/lib/plotly-theme";
import LoadingOverlay from "./LoadingOverlay";
import { useIsExpanded } from "./ExpandablePanel";

const EMBEDDING_CONFIG: Partial<Plotly.Config> = {
  ...PLOTLY_CONFIG,
  scrollZoom: false,
};

const DEFAULT_EYE = { x: 1.5, y: 1.5, z: 1.0 };

const ZoomButton = ({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    title={title}
    style={{
      padding: 3,
      borderRadius: 3,
      background: "rgba(22,27,34,0.85)",
      border: "1px solid var(--panel-border)",
      color: "var(--muted)",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      lineHeight: 1,
    }}
    onMouseEnter={(e) => {
      (e.currentTarget as HTMLButtonElement).style.color = "var(--foreground)";
      (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--sidebar-border)";
    }}
    onMouseLeave={(e) => {
      (e.currentTarget as HTMLButtonElement).style.color = "var(--muted)";
      (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--panel-border)";
    }}
  >
    {children}
  </button>
);

interface EmbeddingPlot3DProps {
  embedding: EmbeddingResponse | null;
  isLoading: boolean;
}

function EmbeddingPlot3DInner({ embedding, isLoading }: EmbeddingPlot3DProps) {
  const isExpanded = useIsExpanded();
  const chartHeight = isExpanded ? Math.round(window.innerHeight * 0.75 - 80) : 260;
  const points = embedding?.points || [];
  const dim = points[0]?.length || 3;

  // Track current camera eye via ref (updated on rotation, doesn't trigger re-render)
  const eyeRef = useRef(DEFAULT_EYE);
  // Only set state when +/- clicked, to push a new camera position to Plotly
  const [forcedEye, setForcedEye] = useState<typeof DEFAULT_EYE | null>(null);

  const handleRelayout = useCallback((event: any) => {
    const cam = event["scene.camera"];
    if (cam?.eye) eyeRef.current = cam.eye;
  }, []);

  const zoomIn = useCallback(() => {
    const e = eyeRef.current;
    const s = 0.8;
    const next = { x: e.x * s, y: e.y * s, z: e.z * s };
    eyeRef.current = next;
    setForcedEye({ ...next });
  }, []);

  const zoomOut = useCallback(() => {
    const e = eyeRef.current;
    const s = 1.25;
    const next = { x: e.x * s, y: e.y * s, z: e.z * s };
    eyeRef.current = next;
    setForcedEye({ ...next });
  }, []);

  if (!embedding && !isLoading) {
    return (
      <div
        className="h-[260px] flex items-center justify-center"
        style={{ fontFamily: "var(--mono)", color: "var(--muted)", fontSize: 11 }}
      >
        Waiting for data
      </div>
    );
  }

  const zoomControls = (
    <div
      style={{
        position: "absolute",
        bottom: 32,
        right: 6,
        zIndex: 3,
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <ZoomButton onClick={zoomIn} title="Zoom in">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </ZoomButton>
      <ZoomButton onClick={zoomOut} title="Zoom out">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </ZoomButton>
    </div>
  );

  return (
    <div className="relative">
      {isLoading && <LoadingOverlay message="Embedding..." />}
      {dim >= 3 ? (
        <>
          <Plot
            data={[
              {
                x: points.map((p) => p[0]),
                y: points.map((p) => p[1]),
                z: points.map((p) => p[2]),
                type: "scatter3d",
                mode: "markers",
                marker: {
                  size: 2,
                  color: points.map((_, i) => i),
                  colorscale: "Viridis",
                  opacity: 0.8,
                },
                hovertemplate: "x=%{x:.3f}<br>y=%{y:.3f}<br>z=%{z:.3f}<extra></extra>",
              },
            ]}
            layout={{
              ...PLOTLY_LAYOUT_DEFAULTS,
              height: chartHeight,
              margin: { l: 0, r: 0, t: 0, b: 0 },
              scene: {
                xaxis: { title: { text: "x(t)", font: { size: 9, color: "#e2e8f0" } }, gridcolor: "#4a5568" },
                yaxis: { title: { text: "x(t+\u03c4)", font: { size: 9, color: "#e2e8f0" } }, gridcolor: "#4a5568" },
                zaxis: { title: { text: "x(t+2\u03c4)", font: { size: 9, color: "#e2e8f0" } }, gridcolor: "#4a5568" },
                camera: { eye: forcedEye ?? DEFAULT_EYE },
              },
            }}
            config={EMBEDDING_CONFIG}
            onRelayout={handleRelayout}
            useResizeHandler
            style={{ width: "100%" }}
          />
          {zoomControls}
        </>
      ) : (
        <Plot
          data={[
            {
              x: points.map((p) => p[0]),
              y: points.map((p) => p[1] ?? 0),
              type: "scatter",
              mode: "markers",
              marker: {
                size: 3,
                color: points.map((_, i) => i),
                colorscale: "Viridis",
                opacity: 0.8,
              },
            },
          ]}
          layout={{
            ...PLOTLY_LAYOUT_DEFAULTS,
            height: chartHeight,
            margin: { l: 40, r: 12, t: 0, b: 32 },
            xaxis: {
              ...PLOTLY_LAYOUT_DEFAULTS.xaxis,
              title: { text: "x(t)", font: { size: 9, color: "#e2e8f0" } },
            },
            yaxis: {
              ...PLOTLY_LAYOUT_DEFAULTS.yaxis,
              title: { text: "x(t+\u03c4)", font: { size: 9, color: "#e2e8f0" } },
            },
          }}
          config={EMBEDDING_CONFIG}
          useResizeHandler
          style={{ width: "100%" }}
        />
      )}
    </div>
  );
}

export default React.memo(EmbeddingPlot3DInner);
