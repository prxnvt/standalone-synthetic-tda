import {
  SignalType,
  SIGNAL_TYPE_LABELS,
  PipelineParams,
} from "@/lib/types";
import { PipelineState } from "@/hooks/usePipeline";
import PipelineInfo from "./PipelineInfo";

const SIGNAL_PARAM_CONFIGS: Record<
  SignalType,
  {
    key: string;
    label: string;
    min: number;
    max: number;
    step: number;
    type?: "select";
    options?: string[];
  }[]
> = {
  sine_to_noise: [
    { key: "period", label: "Period", min: 10, max: 200, step: 1 },
    { key: "amplitude", label: "Amplitude", min: 0.1, max: 5, step: 0.1 },
    { key: "noise_std", label: "Noise Std", min: 0.1, max: 3, step: 0.1 },
    { key: "transition_start", label: "Trans. Start", min: 100, max: 800, step: 10 },
    { key: "transition_end", label: "Trans. End", min: 200, max: 900, step: 10 },
  ],
  frequency_shift: [
    { key: "period_1", label: "Period 1", min: 10, max: 200, step: 1 },
    { key: "period_2", label: "Period 2", min: 10, max: 200, step: 1 },
    { key: "shift_point", label: "Shift Point", min: 100, max: 900, step: 10 },
    { key: "transition_type", label: "Transition", min: 0, max: 1, step: 1, type: "select", options: ["abrupt", "linear"] },
  ],
  intermittent_bursts: [
    { key: "period", label: "Period", min: 10, max: 200, step: 1 },
    { key: "amplitude", label: "Amplitude", min: 0.1, max: 5, step: 0.1 },
    { key: "burst_interval", label: "Burst Interval", min: 50, max: 500, step: 10 },
    { key: "burst_duration", label: "Burst Duration", min: 5, max: 100, step: 5 },
    { key: "burst_intensity", label: "Burst Intensity", min: 0.5, max: 5, step: 0.1 },
  ],
  lorenz: [
    { key: "sigma", label: "Sigma", min: 1, max: 30, step: 0.5 },
    { key: "beta", label: "Beta", min: 0.5, max: 10, step: 0.1 },
    { key: "rho_start", label: "Rho Start", min: 1, max: 100, step: 1 },
    { key: "rho_end", label: "Rho End", min: 50, max: 300, step: 1 },
    { key: "rho_change_time", label: "Rho Change Time", min: 0.1, max: 0.9, step: 0.05 },
  ],
  superposition: [
    { key: "freq_1", label: "Freq 1", min: 10, max: 200, step: 1 },
    { key: "freq_2", label: "Freq 2", min: 5, max: 100, step: 1 },
    { key: "amp_1", label: "Amp 1", min: 0.1, max: 5, step: 0.1 },
    { key: "amp_2", label: "Amp 2", min: 0.1, max: 5, step: 0.1 },
    { key: "onset_time", label: "Onset Time", min: 100, max: 900, step: 10 },
  ],
};

interface SidebarProps {
  state: PipelineState;
}

