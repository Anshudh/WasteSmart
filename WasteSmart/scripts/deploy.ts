import fs from "fs";
import path from "path";
import { config as dotenvConfig } from "dotenv";
import { privateKeyToAccount } from "viem/accounts";
import { createPublicClient, createWalletClient, http } from "viem";
import { deployContract } from "viem/actions";
import { sepolia } from "viem/chains";

dotenvConfig();

// repo root (Hardhat runs scripts with cwd = project root)
const repoRoot = process.cwd();
const DEPLOY_PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}` | undefined;
const RPC_URL = process.env.SEPOLIA_RPC_URL;
const DEPLOY_ARGS_RAW = process.env.DEPLOY_ARGS; // example: DEPLOY_ARGS='["arg1", 123]'

if (!DEPLOY_PRIVATE_KEY || !RPC_URL) {
  throw new Error("❌ Missing PRIVATE_KEY or SEPOLIA_RPC_URL in .env");
}

const artifactPath = path.join(repoRoot, "artifacts", "contracts", "WasteBadge.sol", "WasteBadge.json");
if (!fs.existsSync(artifactPath)) {
  throw new Error(`❌ Artifact not found at ${artifactPath}`);
}

const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
const abi = artifact.abi;

// resolve bytecode from common Hardhat artifact shapes
const bytecode =
  typeof artifact.bytecode === "string" && artifact.bytecode.startsWith("0x")
    ? artifact.bytecode
    : artifact.bytecode?.object ?? artifact.evm?.bytecode?.object;

if (!bytecode) throw new Error("❌ Could not find bytecode in artifact!");

// constructor inspection
const constructorEntry = Array.isArray(abi) ? (abi as any[]).find((e) => e.type === "constructor") : undefined;
const constructorInputs = constructorEntry?.inputs ?? [];

// parse deploy args if provided
let deployArgs: unknown[] = [];
if (DEPLOY_ARGS_RAW) {
  try {
    deployArgs = JSON.parse(DEPLOY_ARGS_RAW);
    if (!Array.isArray(deployArgs)) throw new Error("DEPLOY_ARGS must be a JSON array");
  } catch (e) {
    throw new Error(`❌ Invalid DEPLOY_ARGS: ${String(e)}`);
  }
}

// validate args vs ABI (only check for mismatch if inputs are expected)
if (constructorInputs.length > 0 && constructorInputs.length !== deployArgs.length) {
  throw new Error(
    `❌ Constructor expects ${constructorInputs.length} args but DEPLOY_ARGS provided ${deployArgs.length}.`
  );
}

// diagnostics (do not print secret)
console.log("→ RPC_URL set:", !!RPC_URL);
console.log("→ PRIVATE_KEY set:", !!DEPLOY_PRIVATE_KEY);
console.log("→ Artifact ABI entries:", Array.isArray(abi) ? abi.length : "unknown");
console.log("→ Constructor inputs:", constructorInputs.length > 0 ? constructorInputs : "[]");
console.log("→ Using deploy args:", deployArgs);
console.log("→ Bytecode length:", typeof bytecode === "string" ? bytecode.length : "unknown");

const account = privateKeyToAccount(DEPLOY_PRIVATE_KEY);
const client = createWalletClient({ account, chain: sepolia, transport: http(RPC_URL) });
const publicClient = createPublicClient({ chain: sepolia, transport: http(RPC_URL) });

(async function main() {
  try {
    console.log("🚀 Deploying WasteBadge...");

    const deployOptions: any = {
      abi: abi as any,
      bytecode: bytecode as `0x${string}`,
    };

    // **FIX:** Only add `args` if both deployArgs AND constructorInputs exist.
    // This prevents sending `args` for contracts with no constructor.
    if (deployArgs.length > 0 && constructorInputs.length > 0) {
      console.log(`📡 Deploying with ${deployArgs.length} constructor arguments...`);
      deployOptions.args = deployArgs;
    } else if (deployArgs.length > 0 && constructorInputs.length === 0) {
      console.warn("⚠️ DEPLOY_ARGS were provided but ABI has no constructor inputs. Ignoring args.");
    }

    const txHash = (await deployContract(client, deployOptions)) as `0x${string}`;

    console.log("📡 txHash:", txHash);
    console.log("📡 Waiting for confirmation...");
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    console.log(`✅ Deployed at: ${receipt.contractAddress}`);
  } catch (err: any) {
    console.error("❌ Deployment failed:", err);
    try {
      console.error("❌ Error details:", JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
    } catch { }
    process.exitCode = 1;
  }
})();









