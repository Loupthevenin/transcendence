import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const PRIVATE_KEY: string = process.env.PRIVATE_KEY as string;

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    fuji: {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      accounts: [PRIVATE_KEY],
    },
  },
};

export default config;
