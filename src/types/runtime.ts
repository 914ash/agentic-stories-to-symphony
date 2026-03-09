export interface HarnessConfig {
  approverAllowlist: string[];
  linear: {
    teamKey: string;
    apiKey: string;
  };
  watch: {
    pollIntervalSeconds: number;
  };
}
