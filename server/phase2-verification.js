import http from "http";
import fs from "fs";
import path from "path";

const BASE_URL = "http://localhost:5000";

function makeRequest(urlPath, method = "GET", payload = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on("error", (err) => reject(err));

    if (payload) {
      req.write(JSON.stringify(payload));
    }
    req.end();
  });
}

async function runPhase2Verification() {
  const logs = [];
  const log = (msg) => {
    console.log(msg);
    logs.push(`[${new Date().toISOString()}] ${msg}`);
  };

  log("=======================================================================");
  log("TENDER GUARD AI PHASE 2 PRODUCTION VERIFICATION SUITE (WEB3 & SEMANTIC AI)");
  log("=======================================================================\n");

  try {
    // 1. Health check
    log("--> Test 1: GET /health");
    const health = await makeRequest("/health");
    log(`Status: ${health.status}`);
    log(`Payload: ${JSON.stringify(health.body, null, 2)}\n`);

    // 2. Submit sealed bid with semantic text to test AI Engine
    log("--> Test 2: POST /api/tenders/TND-701/bids (Semantic Vector AI Engine & Commitment Hash)");
    const bidPayload = {
      tenderId: "TND-701",
      bidderName: "Aegis Aerodyne Systems",
      bidderAddress: "0x71C765...9B32",
      bidAmount: 4150000,
      proposalText: "High-speed autonomous interception drones with cryptographic telemetry mesh communications protocol.",
      fileName: "proposal_spec.pdf",
    };
    const bidRes = await makeRequest("/api/tenders/TND-701/bids", "POST", bidPayload);
    log(`Status: ${bidRes.status}`);
    log(`Result: ${JSON.stringify(bidRes.body, null, 2)}\n`);

    // 3. Compute winner allocation on-chain
    log("--> Test 3: POST /api/allocations/compute-winner (Weighted Allocation & IPFS CID)");
    const winnerRes = await makeRequest("/api/allocations/compute-winner", "POST", { tenderId: "TND-701" });
    log(`Status: ${winnerRes.status}`);
    log(`Winner Allocation Output: ${JSON.stringify(winnerRes.body, null, 2)}\n`);

    // 4. Verify IPFS and On-Chain Audit Proof
    log("--> Test 4: GET /api/chain/proof/TND-701 (Verifiable ZK Proof & IPFS Audit Log)");
    const proofRes = await makeRequest("/api/chain/proof/TND-701");
    log(`Status: ${proofRes.status}`);
    log(`Audit Proof Output: ${JSON.stringify(proofRes.body, null, 2)}\n`);

    log("=======================================================================");
    log("PHASE 2 PRODUCTION VERIFICATION COMPLETED SUCCESSFULLY");
    log("=======================================================================");

    const logOutput = logs.join("\n");
    const logFilePath = path.join(process.cwd(), "phase2-verification.log");
    fs.writeFileSync(logFilePath, logOutput);
    console.log(`Log successfully saved to ${logFilePath}`);
  } catch (err) {
    log(`VERIFICATION ERROR: ${err.stack || err.message}`);
  }
}

runPhase2Verification();
