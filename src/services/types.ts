export type TenderCategory = "Infrastructure" | "IT" | "Defense";
export type TenderStatus = "Open" | "Auditing" | "Allocated" | "Flagged";
export type RiskLevel = "Low" | "Medium" | "Critical";
export type DetectionType = "Bid Rigging" | "Front Running" | "Phantom Contractor";
export type AlertStatus = "Open" | "Frozen" | "Audit Requested" | "Approved";

export type UserRole = "issuer" | "bidder" | "inspector";

export interface Tender {
  id: string;
  title: string;
  issuingBody: string;
  category: TenderCategory;
  budget: number;
  budgetCurrency: "ETH" | "USDT";
  deadline: string;
  status: TenderStatus;
  smartContractAddr: string;
  contractVerified: boolean;
  IPFS_CID: string;
  riskScore: number;
  bidCount: number;
  description: string;
  deliverables: string[];
  timeline: { phase: string; date: string }[];
}

export interface Bid {
  id: string;
  tenderId: string;
  bidderAddress: string;
  bidderName: string;
  bidAmount: number;
  encryptedProposalHash: string;
  submissionTime: string;
  aiSimilarityScore: number;
  flaggedForFraud: boolean;
  status: "Draft" | "Sealed" | "Under Review" | "Won" | "Rejected";
  trackRecord: number;
  ipfsCid?: string;
}

export interface FraudAlert {
  id: string;
  tenderId: string;
  tenderTitle: string;
  riskLevel: RiskLevel;
  detectionType: DetectionType;
  description: string;
  status: AlertStatus;
  riskScore: number;
  detectedAt: string;
  vendors: string[];
}

export interface CollusionCluster {
  cluster: string;
  sharedIp: number;
  walletOverlap: number;
  priceAnomaly: number;
}

export interface HeatmapCell {
  category: TenderCategory;
  window: string;
  risk: number;
}

export interface GhostVendorCheck {
  vendor: string;
  registration: boolean;
  taxRecords: boolean;
  walletAge: number;
  verdict: "Verified" | "Suspicious" | "Ghost";
  confidence: number;
}

export interface RiskTrendPoint {
  time: string;
  collusion: number;
  frontRunning: number;
  phantom: number;
}

export interface AllocationScore {
  bidId: string;
  bidderName: string;
  fraudRiskScore: number;
  priceScore: number;
  trackRecordScore: number;
  weightedTotal: number;
}

export interface OnChainProof {
  txHash: string;
  ipfsHash: string;
  zkProofStatus: "Verified" | "Pending" | "Failed";
  blockNumber: number;
  gasUsed: number;
  network: string;
}

export interface PipelineStage {
  key: string;
  label: string;
  description: string;
}
