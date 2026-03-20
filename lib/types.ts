export type SignalType =
  | "sine_to_noise"
  | "frequency_shift"
  | "intermittent_bursts"
  | "lorenz"
  | "superposition";

export interface SignalParams {
  signal_type: SignalType;
  length: number;
  seed: number;
  params: Record<string, number | string>;
}

export interface SignalResponse {
  signal: number[];
  regime_labels: number[];
  regime_names: string[];
  length: number;
}

export interface PersistencePair {
  birth: number;
  death: number | null;
  dimension: number;
}

export interface PersistenceResponse {
  pairs: PersistencePair[];
  betti_summary: Record<string, number>;
  computation_time_ms: number;
}

export interface EmbeddingResponse {
  points: number[][];
  num_points: number;
}

export interface PipelineParams {
  window_size: number;
  step_size: number;
  embedding_delay: number;
  embedding_dimension: number;
  max_simplex_dimension: number;
  max_edge_length: number;
  anomaly_threshold_sigma: number;
  subsample_size: number;
}

export interface PipelineResponse {
  window_centers: number[];
  features: Record<string, number[]>;
  anomalies: boolean[];
  num_windows: number;
  computation_time_ms: number;
}

export const SIGNAL_TYPE_LABELS: Record<SignalType, string> = {
  sine_to_noise: "Sine to Noise",
  frequency_shift: "Frequency Shift",
  intermittent_bursts: "Intermittent Bursts",
  lorenz: "Lorenz Attractor",
  superposition: "Superposition",
};

export const DEFAULT_SIGNAL_PARAMS: Record<SignalType, Record<string, number | string>> = {
  sine_to_noise: {
    period: 50,
    amplitude: 1.0,
    noise_std: 1.0,
    transition_start: 500,
    transition_end: 700,
  },
  frequency_shift: {
    period_1: 50,
    period_2: 20,
    shift_point: 500,
    transition_type: "abrupt",
  },
  intermittent_bursts: {
    period: 50,
    amplitude: 1.0,
    burst_interval: 200,
    burst_duration: 30,
    burst_intensity: 2.0,
  },
  lorenz: {
    sigma: 10.0,
    beta: 2.667,
    rho_start: 28.0,
    rho_end: 150.0,
    rho_change_time: 0.5,
    dt: 0.01,
  },
  superposition: {
    freq_1: 50,
    freq_2: 13,
    amp_1: 1.0,
    amp_2: 0.8,
    onset_time: 500,
  },
};

export const DEFAULT_PIPELINE_PARAMS: PipelineParams = {
  window_size: 100,
  step_size: 20,
  embedding_delay: 1,
  embedding_dimension: 3,
  max_simplex_dimension: 2,
  max_edge_length: 2.0,
  anomaly_threshold_sigma: 2.0,
  subsample_size: 150,
};

export const REGIME_COLORS = [
  "rgba(76, 175, 80, 0.1)",
  "rgba(255, 235, 59, 0.15)",
  "rgba(244, 67, 54, 0.1)",
  "rgba(156, 39, 176, 0.1)",
];

export const DIMENSION_COLORS: Record<number, string> = {
  0: "#1f77b4",
  1: "#ff7f0e",
  2: "#2ca02c",
};
