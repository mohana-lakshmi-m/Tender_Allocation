import { ethers } from "hardhat";

async function main() {
  console.log("Deploying TenderAllocation smart contract to local Hardhat node...");

  const TenderAllocation = await ethers.getContractFactory("TenderAllocation");
  const tenderAllocation = await TenderAllocation.deploy();

  await tenderAllocation.waitForDeployment();
  const address = await tenderAllocation.getAddress();

  console.log(`TenderAllocation deployed successfully at address: ${address}`);
  
  // Write contract address to a JSON file for backend services to consume
  const fs = await import("fs");
  const path = await import("path");
  const deploymentPath = path.join(__dirname, "../deployment.json");
  fs.writeFileSync(deploymentPath, JSON.stringify({ contractAddress: address, deployedAt: new Date().toISOString() }, null, 2));
  console.log(`Deployment info saved to: ${deploymentPath}`);
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
