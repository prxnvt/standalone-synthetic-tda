export const PLOTLY_LAYOUT_DEFAULTS: Partial<Plotly.Layout> = {
  paper_bgcolor: "transparent",
  plot_bgcolor: "transparent",
  font: {
    family: "\"Geist Mono Variable\", \"SF Mono\", \"Fira Code\", monospace",
    size: 11,
    color: "#e2e8f0",
  },
  xaxis: {
    gridcolor: "#4a5568",
    zerolinecolor: "#64748b",
    linecolor: "#64748b",
  },
  yaxis: {
    gridcolor: "#4a5568",
    zerolinecolor: "#64748b",
    linecolor: "#64748b",
  },
  hoverlabel: {
    bgcolor: "#1e293b",
    bordercolor: "#30363d",
    font: { color: "#f8fafc", size: 11, family: "\"Geist Mono Variable\", monospace" },
  },
};

export const PLOTLY_CONFIG: Partial<Plotly.Config> = {
  responsive: true,
  displayModeBar: false,
};
