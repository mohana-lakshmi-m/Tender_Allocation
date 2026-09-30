# Tender Guard AI - API Contract Specification (Phase 2 Upgrade)

Base URL: `http://localhost:5000/api`

---

## 1. Health Check

### `GET /health`
- **Description:** Verifies server readiness, uptime, and system status.
- **Request:** None
- **Response:** `200 OK`
  ```json
  {
    "status": "ok",
    "timestamp": "2026-09-30T10:00:00.000Z",
    "service": "tender-guard-ai-backend",
    "uptimeSeconds": 45.2
  }
  ```

---

## 2. Tender & Bid Endpoints

### `GET /api/tenders`
- **Description:** Fetches all active tenders filtered by search, category, or status.
- **Query Params:** `search`, `category`, `status`
- **Response:** `200 OK` `Tender[]`

### `POST /api/tenders/:id/bids`
- **Description:** Submits a new bid with Sealed-Bid cryptographic commitment (`commitmentHash`) and runs Semantic AI Fraud Engine.
- **Body:**
  ```json
  {
    "tenderId": "TND-701",
    "bidderName": "Aegis Aerodyne Systems",
    "bidderAddress": "0x71C...9B32",
    "bidAmount": 4150000,
    "proposalText": "Autonomous drone system narrative...",
    "fileName": "proposal_spec.pdf",
    "salt": "random_salt_string"
  }
  ```
- **Response:** `201 Created`
  ```json
  {
    "bid": {
      "id": "BID-9481",
      "tenderId": "TND-701",
      "bidderAddress": "0x71C...9B32",
      "bidderName": "Aegis Aerodyne Systems",
      "bidAmount": 4150000,
      "commitmentHash": "0x8f3c...b210",
      "salt": "random_salt_string",
      "submissionTime": "2026-09-30T10:00:00.000Z",
      "aiSimilarityScore": 88,
      "flaggedForFraud": true,
      "status": "Sealed",
      "trackRecord": 85,
      "ipfsCid": "ipfs://bafybeic..."
    },
    "riskAnalysis": {
      "riskScore": 72,
      "similarityScore": 88,
      "walletClusterRisk": 45,
      "flaggedForFraud": true,
      "alertsGenerated": 1
    }
  }
  ```

---

## 3. Decentralized Allocation & Proof Endpoints

### `POST /api/allocations/compute-winner`
- **Description:** Calculates winner using dynamic multi-criteria formula (40% Price + 30% Track Record + 30% Low Risk) and generates IPFS audit log.
- **Body:** `{ "tenderId": "TND-701" }`
- **Response:** `200 OK` `AllocationScore[]`

### `GET /api/chain/proof/:tenderId`
- **Description:** Returns verifiable zero-knowledge proof, transaction hash, block number, and pinned IPFS audit log CID (`ipfs://bafybei...`).
- **Response:** `200 OK` `OnChainProof`
