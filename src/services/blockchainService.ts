import { randomHex, request } from "./api";
import type { AllocationScore, Bid, OnChainProof, PipelineStage } from "./types";

export const ALLOCATION_WEIGHTS = {
  fraudRisk: 0.3,
  price: 0.4,
  trackRecord: 0.3,
} as const;

export const pipelineStages: PipelineStage[] = [
  {
    key: "published",
    label: "Tender Published",
    description: "Specification pinned to IPFS and anchored in the tender registry contract.",
  },
  {
    key: "sealed",
    label: "Encrypted Bids Sealed",
    description: "Commit-reveal scheme locks bid amounts; only hashes are on-chain.",
  },
  {
    key: "audit",
    label: "AI Risk Audit",
    description: "Collusion, front-running and ghost-vendor models score every bidder.",
  },
  {
    key: "evaluation",
    label: "Decentralized Evaluation",
    description: "Validator quorum re-executes the weighted scoring and signs the result.",
  },
  {
    key: "payout",
    label: "Automated Smart Contract Payout",
    description: "Escrow releases milestone one to the winning vendor address.",
  },
];

export const blockchainService = {
  async simulateAllocation(bids: Bid[]): Promise<AllocationScore[]> {
    return request("/chain/allocate", () => {
      if (bids.length === 0) return [];
      const amounts = bids.map((b) => b.bidAmount);
      const min = Math.min(...amounts);
      const max = Math.max(...amounts);
      const span = max - min || 1;
      return bids
        .map((bid) => {
          const fraudRiskScore = 100 - bid.aiSimilarityScore;
          const priceScore = Math.round(100 - ((bid.bidAmount - min) / span) * 100);
          const trackRecordScore = bid.trackRecord;
          const weightedTotal =
            fraudRiskScore * ALLOCATION_WEIGHTS.fraudRisk +
            priceScore * ALLOCATION_WEIGHTS.price +
            trackRecordScore * ALLOCATION_WEIGHTS.trackRecord;
          return {
            bidId: bid.id,
            bidderName: bid.bidderName,
            fraudRiskScore,
            priceScore,
            trackRecordScore,
            weightedTotal: Math.round(weightedTotal * 10) / 10,
          };
        })
        .sort((a, b) => b.weightedTotal - a.weightedTotal);
    });
  },

  async verifyOnChainProof(tenderId: string): Promise<OnChainProof> {
    return request(`/chain/proof/${tenderId}`, () => ({
      txHash: `0x${randomHex(64)}`,
      ipfsHash: `bafybei${randomHex(24)}`,
      zkProofStatus: "Verified" as const,
      blockNumber: 21_400_000 + Math.floor(Math.random() * 90_000),
      gasUsed: 118_000 + Math.floor(Math.random() * 60_000),
      network: "Sepolia Testnet",
    }));
  },

  async pinToIpfs(fileName: string): Promise<{ cid: string; fileName: string; sizeKb: number }> {
    return request("/chain/ipfs", () => ({
      cid: `bafybei${randomHex(26)}`,
      fileName,
      sizeKb: 240 + Math.floor(Math.random() * 3800),
    }));
  },

  async releasePayout(tenderId: string, vendor: string) {
    return request("/chain/payout", () => ({
      tenderId,
      vendor,
      txHash: `0x${randomHex(64)}`,
      milestone: "Mobilisation advance (15%)",
    }));
  },
};
