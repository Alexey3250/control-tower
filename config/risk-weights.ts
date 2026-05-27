export const RISK_WEIGHTS = {
  trafficPressure: 0.18,
  weatherRisk: 0.16,
  manpowerCoverage: 0.18,
  vendorSlaBreach: 0.14,
  safetyIncidents: 0.18,
  costVariance: 0.16,
} as const;

export type RiskWeights = typeof RISK_WEIGHTS;

export const RISK_BUCKETS = {
  healthy: 40,
  watch: 65,
} as const;