export default function Sidebar({ state }: SidebarProps) {
  const paramConfigs = SIGNAL_PARAM_CONFIGS[state.signalParams.signal_type];

  return (
    <aside
      className="w-72 min-w-72 flex-shrink-0 flex flex-col gap-5 p-4 max-lg:w-full"
      style={{
        background: "var(--sidebar-bg)",
        borderRight: "1px solid var(--sidebar-border)",
      }}
    >
      {/* Header */}
      <div>
        <h1
          className="font-bold tracking-tight"
          style={{ fontSize: 35, fontFamily: "var(--mono)", color: "var(--foreground)" }}
        >
          Synthetic-tda
        </h1>
        <div className="mt-2">
          <PipelineInfo />
        </div>
      </div>

      {/* Signal Configuration */}
      <section>
        <div
          className="sec-label mb-2 pb-1"
          style={{ borderBottom: "1px solid var(--sidebar-border)" }}
        >
          Signal Generator
        </div>

        <label className="block text-[12px] mb-1" style={{ color: "var(--label)" }}>
          Type
        </label>
        <select
          className="w-full mb-3 px-2 py-1.5 text-[12px] rounded border outline-none"
          style={{
            borderColor: "var(--sidebar-border)",
            fontFamily: "var(--mono)",
            background: "var(--sidebar-bg)",
          }}
          value={state.signalParams.signal_type}
          onChange={(e) => state.setSignalType(e.target.value as SignalType)}
        >
          {Object.entries(SIGNAL_TYPE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>

        {paramConfigs.map((cfg) => (
          <div key={cfg.key} className="mb-2">
            <div className="flex justify-between items-baseline mb-0.5">
              <label className="text-[12px]" style={{ color: "var(--label)" }}>
                {cfg.label}
              </label>
              <span
                className="text-[13px] font-semibold"
                style={{ fontFamily: "var(--mono)", color: "var(--accent)" }}
              >
                {state.signalParams.params[cfg.key]}
              </span>
            </div>
            {cfg.type === "select" ? (
              <select
                className="w-full px-2 py-1 text-[12px] rounded border outline-none"
                style={{
                  borderColor: "var(--sidebar-border)",
                  fontFamily: "var(--mono)",
                  background: "var(--sidebar-bg)",
                }}
                value={state.signalParams.params[cfg.key] as string}
                onChange={(e) =>
                  state.updateSignalParams({ [cfg.key]: e.target.value })
                }
              >
                {cfg.options!.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="range"
                className="w-full"
                min={cfg.min}
                max={cfg.max}
                step={cfg.step}
                value={state.signalParams.params[cfg.key] as number}
                onChange={(e) =>
                  state.updateSignalParams({
                    [cfg.key]: parseFloat(e.target.value),
                  })
                }
              />
            )}
          </div>
        ))}

        <div className="mb-2">
          <div className="flex justify-between items-baseline mb-0.5">
            <label className="text-[12px]" style={{ color: "var(--label)" }}>
              Length
            </label>
            <span
              className="text-[11px] font-medium"
              style={{ fontFamily: "var(--mono)", color: "var(--accent)" }}
            >
              {state.signalParams.length}
            </span>
          </div>
          <input
            type="range"
            className="w-full"
            min={500}
            max={3000}
            step={100}
            value={state.signalParams.length}
            onChange={(e) => state.updateSignalLength(parseInt(e.target.value))}
          />
        </div>

        <div className="mb-3">
          <label className="block text-[12px] mb-0.5" style={{ color: "var(--label)" }}>
            Seed
          </label>
          <input
            type="number"
            className="w-full px-2 py-1 text-[12px] rounded border outline-none"
            style={{
              borderColor: "var(--sidebar-border)",
              fontFamily: "var(--mono)",
              background: "var(--sidebar-bg)",
            }}
            value={state.signalParams.seed}
            onChange={(e) => state.updateSeed(parseInt(e.target.value) || 0)}
          />
        </div>

        <button
          className="w-full py-1.5 text-[13px] font-medium rounded transition-colors disabled:opacity-40"
          style={{
            background: state.isSignalStale ? "var(--accent)" : "var(--sidebar-border)",
            color: state.isSignalStale ? "white" : "var(--foreground)",
            fontFamily: "var(--mono)",
          }}
          onClick={state.generateSignal}
          disabled={state.isGenerating}
        >
          {state.isGenerating
            ? "Generating..."
            : state.isSignalStale
            ? "Regenerate signal"
            : "Generate signal"}
        </button>
      </section>

      {/* Pipeline Configuration */}
      <section>
        <div
          className="sec-label mb-2 pb-1"
          style={{ borderBottom: "1px solid var(--sidebar-border)" }}
        >
          Pipeline Parameters
        </div>

        {(
          [
            { key: "window_size" as const, label: "Window Size", min: 50, max: 300, step: 10 },
            { key: "step_size" as const, label: "Step Size", min: 5, max: 50, step: 5 },
            { key: "embedding_delay" as const, label: "Delay (\u03c4)", min: 1, max: 10, step: 1 },
            { key: "max_edge_length" as const, label: "Max Edge Length", min: 0.5, max: 5, step: 0.1 },
            { key: "anomaly_threshold_sigma" as const, label: "Threshold (\u03c3)", min: 1.0, max: 4.0, step: 0.1 },
            { key: "subsample_size" as const, label: "Subsample Size", min: 50, max: 200, step: 10 },
          ] as {
            key: keyof PipelineParams;
            label: string;
            min: number;
            max: number;
            step: number;
          }[]
        ).map((cfg) => (
          <div key={cfg.key} className="mb-2">
            <div className="flex justify-between items-baseline mb-0.5">
              <label className="text-[12px]" style={{ color: "var(--label)" }}>
                {cfg.label}
              </label>
              <span
                className="text-[13px] font-semibold"
                style={{ fontFamily: "var(--mono)", color: "var(--accent)" }}
              >
                {state.pipelineParams[cfg.key]}
              </span>
            </div>
            <input
              type="range"
              className="w-full"
              min={cfg.min}
              max={cfg.max}
              step={cfg.step}
              value={state.pipelineParams[cfg.key] as number}
              onChange={(e) =>
                state.updatePipelineParams({
                  [cfg.key]: parseFloat(e.target.value),
                })
              }
            />
          </div>
        ))}

        <div className="mb-3">
          <label className="block text-[12px] mb-0.5" style={{ color: "var(--label)" }}>
            Embedding Dimension
          </label>
          <select
            className="w-full px-2 py-1 text-[12px] rounded border outline-none"
            style={{
              borderColor: "var(--sidebar-border)",
              fontFamily: "var(--mono)",
              background: "var(--sidebar-bg)",
            }}
            value={state.pipelineParams.embedding_dimension}
            onChange={(e) =>
              state.updatePipelineParams({
                embedding_dimension: parseInt(e.target.value),
              })
            }
          >
            {[2, 3, 4, 5].map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <button
          className="w-full py-1.5 text-[13px] font-medium rounded transition-colors disabled:opacity-40"
          style={{
            background:
              state.isPipelineStale && state.signalData
                ? "var(--accent)"
                : "var(--sidebar-border)",
            color:
              state.isPipelineStale && state.signalData
                ? "white"
                : "var(--foreground)",
            fontFamily: "var(--mono)",
          }}
          onClick={state.runPipeline}
          disabled={!state.signalData || state.isRunning}
        >
          {state.isRunning
            ? "Running..."
            : state.isPipelineStale
            ? "Re-run analysis"
            : "Run analysis"}
        </button>
      </section>

      {state.error && (
        <div
          className="p-2 rounded text-[11px]"
          style={{ background: "#fef2f2", color: "#ef4444" }}
        >
          {state.error}
        </div>
      )}
    </aside>
  );
}
