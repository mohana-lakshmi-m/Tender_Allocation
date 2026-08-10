import { request } from "./api";
import { fraudAlerts as alertSeed } from "./mockData";
import type {
  AlertStatus,
  CollusionCluster,
  FraudAlert,
  GhostVendorCheck,
  HeatmapCell,
  RiskTrendPoint,
} from "./types";

const store = { alerts: [...alertSeed] };

const clusters: CollusionCluster[] = [
  { cluster: "Cluster A · UAV", sharedIp: 92, walletOverlap: 78, priceAnomaly: 88 },
  { cluster: "Cluster B · Highway", sharedIp: 54, walletOverlap: 61, priceAnomaly: 73 },
  { cluster: "Cluster C · Cloud", sharedIp: 31, walletOverlap: 44, priceAnomaly: 39 },
  { cluster: "Cluster D · Comms", sharedIp: 68, walletOverlap: 82, priceAnomaly: 57 },
  { cluster: "Cluster E · Metro", sharedIp: 18, walletOverlap: 12, priceAnomaly: 22 },
];

const heatmap: HeatmapCell[] = (["Infrastructure", "IT", "Defense"] as const).flatMap(
  (category, ci) =>
    ["T-24h", "T-12h", "T-6h", "T-1h", "Seal"].map((window, wi) => ({
      category,
      window,
      risk: Math.min(99, 14 + ci * 22 + wi * 13 + ((ci + wi) % 3) * 7),
    })),
);

const ghostVendors: GhostVendorCheck[] = [
  {
    vendor: "Pinnacle Crypto Defence LLP",
    registration: false,
    taxRecords: false,
    walletAge: 9,
    verdict: "Ghost",
    confidence: 96,
  },
  {
    vendor: "Aegis Aerodyne",
    registration: true,
    taxRecords: false,
    walletAge: 141,
    verdict: "Suspicious",
    confidence: 74,
  },
  {
    vendor: "Corvus Structures Ltd",
    registration: true,
    taxRecords: true,
    walletAge: 812,
    verdict: "Suspicious",
    confidence: 52,
  },
  {
    vendor: "Quorum Cloud Labs",
    registration: true,
    taxRecords: true,
    walletAge: 1466,
    verdict: "Verified",
    confidence: 12,
  },
  {
    vendor: "Vanta Infra Works",
    registration: true,
    taxRecords: true,
    walletAge: 2033,
    verdict: "Verified",
    confidence: 8,
  },
];

function trend(seed: number): RiskTrendPoint[] {
  return Array.from({ length: 12 }).map((_, i) => ({
    time: `${String((i * 2) % 24).padStart(2, "0")}:00`,
    collusion: Math.round(30 + 25 * Math.sin((i + seed) / 1.7) + (i % 3) * 4),
    frontRunning: Math.round(22 + 18 * Math.cos((i + seed) / 2.1) + (i % 4) * 3),
    phantom: Math.round(14 + 12 * Math.sin((i + seed) / 3.3) + (i % 2) * 6),
  }));
}

export const fraudDetectionService = {
  async listAlerts(): Promise<FraudAlert[]> {
    return request("/fraud/alerts", () => [...store.alerts]);
  },
  async listAlertsForTender(tenderId: string): Promise<FraudAlert[]> {
    return request(`/fraud/alerts?tenderId=${tenderId}`, () =>
      store.alerts.filter((a) => a.tenderId === tenderId),
    );
  },
  async updateAlertStatus(id: string, status: AlertStatus): Promise<FraudAlert> {
    return request(`/fraud/alerts/${id}`, () => {
      store.alerts = store.alerts.map((a) => (a.id === id ? { ...a, status } : a));
      return store.alerts.find((a) => a.id === id)!;
    });
  },
  async getCollusionClusters(): Promise<CollusionCluster[]> {
    return request("/fraud/collusion", () => clusters);
  },
  async getRiskHeatmap(): Promise<HeatmapCell[]> {
    return request("/fraud/heatmap", () => heatmap);
  },
  async getGhostVendorChecks(): Promise<GhostVendorCheck[]> {
    return request("/fraud/ghost-vendors", () => ghostVendors);
  },
  async getRiskTrend(seed = 0): Promise<RiskTrendPoint[]> {
    return request("/fraud/trend", () => trend(seed));
  },
  async runScan(): Promise<{ scanned: number; newFlags: number; durationMs: number }> {
    return request("/fraud/scan", () => ({
      scanned: 62 + Math.floor(Math.random() * 40),
      newFlags: Math.floor(Math.random() * 4),
      durationMs: 800 + Math.floor(Math.random() * 1500),
    }));
  },
};
