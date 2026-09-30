import { Router } from "express";
import { AIFraudEngine } from "../services/aiFraudEngine.js";
import { BlockchainEngine } from "../services/blockchainEngine.js";
import { IPFSService } from "../services/ipfsService.js";
import { alertsStore, bidsStore, tendersStore } from "../store.js";
import { Bid, Tender } from "../types.js";

const router = Router();

// GET /api/tenders
router.get("/tenders", (req, res) => {
  const { search, category, status } = req.query;
  let result = [...tendersStore];

  if (search && typeof search === "string") {
    const q = search.toLowerCase();
    result = result.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.issuingBody.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q)
    );
  }

  if (category && typeof category === "string" && category !== "All") {
    result = result.filter((t) => t.category === category);
  }

  if (status && typeof status === "string" && status !== "All") {
    result = result.filter((t) => t.status === status);
  }

  res.json(result);
});

// GET /api/tenders/:id
router.get("/tenders/:id", (req, res) => {
  const tender = tendersStore.find((t) => t.id === req.params.id);
  if (!tender) {
    return res.status(404).json({ error: "Tender not found" });
  }
  res.json(tender);
});

// POST /api/tenders
router.post("/tenders", async (req, res) => {
  const body = req.body;
  const ipfsRes = await IPFSService.pinJsonToIPFS({ title: body.title, budget: body.budget }, "tender");

  const newTender: Tender = {
    id: body.id || `TND-${Math.floor(700 + Math.random() * 200)}`,
    title: body.title || "Untitled Tender",
    issuingBody: body.issuingBody || "Government Entity",
    category: body.category || "IT",
    budget: Number(body.budget) || 1000000,
    budgetCurrency: body.budgetCurrency || "USDT",
    deadline: body.deadline || new Date(Date.now() + 30 * 86400000).toISOString(),
    status: "Open",
    smartContractAddr: body.smartContractAddr || `0x${Math.random().toString(16).slice(2, 10)}...`,
    contractVerified: true,
    IPFS_CID: ipfsRes.cid,
    riskScore: 10,
    bidCount: 0,
    description: body.description || "",
    deliverables: body.deliverables || ["Milestone 1"],
    timeline: body.timeline || [{ phase: "Open Bidding", date: "Current" }],
  };

  tendersStore.unshift(newTender);
  res.status(201).json(newTender);
});

// GET /api/bids or GET /api/tenders/:id/bids
router.get(["/bids", "/tenders/:id/bids"], (req, res) => {
  const tenderId = req.params.id || (req.query.tenderId as string);
  const bidderName = req.query.bidderName as string;

  let result = [...bidsStore];

  if (tenderId) {
    result = result.filter((b) => b.tenderId === tenderId);
  }

  if (bidderName) {
    result = result.filter((b) => b.bidderName === bidderName);
  }

  res.json(result);
});

// GET /api/bids/mine
router.get("/bids/mine", (req, res) => {
  const bidderName = (req.query.bidderName as string) || "Aegis Aerodyne Systems";
  const myBids = bidsStore.filter((b) => b.bidderName === bidderName);
  res.json(myBids);
});

// POST /api/tenders/:id/bids or POST /api/bids
router.post(["/bids", "/tenders/:id/bids"], async (req, res) => {
  const tenderId = req.params.id || req.body.tenderId || "TND-701";
  const { bidderName, bidderAddress, bidAmount, proposalText, salt: userSalt } = req.body;

  if (!bidderName || !bidAmount) {
    return res.status(400).json({ error: "bidderName and bidAmount are required." });
  }

  const textToAnalyze = proposalText || `${bidderName} bid proposal for ${tenderId}`;
  const address = bidderAddress || `0x${Math.random().toString(16).slice(2, 10)}`;

  // Evaluate AI Risk & Anomaly Engine
  const evaluation = AIFraudEngine.evaluateBid(
    { proposalText: textToAnalyze, bidderAddress: address, bidderName, bidAmount: Number(bidAmount), tenderId },
    bidsStore
  );

  // Generate cryptographic sealed commitment hash
  const commitment = BlockchainEngine.generateSealedBidCommitment(Number(bidAmount), address, userSalt);
  const ipfsRes = await IPFSService.pinJsonToIPFS({ bidderName, bidAmount, textToAnalyze }, `bid_${tenderId}`);

  const newBid: Bid = {
    id: `BID-${Math.floor(9000 + Math.random() * 999)}`,
    tenderId,
    bidderAddress: address,
    bidderName,
    bidAmount: Number(bidAmount),
    encryptedProposalHash: commitment.commitmentHash,
    submissionTime: new Date().toISOString(),
    aiSimilarityScore: evaluation.similarityScore,
    flaggedForFraud: evaluation.flaggedForFraud,
    status: "Sealed",
    trackRecord: 85,
    ipfsCid: ipfsRes.cid,
    proposalText: textToAnalyze,
  };

  bidsStore.unshift(newBid);

  // Push auto-generated alerts to store if flagged
  if (evaluation.alerts.length > 0) {
    alertsStore.unshift(...evaluation.alerts);
  }

  // Update bid count on target tender
  const tenderIndex = tendersStore.findIndex((t) => t.id === tenderId);
  if (tenderIndex !== -1) {
    tendersStore[tenderIndex].bidCount += 1;
    if (evaluation.riskScore > tendersStore[tenderIndex].riskScore) {
      tendersStore[tenderIndex].riskScore = evaluation.riskScore;
    }
  }

  res.status(201).json({
    bid: {
      ...newBid,
      salt: commitment.salt,
    },
    riskAnalysis: {
      riskScore: evaluation.riskScore,
      similarityScore: evaluation.similarityScore,
      walletClusterRisk: evaluation.walletClusterRisk,
      flaggedForFraud: evaluation.flaggedForFraud,
      alertsGenerated: evaluation.alerts.length,
    },
  });
});

export default router;
