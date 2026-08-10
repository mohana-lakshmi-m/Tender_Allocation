import { request, randomHex } from "./api";
import { bids as bidSeed, tenders as tenderSeed } from "./mockData";
import type { Bid, Tender, TenderCategory, TenderStatus } from "./types";

export interface TenderFilters {
  search?: string | undefined;
  category?: TenderCategory | "All" | undefined;
  maxBudgetPercent?: number | undefined;
  deadlineBefore?: string | undefined;
  status?: TenderStatus | "All" | undefined;
}

export interface SubmitBidInput {
  tenderId: string;
  bidderName: string;
  bidderAddress: string;
  bidAmount: number;
  proposalText: string;
  fileName?: string | undefined;
}

const store = {
  tenders: [...tenderSeed],
  bids: [...bidSeed],
};

function matches(tender: Tender, filters: TenderFilters): boolean {
  const { search, category, deadlineBefore, status } = filters;
  if (search) {
    const q = search.toLowerCase();
    const hay = `${tender.title} ${tender.issuingBody} ${tender.id}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  if (category && category !== "All" && tender.category !== category) return false;
  if (status && status !== "All" && tender.status !== status) return false;
  if (deadlineBefore && tender.deadline > deadlineBefore) return false;
  return true;
}

export const tenderService = {
  async listTenders(filters: TenderFilters = {}): Promise<Tender[]> {
    return request("/tenders", () => store.tenders.filter((t) => matches(t, filters)));
  },

  async getTender(id: string): Promise<Tender | undefined> {
    return request(`/tenders/${id}`, () => store.tenders.find((t) => t.id === id));
  },

  async listBids(tenderId?: string): Promise<Bid[]> {
    return request("/bids", () =>
      tenderId ? store.bids.filter((b) => b.tenderId === tenderId) : [...store.bids],
    );
  },

  async listBidsByVendor(bidderName: string): Promise<Bid[]> {
    return request("/bids/mine", () => store.bids.filter((b) => b.bidderName === bidderName));
  },

  async submitBid(input: SubmitBidInput): Promise<Bid> {
    return request("/bids", () => {
      const similarity = Math.min(96, 12 + (input.proposalText.length % 70));
      const bid: Bid = {
        id: `BID-${Math.floor(9000 + Math.random() * 999)}`,
        tenderId: input.tenderId,
        bidderAddress: input.bidderAddress,
        bidderName: input.bidderName,
        bidAmount: input.bidAmount,
        encryptedProposalHash: `0x${randomHex(6)}…${randomHex(4)}`,
        submissionTime: new Date().toISOString(),
        aiSimilarityScore: similarity,
        flaggedForFraud: similarity > 70,
        status: "Sealed",
        trackRecord: 82,
        ipfsCid: `bafybei${randomHex(20)}`,
      };
      store.bids = [bid, ...store.bids];
      store.tenders = store.tenders.map((t) =>
        t.id === input.tenderId ? { ...t, bidCount: t.bidCount + 1 } : t,
      );
      return bid;
    });
  },

  async getComplianceFeedback(proposalText: string, bidAmount: number, tender?: Tender) {
    return request("/ai/compliance", () => {
      const notes: { label: string; ok: boolean; detail: string }[] = [];
      notes.push({
        label: "Proposal completeness",
        ok: proposalText.trim().length > 120,
        detail:
          proposalText.trim().length > 120
            ? "Technical narrative meets minimum token depth for NLP scoring."
            : "Narrative is too short — under 120 characters triggers a low-confidence audit.",
      });
      const withinBudget = !tender || bidAmount <= tender.budget;
      notes.push({
        label: "Budget envelope",
        ok: withinBudget,
        detail: withinBudget
          ? "Bid amount sits within the published budget ceiling."
          : "Bid exceeds the published ceiling and will be auto-rejected on seal.",
      });
      const uniqueness = 100 - Math.min(90, proposalText.length % 80);
      notes.push({
        label: "NLP uniqueness vs. corpus",
        ok: uniqueness > 45,
        detail: `Cross-bidder similarity model scores this narrative at ${100 - uniqueness}% overlap.`,
      });
      return { notes, uniqueness };
    });
  },
};
