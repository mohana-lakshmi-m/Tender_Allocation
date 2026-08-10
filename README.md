# Tender Guard AI

Context & Architecture

Build a production-ready, highly interactive mobile application titled "DecentralAI Tender" — a Decentralized AI Tender Allocation & Fraud Detection System. 

Architect the code cleanly using React, Vite, Tailwind CSS, Lucide React icons, and Shadcn UI components. 

CRITICAL: Structure all data fetching through a dedicated `/src/services` layer using clean TypeScript interfaces and modular service files (`tenderService.ts`, `fraudDetectionService.ts`, `blockchainService.ts`). Ensure all backend calls use async state hooks so I can easily swap out mock APIs with real backend services in my IDE later.

---

Target User Roles & Navigation

Include a top header role-switcher to toggle between 3 views:

1. Government / Tender Authority (Issuer)

2. Contractor / Vendor (Bidder)

3. AI Fraud Auditor & Public Verifier (Inspector)

---

Core Pages & Requirements

1. Public Tenders Dashboard (`/tenders`)

- Search, filter by category (Infrastructure, IT, Defense), budget range, and deadline.

- Tender Cards showing: Title, Issuing Body, Budget (in ETH/USDT), Smart Contract Address status, Bid Count, and AI Integrity Score badge (e.g., 98% Low Risk - Green).

- Detailed Tender Page with specifications, required deliverables, timeline, and an interactive "Submit Encrypted Bid" modal for contractors.

2. AI Fraud Detection & Integrity Monitor (`/fraud-monitor`)

- Real-time Fraud Detection Control Center with interactive charts:

  - Collusion & Bid Rigging Detector (Flagging vendors sharing similar IP, wallet history, or pricing anomalies).

  - Front-Running & Cartel Risk Heatmap.

  - Ghost Vendor Verification (AI analysis of company registration, tax records, and wallet history).

- Audit Log Feed displaying recent AI risk flags with breakdown metrics:

  - Risk Score (0–100%)

  - Anomaly Reason (e.g., "Identical technical proposal text detected across 3 distinct bidders via NLP similarity").

  - Action buttons: "Freeze Tender", "Request On-Chain Audit", "Approve".

3. Smart Contract & Tender Allocation Hub (`/allocations`)

- Visual step-by-step pipeline showing the life cycle of a tender:

  `Tender Published -> Encrypted Bids Sealed -> AI Risk Audit -> Decentralized Evaluation -> Automated Smart Contract Payout`

- Automated Winner Selection Simulator using weighted criteria: AI Fraud Risk (30%), Price (40%), Execution Track Record (30%).

- On-chain proof verification box displaying simulated transaction hash, IPFS hash of proposal documents, and zero-knowledge bid proof verification status.

4. Vendor Portal (`/my-bids`)

- Dashboard for contractors to submit bids, upload proposal documents (simulating IPFS CID creation), track submission status, and view AI compliance feedback before final locking.

---

Data Model & Service Contracts (`/src/services/types.ts`)

Generate explicit TypeScript interfaces for:

- `Tender`: id, title, category, budget, deadline, status ('Open', 'Auditing', 'Allocated', 'Flagged'), smartContractAddr, IPFS_CID, riskScore.

- `Bid`: id, tenderId, bidderAddress, bidderName, bidAmount, encryptedProposalHash, submissionTime, aiSimilarityScore, flaggedForFraud (boolean).

- `FraudAlert`: id, tenderId, riskLevel ('Low', 'Medium', 'Critical'), detectionType ('Bid Rigging', 'Front Running', 'Phantom Contractor'), description, status.

---

Design & UX Guidelines

- Dark/Cyber-Industrial aesthetic: Slate 900 background, Cyan/Indigo primary accents, Emerald for verified on-chain badges, and Crimson/Amber for AI fraud alerts.

- Data density: Use clean stats cards, responsive data tables with pagination, line/bar graphs (Recharts), and status badges.

- Toast notifications for simulated actions (e.g., "Bid successfully hashed and submitted to blockchain testnet", "AI Flag Raised: Suspicious wallet cluster detected").

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/3a4e2cd4-88b1-4795-8de3-88977ddb43c7).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
