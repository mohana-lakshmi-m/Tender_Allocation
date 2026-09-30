import { Router } from "express";
import { BlockchainEngine } from "../services/blockchainEngine.js";
import { IPFSService } from "../services/ipfsService.js";
import { bidsStore } from "../store.js";

const router = Router();

// POST /api/allocations/compute-winner or POST /api/chain/allocate
router.post(["/allocations/compute-winner", "/chain/allocate"], async (req, res) => {
  const { bids, tenderId } = req.body;

  let bidsToEvaluate = bids;
  if (!bidsToEvaluate && tenderId) {
    bidsToEvaluate = bidsStore.filter((b) => b.tenderId === tenderId);
  }

  if (!bidsToEvaluate || bidsToEvaluate.length === 0) {
    bidsToEvaluate = bidsStore.filter((b) => b.tenderId === "TND-701");
  }

  const scores = BlockchainEngine.computeWinnerAllocation(bidsToEvaluate);
  res.json(scores);
});

// GET /api/chain/proof/:tenderId
router.get("/chain/proof/:tenderId", async (req, res) => {
  const { tenderId } = req.params;
  const proof = await BlockchainEngine.generateOnChainProof(tenderId);
  res.json(proof);
});

// POST /api/chain/ipfs
router.post("/chain/ipfs", async (req, res) => {
  const { fileName = "document.pdf", content } = req.body;
  const result = await IPFSService.pinJsonToIPFS(content || { fileName }, fileName);
  res.json(result);
});

// POST /api/chain/payout
router.post("/chain/payout", async (req, res) => {
  const { tenderId = "TND-701", vendor = "Vanta Infra Works" } = req.body;
  const proof = await BlockchainEngine.generateOnChainProof(tenderId, vendor);
  res.json({
    tenderId,
    vendor,
    txHash: proof.txHash,
    ipfsCid: proof.ipfsHash,
    milestone: "Mobilisation advance (15%)",
    status: "Released",
  });
});

export default router;
