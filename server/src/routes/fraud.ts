import { Router } from "express";
import { computeCosineSimilarity } from "../services/aiFraudEngine.js";
import { alertsStore, tendersStore } from "../store.js";
import { AlertStatus, CollusionCluster, GhostVendorCheck, HeatmapCell, RiskTrendPoint } from "../types.js";

const router = Router();

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
    }))
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

function generateTrend(seed = 0): RiskTrendPoint[] {
  return Array.from({ length: 12 }).map((_, i) => ({
    time: `${String((i * 2) % 24).padStart(2, "0")}:00`,
    collusion: Math.round(30 + 25 * Math.sin((i + seed) / 1.7) + (i % 3) * 4),
    frontRunning: Math.round(22 + 18 * Math.cos((i + seed) / 2.1) + (i % 4) * 3),
    phantom: Math.round(14 + 12 * Math.sin((i + seed) / 3.3) + (i % 2) * 6),
  }));
}

// GET /api/fraud/alerts
router.get("/fraud/alerts", (req, res) => {
  const tenderId = req.query.tenderId as string;
  if (tenderId) {
    return res.json(alertsStore.filter((a) => a.tenderId === tenderId));
  }
  res.json(alertsStore);
});

// PATCH /api/fraud/alerts/:id
router.patch("/fraud/alerts/:id", (req, res) => {
  const { id } = req.params;
  const { status } = req.body as { status: AlertStatus };

  const alert = alertsStore.find((a) => a.id === id);
  if (!alert) {
    return res.status(404).json({ error: "Alert not found" });
  }

  if (status) {
    alert.status = status;
  }
  res.json(alert);
});

// GET /api/fraud/collusion
router.get("/fraud/collusion", (_req, res) => {
  res.json(clusters);
});

// GET /api/fraud/heatmap
router.get("/fraud/heatmap", (_req, res) => {
  res.json(heatmap);
});

// GET /api/fraud/ghost-vendors
router.get("/fraud/ghost-vendors", (_req, res) => {
  res.json(ghostVendors);
});

// GET /api/fraud/trend
router.get("/fraud/trend", (req, res) => {
  const seed = req.query.seed ? Number(req.query.seed) : 0;
  res.json(generateTrend(seed));
});

// POST /api/fraud/scan
router.post("/fraud/scan", (_req, res) => {
  res.json({
    scanned: 62 + Math.floor(Math.random() * 40),
    newFlags: Math.floor(Math.random() * 3),
    durationMs: 800 + Math.floor(Math.random() * 1200),
  });
});

// POST /api/ai/compliance
router.post("/ai/compliance", (req, res) => {
  const { proposalText = "", bidAmount = 0, tenderId } = req.body;
  const tender = tenderId ? tendersStore.find((t) => t.id === tenderId) : undefined;

  const notes: { label: string; ok: boolean; detail: string }[] = [];

  // Note 1: Token depth check
  const textLength = proposalText.trim().length;
  notes.push({
    label: "Proposal completeness",
    ok: textLength > 120,
    detail:
      textLength > 120
        ? "Technical narrative meets minimum token depth for NLP scoring."
        : "Narrative is too short — under 120 characters triggers a low-confidence audit.",
  });

  // Note 2: Budget envelope check
  const withinBudget = !tender || bidAmount <= tender.budget;
  notes.push({
    label: "Budget envelope",
    ok: withinBudget,
    detail: withinBudget
      ? "Bid amount sits within the published budget ceiling."
      : "Bid exceeds the published ceiling and will be auto-rejected on seal.",
  });

  // Note 3: NLP Uniqueness calculation via TF-IDF heuristic
  const corpusBaseline = "High-speed autonomous interception drones with cryptographic telemetry mesh communications protocol.";
  const sim = computeCosineSimilarity(proposalText, corpusBaseline);
  const similarityScore = Math.round(sim * 100);
  const uniqueness = Math.max(10, 100 - similarityScore);

  notes.push({
    label: "NLP uniqueness vs. corpus",
    ok: uniqueness > 45,
    detail: `Cross-bidder similarity model scores this narrative at ${similarityScore}% overlap (${uniqueness}% unique).`,
  });

  res.json({ notes, uniqueness });
});

export default router;
