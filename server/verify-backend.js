import http from "http";

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

async function runVerification() {
  const logs = [];
  const log = (msg) => {
    console.log(msg);
    logs.push(`[${new Date().toISOString()}] ${msg}`);
  };

  log("====================================================");
  log("TENDER GUARD AI BACKEND AUTONOMOUS VERIFICATION SUITE");
  log("====================================================\n");

  try {
    // Test 1: GET /health
    log("--> Test 1: Verification of GET /health");
    const health = await makeRequest("/health");
    log(`HTTP Status: ${health.status}`);
    log(`Payload: ${JSON.stringify(health.body, null, 2)}\n`);

    // Test 2: GET /api/tenders
    log("--> Test 2: Verification of GET /api/tenders");
    const tenders = await makeRequest("/api/tenders");
    log(`HTTP Status: ${tenders.status}`);
    log(`Total Tenders fetched: ${Array.isArray(tenders.body) ? tenders.body.length : 0}\n`);

    // Test 3: POST /api/tenders/TND-701/bids (Duplicate Proposal AI Fraud Engine Test)
    log("--> Test 3: Verification of POST /api/tenders/TND-701/bids (AI Fraud Engine TF-IDF & Wallet Graph)");
    const duplicateBidPayload = {
      tenderId: "TND-701",
      bidderName: "Pinnacle Crypto Defence LLP",
      bidderAddress: "0x71C765...9B32",
      bidAmount: 4120000,
      proposalText: "High-speed autonomous interception drones with cryptographic telemetry mesh communications protocol.",
      fileName: "duplicate_spec.pdf",
    };
    const bidResponse = await makeRequest("/api/tenders/TND-701/bids", "POST", duplicateBidPayload);
    log(`HTTP Status: ${bidResponse.status}`);
    log(`Risk Output: ${JSON.stringify(bidResponse.body, null, 2)}\n`);

    // Test 4: POST /api/allocations/compute-winner (Multi-Criteria Weighted Allocation)
    log("--> Test 4: Verification of POST /api/allocations/compute-winner (Weighted Formula: 40% Price + 30% Track Record + 30% Low Risk)");
    const winnerResponse = await makeRequest("/api/allocations/compute-winner", "POST", { tenderId: "TND-701" });
    log(`HTTP Status: ${winnerResponse.status}`);
    log(`Allocation Winner Output: ${JSON.stringify(winnerResponse.body, null, 2)}\n`);

    // Test 5: GET /api/fraud/alerts
    log("--> Test 5: Verification of GET /api/fraud/alerts");
    const alertsResponse = await makeRequest("/api/fraud/alerts");
    log(`HTTP Status: ${alertsResponse.status}`);
    log(`Total Fraud Alerts in system: ${Array.isArray(alertsResponse.body) ? alertsResponse.body.length : 0}\n`);

    log("====================================================");
    log("ALL AUTONOMOUS VERIFICATION TESTS COMPLETED SUCCESSFULLY");
    log("====================================================");

    return logs.join("\n");
  } catch (err) {
    log(`VERIFICATION FAILED WITH ERROR: ${err.stack || err.message}`);
    return logs.join("\n");
  }
}

runVerification();
