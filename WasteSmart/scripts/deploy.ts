import { createPublicClient, http, parseAbi, deployContract } from "viem";
import { sepolia } from "viem/chains";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();
const { SEPOLIA_RPC_URL, PRIVATE_KEY } = process.env;

// Read the compiled ABI + bytecode
const artifactPath = path.join(__dirname, "../artifacts/contracts/WasteBadge.sol/WasteBadge.json");
const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));

// Create client
const client = createPublicClient({
  chain: sepolia,
  transport: http(SEPOLIA_RPC_URL!),
});

async function main() {
  console.log("🚀 Deploying WasteBadge contract...");

  const contractAddress = await deployContract({
    client,
    abi: parseAbi(artifact.abi),
    bytecode: artifact.bytecode.object,
    account: PRIVATE_KEY!,
    constructorArgs: ["WasteBadge", "WB"], // your constructor arguments
  });

  console.log(`✅ WasteBadge deployed to: ${contractAddress}`);
}

main().catch((err) => {
  console.error("❌ Deployment failed:", err);
  process.exit(1);
});

