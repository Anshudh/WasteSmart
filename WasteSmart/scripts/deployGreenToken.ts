import fs from "fs";
import path from "path";
import { config as dotenvConfig } from "dotenv";
import { privateKeyToAccount } from "viem/accounts";
import { createPublicClient, createWalletClient, http } from "viem";
import { deployContract } from "viem/actions";
import { sepolia } from "viem/chains";

dotenvConfig();

const repoRoot = process.cwd();
const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}` | undefined;
const RPC_URL = process.env.SEPOLIA_RPC_URL;

if (!PRIVATE_KEY || !RPC_URL) {
  throw new Error("❌ Missing PRIVATE_KEY or SEPOLIA_RPC_URL in .env");
}

// Path to GreenToken artifact
const artifactPath = path.join(repoRoot, "artifacts", "contracts", "GreenToken.sol", "GreenToken.json");
if (!fs.existsSync(artifactPath)) {
  throw new Error(`❌ Artifact not found at ${artifactPath}`);
}

const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
const abi = artifact.abi;
const bytecode =
  typeof artifact.bytecode === "string" && artifact.bytecode.startsWith("0x")
    ? artifact.bytecode
    : artifact.bytecode?.object ?? artifact.evm?.bytecode?.object;

if (!bytecode) throw new Error("❌ Could not find bytecode in artifact!");

// Example initial supply
const initialSupply = BigInt(1_000_000) * 10n ** 18n;

const account = privateKeyToAccount(PRIVATE_KEY);
const client = createWalletClient({ account, chain: sepolia, transport: http(RPC_URL) });
const publicClient = createPublicClient({ chain: sepolia, transport: http(RPC_URL) });

const deployedFile = path.join(repoRoot, "backend", "src", "utils", "deployedContracts.json");

(async () => {
  try {
    console.log("🚀 Deploying GreenToken...");

    const txHash = await deployContract(client, {
      abi: abi as any,
      bytecode: bytecode as `0x${string}`,
      args: [initialSupply],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    console.log(`✅ GreenToken deployed at: ${receipt.contractAddress}`);

    // **Step: Update the JSON file with the new deployed address**
    fs.writeFileSync(
      deployedFile,
      JSON.stringify({ greenToken: receipt.contractAddress }, null, 2)
    );

    console.log(`📄 deployedContracts.json updated at ${deployedFile}`);
  } catch (err) {
    console.error("❌ Deployment failed:", err);
    process.exitCode = 1;
  }
})();
