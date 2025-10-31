import { config as dotenvConfig } from "dotenv";
import "@nomicfoundation/hardhat-toolbox-viem";

dotenvConfig();

const { SEPOLIA_RPC_URL, PRIVATE_KEY } = process.env;

export default {
  solidity: {
    compilers: [
      {
        version: "0.8.24",
      },
      {
        version: "0.8.28",
      },
    ],
  },
  networks: {
    sepolia: {
      type: "http", 
      url: SEPOLIA_RPC_URL || "",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
};



